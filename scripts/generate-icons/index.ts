/**
 * Draws every icon the site serves from one drawing of the Cennso sign,
 * `sign.svg`, and writes the web manifest that names them. Runs before every
 * build (`prebuild`), like the preview cards, so the icons follow the design
 * system's colours; the output is gitignored.
 *
 *     yarn generate:icons
 *
 * ## The shapes, and why each is what it is
 *
 * One look everywhere: the sign in the light theme's `primary-foreground` on a
 * tile of its `primary`. A transparent sign in `primary` disappears on a dark
 * browser tab and in dark search results; on the tile it reads the same on
 * every background.
 *
 *   - **Tab** (favicon, SVG icon, 192 and 512 px): a rounded tile with
 *     transparent corners. Nothing crops these, so the tile's shape is ours.
 *   - **iOS** (180 px): a full square, opaque. iOS rounds the corners itself
 *     and paints whatever is transparent black, so rounded corners of our own
 *     would come out as black ones.
 *   - **Maskable** (512 px): a full square, opaque, the sign inside the centred
 *     circle of 80 % of the width that a web manifest promises Android, whose
 *     launchers crop to their own shape.
 *   - **Logo** (512 px): the tab tile on the light theme's background, opaque,
 *     for structured data, where Google requires a logo that looks right on
 *     white.
 *
 * ## What `sign.svg` has to be
 *
 * The sign alone, in filled shapes, with no background: an export straight
 * from the designer's tool. Two things about it do not matter, because the
 * script undoes them:
 *
 *   - **Its margin.** The drawing is rendered once and its transparent edges
 *     trimmed, so the sign is placed by where its pixels are, not by the
 *     artboard around it.
 *   - **Its colours.** Fills, strokes, classes and `<style>` are dropped and the
 *     sign takes the ink below. An export that declares `evenodd` anywhere keeps
 *     it, since that is how a drawing tool writes a shape with a hole.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { themes } from '@cennso/theme'
import sharp from 'sharp'
import { parse as parseYaml } from 'yaml'

import { readIco, readPng, writeIco } from './image-header'
import { hexColor } from '../../lib/theme-color'
import siteMetadata from '../../siteMetadata'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../..')
const PUBLIC = join(ROOT, 'public')

/** Three decimals: below a thousandth of a pixel, and readable in a diff. */
const round = (value: number) => Number(value.toFixed(3))

const TILE = hexColor(themes.light.primary)
const INK = hexColor(themes.light.primaryForeground)
const PAPER = hexColor(themes.light.background)

type ShapeName = 'tab' | 'ios' | 'maskable' | 'logo'

interface Shape {
  /** A fraction of the side. */
  readonly radius: number
  /** The fraction of the side the sign's longer edge takes. */
  readonly sign: number
  readonly opaque?: boolean
  readonly safeZone?: boolean
  readonly paper?: boolean
}

const SHAPES: Record<ShapeName, Shape> = {
  tab: { radius: 0.2, sign: 0.72 },
  ios: { radius: 0, sign: 0.62, opaque: true },
  maskable: { radius: 0, sign: 0.56, opaque: true, safeZone: true },
  logo: { radius: 0.2, sign: 0.72, paper: true, opaque: true },
}

interface Target {
  /** Under `public/`. */
  readonly path: string
  readonly shape: ShapeName
  readonly size?: number
  readonly ico?: readonly number[]
  readonly svg?: number
}

/**
 * Every file at the root of the site is one a browser or a platform may ask
 * for by name; `_document.tsx` links them too. `icons/` holds what only the
 * manifest names; `assets/logo.png` is what structured data names.
 */
const TARGETS: readonly Target[] = [
  { path: 'favicon.ico', ico: [16, 32, 48], shape: 'tab' },
  { path: 'icon.svg', svg: 48, shape: 'tab' },
  { path: 'icon.png', size: 192, shape: 'tab' },
  { path: 'apple-touch-icon.png', size: 180, shape: 'ios' },
  { path: 'icons/icon-512.png', size: 512, shape: 'tab' },
  { path: 'icons/maskable-512.png', size: 512, shape: 'maskable' },
  { path: 'assets/logo.png', size: 512, shape: 'logo' },
]

interface Sign {
  readonly shapes: string
  readonly fillRule: 'evenodd' | 'nonzero'
  readonly width: number
  readonly height: number
  readonly viewBox: string
}

/** The drawing's shapes without their colours, and the box its pixels occupy, in its own units. */
async function readSign(file: string): Promise<Sign> {
  const source = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  const root = /<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(source)
  if (root === null) throw new Error(`${file}: no <svg> element`)
  const viewBox = /\bviewBox="([^"]+)"/.exec(root[1])?.[1]
  if (viewBox === undefined)
    throw new Error(`${file}: the <svg> has no viewBox`)
  const shapes = root[2]
    .replace(/<style\b[\s\S]*?<\/style>/g, '')
    .replace(/\s(?:fill|stroke|stroke-width|style|class)="[^"]*"/g, '')
    .trim()
  const fillRule = /evenodd/.test(source) ? 'evenodd' : 'nonzero'

  // Rendered with a margin of its own, so that a drawing touching its artboard
  // still has a transparent corner for the trim to start from.
  const [x, y, width, height] = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  const pad = Math.max(width, height) * 0.05
  const scale = 2048 / (Math.max(width, height) + 2 * pad)
  const probe = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round((width + 2 * pad) * scale)}"`,
    ` height="${Math.round((height + 2 * pad) * scale)}"`,
    ` viewBox="${x - pad} ${y - pad} ${width + 2 * pad} ${height + 2 * pad}">`,
    `<g fill="#000" fill-rule="${fillRule}">${shapes}</g></svg>`,
  ].join('')
  const { info } = await sharp(Buffer.from(probe))
    .trim()
    .toBuffer({ resolveWithObject: true })
  if (info.trimOffsetLeft === undefined || info.trimOffsetTop === undefined) {
    throw new Error(`${file}: nothing is drawn`)
  }

  const box = {
    x: x - pad - info.trimOffsetLeft / scale,
    y: y - pad - info.trimOffsetTop / scale,
    width: info.width / scale,
    height: info.height / scale,
  }
  return {
    shapes,
    fillRule,
    width: box.width,
    height: box.height,
    viewBox: [box.x, box.y, box.width, box.height].map(round).join(' '),
  }
}

