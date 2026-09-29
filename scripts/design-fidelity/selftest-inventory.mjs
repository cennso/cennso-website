/**
 * Proof suite for the enumerative diff itself.
 *
 * selftest.mjs covers the inputs — the committed mapping, the freshly fetched dumps, the
 * parser. This one covers what the diff does with them: an inventory that enumerates
 * nothing, an inventory nothing on the page matches, a page that renders nothing, a
 * property that differs, and an exclusion written without a reason. Each must abort or
 * produce a finding. The positive control proves the suite is not simply always red.
 */
import { collectDom } from './dom-inventory.mjs'
import { diffFrame, matchTextNodes, validateExclusions } from './match.mjs'
import { openPage } from './page.mjs'
import { validateInventory } from './inventory-runner.mjs'

const THEME = {
  storageKey: 'fixture-theme',
  storageValue: 'dark',
  documentAttributeValue: 'dark',
}

/**
 * The design the fixture page implements exactly.
 *
 * The artboard is drawn 20px lower than the page renders it, on purpose: that offset is
 * only absorbed if the anchors really are calibrating a design-Y -> rendered-Y map, so a
 * projector that silently degraded to "compare Y directly" would show up here.
 *
 * "Documentation" and "Book demo" each appear in more than one place, exactly as they do
 * on the real site. Pairing by text alone crosses them — the header CTA's values reported
 * against the hero's, the footer's links against the nav's — which is what the pairing
 * cases at the bottom of this file pin down.
 */
export function baseInventory() {
  const poppins = (overrides) => ({
    fontFamily: 'Poppins',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: '15px',
    lineHeight: '24px',
    textAlign: 'left',
    color: '#ffffff',
    ...overrides,
  })
  const footerLink = (key, text, top) => ({
    key,
    figmaNode: key,
    name: text,
    text,
    style: poppins(),
    geometry: { left: 24, top, width: 1312, height: 24 },
    ancestorKeys: ['9:6'],
  })

  return {
    schemaVersion: 1,
    viewport: { width: 1360, height: 900 },
    frames: [
      {
        id: 'fx-enum',
        figmaNode: '9:9',
        figmaName: 'fixture enumerative',
        route: '/frame-enumerative.html',
        theme: 'dark',
        frameFill: '#001a2a',
        frameHeight: 920,
        artworkNodes: [],
        textNodes: [
          {
            key: '9:30',
            figmaNode: '9:30',
            name: 'nav Documentation',
            text: 'Documentation',
            style: poppins(),
            geometry: { left: 24, top: 28, width: 101, height: 24 },
            ancestorKeys: ['9:5'],
          },
          {
            key: '9:31',
            figmaNode: '9:31',
            name: 'nav Book demo',
            text: 'Book demo',
            style: poppins(),
            geometry: { left: 149, top: 28, width: 76, height: 24 },
            ancestorKeys: ['9:5'],
          },
          {
            key: '9:11',
            figmaNode: '9:11',
            name: '5G Anywhere',
            text: '5G Anywhere',
            style: poppins({
              fontWeight: '700',
              fontSize: '32px',
              lineHeight: '44.8px',
              textAlign: 'center',
            }),
            geometry: { left: 0, top: 80, width: 1360, height: 44.8 },
            ancestorKeys: ['9:10'],
          },
          {
            key: '9:12',
            figmaNode: '9:12',
            name: 'card body',
            text: 'Cennso enables you to run 5G networks in any location with centralized management.',
            style: poppins({ fontSize: '16px', lineHeight: '25.6px' }),
            geometry: { left: 0, top: 138, width: 1360, height: 25.6 },
            ancestorKeys: ['9:10'],
          },
          {
            key: '9:13',
            figmaNode: '9:13',
            name: 'hero Book demo',
            text: 'Book demo',
            style: poppins(),
            geometry: { left: 24, top: 229, width: 76, height: 24 },
            ancestorKeys: [],
          },
          {
            key: '9:20',
            figmaNode: '9:20',
            name: 'footer links',
            text: 'Success Stories About Blog',
            style: poppins(),
            lines: [
              { key: '9:20:L1', text: 'Success Stories', style: poppins() },
              { key: '9:20:L2', text: 'About', style: poppins() },
              { key: '9:20:L3', text: 'Blog', style: poppins() },
            ],
            geometry: { left: 24, top: 301, width: 1312, height: 72 },
            ancestorKeys: ['9:6'],
          },
          footerLink('9:21', 'Documentation', 373),
          footerLink('9:23', 'Book demo', 397),
        ],
        boxNodes: [
          {
            key: '9:10',
            figmaNode: '9:10',
            name: 'card',
            fill: '#185f99',
            effectiveFill: '#185f99',
            borderColor: '#3fabff',
            borderWidth: '1px',
            borderRadius: '24px',
            opacity: 0.41,
            backdrop: '#001a2a',
            geometry: { left: 0, top: 60, width: 1360, height: 125 },
            ancestorKeys: [],
          },
        ],
        gaps: [{ from: '9:11', to: '9:12', gap: '13.2px' }],
      },
    ],
  }
}

