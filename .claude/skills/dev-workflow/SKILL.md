---
name: dev-workflow
description: Use when starting any change to cennso-website — creating a branch, running the quality checks, or working in parallel across sessions. Covers the worktree-per-topic isolation, the yarn check:all gate, Lighthouse, and the PR flow.
---

# cennso-website Dev Workflow

How every change to this repo gets made: which branch you are on, an isolated
worktree per topic, the `yarn check:all` gate that must pass before the work is
done, and the push/PR flow. Read it before the first edit, not after the guard
denies one.

## Step 0 — know your branch, every single time

Before reading code to answer a question OR before editing, run `git status -sb`
(shows current branch + ahead/behind). The checked-out tree may be a **stale
topic branch**: reporting "the site does X" from it is wrong if `main` already
changed X. If HEAD is behind `upstream/main`, say so up front, and answer "what
does the code do *now*?" against `upstream/main` (`git grep … upstream/main`,
`git show upstream/main:<file>`), never the stale working tree.

## Two remotes — know which is which

- **`upstream`** = `cennso/cennso-website`, the real repo. Local `main` tracks
  `upstream/main`. **Branches are cut from `upstream/main`** and PRs target it.
- **`origin`** = your fork (`derberg/cennso-website`). **You push topic branches
  here**, then open the PR from the fork.

`origin/main` is a stale mirror of the fork and drifts dozens of commits behind
`upstream/main`. Never branch from it and never diff against it — both the
worktree helper and the wrap-up-gate hook resolve the base as
`main@{upstream}` → `upstream/main` → `origin/main`, in that order, for exactly
this reason.

The helper creates topic branches with `--no-track`, so they have **no upstream
at all**. A bare `git push` therefore errors out instead of quietly targeting the
org repo — always name the remote: `git push -u origin feat/<short-name>`.

## Step 1 — read the rules before implementing

Per AGENTS.md the precedence is **Constitution > Specs > AGENTS.md**:

1. `.specify/memory/constitution.md` — non-negotiable quality standards
   (type safety, WCAG 2.1 AA, Lighthouse ≥95%, SEO metadata, UI text in YAML)
2. `specs/` — the feature spec covering what you are changing: functional
   requirements, data models, acceptance criteria
3. `AGENTS.md` — stack, project structure, commands, patterns, quality gates

Then search the codebase for an existing implementation of the same shape and
follow that pattern rather than inventing a second one.

## Parallel topics — one worktree per topic

A single checkout has one `HEAD`, so two sessions sharing one directory fight
over the branch: one runs `git switch`, the other's files change underneath it.
Don't work around this with `git stash` juggling or extra clones. Use a **git
worktree per topic** — each is its own directory with its own checked-out
branch, all backed by this repo's single `.git` (one `fetch`, shared
branches/stash/reflog; git refuses to check out the same branch in two
worktrees, which is the guard you actually want).

Rule: **one worktree : one branch : one session.** Spin one up with the helper
(off fresh `upstream/main`; installs `node_modules`, creates `scripts/.venv`, and
copies `.env*.local` from the main checkout):

```bash
.claude/scripts/worktree.sh new feat/<short-name>   # creates .worktrees/<name>, yarn install, scripts/.venv
.claude/scripts/worktree.sh list
.claude/scripts/worktree.sh rm  feat/<short-name>   # removes the dir; branch stays
```

Then open `.worktrees/<name>` as the workspace for that session and work there.
`.worktrees/` is gitignored, and the branch-guard hook is worktree-aware — it
gates each file by the branch of the worktree that owns it, so topics never
gate or clobber each other.

**A worktree is required, not optional:** the PreToolUse branch-guard hook makes
the shared main checkout read-only for edits (on any branch), so all topic work
happens in a `.worktrees/<topic>` directory. This is deliberate — the main
checkout's HEAD is shared, and a concurrent session can switch it mid-task,
landing your commit on the wrong branch. A worktree pins one branch to one
directory, which git enforces.

Each worktree gets its own `node_modules` and its own `scripts/.venv`. Both are
resolved by relative path (`package.json` calls `scripts/.venv/bin/python`
directly), so the install stays pinned to that worktree — no cross-worktree
contamination. Run every `yarn` command from inside the worktree.

## The one rule

**Never push to `main`. Always work on a branch, open a PR, let CI pass, then
merge.**

## The flow

