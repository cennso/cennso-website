import Image from 'next/image'

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
    <div className="flex flex-row items-center w-full">
      <div className="flex flex-col gap-6 w-full">
        {/* mb-0! drops the 40px bottom margin the story's prose styles give
            every <figure>; the card's own padding closes the block. */}
        <figure className="flex flex-col mb-0!">
          <div className="relative z-0">
            <Image
              src="/assets/common/quotes.svg"
              alt=""
              width={150}
              height={118}
              // 115px wide (20% over the former 96px), raised 30% of its own
              // ~91px height above the former -8px offset. `sizes` matches the
              // rendered width rather than the 150px intrinsic one.
              sizes="115px"
              className="absolute top-[-35px] left-0 z-[-1] w-[115px] h-auto"
            />
            <blockquote className="relative z-10 font-sans font-light leading-normal italic text-[28px] text-foreground border-none">
              {children}
            </blockquote>
          </div>
          {/* -mt-[35px]: the author row sits 35px closer to the quote than the
              blockquote's own bottom margin would place it (owner's call). */}
          <figcaption className="-mt-[35px] flex flex-row items-center gap-4">
            {/* rounded-full! - ContentBlock rounds every body image to 14px,
                which would otherwise square off this avatar. */}
            {avatar ? (
              <Image
                className="rounded-full! flex-none my-0"
                src={avatar}
                title={authorDescription}
                alt={authorDescription}
                width={92}
                height={92}
                sizes="92px"
              />
            ) : null}
            <cite className="not-italic text-foreground text-[16px]">
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
    </div>
  )
}
