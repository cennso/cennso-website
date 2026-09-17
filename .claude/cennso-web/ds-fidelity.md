# ds-fidelity: cennso-website

## Stack this repository is on (judge against this, not against defaults)

Next.js 15.5.25, Pages Router (not App Router), React 19.3.0, TypeScript
strict mode, Tailwind 3 with `@cennso/theme/tailwind-preset`
(`tailwind.config.js:2,38`), `@cennso/ui@0.1.2` + `@cennso/theme@0.1.2`
(`package.json`), `lucide-react` as the only icon set.

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

## Two lessons from converting the first page (`success-stories`)

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
