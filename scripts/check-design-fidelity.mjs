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
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { FidelityError } from './design-fidelity/errors.mjs'
import { launchBrowser, startSiteServer } from './design-fidelity/env.mjs'
import { runSnapshot } from './design-fidelity/runner.mjs'
import { runSelfTest } from './design-fidelity/selftest.mjs'
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
  }
  for (const arg of argv) {
    if (arg === '--selftest-only') args.selfTestOnly = true
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

  if (args.fingerprints) {
    heading('Implementation fingerprints')
    for (const frame of snapshot.frames) {
      if (!frame.implementationFingerprint) continue
      const digest = fingerprintFiles(
        REPO_ROOT,
        frame.implementationFingerprint.files
      )
      const state =
        digest === frame.implementationFingerprint.sha256
          ? 'unchanged'
          : 'CHANGED'
      process.stdout.write(`  ${frame.id.padEnd(14)} ${digest}  (${state})\n`)
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
    process.stdout.write(
      `\nSelf-test: ${selfTest.length - broken.length}/${selfTest.length} cases behaved as required` +
        ` (1 positive control, ${selfTest.length - 1} degenerate inputs that must not pass).\n`
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

    heading('Coverage')
    for (const df of snapshot.designFrames) {
      const mark = df.capture === 'captured' ? 'captured    ' : 'NOT CAPTURED'
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

    heading('Result')
    process.stdout.write(
      `  ${result.executed} assertions executed against the rendered site.\n`
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
