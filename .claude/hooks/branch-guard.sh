#!/usr/bin/env bash
# PreToolUse guard for this repo's files. Two rules, in order:
#   1. The shared MAIN checkout (the primary worktree) is read-only for edits.
#      Topic work MUST happen in an isolated linked worktree, because the main
#      checkout's HEAD is shared and another concurrent session can switch it
#      out from under you mid-task — a commit then lands on the wrong branch.
#   2. Inside a linked worktree, edits on main/master are still denied.
# So the ONLY place edits are allowed is a linked worktree on a non-main branch.
# Enforces .claude/skills/dev-workflow/SKILL.md ("no changes on main; one
# worktree per topic").

set -u

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // .tool_input.notebook_path // ""')
command_str=$(printf '%s' "$payload" | jq -r '.tool_input.command // ""')

deny() {
  jq -n --arg r "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

# Resolve the primary checkout of THIS repo (the one this hook lives in), or the
# empty string if that can't be determined.
primary_checkout() {
  local hook_dir self_common
  hook_dir=$(cd "$(dirname "$0")" 2>/dev/null && pwd) || return 1
  self_common=$(git -C "$hook_dir" rev-parse --git-common-dir 2>/dev/null) || return 1
  self_common=$(cd "$hook_dir" && cd "$self_common" 2>/dev/null && pwd -P) || return 1
  printf '%s' "${self_common%/.git}"
}

# ---------------------------------------------------------------------------
# Bash branch. The file-edit matchers below cover Edit/Write/MultiEdit, but a
# heredoc, `sed -i`, or `git switch` through Bash mutated the shared main
# checkout completely unguarded — the hole this repo's own setup was written
# through. The policy here is deliberately narrow and FAILS OPEN: it denies only
# unmistakable mutations of the primary checkout, because a false denial is more
# damaging than a miss the file-edit guard would catch anyway.
# ---------------------------------------------------------------------------
if [ -z "$file" ] && [ -n "$command_str" ]; then
  primary=$(primary_checkout) || exit 0
  [ -z "$primary" ] && exit 0

  # Where is this command running? Only the primary checkout is gated; any
  # worktree, or any directory outside this repo, passes untouched.
  cwd=$(printf '%s' "$payload" | jq -r '.cwd // ""')
  [ -z "$cwd" ] && cwd="$PWD"
  cwd=$(cd "$cwd" 2>/dev/null && pwd -P) || exit 0
  [ "$cwd" != "$primary" ] && exit 0

  # A leading `cd <path>` retargets the whole command. Honour it: writing into a
  # worktree from a main-checkout shell (`cd .worktrees/x && echo y > f.tsx`) is
  # legitimate and must not be denied. Only this common shape is understood; more
  # convoluted control flow falls through to the conservative checks below.
  cd_target=$(printf '%s' "$command_str" | sed -nE 's/^[[:space:]]*cd[[:space:]]+"?([^"[:space:];&|]+)"?.*/\1/p' | head -1)
  if [ -n "$cd_target" ]; then
    resolved=$(cd "$cwd" 2>/dev/null && cd "$cd_target" 2>/dev/null && pwd -P) || resolved=""
    [ -n "$resolved" ] && [ "$resolved" != "$primary" ] && exit 0
  fi

  bash_deny() {
    deny "dev-workflow violation: \`$1\` mutates the SHARED main checkout, which is read-only. Bash is not an exemption from the worktree rule — the main checkout's HEAD is shared across sessions and can be switched out from under you mid-task. Create a worktree and run this there instead: .claude/scripts/worktree.sh new <topic>. See .claude/skills/dev-workflow/SKILL.md."
  }

  # A `git -C <path>` prefix retargets the command; if it points anywhere but the
  # primary checkout (a worktree, another repo), the git checks below don't apply.
  git_c_target=$(printf '%s' "$command_str" | sed -nE 's/.*git[[:space:]]+-C[[:space:]]+"?([^"[:space:]]+)"?.*/\1/p' | head -1)
  git_elsewhere=0
  if [ -n "$git_c_target" ]; then
    resolved=$(cd "$git_c_target" 2>/dev/null && pwd -P) || resolved=""
    [ "$resolved" != "$primary" ] && git_elsewhere=1
  fi

  # Git commands that move HEAD, stage, or rewrite history in this checkout.
  # `git worktree …` is deliberately absent: creating a worktree is the sanctioned
  # escape hatch and must keep working. Read-only verbs are never listed.
  if [ "$git_elsewhere" -eq 0 ] && printf '%s' "$command_str" | grep -qE '(^|[;&|]|[[:space:]])git([[:space:]]+-[A-Za-z]+[[:space:]]+[^[:space:]]+)*[[:space:]]+(switch|checkout|add|commit|merge|rebase|reset|restore|stash|apply|cherry-pick|revert|am)([[:space:]]|$)'; then
    bash_deny "$(printf '%s' "$command_str" | grep -oE 'git[[:space:]]+[^;&|]*' | head -1 | cut -c1-60)"
  fi

  # In-place file editors aimed at this checkout.
  if printf '%s' "$command_str" | grep -qE '(^|[;&|]|[[:space:]])(sed[[:space:]]+-i|perl[[:space:]]+-i|truncate|dd[[:space:]]+.*of=)([[:space:]]|$)'; then
    bash_deny "$(printf '%s' "$command_str" | cut -c1-60)"
  fi

  # Shell redirection into a path that belongs to this checkout. Targets outside
  # it (/tmp, /dev/null, absolute paths elsewhere) are left alone, and a bare
  # relative name only counts when its first segment actually exists here — so
  # `cd /tmp && echo x > scratch` does not trip the guard.
  for target in $(printf '%s' "$command_str" | grep -oE '>>?[[:space:]]*"?[^"[:space:];&|]+' | sed -E 's/^>>?[[:space:]]*"?//'); do
    case "$target" in
      /dev/null|/dev/*|/tmp/*|/private/tmp/*|\$*) continue ;;
      /*)
        case "$target" in
          "$primary"/*) bash_deny "redirection into $target" ;;
          *) continue ;;
        esac
        ;;
      *)
        first_segment=${target%%/*}
        [ -e "$primary/$first_segment" ] && bash_deny "redirection into $target"
        ;;
    esac
  done

  exit 0
fi

[ -z "$file" ] && exit 0

# The file may not exist yet (new file). Walk up to its nearest existing ancestor dir.
dir=$(dirname "$file")
while [ ! -d "$dir" ] && [ "$dir" != "/" ] && [ "$dir" != "." ]; do
  dir=$(dirname "$dir")
done
[ -d "$dir" ] || exit 0

# Identify the repo (shared object store) that owns the file, via its git-common-dir.
# All worktrees of one repo share a common-dir, so this is stable across worktrees.
file_common=$(git -C "$dir" rev-parse --git-common-dir 2>/dev/null) || exit 0
[ -z "$file_common" ] && exit 0
file_common=$(cd "$dir" && cd "$file_common" 2>/dev/null && pwd -P) || exit 0

# Same lookup for THIS hook (script lives in <some-worktree>/.claude/hooks/).
hook_dir=$(cd "$(dirname "$0")" 2>/dev/null && pwd) || exit 0
self_common=$(git -C "$hook_dir" rev-parse --git-common-dir 2>/dev/null)
self_common=$(cd "$hook_dir" && cd "$self_common" 2>/dev/null && pwd -P)

# Only gate files belonging to THIS repo (any of its worktrees). Anything else passes.
[ "$file_common" != "$self_common" ] && exit 0

# Is the file in the PRIMARY checkout? Primary worktree: git-dir == git-common-dir.
# Linked worktrees have git-dir = <common>/worktrees/<name>, which differs.
file_gitdir=$(git -C "$dir" rev-parse --absolute-git-dir 2>/dev/null)
file_gitdir=$(cd "$file_gitdir" 2>/dev/null && pwd -P)
if [ -n "$file_gitdir" ] && [ "$file_gitdir" = "$file_common" ]; then
  deny "dev-workflow violation: this file is in the SHARED main checkout, which is read-only for edits. The main checkout's HEAD is shared across sessions and can be switched out from under you mid-task, so commits land on the wrong branch. Do topic work in an isolated worktree instead: .claude/scripts/worktree.sh new <topic>, then open that .worktrees/<topic> folder and work there. See .claude/skills/dev-workflow/SKILL.md."
fi

# Linked worktree: deny on main/master, allow on a topic branch.
branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
case "$branch" in
  main|master)
    deny "dev-workflow violation: the worktree owning this file is on branch \"$branch\". No changes on main — every change goes through a branch + PR. Create a fresh topic worktree: .claude/scripts/worktree.sh new <topic>. See .claude/skills/dev-workflow/SKILL.md."
    ;;
esac

exit 0