/** Line geometry is computed by the parser; the fixture spells it out the same way. */
function withLineGeometry(inventory) {
  for (const frame of inventory.frames ?? []) {
    for (const node of frame.textNodes) {
      if (!node.lines) continue
      let offset = 0
      for (const line of node.lines) {
        line.geometry = {
          left: node.geometry.left,
          top: node.geometry.top + offset,
          width: node.geometry.width,
        }
        offset += Number(String(line.style.lineHeight).replace('px', '')) || 0
      }
    }
  }
  return inventory
}

export function baseExclusions() {
  return { schemaVersion: 1, exclusions: [] }
}

const clone = (o) => withLineGeometry(JSON.parse(JSON.stringify(o)))

/** The node a case is about, by key — the fixture has several of most things now. */
function node(inventory, key) {
  const found = inventory.frames[0].textNodes.find((n) => n.key === key)
  if (!found) throw new Error(`self-test fixture has no node ${key}`)
  return found
}

/**
 * Every case below must abort or produce a finding. None may pass.
 * The names are written as the defect they stand for, not as the code path.
 */
export const INVENTORY_CASES = [
  {
    name: 'inventory enumerates no frames at all',
    mutate: (inv) => {
      inv.frames = []
    },
  },
  {
    name: 'a frame that enumerates no text nodes',
    mutate: (inv) => {
      inv.frames[0].textNodes = []
    },
  },
  {
    name: 'a text node with no text to match on',
    mutate: (inv) => {
      inv.frames[0].textNodes[0].text = '   '
    },
  },
  {
    name: 'inventory written against a schema this harness does not understand',
    mutate: (inv) => {
      inv.schemaVersion = 99
    },
  },
  {
    name: 'nothing on the page matches any design node (zero matches)',
    mutate: (inv) => {
      for (const node of inv.frames[0].textNodes) {
        node.text = `${node.text} — copy nobody ships`
        delete node.lines
      }
    },
  },
  {
    name: 'a design text node that the page does not render at all',
    mutate: (inv) => {
      inv.frames[0].textNodes.push({
        key: '9:99',
        figmaNode: '9:99',
        name: 'nav item nobody implemented',
        text: 'Use cases',
        style: { fontSize: '18px', color: '#ffffff' },
        geometry: { left: 0, top: 0 },
      })
    },
  },
  {
    name: 'rendered font size differs from the design',
    mutate: (inv) => {
      node(inv, '9:11').style.fontSize = '48px'
    },
  },
  {
    name: 'design centres a card heading, page left-aligns it',
    mutate: (inv) => {
      node(inv, '9:11').style.textAlign = 'left'
    },
  },
  {
    name: 'design colour differs from the rendered colour',
    mutate: (inv) => {
      node(inv, '9:11').style.color = '#ffb31b'
    },
  },
  {
    name: 'a footer link differs from the design (the nav twin must not absorb it)',
    mutate: (inv) => {
      node(inv, '9:21').style.fontWeight = '700'
    },
  },
  {
    name: 'the header CTA differs from the design (the hero twin must not absorb it)',
    mutate: (inv) => {
      node(inv, '9:31').style.fontSize = '20px'
    },
  },
  {
    name: 'a line of a multi-line layer differs from the design',
    mutate: (inv) => {
      node(inv, '9:20').lines[1].style.fontSize = '31px'
    },
  },
  {
    name: 'two design nodes with the same copy land in the same place, so neither can be paired',
    mutate: (inv) => {
      node(inv, '9:13').geometry = { ...node(inv, '9:31').geometry }
    },
  },
  {
    name: 'card fill compared without compositing its 41% opacity',
    mutate: (inv) => {
      inv.frames[0].boxNodes[0].opacity = 1
    },
  },
  {
    name: 'card outline drawn at full strength instead of dimmed',
    mutate: (inv) => {
      inv.frames[0].boxNodes[0].borderColor = '#ffffff'
    },
  },
  {
    name: 'heading→body gap differs from the design (32px against 13px)',
    mutate: (inv) => {
      inv.frames[0].gaps[0].gap = '32px'
    },
  },
  {
    name: 'the box the design fills is compared against an element that is not it',
    mutate: (inv) => {
      inv.frames[0].boxNodes[0].fill = '#ff00ff'
      inv.frames[0].boxNodes[0].effectiveFill = '#ff00ff'
    },
  },
  {
    name: 'the design draws the card wider than the page renders it',
    mutate: (inv) => {
      inv.frames[0].boxNodes[0].geometry.width = 900
    },
  },
  {
    name: 'page renders nothing at all',
    mutate: (inv) => {
      inv.frames[0].route = '/frame-blank.html'
    },
  },
  {
    name: 'route does not exist',
    mutate: (inv) => {
      inv.frames[0].route = '/no-such-frame.html'
    },
  },
]

