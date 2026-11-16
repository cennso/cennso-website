#!/usr/bin/env node
/**
 * Rich Results validation
 *
 * Checks the structured data of every page `next build` prerendered
 * (.next/server/pages/**.html) against the schema.org vocabulary and Google's
 * rich-result requirements, with @adobe/structured-data-validator and the
 * extractor it reads (@marbec/web-auto-extractor). See
 * specs/002-zero-click-structured-data/spec.md and the constitution, section VI.
 *
 * It complements scripts/validate-structured-data.py, which checks what the
 * site says about itself (the Organization's @id, its address, the breadcrumbs'
 * shape); this one checks the data against the vocabulary and Google's rules.
 *
 * ERROR, exit 1:
 * - a block that does not parse, a type schema.org does not define
 * - a property schema.org does not define for its type (the library reports it
 *   as a warning; validator.schema.org reports it as an error, and so do we)
 * - a property Google requires for the rich result is missing or invalid
 * WARNING, reported only:
 * - a property Google recommends is missing
 *
 * The vocabulary is a pinned schema.org release, downloaded once into
 * node_modules/.cache and checked against its SHA-256.
 *
 * Usage: yarn seo:rich [directory of HTML files]
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

import Validator from '@adobe/structured-data-validator'
import WebAutoExtractor from '@marbec/web-auto-extractor'

const SCHEMA_ORG_VERSION = '30.1'
const SCHEMA_ORG_URL = `https://schema.org/version/${SCHEMA_ORG_VERSION}/schemaorg-all-https.jsonld`
const SCHEMA_ORG_SHA256 =
  '07e7c663dbc12a0937581745e59a98ed12b8698f38e8e3b03650287d9df88ae5'
const CACHE = join(
  'node_modules',
  '.cache',
  'schemaorg',
  SCHEMA_ORG_VERSION,
  'schemaorg-all-https.jsonld'
)

const PAGES_DIR = process.argv[2] ?? join('.next', 'server', 'pages')

const sha256 = (data) => createHash('sha256').update(data).digest('hex')

async function vocabulary() {
  if (existsSync(CACHE) && sha256(readFileSync(CACHE)) === SCHEMA_ORG_SHA256) {
    return JSON.parse(readFileSync(CACHE, 'utf8'))
  }
  console.log(`⬇️  schema.org ${SCHEMA_ORG_VERSION}: ${SCHEMA_ORG_URL}`)
  const response = await fetch(SCHEMA_ORG_URL)
  if (!response.ok) {
    throw new Error(`${SCHEMA_ORG_URL} answered ${response.status}`)
  }
  const data = Buffer.from(await response.arrayBuffer())
  const digest = sha256(data)
  if (digest !== SCHEMA_ORG_SHA256) {
    throw new Error(
      `${SCHEMA_ORG_URL} has SHA-256 ${digest}, expected ${SCHEMA_ORG_SHA256}`
    )
  }
  mkdirSync(join(CACHE, '..'), { recursive: true })
  writeFileSync(CACHE, data)
  return JSON.parse(data.toString('utf8'))
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => {
      const name = file.split(sep).pop()
      // Next's generated 500 page is not ours.
      return name !== '500.html' && !name.startsWith('_')
    })
    .sort()
}

/** The route a prerendered file answers: index.html is /, a/b.html is /a/b. */
function route(file) {
  const path = relative(PAGES_DIR, file).split(sep).join('/')
  const page = '/' + path.replace(/\.html$/, '')
  return page === '/index' ? '/' : page
}

/** "Organization > contactPoint (ContactPoint)" from the library's path. */
function where(path = []) {
  return path
    .map((step) =>
      step.property
        ? `${step.property}${step.index !== undefined ? `[${step.index}]` : ''}${step.type ? ` (${step.type})` : ''}`
        : `${step.type}${step.index ? `[${step.index}]` : ''}`
    )
    .join(' > ')
}

function isError(issue) {
  // An unknown property comes back as a WARNING with errorType "schemaOrg".
  return issue.severity === 'ERROR' || issue.errorType === 'schemaOrg'
}

async function main() {
  if (!existsSync(PAGES_DIR)) {
    console.log(`❌ ${PAGES_DIR} not found. Run \`yarn build\` first.`)
    return 1
  }
  const files = await htmlFiles(PAGES_DIR)
  if (files.length === 0) {
    console.log(`❌ No HTML files in ${PAGES_DIR}.`)
    return 1
  }

  const validator = new Validator(await vocabulary())
  console.log(
    `📄 ${files.length} page${files.length === 1 ? '' : 's'}, schema.org ${SCHEMA_ORG_VERSION}, Google rich-result rules`
  )
  console.log('='.repeat(50))

  let errors = 0
  let warnings = 0
  for (const file of files) {
    const data = new WebAutoExtractor({
      addLocation: true,
      embedSource: ['rdfa', 'microdata'],
    }).parse(readFileSync(file, 'utf8'))
    const types = Object.entries(data.jsonld ?? {}).flatMap(([type, items]) =>
      items.map(() => type)
    )
    const issues = await validator.validate(data)
    const pageErrors = issues.filter(isError)
    const pageWarnings = issues.filter((issue) => !isError(issue))
    errors += pageErrors.length
    warnings += pageWarnings.length

    const mark = pageErrors.length ? '❌' : pageWarnings.length ? '⚠️ ' : '✅'
    console.log(
      `\n${mark} ${route(file)}  ${types.length ? types.join(', ') : '(no structured data)'}`
    )
    for (const issue of pageErrors) {
      console.log(`   ERROR    ${where(issue.path)}: ${issue.issueMessage}`)
    }
    for (const issue of pageWarnings) {
      console.log(`   WARNING  ${where(issue.path)}: ${issue.issueMessage}`)
    }
  }

  console.log('\n📊 RICH RESULTS VALIDATION')
  console.log('='.repeat(50))
  console.log(`Pages checked: ${files.length}`)
  console.log(`Errors: ${errors}`)
  console.log(`Warnings (reported only): ${warnings}`)
  if (errors) {
    console.log(
      '\n💡 Compare with https://validator.schema.org and https://search.google.com/test/rich-results'
    )
    return 1
  }
  console.log('\n🎉 ✅ RICH RESULTS VALIDATION PASSED!')
  return 0
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`❌ ${error.message}`)
    process.exit(1)
  }
)
