/**
 * The two sizes the Design 4.0 frames draw the orange call-to-action pill at.
 * `@cennso/ui`'s `Button` owns the colour (`variant="cta"`, the --cta token);
 * only the box and the type are overridden here, because the library's shared
 * control scale tops out at 44px and 16px while these frames draw 52px/20px
 * and 42px/18px.
 *
 * Measured from the frames, not guessed:
 * - `CTA_HERO` -> Figma 1:66 / 1:4493: 195x52, 32px left pad, 13px right pad,
 *   17px gap, Poppins Bold 20px.
 * - `CTA_ACTION` -> Figma 1:606 ("btn_More", instanced on every success-story
 *   row) and 1:3938 ("Send" on the contact form): 107x42, label inset 20px
 *   from the left, Poppins Bold 18px.
 *
 * What is deliberately NOT copied: the frames set the label to #ffffff on
 * #ff6d12, which measures 2.82:1 - below WCAG 2.1 AA at any size, so it would
 * fail `yarn a11y:contrast` and the constitution's Principle V. The label stays
 * on --cta-foreground, which the design system picked for exactly that reason.
 */
export const CTA_HERO = 'h-[52px] gap-4 pl-8 pr-3 text-[20px] font-bold'

export const CTA_ACTION = 'h-[42px] gap-3 pl-5 pr-4 text-lg font-bold'
