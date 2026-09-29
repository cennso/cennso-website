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
import { diffFrame, validateExclusions } from './match.mjs'
import { openPage } from './page.mjs'
import { validateInventory } from './inventory-runner.mjs'

const THEME = {
  storageKey: 'fixture-theme',
  storageValue: 'dark',
  documentAttributeValue: 'dark',
}

/** The design the fixture page implements exactly. */
export function baseInventory() {
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
        assetFills: ['#ffb31b'],
        textNodes: [
          {
            key: '9:11',
            figmaNode: '9:11',
            name: '5G Anywhere',
            text: '5G Anywhere',
            style: {
              fontFamily: 'Poppins',
              fontWeight: '700',
              fontStyle: 'normal',
              fontSize: '32px',
              lineHeight: '44.8px',
              textAlign: 'center',
              color: '#ffffff',
            },
            geometry: { left: 0, top: 19, width: 1360, height: 44.8 },
          },
          {
            key: '9:12',
            figmaNode: '9:12',
            name: 'card body',
            text: 'Cennso enables you to run 5G networks in any location with centralized management.',
            style: {
              fontFamily: 'Poppins',
              fontWeight: '400',
              fontStyle: 'normal',
              fontSize: '16px',
              lineHeight: '25.6px',
              textAlign: 'left',
              color: '#ffffff',
            },
            geometry: { left: 0, top: 77, width: 1360, height: 51.2 },
          },
          {
            key: '9:20',
            figmaNode: '9:20',
            name: 'footer links',
            text: 'Success Stories About Blog',
            style: {
              fontFamily: 'Poppins',
              fontWeight: '400',
              fontStyle: 'normal',
              fontSize: '15px',
              lineHeight: '24px',
              textAlign: 'left',
              color: '#ffffff',
            },
            lines: [
              {
                key: '9:20:L1',
                text: 'Success Stories',
                style: {
                  fontFamily: 'Poppins',
                  fontWeight: '400',
                  fontSize: '15px',
                  lineHeight: '24px',
                  textAlign: 'left',
                  color: '#ffffff',
                },
              },
              {
                key: '9:20:L2',
                text: 'About',
                style: {
                  fontFamily: 'Poppins',
                  fontWeight: '400',
                  fontSize: '15px',
                  lineHeight: '24px',
                  textAlign: 'left',
                  color: '#ffffff',
                },
              },
              {
                key: '9:20:L3',
                text: 'Blog',
                style: {
                  fontFamily: 'Poppins',
                  fontWeight: '400',
                  fontSize: '15px',
                  lineHeight: '24px',
                  textAlign: 'left',
                  color: '#ffffff',
                },
              },
            ],
            geometry: { left: 0, top: 200, width: 1360, height: 72 },
          },
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
            geometry: { left: 0, top: 0, width: 1360, height: 150 },
          },
        ],
        gaps: [{ from: '9:11', to: '9:12', gap: '13.2px' }],
      },
    ],
  }
}

export function baseExclusions() {
  return { schemaVersion: 1, exclusions: [] }
}

const clone = (o) => JSON.parse(JSON.stringify(o))

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
      inv.frames[0].textNodes[0].style.fontSize = '48px'
    },
  },
  {
    name: 'design centres a card heading, page left-aligns it',
    mutate: (inv) => {
      inv.frames[0].textNodes[0].style.textAlign = 'left'
    },
  },
  {
    name: 'design colour differs from the rendered colour',
    mutate: (inv) => {
      inv.frames[0].textNodes[0].style.color = '#ffb31b'
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
    name: 'a colour the design draws its artwork in appears nowhere on the page',
    mutate: (inv) => {
      inv.frames[0].assetFills = ['#ff00ff']
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

export async function runInventorySelfTest({ browser, baseUrl }) {
  const results = []
  const ctx = { browser, baseUrl }

  const control = await outcomeOf(baseInventory(), baseExclusions(), ctx)
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

  for (const testCase of EXCLUSION_CASES) {
    const exclusions = clone(baseExclusions())
    testCase.mutate(exclusions)
    const outcome = await outcomeOf(baseInventory(), exclusions, ctx)
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
