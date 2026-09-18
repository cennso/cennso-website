#!/usr/bin/env bash
# Stop hook: a wrap-up gate for quality checks, docs, and .claude automation.
#
# It BLOCKS the stop once, forcing a deliberate review before finishing, when
# this branch changed either:
#   - site code (components/, pages/, lib/, contexts/, scripts/, styles/, build
#     config) — where `yarn check:all` is mandatory and docs commonly drift, OR
#   - content/ or specs/ — which the constitution and the feature specs govern, OR
#   - documentation (AGENTS.md, README.md, CLAUDE.md, docs/), OR
#   - automation: .github/ (workflows) or .claude/ (skills, hooks, settings).
#
# The review always asks for an explicit verdict on .claude (skills/hooks/CLAUDE.md)
# and CI, on TWO grounds: a diff made one wrong, OR this SESSION revealed one is
# wrong / missing a case / worth clarifying even with no file change. A session
# learning is reason enough to update a skill, a hook, or AGENTS.md — so a pure
# automation/learning session no longer slips through silently.
#
# - Allows the stop silently only when nothing relevant changed.
# - Reads stop_hook_active to avoid an infinite stop loop: once we've blocked once
#   in a stop-continuation chain, the next stop passes (the gate costs one pass).
# - Fires ONCE PER SESSION, via a latch keyed on session_id under TMPDIR.
#   stop_hook_active alone is not enough: it guards a single stop-continuation
#   chain and resets on the next user turn, so on a branch with committed work the
#   gate re-fired on EVERY turn for the rest of the session, charging a full review
#   for turns that changed nothing. The latch fails open — no session_id, or an
#   unwritable TMPDIR, and the gate behaves exactly as before.
# - The review REPORTS ONLY WHEN THERE IS SOMETHING TO SAY. A clean review ends in
#   silence. Announcing that everything is fine trains the reader to skim the one
#   time it is not.

set -u

# Read the Stop-hook payload on stdin. If we're already in a continuation
# triggered by a previous block, allow the stop (loop guard).
input=$(cat 2>/dev/null || true)
stop_active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)
[ "$stop_active" = "true" ] && exit 0

# Fire at most once per session. Fails open: if anything here does not work we
# simply do not latch, and the gate keeps its old every-turn behaviour.
latch=""
session_id=$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null || true)
if [ -n "$session_id" ]; then
  # Qualify by uid and create 0700, because the ${TMPDIR:-/tmp} fallback is
  # world-writable on Linux: without this another user can pre-create the
  # directory and either pre-place a latch (suppressing the gate) or leave it
  # writable. Then refuse it unless it is a real directory, not a symlink, and
  # owned by us — a hostile symlink here would otherwise redirect the latch.
  latch_dir="${TMPDIR:-/tmp}/cennso-wrap-up-gate-$(id -u 2>/dev/null || echo 0)"
  mkdir -m 700 -p "$latch_dir" 2>/dev/null
  latch_owner=$(stat -f '%u' "$latch_dir" 2>/dev/null || stat -c '%u' "$latch_dir" 2>/dev/null || true)
  if [ -d "$latch_dir" ] && [ ! -L "$latch_dir" ] && [ "$latch_owner" = "$(id -u 2>/dev/null)" ]; then
    latch="$latch_dir/$(printf '%s' "$session_id" | tr -c 'A-Za-z0-9_.-' '_')"
    # Cheap short-circuit. The binding acquisition is the atomic mkdir at the
    # emit site; this only avoids doing the diff work when we already know.
    [ -e "$latch" ] && exit 0
  fi
fi

project=$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)
[ -z "$project" ] && exit 0

