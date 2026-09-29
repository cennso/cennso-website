#!/usr/bin/env bash
# Stop hook: ask for a design-fidelity review against the LIVE Figma file.
#
# It fires when this branch changed something that can move what a page looks like
# (pages/, components/, styles/, public/assets/, tailwind.config.js) AND at least one
# of the Figma frames in design/figma/frames.json covers what changed.
#
# Why a hook and not CI: CI has no Figma access. The only way to check fidelity there
# was against a committed copy of the design, and a committed copy goes stale silently
# — the designer edits Figma, CI keeps comparing the site to last month's frames, and
# the build stays green while the site drifts. That is the failure this exists to catch,
# so it must not be built on the thing that causes it.
#
# A hook is a shell script and cannot call MCP tools. So, exactly like the wrap-up gate,
# it emits the review to perform and does not attempt the review itself. The agent has
# the Figma MCP tool; the deterministic part lives in scripts/review-design-fidelity.mjs.
#
# - Allows the stop silently when nothing design-relevant changed, or when nothing that
#   changed maps to a frame.
# - Reads stop_hook_active to avoid an infinite stop loop.
# - Fires ONCE PER SESSION, via a latch keyed on session_id under TMPDIR. Do not nag.

set -u

input=$(cat 2>/dev/null || true)
stop_active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)
[ "$stop_active" = "true" ] && exit 0

# Fire at most once per session. Fails open: if the latch cannot be taken we simply
# behave as if there were none.
latch=""
session_id=$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null || true)
if [ -n "$session_id" ]; then
  # Qualify by uid and create 0700, because the ${TMPDIR:-/tmp} fallback is
  # world-writable on Linux. Refuse it unless it is a real directory, not a
  # symlink, and owned by us.
  latch_dir="${TMPDIR:-/tmp}/cennso-design-review-gate-$(id -u 2>/dev/null || echo 0)"
  mkdir -m 700 -p "$latch_dir" 2>/dev/null
  latch_owner=$(stat -f '%u' "$latch_dir" 2>/dev/null || stat -c '%u' "$latch_dir" 2>/dev/null || true)
  if [ -d "$latch_dir" ] && [ ! -L "$latch_dir" ] && [ "$latch_owner" = "$(id -u 2>/dev/null)" ]; then
    latch="$latch_dir/$(printf '%s' "$session_id" | tr -c 'A-Za-z0-9_.-' '_')"
    [ -e "$latch" ] && exit 0
  fi
fi

