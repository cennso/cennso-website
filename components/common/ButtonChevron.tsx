import { ChevronRight } from 'lucide-react'

import type { FunctionComponent } from 'react'

/**
 * The trailing chevron on every pill that leads somewhere (Book demo, Sign In,
 * More, Send), so they all carry the same arrow.
 *
 * lucide's glyph fills only the middle of its 24px box, so sizing the icon to
 * the slot the frames draw (Figma 1:68: 11x15 next to a 20px label) makes the
 * chevron half the size the design shows. Instead the slot keeps the frame's
 * proportions and the glyph is drawn at 1.3x the label size, overflowing the
 * slot symmetrically into the gap and inset around it. Both are in `em`, so
 * the arrow scales with whatever label it follows.
 *
 * Decorative: the label already names the action.
 */
export const ButtonChevron: FunctionComponent = () => (
  <span className="inline-flex h-[0.75em] w-[0.55em] shrink-0 items-center justify-center">
    <ChevronRight
      className="h-[1.3em] w-[1.3em] max-w-none shrink-0 overflow-visible"
      strokeWidth={2.5}
      aria-hidden="true"
    />
  </span>
)
