import fs from 'fs'
import path from 'path'
import url from 'url'

import type { Font, FontWeight } from 'satori'

export const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export async function loadFonts(): Promise<Font[]> {
  return [
    await loadFont({
      name: 'Poppins',
      fileName: 'Poppins-Regular.ttf',
      weight: 400,
    }),
    await loadFont({
      name: 'Poppins',
      fileName: 'Poppins-Bold.ttf',
      weight: 700,
    }),
  ]
}

async function loadFont(ctx: {
  name: string
  fileName: string
  weight: FontWeight
}): Promise<Font> {
  const { name, fileName, weight } = ctx
  const fontPath = path.join(__dirname, 'fonts', 'Poppins', fileName)
  const font = (await fs.promises.readFile(fontPath)).buffer as ArrayBuffer

  return {
    name,
    weight,
    data: font,
    style: 'normal',
  }
}

export async function removeDirectory() {
  const directoryPath = path.join(
    __dirname,
    '../../',
    'public',
    'assets',
    'og-images'
  )

  if (fs.existsSync(directoryPath)) {
    await fs.promises.rm(directoryPath, { recursive: true })
  }
}
