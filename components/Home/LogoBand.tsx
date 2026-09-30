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
 * Optical sizing: one shared height makes a wide wordmark (Hochbahn, 6.5:1)
 * look huge and a square mark (Telna) tiny, so the height shrinks as the
 * aspect ratio grows - 56px for a square mark, ~40px for the widest.
 */
const OPTICAL_HEIGHT = 56
const OPTICAL_FALLOFF = 0.18

function logoHeight(logo: LogoBandLogo): number {
  return Math.round(
    OPTICAL_HEIGHT * Math.pow(logo.width / logo.height, -OPTICAL_FALLOFF)
  )
}

/**
 * Customer logos as two staggered rows. Not in the `@cennso/ui` registry as a
 * dedicated logo-wall/marquee component - composed locally, see
 * `.claude/upstream-gaps.md`. Real `<ul>`s of `<li>` images (not one flattened
 * band image) so each logo keeps its own accessible name.
 *
 * From `md:` up each row spreads its marks edge to edge (`justify-between`),
 * so the band spans the same measure as the card row it sits above. Because
 * the two rows hold marks of different widths, their gaps differ and the
 * second row reads offset from the first rather than as a rigid grid. Below
 * `md:` the rows wrap and centre.
 */
export const LogoBand: FunctionComponent<LogoBandProps> = ({
  logos,
  className = '',
}) => {
  const half = Math.ceil(logos.length / 2)
  const rows = [logos.slice(0, half), logos.slice(half)]

  return (
    <div className={`flex w-full flex-col gap-8 md:gap-10 ${className}`}>
      {rows.map((row, index) => (
        <ul
          key={index}
          className={`flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:flex-nowrap md:justify-between ${
            index === 1 ? 'md:px-4' : 'md:px-10'
          }`}
        >
          {row.map((logo) => {
            const height = logoHeight(logo)
            const width = Math.ceil((height * logo.width) / logo.height)

            return (
              <li key={logo.name} className="flex items-center justify-center">
                <NextImage
                  src={logo.src}
                  alt={logo.name}
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
  )
}
