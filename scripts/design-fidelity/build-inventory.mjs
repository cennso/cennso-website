/**
 * Builds design/figma/inventory.json from design/figma/frames.json and the committed
 * `get_design_context` dumps under design/figma/raw/.
 *
 * The inventory is GENERATED. Nobody writes it by hand, and nobody is allowed to: CI runs
 * this same builder in --check mode and fails if the committed file differs from what the
 * raw dumps produce. That is what keeps the harness enumerative — an inventory somebody
 * can edit is an inventory somebody can quietly shrink to the assertions that pass.
 *
 * The only thing that cannot be recomputed offline is `assetFills`: the colours inside
 * the artwork Figma exported. Those URLs expire about a week after the pull, so the
 * colours are read once (--fetch-assets, during a refresh) and then carried forward.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { FidelityError } from './errors.mjs'
import { parseFigmaDump } from './figma-source.mjs'

export const INVENTORY_SCHEMA_VERSION = 1

/** Two nodes are in the same column when their horizontal spans overlap at all. */
function overlapsHorizontally(a, b) {
  const aLeft = a.geometry.left
  const bLeft = b.geometry.left
  if (aLeft === undefined || bLeft === undefined) return false
  const aRight = aLeft + (a.geometry.width ?? 0)
  const bRight = bLeft + (b.geometry.width ?? 0)
  return aLeft <= bRight && bLeft <= aRight
}

/**
 * The height a text node occupies. Figma gives it explicitly for a wrapped paragraph; for
 * a single-line node it is the resolved line height. A node with neither is left out of
 * the gap pass rather than guessed at — a guessed gap is a false failure waiting to fire.
 */
function textHeight(node) {
  if (node.geometry.height !== undefined) return node.geometry.height
  const lh = node.style?.lineHeight
  if (typeof lh === 'string' && lh.endsWith('px'))
    return Number(lh.slice(0, -2))
  return null
}

/**
 * Vertical gaps between consecutive text nodes in the same column.
 *
 * This is the pass that would have caught a 32px heading→body gap where the design draws
 * 13px: the numbers are in the frame, nobody had ever compared them.
 */
const MAX_INTERESTING_GAP = 200

function computeGaps(textNodes) {
  const positioned = textNodes
    .filter((n) => n.geometry.top !== undefined && textHeight(n) !== null)
    .sort((a, b) => a.geometry.top - b.geometry.top)

  const gaps = []
  for (let i = 0; i < positioned.length; i += 1) {
    const from = positioned[i]
    const fromBottom = from.geometry.top + textHeight(from)
    // the nearest node below that shares a column
    const to = positioned
      .slice(i + 1)
      .find(
        (n) => n.geometry.top >= fromBottom && overlapsHorizontally(from, n)
      )
    if (!to) continue
    const gap = Math.round((to.geometry.top - fromBottom) * 100) / 100
    if (gap < 0 || gap > MAX_INTERESTING_GAP) continue
    gaps.push({ from: from.key, to: to.key, gap: `${gap}px` })
  }
  return gaps
}

/** Pulls every fill colour out of an exported SVG. */
export function svgFills(svg) {
  const out = new Set()
  for (const m of svg.matchAll(/fill="([^"]+)"/g)) {
    const value = m[1].trim().toLowerCase()
    if (value === 'none' || value.startsWith('url(')) continue
    out.add(
      value === 'white' ? '#ffffff' : value === 'black' ? '#000000' : value
    )
  }
  return [...out].sort()
}

async function fetchAssetFills(assets) {
  const fills = new Set()
  const unreachable = []
  for (const [name, url] of Object.entries(assets)) {
    if (!url.endsWith('.svg')) continue
    let response
    try {
      response = await fetch(url)
    } catch (err) {
      unreachable.push(`${name}: ${err.message}`)
      continue
    }
    if (!response.ok) {
      unreachable.push(`${name}: HTTP ${response.status}`)
      continue
    }
    for (const fill of svgFills(await response.text())) fills.add(fill)
  }
  if (unreachable.length) {
    throw new FidelityError(
      `--fetch-assets could not read ${unreachable.length} of the frame's exported SVGs.`,
      `Figma asset URLs expire about 7 days after the pull, so a stale raw/ dump cannot be re-read. Pull the frames again. First failure: ${unreachable[0]}`
    )
  }
  return [...fills].sort()
}

function digest(text) {
  return createHash('sha256').update(text).digest('hex')
}