/** One icon as SVG markup, `size` px square. */
function draw(sign: Sign, size: number, shape: ShapeName): string {
  const { radius, sign: fraction, paper } = SHAPES[shape]
  const box = round(size * fraction)
  const at = round((size - box) / 2)
  const r = round(size * radius)
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    paper ? `<rect width="${size}" height="${size}" fill="${PAPER}"/>` : '',
    `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${TILE}"/>`,
    // A nested viewport: the sign keeps its proportions and is centred in the
    // box, whichever of its edges is longer.
    `<svg x="${at}" y="${at}" width="${box}" height="${box}" viewBox="${sign.viewBox}">`,
    `<g fill="${INK}" fill-rule="${sign.fillRule}">${sign.shapes}</g>`,
    `</svg></svg>`,
  ].join('')
}

async function raster(
  sign: Sign,
  size: number,
  shape: ShapeName
): Promise<Uint8Array> {
  let image = sharp(Buffer.from(draw(sign, size, shape)))
  // Flattening drops the alpha channel, so the PNG is opaque by construction, not by luck.
  if (SHAPES[shape].opaque) image = image.flatten({ background: PAPER })
  return new Uint8Array(await image.png({ compressionLevel: 9 }).toBuffer())
}

/** The checks a file has to pass before it is written: what the platforms that read it require. */
function check(target: Target, bytes: Uint8Array, sign: Sign): string {
  const shape = SHAPES[target.shape]
  if (target.ico) {
    const sizes = readIco(bytes).map((entry) => entry.png?.width)
    if (sizes.join() !== target.ico.join()) {
      throw new Error(`${target.path}: ICO sizes ${sizes}`)
    }
    return `${sizes.join('/')} px`
  }
  if (target.svg) return 'SVG'
  const header = readPng(bytes)
  if (header.width !== target.size || header.height !== target.size) {
    throw new Error(
      `${target.path}: ${header.width}×${header.height}, not ${target.size}`
    )
  }
  if (shape.opaque && header.alpha) {
    throw new Error(`${target.path}: has an alpha channel`)
  }
  if (shape.safeZone) {
    // The sign's box, centred: its corners must stay inside a circle of radius 40 % of the side.
    const scale =
      (header.width * shape.sign) / Math.max(sign.width, sign.height)
    const halfDiagonal = Math.hypot(sign.width * scale, sign.height * scale) / 2
    if (halfDiagonal > header.width * 0.4) {
      throw new Error(`${target.path}: the sign leaves the safe zone`)
    }
  }
  return `${header.width}×${header.height}${header.alpha ? '' : ', opaque'}`
}

async function render(target: Target, sign: Sign): Promise<Uint8Array> {
  if (target.ico) {
    const pngs = await Promise.all(
      target.ico.map((size) => raster(sign, size, target.shape))
    )
    return writeIco(pngs)
  }
  if (target.svg) {
    const markup = draw(sign, target.svg, target.shape).replace(
      / width="\d+" height="\d+"/,
      ''
    )
    return new TextEncoder().encode(`${markup}\n`)
  }
  return raster(sign, target.size ?? 0, target.shape)
}

/**
 * The web app manifest. `display: browser`: the site is a page to open, with
 * an address bar, not an application to install. A manifest holds one colour
 * of each kind; the page's own `theme-color`, which follows the reader's theme,
 * takes precedence wherever a browser shows the page.
 */
function manifest(): string {
  const landing = parseYaml(
    readFileSync(join(ROOT, 'content/landing-page.yaml'), 'utf8')
  )
  return `${JSON.stringify(
    {
      name: siteMetadata.title,
      short_name: siteMetadata.title,
      description: landing.page.description,
      start_url: '/',
      display: 'browser',
      background_color: PAPER,
      theme_color: PAPER,
      icons: [
        { src: '/icon.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/icons/maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    null,
    2
  )}\n`
}

function write(path: string, bytes: Uint8Array | string, summary: string) {
  const file = join(PUBLIC, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, bytes)
  const size =
    typeof bytes === 'string' ? Buffer.byteLength(bytes) : bytes.length
  console.log(`  ✓ ${relative(ROOT, file)}  ${summary}, ${size} bytes`)
}

async function main() {
  console.log('🎨 Drawing the icons...\n')
  const sign = await readSign(join(HERE, 'sign.svg'))

  for (const target of TARGETS) {
    const bytes = await render(target, sign)
    write(target.path, bytes, check(target, bytes, sign))
  }
  write('manifest.webmanifest', manifest(), 'web app manifest')

  console.log('\n✨ Icons drawn.')
}

main().catch((error) => {
  console.error('❌ Error drawing the icons:', error)
  process.exit(1)
})
