import { FeatureCard } from '../../common'

import type { FunctionComponent, PropsWithChildren } from 'react'

interface StatProps {
  value: string
  label: string
}

/**
 * A single highlighted figure. Only string props are used because the MDX
 * pipeline (`parseMDX`) drops JSX expression attributes.
 */
export const Stat: FunctionComponent<StatProps> = ({ value, label }) => {
  return (
    <li className="m-0">
      <FeatureCard
        className="flex flex-col items-center justify-center gap-2 h-full rounded-[32px] bg-secondary-600 px-6 py-8 text-center"
        useGlow={true}
      >
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary-200 to-[#A855F7] text-4xl lg:text-5xl font-bold leading-tight">
          {value}
        </span>
        <span className="text-white font-bold text-base">{label}</span>
      </FeatureCard>
    </li>
  )
}

export const Stats: FunctionComponent<PropsWithChildren> = ({ children }) => {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full list-none my-8 pl-0">
      {children}
    </ul>
  )
}
