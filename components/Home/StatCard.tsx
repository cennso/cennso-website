import { Card, cn } from '@cennso/ui'

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
    // `gap-5 py-5` / `px-5` restate Card's own `gap-(--card-spacing)` /
    // `py-(--card-spacing)` / `px-(--card-spacing)` as plain utilities:
    // this app runs Tailwind 3 (`tailwind.config.js`), which has no
    // arbitrary-property-shorthand syntax (`prop-(--var)` is a Tailwind 4
    // feature), so those `@cennso/ui` classes compile to nothing here and
    // Card renders with zero padding/gap. `5` matches --card-spacing's own
    // documented default (`--spacing(5)`, 20px) - the Figma frame agrees,
    // so this restates the intended value rather than overriding it upstream
    // to a different one. Filed upstream: `.claude/upstream-gaps.md`.
    <Card className={cn('gap-5 py-5 shadow-none', className)}>
      <Card.Content className="flex items-center justify-center px-5">
        {figure}
      </Card.Content>
      <Card.Header className="px-5">
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
