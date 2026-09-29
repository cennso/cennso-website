/**
 * Artwork: the illustrations, not the type.
 *
 * The check this replaces read `fill` off the page's `<svg>` elements and compared the
 * set against the fills inside the vectors Figma exported with the frame. Our
 * illustrations ship as WebP. It therefore could not see inside a single one of them:
 * every one of the fourteen "artwork colour" findings on the last full run said "this
 * colour is absent from the page" about a raster it had never opened — and meanwhile the
 * defect the owner actually caught by eye (all three stat illustrations rendered orange
 * in dark mode, where the frame draws #ffb31b) went unreported.
 *
 * So the comparison is now between two images: the one Figma exported for that node, and
 * the one the page actually served for it. It is a dominant-palette comparison, not a
 * pixel diff — our assets are re-encoded WebP at different dimensions, so pixel equality
 * would fail on every correct image and prove nothing. Both are decoded in the browser
 * that is already open, downsampled to a common size, and reduced to a coarse histogram.
 *
 * Two rules come out of it:
 *
 *  1. A colour the design's own artwork is substantially made of must be present in the
 *     image the page serves in its place.
 *  2. Where the design draws a route's artwork differently per theme, the page must serve
 *     two different files. Serving one file for both is a defect even when it looks fine
 *     in the theme it was drawn for — it is how the light hero shipped into dark mode.
 */
import { FidelityError } from './errors.mjs'

/** How much of an image a colour must be before its absence is a finding. */
export const MIN_DOMINANT_SHARE = 0.06

/** How far apart two colours may be and still count as the same one (RGB distance). */
export const COLOUR_TOLERANCE = 48

/** Below this saturation a colour is a neutral, and neutrals survive any re-encode. */
const MIN_SATURATION = 0.25

/** How different two themes' exported artwork must be before they must be two files. */
const THEME_DIVERGENCE = 40

/**
 * How differently concentrated two palettes may be and still be the same artwork.
 *
 * A design node and an <img> can share a rectangle without being the same picture: Figma
 * composes, the site flattens. The contact frame draws the portrait's amber ring as its
 * own node, and the page renders that ring in CSS with the PHOTOGRAPH inside it — so the
 * ring's export (one flat colour, 100% of it) landed on a photograph (no colour above
 * 7%), and the check dutifully reported that the photograph is not amber. True, and not a
 * defect.
 *
 * Two images that are the same artwork re-encoded are concentrated alike, whatever the
 * codec did to the values. Two that are not, are not. Where they differ this much the
 * bridge is not believed at all, and the node is counted as not compared — which is the
 * whole rule of this harness: unreached beats confidently wrong.
 */
const MAX_CONCENTRATION_GAP = 0.5

const LEFT_TOLERANCE = 32
const WIDTH_TOLERANCE = 32
const TOP_TOLERANCE = 72

/* ------------------------------------------------------------------ */
/* bridging a design artwork node to the <img> the page serves          */
/* ------------------------------------------------------------------ */

/**
 * Which rendered image stands in for which design artwork node.
 *
 * Same left, same width, and a top where the anchors say it should be. An artwork node
 * that no single image fits is left unbridged and counted — never compared against
 * whatever happened to be closest.
 */
export function bridgeArtwork(artworkNodes, images, project) {
  const bridged = []
  const unbridged = []
  for (const node of artworkNodes) {
    const predictedTop = project(node.geometry.top)
    const scored = images
      .map((image) => ({
        image,
        dLeft: Math.abs(image.rect.left - node.geometry.left),
        dWidth: Math.abs(image.rect.width - node.geometry.width),
        dTop:
          predictedTop === null || predictedTop === undefined
            ? 0
            : Math.abs(image.rect.top - predictedTop),
      }))
      .filter(
        (c) =>
          c.dLeft <= LEFT_TOLERANCE &&
          c.dWidth <= WIDTH_TOLERANCE &&
          c.dTop <= TOP_TOLERANCE
      )
      .sort(
        (a, b) => a.dLeft + a.dTop + a.dWidth - (b.dLeft + b.dTop + b.dWidth)
      )
    if (!scored.length) {
      unbridged.push({
        node,
        why: 'no rendered image sits where the design draws it',
      })
      continue
    }
    const best = scored[0]
    const rival = scored.find(
      (c) =>
        c !== best &&
        c.image.assetPath !== best.image.assetPath &&
        c.dLeft + c.dTop + c.dWidth <= best.dLeft + best.dTop + best.dWidth + 4
    )
    if (rival) {
      unbridged.push({
        node,
        why: `two images fit it equally well (${best.image.assetBasename} and ${rival.image.assetBasename})`,
        ambiguous: true,
      })
      continue
    }
    bridged.push({ node, image: best.image })
  }
  return { bridged, unbridged }
}

