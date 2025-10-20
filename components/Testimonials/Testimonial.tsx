import Link from 'next/link'

import { Button, HexagonAvatar } from '../common'

import type { FunctionComponent } from 'react'
import type { Testimonial as TestimonialType } from '../../contexts'

interface TestimonialProps {
  testimonial: TestimonialType
}

export const Testimonial: FunctionComponent<TestimonialProps> = ({
  testimonial,
}) => {
  const { author, content, link } = testimonial

  return (
    <div className="flex flex-col lg:flex-row gap-2 lg:gap-6 px-8 md:px-20 lg:px-32 py-4 items-stretch">
      <div className="bg-transparent flex flex-row items-center justify-center p-2">
        <div className="p-2 filter drop-shadow-[0px_5px_10px_rgba(68,141,200,0.35)]">
          <HexagonAvatar
            src={author.avatar}
            className="overflow-hidden w-64 h-64"
            author={author}
          />
        </div>
      </div>

      <div className="flex flex-row items-center">
        <div className="flex flex-col gap-6 px-8 py-4">
          <figure className="flex flex-col gap-3">
            <blockquote className="lg:text-lg text-white">
              <p className="text-sm">{content}</p>
            </blockquote>
            <figcaption>
              <cite className="font-semibold text-secondary-200 text-base lg:text-[1rem] not-italic">
                {author.socialLink ? (
                  <a
                    title={`${author.name}, ${author.position}`}
                    href={author.socialLink}
                    target="_blank"
                    rel="noopener"
                    className="underline hover:decoration-2 text-lg font-bold"
                  >
                    <span>{author.name}</span>
                  </a>
                ) : (
                  <span className="text-lg font-bold">{author.name}</span>
                )}
                <div className="font-normal">
                  <span>{author.position}</span>
                  <span className="mx-1">at</span>
                  <span>{author.company}</span>
                </div>
              </cite>
            </figcaption>
          </figure>

          {link ? (
            <div>
              <Link href={link}>
                <Button variant="tertiary" useArrow={true}>
                  {testimonial.linkContent}
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
