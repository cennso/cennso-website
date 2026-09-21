import Link from 'next/link'
import NextImage from 'next/image'
import { Button, Typography } from '@cennso/ui'

import type { FunctionComponent } from 'react'
import type { SuccessStoryItem as SuccessStoryItemType } from '../../contexts'

interface SuccessStoryItemProps {
  successStory: SuccessStoryItemType
  index: number
  linkText: string
  /** Carries a `{title}` placeholder, replaced with this story's title. */
  linkAccessibleName: string
}

export const SuccessStoryItem: FunctionComponent<SuccessStoryItemProps> = ({
  successStory,
  index,
  linkText,
  linkAccessibleName,
}) => {
  const { link, frontmatter } = successStory
  const { title, cover } = frontmatter

  // Wide alternating row: image on one side, text on the other, sides
  // swapping by index (design frames 1:1062 / 1:585).
  const even = index % 2 === 0

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[32px] border border-border bg-card md:flex-row ${
        even ? '' : 'md:flex-row-reverse'
      }`}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 md:aspect-auto md:w-3/5">
        <NextImage
          src={cover}
          alt={`${title} cover image`}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
        />
      </div>

      <div className="flex w-full flex-col justify-between gap-8 p-8 md:w-2/5 lg:p-12">
        <Typography
          variant="h3"
          className="text-2xl font-bold text-primary lg:text-3xl"
        >
          {title}
        </Typography>

        <div>
          <Button
            variant="cta"
            render={(props) => (
              <Link
                {...props}
                href={link}
                aria-label={linkAccessibleName.replace('{title}', title)}
              />
            )}
          >
            {linkText}
          </Button>
        </div>
      </div>
    </div>
  )
}
