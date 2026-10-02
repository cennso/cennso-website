import type { FunctionComponent, PropsWithChildren } from 'react'

/**
 * A success story's content card, per Design 4.0's "Content page v2" frames,
 * stacked in both themes (owner's call): the title on top, then the body -
 * text and images - at full card width.
 *
 * Surface, per theme:
 * - dark (133:2015): rgba(14,43,71,.82) fill, 1px #0C426C border, 24px corner,
 *   with the frame's 7px backdrop blur (the fill is translucent, so it shows).
 * - light (1:7027): white fill, no visible border, 24px corner.
 *
 * Type: title Poppins Bold 26/1.6 (#FFB31B dark / #185F99 light, 133:2017 /
 * 1:7029); body Regular 20/1.6 (white dark / #185F99 light, 133:2019 /
 * 1:7031). Body images get the frames' 14px corner (133:2021 / 1:7033), but
 * not their 1px #2F5A7D border, which the owner removed. An image marked
 * `data-flat` (e.g. a partner logo) keeps square corners. Insets are the dark frame's, measured from the card's
 * outer edge (padding + 1px border): 58px sides, 38px top,
 * ~18px from the title's line box to the body. Mobile scales these down.
 *
 * Stat and CallToAction keep the shared STORY_CARD surface; only this block
 * follows the content-page frames.
 */
const CONTENT_CARD =
  'rounded-3xl border bg-white border-transparent dark:bg-[rgba(14,43,71,0.82)] dark:border-[#0c426c] dark:backdrop-blur-[7px]'

interface ContentBlockProps extends PropsWithChildren {
  title: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const ContentBlock: FunctionComponent<ContentBlockProps> = ({
  title,
  as = 'h2',
  children,
}) => {
  const Title = as

  return (
    <section
      className={`flex flex-col gap-[18px] w-full mb-6 px-6 pt-7 pb-8 md:px-[57px] md:pt-[37px] md:pb-[45px] ${CONTENT_CARD}`}
    >
      <header className="flex flex-row w-full">
        <Title className="w-full mt-0! mb-0! font-bold text-[22px] md:text-[26px] leading-[1.6] text-[#185f99] dark:text-[#ffb31b]">
          {title}
        </Title>
      </header>

      {/* The body's first and last blocks drop their prose margins, so the
          card's own padding is the only space at its edges. */}
      <div className="w-full text-lg md:text-[20px] leading-[1.6] text-[#185f99] dark:text-white [&_p]:leading-[1.6] [&_img:not([data-flat])]:rounded-[14px] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </section>
  )
}
