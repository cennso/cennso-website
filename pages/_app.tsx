import { Poppins } from 'next/font/google'
import { ThemeProvider } from '@cennso/ui'

import { Layout } from '../components/Layout'

import type { AppProps } from 'next/app'

import '@cennso/theme/theme.css'
import '../styles/tailwind.css'

// Only the weights the site actually renders. next/font emits a `<link
// rel="preload">` for every declared weight x style, so the previous
// 9 weights x 2 styles meant 18 high-priority font preloads (~157KB) on every
// page, competing with the LCP element for bandwidth. 100/200/800/900 are
// rendered nowhere: no `font-thin`/`font-extralight`/`font-extrabold`/
// `font-black` in this repo, in `@cennso/ui`'s dist or in `@cennso/theme`, and
// none appear in the rendered HTML of any route. Probing `document.fonts` with
// headless Chrome across every route confirms the faces the browser actually
// loads are 300/400/500/600/700 normal plus 300 italic (`Quote.tsx`'s
// `font-light italic`), so this drops 8 preloads without changing a single
// rendered glyph.
const poppinsFont = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
})

/**
 * App component - Global application wrapper for Next.js
 *
 * Performance optimization: This component previously included page transition animations
 * using framer-motion (AnimatePresence + motion.main with spring physics). These animations
 * were removed to optimize JavaScript bundle size.
 *
 * Why page transitions were removed:
 * 1. Bundle size impact: framer-motion added 60KB to the _app chunk (226KB → 166KB after removal)
 * 2. Minimal UX value: Page transitions provided subtle fade-in/out effects, but didn't
 *    significantly improve user experience compared to the performance cost
 * 3. Global cost: Since _app.tsx wraps all pages, the animation library was loaded on every
 *    route, impacting initial page load for all users
 *
 * Additional mobile optimization (November 2024):
 * - Removed framer-motion entirely from the codebase (previously code-split in Navigation)
 * - Replaced mobile menu animations with pure CSS transitions in Navigation and MenuToggle
 * - Eliminates ~60-100KB JavaScript library that was loading only on mobile devices
 * - Addresses mobile-only Lighthouse warnings about unused JavaScript
 * - Desktop experience unchanged (mobile menu never loads on desktop breakpoints)
 *
 * Current implementation:
 * - Simple, direct rendering without animation wrappers
 * - Layout component handles navigation, footer, and cookies banner
 * - Component receives the current page component and renders it directly
 * - Navigation component uses CSS transitions (transition-all, transform) for mobile menu
 * - MenuToggle component uses CSS-animated spans instead of SVG motion paths
 *
 * Result: 58KB reduction in First Load JS (339KB → 281KB initially), plus elimination of
 * mobile-only JavaScript bundle, improving Lighthouse performance scores (≥95% target) and
 * page load times across all routes and devices.
 */
/**
 * The parent domain the theme choice is written for, so the site, the cloud
 * portal and the documentation portal share one choice - the same cookie on
 * the same domain as cennso/cloud's THEME_COOKIE_DOMAIN.
 *
 * Applied only when the page is actually served under cennso.com: a browser
 * drops a cookie whose domain the page is not under, so on localhost or a
 * *.vercel.app preview it would silently lose every choice. There the cookie
 * stays host-only and still works. Undefined on the server, where nothing is
 * written.
 */
const THEME_COOKIE_DOMAIN = '.cennso.com'

function themeCookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined
  const host = window.location.hostname
  return host === 'cennso.com' || host.endsWith('.cennso.com')
    ? THEME_COOKIE_DOMAIN
    : undefined
}

export default function App({ Component, pageProps }: AppProps) {
  const { $$app, ...rest } = pageProps
  const { navigation, footerData } = $$app || {}

  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${poppinsFont.style.fontFamily};
        }
      `}</style>

      {/* Only the provider takes the cookie's domain: the inline themeScript in
          _document.tsx reads the cookie by name, and a browser sends a
          parent-domain cookie to every host under it. */}
      <ThemeProvider
        defaultSetting="dark"
        cookie={{ domain: themeCookieDomain() }}
      >
        <Layout navigation={navigation} footerData={footerData}>
          <Component {...rest} />
        </Layout>
      </ThemeProvider>
    </>
  )
}
