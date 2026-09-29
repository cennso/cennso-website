/**
 * How a design node is paired with the element that renders it.
 *
 * Text content alone is not a key, and believing it was is what made the first full run
 * of this harness 43% noise. "Book demo" is in the Header *and* in the hero; "Success
 * Stories" and "Documentation" are in the nav *and* in the footer; `/contact` renders two
 * partner blocks, so "Send", the address and "Privacy Policy" each appear twice. Pairing
 * those by text and then sorting by vertical position paired the design's footer against
 * the page's nav and swapped the two CTAs — and then reported both swapped values as
 * defects, when direct measurement showed both rendered exactly as designed.
 *
 * So pairing here uses three things, in this order:
 *
 *  1. **Unique copy first.** A text that appears once in the frame and once on the page
 *     cannot be cross-paired. Those pairs are `anchors`, and they are trusted.
 *  2. **Position, projected through the anchors.** The artboard and the page are never
 *     the same height, so a design Y cannot be compared with a rendered Y directly. The
 *     anchors give a monotone design-Y → rendered-Y map, fitted to this very page, and
 *     everything ambiguous is placed through it. Horizontally the two sides share a scale
 *     (the frames are drawn at the viewport width), so X is compared as-is.
 *  3. **Containment.** The design tree says which container a node came from. The anchors
 *     inside that container say which element on the page that container became. A node
 *     from the Footer symbol may then only pair with something inside the page's footer.
 *
 * And when those three still leave more than one plausible element, the pair is NOT
 * guessed: it is reported as an ambiguity, in its own right. A wrong pairing is worse
 * than an admitted one — the wrong one costs a reader the trust they need to act on the
 * other findings.
 */

/** How much closer the winner must be than the runner-up, in rendered pixels. */
export const AMBIGUITY_MARGIN_PX = 24

/** Fewest anchors a design container needs before its rendered counterpart is believed. */
const MIN_ANCHORS_FOR_CONTAINER = 2

/* ------------------------------------------------------------------ */
/* vertical projection                                                 */
/* ------------------------------------------------------------------ */

/**
 * A monotone design-Y → rendered-Y map, fitted from the pairs that cannot be wrong.
 *
 * Between two anchors it interpolates; outside them it continues the nearest segment's
 * slope. With fewer than two anchors it falls back to the frame-height/document-height
 * ratio, which is the best the two sides share. It is deliberately not a global linear
 * fit: a page is stretched unevenly against its artboard (one section grows, another
 * does not), and a piecewise fit follows that where a single slope cannot.
 */
export function createProjector({
  anchors = [],
  frameHeight = null,
  documentHeight = null,
}) {
  const points = anchors
    .filter(
      (a) => Number.isFinite(a.designTop) && Number.isFinite(a.renderedTop)
    )
    .sort((a, b) => a.designTop - b.designTop)

  // Collapse anchors that share a design Y, so the map stays a function.
  const knots = []
  for (const point of points) {
    const last = knots[knots.length - 1]
    if (last && Math.abs(last.designTop - point.designTop) < 0.5) {
      last.renderedTop = Math.min(last.renderedTop, point.renderedTop)
      continue
    }
    knots.push({ ...point })
  }
  // Keep it monotone, by keeping the LONGEST run that already is.
  //
  // Taking them greedily from the top lets one bad anchor poison everything after it: a
  // design node the parser could not place resolves to y=0, pairs with an element 2,200px
  // down the page, and every real anchor below then looks like it moves backwards and is
  // dropped. The longest non-decreasing subsequence discards the outlier instead of the
  // twenty good readings that disagree with it.
  const monotone = longestNonDecreasing(knots)

  const ratio =
    frameHeight && documentHeight && frameHeight > 0
      ? documentHeight / frameHeight
      : 1

  const project = (designY) => {
    if (!Number.isFinite(designY)) return null
    if (monotone.length === 0) return designY * ratio
    if (monotone.length === 1) {
      return monotone[0].renderedTop + (designY - monotone[0].designTop) * ratio
    }
    // Outside the anchors the overall slope is used, not the nearest segment's: two
    // adjacent anchors can sit at the same rendered Y (two labels on one line), and
    // continuing THAT slope projects every node beyond them onto a single point.
    const outer = slopeOf(monotone[0], monotone[monotone.length - 1], ratio)
    if (designY <= monotone[0].designTop) {
      return monotone[0].renderedTop + (designY - monotone[0].designTop) * outer
    }
    const last = monotone[monotone.length - 1]
    if (designY >= last.designTop) {
      return last.renderedTop + (designY - last.designTop) * outer
    }
    for (let i = 0; i < monotone.length - 1; i += 1) {
      const a = monotone[i]
      const b = monotone[i + 1]
      if (designY >= a.designTop && designY <= b.designTop) {
        const slope = slopeOf(a, b, ratio)
        return a.renderedTop + (designY - a.designTop) * slope
      }
    }
    return designY * ratio
  }

  project.anchorCount = monotone.length
  project.ratio = ratio
  return project
}

/** The longest subsequence whose rendered tops never go backwards. */
export function longestNonDecreasing(knots) {
  if (knots.length < 2) return [...knots]
  const best = new Array(knots.length).fill(1)
  const prev = new Array(knots.length).fill(-1)
  let bestEnd = 0
  for (let i = 1; i < knots.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (
        knots[j].renderedTop <= knots[i].renderedTop &&
        best[j] + 1 > best[i]
      ) {
        best[i] = best[j] + 1
        prev[i] = j
      }
    }
    if (best[i] > best[bestEnd]) bestEnd = i
  }
  const out = []
  for (let i = bestEnd; i !== -1; i = prev[i]) out.unshift(knots[i])
  return out
}

