# ds-fidelity: cennso-website

## Stack this repository is on (judge against this, not against defaults)

Next.js 15.5.25, Pages Router (not App Router), React 19.3.0, TypeScript
strict mode, Tailwind 3 with `@cennso/theme/tailwind-preset`
(`tailwind.config.js:2,38`), `@cennso/ui@0.2.3` + `@cennso/theme@0.2.3`
(`package.json`, bumped from `0.2.1` in phase 4's design-4-theme branch),
`lucide-react` as the only icon set. The site has a light/dark theme
(`ThemeProvider` in `_app.tsx`, `default dark` — see `a11y-gate.md`); judge
colour usage against theme tokens (`hsl(var(--foreground))`, `bg-card`,
`border-border`, etc.), not against a single fixed palette.

## Colour comes from tokens, not literals

A hardcoded hex (`#185f99`, `bg-[#36AADD]`, `text-[#185F99]`, and similar
arbitrary-value classes) in shell/page/component markup is a defect on this
branch, not a style nit: with two themes, a literal colour is either wrong
in one palette or coincidentally right in both, and there's no way to tell
which from source. `grep -rnE "#[0-9a-fA-F]{3,6}" components/Layout.tsx
components/Navigation.tsx components/Footer.tsx` must return nothing — this
is one of phase 4's own acceptance checks. The fix is always a token
(`text-primary`, `bg-secondary`, `hsl(var(--foreground))`, …), never a new
arbitrary-value hex, even one that looks close to a token's current colour.

**`--footer` is the one deliberate, disclosed exception.** `styles/tailwind.css`
pins `--footer` to a fixed HSL triplet in a bare `:root` selector (no
`[data-theme]` qualifier), overriding `@cennso/theme`'s own light/dark
`--footer` values. This is intentional — the footer band is drawn as one
fixed dark surface in both palettes in the Design 4.0 frames, not a surface
that should flip with the theme — and it's still token-driven (`bg-footer`
keeps working as an ordinary Tailwind token consumer); it just doesn't vary.
Do not flag this as "the token isn't actually themed" — that's the point.

**Known, disclosed, deferred hex holders — do not re-flag these as new.**
`components/common/CircleAvatar.tsx` (`from-[#1D75BC] to-[#04D3D6]`
gradient), `components/MenuToogle.tsx`, and `components/common/Button.tsx`
still carry hardcoded hex values. All three predate and are untouched by
phase 4's page conversions so far and are knowingly deferred, not missed —
only flag one of them if a diff actually touches that file's colour classes
without removing the hex, or if `unverifiable` is more honest than silence
because the diff is adjacent enough to raise the question.

## Deliberately removed — must not come back

`daisyui`, `@material-tailwind/react`, `@heroicons/react`, `react-icons`.
`grep -rn "daisyui\|@material-tailwind\|@heroicons/react\|react-icons"
package.json components pages lib tailwind.config.js` returns nothing at
HEAD. Reintroducing any of these, or a finding that recommends one of them
as a fix, is itself a defect.

This list is not "`@cennso/ui` is now the only component library." `@headlessui/react`
(`^2.1.10` in `package.json:53`, resolving to `2.2.9` installed) is still a live
dependency: `components/common/Select.tsx`
is built from its `Listbox`/`Transition`, and that `Select` still renders on
`/blog` (`pages/blog/index.tsx:17,30`). Whether Headless UI also gets removed
is a phase-4 decision this branch does not make — do not flag its presence as
a defect or assume it is already gone.

## Mapping decisions already made — do not relitigate per page

- `Button`'s old `tertiary` variant maps to `secondary`. `@cennso/ui`'s
  `buttonVariants` accepts `"primary" | "cta" | "secondary" | "outline" |
  "outlinePrimary" | "ghost" | "destructive"` — there is no `tertiary`
  (verified against `node_modules/@cennso/ui/dist/index.d.ts`). Flagging this
  mapping as an unexplained/hand-rolled control is a false positive.
- `Button`'s old `useArrow` boolean prop has no equivalent in `@cennso/ui`'s
  `ButtonProps` and was dropped, not replaced. This is a real, permanent gap —
  see `upstream-gap.md` — not something a page conversion should be asked to
  work around locally.
- `next/image` is imported as `NextImage` wherever `@cennso/ui`'s own `Image`
  is, or might be, in scope in the same file — `@cennso/ui` exports its own
  `Image`, so the two names collide. Do not flag the `NextImage` alias as
  unusual or unexplained.
