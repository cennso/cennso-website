import React from 'react'

import fs from 'fs'
import path from 'path'

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

import { __dirname } from './common'

import type { FunctionComponent } from 'react'
import type { Font } from 'satori'

const size = {
  width: 1200,
  height: 630,
}

/**
 * The card mirrors the docs portal's (`cloud/apps/docs-portal/src/lib/og-card.tsx`): the same
 * colours, type and positions, on the website's own background, which leaves the right side
 * free for text.
 */

/** Where everything on the card starts. */
const INSET = 84

/** The band at the bottom that holds the logo, and the logo's lift off the amber bar. */
const BOTTOM_BAND = 90
const LOGO_BOTTOM = 62

/**
 * The badge's outline, 141×60, as designed: a rounded rectangle whose right edge leans back. Only
 * its right end is drawn from this, through a `viewBox` that shows the last 25 units — the rest
 * of the badge is a box that grows with the label.
 */
const BADGE_PATH =
  'M0 10C0 4.47715 4.47715 0 10 0H130.507C136.579 0 141.25 5.36845 140.411 11.3828L134.826 51.3828C134.136 56.3235 129.91 60 124.922 60H10C4.47715 60 0 55.5228 0 50V10Z'
const BADGE_HEIGHT = 60
const BADGE_END = 25

/** The background's navy and amber, as hex because satori resolves no CSS variables. */
const COLOURS = {
  navy: '#122841',
  accent: '#ffb31b',
  foreground: '#ffffff',
} as const

/** The background, a 1200×630 PNG drawn for exactly this size, as the data URI satori takes. */
const background = `data:image/png;base64,${fs
  .readFileSync(path.join(__dirname, 'background.png'))
  .toString('base64')}`

/** The title's and description's width: they end before the hexagons in the top-right corner. */
const TEXT_WIDTH = 840

/**
 * The title is never cut. 56px as designed; one that would take more than two lines steps down,
 * and at the smallest size may take a third.
 */
const TITLE_SIZES = [56, 48, 44]
const TITLE_MAX_LINES = 2

/** Line heights, shared by the card and the measuring that sizes it. */
const TITLE_LINE_HEIGHT = 1.15
const DESCRIPTION_SIZE = 28
const DESCRIPTION_LINE_HEIGHT = 1.4
const GAP = 24

/**
 * The tallest the badge, title and description may stand together. Centred above the bottom
 * band, a block this tall ends just above the hexagons in the bottom-left corner.
 */
const TEXT_HEIGHT = 400

/** The description gets every line the title leaves free, between these two. */
const DESCRIPTION_MIN_LINES = 2
const DESCRIPTION_MAX_LINES = 5

/**
 * The wordmark from `public/logo.svg`, white. Along the bottom of every card it is 222px wide,
 * the size of the `CENNSO` in the docs portal's logo.
 */
const LOGO_ASPECT = 371.61 / 72.62
const FOOTER_LOGO_WIDTH = 222
const logo = `data:image/svg+xml;base64,${Buffer.from(
  fs
    .readFileSync(path.join(__dirname, '../../public/logo.svg'), 'utf8')
    .replace(/fill:\s*#[0-9a-f]+/gi, `fill: ${COLOURS.foreground}`)
).toString('base64')}`

/**
 * The title's height at a size, laid out by satori on its own: its line count depends on where
 * Poppins breaks the words.
 */
async function titleHeight(
  title: string,
  fontSize: number,
  fonts: Font[]
): Promise<number> {
  const svg = await satori(<Title title={title} fontSize={fontSize} />, {
    width: TEXT_WIDTH,
    fonts,
  })
  return Number(svg.match(/height="([\d.]+)"/)?.[1])
}

/**
 * The title's size, the largest that keeps it to `TITLE_MAX_LINES`, and how many lines the
 * description may take: what the badge and the title leave of `TEXT_HEIGHT`.
 */
async function layout(ctx: {
  badge?: string
  title: string
  fonts: Font[]
}): Promise<{ titleSize: number; descriptionLines: number }> {
  const { badge, title, fonts } = ctx

  let titleSize = TITLE_SIZES[0]
  let height = 0
  for (titleSize of TITLE_SIZES) {
    height = await titleHeight(title, titleSize, fonts)
    if (height <= titleSize * TITLE_LINE_HEIGHT * TITLE_MAX_LINES + 1) {
      break
    }
  }

  const free =
    TEXT_HEIGHT - (badge === undefined ? 0 : BADGE_HEIGHT + GAP) - height - GAP
  const lines = Math.floor(free / (DESCRIPTION_SIZE * DESCRIPTION_LINE_HEIGHT))

  return {
    titleSize,
    descriptionLines: Math.min(
      DESCRIPTION_MAX_LINES,
      Math.max(DESCRIPTION_MIN_LINES, lines)
    ),
  }
}

