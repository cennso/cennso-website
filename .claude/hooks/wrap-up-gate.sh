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

set -u

# Read the Stop-hook payload on stdin. If we're already in a continuation
# triggered by a previous block, allow the stop (loop guard).
input=$(cat 2>/dev/null || true)
stop_active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null || echo false)
[ "$stop_active" = "true" ] && exit 0

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

Then report the result in ONE sentence — no heading, no bullet list: name what you updated and state the rest are unaffected, and ALWAYS include an explicit automation verdict (a skill/hook/workflow was updated, or all unaffected) so it is never silently dropped (e.g. \`Checks: yarn check:all passed; docs: AGENTS.md updated; automation: dev-workflow skill updated; others unaffected.\`). The analysis must be real; only the written summary is compressed to that one sentence. You may finish once you have emitted it."

# Stop hooks use {decision:"block", reason} to keep the assistant going; the
# reason is fed back as context. systemMessage surfaces the gate to the user.
jq -n --arg r "$reason" '{ decision: "block", reason: $r, systemMessage: "Wrap-up gate: reviewing quality checks, docs, and .claude/.github automation before finishing." }'
