import { createHash } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

import { FidelityError } from './errors.mjs'
import { assertKnownProperty, MAX_TOLERANCE } from './properties.mjs'

export const SCHEMA_VERSION = 1
export const FRAME_STATUSES = ['enforced', 'awaiting-implementation']
export const CAPTURE_STATES = ['captured', 'not-captured']
const MIN_REASON_LENGTH = 20

export function loadSnapshot(snapshotPath) {
  if (!existsSync(snapshotPath)) {
    throw new FidelityError(`Snapshot not found: ${snapshotPath}`, {
      hint: 'The ground truth is checked in, not fetched. See design/figma/README.md for how to regenerate it from Figma.',
    })
  }
  let raw
  try {
    raw = readFileSync(snapshotPath, 'utf8')
  } catch (err) {
    throw new FidelityError(
      `Snapshot could not be read: ${snapshotPath} (${err.message})`
    )
  }
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    throw new FidelityError(
      `Snapshot is not valid JSON: ${snapshotPath} (${err.message})`
    )
  }
  return validateSnapshot(parsed, snapshotPath)
}

/**
 * Every degenerate shape below is a hard failure. In particular:
 *  - an empty snapshot,
 *  - a frame that declares no assertions,
 *  - an assertion with an empty `expect`,
 *  - an unknown property name,
 *  - a dangling cross-reference,
 * all abort the run. None of them may ever be reported as "nothing to check,
 * so everything is fine".
 */
