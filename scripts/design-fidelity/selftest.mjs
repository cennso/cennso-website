import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { startStaticServer } from './env.mjs'
import { parseFigmaDump } from './figma-source.mjs'
import { runSnapshot } from './runner.mjs'
import { runInventorySelfTest } from './selftest-inventory.mjs'
import { loadSnapshot, validateSnapshot } from './snapshot.mjs'

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url))

/**
 * A fidelity check that cannot fail is decoration. This suite runs the real
 * engine against fixture pages and proves that each degenerate input aborts
 * the run — and, just as importantly, that a correct page still passes, so the
 * suite is not merely "always red".
 */
function baseSnapshot() {
  return {
    schemaVersion: 1,
    figma: { fileKey: 'FIXTUREFILEKEY', pulledAt: '2026-09-28' },
    themes: {
      dark: {
        storageKey: 'fixture-theme',
        storageValue: 'dark',
        documentAttributeValue: 'dark',
      },
      light: {
        storageKey: 'fixture-theme',
        storageValue: 'light',
        documentAttributeValue: 'light',
      },
    },
    viewport: { width: 1360, height: 900 },
    designFrames: [
      { figmaNode: '9:1', name: 'fixture dark', capture: 'captured' },
      { figmaNode: '9:2', name: 'fixture light', capture: 'captured' },
    ],
    tokens: [
      {
        id: 'fx-token-primary-dark',
        figmaNode: '1:24',
        figmaEvidence: 'fixture h1 fill',
        theme: 'dark',
        route: '/frame-dark.html',
        cssExpression: 'hsl(var(--primary))',
        expect: '#ffb31b',
        tolerance: 2,
        implementedIn: 'scripts/design-fidelity/fixtures/frame-dark.html',
      },
      {
        id: 'fx-token-primary-light',
        figmaNode: '1:4451',
        figmaEvidence: 'fixture h1 fill',
        theme: 'light',
        route: '/frame-light.html',
        cssExpression: 'hsl(var(--primary))',
        expect: '#185f99',
        tolerance: 2,
        implementedIn: 'scripts/design-fidelity/fixtures/frame-light.html',
      },
    ],
    frames: [
      {
        id: 'fx-dark',
        figmaNode: '9:1',
        figmaName: 'fixture dark',
        route: '/frame-dark.html',
        theme: 'dark',
        status: 'enforced',
        elements: [
          {
            id: 'fx-dark-h1',
            figmaNode: '1:24',
            figmaName: 'Build Network Solutions. Anywhere.',
            selector: '[data-figma-node="1:24"]',
            implementedIn: 'scripts/design-fidelity/fixtures/frame-dark.html',
            expect: {
              fontFamily: 'Poppins',
              fontWeight: '700',
              fontSize: '48px',
              lineHeight: '64px',
              color: '#ffb31b',
              text: 'Build Network Solutions. Anywhere.',
            },
          },
          {
            id: 'fx-dark-cta',
            figmaNode: '1:107',
            figmaName: 'Book demo pill',
            selector: '[data-figma-node="1:107"]',
            implementedIn: 'scripts/design-fidelity/fixtures/frame-dark.html',
            expect: {
              backgroundColor: '#001a2a',
              borderColor: '#ffb31b',
              borderRadius: '37px',
              gap: '9px',
              paddingLeft: '16px',
            },
          },
          {
            id: 'fx-dark-art',
            figmaNode: '1:561',
            figmaName: 'hero_section_y 2',
            selector: '[data-figma-node="1:561"]',
            implementedIn: 'scripts/design-fidelity/fixtures/frame-dark.html',
            expect: { assetBasename: 'hero-dark.webp' },
          },
        ],
      },
      {
        id: 'fx-light',
        figmaNode: '9:2',
        figmaName: 'fixture light',
        route: '/frame-light.html',
        theme: 'light',
        status: 'enforced',
        elements: [
          {
            id: 'fx-light-h1',
            figmaNode: '1:4451',
            figmaName: 'Build Network Solutions. Anywhere.',
            selector: '[data-figma-node="1:24"]',
            implementedIn: 'scripts/design-fidelity/fixtures/frame-light.html',
            expect: { color: '#185f99', fontSize: '48px' },
          },
          {
            id: 'fx-light-art',
            figmaNode: '1:4987',
            figmaName: 'hero_section_y 2',
            selector: '[data-figma-node="1:561"]',
            implementedIn: 'scripts/design-fidelity/fixtures/frame-light.html',
            expect: { assetBasename: 'hero-light.webp' },
          },
        ],
      },
    ],
    themePairedAssets: [
      {
        id: 'fx-hero-art',
        description: 'hero illustration is drawn separately for each theme',
        figmaNodes: { dark: '1:561', light: '1:4987' },
        refs: [
          { frame: 'fx-dark', element: 'fx-dark-art' },
          { frame: 'fx-light', element: 'fx-light-art' },
        ],
      },
    ],
  }
}

