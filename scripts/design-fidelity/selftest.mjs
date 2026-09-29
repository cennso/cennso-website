/**
 * A fidelity review that cannot fail is decoration.
 *
 * This suite runs the real engine against fixture pages and fixture inputs and proves
 * that each degenerate input aborts or produces a finding — and, just as importantly,
 * that a correct page and a correct input still pass, so the suite is not merely
 * "always red". It runs before every review, and the review refuses to say anything
 * about the site if any case here misbehaves.
 *
 * Four groups, in the order the review depends on them:
 *
 *   1. the committed route <-> frame mapping,
 *   2. the freshly fetched dumps (where they may live, and how old they may be),
 *   3. the `get_design_context` parser,
 *   4. the enumerative diff itself (in selftest-inventory.mjs).
 */
import { mkdirSync, mkdtempSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildInventory,
  loadFrameMap,
  selectFrames,
  validateFrameMap,
} from './build-inventory.mjs'
import {
  assertDumpDirIsNotCommittable,
  dumpFileName,
  MAX_DUMP_AGE_MS,
  readDump,
} from './dumps.mjs'
import { startStaticServer } from './env.mjs'
import { parseFigmaDump } from './figma-source.mjs'
import { runInventorySelfTest } from './selftest-inventory.mjs'

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url))

/** A dump small enough to read, real enough for the parser to accept. */
const FIXTURE_DUMP = `export default function Fixture() {
  return (
    <div data-node-id="9:1" data-name="Fixture frame" className="bg-[#001a2a] relative size-full">
      <p data-node-id="9:2" data-name="copy" className="font-['Poppins:Regular',_sans-serif] text-[16px] text-[#ffffff] leading-[24px] absolute left-0 top-0">Hello</p>
    </div>
  );
}`

function baseFrameMap() {
  return {
    schemaVersion: 2,
    figma: { fileKey: 'FIXTUREFILEKEY', designName: 'fixture design' },
    viewport: { width: 1360, height: 900 },
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
    frames: [
      {
        id: 'fx-dark',
        figmaNode: '9:1',
        route: '/frame-enumerative.html',
        theme: 'dark',
      },
      {
        id: 'fx-light',
        figmaNode: '9:2',
        route: '/frame-enumerative.html',
        theme: 'light',
      },
    ],
  }
}

const clone = (o) => JSON.parse(JSON.stringify(o))

/** Each mutation makes the mapping degenerate. Every one of them must be rejected. */
const FRAME_MAP_CASES = [
  {
    name: 'mapping written against a schema this harness does not understand',
    mutate: (m) => {
      m.schemaVersion = 99
    },
  },
  {
    name: 'mapping that does not say which Figma file to fetch',
    mutate: (m) => {
      delete m.figma.fileKey
    },
  },
  {
    name: 'mapping with no frames at all',
    mutate: (m) => {
      m.frames = []
    },
  },
  {
    name: 'two frames sharing one id',
    mutate: (m) => {
      m.frames[1].id = m.frames[0].id
    },
  },
  {
    name: 'two frames claiming the same Figma node',
    mutate: (m) => {
      m.frames[1].figmaNode = m.frames[0].figmaNode
    },
  },
  {
    name: 'a frame whose figmaNode is not a node id',
    mutate: (m) => {
      m.frames[0].figmaNode = 'the hero frame'
    },
  },
  {
    name: 'a frame mapped to something that is not a site route',
    mutate: (m) => {
      m.frames[0].route = 'success-stories'
    },
  },
  {
    name: 'a frame naming a theme the mapping never declares',
    mutate: (m) => {
      m.frames[0].theme = 'midnight'
    },
  },
  {
    name: 'a theme with no way to force it before first paint',
    mutate: (m) => {
      delete m.themes.dark.storageKey
    },
  },
  {
    name: 'a theme that cannot be proved to have applied',
    mutate: (m) => {
      delete m.themes.dark.documentAttributeValue
    },
  },
  {
    name: 'mapping with no viewport, so nothing pins the 1360px frame width',
    mutate: (m) => {
      delete m.viewport
    },
  },
]

function frameMapCase(name, map) {
  try {
    validateFrameMap(map, 'self-test mapping')
    return { name, ok: false, got: 'passed: accepted without complaint' }
  } catch (err) {
    return { name, ok: true, got: `rejected: ${firstLine(err.message)}` }
  }
}

function parserCase(name, source) {
  try {
    parseFigmaDump(source, 'self-test dump')
    return { name, ok: false, got: 'passed: parsed without complaint' }
  } catch (err) {
    return { name, ok: true, got: `rejected: ${firstLine(err.message)}` }
  }
}

/** `run` must throw. Anything else is the harness failing open. */
async function mustReject(name, run) {
  try {
    await run()
    return { name, ok: false, got: 'passed: accepted without complaint' }
  } catch (err) {
    return { name, ok: true, got: `rejected: ${firstLine(err.message)}` }
  }
}