project=$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)
[ -z "$project" ] && exit 0
map="$project/design/figma/frames.json"
[ -f "$map" ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

# Skip on the main checkout's main branch, for the same reason as the wrap-up gate:
# right after a merge the base ref is stale and the just-merged work shows up as a diff.
branch=$(git -C "$project" symbolic-ref --short -q HEAD 2>/dev/null || true)
[ "$branch" = "main" ] && exit 0

# Resolve the base. `origin` is the fork and can be dozens of commits stale, so prefer
# local main's own tracking ref, then upstream/main, then origin/main.
base=""
for candidate in \
  "$(git -C "$project" rev-parse --abbrev-ref main@{upstream} 2>/dev/null || true)" \
  upstream/main \
  origin/main
do
  [ -z "$candidate" ] && continue
  if git -C "$project" show-ref --verify --quiet "refs/remotes/$candidate"; then
    base="$candidate"; break
  fi
done
[ -z "$base" ] && exit 0

changed=$(
  {
    git -C "$project" diff --name-only "$base...HEAD" 2>/dev/null || true
    git -C "$project" status --porcelain 2>/dev/null | awk '{print $NF}'
  } | sort -u
)

# What can move what a page looks like.
DESIGN='^(pages/|components/|styles/|public/assets/|tailwind\.config\.js$)'
design_changed=$(printf '%s\n' "$changed" | grep -E "$DESIGN" || true)
[ -z "$design_changed" ] && exit 0

# Which frames that reaches. A change under components/, styles/, public/assets/ or
# tailwind.config.js is shared across every route, so it reaches all of them. A change
# under pages/ reaches only the frames whose `page` it is — and a page no frame covers
# reaches nothing, which is a silent exit rather than a review of nothing.
#
# The mapping ALSO declares shared implementation paths, and two of them live under
# pages/ (_app.tsx, _document.tsx). Matched by the pattern below they are shared; missed
# by it they fall through to the per-page branch, where no frame claims them as its
# `page` — so a branch that touched only pages/_app.tsx asked for no review at all. Union
# the mapping's paths in, so it can only widen the shared set and the two cannot diverge.
shared_extra=$(
  jq -r '(.sharedImplementation.paths // [])[]' "$map" 2>/dev/null \
    | sed -e 's/[^A-Za-z0-9_/-]/\\&/g' \
    | awk 'length { if (substr($0, length($0)) == "/") printf "|^%s", $0; else printf "|^%s$", $0 }'
)
shared=$(
  printf '%s\n' "$design_changed" \
    | grep -E "^(components/|styles/|public/assets/|tailwind\.config\.js\$)${shared_extra}" || true
)
if [ -n "$shared" ]; then
  frames=$(jq -r '.frames[].id' "$map" | paste -sd, -)
  scope="a shared surface changed, so every frame is in scope"
else
  frames=$(
    printf '%s\n' "$design_changed" \
      | jq -r -R -s --slurpfile m "$map" '
          split("\n") | map(select(length > 0)) as $files
          | $m[0].frames
          | map(select(.page as $p | $files | index($p)))
          | map(.id) | join(",")
        '
  )
  scope="only the pages that changed are in scope"
fi
if [ -z "$frames" ] || [ "$frames" = "null" ]; then exit 0; fi

file_key=$(jq -r '.figma.fileKey' "$map")
frame_table=$(
  jq -r --arg ids "$frames" '
    ($ids | split(",")) as $want
    | .frames[] | select(.id as $i | $want | index($i))
    | "  \(.id)  ->  node \(.figmaNode)   \(.route)   [\(.theme)]"
  ' "$map"
)
changed_list=$(printf '%s\n' "$design_changed" | head -20)

reason="DESIGN-FIDELITY REVIEW — this branch changed what a page looks like, and Cennso Design 4.0 (Figma file ${file_key}) is ground truth for the routes below. Do this review before finishing. It fires once per session.

Design-relevant files changed on this branch:
${changed_list}

Frames in scope (${scope}):
${frame_table}

The design is NOT in this repository, deliberately. A committed copy goes stale the moment the designer edits Figma, and a comparison against last month's design stays green while the site drifts. You have the Figma MCP tool; fetch the frames now.

1. RUN \`yarn design:review:where\`. It prints the Figma file key, the scratch directory to write into, the exact file name per frame, and the symbols that must come back expanded.

2. For EACH frame above, call \`get_design_context\` ONCE, on that frame's node id. One call returns the whole frame with its symbols expanded, and that expansion is the enumeration source — it is what makes the nav's typography, the logo colour and the CTA readable values instead of a picture of a navigation. Write the returned code block UNMODIFIED (including the \`const img… = \"https://…\"\` constants) to the file name step 1 gave you, in the directory step 1 gave you. NEVER commit these dumps, and never move them into the repo. The review refuses a dump older than an hour, so fetch them as part of this review, not from an earlier session.

3. Build and diff:
     yarn build
     yarn design:review --frames=${frames}
   The script starts the production server, opens each route in its theme at 1360px, and does the matching itself. Do not eyeball the comparison; do not hand-write a verdict the script did not produce.

4. REPORT THE COUNTS the script prints: design nodes, matched, mismatched, unreached — per frame and in total. \"It matches Figma\" with no counts behind it is not an acceptable answer. An unreached design node means nobody is checking it, which is the state every defect this was built for shipped in. Findings the script reports are yours to fix or to explain; a node you genuinely cannot compare goes in design/figma/exclusions.json with a written reason, never dropped quietly.

The four process rules this harness was paid for, still true and still yours to follow while fixing anything it finds:
- EXPAND EVERY SYMBOL before you believe a frame. A symbol in a screenshot is a picture of a navigation; its typography, logo colour and CTA are not in the image as values.
- READ NODE VALUES WITH \`get_design_context\`, never by sampling a screenshot. A colour cited without a node id behind it is a pixel, not a design value.
- A COMPOSITED COLOUR IS NOT A FILL. Opacity, blur and blend over a dark background produced hues that matched no token; the raw fills matched glow-blue, glow-cyan and glow-teal exactly. \"No token matches this colour\" is a claim to check against the node's own fill.
- NEVER SHIP ONE THEME'S ARTWORK INTO THE OTHER. The design draws the hero, the logo and the nav CTA separately per theme. One file used for both is a defect even when it looks fine in the theme it was drawn for.

/contact carries a live Mailjet form. The review only reads computed style: never type into that form and never submit it.

If the review is clean, say so WITH THE COUNTS, in one or two sentences. If it is not, say what differs and whether you fixed it."

# Acquire the latch atomically, and only at the point where we have decided to emit.
# A session that exits early because nothing had changed yet must still be gated once
# it does change.
if [ -n "$latch" ]; then
  mkdir "$latch" 2>/dev/null || exit 0
fi

jq -n --arg r "$reason" '{ decision: "block", reason: $r }'
