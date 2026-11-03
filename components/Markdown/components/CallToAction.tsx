import Link from 'next/link'
import { Button } from '@cennso/ui'

import { ButtonChevron, CTA_ACTION } from '../../common'
import { STORY_CARD } from './storyCard'

import type { FunctionComponent, PropsWithChildren } from 'react'

interface CallToActionProps extends PropsWithChildren {
  title: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  link: string
  linkContent: string
}

/**
 * The closing call to action of a story: the same card as the blocks above it,
 * the title in --primary, and the site's orange CTA pill with the chevron every
 * other "go somewhere" pill carries.
 */
export const CallToAction: FunctionComponent<CallToActionProps> = ({
  title,
  as = 'h2',
  link,
  linkContent,
  children,
}) => {
  const Title = as
  const isExternal = link.startsWith('http')

  return (
    <div
      className={`w-full py-8 px-8 md:px-16 flex flex-col items-center gap-2 not-prose ${STORY_CARD}`}
    >
      <Title className="text-3xl font-bold text-center text-primary my-4">
        {title}
      </Title>
      {children ? (
        <div className="text-center lg:px-16 xl:px-32 mt-2 mb-4 text-foreground">
          {children}
        </div>
      ) : null}
      <Button
        variant="cta"
        className={CTA_ACTION}
        render={(props) => (
          <Link
            {...props}
            href={link}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
          />
        )}
      >
        {linkContent}
        <ButtonChevron />
      </Button>
    </div>
  )
}
