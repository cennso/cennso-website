import React from 'react'

import fs from 'fs'
import path from 'path'

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

import { background } from './background'
import { __dirname } from './common'

import type { FunctionComponent } from 'react'
import type { Font } from 'satori'

const size = {
  width: 1200,
  height: 630,
}

export interface ImageProps {
  title: string
  subTitle?: string
  description: string
}

export const Image: FunctionComponent<ImageProps> = ({
  title,
  subTitle,
  description,
}) => {
  // Adaptive title font size based on length
  let titleFontSize = '68px' // Reduced from 80px
  if (title.length > 60) {
    titleFontSize = '48px'
  } else if (title.length > 40) {
    titleFontSize = '56px'
  }

  // Adaptive subtitle font size
  let subTitleFontSize = '44px' // Reduced from 52px
  if (subTitle && subTitle.length > 60) {
    subTitleFontSize = '32px'
  } else if (subTitle && subTitle.length > 40) {
    subTitleFontSize = '36px'
  }

  // Adaptive description font size
  let descriptionFontSize = '32px' // Reduced from 36px
  if (description.length > 128) {
    descriptionFontSize = '20px'
  } else if (description.length > 64) {
    descriptionFontSize = '24px'
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        background: `url("${background}")`,
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 450px 0 90px',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              color: subTitle ? 'white' : 'transparent',
              fontSize: titleFontSize,
              backgroundClip: 'text',
              background:
                'linear-gradient(90deg, rgba(46,129,212,1) 0%, rgba(4,211,214,1) 100%)',
              fontWeight: 'bold',
              fontFamily: 'Poppins',
            }}
          >
            {title}
          </div>
        </div>
        {subTitle ? (
          <div style={{ display: 'flex' }}>
            <div
              style={{
                display: 'flex',
                color: 'transparent',
                fontSize: subTitleFontSize,
                backgroundClip: 'text',
                background:
                  'linear-gradient(90deg, rgba(46,129,212,1) 0%, rgba(4,211,214,1) 100%)',
                fontWeight: 'bold',
                fontFamily: 'Poppins',
              }}
            >
              {subTitle}
            </div>
          </div>
        ) : null}
        <div
          style={{
            color: 'white',
            fontSize: descriptionFontSize,
            fontWeight: 'normal',
            fontFamily: 'Poppins',
            marginTop: '12px',
          }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

export async function prepareImage(ctx: {
  title: string
  subTitle?: string
  description: string
  fonts: Font[]
}): Promise<Buffer> {
  const { title, subTitle, description, fonts } = ctx

  // Log font loading status for debugging
  console.log(`Generating OG image: ${title}`)
  console.log(
    `Fonts loaded: ${fonts.length} (${fonts.map((f) => `${f.name} ${f.weight}`).join(', ')})`
  )

  const svg = await satori(
    <Image title={title} subTitle={subTitle} description={description} />,
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