const Title: FunctionComponent<{ title: string; fontSize: number }> = ({
  title,
  fontSize,
}) => (
  <div
    style={{
      display: 'block',
      maxWidth: TEXT_WIDTH,
      fontFamily: 'Poppins',
      fontSize,
      fontWeight: 700,
      lineHeight: TITLE_LINE_HEIGHT,
    }}
  >
    {title}
  </div>
)

export interface CardProps {
  badge?: string
  title: string
  description: string
  titleSize: number
  descriptionLines: number
}

export const Card: FunctionComponent<CardProps> = ({
  badge,
  title,
  description,
  titleSize,
  descriptionLines,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        fontFamily: 'Poppins',
        color: COLOURS.foreground,
      }}
    >
      {/* satori renders a plain `<img>`; `next/image` has no meaning here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={background}
        width={size.width}
        height={size.height}
        alt=""
        style={{ position: 'absolute' }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: GAP,
          width: '100%',
          padding: `0 80px ${BOTTOM_BAND}px ${INSET}px`,
        }}
      >
        {badge === undefined ? null : (
          <div style={{ display: 'flex', height: BADGE_HEIGHT }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px 0 22px',
                borderRadius: '10px 0 0 10px',
                backgroundColor: COLOURS.accent,
                fontSize: 30,
                color: COLOURS.navy,
              }}
            >
              {badge}
            </div>
            {/* One unit over the box, so no seam shows where the two meet. */}
            <svg
              width={BADGE_END}
              height={BADGE_HEIGHT}
              viewBox={`${141 - BADGE_END} 0 ${BADGE_END} ${BADGE_HEIGHT}`}
              style={{ marginLeft: -1 }}
            >
              <path d={BADGE_PATH} fill={COLOURS.accent} />
            </svg>
          </div>
        )}
        <Title title={title} fontSize={titleSize} />
        {/* `display: block` because satori clamps only a block, and the clamp is what ends a
            long text with an ellipsis instead of cutting it mid-word, should a description
            outgrow the lines it is given. */}
        <div
          style={{
            display: 'block',
            lineClamp: descriptionLines,
            maxWidth: TEXT_WIDTH,
            fontSize: DESCRIPTION_SIZE,
            lineHeight: DESCRIPTION_LINE_HEIGHT,
          }}
        >
          {description}
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        width={FOOTER_LOGO_WIDTH}
        height={FOOTER_LOGO_WIDTH / LOGO_ASPECT}
        alt=""
        style={{ position: 'absolute', left: INSET, bottom: LOGO_BOTTOM }}
      />
    </div>
  )
}

export async function prepareImage(ctx: {
  badge?: string
  title: string
  description: string
  fonts: Font[]
}): Promise<Buffer> {
  const { badge, title, description, fonts } = ctx

  // Log font loading status for debugging
  console.log(`Generating OG image: ${title}`)
  console.log(
    `Fonts loaded: ${fonts.length} (${fonts.map((f) => `${f.name} ${f.weight}`).join(', ')})`
  )

  const svg = await satori(
    <Card
      badge={badge}
      title={title}
      description={description}
      {...await layout({ badge, title, fonts })}
    />,
    {
      ...size,
      fonts,
    }
  )

  const resvg = new Resvg(svg, {
    background: 'black',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
    font: {
      defaultFontFamily: 'Poppins',
      loadSystemFonts: false,
    },
    imageRendering: 1,
    shapeRendering: 2,
    logLevel: 'error', // Changed from 'debug' to reduce noise
  })

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  // Optimize PNG with sharp to reduce file size
  const optimizedBuffer = await sharp(pngBuffer)
    .png({
      quality: 90,
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toBuffer()

  const originalSize = (pngBuffer.length / 1024).toFixed(1)
  const optimizedSize = (optimizedBuffer.length / 1024).toFixed(1)
  const savings = (
    ((pngBuffer.length - optimizedBuffer.length) / pngBuffer.length) *
    100
  ).toFixed(1)

  console.log(
    `  Size: ${originalSize}KB → ${optimizedSize}KB (${savings}% reduction)`
  )

  return optimizedBuffer
}

export async function saveImage(ctx: { image: Buffer; destination: string[] }) {
  const { image, destination } = ctx

  const directoryPath = path.join(
    __dirname,
    '../../',
    'public',
    'assets',
    'og-images',
    ...destination
  )

  await fs.promises.mkdir(directoryPath, { recursive: true })

  const imagePath = path.join(directoryPath, 'image.png')
  await fs.promises.writeFile(imagePath, Uint8Array.from(image))

  console.log(`  ✓ Saved: ${destination.join('/')}/image.png`)
}
