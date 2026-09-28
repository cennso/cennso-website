import NextImage from 'next/image'

import type { FunctionComponent } from 'react'

export interface LogoBandLogo {
  name: string
  src: string
  width: number
  height: number
}

interface LogoBandProps {
  logos: LogoBandLogo[]
  className?: string
}

/**
 * The exported artwork is one colour set (navy, full opacity) shared by both
 * themes - the light and dark renderings in the frames are the same geometry
 * at two different opacity/colour treatments, not two different exports (see
 * `.claude/upstream-gaps.md`). Light theme dims the mark to 37% opacity, no
 * recolour needed. Dark theme needs full opacity and a colour shift from the
 * shipped navy to a lighter blue; `invert/sepia/saturate/hue-rotate/
 * brightness/contrast` is a standard technique for retinting a flat-colour
 * raster via CSS `filter` alone (solved numerically against the two frames'
 * sampled colours, verified to land within ~1 unit per channel of the target
 * - no hex literal needed in this component).
 */
const LOGO_TONE =
  'opacity-[.37] dark:opacity-100 dark:filter-[brightness(0)_invert(68%)_sepia(49%)_saturate(398%)_hue-rotate(173deg)_brightness(78%)_contrast(83%)]'

/**
 * Responsive row of customer logos that wraps rather than scrolls. Not in
 * the `@cennso/ui` registry as a dedicated logo-wall/marquee component -
 * composed locally, see `.claude/upstream-gaps.md`. A real `<ul>` of `<li>`
 * images (not one flattened band image) so each logo keeps its own
 * accessible name and can size independently.
 */
export const LogoBand: FunctionComponent<LogoBandProps> = ({
  logos,
  className = '',
}) => (
  // Figma 1:564 / 1:4990 lay the ten marks out as two rows of five across a
  // 1170px band. A `flex-wrap` row packs by measured width instead, which put
  // seven on the first row and three on the second - the same ten logos, the
  // wrong shape. An explicit 5-column grid from `sm:` up reproduces the band;
  // below that it steps down to 3 and then 2 columns, which the design has no
  // artboard for (there are no mobile frames in the file at all).
  <ul
    className={`grid grid-cols-2 place-items-center gap-x-10 gap-y-6 sm:grid-cols-3 md:grid-cols-5 ${className}`}
  >
    {logos.map((logo) => {
      // `sizes` describes the rendered *width*, but this component caps the
      // *height* and lets width follow each logo's own aspect ratio - so no
      // single literal width is right for all of them. The widest mark
      // (hochbahn, 801x123) wants ~260 CSS px at the 40px cap, more than twice
      // the 120px that used to be declared, so next/image picked a srcset
      // candidate far below the needed resolution and the browser upscaled it.
      //
      // The grid column is the other constraint, and the one that used to be
      // missing: on the 1200px measure a 5-column row with a 40px gutter gives
      // each cell 208px, which is narrower than hochbahn and travelping want.
      // With a *fixed* height those two were squeezed sideways by the cell's
      // max-width and rendered out of proportion (Lighthouse
      // `image-aspect-ratio`). Capping BOTH axes instead - `max-h-*` with
      // `h-auto`/`w-auto` - lets the browser fit the mark inside the cell with
      // its ratio intact, and the same cap is what `sizes` declares, so the
      // srcset candidate matches what is actually painted.
      const aspectRatio = logo.width / logo.height
      const fit = (capHeight: number, cellWidth: number) =>
        Math.ceil(Math.min(capHeight * aspectRatio, cellWidth))

      return (
        <li key={logo.name} className="flex items-center justify-center">
          <NextImage
            src={logo.src}
            alt={logo.name}
            width={logo.width}
            height={logo.height}
            sizes={`(min-width: 768px) ${fit(40, 208)}px, (min-width: 640px) ${fit(
              40,
              165
            )}px, ${fit(32, 130)}px`}
            className={`h-auto max-h-8 w-auto max-w-full sm:max-h-10 ${LOGO_TONE}`}
          />
        </li>
      )
    })}
  </ul>
)
