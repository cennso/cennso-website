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
// The shared story surface, but outlined in light too: 1px #185F99 (owner's
// call) - STORY_CARD leaves light borderless. Dark keeps the theme's border.
const STAT_CARD = STORY_CARD.replace('border-transparent', 'border-[#185f99]')

export const Stat: FunctionComponent<StatProps> = ({ value, label }) => {
  return (
    <li className="m-0">
      <div
        className={`flex flex-col items-center justify-center gap-2 h-full px-6 py-8 text-center ${STAT_CARD}`}
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
    // mb-0!: the story's prose styles give every <ul> a 25px bottom margin that
    // outranks the plain m-0 here.
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full list-none m-0 mb-0! pl-0">
      {children}
    </ul>
  )
}
