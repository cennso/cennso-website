/**
 * Turns freshly fetched `get_design_context` dumps into the enumeration the diff runs on.
 *
 * The inventory is built in memory, per review, and never written to disk. It used to be
 * generated from committed dumps and committed alongside them; that made the design a
 * file in this repository, and a file in this repository cannot notice that the designer
 * edited Figma. The comparison stayed green against a month-old design while the site
 * drifted — the failure the whole harness exists to catch.
 *
 * So: the agent calls `get_design_context` once per affected frame, writes each code
 * block unmodified to a scratch directory, and this module reads them. `frames.json`
 * stays committed because it holds no design values — only which route is supposed to
 * look like which frame, in which theme.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { readDump } from './dumps.mjs'
import { FidelityError } from './errors.mjs'
import { parseFigmaDump } from './figma-source.mjs'

export const INVENTORY_SCHEMA_VERSION = 1
export const FRAME_MAP_SCHEMA_VERSION = 2

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

/**
 * The colours inside the vectors Figma exported with the frame.
 *
 * This is the one thing that cannot be read out of the dump itself, and it is the reason
 * freshness matters twice over: the export URLs Figma hands out expire about a week after
 * the pull, so a dump old enough to be refused here would not have been readable anyway.
 */
async function fetchAssetFills(assets, frameId) {
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
      `could not read ${unreachable.length} of frame ${frameId}'s exported SVGs.`,
      `Figma's export URLs expire roughly a week after the pull, so this usually means the dump is not as fresh as its timestamp suggests. Re-run get_design_context for this frame. First failure: ${unreachable[0]}`
    )
  }
  return [...fills].sort()
}

function digest(text) {
  return createHash('sha256').update(text).digest('hex')
}

/* ------------------------------------------------------------------ */
/* the committed mapping                                               */
/* ------------------------------------------------------------------ */

export function frameMapPath(repoRoot) {
  return path.join(repoRoot, 'design', 'figma', 'frames.json')
}

/**
 * Reads design/figma/frames.json. Every degenerate shape is a hard failure: a map with no
 * frames, a frame with no node id, a frame naming a theme nothing declares. A review that
 * enumerates zero frames would report perfect fidelity to nothing at all.
 */
export function loadFrameMap(repoRoot) {
  const file = frameMapPath(repoRoot)
  if (!existsSync(file)) {
    throw new FidelityError('design/figma/frames.json is missing.', {
      hint: 'It is the route <-> Figma frame mapping. Without it nothing knows which frame a route is supposed to look like.',
    })
  }
  let parsed
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch (err) {
    throw new FidelityError(
      `design/figma/frames.json is not valid JSON (${err.message}).`
    )
  }
  return validateFrameMap(parsed)
}

