import { GradientHeader } from '../../common'

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
  return (
    <section className="flex flex-col md:flex-row gap-8 bg-gradient-to-r from-secondary-600 to-secondary-400 p-8 rounded-[32px] w-full mb-6">
      <header className="flex flex-row w-full md:w-1/4">
        <GradientHeader as={as} className="my-0 md:my-6 text-3xl">
          {title}
        </GradientHeader>
      </header>

      <div className="w-full md:w-3/4">{children}</div>
    </section>
  )
}
