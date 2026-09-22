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
    <Card className={className}>
      <Card.Content className="flex items-center justify-center">
        {figure}
      </Card.Content>
      <Card.Header>
        <Card.Title render={<h3 />} className="text-center">
          {title}
        </Card.Title>
        <Card.Description className="text-center">
          {description}
        </Card.Description>
      </Card.Header>
    </Card>
  )
}