/* ------------------------------------------------------------------ */
/* palettes                                                            */
/* ------------------------------------------------------------------ */

/* c8 ignore start -- runs inside the browser, not under node */
function readPalette(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onerror = () => resolve({ error: 'the browser could not decode it' })
    img.onload = () => {
      try {
        const side = 96
        const ratio = img.naturalHeight / (img.naturalWidth || 1)
        const w = side
        const h = Math.max(1, Math.min(side * 4, Math.round(side * ratio)))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0, w, h)
        const { data } = ctx.getImageData(0, 0, w, h)
        const buckets = new Map()
        let counted = 0
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 200) continue
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const key = `${r >> 4}.${g >> 4}.${b >> 4}`
          const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 }
          bucket.r += r
          bucket.g += g
          bucket.b += b
          bucket.n += 1
          buckets.set(key, bucket)
          counted += 1
        }
        if (!counted) {
          resolve({ error: 'every pixel of it is transparent' })
          return
        }
        const palette = [...buckets.values()]
          .map((bucket) => ({
            r: Math.round(bucket.r / bucket.n),
            g: Math.round(bucket.g / bucket.n),
            b: Math.round(bucket.b / bucket.n),
            share: bucket.n / counted,
          }))
          .sort((a, b) => b.share - a.share)
          .slice(0, 48)
        resolve({ palette, pixels: counted })
      } catch (err) {
        resolve({ error: err.message })
      }
    }
    img.src = dataUrl
  })
}
/* c8 ignore stop */

async function toDataUrl(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`)
  const type =
    response.headers.get('content-type') || 'application/octet-stream'
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!bytes.length) throw new Error(`empty body from ${url}`)
  return `data:${type.split(';')[0]};base64,${bytes.toString('base64')}`
}

/** Decodes one image in the already-open browser and reduces it to a coarse palette. */
export async function paletteOf(page, url) {
  let dataUrl
  try {
    dataUrl = await toDataUrl(url)
  } catch (err) {
    throw new FidelityError(
      `could not read the image at ${url}: ${err.message}`,
      'Figma expires its export URLs about a week after the pull, so this usually means the dump is older than its timestamp suggests. Re-run get_design_context for this frame.'
    )
  }
  const result = await page.evaluate(readPalette, dataUrl)
  if (result.error) {
    throw new FidelityError(
      `could not decode the image at ${url}: ${result.error}`
    )
  }
  return result.palette
}

export function distance(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

/** Saturation on the HSV scale — 0 for any grey, 1 for a pure hue. */
export function saturation({ r, g, b }) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max === 0 ? 0 : (max - min) / max
}

export function hex({ r, g, b }) {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Which colours the design's artwork is made of that the rendered image is not.
 *
 * Only substantial, chromatic colours are asserted. A re-encode moves every value a
 * little and pushes the rare ones around a lot, and a neutral survives any encoder — so
 * asserting those would be asserting the codec, not the design.
 */
export function missingColours(designPalette, renderedPalette) {
  const missing = []
  for (const colour of designPalette) {
    if (colour.share < MIN_DOMINANT_SHARE) continue
    if (saturation(colour) < MIN_SATURATION) continue
    const nearest = renderedPalette.reduce(
      (best, candidate) => {
        const d = distance(colour, candidate)
        return d < best.d ? { d, candidate } : best
      },
      { d: Infinity, candidate: null }
    )
    if (nearest.d > COLOUR_TOLERANCE) {
      missing.push({ colour, nearest: nearest.candidate, distance: nearest.d })
    }
  }
  return missing
}

/** How far apart two whole palettes are, at their dominant colours. */
export function paletteDistance(a, b) {
  const dominant = (p) =>
    p.filter(
      (c) => c.share >= MIN_DOMINANT_SHARE && saturation(c) >= MIN_SATURATION
    )
  const left = dominant(a)
  if (!left.length) return 0
  let total = 0
  for (const colour of left) {
    total += b.reduce(
      (best, candidate) => Math.min(best, distance(colour, candidate)),
      Infinity
    )
  }
  return total / left.length
}

/* ------------------------------------------------------------------ */
/* the frame-level check                                               */
/* ------------------------------------------------------------------ */

/**
 * Compares every artwork node in one frame against the image the page served for it.
 * Returns findings, the coverage counts, and the per-position palettes the theme-pairing
 * rule needs afterwards.
 */
export async function checkFrameArtwork({
  page,
  frame,
  images,
  project,
  isExcluded,
}) {
  const findings = []
  const positions = []
  const { bridged, unbridged } = bridgeArtwork(
    frame.artworkNodes ?? [],
    images,
    project
  )

  let implausible = 0
  let excluded = 0
  for (const { node, image } of bridged) {
    // An excluded node is not compared against anything, so it must not be counted as
    // though it were. `bridgedArtworkNodes` is printed as "compared against the served
    // image"; leaving exclusions in it inflates the one number the coverage report exists
    // to make honest.
    if (isExcluded(node.key, 'artwork')) {
      excluded += 1
      continue
    }
    const designPalette = await paletteOf(page, node.urls[0])
    const renderedPalette = await paletteOf(page, image.resolvedUrl)
    const concentrationGap = Math.abs(
      (designPalette[0]?.share ?? 0) - (renderedPalette[0]?.share ?? 0)
    )
    if (concentrationGap > MAX_CONCENTRATION_GAP) {
      implausible += 1
      unbridged.push({
        node,
        why: `the image served here is a different kind of picture entirely (its dominant colour covers ${Math.round((renderedPalette[0]?.share ?? 0) * 100)}% of it against the design export's ${Math.round((designPalette[0]?.share ?? 0) * 100)}%), so this is not the design node it renders`,
      })
      continue
    }
    positions.push({
      key: node.key,
      figmaNode: node.figmaNode,
      name: node.name,
      selector: image.path,
      assetPath: image.assetPath,
      designPalette,
    })
    for (const miss of missingColours(designPalette, renderedPalette)) {
      findings.push({
        scope: `${frame.id} / artwork ${node.key}`,
        figmaNode: node.figmaNode,
        evidence: node.name ?? 'illustration',
        route: frame.route,
        theme: frame.theme,
        selector: `${image.path}  ->  ${image.assetPath}`,
        file: '(see the illustration this route serves)',
        property: 'artwork colour',
        expected: `${hex(miss.colour)} — ${Math.round(miss.colour.share * 100)}% of the artwork Figma exported for this node`,
        actual: `the served image has nothing within ${COLOUR_TOLERANCE} of it (nearest ${miss.nearest ? hex(miss.nearest) : 'nothing'}, distance ${Math.round(miss.distance)}). The illustration was recoloured, or the wrong file is being served here.`,
      })
    }
  }

  return {
    findings,
    positions,
    coverage: {
      designArtworkNodes: (frame.artworkNodes ?? []).length,
      bridgedArtworkNodes: bridged.length - implausible - excluded,
      excludedArtworkNodes: excluded,
      unbridgedArtworkNodes: unbridged.length,
    },
    unbridged,
  }
}

