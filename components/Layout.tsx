import dynamic from 'next/dynamic'
import { Footer } from './Footer'
import { CookiesBanner } from './CookiesBanner'
import { Analytics } from '@vercel/analytics/next'

import type { FunctionComponent, PropsWithChildren } from 'react'
import type { NavigationLink } from '../contexts'

/**
 * Navigation is dynamically imported to optimize JavaScript bundle size.
 *
 * Performance optimization: The Navigation component previously used framer-motion for
 * mobile menu animations, which added ~60-100KB to the bundle. We replaced framer-motion
 * with pure CSS transitions, eliminating this JavaScript dependency while maintaining
 * smooth animations for the hamburger menu.
 *
 * Technical details:
 * - ssr: true ensures the Navigation still renders on the server (no layout shift)
 * - Mobile menu animations now use CSS transitions (duration-300, ease-in-out)
 * - Hamburger icon transforms using pure CSS (rotate, translate, opacity)
 * - No visual regressions or UX impact
 *
 * Impact: Removes 60-100KB JavaScript library, addressing mobile Lighthouse warnings
 * about unused JavaScript. Desktop experience unaffected since mobile menu never loads.
 */
const Navigation = dynamic(
  () => import('./Navigation').then((mod) => mod.Navigation),
  {
    ssr: true,
  }
)

interface LayoutProps extends PropsWithChildren {
  navigation: NavigationLink[]
}

export const Layout: FunctionComponent<LayoutProps> = ({
  children,
  navigation,
}) => {
  return (
    <div className="w-screen min-h-screen flex flex-col justify-between overflow-x-clip">
      <div className="top-0 sticky flex-none z-50">
        <Navigation navigation={navigation} />
      </div>

      <main className="flex-1 flex flex-col z-10 bg-secondary-400">
        {children}
        <Analytics />
      </main>

      <div className="flex-none">
        <Footer />
      </div>

      <CookiesBanner />
    </div>
  )
}
