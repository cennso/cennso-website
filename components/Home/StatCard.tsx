import { Card } from '@cennso/ui'

import type { FunctionComponent, ReactNode } from 'react'

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
    // Figma 1:20-1:23 (dark) / 1:4447-1:4450 (light): 600x447, 24px corner,
    // 65px inset. Card ships an 8px corner and a 20px --card-spacing.
    // The figure is centred in the card but the copy under it is LEFT aligned
    // in every frame (title and body both start at the card's own 65px inset,
    // e.g. 1:26/1:27 at x=126 inside a card at x=61) - it used to be centred
    // here, which is what made the block read as a stat tile rather than the
    // design's text panel.
    <Card className={`rounded-3xl [--card-spacing:--spacing(10)] ${className}`}>
      <Card.Content className="flex items-center justify-center">
        {figure}
      </Card.Content>
      <Card.Header>
        {/* Figma 1:26 etc: Bold 32px. */}
        <Card.Title
          render={<h3 />}
          className="text-[32px] font-bold leading-[1.3]"
        >
          {title}
        </Card.Title>
        {/* Figma 1:27 etc: Regular 18px in the page foreground. */}
        <Card.Description className="text-lg text-foreground">
          {description}
        </Card.Description>
      </Card.Header>
    </Card>
  )
}
