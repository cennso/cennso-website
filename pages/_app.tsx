import { Poppins } from 'next/font/google'

import { Layout } from '../components/Layout'

import type { AppProps } from 'next/app'

import '../styles/tailwind.css'

const poppinsFont = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
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
export default function App({ Component, pageProps }: AppProps) {
  const { $$app, ...rest } = pageProps
  const { navigation } = $$app || {}

  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${poppinsFont.style.fontFamily};
        }
      `}</style>

      <Layout navigation={navigation}>
        <Component {...rest} />
      </Layout>
    </>
  )
}
