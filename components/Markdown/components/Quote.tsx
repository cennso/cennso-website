import Image from 'next/image'

import { FeatureCard } from '../../common'

import type { FunctionComponent, PropsWithChildren } from 'react'

interface QuoteProps extends PropsWithChildren {
  authorName: string
  authorPosition?: string
  authorCompany?: string
  authorSocialLink?: string
  avatar?: string
}

export const Quote: FunctionComponent<QuoteProps> = ({
  authorName,
  authorPosition,
  authorCompany,
  authorSocialLink,
  avatar,
  children,
}) => {
  const authorDescription =
    [authorName, authorPosition].filter(Boolean).join(', ') +
    (authorCompany ? ` at ${authorCompany}` : '')

  return (
    <FeatureCard className='flex flex-row items-center bg-[3rem_1.5rem] bg-no-repeat bg-auto bg-[url("/assets/landing-page/quotes.webp")] bg-secondary-600 rounded-[32px] px-8 py-8 my-8 w-full'>
      <div className="flex flex-col gap-6 w-full">
        <figure className="flex flex-col">
          <blockquote className="text-sm lg:text-base text-white border-none pl-9">
            {children}
          </blockquote>
          <figcaption className="mt-0 ml-9 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {avatar ? (
              <Image
                className="rounded-full flex-none my-0"
                src={avatar}
                title={authorDescription}
                alt={authorDescription}
                width={92}
                height={92}
                sizes="92px"
              />
            ) : null}
            <cite className="font-semibold text-secondary-200 text-base lg:text-[1rem] not-italic">
              {authorSocialLink ? (
                <a
                  title={authorDescription}
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
                  {authorCompany ? (
                    <>
                      <span className="mx-1">at</span>
                      <span>{authorCompany}</span>
                    </>
                  ) : null}
                </>
              ) : null}
            </cite>
          </figcaption>
        </figure>
      </div>
    </FeatureCard>
  )
}
