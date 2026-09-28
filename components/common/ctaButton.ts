/**
 * The two sizes the Design 4.0 frames draw the orange call-to-action pill at.
 * `@cennso/ui`'s `Button` owns the surface (`variant="cta"`, the --cta token);
 * only the box, the type and the label colour are overridden here, because the
 * library's shared control scale tops out at 44px and 16px while these frames
 * draw 52px/20px and 42px/18px.
 *
 * Measured from the frames, not guessed:
 * - `CTA_HERO` -> Figma 1:66 / 1:4493: 195x52, 32px left pad, 13px right pad,
 *   17px gap, Poppins Bold 20px, label #ffffff.
 * - `CTA_ACTION` -> Figma 1:606 ("btn_More", instanced on every success-story
 *   row) and 1:3938 ("Send" on the contact form): 107x42, label inset 20px
 *   from the left, Poppins Bold 18px, label #ffffff.
 *
 * `text-white` overrides the `cta` variant's own --cta-foreground (a dark
 * brown the design system picked for contrast). Every 4.0 frame sets #ffffff
 * on the #ff6d12 pill, which measures 2.82:1 - below the 4.5:1 WCAG 2.1 AA
 * floor, and below the 3:1 large-text floor too. A previous pass kept the
 * design system's dark label for that reason; the site owner has since asked
 * twice for the frame's white, so the frame is what ships. The consequence is
 * recorded rather than hidden: `yarn a11y:contrast` and Lighthouse's
 * `color-contrast` audit both flag this pill, and reverting is a one-token
 * edit here that fixes every call site at once.
 */
export const CTA_HERO =
  'h-[52px] gap-4 pl-8 pr-3 text-[20px] font-bold text-white'

export const CTA_ACTION =
  'h-[42px] gap-3 pl-5 pr-4 text-lg font-bold text-white'
