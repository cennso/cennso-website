import { Html, Head, Main, NextScript } from 'next/document'
import { themeScript } from '@cennso/ui/theme-script'

import { THEME_NAMES, themeColor } from '../lib/theme-color'

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.png" />
        {/* The browser's own chrome in the page's theme, before any script
            runs: one colour per theme, each under the system setting that
            picks it, since a first visit follows the system. A reader who
            chose a theme gets that one colour from <ThemeColor> once the page
            is interactive. Here rather than in next/head, which would manage
            these tags and undo what <ThemeColor> writes. */}
        {THEME_NAMES.map((theme) => (
          <meta
            key={theme}
            name="theme-color"
            media={`(prefers-color-scheme: ${theme})`}
            content={themeColor(theme)}
          />
        ))}
        <meta name="color-scheme" content="light dark" />
        {/* No default setting: the design system's default is the system's
            theme. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