# Skip on the main checkout's main branch. Real topic work always happens in a
# per-topic worktree on a feature branch (branch-guard makes main read-only for
# edits), so the gate only has meaning off main. Crucially, the diff base below
# is a remote-tracking ref that only moves on `git fetch`. Right
# after a PR merges, sitting on main with a stale base ref makes the just-
# merged commit show up in `<base>...HEAD`, re-firing the whole review for
# work that's already merged and done. Skipping on main removes that false alarm.
branch=$(git -C "$project" symbolic-ref --short -q HEAD 2>/dev/null || true)
[ "$branch" = "main" ] && exit 0

# Site code + build config. Changing these REQUIRES `yarn check:all` and often
# drifts the docs that describe commands, patterns, or bundle/perf numbers.
# Site code, build config, and the tooling config that decides whether the checks
# themselves pass (a broken .eslintrc.json fails `yarn lint` as surely as bad code,
# and a lockfile change can move any of it).
CODE='^(components/|pages/|lib/|contexts/|scripts/|styles/|next\.config\.js|tailwind\.config\.js|postcss\.config\.js|siteMetadata\.js|next-sitemap\.config\.js|package\.json|yarn\.lock|package-lock\.json|tsconfig\.json|\.eslintrc\.json|\.prettierrc\.json|\.prettierignore|\.lighthouserc(\.ci)?\.js|lighthouse\..*\.js|lychee\.toml)'
# Content and specs — governed by the constitution and the feature specs.
CONTENT_SPEC='^(content/|specs/|\.specify/memory/)'
# Documentation surfaces for this repo.
DOCS='^(AGENTS\.md|README\.md|CLAUDE\.md|docs/)'
# Automation paths: CI + the harness's own skills/hooks/settings.
AUTOMATION='^(\.github/|\.claude/)'
# Doc/automation paths already touched — surfaced as "already updated" context.
TOUCHED='^(AGENTS\.md|README\.md|CLAUDE\.md|docs/|specs/|\.specify/memory/|\.github/|\.claude/)'

# Resolve the base this branch is measured against. This repo has TWO remotes:
# `origin` is the fork, `upstream` is cennso/cennso-website, and the fork's main
# can be dozens of commits stale. Diffing against a stale base floods this gate
# with someone else's merged work. Prefer local main's own tracking ref, then
# upstream/main, then origin/main. Bail quietly if none resolve — better no gate
# than a gate reviewing 100+ unrelated files.
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

# Files in this branch's diff vs the base + anything uncommitted.
changed=$(
  {
    git -C "$project" diff --name-only "$base...HEAD" 2>/dev/null || true
    git -C "$project" status --porcelain 2>/dev/null | awk '{print $NF}'
  } | sort -u
)

code_changed=$(printf '%s\n' "$changed" | grep -E "$CODE" | head -20)
content_changed=$(printf '%s\n' "$changed" | grep -E "$CONTENT_SPEC" | head -20)
docs_changed=$(printf '%s\n' "$changed" | grep -E "$DOCS" | head -20)
automation_changed=$(printf '%s\n' "$changed" | grep -E "$AUTOMATION" | head -20)
touched=$(printf '%s\n' "$changed" | grep -E "$TOUCHED")
[ -z "$touched" ] && touched="(none yet)"

# Nothing relevant changed -> nothing to gate.
[ -z "$code_changed" ] && [ -z "$content_changed" ] && [ -z "$docs_changed" ] && [ -z "$automation_changed" ] && exit 0

# --- assemble the review prompt -------------------------------------------------
reason="WRAP-UP GATE — do a deliberate review before finishing. This gate fires once; spend it on real analysis, not a glance. Do NOT treat \"I already touched a file\" as done.

Doc/spec/automation files changed on this branch (already updated; may be incomplete):
${touched}
"

if [ -n "$code_changed" ]; then
  reason="${reason}
