import { Card } from '@cennso/ui'

import type { FunctionComponent, ReactNode } from 'react'

/**
 * Height of the figure band, measured from the card's top edge to the top of
 * the title, in Figma 1:20-1:23 (dark) and 1:4447-1:4450 (light). All eight
 * cards put the title at exactly y+205 regardless of how tall their own
 * figure is, so the band is a fixed box and the figure is centred inside it -
 * which is also within ~11px of where each frame hand-places its figure, and
 * more consistent than the frames are with each other.
 */
const FIGURE_BAND = 'h-[205px]'

interface StatCardProps {
  /**
   * Polymorphic figure slot: three of the four stat cards in the design pass
   * an icon/illustration image, one passes a bare styled number
   * (`<Typography variant="stat">`). Not in the `@cennso/ui` registry as a
   * dedicated component - composed locally from `Card` + `Typography`, see
   * `.claude/upstream-gaps.md`.
   */
  figure: ReactNode
  title: string
  description: string
  className?: string
}

export const StatCard: FunctionComponent<StatCardProps> = ({
  figure,
  title,
  description,
  className = '',
}) => {
  return (
    // Figma 1:20-1:23 (dark) / 1:4447-1:4450 (light): 600x447, 24px corner.
    // Card ships an 8px corner and a 20px --card-spacing that drives padding
    // and gap alike, so the vertical metrics are set explicitly here:
    //   - figure band 205px from the card's top edge (see FIGURE_BAND), with
    //     no gap of its own - hence `gap-0` and `pt-0`
    //   - 17px between title and description (1:26 -> 1:27, and the same on
    //     all four cards in both themes)
    //   - 36px under the description (1:27 bottom 1945 in a card ending 1981)
    //   - 447px tall, which all eight panels are regardless of how much copy
    //     they carry. It has to be stated, because the 36px above is measured
    //     to the bottom of a text FRAME the designer dragged to 141px, not to
    //     the bottom of the text inside it: 1:27 sets in 3 lines (81px), so
    //     the visible gap under the copy in the frame is ~96px, not 36. As a
    //     floor rather than a fixed height, so a longer paragraph or a
    //     narrower card still grows the panel instead of overflowing it.
    // Horizontal inset is 44px, and it is a fit rather than a copy, because
    // the frames' own insets are not symmetric and cannot be made so. Every
    // text box in these four cards is hand-placed: left insets run 65, 52, 66,
    // 50 and right insets 50, 38, 49, 40, and each title is set to auto-width
    // so it never wraps - 1:26 is 489px wide inside a 600px card whose left
    // inset is 65, i.e. it overhangs its own right inset. Symmetric padding
    // cannot reproduce that: "Available in over 170 locations" measures 492px
    // at Poppins Bold 32px (the frame measures 489), so 65px either side would
    // leave 470px and wrap the title onto a second line, which no frame shows.
    // 44px keeps every title on one line and lands the paragraph measure at
    // 512px, just above the 485-510px the four frames actually use.
    //
    // The card itself is now the frames' 600px: the panel row was widened to
    // the frames' own 1237px (see PANEL_ROW_MEASURE) after the owner ruled
    // that the frames win over one shared site-wide measure. The note that
    // used to sit here - that the 65px inset needs a wider card than
    // CONTENT_MEASURE gives - is settled: the card is wide enough now, and
    // 65px symmetric still wraps the title, so the inset stays a fit.
    //
    // It steps 24 -> 44 with the card's own width: below `md` the card is
    // phone-width and a 44px inset either side leaves too little measure for
    // an 18px paragraph.
    //
    // The copy under the figure is LEFT aligned in every frame even though
    // the figure above it is centred - it used to be centred here, which is
    // what made the block read as a stat tile rather than the design's text
    // panel.
    //
    // No border in the light frames: 1:4447 is a plain white rounded
    // rectangle, where the dark 1:20 carries a #0c426c stroke (which is what
    // --border resolves to there, to within 2/255 per channel). The border
    // box is kept and only the colour cleared, so nothing shifts by a pixel.
    <Card
      className={`rounded-3xl gap-0 pt-0 pb-9 md:min-h-[447px] border-transparent dark:border-border [--card-spacing:--spacing(6)] md:[--card-spacing:--spacing(11)] ${className}`}
    >
      <Card.Content
        className={`flex items-center justify-center ${FIGURE_BAND}`}
      >
        {figure}
      </Card.Content>
      <Card.Header className="gap-[17px]">
        {/* Figma 1:26 etc: Poppins Bold 32px, line height auto - which is 1.5
            for Poppins, giving the 48px box the frame measures. */}
        <Card.Title
          render={<h3 />}
          className="text-[32px] font-bold leading-[1.5]"
        >
          {title}
        </Card.Title>
        {/* Figma 1:27 etc: Poppins Regular 18px, line height auto (1.5, so
            27px - `text-lg` alone gives Tailwind's 28px), in the card's own
            foreground: white in 1:27, #185f99 in 1:4454, which is exactly
            what --card-foreground resolves to in each theme. */}
        <Card.Description className="text-lg leading-[1.5] text-card-foreground">
          {description}
        </Card.Description>
      </Card.Header>
    </Card>
  )
}
