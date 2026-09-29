/**
 * The enumerative diff.
 *
 * Every text node the design declares is matched to the rendered DOM by its own text
 * content — a natural key that needs no hand-maintained selector and therefore cannot be
 * quietly narrowed to the elements somebody remembered to list. Every property of every
 * match is then compared, and every node that failed to match, in either direction, is a
 * reported finding rather than a silent pass.
 *
 * "Nobody checked the footer" is not a state this can be in: an unmatched design node is
 * loud, and the only way to make one stop being reported is to write down why, in
 * design/figma/exclusions.json, where a reviewer sees it.
 */
import { existsSync, readFileSync } from 'node:fs'

import {
  AMBIGUITY_MARGIN_PX,
  assign,
  buildContainerIndex,
  createProjector,
  isInside,
  positionalCost,
} from './bridge.mjs'
import { FidelityError } from './errors.mjs'
import { evaluate, parseColor, formatColor } from './properties.mjs'

/** Added to an edge that breaks containment, so such a pair loses but stays reachable. */
const CONTAINMENT_PENALTY = 1e6

/** Reads the exclusion list. A missing file is a hard failure, not an empty list. */
export function loadExclusions(filePath) {
  if (!existsSync(filePath)) {
    throw new FidelityError(`design/figma/exclusions.json is missing.`, {
      hint: 'The enumerative pass needs somewhere to record what it cannot compare. An absent file would be indistinguishable from "nothing was excluded".',
    })
  }
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (err) {
    throw new FidelityError(
      `design/figma/exclusions.json is not valid JSON (${err.message}).`
    )
  }
}

