/**
 * The dark theme's three tinted surfaces - blue, cyan, teal - first drawn on
 * the landing page's "Why Cennso?" cards (5G Anywhere, Agile MVNO, Private 5G)
 * and reused wherever a list alternates them, so every such list cycles the
 * same three. Index with `i % 3`.
 */

// Spelled hsl(var(--x)/0.4) rather than the /40 opacity modifier: Tailwind 4
// compiles a `/40` opacity modifier to color-mix(in oklab, ...), which the browser
// computes as oklab(...). Lighthouse's bundled axe-core cannot parse that and
// nulls the whole accessibility category, failing the CI gate. This spelling
// computes to plain rgba() and is the same colour.
export const GLOW_TINTS = [
  'dark:bg-[hsl(var(--glow-blue)/0.4)]',
  'dark:bg-[hsl(var(--glow-cyan)/0.4)]',
  'dark:bg-[hsl(var(--glow-teal)/0.4)]',
] as const

// Each tinted card is outlined in the bright end of its own glow family in the
// dark frames - #3fabff on 1:11, #41d2ff on 1:12, #00ffe4 on 1:10 - not in the
// theme's flat --border. There is no token for these: --glow-* is the fill
// (35%/33% lightness), and the outlines sit far above it, so they are written
// as literals here the same way the tints above name their token. Dark only:
// the light frames (1:4442 / 1:4443 / 1:4441) draw the cards as plain white
// with no outline at all. Decorative, so no non-text contrast floor applies.
//
// The alpha is NOT decoration: each rectangle carries `opacity-41` on the
// ELEMENT in Figma, so the 41% dims the stroke exactly as much as it dims the
// fill - the outline the frames actually draw is #3fabff at 41% over the page
// plate, not #3fabff. Rendering it opaque is what made the three frames read
// as bright. Carried here as the same 0.4 the tints above use, so fill and
// stroke stay locked to one alpha the way a single element opacity does.
//
// Spelled as an 8-digit hex (66 = 102/255 = 0.4) rather than the `/40` opacity
// modifier for the reason the tints give: Tailwind 4 compiles `/40` to
// color-mix(in oklab, ...), which Lighthouse's bundled axe-core cannot parse,
// and it nulls the whole accessibility category. A literal hex needs no
// color-mix and is the same colour.
export const GLOW_OUTLINES = [
  'dark:border-[#3fabff66]',
  'dark:border-[#41d2ff66]',
  'dark:border-[#00ffe466]',
] as const
