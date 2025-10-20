import { Navigation } from './Navigation'
import { Footer } from './Footer'
import { CookiesBanner } from './CookiesBanner'

import type { FunctionComponent, PropsWithChildren } from 'react'
import type { NavigationLink } from '../contexts'

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
      </main>

      <div className="flex-none">
        <Footer />
      </div>

      <CookiesBanner />
    </div>
  )
}