/**
 * The theme-paired-asset rule.
 *
 * Where the design draws a route's artwork differently in dark and light, the page must
 * serve two different files. One file used for both is a defect even when it looks right
 * in the theme it was drawn for — this is the rule that caught the light hero artwork
 * being served in dark mode.
 */
export function checkThemePairing(framesWithPositions) {
  const findings = []
  const byRoute = new Map()
  for (const entry of framesWithPositions) {
    if (!byRoute.has(entry.frame.route)) byRoute.set(entry.frame.route, [])
    byRoute.get(entry.frame.route).push(entry)
  }

  for (const [route, entries] of byRoute) {
    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const a = entries[i]
        const b = entries[j]
        if (a.frame.theme === b.frame.theme) continue
        const bySelector = new Map(b.positions.map((p) => [p.selector, p]))
        for (const left of a.positions) {
          const right = bySelector.get(left.selector)
          if (!right) continue
          const divergence = Math.max(
            paletteDistance(left.designPalette, right.designPalette),
            paletteDistance(right.designPalette, left.designPalette)
          )
          if (divergence < THEME_DIVERGENCE) continue
          if (left.assetPath !== right.assetPath) continue
          findings.push({
            scope: `${route} / artwork ${left.key}`,
            figmaNode: `${left.figmaNode} (${a.frame.theme}) vs ${right.figmaNode} (${b.frame.theme})`,
            evidence: left.name ?? 'illustration',
            route,
            theme: `${a.frame.theme} + ${b.frame.theme}`,
            selector: left.selector,
            file: '(see the component choosing this asset per theme)',
            property: 'theme-paired artwork',
            expected: `two different files — the ${a.frame.theme} and ${b.frame.theme} frames draw this artwork differently (palette distance ${Math.round(divergence)})`,
            actual: `both themes serve ${left.assetPath}. One theme's artwork is shipping into the other.`,
          })
        }
      }
    }
  }
  return findings
}
