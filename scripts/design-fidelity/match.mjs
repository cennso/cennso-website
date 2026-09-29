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

import { FidelityError } from './errors.mjs'
import { evaluate, parseColor, formatColor } from './properties.mjs'

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

function isExcluded(index, frameId, nodeKey, property) {
  const entry = index.get(`${frameId}::${nodeKey}`)
  if (!entry) return false
  return entry.properties.includes('*') || entry.properties.includes(property)
}

/* ------------------------------------------------------------------ */
/* text matching                                                       */
/* ------------------------------------------------------------------ */

/**
 * Groups both sides by normalised text and pairs them.
 *
 * Repeated copy — "Book demo" in the nav and in the hero, "Resources" in the nav and in
 * the footer — is paired top-to-bottom by vertical position, which is the only ordering
 * both sides genuinely share. A group whose sides are different sizes is not guessed at:
 * it is reported, because that IS the finding (a nav item missing, a label rendered twice).
 */
function pairByText(designUnits, domNodes) {
  const designByKey = new Map()
  for (const node of designUnits) {
    const key = normaliseKey(node.text)
    if (!key) continue
    if (!designByKey.has(key)) designByKey.set(key, [])
    designByKey.get(key).push(node)
  }
  const domByKey = new Map()
  for (const node of domNodes) {
    const key = normaliseKey(node.text)
    if (!key) continue
    if (!domByKey.has(key)) domByKey.set(key, [])
    domByKey.get(key).push(node)
  }

  const matches = []
  const unmatchedDesign = []
  const ambiguous = []

  for (const [key, design] of designByKey) {
    const dom = (domByKey.get(key) ?? []).filter((d) => d.rendered)
    if (dom.length === 0) {
      unmatchedDesign.push(...design)
      continue
    }
    const sortedDesign = [...design].sort(
      (a, b) => (a.geometry?.top ?? 0) - (b.geometry?.top ?? 0)
    )
    const sortedDom = [...dom].sort((a, b) => a.rect.top - b.rect.top)
    if (sortedDesign.length !== sortedDom.length) {
      ambiguous.push({
        key,
        designCount: sortedDesign.length,
        domCount: sortedDom.length,
        design: sortedDesign,
      })
    }
    const pairs = Math.min(sortedDesign.length, sortedDom.length)
    for (let i = 0; i < pairs; i += 1) {
      matches.push({ design: sortedDesign[i], dom: sortedDom[i] })
    }
    unmatchedDesign.push(...sortedDesign.slice(pairs))
  }
  return { matches, unmatchedDesign, ambiguous }
}

/**
 * Matches every design text node to the rendered page.
 *
 * Pass 1 pairs whole text nodes. Pass 2 retries the ones that did not match using their
 * per-line breakdown, because Figma stores "Success Stories / About / Blog" as ONE text
 * layer while the site renders three anchors. Without pass 2 a whole footer column would
 * sit in the unmatched column forever and the real signal would drown in it.
 */
