import type { FunctionComponent, PropsWithChildren } from 'react'

/**
 * The Design 4.0 content measure. Every 4.0 frame is 1360px wide and sets its
 * content between x=81 and x=1279 - a 1198px column with an 81px gutter either
 * side (hero H1 1:24 at x=81, story rows 1:592 at x=81, page H1 1:589 at x=81;
 * the logo 1:111 at x=85 and the logo band 1:564 at x=95 are the outliers).
 * Rounded to 1200, a 1360px viewport lands on an 80px gutter, which is the
 * frame's.
 *
 * It used to be `max-w-(--breakpoint-2xl)` (1536px) with a 16px page padding,
 * so at 1360px the content ran 16px from each edge - 65px further left than the
 * design, which is what reads as the header (and everything under it) being
 * pushed to the left rather than sitting on the frame's column. Exported
 * because `Navigation` has to sit on the same column as the page below it.
 */
export const CONTENT_MEASURE = 'max-w-[1200px]'

interface ContainerProps extends PropsWithChildren {
  className?: string
  subClassName?: string
}

export const Container: FunctionComponent<ContainerProps> = ({
  className = '',
  subClassName = '',
  children,
}) => {
  return (
    <section
      className={`${className} flex flex-row justify-center w-full max-w-screen border-none px-8 lg:px-4`}
    >
      <div
        className={`${subClassName} relative flex flex-row items-center justify-between w-full ${CONTENT_MEASURE}`}
      >
        {children}
      </div>
    </section>
  )
}