/** Text is the join key, so both sides must normalise identically. */
export function normaliseKey(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u200b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Composites `colour` at `alpha` over `backdrop`, the way the compositor does. */
export function composite(colour, alpha, backdrop) {
  const fg = parseColor(colour)
  if (!fg) return null
  const bg = parseColor(backdrop) ?? { r: 255, g: 255, b: 255, a: 1 }
  const a = fg.a * (alpha ?? 1)
  return `#${[
    fg.r * a + bg.r * (1 - a),
    fg.g * a + bg.g * (1 - a),
    fg.b * a + bg.b * (1 - a),
  ]
    .map((n) => Math.round(n).toString(16).padStart(2, '0'))
    .join('')}`
}

/**
 * Properties compared on every matched text node.
 *
 * `lineHeight: "normal"` in Figma means "whatever the font metrics say", which no two
 * renderers agree on, so it is not comparable and is left out — visibly, via
 * `notComparable`, never silently.
 */
const TEXT_PROPERTIES = [
  'fontFamily',
  'fontWeight',
  'fontStyle',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'textDecorationLine',
  'textAlign',
  'color',
]

const DEFAULT_TOLERANCE = { length: 1, color: 2 }

/** How far a rendered box width may sit from the design's before it is a finding. */
const WIDTH_TOLERANCE_PX = 4

function toleranceFor(property) {
  if (property === 'color') return DEFAULT_TOLERANCE.color
  return DEFAULT_TOLERANCE.length
}

/* ------------------------------------------------------------------ */
/* exclusions                                                          */
/* ------------------------------------------------------------------ */

const MIN_REASON_LENGTH = 40

/**
 * A review may cover a subset of the frames — only the ones a change could have moved —
 * so an exclusion for a frame that was not fetched this time is not an error. An
 * exclusion for a frame the MAPPING does not declare still is: nobody would ever see it
 * apply. `knownFrameIds` is what tells those two apart; without it, every frame in the
 * inventory is the only frame that exists.
 */
export function validateExclusions(
  exclusions,
  inventory,
  { where = 'exclusions', knownFrameIds = null } = {}
) {
  const fail = (msg, hint) => {
    throw new FidelityError(`${where}: ${msg}`, { hint })
  }
  if (!exclusions || typeof exclusions !== 'object')
    fail('must be a JSON object.')
  if (!Array.isArray(exclusions.exclusions))
    fail('needs an `exclusions` array (it may be empty, but it must exist).')

  const frames = new Map(inventory.frames.map((f) => [f.id, f]))
  const declared = knownFrameIds
    ? new Set(knownFrameIds)
    : new Set(frames.keys())
  const seen = new Set()
  for (const entry of exclusions.exclusions) {
    const at = `${entry.frame}/${entry.node}`
    if (typeof entry.frame !== 'string' || !declared.has(entry.frame)) {
      fail(
        `entry ${at} names frame "${entry.frame}", which design/figma/frames.json does not declare.`
      )
    }
    if (typeof entry.node !== 'string' || !entry.node) {
      fail(`entry in frame ${entry.frame} is missing a node key.`)
    }
    if (
      typeof entry.reason !== 'string' ||
      entry.reason.trim().length < MIN_REASON_LENGTH
    ) {
      fail(
        `entry ${at} has no written reason (at least ${MIN_REASON_LENGTH} characters).`,
        'An exclusion without a reason is a silent drop wearing a config file. Say why this node cannot be compared, so a reviewer can disagree.'
      )
    }
    if (!Array.isArray(entry.properties) || entry.properties.length === 0) {
      fail(
        `entry ${at} must list the properties it excludes, or ["*"] for the whole node.`
      )
    }
    const frame = frames.get(entry.frame)
    // Not fetched for this review — there is nothing to check the node against, and
    // inventing a verdict either way would be worse than saying nothing.
    if (frame) {
      const known =
        frame.textNodes.some((n) => n.key === entry.node) ||
        frame.boxNodes.some((n) => n.key === entry.node)
      if (!known) {
        fail(
          `entry ${at} excludes a node this frame no longer contains.`,
          'The design moved and this exclusion outlived the node it was written for. Read the frame again and revisit the reason — or delete the entry.'
        )
      }
    }
    const key = `${entry.frame}::${entry.node}`
    if (seen.has(key)) fail(`duplicate exclusion for ${at}.`)
    seen.add(key)
  }
  return exclusions
}

function exclusionIndex(exclusions) {
  const map = new Map()
  for (const entry of exclusions.exclusions) {
    map.set(`${entry.frame}::${entry.node}`, entry)
  }
  return map
}

/**
 * The keys an exclusion may be written against for this node.
 *
 * A multi-line Figma layer is enumerated both whole (`I1:1533;1:579`) and line by line
 * (`I1:1533;1:579:L1`). An exclusion is written against the layer, because that is the
 * layer a reviewer sees in Figma — so it has to cover the layer's lines too. It did not,
 * and the occluded duplicate Footer in `use-cases-light` leaked thirteen findings past an
 * exclusion that named it exactly.
 */
export function exclusionKeysFor(nodeKey) {
  const keys = [nodeKey]
  const line = /^(.*):L\d+$/.exec(nodeKey)
  if (line) keys.push(line[1])
  return keys
}

function isExcluded(index, frameId, nodeKey, property) {
  for (const key of exclusionKeysFor(nodeKey)) {
    const entry = index.get(`${frameId}::${key}`)
    if (!entry) continue
    if (entry.properties.includes('*') || entry.properties.includes(property))
      return true
  }
  return false
}

/* ------------------------------------------------------------------ */
/* text matching                                                       */
/* ------------------------------------------------------------------ */

function groupBy(items, keyOf) {
  const map = new Map()
  for (const item of items) {
    const key = keyOf(item)
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return map
}

/** A whole Figma text layer, as one unit to match. */
function wholeUnit(node) {
  return {
    key: node.key,
    figmaNode: node.figmaNode,
    name: node.name,
    text: node.text,
    style: node.style,
    geometry: node.geometry ?? {},
    ancestorKeys: node.ancestorKeys ?? [],
    mixedProperties: node.mixedProperties,
    lines: node.lines,
  }
}

/**
 * The same layer read line by line.
 *
 * Figma stores "Success Stories / About / Blog" as ONE text layer while the site renders
 * three anchors, so a layer whose whole text appears nowhere is retried this way. Each
 * line carries its own position (stacked down from the layer's) and counts the layer as
 * one of its ancestors — which is what keeps a footer column's lines inside the footer
 * instead of matching the identically-worded nav links above them.
 */
function lineUnits(node) {
  return (node.lines ?? []).map((line) => ({
    key: line.key,
    figmaNode: node.figmaNode,
    name: node.name,
    text: line.text,
    style: line.style,
    geometry: line.geometry ?? node.geometry ?? {},
    ancestorKeys: [...(node.ancestorKeys ?? []), node.key],
    parentKey: node.key,
  }))
}

/**
 * A layer whose lines ALL failed to match is one missing layer, not three missing lines.
 *
 * Reporting each line separately says the same thing three times and inflates the count a
 * reader is meant to act on. Where some lines matched and others did not, the ones that
 * did not are still reported individually — that is a real difference between them.
 */
function collapseLines(unmatched, matchedParents, wholeUnits) {
  const byParent = new Map(wholeUnits.map((u) => [u.key, u]))
  const out = []
  const collapsed = new Set()
  for (const unit of unmatched) {
    const parentKey = unit.parentKey
    if (!parentKey || matchedParents.has(parentKey)) {
      out.push(unit)
      continue
    }
    const parent = byParent.get(parentKey)
    const siblings = parent?.lines?.length ?? 0
    const unmatchedSiblings = unmatched.filter(
      (u) => u.parentKey === parentKey
    ).length
    if (!parent || unmatchedSiblings < siblings) {
      out.push(unit)
      continue
    }
    if (collapsed.has(parentKey)) continue
    collapsed.add(parentKey)
    out.push(parent)
  }
  return out
}

/**
 * Matches every design text node to the rendered page.
 *
 * Unique copy is paired first and trusted. Those pairs calibrate a design-Y -> rendered-Y
 * projection and tell every design container which element on the page it became. Only
 * then is repeated copy resolved, against both — and where that still leaves a choice,
 * the pair is reported as ambiguous instead of guessed.
 */
export function matchTextNodes(
  designNodes,
  domNodes,
  { frameHeight = null, documentHeight = null } = {}
) {
  const renderedDom = domNodes.filter((d) => d.rendered && normaliseKey(d.text))
  const domByKey = groupBy(renderedDom, (d) => normaliseKey(d.text))

  const whole = designNodes.map(wholeUnit)
  // A multi-line layer falls back to its lines only when its whole text is nowhere on
  // the page. Trying the layer first is what keeps a wrapped heading one node.
  const expanded = new Set(
    whole.filter(
      (u) =>
        u.lines?.length > 1 && !(domByKey.get(normaliseKey(u.text))?.length > 0)
    )
  )
  const units = [
    ...whole.filter((u) => !expanded.has(u)),
    ...[...expanded].flatMap(lineUnits),
  ]
  const designByKey = groupBy(units, (u) => normaliseKey(u.text))

  // 1. The pairs that cannot be wrong: one in the frame, one on the page.
  const anchors = []
  for (const [key, design] of designByKey) {
    const dom = domByKey.get(key) ?? []
    if (design.length === 1 && dom.length === 1) {
      anchors.push({ design: design[0], dom: dom[0] })
    }
  }

  const project = createProjector({
    anchors: anchors.map((a) => ({
      designTop: a.design.geometry?.top,
      renderedTop: a.dom.rect.top,
    })),
    frameHeight,
    documentHeight,
  })
  const containers = buildContainerIndex(anchors)

  const matches = []
  const unmatchedDesign = []
  const unequalGroups = []
  const ambiguousPairs = []

  for (const [key, design] of designByKey) {
    const dom = domByKey.get(key) ?? []
    if (dom.length === 0) {
      unmatchedDesign.push(...design)
      continue
    }
    if (design.length !== dom.length) {
      unequalGroups.push({
        key,
        designCount: design.length,
        domCount: dom.length,
        design,
      })
    }
    if (design.length === 1 && dom.length === 1) {
      matches.push({ design: design[0], dom: dom[0] })
      continue
    }

    // 2. Containment, but only where it actually discriminates. A container whose
    //    rendered counterpart holds none of the candidates tells us nothing here, and
    //    acting on it would turn a pairing problem into a false "this text is missing".
    const constraints = design.map((d) => {
      const container = containers.containerFor(d)
      if (!container) return null
      return dom.some((c) => isInside(c, container.index)) ? container : null
    })

    const costs = design.map((d, row) =>
      dom.map((c) => {
        const base = positionalCost(d, c, project)
        const constraint = constraints[row]
        return constraint && !isInside(c, constraint.index)
          ? base + CONTAINMENT_PENALTY
          : base
      })
    )
    const assigned = assign(costs)

    const claimed = new Set()
    for (let row = 0; row < design.length; row += 1) {
      const col = assigned[row]
      if (col === undefined || col < 0) continue
      claimed.add(row)
      const chosen = costs[row][col]
      let runnerUp = Infinity
      for (let other = 0; other < dom.length; other += 1) {
        if (other === col) continue
        runnerUp = Math.min(runnerUp, costs[row][other])
      }
      // The other direction matters just as much: two design nodes that fit the SAME
      // element equally well are not resolved by whichever one the assignment reached
      // first. Only checking the runner-up candidate leaves that coin flip in place.
      let contested = false
      for (let other = 0; other < design.length; other += 1) {
        if (other === row) continue
        if (Math.abs(costs[other][col] - chosen) < AMBIGUITY_MARGIN_PX) {
          contested = true
          break
        }
      }
      const constraint = constraints[row]
      const breaksContainment =
        constraint && !isInside(dom[col], constraint.index)
      const tooClose =
        Number.isFinite(runnerUp) && runnerUp - chosen < AMBIGUITY_MARGIN_PX
      if (breaksContainment || tooClose || contested) {
        ambiguousPairs.push({
          design: design[row],
          candidates: dom,
          why: breaksContainment
            ? `the design puts this inside ${constraint.key}, and nothing carrying this text renders inside the element that container became`
            : contested
              ? `another design node carrying this text is drawn just as close to the same element, so which of them it is cannot be decided`
              : `two rendered elements are within ${AMBIGUITY_MARGIN_PX}px of where the design puts this node, so which one it is cannot be decided`,
        })
        continue
      }
      matches.push({ design: design[row], dom: dom[col] })
    }
    // Design units the group could not seat at all. The group-size finding above already
    // says the page renders fewer of these than the design draws, so this is not
    // reported a second time as "missing".
    for (let row = 0; row < design.length; row += 1) {
      if (!claimed.has(row)) unmatchedDesign.push(design[row])
    }
  }

  const matchedParents = new Set(
    matches.map((m) => m.design.parentKey).filter(Boolean)
  )
  const seatedByCount = new Set(
    unequalGroups.flatMap((g) => g.design.map((d) => d.key))
  )
  const stillUnmatched = collapseLines(
    unmatchedDesign.filter(
      (u) => !matchedParents.has(u.key) && !seatedByCount.has(u.key)
    ),
    matchedParents,
    whole
  )

  const matchedDom = new Set(matches.map((m) => m.dom.i))
  const matchedTexts = new Set(matches.map((m) => normaliseKey(m.design.text)))
  const unmatchedDom = renderedDom.filter((node) => {
    if (matchedDom.has(node.i)) return false
    const key = normaliseKey(node.text)
    // Text that is part of a node already matched (an inline <strong> inside a matched
    // paragraph, or a wrapper around a matched line) is not an unmatched node; it is a
    // fragment of one.
    for (const matched of matchedTexts) {
      if (matched !== key && (matched.includes(key) || key.includes(matched)))
        return false
    }
    return true
  })

  return {
    matches,
    unmatchedDesign: stillUnmatched,
    unmatchedDom,
    ambiguous: unequalGroups,
    ambiguousPairs,
    anchorCount: anchors.length,
    project,
    containers,
    lineMatchedNodes: matchedParents.size,
  }
}

/* ------------------------------------------------------------------ */
/* box matching (geometry-bridged)                                     */
/* ------------------------------------------------------------------ */

function contains(box, node) {
  const { left, top, width, height } = box.geometry
  if (left === undefined || top === undefined) return false
  if (node.geometry.top === undefined || node.geometry.left === undefined)
    return false
  return (
    node.geometry.left >= left - 1 &&
    node.geometry.top >= top - 1 &&
    node.geometry.left <= left + (width ?? 0) + 1 &&
    node.geometry.top <= top + (height ?? 0) + 1
  )
}

/** How far a candidate is from where the design draws the box, horizontally. */
const CONTAINMENT_LEFT_TOLERANCE = 32
const CONTAINMENT_TOP_TOLERANCE = 64
const GEOMETRIC_LEFT_TOLERANCE = 12
const GEOMETRIC_WIDTH_TOLERANCE = 12
const GEOMETRIC_TOP_TOLERANCE = 48

function boxFit(box, record, project, { useWidth }) {
  const predictedTop = project(box.geometry.top)
  const dLeft = Math.abs(record.rect.left - box.geometry.left)
  const dTop =
    predictedTop === null || predictedTop === undefined
      ? 0
      : Math.abs(record.rect.top - predictedTop)
  const dWidth =
    useWidth && box.geometry.width !== undefined
      ? Math.abs(record.rect.width - box.geometry.width)
      : 0
  // How tall the design says it is, put through the same projection as its top. A 2px
  // rule across the top of the footer and the 200px footer itself start at the same
  // place and have the same width; only the height tells them apart, and without it the
  // rule's colour was compared against the band below it.
  const predictedBottom =
    box.geometry.height === undefined
      ? null
      : project(box.geometry.top + box.geometry.height)
  const predictedHeight =
    predictedBottom === null || predictedTop === null
      ? null
      : predictedBottom - predictedTop
  const dHeight =
    predictedHeight === null
      ? 0
      : Math.abs(record.rect.height - predictedHeight)
  return {
    dLeft,
    dTop,
    dWidth,
    dHeight,
    heightAllowance:
      predictedHeight === null ? Infinity : Math.max(48, predictedHeight * 0.5),
    score: dLeft + dTop + dWidth,
  }
}

/** True when one of the two records is an ancestor of the other. */
function nested(a, b) {
  return (
    (a.ancestors ?? []).includes(b.i) ||
    (b.ancestors ?? []).includes(a.i) ||
    a.i === b.i
  )
}

/**
 * A box has no text of its own, so it has no natural key. Two bridges are tried, and a
 * box that neither reaches is reported as unreached rather than bridged to whatever was
 * nearest — a footer fill compared against <body>, or a 24px radius compared against the
 * contact form, are worse than an honest gap.
 *
 *  1. **Through the text it encloses.** The design text nodes inside the box landed
 *     somewhere; their shared DOM ancestors are the elements that could be this box. The
 *     one whose position matches the design's wins, not simply the nearest — nearest is
 *     how a full-width band ended up compared against <body>.
 *  2. **Through geometry alone**, for a box that encloses no text at all: same left, same
 *     width, and a top where the anchors say it should be. It must be the only such
 *     element, or the box stays unreached.
 */
export function matchBoxNodes(boxNodes, textMatches, domRecords, context = {}) {
  const { project = (y) => y } = context
  const byIndex = new Map(domRecords.map((r) => [r.i, r]))
  const rendered = domRecords.filter(
    (r) => r.rendered && r.rect.width > 0 && r.rect.height > 0
  )
  const matched = []
  const unmatched = []

  for (const box of boxNodes) {
    if (box.geometry?.left === undefined || box.geometry?.top === undefined) {
      unmatched.push({ box, why: 'the design gives it no resolvable position' })
      continue
    }

    const inside = textMatches.filter((m) => contains(box, m.design))
    let bridged = null
    let via = null

    if (inside.length) {
      // The element itself counts, not only its ancestors. A pill, a badge or a button is
      // one design box around one piece of copy, and the element that owns the copy IS
      // the surface — excluding it left every CTA in the design unbridged.
      const ancestorSets = inside.map((m) => [m.dom.i, ...m.dom.ancestors])
      const [first, ...rest] = ancestorSets
      const shared = first
        .filter((i) => rest.every((set) => set.includes(i)))
        .map((i) => byIndex.get(i))
        .filter(Boolean)
      // Width is deliberately NOT part of the fit here: the text containment is what
      // anchors this bridge, which leaves the width free to be compared as a value.
      const scored = shared
        .map((record) => ({
          record,
          ...boxFit(box, record, project, { useWidth: false }),
        }))
        .filter(
          (c) =>
            c.dLeft <= CONTAINMENT_LEFT_TOLERANCE &&
            c.dTop <= CONTAINMENT_TOP_TOLERANCE &&
            c.dHeight <= c.heightAllowance
        )
        // Ties go to the deepest: the element that paints a surface sits closer to the
        // copy inside it than <body> does, and "nearest recorded ancestor, fit be damned"
        // is how a footer band came to be compared against <body>.
        .sort(
          (a, b) =>
            a.score - b.score ||
            (b.record.ancestors?.length ?? 0) -
              (a.record.ancestors?.length ?? 0)
        )
      if (scored.length) {
        // Same rule as below: of the candidates that fit alike, the one that actually
        // paints is the one a fill was drawn on. `<body>` encloses every piece of copy on
        // the page and paints nothing, so it fits every full-page artboard perfectly and
        // reports the page as white.
        const close = scored.filter((c) => c.score <= scored[0].score + 32)
        const painting = close.filter(
          (c) => (parseColor(c.record.backgroundColor)?.a ?? 0) > 0
        )
        bridged = (painting[0] ?? close[0]).record
        via = 'text'
      }
    }

    if (!bridged) {
      const scored = rendered
        .map((record) => ({
          record,
          ...boxFit(box, record, project, { useWidth: true }),
        }))
        .filter(
          (c) =>
            c.dLeft <= GEOMETRIC_LEFT_TOLERANCE &&
            c.dWidth <= GEOMETRIC_WIDTH_TOLERANCE &&
            c.dTop <= GEOMETRIC_TOP_TOLERANCE &&
            c.dHeight <= c.heightAllowance
        )
        .sort((a, b) => a.score - b.score)
      if (scored.length) {
        // Wrappers and the element they wrap share a rect. That is not an ambiguity —
        // the outermost of a nested run is the one that paints the surface. Two
        // equally good candidates that are NOT nested genuinely are one, and the box
        // is left unreached rather than assigned to a coin flip.
        const best = scored[0]
        const ties = scored.filter((c) => c.score <= best.score + 2)
        const rival = ties.find((c) => !nested(c.record, best.record))
        if (rival) {
          unmatched.push({
            box,
            why: `two elements fit it equally well (${best.record.path} and ${rival.record.path}), so which one it is cannot be decided`,
            ambiguous: true,
          })
          continue
        }
        // Of a nested run that fits equally, the one that actually paints is the one the
        // design means. `<body>` fits every full-bleed band on the page and paints
        // nothing; the wrapper one level in carries the theme's background, and
        // comparing the design's band against <body> reported the page as white.
        const painting = ties.filter(
          (c) => (parseColor(c.record.backgroundColor)?.a ?? 0) > 0
        )
        const pool = painting.length ? painting : ties
        bridged = pool.reduce((outermost, c) =>
          (c.record.ancestors?.length ?? 0) <
          (outermost.record.ancestors?.length ?? 0)
            ? c
            : outermost
        ).record
        via = 'geometry'
      }
    }

    if (!bridged) {
      unmatched.push({
        box,
        why: inside.length
          ? 'nothing rendering its contents sits where the design draws it'
          : 'no rendered element sits where the design draws it',
      })
      continue
    }
    matched.push({ box, dom: bridged, via })
  }
  return { matched, unmatched }
}

/* ------------------------------------------------------------------ */
/* diffing                                                             */
/* ------------------------------------------------------------------ */

function push(findings, base, property, expected, actual) {
  findings.push({ ...base, property, expected, actual })
}

export function diffFrame({ frame, dom, exclusions }) {
  const index = exclusionIndex(exclusions)
  const findings = []
  const notComparable = []

  // A node excluded wholesale is not merely a node whose findings are suppressed: it does
  // not take part in the matching at all. `use-cases-light` carries two Footer layers on
  // top of each other, one of them fully occluded and excluded for exactly that reason —
  // and while the occluded one still competed for elements, the VISIBLE footer's links
  // became unpairable, because two design nodes claimed the same place on the page.
  const textNodes = frame.textNodes.filter(
    (n) => !isExcluded(index, frame.id, n.key, '*')
  )
  const boxNodes = frame.boxNodes.filter(
    (n) => !isExcluded(index, frame.id, n.key, '*')
  )

  const text = matchTextNodes(textNodes, dom.texts, {
    frameHeight: frame.frameHeight,
    documentHeight: dom.documentHeight,
  })
  // Coverage is counted in design NODES, the same unit the denominator uses. A node
  // matched through its lines counts once, not once per line, so the percentage cannot
  // drift above what it really covers.
  const matchedNodeKeys = new Set(
    text.matches.map((m) => m.design.parentKey ?? m.design.key)
  )

  for (const { design, dom: rendered } of text.matches) {
    const base = {
      scope: `${frame.id} / text ${design.key}`,
      figmaNode: design.figmaNode,
      evidence: design.name ?? design.text.slice(0, 48),
      route: frame.route,
      theme: frame.theme,
      selector: rendered.path,
      file: '(see the component rendering this copy)',
    }
    for (const property of TEXT_PROPERTIES) {
      if (isExcluded(index, frame.id, design.key, property)) continue
      if (design.mixedProperties?.includes(property)) {
        notComparable.push(
          `${design.key} ${property}: the Figma text node mixes values within itself, so there is no single design value to assert.`
        )
        continue
      }
      const expected = design.style[property]
      if (expected === undefined) continue
      if (property === 'lineHeight' && expected === 'normal') {
        notComparable.push(
          `${design.key} lineHeight: Figma says "normal" (font metrics), which no two renderers resolve identically.`
        )
        continue
      }
      const failure = evaluate(
        property,
        expected,
        rendered,
        toleranceFor(property === 'color' ? 'color' : 'length')
      )
      if (failure)
        push(findings, base, property, failure.expected, failure.actual)
    }
  }

  for (const node of text.unmatchedDesign) {
    // `text` and not `*`: an entry that excludes only the string ("this copy is a
    // person's name from the CMS") has to suppress the finding that the string is
    // nowhere on the page, or it suppresses nothing at all and reads as if it did.
    if (isExcluded(index, frame.id, node.key, 'text')) continue
    findings.push({
      scope: `${frame.id} / text ${node.key}`,
      figmaNode: node.figmaNode,
      evidence: node.name ?? undefined,
      route: frame.route,
      theme: frame.theme,
      selector: '(no element on the page carries this text)',
      file: '(see the component that should render it)',
      property: 'presence',
      expected: `text "${node.text}"`,
      actual:
        'nothing on the rendered page has this text. Either it is missing, its copy differs, or it belongs in design/figma/exclusions.json with a written reason.',
    })
  }

  // A pair the matcher could not decide is reported AS the ambiguity. Guessing and then
  // reporting the guess's properties is what produced a report claiming the hero CTA was
  // 18px/amber and the header 20px/white — a clean swap of two elements that both
  // rendered exactly as designed.
  for (const entry of text.ambiguousPairs) {
    if (isExcluded(index, frame.id, entry.design.key, 'pairing')) continue
    findings.push({
      scope: `${frame.id} / text ${entry.design.key}`,
      figmaNode: entry.design.figmaNode,
      evidence: entry.design.name ?? entry.design.text.slice(0, 48),
      route: frame.route,
      theme: frame.theme,
      selector: entry.candidates.map((c) => c.path).join('   |   '),
      file: '(see the components rendering this copy)',
      property: 'pairing',
      expected: `one element carrying "${entry.design.text.slice(0, 60)}"`,
      actual: `${entry.candidates.length} candidates and no way to choose — ${entry.why}. Nothing about this node was compared; disambiguate it in the markup or exclude it with a reason.`,
    })
  }

  for (const entry of text.ambiguous) {
    findings.push({
      scope: `${frame.id} / text "${entry.key.slice(0, 40)}"`,
      figmaNode: entry.design.map((d) => d.figmaNode).join(', '),
      route: frame.route,
      theme: frame.theme,
      selector: '(repeated copy)',
      file: '(see the components rendering this copy)',
      property: 'occurrences',
      expected: `${entry.designCount} node(s) with this text`,
      actual: `${entry.domCount} rendered element(s) — the extra or missing one is the finding.`,
    })
  }

  // Boxes: fill, border and radius, with element opacity composited onto fill and border
  // BEFORE comparison. Comparing a raw fill against a dimmed rendering is what made a
  // 41%-opacity card outline look correct while it rendered fully opaque.
  const boxes = matchBoxNodes(
    boxNodes,
    text.matches,
    dom.boxes.concat(dom.texts),
    { project: text.project }
  )
  for (const { box, dom: rendered, via } of boxes.matched) {
    const base = {
      scope: `${frame.id} / box ${box.key}`,
      figmaNode: box.figmaNode,
      evidence: box.name ?? undefined,
      route: frame.route,
      theme: frame.theme,
      selector: rendered.path,
      file: '(see the component rendering this surface)',
    }
    if (!isExcluded(index, frame.id, box.key, 'fill')) {
      const expected = composite(box.effectiveFill, box.opacity, box.backdrop)
      if (expected && rendered.compositedBackgroundColor) {
        const failure = evaluate(
          'compositedBackgroundColor',
          expected,
          rendered,
          DEFAULT_TOLERANCE.color
        )
        if (failure)
          push(
            findings,
            base,
            'fill (opacity composited)',
            failure.expected,
            failure.actual
          )
      }
    }
    if (
      box.borderColor &&
      !isExcluded(index, frame.id, box.key, 'borderColor')
    ) {
      const expected = composite(box.borderColor, box.opacity, box.backdrop)
      if (!rendered.compositedBorderColor) {
        push(
          findings,
          base,
          'borderColor (opacity composited)',
          formatColor(expected),
          'the rendered element draws no border at all'
        )
      } else {
        const failure = evaluate(
          'compositedBorderColor',
          expected,
          rendered,
          DEFAULT_TOLERANCE.color
        )
        if (failure)
          push(
            findings,
            base,
            'borderColor (opacity composited)',
            failure.expected,
            failure.actual
          )
      }
    }
    if (
      box.borderWidth &&
      box.borderColor &&
      rendered.compositedBorderColor &&
      !isExcluded(index, frame.id, box.key, 'borderWidth')
    ) {
      const failure = evaluate(
        'borderWidth',
        box.borderWidth,
        rendered,
        DEFAULT_TOLERANCE.length
      )
      if (failure)
        push(findings, base, 'borderWidth', failure.expected, failure.actual)
    }
    if (
      box.borderRadius &&
      !isExcluded(index, frame.id, box.key, 'borderRadius')
    ) {
      const failure = evaluate(
        'borderRadius',
        box.borderRadius,
        rendered,
        DEFAULT_TOLERANCE.length
      )
      if (failure)
        push(findings, base, 'borderRadius', failure.expected, failure.actual)
    }
    // Width is only asserted on a box that was bridged through the text it encloses.
    // The geometric bridge finds its candidate BY width, so comparing it there would be
    // a tautology dressed up as a check.
    if (
      via === 'text' &&
      box.geometry.width !== undefined &&
      !isExcluded(index, frame.id, box.key, 'width')
    ) {
      const failure = evaluate(
        'width',
        `${box.geometry.width}px`,
        { width: `${rendered.rect.width}px` },
        // Looser than a typographic length. A pill sized by its own label lands within a
        // few pixels of the frame on any two font stacks, and reporting that is reporting
        // the font renderer. The card that is 385px against a designed 400px still is.
        WIDTH_TOLERANCE_PX
      )
      if (failure)
        push(findings, base, 'width', failure.expected, failure.actual)
    }
  }

  // Gaps the design draws between stacked copy.
  const domByDesignKey = new Map(text.matches.map((m) => [m.design.key, m.dom]))
  for (const gap of frame.gaps) {
    if (isExcluded(index, frame.id, gap.from, 'gap')) continue
    const from = domByDesignKey.get(gap.from)
    const to = domByDesignKey.get(gap.to)
    if (!from || !to) continue
    const rendered =
      gap.kind === 'top-to-top'
        ? to.rect.top - from.rect.top
        : to.rect.top - (from.rect.top + from.rect.height)
    const failure = evaluate(
      'gapBetween',
      gap.gap,
      { gapBetween: `${Math.round(rendered)}px` },
      2
    )
    if (failure) {
      findings.push({
        scope: `${frame.id} / gap ${gap.from} → ${gap.to}`,
        figmaNode: `${gap.from} → ${gap.to}`,
        route: frame.route,
        theme: frame.theme,
        selector: `${from.path}  →  ${to.path}`,
        file: '(see the component that stacks these two)',
        property:
          gap.kind === 'top-to-top'
            ? 'vertical gap (top to top)'
            : 'vertical gap',
        expected: failure.expected,
        actual: failure.actual,
      })
    }
  }

  // Artwork is NOT compared here. It used to be: the frame's exported vectors were read
  // for fill colours and the page's SVG elements for theirs, and a colour the design used
  // that no SVG on the page painted with was a finding. Our illustrations ship as WebP,
  // so that check never once looked inside one — all fourteen of its findings on the last
  // full run were the same non-finding, while a genuinely orange illustration in a frame
  // that draws #ffb31b went unnoticed. It lives in artwork.mjs now, where the rendered
  // image is actually fetched and its palette compared.

  return {
    findings,
    notComparable,
    coverage: {
      designTextNodes: textNodes.length,
      matchedTextNodes: matchedNodeKeys.size,
      matchedTextUnits: text.matches.length,
      unmatchedDesignTextNodes: text.unmatchedDesign.length,
      unmatchedRenderedTextNodes: text.unmatchedDom.length,
      ambiguousTextGroups: text.ambiguous.length,
      designBoxNodes: boxNodes.length,
      artworkLayerNodes: frame.artworkLayerCount ?? 0,
      matchedBoxNodes: boxes.matched.length,
      unmatchedBoxNodes: boxes.unmatched.length,
      designGaps: frame.gaps.length,
      comparedGaps: frame.gaps.filter(
        (g) => domByDesignKey.has(g.from) && domByDesignKey.has(g.to)
      ).length,
      ambiguousPairings: text.ambiguousPairs.length,
      anchors: text.anchorCount,
      excluded: exclusions.exclusions.filter((e) => e.frame === frame.id)
        .length,
    },
    unmatchedDom: text.unmatchedDom,
    unmatchedBoxes: boxes.unmatched,
    project: text.project,
  }
}
