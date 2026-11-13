import { useTheme } from '@cennso/ui'
import { useEffect } from 'react'

/**
 * Each theme's colour, as `_document.tsx` wrote it into the tag whose media
 * query picks that theme. Read once, before the first write below overwrites
 * those tags, so the colours are defined in one place and this adds nothing to
 * the bundle but the effect.
 */
let colorsAsWritten: Map<string, string> | undefined

function colorFor(
  theme: string,
  tags: NodeListOf<Element>
): string | undefined {
  colorsAsWritten ??= new Map(
    Array.from(tags).flatMap((tag) => {
      const scheme = /prefers-color-scheme:\s*(\w+)/.exec(
        tag.getAttribute('media') ?? ''
      )?.[1]
      const color = tag.getAttribute('content')
      return scheme && color ? [[scheme, color] as const] : []
    })
  )
  return colorsAsWritten.get(theme)
}

/**
 * Keeps the browser's chrome in the theme the page is actually in.
 *
 * `_document.tsx` writes one `theme-color` per theme, each under the system
 * setting that picks it. That is right for a reader who follows the system, and
 * wrong for one who chose the other theme, or switches. This writes the
 * resolved theme's colour into every `theme-color` tag, and the theme into
 * `color-scheme`, whenever the theme changes - as the documentation portal's
 * `ThemeColor` does.
 */
export function ThemeColor() {
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const tags = document.querySelectorAll('meta[name="theme-color"]')
    const color = colorFor(resolvedTheme, tags)
    if (color) {
      tags.forEach((tag) => tag.setAttribute('content', color))
    }
    document
      .querySelector('meta[name="color-scheme"]')
      ?.setAttribute('content', resolvedTheme)
  }, [resolvedTheme])

  return null
}