export function matchTextNodes(designNodes, domNodes) {
  const first = pairByText(designNodes, domNodes)
  const usedDom = new Set(first.matches.map((m) => m.dom.i))

  const retryable = first.unmatchedDesign.filter((n) => n.lines?.length > 1)
  const lineUnits = retryable.flatMap((node) =>
    node.lines.map((line) => ({
      key: line.key,
      figmaNode: node.figmaNode,
      name: node.name,
      parentKey: node.key,
      text: line.text,
      style: line.style,
      geometry: node.geometry,
    }))
  )
  const second = pairByText(
    lineUnits,
    domNodes.filter((d) => !usedDom.has(d.i))
  )

  const matchedParents = new Set(
    second.matches.map((m) => m.design.parentKey).filter(Boolean)
  )
  const stillUnmatched = first.unmatchedDesign.filter(
    (n) => !matchedParents.has(n.key)
  )

  const matches = [...first.matches, ...second.matches]
  const matchedDom = new Set(matches.map((m) => m.dom.i))
  const matchedTexts = new Set(matches.map((m) => normaliseKey(m.design.text)))
  const unmatchedDom = domNodes.filter((node) => {
    if (matchedDom.has(node.i)) return false
    if (!node.rendered) return false
    const key = normaliseKey(node.text)
    if (!key) return false
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
    ambiguous: [...first.ambiguous, ...second.ambiguous],
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

/**
 * A box has no text of its own, so it has no natural key. It is bridged through the text
 * it encloses: take the design text nodes geometrically inside it, find where those
 * landed in the DOM, and walk up to the nearest painted ancestor they share. Where that
 * bridge cannot be built the box is reported as unmatched — never assumed correct.
 */
export function matchBoxNodes(boxNodes, textMatches, domRecords) {
  const byIndex = new Map(domRecords.map((r) => [r.i, r]))
  const matched = []
  const unmatched = []

  for (const box of boxNodes) {
    const inside = textMatches.filter((m) => contains(box, m.design))
    if (!inside.length) {
      unmatched.push({ box, why: 'no design text node sits inside it' })
      continue
    }
    const ancestorSets = inside.map((m) => m.dom.ancestors)
    const [first, ...rest] = ancestorSets
    const shared = first.filter((i) => rest.every((set) => set.includes(i)))
    // The nearest ancestor shared by everything the box contains, that the collector
    // actually recorded. Nearest wins: the element that paints the surface sits closer to
    // the copy than <body> does.
    const painted = shared.map((i) => byIndex.get(i)).find(Boolean)
    if (!painted) {
      unmatched.push({
        box,
        why: 'the elements rendering its contents share no painted ancestor',
      })
      continue
    }
    matched.push({ box, dom: painted })
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

  const text = matchTextNodes(frame.textNodes, dom.texts)
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
    if (isExcluded(index, frame.id, node.key, '*')) continue
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
    frame.boxNodes,
    text.matches,
    dom.boxes.concat(dom.texts)
  )
  for (const { box, dom: rendered } of boxes.matched) {
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
  }

  // Gaps the design draws between stacked copy.
  const domByDesignKey = new Map(text.matches.map((m) => [m.design.key, m.dom]))
  for (const gap of frame.gaps) {
    if (isExcluded(index, frame.id, gap.from, 'gap')) continue
    const from = domByDesignKey.get(gap.from)
    const to = domByDesignKey.get(gap.to)
    if (!from || !to) continue
    const rendered = to.rect.top - (from.rect.top + from.rect.height)
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
        property: 'vertical gap',
        expected: failure.expected,
        actual: failure.actual,
      })
    }
  }

  // Artwork colours. A design frame that draws its illustrations in #ffb31b and a page
  // whose SVGs never use that colour is a finding, and needs no per-node mapping to see.
  const renderedFills = new Set(
    dom.svgFills.map((f) => formatColor(f).toLowerCase())
  )
  const missingFills = frame.assetFills.filter(
    (fill) => !renderedFills.has(formatColor(fill).toLowerCase())
  )
  for (const fill of missingFills) {
    if (isExcluded(index, frame.id, 'assetFills', fill)) continue
    findings.push({
      scope: `${frame.id} / artwork`,
      figmaNode: frame.figmaNode,
      evidence: "colour read from the frame's exported vectors",
      route: frame.route,
      theme: frame.theme,
      selector: '(no SVG on the page paints with this colour)',
      file: '(see the illustration components for this route)',
      property: 'artwork colour',
      expected: formatColor(fill),
      actual:
        'no SVG on the rendered page uses it. Either the illustration was recoloured, or it ships as a raster image whose colours this check cannot read — both are worth knowing.',
    })
  }

  return {
    findings,
    notComparable,
    coverage: {
      designTextNodes: frame.textNodes.length,
      matchedTextNodes: matchedNodeKeys.size,
      matchedTextUnits: text.matches.length,
      unmatchedDesignTextNodes: text.unmatchedDesign.length,
      unmatchedRenderedTextNodes: text.unmatchedDom.length,
      ambiguousTextGroups: text.ambiguous.length,
      designBoxNodes: frame.boxNodes.length,
      matchedBoxNodes: boxes.matched.length,
      unmatchedBoxNodes: boxes.unmatched.length,
      designGaps: frame.gaps.length,
      comparedGaps: frame.gaps.filter(
        (g) => domByDesignKey.has(g.from) && domByDesignKey.has(g.to)
      ).length,
      designAssetFills: frame.assetFills.length,
      missingAssetFills: missingFills,
      excluded: exclusions.exclusions.filter((e) => e.frame === frame.id)
        .length,
    },
    unmatchedDom: text.unmatchedDom,
    unmatchedBoxes: boxes.unmatched,
  }
}