const clone = (o) => JSON.parse(JSON.stringify(o))

/** Each case mutates the base snapshot; every one of them must abort or fail. */
const CASES = [
  {
    name: 'empty snapshot — no tokens, no frames',
    mutate: (s) => {
      s.tokens = []
      s.frames = []
    },
  },
  {
    name: 'snapshot present but every list is empty except tokens',
    mutate: (s) => {
      s.frames = []
    },
  },
  {
    name: 'frame declares zero assertions',
    mutate: (s) => {
      s.frames[0].elements = []
    },
  },
  {
    name: 'element declares an empty expect block',
    mutate: (s) => {
      s.frames[0].elements[0].expect = {}
    },
  },
  {
    name: 'expect names a property the harness does not know',
    mutate: (s) => {
      s.frames[0].elements[0].expect.fontSizeish = '48px'
    },
  },
  {
    name: 'tolerance wide enough to make the assertion meaningless',
    mutate: (s) => {
      s.frames[0].elements[0].tolerance = 60
    },
  },
  {
    name: 'paired asset references an element that does not exist',
    mutate: (s) => {
      s.themePairedAssets[0].refs[1].element = 'does-not-exist'
    },
  },
  {
    name: 'uncovered design frame with no written reason',
    mutate: (s) => {
      s.designFrames.push({
        figmaNode: '9:3',
        name: 'contact',
        capture: 'not-captured',
        reason: 'todo',
      })
    },
  },
  {
    name: 'frame asserts a node that is not in the coverage ledger',
    mutate: (s) => {
      s.frames[0].figmaNode = '9:404'
    },
  },
  {
    name: 'selector matches nothing on the page',
    mutate: (s) => {
      s.frames[0].elements[0].selector = '[data-figma-node="1:0000"]'
    },
  },
  {
    name: 'selector matches more than one element',
    mutate: (s) => {
      s.frames[0].elements[0].selector = '.ambiguous'
    },
  },
  {
    name: 'selector matches an element that is not rendered',
    mutate: (s) => {
      s.frames[0].elements[0].selector = '.hidden-thing'
    },
  },
  {
    name: 'page does not render — HTTP 500',
    mutate: (s) => {
      s.frames[0].route = '/__broken'
    },
  },
  {
    name: 'page does not render — route missing (404)',
    mutate: (s) => {
      s.frames[0].route = '/no-such-page.html'
    },
  },
  {
    name: 'page renders in the wrong theme',
    mutate: (s) => {
      s.frames[0].route = '/frame-light.html'
    },
  },
  {
    name: 'token reads a custom property that does not exist',
    mutate: (s) => {
      s.tokens[0].cssExpression = 'hsl(var(--not-a-token))'
    },
  },
  {
    name: 'rendered value differs from the design (hero 36px, Figma 48px)',
    mutate: (s) => {
      s.frames[0].elements[0].expect.fontSize = '36px'
    },
  },
  {
    name: 'rendered colour differs from the design (logo yellow, Figma white)',
    mutate: (s) => {
      s.frames[0].elements[0].expect.color = '#ffffff'
    },
  },
  {
    name: 'one theme reuses the other theme’s artwork',
    mutate: (s) => {
      s.frames[1].route = '/frame-light-reused-asset.html'
      s.frames[1].elements[1].expect.assetBasename = 'hero-dark.webp'
    },
  },
]