export const EXCLUSION_CASES = [
  {
    name: 'exclusion written without a reason',
    mutate: (ex) => {
      ex.exclusions.push({ frame: 'fx-enum', node: '9:11', properties: ['*'] })
    },
  },
  {
    name: 'exclusion whose reason is a shrug',
    mutate: (ex) => {
      ex.exclusions.push({
        frame: 'fx-enum',
        node: '9:11',
        properties: ['*'],
        reason: 'flaky',
      })
    },
  },
  {
    name: 'exclusion that names no properties',
    mutate: (ex) => {
      ex.exclusions.push({
        frame: 'fx-enum',
        node: '9:11',
        properties: [],
        reason:
          'This node cannot be compared because the copy is CMS-driven and changes per environment.',
      })
    },
  },
  {
    name: 'exclusion for a node the design no longer contains',
    mutate: (ex) => {
      ex.exclusions.push({
        frame: 'fx-enum',
        node: '9:404',
        properties: ['*'],
        reason:
          'This node was removed from the frame in a later pull, and this entry outlived it silently.',
      })
    },
  },
  {
    name: 'exclusion for a frame that is not in the inventory',
    mutate: (ex) => {
      ex.exclusions.push({
        frame: 'fx-nowhere',
        node: '9:11',
        properties: ['*'],
        reason:
          'Names a frame that does not exist, which means nobody would ever see this exclusion apply.',
      })
    },
  },
  {
    name: 'the same node excluded twice, with two different stories',
    mutate: (ex) => {
      for (const reason of [
        'Excluded because the copy is CMS-driven and differs per environment.',
        'Excluded because the layer is decorative and carries no readable text.',
      ]) {
        ex.exclusions.push({
          frame: 'fx-enum',
          node: '9:12',
          properties: ['*'],
          reason,
        })
      }
    },
  },
]

async function outcomeOf(inventory, exclusions, { browser, baseUrl }) {
  try {
    validateInventory(inventory, 'self-test inventory')
    validateExclusions(exclusions, inventory, {
      where: 'self-test exclusions',
    })
  } catch (err) {
    return { kind: 'rejected', detail: err.message }
  }
  const frame = inventory.frames[0]
  let page
  try {
    page = await openPage(browser, {
      baseUrl,
      route: frame.route,
      theme: frame.theme,
      themeConfig: THEME,
      viewport: inventory.viewport,
    })
  } catch (err) {
    return { kind: 'aborted', detail: err.message }
  }
  try {
    const dom = await collectDom(page)
    const result = diffFrame({ frame, dom, exclusions })
    if (result.findings.length) {
      return {
        kind: 'failed',
        detail: `${result.findings.length} finding(s): ${result.findings[0].property}`,
        result,
      }
    }
    return {
      kind: 'passed',
      detail: `${result.coverage.matchedTextNodes}/${result.coverage.designTextNodes} nodes matched`,
      result,
    }
  } catch (err) {
    return { kind: 'aborted', detail: err.message }
  } finally {
    await page.close()
  }
}

/**
 * Pairing, asserted directly rather than through "did it produce a finding".
 *
 * These are the cases the last full run got wrong: identical copy in two regions paired
 * across them, so two elements that both rendered exactly as designed were each reported
 * with the other's values. A suite that only asks "was there a finding" cannot see that —
 * the wrong pairing produced findings too. So these read the pairs.
 */
