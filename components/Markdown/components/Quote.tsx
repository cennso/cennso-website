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
    <FeatureCard
      className="flex flex-row items-center rounded-[32px] w-full"
      dropShadow={false}
    >
      <div className="flex flex-col gap-6 w-full">
        <figure className="flex flex-col">
          <div className="relative z-0">
            <Image
              src="/assets/common/quotes.svg"
              alt=""
              width={150}
              height={118}
              className="absolute -top-[8px] left-0 z-[-1] w-24 h-auto"
            />
            <blockquote className="relative z-10 font-sans font-[300] leading-[1.5] italic text-[28px] text-white border-none">
              {children}
            </blockquote>
          </div>
          <figcaption className="mt-0 flex flex-row items-center gap-4">
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
            <cite className="not-italic text-white text-[16px]">
              <span className="block font-bold">
                {authorSocialLink ? (
                  <a
                    href={authorSocialLink}
                    target="_blank"
                    rel="noopener"
                    className="underline hover:decoration-2"
                  >
                    {authorName}
                  </a>
                ) : (
                  authorName
                )}
              </span>
              {authorPosition ? (
                <span className="block font-normal">{authorPosition}</span>
              ) : null}
              {authorCompany ? (
                <span className="block font-normal">{authorCompany}</span>
              ) : null}
            </cite>
          </figcaption>
        </figure>
      </div>
    </FeatureCard>
  )
}