export async function buildInventory({
  repoRoot,
  fetchAssets = false,
  previous = null,
}) {
  const designDir = path.join(repoRoot, 'design', 'figma')
  const configPath = path.join(designDir, 'frames.json')
  if (!existsSync(configPath)) {
    throw new FidelityError(`design/figma/frames.json is missing.`)
  }
  const config = JSON.parse(readFileSync(configPath, 'utf8'))
  if (!Array.isArray(config.frames) || config.frames.length === 0) {
    throw new FidelityError('frames.json declares no frames.', {
      hint: 'An inventory built from no frames would report perfect coverage of nothing.',
    })
  }

  const frames = []
  for (const frame of config.frames) {
    const rawPath = path.join(designDir, 'raw', frame.raw)
    if (!existsSync(rawPath)) {
      throw new FidelityError(
        `frames.${frame.id} points at raw/${frame.raw}, which does not exist.`
      )
    }
    const source = readFileSync(rawPath, 'utf8')
    const parsed = parseFigmaDump(source, `raw/${frame.raw}`)
    if (parsed.frameNode !== frame.figmaNode) {
      throw new FidelityError(
        `frames.${frame.id} declares node ${frame.figmaNode} but raw/${frame.raw} is node ${parsed.frameNode}.`,
        'The dump and the config disagree about which frame this is; one of them was edited without the other.'
      )
    }

    const textNodes = parsed.nodes.filter((n) => n.kind === 'text')
    const boxNodes = parsed.nodes
      .filter((n) => n.kind === 'box')
      // A named layer with no fill of its own is still a design statement: it says the
      // fill behind it shows through. Dropping those is how "the dark footer is #0d406a
      // where the frame's band is #001A2A" stayed invisible.
      .filter((n) => Object.keys(n.box).length > 0 || n.assetRefs || n.name)

    let assetFills = previous?.frames?.find(
      (f) => f.id === frame.id
    )?.assetFills
    if (fetchAssets) assetFills = await fetchAssetFills(parsed.assets)
    if (!assetFills) assetFills = []

    frames.push({
      id: frame.id,
      figmaNode: frame.figmaNode,
      figmaName: parsed.frameName,
      raw: frame.raw,
      rawSha256: digest(source),
      route: frame.route,
      theme: frame.theme,
      status: frame.status,
      statusNote: frame.statusNote,
      implementationFingerprint: frame.implementationFingerprint,
      frameFill: parsed.frameFill ?? null,
      assetFills,
      textNodes: textNodes.map((n) => ({
        key: n.key,
        figmaNode: n.figmaNode,
        name: n.name,
        text: n.text,
        style: n.style,
        lines: n.lines,
        mixedProperties: n.mixedProperties,
        geometry: n.geometry,
      })),
      boxNodes: boxNodes.map((n) => ({
        key: n.key,
        figmaNode: n.figmaNode,
        name: n.name,
        // A Figma node with no fill shows the nearest filled ancestor — for the dark
        // Footer, the frame itself. Recording that resolved value is what turns
        // "the footer band is #0d406a in dark" into a checkable statement.
        fill: n.box.fill ?? null,
        effectiveFill: n.box.fill ?? n.parentFill ?? parsed.frameFill ?? null,
        borderColor: n.box.borderColor ?? null,
        borderWidth: n.box.borderWidth ?? null,
        borderRadius: n.box.borderRadius ?? null,
        opacity: n.box.opacity ?? 1,
        backdrop: n.parentFill ?? parsed.frameFill ?? null,
        geometry: n.geometry,
      })),
      gaps: computeGaps(textNodes),
    })
  }

  return {
    schemaVersion: INVENTORY_SCHEMA_VERSION,
    generatedBy: 'scripts/design-fidelity/build-inventory.mjs',
    doNotEdit:
      'Generated from design/figma/raw/*.jsx. `yarn design:inventory --check` fails if this file and those dumps disagree, so editing it by hand cannot stick.',
    figma: config.figma,
    viewport: config.viewport,
    frames,
  }
}

export function serialiseInventory(inventory) {
  return `${JSON.stringify(inventory, null, 2)}\n`
}

export function inventoryPath(repoRoot) {
  return path.join(repoRoot, 'design', 'figma', 'inventory.json')
}

export function readInventoryIfPresent(repoRoot) {
  const file = inventoryPath(repoRoot)
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8'))
}

export async function writeInventory(repoRoot, { fetchAssets = false } = {}) {
  const inventory = await buildInventory({
    repoRoot,
    fetchAssets,
    previous: readInventoryIfPresent(repoRoot),
  })
  writeFileSync(inventoryPath(repoRoot), serialiseInventory(inventory))
  return inventory
}

/**
 * Proves the committed inventory is exactly what the committed dumps produce.
 * `assetFills` is carried over rather than refetched, so this stays offline-deterministic.
 */
export async function checkInventory(repoRoot) {
  const committed = readInventoryIfPresent(repoRoot)
  if (!committed) {
    throw new FidelityError('design/figma/inventory.json is missing.', {
      hint: 'Run `yarn design:inventory` to generate it from design/figma/raw/.',
    })
  }
  const rebuilt = await buildInventory({
    repoRoot,
    fetchAssets: false,
    previous: committed,
  })
  if (serialiseInventory(rebuilt) !== serialiseInventory(committed)) {
    throw new FidelityError(
      'design/figma/inventory.json does not match what design/figma/raw/ produces.',
      'Either the dumps changed and the inventory was not regenerated, or the inventory was hand-edited. Run `yarn design:inventory` and commit the result.'
    )
  }
  return committed
}
