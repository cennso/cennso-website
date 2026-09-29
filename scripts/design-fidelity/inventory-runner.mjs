/**
 * Runs the enumerative diff: for every frame in the inventory, open its route in its
 * theme, read every text-bearing element, and compare against every design node.
 *
 * The contrast with the curated pass in runner.mjs is the point. That one asserts what
 * somebody listed. This one asserts what the design *contains*, and says out loud how
 * much of it it managed to reach.
 */
import { FidelityError } from './errors.mjs'
import { collectDom } from './dom-inventory.mjs'
import { diffFrame, validateExclusions } from './match.mjs'
import { openPage } from './page.mjs'
import { fingerprintFiles } from './snapshot.mjs'

export const INVENTORY_FRAME_STATUSES = ['enforced', 'awaiting-implementation']

/**
 * Every degenerate inventory is a hard failure. In particular an inventory with no
 * frames, a frame with no text nodes, and a frame whose status is unknown all abort the
 * run — none of them may be reported as "nothing to compare, so everything is fine".
 */
export function validateInventory(inventory, where = 'inventory') {
  const fail = (msg, hint) => {
    throw new FidelityError(`${where}: ${msg}`, { hint })
  }
  if (!inventory || typeof inventory !== 'object' || Array.isArray(inventory))
    fail('must be a JSON object.')
  if (inventory.schemaVersion !== 1)
    fail(
      `schemaVersion is ${JSON.stringify(inventory.schemaVersion)}, expected 1.`
    )
  if (!Array.isArray(inventory.frames) || inventory.frames.length === 0) {
    fail('declares no frames.', {
      hint: 'An empty inventory would report 100% coverage of nothing at all.',
    })
  }
  const ids = new Set()
  for (const frame of inventory.frames) {
    if (typeof frame.id !== 'string' || !frame.id) fail('a frame has no id.')
    if (ids.has(frame.id)) fail(`duplicate frame id "${frame.id}".`)
    ids.add(frame.id)
    if (!INVENTORY_FRAME_STATUSES.includes(frame.status)) {
      fail(
        `frames.${frame.id}.status must be one of ${INVENTORY_FRAME_STATUSES.join(' | ')}.`
      )
    }
    if (typeof frame.route !== 'string' || !frame.route.startsWith('/'))
      fail(`frames.${frame.id}.route must be a site route.`)
    if (!Array.isArray(frame.textNodes) || frame.textNodes.length === 0) {
      fail(`frames.${frame.id} contains no text nodes.`, {
        hint: 'Every frame in this design has copy in it. Zero means the pull or the parser lost it, and the coverage line below would be a lie.',
      })
    }
    for (const node of frame.textNodes) {
      if (typeof node.key !== 'string' || !node.key)
        fail(`frames.${frame.id} has a text node without a key.`)
      if (typeof node.text !== 'string' || !node.text.trim())
        fail(`frames.${frame.id}.${node.key} has no text.`)
    }
    if (frame.status === 'awaiting-implementation') {
      const fp = frame.implementationFingerprint
      if (!fp || !Array.isArray(fp.files) || fp.files.length === 0) {
        fail(
          `frames.${frame.id} is awaiting-implementation and must list implementationFingerprint.files.`,
          'That fingerprint is what stops a pending frame outliving the next edit to the files that render it.'
        )
      }
      if (typeof fp.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(fp.sha256)) {
        fail(
          `frames.${frame.id}.implementationFingerprint.sha256 must be a 64-character hex digest.`
        )
      }
    }
  }
  return inventory
}

export async function runInventory({
  inventory,
  exclusions,
  themes,
  browser,
  baseUrl,
  repoRoot,
}) {
  validateInventory(inventory)
  validateExclusions(exclusions, inventory)

  const findings = []
  const pending = []
  const coverage = []
  const notComparable = []

  for (const frame of inventory.frames) {
    const themeConfig = themes[frame.theme]
    if (!themeConfig) {
      throw new FidelityError(
        `inventory frame ${frame.id} uses theme "${frame.theme}", which the snapshot does not declare.`
      )
    }

    if (frame.status === 'awaiting-implementation') {
      const actual = fingerprintFiles(
        repoRoot,
        frame.implementationFingerprint.files
      )
      if (actual !== frame.implementationFingerprint.sha256) {
        findings.push({
          scope: `${frame.id} (awaiting-implementation)`,
          figmaNode: frame.figmaNode,
          evidence: frame.figmaName,
          route: frame.route,
          theme: frame.theme,
          selector: '(implementation fingerprint)',
          file: frame.implementationFingerprint.files.join(', '),
          property: 'implementationFingerprint.sha256',
          expected: frame.implementationFingerprint.sha256,
          actual: `${actual} — these files changed while ${frame.textNodes.length} enumerated text nodes for ${frame.figmaNode} are still switched off. Enforce the frame, or re-baseline the digest deliberately in design/figma/frames.json.`,
        })
      }
    }

    const page = await openPage(browser, {
      baseUrl,
      route: frame.route,
      theme: frame.theme,
      themeConfig,
      viewport: inventory.viewport,
    })
    let result
    try {
      const dom = await collectDom(page)
      result = diffFrame({ frame, dom, exclusions })
    } finally {
      await page.close()
    }

    coverage.push({ frame, ...result.coverage, status: frame.status })
    for (const note of result.notComparable)
      notComparable.push(`${frame.id}: ${note}`)

    if (frame.status === 'enforced') {
      findings.push(...result.findings)
    } else {
      pending.push({
        frame: frame.id,
        figmaNode: frame.figmaNode,
        route: frame.route,
        theme: frame.theme,
        heldBack: result.findings.length,
        textNodes: frame.textNodes.length,
      })
    }
  }

  return { findings, pending, coverage, notComparable }
}
