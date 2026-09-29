/**
 * Where a freshly fetched Figma frame lands, and the two rules about it.
 *
 * The design is NOT checked in. It is fetched with `get_design_context` at review time
 * and written to a scratch directory, because a committed copy goes stale silently: the
 * designer edits Figma, the comparison keeps measuring the site against last month's
 * design, and it stays green while the site drifts. That is the failure this harness
 * exists to catch, so the harness must not reintroduce it.
 *
 * Two rules follow, and both are enforced here rather than written down and hoped for:
 *
 *   1. A dump may not live anywhere git would track it. Outside the working tree is
 *      fine; inside it, only if git already ignores the path.
 *   2. A dump older than an hour is refused. "Fetched live" has to mean this review,
 *      not a dump left over from a session last week — which is the committed-copy
 *      problem again, wearing a temp directory.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { FidelityError } from './errors.mjs'

/** How old a dump may be before it stops counting as "fetched for this review". */
export const MAX_DUMP_AGE_MS = 60 * 60 * 1000

export function defaultDumpDir() {
  return path.join(tmpdir(), 'cennso-design-review')
}

export function dumpFileName(frameId) {
  return `${frameId}.jsx.txt`
}

/**
 * Proves the dump directory is somewhere the design cannot be committed from.
 * Outside the repository is unconditionally fine. Inside it, git must already
 * ignore the path — an unignored path inside the repo is a hard failure, not a
 * warning, because the next `git add -A` is all it takes to commit the design.
 */
export function assertDumpDirIsNotCommittable(dumpDir, repoRoot) {
  const dir = path.resolve(dumpDir)
  const root = path.resolve(repoRoot)
  const inside = dir === root || dir.startsWith(`${root}${path.sep}`)
  if (!inside) return dir

  const rel = path.relative(root, dir) || '.'
  const probe = spawnSync('git', ['check-ignore', '-q', '--', rel], {
    cwd: root,
  })
  // 0 = ignored, 1 = not ignored, anything else = git could not answer.
  if (probe.status === 0) return dir
  throw new FidelityError(
    `the Figma dumps would be written to ${rel}, inside the repository, where git does not ignore them.`,
    'The design is fetched live precisely so no copy of it is committed. Write the dumps outside the repo (the default is a directory under TMPDIR), or add the path to .gitignore first.'
  )
}

/**
 * Reads one frame's dump and proves it is fresh. Missing, empty and stale are three
 * different messages because they need three different fixes, and none of them may be
 * reported as "nothing to compare, so everything matched".
 */
export function readDump(
  dumpDir,
  frameId,
  { now = Date.now(), maxAgeMs = MAX_DUMP_AGE_MS } = {}
) {
  const file = path.join(dumpDir, dumpFileName(frameId))
  if (!existsSync(file)) {
    throw new FidelityError(
      `no dump for frame "${frameId}" at ${file}.`,
      `Call get_design_context on this frame's node and write the code block, unmodified, to ${dumpFileName(frameId)} in that directory. One call per frame — it returns the whole frame with its symbols expanded, and that expansion is the enumeration source.`
    )
  }
  const source = readFileSync(file, 'utf8')
  if (!source.trim()) {
    throw new FidelityError(`the dump for frame "${frameId}" is empty.`)
  }
  const ageMs = now - statSync(file).mtimeMs
  if (ageMs > maxAgeMs) {
    throw new FidelityError(
      `the dump for frame "${frameId}" is ${Math.round(ageMs / 60000)} minutes old; this review only accepts dumps fetched in the last ${Math.round(maxAgeMs / 60000)}.`,
      'A stale dump is a committed copy of the design by another name: the designer may have moved the file since, and comparing against the old one passes while the site drifts. Re-run get_design_context.'
    )
  }
  return source
}
