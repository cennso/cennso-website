# ds-fidelity: cennso-website

## Stack this repository is on (judge against this, not against defaults)

Next.js 15.5.25, Pages Router (not App Router), React 19.3.0, TypeScript
strict mode, Tailwind 3 with `@cennso/theme/tailwind-preset`
(`tailwind.config.js:2,38`), `@cennso/ui@0.2.1` + `@cennso/theme@0.2.1`
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

## Working from Figma — the five rules Phase 4 paid for

Phase 4 put `/`, `/success-stories` and `/contact` on the Cennso Design 4.0
Figma (file `OqKo0g7Hb85V8YlEVYWUhf`). It shipped substantially wrong with every
automated gate green, and the site owner found it by looking at the preview.
None of the defects were subtle: a 36px `<h1>` where Figma says 48px, 16px nav
links where Figma says 18px, a yellow logo where the design draws a white one, a
blue "Sign in" button where the design has an outlined "Book demo" pill, the
light frame's hero artwork on a dark page, and a hero band the design does not
have. **This reviewer missed all six.** Treat each rule below as a defect class
to look for, not as advice.

**1. Expand every symbol before you believe a frame.** `1:99` is a symbol named
"Header". In a frame screenshot it is a picture of a navigation bar — its
typography, its logo colour and its CTA simply are not in the image as values.
One `get_design_context` call on the **frame** returns its symbols expanded into
functions, which is the cheapest way to get them; `get_metadata` on the symbol id
followed by `get_design_context` on it reads one in isolation. Either way, read
the children (`1:104`–`1:111`). The nav in Phase 4 was rebuilt from the old site
and restyled by eye because this step was skipped. A change that touches a
region a symbol covers, with no evidence the symbol was read, is a finding.

**2. Read node values with `get_design_context`, never sample a screenshot.**
`get_design_context` returns declared fills, font family/weight/size, line
height, radii, padding and gaps. `get_screenshot` returns pixels. A review that
cites a colour without a node id behind it is citing a pixel.

**3. A composited colour is not a fill.** One Phase 4 agent sampled hues
206°/196°/175° off a rendered image, concluded that no design token matched, and
hand-rolled colours. Those were composited values — opacity, blur and blend over
a dark background. The raw fills matched `glow-blue` (207°), `glow-cyan` (191°)
and `glow-teal` (161°) exactly. "No token matches this colour" is a claim that
has to be checked against `@cennso/theme`'s tokens and the node's own fill, not
against an eyedropper.

**4. Never ship one theme's artwork into the other.** The design draws the hero
illustration twice — node `1:561` on the dark frame, node `1:4987` on the light
one — and the two exports are different bitmaps with differently lit slabs. One
file used for both themes is a defect even when it "looks fine" in the theme it
was drawn for. Same for the logo (`fill: #ffffff` dark, `#185f99` light) and the
nav CTA (outlined dark, filled light): these are two designs, not one design
with an opacity change.

**5. Start from the frames, not from the existing page.** Phase 4 started from
the current site and adjusted what looked wrong, so everything that already
looked plausible was never compared to anything. Open the frame, list what it
declares, and check the page against that list — including the parts you did not
change.

## The review that now enforces this

`yarn design:review` renders the built site and diffs it, node by node, against
frames fetched from Figma **at review time**. It is a local review, not a CI
gate: the `.claude/hooks/design-fidelity-review.sh` Stop hook asks for it once a
session when the branch changed `pages/`, `components/`, `styles/`,
`public/assets/` or `tailwind.config.js`.

There is deliberately no committed copy of the design any more. There was one —
six `get_design_context` dumps and a generated inventory — and it made rule 5
worse rather than better: CI compared the site against a month-old design and
stayed green while the design moved. `design/figma/` now holds the route ↔ frame
mapping and the exclusion list, and nothing else.

See `.claude/cennso-web/design-fidelity-gate.md` for what the review covers and
what it still does not. A finding it already catches does not need repeating in
review; a finding on a route the mapping does not cover (`/about`, `/blog`,
anything outside `/`, `/success-stories`, `/contact`), or in a frame nobody
fetched this time, absolutely does.