/** `run` must NOT throw — the control that stops this suite being always-red. */
async function mustAccept(name, run) {
  try {
    const detail = await run()
    return { name, ok: true, got: `accepted: ${detail ?? 'ok'}` }
  } catch (err) {
    return { name, ok: false, got: `rejected: ${firstLine(err.message)}` }
  }
}

function writeDump(dir, frameId, source, { ageMs = 0 } = {}) {
  mkdirSync(dir, { recursive: true })
  const file = path.join(dir, dumpFileName(frameId))
  writeFileSync(file, source)
  if (ageMs) {
    const when = new Date(Date.now() - ageMs)
    utimesSync(file, when, when)
  }
  return file
}

/**
 * Where a dump may live, and how old it may be.
 *
 * Both rules exist for the same reason: a copy of the design that outlives the review is
 * the committed-copy problem again. One keeps it out of git, the other keeps it out of
 * next week.
 */
async function dumpCases(repoRoot) {
  const results = []
  const scratch = mkdtempSync(path.join(tmpdir(), 'fidelity-dumps-'))
  const map = baseFrameMap()
  const oneFrame = [map.frames[0]]

  results.push(
    await mustAccept(
      'positive control — a scratch directory outside the repository is allowed',
      () => assertDumpDirIsNotCommittable(scratch, repoRoot)
    )
  )
  results.push(
    await mustAccept(
      'positive control — a directory inside the repo that git already ignores is allowed',
      () =>
        assertDumpDirIsNotCommittable(
          path.join(repoRoot, '.next', 'design-dumps'),
          repoRoot
        )
    )
  )
  results.push(
    await mustReject(
      'dumps written inside the repository where git would track them',
      () =>
        assertDumpDirIsNotCommittable(
          path.join(repoRoot, 'design', 'figma', 'live'),
          repoRoot
        )
    )
  )

  results.push(
    await mustReject('a frame whose dump was never fetched', () =>
      readDump(scratch, 'fx-never-fetched')
    )
  )

  writeDump(scratch, 'fx-empty', '   \n')
  results.push(
    await mustReject('a dump file that is empty', () =>
      readDump(scratch, 'fx-empty')
    )
  )

  writeDump(scratch, 'fx-stale', FIXTURE_DUMP, {
    ageMs: MAX_DUMP_AGE_MS + 60_000,
  })
  results.push(
    await mustReject(
      'a dump left over from an earlier session (the committed copy, wearing a temp directory)',
      () => readDump(scratch, 'fx-stale')
    )
  )

  writeDump(scratch, 'fx-dark', FIXTURE_DUMP)
  results.push(
    await mustAccept(
      'positive control — a dump fetched for this review is read',
      () => `${readDump(scratch, 'fx-dark').length} bytes`
    )
  )

  results.push(
    await mustAccept(
      'positive control — a fresh dump enumerates the frame it belongs to',
      async () => {
        const inventory = await buildInventory({
          map,
          frames: oneFrame,
          dumpDir: scratch,
          fetchAssets: false,
        })
        return `${inventory.frames[0].textNodes.length} text node(s)`
      }
    )
  )

  // The wrong frame fetched into the right file: the diff would compare a route
  // against a design that is not its own, and every number it printed would be junk.
  const mismatched = mkdtempSync(path.join(tmpdir(), 'fidelity-dumps-'))
  writeDump(mismatched, 'fx-dark', FIXTURE_DUMP.replace('9:1', '9:404'))
  results.push(
    await mustReject(
      'a dump whose Figma node is not the node the mapping assigns that frame',
      () =>
        buildInventory({
          map,
          frames: oneFrame,
          dumpDir: mismatched,
          fetchAssets: false,
        })
    )
  )

  results.push(
    await mustReject('a review that selects no frames at all', () =>
      buildInventory({ map, frames: [], dumpDir: scratch, fetchAssets: false })
    )
  )
  results.push(
    await mustReject(
      '--frames naming a frame the mapping does not declare',
      () => selectFrames(map, ['fx-nowhere'])
    )
  )

  return results
}

export async function runSelfTest({ browser, repoRoot, verbose = false }) {
  const server = await startStaticServer(FIXTURES)
  const results = []
  try {
    // 1. The committed mapping.
    results.push(
      await mustAccept(
        'positive control — the committed design/figma/frames.json loads',
        () => `${loadFrameMap(repoRoot).frames.length} frames mapped`
      )
    )
    results.push(
      await mustAccept(
        'positive control — a well-formed fixture mapping is accepted',
        () =>
          `${validateFrameMap(baseFrameMap(), 'self-test mapping').frames.length} frames`
      )
    )
    for (const testCase of FRAME_MAP_CASES) {
      const map = clone(baseFrameMap())
      testCase.mutate(map)
      results.push(frameMapCase(testCase.name, map))
    }

    // 2. The freshly fetched dumps.
    results.push(...(await dumpCases(repoRoot)))

    // 3. The parser: a dump that yields nothing must abort, not enumerate nothing
    //    and call it full coverage.
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

    // 4. The enumerative diff.
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

function firstLine(text) {
  return String(text).split('\n')[0].slice(0, 160)
}
