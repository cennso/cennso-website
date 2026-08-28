# CLAUDE.md

Pointer file. The rules live elsewhere — read them there, don't rely on this file
to restate them.

## Read before implementing (precedence order)

1. **`.specify/memory/constitution.md`** — non-negotiable quality standards:
   type safety, WCAG 2.1 AA accessibility, Lighthouse ≥95%, SEO metadata, bundle
   limits. Defines _what quality means_.
2. **`specs/`** — the feature spec covering what you are changing: functional
   requirements, data models, acceptance criteria. Defines _what to build_.
3. **`AGENTS.md`** — stack, project structure, commands, patterns, quality gates.
   Defines _how to build it_.

Constitution > Specs > AGENTS.md. When they conflict, the higher one wins.

## Dev workflow

Invoke the **`dev-workflow`** skill (`.claude/skills/dev-workflow/SKILL.md`)
before any change to this repo. In short:

- The shared main checkout is **read-only for edits** — a PreToolUse hook enforces
  it. All topic work happens in an isolated worktree:
  `.claude/scripts/worktree.sh new feat/<short-name>`, then work in
  `.worktrees/feat-<short-name>`.
- Never push to `main`. Branch → PR → CI green → merge.
- **`yarn check:all` must pass** before the work is done, and Lighthouse
  (`yarn dev` + `yarn lighthouse`) must stay ≥95% on all four categories.
- No `Co-Authored-By: Claude` in commits.

## Harness files

- `.claude/settings.json` — hook wiring
- `.claude/hooks/` — session-start reminder, branch guard, wrap-up gate
- `.claude/scripts/worktree.sh` — per-topic worktree helper
- `.claude/skills/` — `dev-workflow`, `github-actions-supply-chain-pinning`
