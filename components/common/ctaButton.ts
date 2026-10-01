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
/**
 * Stated as the frame's own values rather than the nearest Tailwind steps:
 * `gap-4`/`pl-8`/`pr-3` are 16/32/12 where 1:66 draws 17/32/13, and those
 * roundings are what made the pill measure 187px against a designed 195.
 *
 * The exact insets alone still do not reach 195. The frame budgets
 * 195 - 32 - 17 - 11 - 13 = 122px for "Book demo" at Poppins Bold 20px; the
 * font the site actually serves sets the same string ~7px narrower, so the
 * intrinsic pill is ~188px. `min-w-[195px]` pins the frame's measure without
 * pinning the copy: the label is CMS text, so a fixed `w-[195px]` would clip a
 * longer one. The 7px of slack lands after the chevron, before the right
 * inset.
 */
/**
 * Hover matches the header's Sign In pill: amber #FFB31B fill, dark navy
 * #081927 label; the chevron follows via currentColor.
 */
export const CTA_HERO =
  'h-[52px] min-w-[195px] gap-[17px] pl-[32px] pr-[13px] text-[20px] font-bold text-white transition-colors hover:bg-[#ffb31b] hover:text-[#081927]'

/**
 * `text-left` is the frame's own value, not a layout choice: the label inside
 * 1:606 (and inside the contact form's instance of it, 1:3938 / 1:7550) is a
 * left-aligned text box, where `buttonVariants` centres it. It renders
 * identically - the pill is content-sized, so there is no free space for the
 * alignment to act on - but the computed value now says what the frame says
 * instead of contradicting it.
 */
export const CTA_ACTION =
  'h-[42px] gap-3 pl-5 pr-4 text-lg font-bold text-left text-white'
