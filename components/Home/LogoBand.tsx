import NextImage from 'next/image'

import type { CSSProperties, FunctionComponent } from 'react'

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
 * `.claude/upstream-gaps.md`). Light theme dims the mark to 54% opacity (the
 * frames' 37% gave 1.72:1 against the #E1EAF0 plate; the owner asked for 35%
 * more contrast, 2.33:1), no
 * recolour needed. Dark theme needs full opacity and a colour shift from the
 * shipped navy to a lighter blue; `invert/sepia/saturate/hue-rotate/
 * brightness/contrast` is a standard technique for retinting a flat-colour
 * raster via CSS `filter` alone (solved numerically against the two frames'
 * sampled colours, verified to land within ~1 unit per channel of the target
 * - no hex literal needed in this component).
 */
const LOGO_TONE =
  'opacity-[.54] dark:opacity-100 dark:filter-[brightness(0)_invert(68%)_sepia(49%)_saturate(398%)_hue-rotate(173deg)_brightness(78%)_contrast(83%)]'

/**
 * Optical sizing: one shared height makes a wide wordmark (Hochbahn, 6.5:1)
 * look huge and a square mark (Telna) tiny, so the height shrinks as the
 * aspect ratio grows - 56px for a square mark, ~40px for the widest.
 */
const LOGO_SCALE = 0.8
const OPTICAL_HEIGHT = 56 * LOGO_SCALE
const OPTICAL_FALLOFF = 0.18

function logoHeight(logo: LogoBandLogo): number {
  return Math.round(
    OPTICAL_HEIGHT * Math.pow(logo.width / logo.height, -OPTICAL_FALLOFF)
  )
}

/**
 * Customer logos as one slowly scrolling row (a marquee). Not in the
 * `@cennso/ui` registry as a dedicated logo-wall/marquee component - composed
 * locally, see `.claude/upstream-gaps.md`. Real `<ul>`s of `<li>` images so
 * each logo keeps its own accessible name.
 *
 * The row renders its logos twice and translates by -50%, so the loop is
 * seamless. The second copy is `aria-hidden` so screen readers hear each logo
 * once. The row pauses on hover and stands still
 * under `prefers-reduced-motion` (see `.logo-marquee` in styles/tailwind.css).
 */
export const LogoBand: FunctionComponent<LogoBandProps> = ({
  logos,
  className = '',
}) => {
  return (
    <div className={`logo-marquee flex w-full overflow-hidden ${className}`}>
      <div className="logo-marquee-track flex w-max">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
            className="flex shrink-0 items-center gap-x-[54px] pr-[54px] md:gap-x-[82px] md:pr-[82px]"
          >
            {logos.map((logo) => {
              const height = logoHeight(logo)
              const width = Math.ceil((height * logo.width) / logo.height)

              return (
                <li
                  key={logo.name}
                  className="flex shrink-0 items-center justify-center"
                >
                  <NextImage
                    src={logo.src}
                    alt={copy === 1 ? '' : logo.name}
                    width={logo.width}
                    height={logo.height}
                    sizes={`(min-width: 768px) ${width}px, ${Math.ceil(width * 0.75)}px`}
                    style={{ '--logo-h': `${height}px` } as CSSProperties}
                    className={`h-[calc(var(--logo-h)*0.75)] w-auto md:h-(--logo-h) ${LOGO_TONE}`}
                  />
                </li>
              )
            })}
          </ul>
        ))}
      </div>
    </div>
  )
}