function slopeOf(a, b, fallback) {
  const run = b.designTop - a.designTop
  if (!run) return fallback
  return (b.renderedTop - a.renderedTop) / run
}

/* ------------------------------------------------------------------ */
/* containment                                                         */
/* ------------------------------------------------------------------ */

/** The nearest DOM element that contains every one of `records`. */
export function domLowestCommonAncestor(records) {
  if (!records.length) return null
  const chains = records.map((r) => [r.i, ...(r.ancestors ?? [])])
  const [first, ...rest] = chains
  for (const candidate of first) {
    if (rest.every((chain) => chain.includes(candidate))) return candidate
  }
  return null
}

export function isInside(record, ancestorIndex) {
  if (ancestorIndex === null || ancestorIndex === undefined) return true
  return (
    record.i === ancestorIndex ||
    (record.ancestors ?? []).includes(ancestorIndex)
  )
}

/**
 * For every design node, which rendered element its container became.
 *
 * Walks the design node's own ancestry from the nearest container outwards and stops at
 * the first one that holds enough anchors to say where it landed. That is what makes
 * "the Footer symbol's children must be inside the page's footer" a rule the matcher can
 * apply, rather than a sentence in a README.
 */
export function buildContainerIndex(anchorPairs) {
  const byAncestor = new Map()
  for (const pair of anchorPairs) {
    for (const key of pair.design.ancestorKeys ?? []) {
      if (!byAncestor.has(key)) byAncestor.set(key, [])
      byAncestor.get(key).push(pair)
    }
  }
  const resolved = new Map()
  return {
    /** The DOM element index a design node must sit inside, or null when unknown. */
    containerFor(designNode) {
      const ancestry = designNode.ancestorKeys ?? []
      for (let i = ancestry.length - 1; i >= 0; i -= 1) {
        const key = ancestry[i]
        const pairs = (byAncestor.get(key) ?? []).filter(
          (p) => p.design.key !== designNode.key
        )
        if (pairs.length < MIN_ANCHORS_FOR_CONTAINER) continue
        if (!resolved.has(key)) {
          resolved.set(key, domLowestCommonAncestor(pairs.map((p) => p.dom)))
        }
        const lca = resolved.get(key)
        if (lca !== null && lca !== undefined) return { key, index: lca }
      }
      return null
    },
  }
}

/* ------------------------------------------------------------------ */
/* assignment                                                          */
/* ------------------------------------------------------------------ */

/**
 * Minimum-cost one-to-one assignment over a small cost matrix.
 *
 * Groups here are tiny (a handful of repeats of one string), so an exact search is
 * affordable and worth having: a greedy pass can pair A→1 and then be forced to pair
 * B→3 when A→2, B→1 was cheaper overall, and "cheaper overall" is the difference between
 * pairing the nav against the nav and pairing the nav against the footer.
 */
export function assign(costs) {
  const rows = costs.length
  if (!rows) return []
  const cols = costs[0].length
  if (!cols) return []
  const limit = Math.min(rows, cols)

  if (rows <= 7 && cols <= 7) {
    let best = null
    const used = new Array(cols).fill(false)
    const current = new Array(rows).fill(-1)
    const search = (row, total) => {
      if (best !== null && total >= best.total) return
      if (row === rows) {
        best = { total, pairs: [...current] }
        return
      }
      for (let col = 0; col < cols; col += 1) {
        if (used[col]) continue
        used[col] = true
        current[row] = col
        search(row + 1, total + costs[row][col])
        used[col] = false
        current[row] = -1
      }
      // A row may be left unassigned when there are fewer columns than rows.
      if (cols < rows) {
        current[row] = -1
        search(row + 1, total)
      }
    }
    search(0, 0)
    return best ? best.pairs : []
  }

  // Bigger groups fall back to best-first greedy, which is good enough at that size and
  // cannot blow up. It is reported through the same ambiguity rules either way.
  const edges = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) edges.push({ r, c, cost: costs[r][c] })
  }
  edges.sort((a, b) => a.cost - b.cost)
  const takenRows = new Set()
  const takenCols = new Set()
  const pairs = new Array(rows).fill(-1)
  for (const edge of edges) {
    if (takenRows.size === limit) break
    if (takenRows.has(edge.r) || takenCols.has(edge.c)) continue
    pairs[edge.r] = edge.c
    takenRows.add(edge.r)
    takenCols.add(edge.c)
  }
  return pairs
}

/* ------------------------------------------------------------------ */
/* cost                                                                */
/* ------------------------------------------------------------------ */

/**
 * How far the element is from where the design puts the node, in rendered pixels.
 *
 * Vertical distance goes through the projector; horizontal distance does not, because the
 * frames are drawn at the viewport width and X therefore already shares a scale. X is
 * weighted at half, since a page reflows horizontally within a container far more readily
 * than it moves a whole section up or down.
 */
export function positionalCost(designNode, domRecord, project) {
  const geometry = designNode.geometry ?? {}
  let cost = 0
  const predictedTop = project(geometry.top)
  if (predictedTop !== null && predictedTop !== undefined) {
    cost += Math.abs(predictedTop - domRecord.rect.top)
  }
  if (Number.isFinite(geometry.left)) {
    cost += 0.5 * Math.abs(geometry.left - domRecord.rect.left)
  }
  return cost
}
