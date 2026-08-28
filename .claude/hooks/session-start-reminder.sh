#!/usr/bin/env bash
# SessionStart hook: front-loads the dev-workflow skill requirement so the
# assistant invokes it BEFORE the first edit, instead of being caught by
# branch-guard.sh mid-task. The branch guard is the safety net; this is
# the actual instruction.

set -u

jq -n '{
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: (
      "DEV-WORKFLOW REQUIREMENT (cennso-website):\n" +
      "Before ANY tool call that mutates this repo (Edit, Write, MultiEdit, NotebookEdit, " +
      "or Bash commands that change files / git state / installed deps), " +
      "you MUST invoke the `dev-workflow` skill via the Skill tool and follow it.\n\n" +
      "The shared main checkout is read-only for edits — all topic work happens in an " +
      "isolated git worktree (.claude/scripts/worktree.sh new <topic>). The skill covers worktrees, " +
      "branching off main, the `yarn check:all` quality gate, and the PR + CI flow.\n\n" +
      "If the PreToolUse branch guard denies an edit, the correct response is to invoke the " +
      "`dev-workflow` skill FIRST and then follow it end to end. Do not just `git switch -c` in " +
      "the main checkout and retry — that bypasses the workflow and the worktree isolation.\n\n" +
      "MANDATORY READING before implementing (per AGENTS.md, in this precedence order):\n" +
      "  1. .specify/memory/constitution.md — non-negotiable quality standards\n" +
      "  2. specs/ — the relevant feature spec for what you are changing\n" +
      "  3. AGENTS.md — stack, structure, commands, quality gates"
    )
  }
}'
