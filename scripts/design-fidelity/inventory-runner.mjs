/**
 * Runs the enumerative diff: for every frame under review, open its route in its theme,
 * read every text-bearing element, and compare against every design node the freshly
 * fetched frame declares.
 *
 * The number that matters is not "passed". It is how much of the design the diff managed
 * to reach — because a check that only ever asserts what somebody listed cannot tell you
 * what nobody listed, which is how card alignment, a dimmed card outline, a footer band
 * and a heading gap all shipped wrong under a green build.
 */
import { FidelityError } from './errors.mjs'
import { collectDom } from './dom-inventory.mjs'
import { diffFrame, validateExclusions } from './match.mjs'
import { openPage } from './page.mjs'

/**
 * Every degenerate inventory is a hard failure. In particular an inventory with no
 * frames, and a frame with no text nodes, both abort the run — neither may be reported
 * as "nothing to compare, so everything is fine".
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
    if (typeof frame.route !== 'string' || !frame.route.startsWith('/'))
      fail(`frames.${frame.id}.route must be a site route.`)
    if (!Array.isArray(frame.textNodes) || frame.textNodes.length === 0) {
      fail(`frames.${frame.id} contains no text nodes.`, {
        hint: 'Every frame in this design has copy in it. Zero means the fetch or the parser lost it, and the coverage line below would be a lie.',
      })
    }
    for (const node of frame.textNodes) {
      if (typeof node.key !== 'string' || !node.key)
        fail(`frames.${frame.id} has a text node without a key.`)
      if (typeof node.text !== 'string' || !node.text.trim())
        fail(`frames.${frame.id}.${node.key} has no text.`)
    }
  }
  return inventory
}

export async function runInventory({
  inventory,
  exclusions,
  knownFrameIds,
  browser,
  baseUrl,
}) {
  validateInventory(inventory)
  validateExclusions(exclusions, inventory, { knownFrameIds })

  const findings = []
  const coverage = []
  const notComparable = []

  for (const frame of inventory.frames) {
    const themeConfig = inventory.themes[frame.theme]
    if (!themeConfig) {
      throw new FidelityError(
        `frame ${frame.id} uses theme "${frame.theme}", which design/figma/frames.json does not declare.`
      )
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

    coverage.push({ frame, ...result.coverage, findings: result.findings })
    for (const note of result.notComparable)
      notComparable.push(`${frame.id}: ${note}`)
    findings.push(...result.findings)
  }

  return { findings, coverage, notComparable }
}
