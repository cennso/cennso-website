#!/usr/bin/env bash
# Manage per-topic git worktrees for cennso-website.
#
# One worktree = one checked-out branch in its own directory, all sharing this
# repo's single .git. Run each parallel topic (and each Claude session) in its
# own worktree so concurrent work never switches another session's branch out
# from under it. See .claude/skills/dev-workflow/SKILL.md.
#
#   .claude/scripts/worktree.sh new <branch-name>   create .worktrees/<name> off fresh upstream/main, then yarn install, scripts/.venv, and copy .env.local
#   .claude/scripts/worktree.sh list                list worktrees
#   .claude/scripts/worktree.sh rm <branch-name>    remove the worktree dir (keeps the branch)
set -euo pipefail

# Resolve the MAIN checkout root from the shared git-common-dir, so this works
# whether invoked from the main checkout or from inside another worktree.
common_dir=$(git rev-parse --git-common-dir)
case "$common_dir" in
  /*) ;;
  *) common_dir="$(git rev-parse --show-toplevel)/$common_dir" ;;
esac
main_root=$(cd "$common_dir/.." && pwd)
wt_root="$main_root/.worktrees"

# Resolve the ref new branches are cut from. This repo has TWO remotes: `origin`
# is the fork you push to, `upstream` is cennso/cennso-website — and the fork's
# main can be dozens of commits stale. Branching off `origin/main` would silently
# start topic work from an old tree. Prefer local main's own tracking ref, then
# upstream/main, then origin/main.
base_ref() {
  local ref candidate
  ref=$(git -C "$main_root" rev-parse --abbrev-ref main@{upstream} 2>/dev/null || true)
  if [ -n "$ref" ]; then printf '%s' "$ref"; return 0; fi
  for candidate in upstream/main origin/main; do
    if git -C "$main_root" show-ref --verify --quiet "refs/remotes/$candidate"; then
      printf '%s' "$candidate"; return 0
    fi
  done
  echo "error: cannot resolve a main base ref (tried main@{upstream}, upstream/main, origin/main)." >&2
  exit 1
}

# A branch name may contain slashes (feat/foo); flatten them for the directory.
dir_for() { printf '%s/%s' "$wt_root" "$(printf '%s' "$1" | tr '/' '-')"; }

# The Python validation scripts (yarn seo:*, yarn validate:ogimages) run from
# scripts/.venv, and CI pins Python 3.11. The system `python3` is often older
# (macOS ships 3.9), so pick the first interpreter that satisfies >= 3.11.
pick_python() {
  local candidate
  for candidate in python3.13 python3.12 python3.11 python3; do
    if command -v "$candidate" >/dev/null 2>&1 \
       && "$candidate" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' 2>/dev/null; then
      command -v "$candidate"
      return 0
    fi
  done
  return 1
}

usage() { sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

cmd="${1:-}"
case "$cmd" in
  new)
    name="${2:-}"
    [ -z "$name" ] && { echo "error: branch name required" >&2; usage 1; }
    dir=$(dir_for "$name")
    [ -e "$dir" ] && { echo "error: worktree already exists at $dir" >&2; exit 1; }

    base=$(base_ref)
    remote=${base%%/*}
    echo "Fetching $remote ($base is the branch base)..."
    git -C "$main_root" fetch "$remote" --quiet

    # --no-track is deliberate: without it the new branch tracks $base, which is
    # upstream/main (cennso/cennso-website), and a bare `git push` from the
    # worktree would target the org repo. With no upstream set, a bare push
    # errors out and you must name the remote — always `git push -u origin`.
    echo "Creating worktree $dir on branch '$name' (off $base, no tracking)..."
    git -C "$main_root" worktree add --no-track -b "$name" "$dir" "$base"

    # node_modules is gitignored and per-directory, so each worktree needs its
    # own install — a shared one would pin the wrong lockfile state.
    echo "Installing Node dependencies (yarn install --frozen-lockfile)..."
    ( cd "$dir" && yarn install --frozen-lockfile )

    # Same for the Python venv the SEO/OG validation scripts resolve as
    # scripts/.venv/bin/python (a hard-coded relative path in package.json).
    py=$(pick_python) || {
      echo "error: no Python >= 3.11 found on PATH (the validation scripts require it)." >&2
      echo "       Install one, e.g. 'brew install python@3.12', then re-run." >&2
      exit 1
    }
    echo "Creating scripts/.venv with $py and installing scripts/requirements.txt..."
    (
      cd "$dir"
      "$py" -m venv scripts/.venv
      scripts/.venv/bin/python -m pip install --quiet --upgrade pip
      scripts/.venv/bin/pip install --quiet --no-cache-dir -r scripts/requirements.txt
    )

    # .env*.local is gitignored, so the fresh worktree has no local env. Copy it
    # from the main checkout when present, otherwise `yarn dev`/`yarn build` may
    # be missing keys with no obvious cause.
    for env_file in "$main_root"/.env*.local; do
      [ -e "$env_file" ] || continue
      cp "$env_file" "$dir/"
      echo "Copied $(basename "$env_file") from the main checkout."
    done

    echo ""
    echo "Ready: $dir   [branch $name]"
    echo "Open THIS folder in a new editor window / Claude session and work there."
    echo "Quality gate there: yarn check:all   (then yarn dev + yarn lighthouse)."
    ;;
  list)
    git -C "$main_root" worktree list
    ;;
  rm|remove)
    name="${2:-}"
    [ -z "$name" ] && { echo "error: branch name required" >&2; usage 1; }
    dir=$(dir_for "$name")
    git -C "$main_root" worktree remove "$dir"
    echo "Removed $dir. Branch '$name' still exists (delete with: git -C \"$main_root\" branch -d '$name')."
    ;;
  ""|-h|--help|help)
    usage 0
    ;;
  *)
    echo "error: unknown command '$cmd'" >&2
    usage 1
    ;;
esac