async function outcomeOf(snapshot, { browser, baseUrl, repoRoot }) {
  try {
    validateSnapshot(snapshot, 'self-test snapshot')
  } catch (err) {
    return { kind: 'rejected', detail: err.message }
  }
  try {
    const result = await runSnapshot({ snapshot, browser, baseUrl, repoRoot })
    if (result.failures.length) {
      return {
        kind: 'failed',
        detail: `${result.failures.length} assertion failure(s)`,
      }
    }
    return { kind: 'passed', detail: `${result.executed} assertions` }
  } catch (err) {
    return { kind: 'aborted', detail: err.message }
  }
}

export async function runSelfTest({ browser, repoRoot, verbose = false }) {
  const server = await startStaticServer(FIXTURES)
  const results = []
  try {
    const ctx = { browser, baseUrl: server.baseUrl, repoRoot }

    // Positive control: a page that matches the design must pass cleanly,
    // otherwise "everything fails" would masquerade as a working check.
    const control = await outcomeOf(baseSnapshot(), ctx)
    results.push({
      name: 'positive control — a page matching the design passes',
      ok: control.kind === 'passed',
      got: `${control.kind}: ${control.detail}`,
    })

    for (const testCase of CASES) {
      const snapshot = clone(baseSnapshot())
      testCase.mutate(snapshot)
      const outcome = await outcomeOf(snapshot, ctx)
      results.push({
        name: testCase.name,
        ok: outcome.kind !== 'passed',
        got: `${outcome.kind}: ${firstLine(outcome.detail)}`,
      })
    }

    // Inputs that never even become an object.
    const dir = mkdtempSync(path.join(tmpdir(), 'fidelity-selftest-'))
    results.push(
      await fileCase('missing snapshot file', path.join(dir, 'nope.json'))
    )
    const badJson = path.join(dir, 'bad.json')
    writeFileSync(badJson, '{ "schemaVersion": 1, ')
    results.push(await fileCase('snapshot that is not valid JSON', badJson))
    const emptyFile = path.join(dir, 'empty.json')
    writeFileSync(emptyFile, '{}')
    results.push(await fileCase('snapshot that is an empty object', emptyFile))

    // The Figma dump parser: a dump that yields nothing must abort, not enumerate
    // nothing and call it full coverage.
    results.push(
      parserCase(
        'Figma dump that parses to zero design nodes',
        'export default function Empty() {\n  return (\n    <div />\n  );\n}'
      )
    )
    results.push(
      parserCase(
        'Figma dump with nodes but no text at all',
        'export default function NoText() {\n  return (\n    <div data-node-id="9:1"><div data-node-id="9:2" /></div>\n  );\n}'
      )
    )
    results.push(
      parserCase('Figma dump that is not a component at all', 'const x = 1')
    )

    // The enumerative pass.
    results.push(
      ...(await runInventorySelfTest({ browser, baseUrl: server.baseUrl }))
    )
  } finally {
    await server.close()
  }

  if (verbose) {
    for (const r of results) {
      process.stdout.write(
        `  ${r.ok ? '✓' : '✗'} ${r.name}\n      → ${r.got}\n`
      )
    }
  }
  return results
}

function parserCase(name, source) {
  try {
    parseFigmaDump(source, 'self-test dump')
    return { name, ok: false, got: 'passed: parsed without complaint' }
  } catch (err) {
    return { name, ok: true, got: `rejected: ${firstLine(err.message)}` }
  }
}

async function fileCase(name, filePath) {
  try {
    loadSnapshot(filePath)
    return { name, ok: false, got: 'passed: loaded without complaint' }
  } catch (err) {
    return { name, ok: true, got: `rejected: ${firstLine(err.message)}` }
  }
}

function firstLine(text) {
  return String(text).split('\n')[0].slice(0, 160)
}
