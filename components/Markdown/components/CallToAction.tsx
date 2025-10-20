import Link from 'next/link'

import { Button, FeatureCard, GradientHeader } from '../../common'

import type { FunctionComponent, PropsWithChildren } from 'react'

interface CallToActionProps extends PropsWithChildren {
  title: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  link: string
  linkContent: string
}

export const CallToAction: FunctionComponent<CallToActionProps> = ({
  title,
  as = 'h2',
  link,
  linkContent,
  children,
}) => {
  const isExternal = link.startsWith('http')

  return (
    <FeatureCard
      className="w-full rounded-[32px] bg-secondary-600"
      useGlow={true}
      useHexagon={true}
    >
      <div className="py-8 px-16 rounded-[32px] flex flex-col gap-2">
        <header className="flex flex-row justify-center">
          <GradientHeader
            as={as}
            className="text-3xl font-bold text-center my-4"
          >
            {title}
          </GradientHeader>
        </header>
        {children ? (
          <div className="text-center lg:px-16 xl:px-32 mt-2 mb-4 text-white">
            {children}
          </div>
        ) : null}
        <div className="mx-auto">
          <Link
            href={link}
            target={isExternal ? '_blank' : undefined}
            className="no-underline"
          >
            <Button variant="action" useArrow={true}>
              {linkContent}
            </Button>
          </Link>
        </div>
      </div>
    </FeatureCard>
  )
}