export function validateFrameMap(map, where = 'design/figma/frames.json') {
  const fail = (msg, hint) => {
    throw new FidelityError(`${where}: ${msg}`, { hint })
  }
  if (!map || typeof map !== 'object' || Array.isArray(map))
    fail('must be a JSON object.')
  if (map.schemaVersion !== FRAME_MAP_SCHEMA_VERSION) {
    fail(
      `schemaVersion is ${JSON.stringify(map.schemaVersion)}, this harness understands ${FRAME_MAP_SCHEMA_VERSION}.`
    )
  }
  if (!map.figma || typeof map.figma.fileKey !== 'string' || !map.figma.fileKey)
    fail(
      'figma.fileKey is required — the review has to know which file to fetch.'
    )
  if (
    !map.viewport ||
    !Number.isInteger(map.viewport.width) ||
    !Number.isInteger(map.viewport.height)
  ) {
    fail(
      'viewport.width and viewport.height must be integers (the Figma frames are 1360px wide).'
    )
  }
  if (
    !map.themes ||
    typeof map.themes !== 'object' ||
    !Object.keys(map.themes).length
  )
    fail('themes must declare at least one theme.')
  for (const [name, theme] of Object.entries(map.themes)) {
    if (
      !theme ||
      typeof theme.storageKey !== 'string' ||
      typeof theme.storageValue !== 'string' ||
      typeof theme.documentAttributeValue !== 'string'
    ) {
      fail(
        `themes.${name} needs storageKey, storageValue and documentAttributeValue — how the theme is forced, and what <html data-theme> must then read.`
      )
    }
  }
  if (!Array.isArray(map.frames) || map.frames.length === 0) {
    fail('frames must list at least one frame.', {
      hint: 'A mapping with no frames would let the review enumerate nothing and call it full coverage.',
    })
  }
  const ids = new Set()
  const nodes = new Set()
  for (const frame of map.frames) {
    if (typeof frame.id !== 'string' || !frame.id) fail('a frame has no id.')
    if (ids.has(frame.id)) fail(`duplicate frame id "${frame.id}".`)
    ids.add(frame.id)
    if (
      typeof frame.figmaNode !== 'string' ||
      !/^\d+:\d+$/.test(frame.figmaNode)
    )
      fail(
        `frames.${frame.id}.figmaNode must be a Figma node id such as "1:9".`
      )
    if (nodes.has(frame.figmaNode))
      fail(`two frames claim Figma node ${frame.figmaNode}.`)
    nodes.add(frame.figmaNode)
    if (typeof frame.route !== 'string' || !frame.route.startsWith('/'))
      fail(`frames.${frame.id}.route must be a site route.`)
    if (!map.themes[frame.theme])
      fail(
        `frames.${frame.id}.theme "${frame.theme}" is not declared in themes.`
      )
  }
  return map
}

/** Resolves `--frames=a,b`. An id the mapping does not know is a hard failure. */
export function selectFrames(map, ids) {
  if (!ids || ids.length === 0) return map.frames
  const byId = new Map(map.frames.map((f) => [f.id, f]))
  const chosen = []
  for (const id of ids) {
    const frame = byId.get(id)
    if (!frame) {
      throw new FidelityError(
        `--frames names "${id}", which design/figma/frames.json does not declare.`,
        `Known frames: ${[...byId.keys()].join(', ')}.`
      )
    }
    chosen.push(frame)
  }
  return chosen
}

/* ------------------------------------------------------------------ */
/* the enumeration                                                     */
/* ------------------------------------------------------------------ */

/**
 * Builds the in-memory inventory for the selected frames from their freshly fetched
 * dumps. `read` is injectable so the self-test can prove the degenerate cases without
 * a scratch directory on disk.
 */
export async function buildInventory({
  map,
  frames,
  dumpDir,
  read = readDump,
  fetchAssets = true,
}) {
  if (!frames.length) {
    throw new FidelityError('no frames were selected for this review.', {
      hint: 'A review of zero frames reports nothing and proves nothing.',
    })
  }

  const built = []
  for (const frame of frames) {
    const source = read(dumpDir, frame.id)
    const parsed = parseFigmaDump(source, `${frame.id} dump`)
    if (parsed.frameNode !== frame.figmaNode) {
      throw new FidelityError(
        `the dump for "${frame.id}" is Figma node ${parsed.frameNode}, but design/figma/frames.json maps that frame to ${frame.figmaNode}.`,
        'The wrong frame was fetched, or the mapping moved. Either way the diff below would compare a route against a design that is not its own.'
      )
    }

    const textNodes = parsed.nodes.filter((n) => n.kind === 'text')
    const boxNodes = parsed.nodes
      .filter((n) => n.kind === 'box')
      // A named layer with no fill of its own is still a design statement: it says the
      // fill behind it shows through. Dropping those is how "the dark footer is #0d406a
      // where the frame's band is #001A2A" stayed invisible.
      .filter((n) => Object.keys(n.box).length > 0 || n.assetRefs || n.name)

    built.push({
      id: frame.id,
      figmaNode: frame.figmaNode,
      figmaName: parsed.frameName,
      dumpSha256: digest(source),
      route: frame.route,
      theme: frame.theme,
      frameFill: parsed.frameFill ?? null,
      assetFills: fetchAssets
        ? await fetchAssetFills(parsed.assets, frame.id)
        : [],
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
    fetchedAt: new Date().toISOString(),
    figma: map.figma,
    viewport: map.viewport,
    themes: map.themes,
    frames: built,
  }
}
