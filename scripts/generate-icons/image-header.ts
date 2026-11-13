/**
 * What a PNG or an ICO says about itself: its size, whether it can be transparent, which images an
 * ICO carries; and an ICO put together from PNGs. Headers only, nothing decoded, no dependency.
 *
 * For checking icons, where those three facts are the whole contract: Google wants a square, iOS
 * paints whatever is transparent in a home-screen icon black, and a favicon carries a size per
 * place it is shown. `index.ts` checks every file it writes with this.
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

export interface PngHeader {
  width: number
  height: number
  /**
   * Whether any pixel can be less than opaque: a colour type with an alpha channel, or a `tRNS`
   * chunk, which gives a palette or a single colour transparency. `false` means opaque by
   * construction, whatever the pixels are.
   */
  alpha: boolean
}

export function isPng(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 8 &&
    PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)
  )
}

export function readPng(bytes: Uint8Array): PngHeader {
  if (!isPng(bytes)) throw new Error('Not a PNG: the signature is missing')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  let width = 0
  let height = 0
  let colourType = -1
  let transparency = false
  // Chunks: length, four-letter type, data, CRC. Everything that bears on transparency comes
  // before the first IDAT.
  for (let offset = 8; offset + 8 <= bytes.length; ) {
    const length = view.getUint32(offset)
    const type = Array.from(bytes.subarray(offset + 4, offset + 8), (byte) =>
      String.fromCharCode(byte)
    ).join('')
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8)
      height = view.getUint32(offset + 12)
      colourType = bytes[offset + 17] ?? -1
    }
    if (type === 'tRNS') transparency = true
    if (type === 'IDAT' || type === 'IEND') break
    offset += 12 + length
  }
  if (colourType === -1) throw new Error('Not a PNG: no IHDR chunk')

  // 4 is grey with alpha, 6 is RGBA.
  return {
    width,
    height,
    alpha: colourType === 4 || colourType === 6 || transparency,
  }
}

export interface IcoEntry {
  width: number
  height: number
  /** The image's own header when it is stored as a PNG, which every browser reads; absent for BMP. */
  png?: PngHeader
}

export function readIco(bytes: Uint8Array): IcoEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (
    bytes.length < 6 ||
    view.getUint16(0, true) !== 0 ||
    view.getUint16(2, true) !== 1
  ) {
    throw new Error('Not an ICO: the header is missing')
  }

  const count = view.getUint16(4, true)
  const entries: IcoEntry[] = []
  for (let index = 0; index < count; index++) {
    const at = 6 + index * 16
    // A width or height of 0 is how the format writes 256.
    const width = bytes[at] || 256
    const height = bytes[at + 1] || 256
    const size = view.getUint32(at + 8, true)
    const offset = view.getUint32(at + 12, true)
    const image = bytes.subarray(offset, offset + size)
    entries.push(
      isPng(image) ? { width, height, png: readPng(image) } : { width, height }
    )
  }
  return entries
}

/**
 * An ICO whose images are the given PNGs, stored as they are. Every browser since Internet
 * Explorer 9 reads PNG entries, and they keep each size exactly as it was drawn.
 */
export function writeIco(pngs: Uint8Array[]): Uint8Array {
  const header = new Uint8Array(6 + 16 * pngs.length)
  const view = new DataView(header.buffer)
  view.setUint16(2, 1, true)
  view.setUint16(4, pngs.length, true)

  let offset = header.length
  pngs.forEach((png, index) => {
    const { width, height } = readPng(png)
    if (width > 256 || height > 256)
      throw new Error(`An ICO image is at most 256 px: ${width}×${height}`)
    const at = 6 + index * 16
    header[at] = width % 256
    header[at + 1] = height % 256
    view.setUint16(at + 4, 1, true)
    view.setUint16(at + 6, 32, true)
    view.setUint32(at + 8, png.length, true)
    view.setUint32(at + 12, offset, true)
    offset += png.length
  })

  const ico = new Uint8Array(offset)
  ico.set(header)
  let at = header.length
  for (const png of pngs) {
    ico.set(png, at)
    at += png.length
  }
  return ico
}
