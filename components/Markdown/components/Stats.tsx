import { STORY_CARD } from './storyCard'

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
      <div
        className={`flex flex-col items-center justify-center gap-2 h-full px-6 py-8 text-center ${STORY_CARD}`}
      >
        <span className="text-primary text-[72px] font-bold leading-tight">
          {value}
        </span>
        <span className="text-foreground font-bold text-base">{label}</span>
      </div>
    </li>
  )
}

export const Stats: FunctionComponent<PropsWithChildren> = ({ children }) => {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full list-none m-0 pl-0">
      {children}
    </ul>
  )
}