SITE CODE changed — the \`yarn check:all\` quality gate is MANDATORY (AGENTS.md), not optional:
${code_changed}

1. Did you actually RUN \`yarn check:all\` (build, format, lint, a11y, perf, seo, validate:ogimages) and see it pass? If not, run it now and fix every failure — re-run until clean. Never declare the work done on the assumption it would pass.
2. If the change could affect rendering weight, images, bundle size, or metadata, say whether Lighthouse still needs verifying (\`yarn dev\` + \`yarn lighthouse\`, >=95% on all four categories) and either run it or state explicitly that it is unverified.
3. Never weaken, skip, or loosen a check script to make a failure go away — fix the code instead.

DOCUMENTATION drift review for the same diff:
For EACH changed file, name every doc surface that describes its behaviour, commands, config keys, or patterns. Hunt for drift: renamed/removed/added yarn scripts, changed component patterns, new validation rules, changed bundle/perf numbers, now-wrong examples. Open each candidate doc and compare it against the actual diff — do not infer from memory. Update every doc that drifted, and check whether README.md or a docs/ index should now list something the change adds or renames.

Candidate doc homes:
- AGENTS.md — stack, structure, commands, patterns, quality gates, bundle numbers
- README.md — setup + top-level orientation
- docs/ — content creation guides
- specs/ — the feature spec governing what you changed
"
fi

if [ -n "$content_changed" ]; then
  reason="${reason}
CONTENT or SPECS changed — the constitutional hierarchy applies (Constitution > Specs > AGENTS.md):
${content_changed}

1. Read .specify/memory/constitution.md and confirm the change complies with the principles it binds (type safety, accessibility, performance, SEO metadata lengths, UI text living in /content YAML rather than hardcoded in components).
2. Open the relevant spec under specs/ and confirm the change matches its functional requirements, data model, and acceptance criteria. If behaviour intentionally diverges, update the spec — do not leave it contradicting the code.
3. State explicitly in your final verdict whether the constitution and the relevant spec were checked.
"
fi

reason="${reason}
AUTOMATION + LEARNING review (ALWAYS do this, even if no code changed):
Did the diff above, OR anything you learned THIS session (a recurring failure, a guard gap, a confusing or missing step), make any of these wrong, incomplete, or worth clarifying? A session learning is reason enough to update one now:
- .claude/skills/ — workflow/process skills (e.g. dev-workflow, github-actions-supply-chain-pinning)
- .claude/hooks/ + .claude/settings.json — session guards and automation
- .github/workflows/ — CI/CD and supply-chain pinning
- AGENTS.md / CLAUDE.md — rules + pointers

Do the analysis in full. Then decide whether it is worth saying anything at all.

SPEAK ONLY IF THERE IS SOMETHING TO ACT ON. That means exactly one of:
- you changed something as a result of this review (name the file and what changed), or
- something is wrong or unverified and the user needs to know (name it, and say plainly whether you fixed it, could not fix it, or chose not to).

Say it in one or two short sentences, in your own words, as part of your normal reply.

OTHERWISE, FINISH SILENTLY. Write nothing about this gate. Do not report that checks passed, do not list what is unaffected, do not confirm which files you examined, do not state that nothing changed, and do not mention the gate, the review, or these categories at all. A clean review produces NO text. Silence is what 'clean' looks like — and it is what makes the noisy case legible.

A checklist read out loud is not a review. The analysis is mandatory; the announcement is not."

# Acquire the latch atomically, and only now — at the one point where we have
# decided to emit. `mkdir` either creates or fails; it is not check-then-act, so
# two overlapping Stop hooks cannot both get through. It also never follows a
# symlink for the final component, unlike the `: > "$latch"` this replaces.
# Acquiring here rather than at the top is deliberate: a session that exits early
# because nothing had changed yet must still be gated once it does change.
if [ -n "$latch" ]; then
  mkdir "$latch" 2>/dev/null || exit 0
fi

# Stop hooks use {decision:"block", reason} to keep the assistant going; the
# reason is fed back as context. No systemMessage: the gate announcing itself is
# the same noise the reason block now forbids, and a clean review should leave no
# trace at all. When there IS something to report, the assistant says so in its
# own reply, which is where the user is already reading.

jq -n --arg r "$reason" '{ decision: "block", reason: $r }'
