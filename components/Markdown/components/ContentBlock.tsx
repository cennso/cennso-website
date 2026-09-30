import { STORY_CARD } from './storyCard'

import type { FunctionComponent, PropsWithChildren } from 'react'

interface ContentBlockProps extends PropsWithChildren {
  title: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const ContentBlock: FunctionComponent<ContentBlockProps> = ({
  title,
  as = 'h2',
  children,
}) => {
  const Title = as

  return (
    <section
      className={`flex flex-col md:flex-row gap-8 px-8 py-10 w-full mb-6 ${STORY_CARD}`}
    >
      {/* The title reads into the body beside it: right-aligned from md up,
          where the two sit side by side; stacked on mobile it stays left. */}
      <header className="flex flex-row w-full md:w-1/4">
        <Title className="w-full text-primary text-2xl font-bold mt-0! mb-0! md:text-right">
          {title}
        </Title>
      </header>

      {/* The body's first block drops its prose top margin, so the card's own
          padding is the only space above it and the title lines up with it. */}
      <div className="w-full md:w-3/4 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </section>
  )
}
