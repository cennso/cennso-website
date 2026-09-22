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
  'opacity-[.37] dark:opacity-100 dark:[filter:brightness(0)_invert(68%)_sepia(49%)_saturate(398%)_hue-rotate(173deg)_brightness(78%)_contrast(83%)]'

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
  <ul
    className={`flex flex-wrap items-center justify-center gap-x-10 gap-y-6 ${className}`}
  >
    {logos.map((logo) => (
      <li key={logo.name} className="flex items-center justify-center">
        <NextImage
          src={logo.src}
          alt={logo.name}
          width={logo.width}
          height={logo.height}
          sizes="(max-width: 640px) 96px, 120px"
          className={`h-8 w-auto sm:h-10 ${LOGO_TONE}`}
        />
      </li>
    ))}
  </ul>
)
