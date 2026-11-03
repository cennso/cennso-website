import type { FunctionComponent, PropsWithChildren } from 'react'

/**
 * The Design 4.0 *default* content measure - the column the type sits on.
 * Every 4.0 frame is 1360px wide and sets its running copy between x=81 and
 * x=1279: a 1198px column with an 81px gutter either side (hero H1 1:24 /
 * 1:4451 at x=81, page H1 1:589 / 1:1066 at x=81, contact H1 1:3475 / 1:7088
 * at x=81, footer logo 1:584 at x=81). Rounded to 1200, a 1360px viewport
 * lands on an 80px gutter, which is the frame's.
 *
 * It used to be `max-w-(--breakpoint-2xl)` (1536px) with a 16px page padding,
 * so at 1360px the content ran 16px from each edge - 65px further left than the
 * design, which is what reads as the header (and everything under it) being
 * pushed to the left rather than sitting on the frame's column. Exported
 * because `Navigation` has to sit on the same column as the page below it.
 *
 * **It is not the only measure in the design.** The frames put the panels and
 * the card rows on their own, wider rows, and the owner has ruled that the
 * frames win over internal consistency - so the two below are stated as their
 * own constants rather than squeezed onto this one. Every row measured off the
 * six frames, for the record:
 *
 * | Row                                     | left | right | span |
 * | --------------------------------------- | ---- | ----- | ---- |
 * | header logo 1:111 -> CTA 1:107          |   85 |    56 | 1219 |
 * | hero H1 1:24, page H1s, footer 1:584    |   81 |     - |    - |
 * | logo band 1:564 / 1:4990                |   95 |    95 | 1170 |
 * | "Why Cennso?" cards 1:10-1:12           |   61 |    53 | 1246 |
 * | stat panels 1:20-1:23                   |   61 |    62 | 1237 |
 * | success-story rows 1:592-1:595          |   81 |    87 | 1192 |
 * | contact form fields 1:3951 etc.         |  775 |    96 |  489 |
 *
 * Only the two the site can reproduce as a centred column are constants; the
 * rest are asymmetric hand-placements a centred measure cannot express, and
 * they are recorded here so the next reader does not re-derive them.
 */
export const CONTENT_MEASURE = 'max-w-[1200px]'

/**
 * The "Why Cennso?" card row. Figma 1:11 / 1:12 / 1:10 (dark) and 1:4442 /
 * 1:4443 / 1:4441 (light) are 400px wide at x=61 / 484 / 907, so the row spans
 * 61..1307 = 1246px with a 23px gap. Centred on a 1360px viewport that puts
 * the row at 57..1303 - 4px left of the frame, because the frame's own row is
 * not centred (61 left, 53 right). The card WIDTH, which is what the design
 * fidelity review measures, comes out at exactly 400px.
 */
export const CARD_ROW_MEASURE = 'max-w-[1246px]'

/**
 * The stat panel row. Figma 1:20 / 1:21 (dark) and 1:4447-1:4450 (light) are
 * 600px wide at x=61 and x=698, so the row spans 61..1298 = 1237px with a 37px
 * gap. Centred on a 1360px viewport that lands at 61.5..1298.5, i.e. the
 * frame's own row to within half a pixel.
 *
 * The dark frame hand-places its second row 6px right of its first (1:22 at
 * x=67 where 1:20 is at x=61); the light frame puts both at 61, so 61 is the
 * value.
 */
export const PANEL_ROW_MEASURE = 'max-w-[1237px]'

interface ContainerProps extends PropsWithChildren {
  className?: string
  subClassName?: string
  /**
   * The column this section sits on. Defaults to `CONTENT_MEASURE`; pass one
   * of the row measures above for a section the frames draw wider. Replaces
   * the default rather than being appended to it, because two `max-w-*`
   * utilities on one element are resolved by stylesheet order, not by the
   * order they are written in the attribute.
   */
  measure?: string
}

export const Container: FunctionComponent<ContainerProps> = ({
  className = '',
  subClassName = '',
  measure = CONTENT_MEASURE,
  children,
}) => {
  return (
    <section
      className={`${className} flex flex-row justify-center w-full max-w-screen border-none px-6 lg:px-4`}
    >
      <div
        className={`${subClassName} relative flex flex-row items-center justify-between w-full ${measure}`}
      >
        {children}
      </div>
    </section>
  )
}