- `Select`'s `items` prop type is
  `Record<string, ReactNode> | readonly { label: ReactNode; value: any }[] |
  readonly Group<any>[]` (from `@base-ui/react/select`'s `SelectRootProps`,
  re-exported through `@cennso/ui`) — **not** `{id, value}`. Do not flag a
  `{label, value}` or a plain label-keyed record shape as wrong.

## Not candidates for replacement

`components/common/Hexagon.tsx`, `HexagonAvatar.tsx`, `HexagonDouble.tsx`,
`HexagonDoubleGradient.tsx`, and the `mask`/`mask-hexagon-2` utility classes
they render with are this site's brand shape. The mask is a local
`addUtilities` Tailwind plugin (`tailwind.config.js:125-134`, "Copied verbatim
from daisyui@4 dist/full.css") kept in `safelist` (`tailwind.config.js:55-58`)
as defensive belt-and-braces, not because the scanner can't see it — every
occurrence is the contiguous literal `mask mask-hexagon-2` (e.g.
`Hexagon.tsx:17`, `HexagonAvatar.tsx:19`, `pages/about.tsx:141`,
`SuccessStories/SuccessStoryItem.tsx:37`), which Tailwind's content scanner
finds fine inside a template literal. `@cennso/ui` has no hexagon-frame
primitive; this is not a gap to report, and these files are not candidates
for replacement by a library component.

## A locally-composed component is not automatically a finding

`registry.json` alone can only tell you the library has no matching
component; it can't tell you whether the author knew that and composed
deliberately, or just didn't look. Before raising a finding against a new
local component (e.g. `components/Home/StatCard.tsx`,
`components/Home/LogoBand.tsx`), check `.claude/upstream-gaps.md` in the
repository root for a matching entry. If the diff itself adds one — both of
the two named above are logged there, dated the same day they were added —
treat the composition as accepted and documented, not a hand-rolled/
unexplained control. Reserve a finding for a locally-composed component that
duplicates registry-owned styling concerns (see the `SuccessStoryItem`
lesson below) or that has no corresponding log entry at all.

## Three lessons from converting the first three pages (`success-stories`, `contact`, `home`)

**0. Dropping a registry component the file used to import is a finding on
its own, even mid-redesign.** `components/SuccessStories/SuccessStoryItem.tsx`
replaced `@cennso/ui`'s `Card` (`size="md"`, `Card.Header`/`Card.Content`)
with a hand-rolled `<div className="... rounded-[32px] border border-border
bg-card md:flex-row ...">` — carrying exactly the border/radius/surface
styling `Card` owns — with no comment explaining why. A new split
image/content layout may genuinely not fit `Card`'s slot model, but that has
to be said, not assumed from the fact that the visual design changed. Ask
whether `Card`'s current slots (`Card.Content`, `Card.Header`, `Card.Title
render={<h3 />}`, `Card.Description`) could express the new layout before
accepting the hand-roll.

**1. Check every render site of a shared element array when converting to a
compound component.** `components/Navigation.tsx` originally built one array
of `Menu.Item`s and rendered it from two places: the desktop dropdown (inside
a `<Menu>` root) and the mobile accordion (a plain, always-in-flow `<ul>`
with no `Menu.Root` ancestor). `Menu.Item` requires a `Menu.Root` ancestor via
context; the mobile accordion never has one, so it threw on every page
render. It is a **runtime throw, not a type error** — nothing catches it
before the build. The current fix (`Navigation.tsx:102-139`,
`buildChildItems`) builds the shared `<li><Link>...</Link></li>` list once
but defers only the innermost leaf to the caller, rendering `Menu.Item` for
the desktop call site and a plain `<span>` for the mobile one. When reviewing
a compound-component conversion, check every place a shared array/render
function is invoked, not just the first.

**2. A compound component's `render` prop only works if the rendered
component forwards unknown props to its DOM node.** `components/Markdown/Share.tsx`
originally passed `Tooltip.Trigger render={<EmailShareButton>}` directly;
`next-share`'s `SocialShareButton` renders
`createElement("button", {"aria-label":…, onClick:…, ref:c, style:u}, n)` — a
four-prop whitelist that silently drops Base UI's hover/focus wiring. No type
error, no failing check; the tooltip simply never appeared. The fix
(`Share.tsx:33`, and the four parallel blocks at lines 50, 67, 82, 98) makes
the trigger a plain `<span className="inline-flex" />` wrapper that
*contains* the third-party share button, instead of trying to render the
third-party component as the trigger itself. When reviewing a `render={<ThirdPartyComponent />}` pattern,
check whether that component is known to forward arbitrary props — if it
isn't (or can't be verified), the wrap-instead-of-render pattern is the safer
default.
