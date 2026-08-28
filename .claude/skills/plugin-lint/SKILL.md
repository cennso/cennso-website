---
name: plugin-lint
description: Invoke automatically after editing any file under `.claude/skills/`. Also invoke when the user asks to lint, refine, validate, or check a skill file. Checks skill files against rules for how they are consumed — read end-to-end by the agent, included whole when one workflow references another. Covers antipatterns to avoid and positive conventions to follow.
---

# Skill Lint

Checks this repo's skill files against the rules for writing them. The rules come from how these files are actually consumed — read end-to-end by the agent and included whole when one workflow references another — not from generic markdown style. Some rules flag antipatterns (things that shouldn't be there); others flag missing conventions (things that should be). New rules are added as they're discovered; the four below are the current set, not the final set.

## Scope

By default, lint every file under:

- `.claude/skills/**/*.md`

If the user names a specific file, lint only that file.

## Process

1. **Resolve targets** from the scope above (or the user-supplied path).
2. **Run each rule under `## Rules`** against every target. Each rule states what it checks, where it applies, and the rationale.
3. **Report findings** grouped by rule. One line per finding. For antipattern rules: `file:line — offending text — proposed fix`. For positive rules (missing-convention findings): `file — missing X — proposed fix`. State the rule once at the top of each group, not per hit. If a rule finds nothing, say so.
4. **Ask which findings to apply.** Present the report, then wait for the user to pick. See the "Never edit without confirmation" critical rule below for the constraints.

## Rules

### Rule 1 — No external links

**Applies to:** all targets in scope.

**Check:** grep each target for `https?://`. Skip lines inside fenced code blocks (delimited by ``` or ~~~) — those document real endpoints or commands, not navigation. Flag every remaining match.

**Why:** skill files are instructions the agent reads end-to-end before acting. An external URL in prose is dead weight — the agent can't follow it without stopping to fetch, the link may rot or drift from the surrounding instructions, and anything important enough to read belongs inline. Skill files should be self-contained.

**Proposed fix (ask first):** surface each match with surrounding context. Let the user decide whether to inline the information, drop the link, or keep it. Never strip a URL without confirmation.

### Rule 2 — No section anchors into shared content

**Applies to:** all targets in scope.

**Convention:** reusable content (text included from more than one workflow) lives in a `shared/` subdirectory next to the workflows that use it. Each file in `shared/` covers one concept; the filename describes that concept (e.g. `shared/template-type-map.md`, `shared/critical-rules.md`). Rule 2 keys on the `shared/` path prefix — content reused under any other location or naming pattern is invisible to this lint, so the subdirectory is the contract.

**Check:**

- Grep for markdown links matching the regex `\]\([^)]*shared/[^)]*\.md#[^)]*\)`. Each match is a violation.
- For each file under a `shared/` directory in scope, count `^## ` headings. More than one means the file bundles multiple concepts and should be split.

**Why:** when a workflow says "follow [shared/critical-rules.md#offer-to-fix]", the consumer reads the whole `shared/critical-rules.md` file — the anchor is invisible to it. Shared content must live in small, meaningfully named files (one concept per file) so the filename itself describes what's being included.

**Proposed fix (ask first):**

- Strip the `#anchor` from each shared-content link.
- Split a `shared/` file with multiple `##` sections into per-section files (e.g. `## Offer to fix` → `shared/offer-to-fix.md`), and rewrite every linking site to the new filename.

Both fixes touch multiple files and must be confirmed before any edit. When the user agrees to a split, present the proposed filename list first and wait for sign-off before creating files or rewriting links — splitting and link rewriting still happen in a single batch so the two don't drift apart, but only after explicit approval.

### Rule 3 — Intro line between H1 and first `##` heading

**Applies to:** all targets in scope.

**Check:** for each target, find the first `## ` heading. Confirm there is at least one non-empty line of prose between the H1 (or end of frontmatter) and that first `## `. Targets where the first `## ` immediately follows the H1 with only blank lines between are findings.

**Why:** the agent reads these files top-down. A one-sentence intro between the H1 and the first section gives the agent its framing — what this file is, when it applies — before it descends into Process or Rules. The frontmatter description is for triggering; the intro line is for the agent once it has already loaded the file. Without it, the agent enters procedural detail with no context.

**Proposed fix (ask first):** surface the H1 and the first `## ` heading. Let the user write a one-sentence intro between them that says what the file does or when it applies.

### Rule 4 — Critical Rules as bold paragraphs, not bullets

**Applies to:** all targets that contain a `## Critical [Rr]ules` section.

**Check:** for each `## Critical [Rr]ules` heading, scan lines until the next `## ` heading. Flag any line matching `^[-*] ` (top-level bullets). Indented bullets (lines starting with whitespace + `-`/`*`) are not flagged — those may legitimately appear inside a bold-paragraph rule as sub-points.

**Why:** bullets in Critical Rules read as a scannable menu of options the agent can skim. Bold-paragraph form (`**Rule name.** Rationale.`) reads as binding constraints. These files are instructions to the agent; format signals how binding the content is. Critical Rules are binding, so they should look it.

**Proposed fix (ask first):** convert each top-level bullet into a bold paragraph. Lead with a short rule name in bold, then a sentence of rationale. Show each bullet and its proposed rewrite so the user can adjust wording before any edit.

## Adding a new rule

When a new rule emerges (a recurring fix during refinement, a convention the team agrees on), add it under `## Rules` using the same shape: **Applies to / Check / Why / Exceptions (if any) / Proposed fix (ask first)**. Keep the rationale concrete — what breaks if the rule is violated — so future readers can judge edge cases instead of mechanically applying it.

## Critical rules

**Verify before flagging.** Context matters. A URL inside a fenced code block, or a section anchor inside an illustrative example, is not a violation. Look at where the match sits.

**Do not invent rules.** Only run the rules listed under `## Rules`. If you spot something that feels wrong but isn't covered, surface it as a suggestion at the end of the report under "Possible new rule" — don't fold it into a rule's findings.

**Keep the report tight.** One line per finding, rule rationale stated once. Long reports get skimmed; short reports get acted on.

**Never edit without confirmation.** The report is the deliverable. Fixes only happen after the user picks which ones to apply — no exceptions, even for fixes the rule labels straightforward.
