import Link from 'next/link'
import NextImage from 'next/image'
import { Button, Card, cn, Typography } from '@cennso/ui'

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
    // Card, not a hand-rolled div: bg-card/border-border are Card's own
    // tokens - this row gets that for free. No shadow-none override any
    // more: @cennso/ui 1.0.0 dropped Card's own shadow-sm (design-system
    // #29), so the Design 4.0 frames' shadowless row is what Card already
    // renders. Card's own layout is a vertical stack (flex-col,
    // gap-(--card-spacing), py-(--card-spacing)) sized for
    // Header/Content/Footer children, which this row doesn't use, so gap
    // and py are zeroed here to avoid doubling up with the text panel's own
    // padding below. The 32px radius has no match in the theme's scale
    // (tops out at --radius-xl: 16px), so it's overridden the same way the
    // pre-4.0 SuccessStoryItem already overrode it on Card.
    <Card
      className={cn(
        'gap-0 overflow-hidden rounded-[32px] py-0 md:flex-row',
        !even && 'md:flex-row-reverse'
      )}
    >
      <div className="relative aspect-16/10 w-full shrink-0 md:aspect-auto md:w-3/5">
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
    </Card>
  )
}
