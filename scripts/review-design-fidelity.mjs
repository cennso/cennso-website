#!/usr/bin/env node
/**
 * Design-fidelity review — a local, hook-driven read of the site against the live design.
 *
 * This is NOT a CI gate, and it is not fed by a checked-in copy of the Figma file. Both
 * of those were the previous design and both were wrong for the same reason: a committed
 * copy of a design goes stale silently. The designer edits Figma, CI keeps comparing the
 * site against last month's frames, and the build stays green while the site drifts —
 * precisely the failure this harness was built to prevent.
 *
 * So the design is fetched live, at review time, by an agent that has the Figma MCP tool.
 * The agent calls `get_design_context` once per affected frame — one call returns the
 * whole frame with its symbols expanded, and that expansion is the enumeration source —
 * writes each code block unmodified into a scratch directory outside the repository, and
 * runs this script. Everything after that is deterministic: this script does the
 * matching, and it prints the counts. It is not a thing to eyeball.
 *
 *   node scripts/review-design-fidelity.mjs --where
 *       print the directory and the file names to write the dumps to, then exit.
 *
 *   node scripts/review-design-fidelity.mjs --frames=main-dark,main-light
 *       self-test, build the production site's server, diff those frames, print counts.
 *
 *   yarn design:review:selftest
 *       the proof suite alone — no dumps, no site, no Figma.
 *
 * Every degenerate input is a hard failure, and the self-test proves it on every run
 * before a single real comparison is made.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildInventory,
  loadFrameMap,
  selectFrames,
} from './design-fidelity/build-inventory.mjs'
import {
  assertDumpDirIsNotCommittable,
  defaultDumpDir,
  dumpFileName,
} from './design-fidelity/dumps.mjs'
import { FidelityError } from './design-fidelity/errors.mjs'
import { launchBrowser, startSiteServer } from './design-fidelity/env.mjs'
import { runInventory } from './design-fidelity/inventory-runner.mjs'
import { loadExclusions } from './design-fidelity/match.mjs'
import { runSelfTest } from './design-fidelity/selftest.mjs'

const REPO_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))

function parseArgs(argv) {
  const args = {
    frames: null,
    dumpDir: process.env.DESIGN_REVIEW_DUMPS || defaultDumpDir(),
    baseUrl: process.env.DESIGN_REVIEW_BASE_URL || null,
    port: Number(process.env.DESIGN_REVIEW_PORT || 3210),
    selfTestOnly: false,
    where: false,
    verbose: false,
  }
  for (const arg of argv) {
    if (arg === '--selftest-only') args.selfTestOnly = true
    else if (arg === '--where') args.where = true
    else if (arg === '--verbose' || arg === '-v') args.verbose = true
    else if (arg.startsWith('--frames='))
      args.frames = arg
        .slice(9)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    else if (arg.startsWith('--dumps='))
      args.dumpDir = path.resolve(arg.slice(8))
    else if (arg.startsWith('--base-url=')) args.baseUrl = arg.slice(11)
    else if (arg.startsWith('--port=')) args.port = Number(arg.slice(7))
    else throw new FidelityError(`unknown argument ${JSON.stringify(arg)}.`)
  }
  if (args.frames && args.frames.length === 0) {
    throw new FidelityError('--frames was given with no frame ids.', {
      hint: 'Omit it to review every frame in design/figma/frames.json.',
    })
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

/** The instructions the agent needs before it can fetch anything. */
function printWhere(map, frames, dumpDir) {
  heading('Where to write the freshly fetched frames')
  process.stdout.write(
    `  Figma file  ${map.figma.fileKey}  (${map.figma.designName ?? 'design'})\n` +
      `  Directory   ${dumpDir}\n\n` +
      '  One `get_design_context` call per frame. Save the code block UNMODIFIED,\n' +
      '  including the `const img… = "https://…"` constants at the top:\n\n'
  )
  for (const frame of frames) {
    process.stdout.write(
      `    node ${frame.figmaNode.padEnd(8)} ${frame.route.padEnd(18)} ${`[${frame.theme}]`.padEnd(9)} ->  ${dumpFileName(frame.id)}\n`
    )
  }
  const symbols = map.figma.expandTheseSymbols ?? {}
  if (Object.keys(symbols).length) {
    process.stdout.write(
      '\n  Symbols that must come back expanded (an unexpanded symbol is a picture of a\n' +
        '  navigation, not its values):\n'
    )
    for (const [id, note] of Object.entries(symbols)) {
      process.stdout.write(`    ${id.padEnd(8)} ${note}\n`)
    }
  }
  process.stdout.write(
    '\n  These dumps are scratch. They are never committed, and this review refuses any\n' +
      `  dump older than an hour — a stale dump is the committed copy of the design by\n` +
      '  another name.\n'
  )
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const map = loadFrameMap(REPO_ROOT)
  const frames = selectFrames(map, args.frames)

  if (args.where) {
    printWhere(map, frames, args.dumpDir)
    return 0
  }

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
      process.stdout.write('\n--selftest-only: skipping the site comparison.\n')
      return 0
    }

    // 2. Read the frames the agent just fetched.
    assertDumpDirIsNotCommittable(args.dumpDir, REPO_ROOT)
    const inventory = await buildInventory({
      map,
      frames,
      dumpDir: args.dumpDir,
    })
    const exclusions = loadExclusions(
      path.join(REPO_ROOT, 'design', 'figma', 'exclusions.json')
    )

    heading(
      `Design fidelity — Figma ${map.figma.fileKey}, fetched ${inventory.fetchedAt}`
    )
    for (const frame of inventory.frames) {
      process.stdout.write(
        `  ${frame.id.padEnd(16)} node ${frame.figmaNode.padEnd(8)} ${frame.route.padEnd(18)} [${frame.theme}]  ` +
          `${String(frame.textNodes.length).padStart(3)} text, ${String(frame.boxNodes.length).padStart(3)} box, ` +
          `${String(frame.gaps.length).padStart(2)} gaps  (dump ${frame.dumpSha256.slice(0, 12)})\n`
      )
    }

    // 3. Serve the built site.
    let baseUrl = args.baseUrl
    if (!baseUrl) {
      site = await startSiteServer({ repoRoot: REPO_ROOT, port: args.port })
      baseUrl = site.baseUrl
    }
    process.stdout.write(
      `\nComparing against ${baseUrl} at ${inventory.viewport.width}x${inventory.viewport.height}px — ` +
        'the width the Figma frames are drawn at.\n' +
        '  Every number below is that viewport and no other. There are no mobile artboards\n' +
        '  in this Figma file, so nothing here is a statement about narrow screens; those are\n' +
        "  Lighthouse's and yarn perf:mobile's to answer.\n"
    )

    const enumerated = await runInventory({
      inventory,
      exclusions,
      knownFrameIds: map.frames.map((f) => f.id),
      browser,
      baseUrl,
    })

    heading('Coverage — every design node in every frame under review')
    const total = {
      designNodes: 0,
      matched: 0,
      mismatched: 0,
      unreached: 0,
    }
    for (const c of enumerated.coverage) {
      const mismatched = c.findings.filter(
        (f) => f.property !== 'presence'
      ).length
      total.designNodes += c.designTextNodes
      total.matched += c.matchedTextNodes
      total.mismatched += mismatched
      total.unreached += c.unmatchedDesignTextNodes
      const pct = c.designTextNodes
        ? Math.round((c.matchedTextNodes / c.designTextNodes) * 100)
        : 0
      process.stdout.write(
        `\n  ${c.frame.id}  (node ${c.frame.figmaNode}, ${c.frame.route} [${c.frame.theme}])\n` +
          `    design nodes ${String(c.designTextNodes).padStart(3)}` +
          `   matched ${String(c.matchedTextNodes).padStart(3)} (${pct}%)` +
          `   mismatched ${String(mismatched).padStart(3)}` +
          `   unreached ${String(c.unmatchedDesignTextNodes).padStart(3)}\n` +
          `    rendered     ${String(c.unmatchedRenderedTextNodes).padStart(3)} element(s) on the page match no design node` +
          `   ${c.ambiguousTextGroups} repeated-copy group(s) of unequal size` +
          `   ${c.ambiguousPairings} node(s) too ambiguous to pair\n` +
          `    boxes        ${String(c.designBoxNodes).padStart(3)} in the design` +
          `   ${String(c.matchedBoxNodes).padStart(3)} bridged to an element` +
          `   ${String(c.unmatchedBoxNodes).padStart(3)} not bridged` +
          `   (+${c.artworkLayerNodes} image layer(s), read as artwork below)\n` +
          `    gaps         ${String(c.designGaps).padStart(3)} measured in the design` +
          `   ${String(c.comparedGaps).padStart(3)} compared\n` +
          `    artwork      ${String(c.designArtworkNodes).padStart(3)} node(s) the frame exports art for` +
          `   ${String(c.bridgedArtworkNodes).padStart(3)} compared against the served image` +
          `   ${String(c.unbridgedArtworkNodes).padStart(3)} not bridged\n` +
          `    excluded     ${String(c.excluded).padStart(3)} node(s), each with a written reason in design/figma/exclusions.json\n`
      )
    }

    const reachedPct = total.designNodes
      ? Math.round((total.matched / total.designNodes) * 100)
      : 0
    heading(`Result — measured at ${inventory.viewport.width}px only`)
    process.stdout.write(
      `  design nodes  ${total.designNodes}\n` +
        `  matched       ${total.matched} (${reachedPct}%)\n` +
        `  mismatched    ${total.mismatched}\n` +
        `  unreached     ${total.unreached}\n` +
        '\n  Report these four numbers. "It matches Figma" with no counts behind it is not\n' +
        '  an answer — an unreached design node means nobody is checking it, which is the\n' +
        '  state every defect this harness exists for was shipped in.\n'
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

    if (enumerated.findings.length) {
      exitCode = 1
      process.stdout.write(`\n  ${enumerated.findings.length} finding(s).\n`)
      reportFailures(enumerated.findings)
      process.stdout.write(
        '\n  Each line above names the Figma node the value came from. Read that node with\n' +
          '  get_design_context before changing anything — do not sample a screenshot.\n'
      )
    } else {
      process.stdout.write('\n  No findings.\n')
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
        `\nDESIGN FIDELITY REVIEW ABORTED\n  ${err.message}\n`
      )
      if (err.hint) process.stderr.write(`  ${err.hint}\n`)
    } else {
      process.stderr.write(
        `\nDESIGN FIDELITY REVIEW ABORTED\n  ${err.stack || err.message}\n`
      )
    }
    process.exit(1)
  })
