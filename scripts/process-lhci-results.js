// Normalizes LHCI filesystem output into canonical JSON/HTML artifacts for CI consumption.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const cliArgs = process.argv.slice(2).reduce((acc, arg) => {
  if (!arg.startsWith('--')) return acc
  const [key, value] = arg.slice(2).split('=')
  acc[key] = value ?? true
  return acc
}, {})

const MANIFEST_DIR = path.resolve(
  process.cwd(),
  cliArgs.manifestDir || 'lighthouse-desktop'
)
const MANIFEST_PATH = path.join(MANIFEST_DIR, 'manifest.json')
const TARGET_URL = cliArgs.targetUrl || 'http://localhost:3000/'
const RESULTS_JSON = path.resolve(
  process.cwd(),
  cliArgs.outputJson || 'lighthouse-results.json'
)
const RESULTS_HTML = path.resolve(
  process.cwd(),
  cliArgs.outputHtml || 'lighthouse-desktop.html'
)

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function resolveExisting(baseDir, relativePathCandidates) {
  for (const relativePath of relativePathCandidates) {
    if (!relativePath) continue
    const fullPath = path.join(baseDir, relativePath)
    if (fs.existsSync(fullPath)) return fullPath
  }
  return null
}

if (!fs.existsSync(MANIFEST_PATH)) {
  throw new Error(
    'LHCI manifest.json not found. Ensure `lhci upload --target=filesystem` was executed before running this script.'
  )
}

const manifest = readJson(MANIFEST_PATH)

if (!Array.isArray(manifest) || manifest.length === 0) {
  throw new Error(
    'LHCI manifest is empty. No Lighthouse results were collected.'
  )
}

const matchingEntries = manifest.filter((entry) => entry.url === TARGET_URL)

if (matchingEntries.length === 0) {
  throw new Error(`No Lighthouse results for ${TARGET_URL} in LHCI manifest.`)
}

const representativeEntry =
  matchingEntries.find((entry) => entry.isRepresentativeRun) ||
  matchingEntries[0]

// LHCI manifest can use absolute paths (jsonPath/htmlPath) or relative (lhr/reportHtml)
let lhrPath = representativeEntry.jsonPath || representativeEntry.lhrPath
if (!lhrPath || !fs.existsSync(lhrPath)) {
  lhrPath = resolveExisting(MANIFEST_DIR, [
    representativeEntry.lhr,
    representativeEntry.lhrPath,
  ])
}
if (!lhrPath) {
  throw new Error(
    'Unable to locate Lighthouse JSON report for representative LHCI run.'
  )
}

let htmlPath =
  representativeEntry.htmlPath || representativeEntry.reportHtmlPath
if (!htmlPath || !fs.existsSync(htmlPath)) {
  htmlPath = resolveExisting(MANIFEST_DIR, [
    representativeEntry.reportHtml,
    representativeEntry.htmlPath,
    representativeEntry.html,
    'lighthouse.report.html',
  ])
}
if (!htmlPath) {
  throw new Error(
    'Unable to locate Lighthouse HTML report for representative LHCI run.'
  )
}

const lhr = readJson(lhrPath)
fs.writeFileSync(RESULTS_JSON, JSON.stringify(lhr, null, 2))
fs.copyFileSync(htmlPath, RESULTS_HTML)

console.log(`Lighthouse JSON written to ${RESULTS_JSON}`)
console.log(`Lighthouse HTML written to ${RESULTS_HTML}`)
