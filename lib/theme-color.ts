import { themes } from '@cennso/theme'

/** The design system's two themes. */
export type ThemeName = keyof typeof themes

/**
 * The colour a browser paints its own chrome around the page - the address bar
 * on a phone, the title bar of an installed tab: the theme's `--background`, so
 * the bar and the page meet without a seam.
 */
export function themeColor(theme: ThemeName): string {
  return `hsl(${themes[theme].background})`
}

/** The design system's themes, in the order the theme-color tags are written. */
export const THEME_NAMES: readonly ThemeName[] = ['light', 'dark']

/**
 * A design-system colour token as `#rrggbb`. The tokens are the three numbers of
 * `hsl()` (`207.0 72.9% 34.7%`), which is what CSS custom properties want; a
 * web manifest and an image are read by parsers that are not a stylesheet's,
 * and hex is the one notation every one of them reads.
 */
export function hexColor(token: string): string {
  const match = /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(token.trim())
  if (match === null) {
    throw new Error(`Not an "H S% L%" colour token: ${JSON.stringify(token)}`)
  }

  const hue = ((Number(match[1]) % 360) + 360) % 360
  const saturation = Number(match[2]) / 100
  const lightness = Number(match[3]) / 100
  const chroma = saturation * Math.min(lightness, 1 - lightness)
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    const value = lightness - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0')
  }

  return `#${channel(0)}${channel(8)}${channel(4)}`
}
