import type { ImageProps } from 'next/image'

/**
 * The pencil banner beside a page heading - /contact, /privacy-policy and
 * /imprint all use this one, so they stay identical.
 *
 * The file is Figma's "Mask group" 1:3477 at 2x (495x386), right-aligned to
 * the column and level with the heading block. It overhangs the section below
 * by 48px (`lg:-mb-12`) so the content that follows is not pushed down by the
 * banner's faded lower edge, and reaches 48px under the text column
 * (`lg:-ml-12`) - its left edge is faded hexagons, and without it a heading
 * like /contact's broke onto a second line. Stepped down below lg so it does
 * not squeeze the heading on a tablet-width row; PageHeader hides it below md.
 *
 * Decorative: the heading beside it carries the meaning.
 */
export const PENCIL_BANNER: ImageProps = {
  src: '/assets/backgrounds/pencil-illustration.webp',
  alt: '',
  'aria-hidden': 'true',
  width: 495,
  height: 386,
  sizes: '(max-width: 767px) 0px, (max-width: 1023px) 288px, 495px',
  className: 'block h-auto w-72 lg:w-[495px] lg:max-w-none lg:-mb-12 lg:-ml-12',
}
