#!/usr/bin/env node
/**
 * Design-fidelity gate.
 *
 * Compares the rendered site against a checked-in snapshot of the Cennso
 * Design 4.0 Figma file. CI has no Figma access, so the ground truth lives in
 * design/figma/snapshot.json; this script renders the built site in a real
 * browser and asserts *computed* values against it — never a pixel diff, which
 * antialiasing and font rasterisation would make noisy.
 *
 * Every degenerate input is a hard failure, and the self-test proves it on
 * every run before a single real assertion is made.
 *
 *   yarn design:fidelity                 build must exist (.next); starts next start
 *   yarn design:fidelity --selftest-only just the proof suite, no site needed
 *   yarn design:fidelity --base-url=…    assert against an already-running server
 *   yarn design:fidelity --fingerprints  print current digests for re-baselining
 *   yarn design:inventory                rebuild design/figma/inventory.json from raw/
 *   yarn design:inventory --check        prove the committed inventory matches raw/ (CI)
 *
 * There are two passes, and they answer different questions.
 *
 *   The CURATED pass (design/figma/snapshot.json) asserts a hand-picked set of tokens and
 *   elements. It is precise and it is a sample.
 *
 *   The ENUMERATIVE pass (design/figma/inventory.json) asserts every text node in every
 *   frame, matched to the DOM by its own text, and reports its coverage out loud —
 *   including the design nodes it could NOT reach. That number is the point: a check that
 *   only ever asserts what somebody listed cannot tell you what nobody listed, which is
 *   how card alignment, a dimmed card outline, a footer band and a heading gap all
 *   shipped wrong under a green build.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  checkInventory,
  readInventoryIfPresent,
  writeInventory,
} from './design-fidelity/build-inventory.mjs'
import { FidelityError } from './design-fidelity/errors.mjs'
import { launchBrowser, startSiteServer } from './design-fidelity/env.mjs'
import { runInventory } from './design-fidelity/inventory-runner.mjs'
import { runSnapshot } from './design-fidelity/runner.mjs'
import { runSelfTest } from './design-fidelity/selftest.mjs'
import { loadExclusions } from './design-fidelity/match.mjs'
import { fingerprintFiles, loadSnapshot } from './design-fidelity/snapshot.mjs'

const REPO_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const DEFAULT_SNAPSHOT = path.join(
  REPO_ROOT,
  'design',
  'figma',
  'snapshot.json'
)

function parseArgs(argv) {
  const args = {
    snapshot: DEFAULT_SNAPSHOT,
    baseUrl: process.env.DESIGN_FIDELITY_BASE_URL || null,
    port: Number(process.env.DESIGN_FIDELITY_PORT || 3210),
    selfTestOnly: false,
    fingerprints: false,
    verbose: false,
    inventory: false,
    inventoryCheck: false,
    fetchAssets: false,
  }
  for (const arg of argv) {
    if (arg === '--selftest-only') args.selfTestOnly = true
    else if (arg === '--inventory') args.inventory = true
    else if (arg === '--check') args.inventoryCheck = true
    else if (arg === '--fetch-assets') args.fetchAssets = true
    else if (arg === '--fingerprints') args.fingerprints = true
    else if (arg === '--verbose' || arg === '-v') args.verbose = true
    else if (arg.startsWith('--snapshot='))
      args.snapshot = path.resolve(arg.slice(11))
    else if (arg.startsWith('--base-url=')) args.baseUrl = arg.slice(11)
    else if (arg.startsWith('--port=')) args.port = Number(arg.slice(7))
    else throw new FidelityError(`unknown argument ${JSON.stringify(arg)}.`)
  }
  return args
}

function heading(text) {
  process.stdout.write(`\n${text}\n${'─'.repeat(text.length)}\n`)
}

function reportFailures(failures) {
  for (const f of failures) {
    process.stdout.write(
      `\n  ✗ ${f.scope} — Figma node ${f.figmaNode}${f.evidence ? ` (${f.evidence})` : ''}\n` +
        `      route ${f.route}   theme ${f.theme}\n` +
        `      selector  ${f.selector}\n` +
        `      ${f.property}\n` +
        `        expected  ${f.expected}\n` +
        `        rendered  ${f.actual}\n` +
        `      fix in    ${f.file}\n`
    )
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const snapshot = loadSnapshot(args.snapshot)

  if (args.inventory) {
    if (args.inventoryCheck) {
      await checkInventory(REPO_ROOT)
      heading('Design inventory')
      process.stdout.write(
        '  design/figma/inventory.json is exactly what design/figma/raw/ produces.\n'
      )
      return 0
    }
    const built = await writeInventory(REPO_ROOT, {
      fetchAssets: args.fetchAssets,
    })
    heading('Design inventory rebuilt')
    for (const frame of built.frames) {
      process.stdout.write(
        `  ${frame.id.padEnd(16)} node ${frame.figmaNode.padEnd(8)} ` +
          `${String(frame.textNodes.length).padStart(3)} text nodes, ` +
          `${String(frame.boxNodes.length).padStart(3)} box nodes, ` +
          `${String(frame.gaps.length).padStart(2)} gaps, ` +
          `${frame.assetFills.length} artwork colours\n`
      )
    }
    if (!args.fetchAssets) {
      process.stdout.write(
        '\n  Artwork colours were carried over, not refetched. Pass --fetch-assets during a\n' +
          '  fresh Figma pull; the export URLs in raw/ expire about a week after it.\n'
      )
    }
    return 0
  }

  if (args.fingerprints) {
    heading('Implementation fingerprints')
    const inventory = readInventoryIfPresent(REPO_ROOT)
    const all = [...snapshot.frames, ...(inventory?.frames ?? [])]
    const seen = new Set()
    for (const frame of all) {
      if (!frame.implementationFingerprint) continue
      const key = frame.implementationFingerprint.files.join('|')
      if (seen.has(key)) continue
      seen.add(key)
      const digest = fingerprintFiles(
        REPO_ROOT,
        frame.implementationFingerprint.files
      )
      const state =
        digest === frame.implementationFingerprint.sha256
          ? 'unchanged'
          : 'CHANGED'
      process.stdout.write(`  ${frame.id.padEnd(16)} ${digest}  (${state})\n`)
    }
    return 0
  }

  heading(
    `Design fidelity — Figma ${snapshot.figma.fileKey}, pulled ${snapshot.figma.pulledAt}`
  )

  const { browser, close: closeBrowser } = await launchBrowser()
  let exitCode = 0
  let site = null
  try {
    // 1. Prove the harness can fail, before trusting anything it says.
    const selfTest = await runSelfTest({
      browser,
      repoRoot: REPO_ROOT,
      verbose: args.verbose,
    })
    const broken = selfTest.filter((r) => !r.ok)
    const controls = selfTest.filter((r) =>
      r.name.startsWith('positive control')
    ).length
    process.stdout.write(
      `\nSelf-test: ${selfTest.length - broken.length}/${selfTest.length} cases behaved as required` +
        ` (${controls} positive control(s), ${selfTest.length - controls} degenerate inputs that must not pass).\n`
    )
    if (broken.length) {
      for (const r of broken) {
        process.stdout.write(`  ✗ ${r.name}\n      got ${r.got}\n`)
      }
      throw new FidelityError(
        `${broken.length} self-test case(s) did not behave as required — the harness itself is untrustworthy, so its verdict on the site means nothing.`
      )
    }

    if (args.selfTestOnly) {
      process.stdout.write('\n--selftest-only: skipping the site assertions.\n')
      return 0
    }

    // 2. Serve the built site.
    let baseUrl = args.baseUrl
    if (!baseUrl) {
      site = await startSiteServer({ repoRoot: REPO_ROOT, port: args.port })
      baseUrl = site.baseUrl
    }
    process.stdout.write(`Asserting against ${baseUrl}\n`)

    const result = await runSnapshot({
      snapshot,
      browser,
      baseUrl,
      repoRoot: REPO_ROOT,
    })

    heading('Coverage — curated pass')
    for (const df of snapshot.designFrames) {
      const mark = df.capture === 'captured' ? 'curated    ' : 'NOT CURATED'
      process.stdout.write(
        `  ${mark} ${df.figmaNode.padEnd(8)} ${df.name}` +
          (df.capture === 'captured'
            ? '\n'
            : `\n                        reason: ${df.reason}\n`)
      )
    }
    if (result.pending.length) {
      process.stdout.write(
        '\n  Frames captured but not yet enforced (implementation still pending):\n'
      )
      for (const p of result.pending) {
        process.stdout.write(
          `    ${p.frame.padEnd(12)} node ${p.figmaNode.padEnd(8)} ${p.route} [${p.theme}] — ${p.assertions} assertions held back.\n` +
            `                 Their implementation files are fingerprinted, so this state cannot outlive the next edit to them.\n`
        )
      }
    }
    for (const note of result.notes) process.stdout.write(`  note: ${note}\n`)

    // ---------------------------------------------------------------- //
    // The enumerative pass.                                             //
    // ---------------------------------------------------------------- //
    const inventory = await checkInventory(REPO_ROOT)
    const exclusions = loadExclusions(
      path.join(REPO_ROOT, 'design', 'figma', 'exclusions.json')
    )
    const enumerated = await runInventory({
      inventory,
      exclusions,
      themes: snapshot.themes,
      browser,
      baseUrl,
      repoRoot: REPO_ROOT,
    })

    heading('Enumerative coverage — every text node in every frame')
    let designNodes = 0
    let matchedNodes = 0
    let unreachedNodes = 0
    for (const c of enumerated.coverage) {
      designNodes += c.designTextNodes
      matchedNodes += c.matchedTextNodes
      unreachedNodes += c.unmatchedDesignTextNodes
      const pct = c.designTextNodes
        ? Math.round((c.matchedTextNodes / c.designTextNodes) * 100)
        : 0
      process.stdout.write(
        `\n  ${c.frame.id}  (node ${c.frame.figmaNode}, ${c.frame.route} [${c.frame.theme}], ${c.status})\n` +
          `    text nodes   ${String(c.designTextNodes).padStart(3)} in the design` +
          `   ${String(c.matchedTextNodes).padStart(3)} matched (${pct}%)` +
          `   ${String(c.unmatchedDesignTextNodes).padStart(3)} NOT reached\n` +
          `    rendered     ${String(c.unmatchedRenderedTextNodes).padStart(3)} element(s) on the page match no design node` +
          `   ${c.ambiguousTextGroups} repeated-copy group(s) of unequal size\n` +
          `    boxes        ${String(c.designBoxNodes).padStart(3)} in the design` +
          `   ${String(c.matchedBoxNodes).padStart(3)} bridged to an element` +
          `   ${String(c.unmatchedBoxNodes).padStart(3)} not bridged\n` +
          `    gaps         ${String(c.designGaps).padStart(3)} measured in the design` +
          `   ${String(c.comparedGaps).padStart(3)} compared\n` +
          `    artwork      ${String(c.designAssetFills).padStart(3)} colour(s) in the frame's exported vectors` +
          `   ${c.missingAssetFills.length} absent from the page\n` +
          `    excluded     ${String(c.excluded).padStart(3)} node(s), each with a written reason in design/figma/exclusions.json\n`
      )
    }
    const reachedPct = designNodes
      ? Math.round((matchedNodes / designNodes) * 100)
      : 0
    process.stdout.write(
      `\n  TOTAL: ${matchedNodes} of ${designNodes} design text nodes matched (${reachedPct}%);` +
        ` ${unreachedNodes} not reached.\n` +
        '  An unreached design node is a finding, not a pass. Read them as "nobody is checking this".\n'
    )
    if (enumerated.notComparable.length && args.verbose) {
      process.stdout.write('\n  Not comparable:\n')
      for (const note of enumerated.notComparable) {
        process.stdout.write(`    ${note}\n`)
      }
    } else if (enumerated.notComparable.length) {
      process.stdout.write(
        `\n  ${enumerated.notComparable.length} property comparison(s) skipped as not comparable (run with -v to list them).\n`
      )
    }
    if (enumerated.pending.length) {
      process.stdout.write(
        '\n  Frames enumerated but not yet enforced (implementation still pending):\n'
      )
      for (const p of enumerated.pending) {
        process.stdout.write(
          `    ${p.frame.padEnd(16)} node ${p.figmaNode.padEnd(8)} ${p.route} [${p.theme}] — ` +
            `${p.heldBack} finding(s) across ${p.textNodes} text nodes held back.\n`
        )
      }
      process.stdout.write(
        '                     Their implementation files are fingerprinted, so this state cannot outlive the next edit to them.\n'
      )
    }

    heading('Result')
    result.failures.push(...enumerated.findings)
    process.stdout.write(
      `  ${result.executed} curated assertions executed against the rendered site.\n` +
        `  ${matchedNodes} design text nodes diffed property-by-property.\n`
    )
    if (result.failures.length) {
      exitCode = 1
      process.stdout.write(`  ${result.failures.length} failed.\n`)
      reportFailures(result.failures)
      process.stdout.write(
        '\n  Each line above names the Figma node the value came from. Read the node with the\n' +
          '  Figma MCP design-context tool before changing anything — do not sample a screenshot.\n'
      )
    } else {
      process.stdout.write('  All assertions passed.\n')
    }
  } finally {
    if (site) await site.close()
    await closeBrowser()
  }
  return exitCode
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    if (err instanceof FidelityError) {
      process.stderr.write(
        `\nDESIGN FIDELITY CHECK ABORTED\n  ${err.message}\n`
      )
      if (err.hint) process.stderr.write(`  ${err.hint}\n`)
    } else {
      process.stderr.write(
        `\nDESIGN FIDELITY CHECK ABORTED\n  ${err.stack || err.message}\n`
      )
    }
    process.exit(1)
  })
