import React from 'react'

import fs from 'fs'
import path from 'path'

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'

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
  let descriptionFontSize = '36px'
  if (description.length > 128) {
    descriptionFontSize = '22px'
  } else if (description.length > 64) {
    descriptionFontSize = '26px'
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
              fontSize: '80px',
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
                fontSize: '52px',
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
    logLevel: 'debug', // Default Value: error
  })

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  return pngBuffer
}

export async function saveImage(ctx: { image: Buffer; destination: string[] }) {
  const { image, destination } = ctx

  const directoryPath = path.join(
    __dirname,
    '../../../',
    'public',
    'assets',
    'og-images',
    ...destination
  )
  await fs.promises.mkdir(directoryPath, { recursive: true })

  const imagePath = path.join(directoryPath, 'image.png')
  await fs.promises.writeFile(imagePath, image)
}
