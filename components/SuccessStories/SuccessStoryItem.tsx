import Link from 'next/link'
import NextImage from 'next/image'
import { Button, Card, cn, Typography } from '@cennso/ui'

import { ButtonChevron, CTA_ACTION, GLOW_OUTLINES, GLOW_TINTS } from '../common'

import type { FunctionComponent } from 'react'
import type { SuccessStoryItem as SuccessStoryItemType } from '../../contexts'

// Dark rows cycle the landing page's three "Why Cennso?" cards in this
// order: 5G Anywhere (blue), Private 5G (teal), blue again, then Agile MVNO
// (cyan). Each row takes that card's fill AND its outline, so the pair stays
// matched the way it is on the landing page.
const ROW_SURFACES = [0, 2, 0, 1] as const

interface SuccessStoryItemProps {
  successStory: SuccessStoryItemType
  index: number
  linkText: string
  /**
   * Rendered visually hidden after `linkText`, so the anchor's own text names
   * the story. Carries a `{title}` placeholder, replaced with this story's
   * title.
   */
  linkContext: string
}

export const SuccessStoryItem: FunctionComponent<SuccessStoryItemProps> = ({
  successStory,
  index,
  linkText,
  linkContext,
}) => {
  const { link, frontmatter } = successStory
  const { title, cover } = frontmatter

  // Wide alternating row: image on one side, text on the other, sides
  // swapping by index (design frames 1:1062 / 1:585).
  const even = index % 2 === 0
  const surface = ROW_SURFACES[index % ROW_SURFACES.length]

  return (
    // Card, not a hand-rolled div: bg-card and the border box come from it.
    // Its vertical-stack layout (gap/py from --card-spacing) is zeroed because
    // this row is image + text side by side. `w-full` because the list is the
    // section's full width. r24 is the theme's --radius-3xl step.
    //
    // Light: no visible edge, the card sits on the page plate by its own fill.
    // Dark: fill and outline from ROW_SURFACES, with the fill clipped to the
    // padding box exactly as the landing page's cards do (see GLOW_OUTLINES).
    <Card
      className={cn(
        'w-full gap-0 overflow-hidden rounded-3xl py-0 border-transparent shadow-none dark:bg-clip-padding md:h-[422px] md:flex-row',
        GLOW_TINTS[surface],
        GLOW_OUTLINES[surface],
        !even && 'md:flex-row-reverse'
      )}
    >
      <div className="relative aspect-16/10 w-full shrink-0 md:aspect-auto md:h-full md:w-3/5">
        <NextImage
          src={cover}
          alt={`${title} cover image`}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover"
          // The first row sits above the fold and is the Largest Contentful
          // Paint element on mobile (360px viewport: the cover fills the full
          // width at 16:10 while every other candidate is below the fold).
          // next/image lazy-loads by default, so Lighthouse's
          // `lcp-lazy-loaded` audit scored 0 and Lantern could not start the
          // fetch until the main thread went idle - simulated LCP 8.1s. Only
          // the first row gets `priority`; the rest stay lazy so this does not
          // turn into four eager full-width fetches.
          priority={index === 0}
        />
      </div>

      {/* From md up the title is centred on the row's FULL height, and the
          button is taken out of flow and pinned to the panel's bottom corner
          on its outer side (right when the image is on the left, left when it
          is on the right) - in flow it would push the title's centre up by
          half its own height. Stacked on mobile, both stay in flow. */}
      <div className="relative flex w-full flex-col gap-8 p-8 md:w-2/5 md:justify-center lg:p-12">
        <div>
          <Typography
            variant="h3"
            className="text-2xl font-bold text-foreground lg:text-[32px] lg:leading-[1.3]"
          >
            {title}
          </Typography>
        </div>

        <div
          className={cn(
            'flex md:absolute md:bottom-8 lg:bottom-12',
            even ? 'md:right-8 lg:right-12' : 'md:left-8 lg:left-12'
          )}
        >
          <Button
            variant="cta"
            className={CTA_ACTION}
            render={(props) => (
              <Link
                {...props}
                href={link}
                // Every row's link sits in or near the viewport, so the
                // default viewport prefetch pulled each story page's chunks
                // and data on load - 72KB on a 562KB page, contending with
                // the cover image that is this page's LCP element. The pages
                // router still prefetches on hover/focus, so a deliberate
                // click is as warm as before; only the speculative
                // fetch-everything-on-sight pass is gone.
                prefetch={false}
              />
            )}
          >
            {/* Figma 1:606 draws this pill as a "More" label (1:609) plus a
                separate 13.5x16.8 chevron vector (1:608) 12px after it - not
                as a ">" typed into the label, which is what the copy carried.
                The hidden half of the label is what keeps the anchor's text
                descriptive; see content/success-stories-page.yaml. Decorative,
                so the chevron carries no accessible name of its own. */}
            {linkText}
            <span className="sr-only">
              {' '}
              {linkContext.replace('{title}', title)}
            </span>
            <ButtonChevron />
          </Button>
        </div>
      </div>
    </Card>
  )
}
