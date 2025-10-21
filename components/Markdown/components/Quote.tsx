import { FeatureCard } from '../../common'

import type { FunctionComponent, PropsWithChildren } from 'react'

interface QuoteProps extends PropsWithChildren {
  authorName: string
  authorPosition?: string
  authorCompany?: string
  authorSocialLink?: string
}

export const Quote: FunctionComponent<QuoteProps> = ({
  authorName,
  authorPosition,
  authorCompany,
  authorSocialLink,
  children,
}) => {
  return (
    <FeatureCard className='flex flex-row items-center bg-[3rem_1.5rem] bg-no-repeat bg-auto bg-[url("/assets/landing-page/quotes.webp")] bg-secondary-600 rounded-[32px] px-8'>
      <div className="flex flex-col gap-6 px-8">
        <figure className="flex flex-col">
          <blockquote className="text-sm lg:text-base text-secondary-600 border-none pl-9">
            {children}
          </blockquote>
          <figcaption className="mt-0 ml-9">
            <cite className="font-semibold text-secondary-200 text-base lg:text-[1rem] not-italic">
              {authorSocialLink ? (
                <a
                  title={
                    authorPosition
                      ? `${authorName}, ${authorPosition}`
                      : authorName
                  }
                  href={authorSocialLink}
                  target="_blank"
                  rel="noopener"
                  className="underline hover:decoration-2"
                >
                  <span>{authorName}</span>
                </a>
              ) : (
                <span>{authorName}</span>
              )}
              {authorPosition ? (
                <>
                  {', '}
                  <span>{authorPosition}</span>
                  <span className="mx-1">at</span>
                  <span>{authorCompany}</span>
                </>
              ) : null}
            </cite>
          </figcaption>
        </figure>
      </div>
    </FeatureCard>
  )
}
