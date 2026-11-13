#!/usr/bin/env node
/**
 * Agent-friendly docs check
 *
 * Runs afdocs (https://afdocs.dev, the Agent-Friendly Documentation Spec)
 * against a running site and reads its JSON result: every `fail` or `error`
 * blocks (exit 1), every `warn` is reported. afdocs' own exit code is not a
 * documented contract, so it is not used. Settings and the reasons for them are
 * in agent-docs.config.yml. See spec 003 and the constitution, section VI.
 *
 * It checks a served site, not the build's files: `yarn build && yarn next
 * start`, then `yarn agents:check` (http://localhost:3000) or `yarn
 * agents:check <url>`. In GitHub Actions the result also goes to the job
 * summary.
 *
 * Usage: yarn agents:check [url]
 */
import { spawnSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const AFDOCS = join(ROOT, 'node_modules', 'afdocs', 'bin', 'afdocs.mjs')
const CONFIG = join(ROOT, 'agent-docs.config.yml')
const url = process.argv[2] ?? 'http://localhost:3000'

const MARK = { pass: '✅', warn: '⚠️ ', fail: '❌', error: '❌', skip: '➖' }

function run() {
  const result = spawnSync(
    process.execPath,
    [AFDOCS, 'check', url, '--config', CONFIG, '--format', 'json', '--score'],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )
  if (result.error) throw result.error
  try {
    return JSON.parse(result.stdout)
  } catch {
    process.stderr.write(result.stderr)
    throw new Error(`afdocs printed no JSON (exit ${result.status})`)
  }
}

function summary(report, blocking, warnings) {
  const cell = (text) => String(text ?? '').replace(/\|/g, '\\|')
  const rows = (results) =>
    results
      .map(
        (r) =>
          `| ${MARK[r.status]} ${r.status} | \`${r.id}\` | ${cell(r.message)} |`
      )
      .join('\n')
  const { overall, grade } = report.scoring ?? {}
  const verdict = blocking.length
    ? `❌ ${blocking.length} check(s) failed`
    : '✅ No check failed'
  const lines = [
    '## 🤖 Agent-friendly docs (afdocs)',
    '',
    `${verdict} · ${warnings.length} warning(s) · score ${overall ?? '?'} / 100 (${grade ?? '?'}) · ${report.testedPages} page(s) of ${report.url}`,
    '',
  ]
  if (blocking.length || warnings.length) {
    lines.push(
      '| Status | Check | Result |',
      '|---|---|---|',
      rows([...blocking, ...warnings]),
      ''
    )
  }
  lines.push(
    '<details><summary>All checks</summary>',
    '',
    '| Status | Check | Result |',
    '|---|---|---|',
    rows(report.results),
    '',
    '</details>',
    ''
  )
  return lines.join('\n')
}

function main() {
  console.log(`🤖 afdocs on ${url}`)
  const report = run()
  const blocking = report.results.filter(
    (r) => r.status === 'fail' || r.status === 'error'
  )
  const warnings = report.results.filter((r) => r.status === 'warn')

  let category
  for (const r of report.results) {
    if (r.category !== category) {
      category = r.category
      console.log(`\n${category}`)
    }
    console.log(
      `  ${MARK[r.status]} ${r.status.padEnd(5)} ${r.id}: ${r.message}`
    )
  }

  const { overall, grade } = report.scoring ?? {}
  console.log('\n📊 AGENT-FRIENDLY DOCS')
  console.log('='.repeat(50))
  console.log(`Pages tested: ${report.testedPages}`)
  console.log(`Score: ${overall} / 100 (${grade})`)
  console.log(`Failed: ${blocking.length}`)
  console.log(`Warnings (reported only): ${warnings.length}`)

  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      summary(report, blocking, warnings)
    )
  }

  if (blocking.length) {
    console.log('\n💡 Fixes: https://afdocs.dev/checks/')
    return 1
  }
  console.log('\n🎉 ✅ AGENT-FRIENDLY DOCS CHECK PASSED!')
  return 0
}

try {
  process.exit(main())
} catch (error) {
  console.error(`❌ ${error.message}`)
  process.exit(1)
}
