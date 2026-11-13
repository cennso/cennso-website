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