```
.claude/scripts/worktree.sh new feat/<short-name>   # 1. fresh worktree off upstream/main (main checkout is read-only)
# open .worktrees/feat-<short-name> and work THERE
# ... make changes ...
yarn check:all                               # 2. MUST pass before pushing
# before pushing: run /simplify (or /code-review) on the diff to catch
#   duplication and reuse misses while they are still cheap to fix
git push -u origin feat/<short-name>         # 3. push to the FORK (needs fresh explicit user approval)
# 4. open a PR against cennso/cennso-website -> Verify Cennso Website + Lighthouse
#    + link-check + a11y-scan run on the PR
# 5. review, then merge the PR to upstream main
```

## The quality gate

- **`yarn check:all` is mandatory before declaring work done** — it runs
  `build`, `format`, `lint`, `a11y`, `perf`, `seo`, `validate:ogimages`. If any
  check fails: fix the code, re-run, repeat until clean. Never declare the work
  complete on the assumption it would pass.
- **Never weaken, skip, or loosen a check script to make a failure go away.**
  The check scripts under `scripts/` are the spec for the constitution's
  standards. If a check looks wrong, report it and ask before touching it — same
  rule as tests.
- **Lighthouse ≥95% on all four categories** (Performance, Accessibility, Best
  Practices, SEO). Verify anything that could affect rendering weight, images,
  bundle size, or metadata: `yarn dev` in one terminal, `yarn lighthouse` in
  another. If you did not run it, say so explicitly rather than implying it passed.
- `yarn test` is currently a no-op (`echo 'No tests.'`) — passing it proves
  nothing. `yarn check:all` is the real gate. If tests are ever added, the rule
  becomes: **never modify, add, or remove a test without explicit user
  confirmation.**
- Python validation scripts need `scripts/.venv` (`pip install -r
  scripts/requirements.txt`). The worktree helper sets this up; CI does it too.
- **`.eslintrc.json` must keep `"root": true`.** Worktrees live under
  `.worktrees/` *inside* the repo, so without it ESLint walks up into the main
  checkout's config and `yarn lint` dies with `Plugin "@next/next" was conflicted
  between …`. Deleting that key breaks linting in every worktree.

## Commit rules

- **NEVER include `Co-Authored-By: Claude` or any AI co-author attribution.** No
  exceptions, all commits.
- Concise messages: `type: short description` (e.g. `feat: add pricing page`,
  `fix: add sizes prop to blog card images`).
- Types: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor`.

## GitHub Actions

- **Editing anything under `.github/workflows/` requires the
  `github-actions-supply-chain-pinning` skill** — invoke it first. It carries the
  SHA-pinning and tool-version rules, how to resolve a SHA correctly with `gh`,
  and an audit of this repo's current (largely unpinned) state. Don't restate its
  rules from memory; the skill is the source of truth.
- CI installs `yarn install --frozen-lockfile` + `scripts/requirements.txt`, then
  runs `build`, and fans out `format`, `lint`, `a11y`, `perf`, `seo`,
  `validate:ogimages` as a matrix. Lighthouse runs against the Vercel preview and
  blocks the merge below 95%.

## Red flags — stop

- About to describe "what the site does" without checking the branch → STOP. Run
  `git status -sb` first; if HEAD is behind `upstream/main`, reason about
  `upstream/main`, not the stale working tree.
- About to edit in the shared main checkout, or `git switch -c` there instead of
  making a worktree → STOP. A concurrent session can switch the main checkout's
  HEAD out from under you, so your commit lands on another session's branch. Use
  `.claude/scripts/worktree.sh new feat/<short-name>` and work in that worktree.
  Before opening the PR, verify isolation: `git log --oneline upstream/main..HEAD`
  must show **only your own commits**.
- About to `git push` to `main`, or to `upstream` at all → branch, and push to
  `origin` (the fork) instead.
- About to push without fresh explicit approval → STOP and ask.
- About to say "done" / "complete" without having run `yarn check:all` → STOP and
  run it. AGENTS.md forbids declaring work done unvalidated.
- About to change a check script (or its thresholds) to make a failure go away →
  STOP, report it, ask first.
- About to hardcode UI text in a component → STOP. All user-facing text lives in
  the YAML files under `content/`.
- About to add an `<Image>` without a `sizes` prop, or a non-WebP / >100KB image →
  STOP. `yarn perf:images` and `yarn perf:mobile` will fail, and so will Lighthouse.