async function pairingCases({ browser, baseUrl }) {
  const results = []
  const inventory = clone(baseInventory())
  const frame = inventory.frames[0]
  const page = await openPage(browser, {
    baseUrl,
    route: frame.route,
    theme: frame.theme,
    themeConfig: THEME,
    viewport: inventory.viewport,
  })
  let dom
  try {
    dom = await collectDom(page)
  } finally {
    await page.close()
  }

  const match = (nodes) =>
    matchTextNodes(nodes, dom.texts, {
      frameHeight: frame.frameHeight,
      documentHeight: dom.documentHeight,
    })

  const paired = match(frame.textNodes)
  const where = new Map(paired.matches.map((m) => [m.design.key, m.dom.path]))
  const expectations = [
    ['9:30', 'nav#site-nav', 'the nav "Documentation"'],
    ['9:21', 'footer#site-footer', 'the footer "Documentation"'],
    ['9:31', 'nav#site-nav', 'the header CTA "Book demo"'],
    ['9:13', 'a.hero-cta', 'the hero CTA "Book demo"'],
    ['9:23', 'footer#site-footer', 'the footer "Book demo"'],
    ['9:20:L1', 'footer#site-footer', "the footer layer's first line"],
  ]
  const wrong = expectations.filter(
    ([key, expected]) => !(where.get(key) ?? '').includes(expected)
  )
  results.push({
    name: 'identical copy in two regions pairs with the right element in each',
    ok: wrong.length === 0 && paired.ambiguousPairs.length === 0,
    got: wrong.length
      ? `mispaired: ${wrong
          .map(
            ([key, expected, what]) =>
              `${what} (${key}) -> ${where.get(key) ?? 'nothing'}, wanted ${expected}`
          )
          .join('; ')}`
      : `all ${expectations.length} repeated-copy nodes paired within their own region, 0 ambiguous`,
  })

  // Two design nodes carrying the same copy, drawn on top of one another: nothing
  // distinguishes them, so neither may be quietly resolved.
  const collapsed = clone(baseInventory()).frames[0].textNodes
  const hero = collapsed.find((n) => n.key === '9:13')
  const header = collapsed.find((n) => n.key === '9:31')
  hero.geometry = { ...header.geometry }
  const confused = match(collapsed)
  const admitted = confused.ambiguousPairs.map((a) => a.design.key)
  const silentlyResolved = ['9:13', '9:31'].filter(
    (key) => !admitted.includes(key)
  )
  results.push({
    name: 'a genuinely ambiguous pair is reported as ambiguous, not silently resolved',
    ok: admitted.length > 0 && silentlyResolved.length === 0,
    got: admitted.length
      ? `reported ${admitted.length} ambiguity(ies): ${admitted.join(', ')}`
      : 'resolved both without admitting the ambiguity',
  })

  return results
}

export async function runInventorySelfTest({ browser, baseUrl }) {
  const results = []
  const ctx = { browser, baseUrl }

  const control = await outcomeOf(clone(baseInventory()), baseExclusions(), ctx)
  results.push({
    name: 'positive control — a page matching the enumerated design passes',
    ok: control.kind === 'passed',
    got: `${control.kind}: ${control.detail}`,
  })

  for (const testCase of INVENTORY_CASES) {
    const inventory = clone(baseInventory())
    testCase.mutate(inventory)
    const outcome = await outcomeOf(inventory, baseExclusions(), ctx)
    const ok = testCase.expect
      ? outcome.kind !== 'passed' ||
        (outcome.result && testCase.expect(outcome.result))
      : outcome.kind !== 'passed'
    results.push({
      name: testCase.name,
      ok,
      got: `${outcome.kind}: ${firstLine(outcome.detail)}`,
    })
  }

  results.push(...(await pairingCases(ctx)))

  // An exclusion is written against the layer a reviewer sees in Figma. The enumeration
  // also reads that layer line by line, and until this was fixed an exclusion keyed
  // `I1:1533;1:579` never matched `I1:1533;1:579:L1` — so an occluded duplicate footer
  // leaked thirteen findings past an exclusion that named it exactly.
  const lineBroken = clone(baseInventory())
  lineBroken.frames[0].textNodes.find(
    (n) => n.key === '9:20'
  ).lines[1].style.fontSize = '31px'
  const uncovered = await outcomeOf(lineBroken, baseExclusions(), ctx)
  results.push({
    name: 'a line of a multi-line layer that differs is a finding when nothing excludes it',
    ok: uncovered.kind === 'failed',
    got: `${uncovered.kind}: ${firstLine(uncovered.detail)}`,
  })
  const covered = await outcomeOf(
    clone(lineBroken),
    {
      schemaVersion: 1,
      exclusions: [
        {
          frame: 'fx-enum',
          node: '9:20',
          properties: ['*'],
          reason:
            'Excluded at the layer, which is the level a reviewer sees in Figma; it must therefore cover the lines the enumeration reads out of that layer.',
        },
      ],
    },
    ctx
  )
  results.push({
    name: 'an exclusion written against a layer covers the lines read out of it',
    ok: covered.kind === 'passed',
    got: `${covered.kind}: ${firstLine(covered.detail)}`,
  })

  for (const testCase of EXCLUSION_CASES) {
    const exclusions = clone(baseExclusions())
    testCase.mutate(exclusions)
    const outcome = await outcomeOf(clone(baseInventory()), exclusions, ctx)
    results.push({
      name: testCase.name,
      ok: outcome.kind === 'rejected',
      got: `${outcome.kind}: ${firstLine(outcome.detail)}`,
    })
  }

  return results
}

function firstLine(text) {
  return String(text).split('\n')[0].slice(0, 160)
}