export function validateSnapshot(s, where = 'snapshot') {
  const fail = (msg, hint) => {
    throw new FidelityError(`${where}: ${msg}`, { hint })
  }

  if (!s || typeof s !== 'object' || Array.isArray(s))
    fail('must be a JSON object.')
  if (s.schemaVersion !== SCHEMA_VERSION) {
    fail(
      `schemaVersion is ${JSON.stringify(s.schemaVersion)}, this harness understands ${SCHEMA_VERSION}.`,
      'Regenerate the snapshot, or bump the harness.'
    )
  }
  if (!s.figma || typeof s.figma.fileKey !== 'string' || !s.figma.fileKey) {
    fail(
      'figma.fileKey is required — the snapshot must say which Figma file it came from.'
    )
  }
  if (
    typeof s.figma.pulledAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(s.figma.pulledAt)
  ) {
    fail(
      'figma.pulledAt must be an ISO date (YYYY-MM-DD) recording when the values were pulled.'
    )
  }

  // themes
  if (
    !s.themes ||
    typeof s.themes !== 'object' ||
    !Object.keys(s.themes).length
  ) {
    fail('themes must declare at least one theme.')
  }
  for (const [name, theme] of Object.entries(s.themes)) {
    if (
      !theme ||
      typeof theme.storageKey !== 'string' ||
      typeof theme.storageValue !== 'string'
    ) {
      fail(`themes.${name} needs storageKey and storageValue.`)
    }
    if (typeof theme.documentAttributeValue !== 'string') {
      fail(
        `themes.${name} needs documentAttributeValue — the value of <html data-theme> this theme must produce.`
      )
    }
  }

  if (
    !s.viewport ||
    !Number.isInteger(s.viewport.width) ||
    !Number.isInteger(s.viewport.height)
  ) {
    fail(
      'viewport.width and viewport.height must be integers (the Figma frames are 1360px wide).'
    )
  }

  // coverage ledger
  if (!Array.isArray(s.designFrames) || s.designFrames.length === 0) {
    fail('designFrames must list every frame of the design, captured or not.')
  }
  const seenIds = new Set()
  const claimId = (id, kind) => {
    if (typeof id !== 'string' || !id) fail(`${kind} is missing an id.`)
    if (seenIds.has(id)) fail(`duplicate id "${id}".`)
    seenIds.add(id)
  }
  for (const df of s.designFrames) {
    if (typeof df.figmaNode !== 'string' || !df.figmaNode)
      fail('designFrames[] entry needs figmaNode.')
    if (!CAPTURE_STATES.includes(df.capture)) {
      fail(
        `designFrames[${df.figmaNode}].capture must be one of ${CAPTURE_STATES.join(' | ')}.`
      )
    }
    if (df.capture === 'not-captured') {
      if (
        typeof df.reason !== 'string' ||
        df.reason.trim().length < MIN_REASON_LENGTH
      ) {
        fail(
          `designFrames[${df.figmaNode}] is not captured and needs a written reason of at least ${MIN_REASON_LENGTH} characters.`,
          'An uncovered frame is a decision somebody has to defend in review, not a blank.'
        )
      }
    }
  }

  // tokens
  if (!Array.isArray(s.tokens) || s.tokens.length === 0) {
    fail(
      'tokens must contain at least one entry.',
      'Token assertions are what stop a colour being eyeballed off a screenshot. An empty list would make this check vacuous.'
    )
  }
  for (const t of s.tokens) {
    claimId(t.id, 'tokens[] entry')
    if (typeof t.cssExpression !== 'string' || !t.cssExpression)
      fail(`tokens.${t.id}.cssExpression is required.`)
    if (typeof t.expect !== 'string' || !t.expect)
      fail(`tokens.${t.id}.expect is required.`)
    if (typeof t.figmaNode !== 'string' || !t.figmaNode)
      fail(
        `tokens.${t.id}.figmaNode is required — say which node proves this value.`
      )
    if (!s.themes[t.theme])
      fail(`tokens.${t.id}.theme "${t.theme}" is not declared in themes.`)
    if (typeof t.route !== 'string' || !t.route.startsWith('/'))
      fail(`tokens.${t.id}.route must be a site route.`)
    checkTolerance(t.tolerance, `tokens.${t.id}`, fail)
  }

  // frames
  if (!Array.isArray(s.frames) || s.frames.length === 0) {
    fail('frames must contain at least one entry.')
  }
  const declaredNodes = new Set(s.designFrames.map((d) => d.figmaNode))
  const capturedNodes = new Set(
    s.designFrames
      .filter((d) => d.capture === 'captured')
      .map((d) => d.figmaNode)
  )
  const elementIndex = new Map()
  for (const f of s.frames) {
    claimId(f.id, 'frames[] entry')
    if (typeof f.figmaNode !== 'string' || !f.figmaNode)
      fail(`frames.${f.id}.figmaNode is required.`)
    if (!declaredNodes.has(f.figmaNode)) {
      fail(
        `frames.${f.id} asserts Figma node ${f.figmaNode}, which is not listed in designFrames.`
      )
    }
    if (!capturedNodes.has(f.figmaNode)) {
      fail(
        `frames.${f.id} asserts node ${f.figmaNode}, but designFrames marks it not-captured.`
      )
    }
    if (typeof f.route !== 'string' || !f.route.startsWith('/'))
      fail(`frames.${f.id}.route must be a site route.`)
    if (!s.themes[f.theme])
      fail(`frames.${f.id}.theme "${f.theme}" is not declared in themes.`)
    if (!FRAME_STATUSES.includes(f.status)) {
      fail(
        `frames.${f.id}.status must be one of ${FRAME_STATUSES.join(' | ')}.`
      )
    }
    if (!Array.isArray(f.elements) || f.elements.length === 0) {
      fail(
        `frames.${f.id} declares no element assertions.`,
        'A frame with nothing to assert would pass without checking anything. Delete the frame or give it assertions.'
      )
    }
    if (f.status === 'awaiting-implementation') {
      const fp = f.implementationFingerprint
      if (!fp || !Array.isArray(fp.files) || fp.files.length === 0) {
        fail(
          `frames.${f.id} is awaiting-implementation and must list implementationFingerprint.files.`,
          'That fingerprint is what stops the pending state from being permanent and silent.'
        )
      }
      if (typeof fp.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(fp.sha256)) {
        fail(
          `frames.${f.id}.implementationFingerprint.sha256 must be a 64-character hex digest.`
        )
      }
    }
    for (const el of f.elements) {
      claimId(el.id, `frames.${f.id}.elements[] entry`)
      elementIndex.set(`${f.id}::${el.id}`, el)
      const at = `frames.${f.id}.elements.${el.id}`
      if (typeof el.selector !== 'string' || !el.selector.trim())
        fail(`${at}.selector is required.`)
      if (typeof el.figmaNode !== 'string' || !el.figmaNode)
        fail(`${at}.figmaNode is required.`)
      if (typeof el.implementedIn !== 'string' || !el.implementedIn) {
        fail(
          `${at}.implementedIn is required — the failure message has to name a file to open.`
        )
      }
      if (
        !el.expect ||
        typeof el.expect !== 'object' ||
        Array.isArray(el.expect)
      ) {
        fail(`${at}.expect must be an object.`)
      }
      const keys = Object.keys(el.expect)
      if (keys.length === 0) {
        fail(
          `${at}.expect is empty.`,
          'An element with no expectations checks nothing while still counting as covered.'
        )
      }
      for (const k of keys) {
        assertKnownProperty(k, at)
        const v = el.expect[k]
        if (typeof v !== 'string' || v.trim() === '') {
          fail(`${at}.expect.${k} must be a non-empty string.`)
        }
      }
      checkTolerance(el.tolerance, at, fail)
      if (
        el.matchCount !== undefined &&
        (!Number.isInteger(el.matchCount) || el.matchCount < 1)
      ) {
        fail(`${at}.matchCount must be a positive integer when present.`)
      }
    }
  }

  // theme-paired assets
  if (!Array.isArray(s.themePairedAssets) || s.themePairedAssets.length === 0) {
    fail(
      'themePairedAssets must contain at least one entry.',
      "The design ships distinct artwork per theme; without a pair to compare, one theme can quietly reuse the other theme's asset."
    )
  }
  const frameIndex = new Map(s.frames.map((f) => [f.id, f]))
  for (const pair of s.themePairedAssets) {
    claimId(pair.id, 'themePairedAssets[] entry')
    const refs = pair.refs
    if (!Array.isArray(refs) || refs.length < 2) {
      fail(
        `themePairedAssets.${pair.id}.refs needs at least two {frame, element} references.`
      )
    }
    for (const ref of refs) {
      const frame = frameIndex.get(ref.frame)
      if (!frame)
        fail(
          `themePairedAssets.${pair.id} references unknown frame "${ref.frame}".`
        )
      if (!elementIndex.has(`${ref.frame}::${ref.element}`)) {
        fail(
          `themePairedAssets.${pair.id} references unknown element "${ref.element}" in frame "${ref.frame}".`
        )
      }
    }
    const themes = new Set(refs.map((r) => frameIndex.get(r.frame).theme))
    if (themes.size < 2) {
      fail(
        `themePairedAssets.${pair.id} compares elements from a single theme (${[...themes].join(', ')}).`
      )
    }
  }

  return s
}

function checkTolerance(tolerance, at, fail) {
  if (tolerance === undefined) return
  if (!Number.isInteger(tolerance) || tolerance < 0) {
    fail(`${at}.tolerance must be a non-negative integer.`)
  }
  if (tolerance > MAX_TOLERANCE) {
    fail(
      `${at}.tolerance is ${tolerance}; the cap is ${MAX_TOLERANCE}.`,
      'A wide tolerance turns an assertion into a rubber stamp. If the value genuinely differs, fix the code or re-pull the snapshot.'
    )
  }
}

/** Stable digest over the files that render a frame. */
export function fingerprintFiles(repoRoot, files) {
  const hash = createHash('sha256')
  for (const rel of [...files].sort()) {
    const abs = path.join(repoRoot, rel)
    if (!existsSync(abs)) {
      throw new FidelityError(
        `implementationFingerprint lists "${rel}", which does not exist.`,
        'Update the file list in design/figma/snapshot.json.'
      )
    }
    hash.update(rel)
    hash.update('\0')
    hash.update(createHash('sha256').update(readFileSync(abs)).digest('hex'))
    hash.update('\n')
  }
  return hash.digest('hex')
}
