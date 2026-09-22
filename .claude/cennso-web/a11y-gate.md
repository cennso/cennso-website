# a11y-gate: cennso-website

## The command

`yarn a11y` runs fifteen Python scripts chained with `&&` (`package.json:33`):
`a11y:contrast`, `a11y:text-alternatives`, `a11y:media`, `a11y:semantic`,
`a11y:distinguishable`, `a11y:keyboard`, `a11y:enough-time`, `a11y:seizures`,
`a11y:navigable`, `a11y:input-modalities`, `a11y:readable`, `a11y:predictable`,
`a11y:input-assistance`, `a11y:compatible`, `a11y:autocomplete`. The first
failure aborts the rest — when diagnosing, run the individual `yarn a11y:*`
scripts instead of `yarn a11y` so a later checker's result isn't hidden.

## What the checkers can no longer see, on `@cennso/ui` markup

The rows below are copied verbatim from `docs/accessibility-checkers-and-cennso-ui.md`
("What goes blind" and "What would produce a false positive"), established
against a throwaway probe component built from `Card`, `Typography variant="h2"`,
`Select` with a `placeholder`, and `next/image` aliased to `NextImage`:

> - **`check-text-alternatives.py`**: alt-text presence is no longer verified on
>   any image whose JSX tag name isn't exactly `Image` — including `next/image`
>   imported under any alias, which `@cennso/ui` usage forces the moment a page
>   also imports `@cennso/ui`'s own `Image`.
> - **`check-semantic-structure.py`**: heading hierarchy (first-heading-is-h1,
>   no-skipped-levels, no-multiple-h1s) is no longer verified on any `pages/*.tsx`
>   file that uses `Typography variant="hN"` instead of a literal `<h1>`–`<h6>`
>   tag. (Not demonstrated by this probe, since the function only runs on pages
>   and a few named components, but confirmed by reading `check_heading_hierarchy`
>   at line 125 — the page-level heading pattern matches only literal heading
>   tags.)
> - **`check-navigable.py`**: heading- and label-text descriptiveness (SC 2.4.6 —
>   catching empty or placeholder text like `"Heading"`/`"TODO"`) is no longer
>   verified on any `Typography`-based heading or any form control labeled via a
>   `placeholder` prop instead of a `<label>` element.
> - **`check-compatible.py`**: all six of its WCAG 4.1.2/4.1.3 checks (accessible
>   names on interactive elements, ARIA-attribute/role consistency, ARIA role
>   hierarchy, `aria-hidden`-on-focusable, nested interactive elements, live-region
>   markup for dynamic status changes) are no longer verified on any file whose
>   entire markup is `@cennso/ui` components — the file is skipped outright by
>   the lowercase-tag guard at line 482.
>
> - **`check-input-assistance.py`** — **fixed upstream, see status below.** It
>   used to newly fail (exit 1) on `Select`-shaped markup: its
>   `<(input|select|textarea)[^>]*>` pattern (`check-input-assistance.py:72`)
>   was case-insensitive, so it coincidentally also matched `Select.Trigger`,
>   `Select.Content`, and `Select.Item` — none of which are form controls in
>   their own right.

**Status, corrected against this repository's actual `scripts/check-input-assistance.py`
at phase 4 (verified 2026-09-22, commit range `b833cf7..c0d7430`):** the false
positive above is **gone**. `re.IGNORECASE` was removed from the three
element-name patterns (confirmed by reading `check-input-assistance.py:64-77`
directly — the comment there now reads "NO re.IGNORECASE on element names...
case IS the distinction"), and the hand-written `components/common/Select.tsx`
skip that only ever worked around the bug was removed with it. Do not report
a `check-input-assistance.py` failure on `Select`/`Select.Trigger`/
`Select.Content`/`Select.Item` as expected noise any more — if it fires on
those today, that is new information, not the old known issue.

**Consequence for review:** on a page built from `@cennso/ui`, a green
`yarn a11y` is still **not** evidence about heading hierarchy, alt text, form
labelling, or ARIA roles — those four checkers (`check-text-alternatives`,
`check-semantic-structure`, `check-navigable`, `check-compatible`) are still
blind, for the reasons above. Any finding in those areas belongs in
`unverifiable`, not waved through because the script passed.

The full verdict table (all fifteen checkers) lives in
`docs/accessibility-checkers-and-cennso-ui.md`. **That document's conclusion
is "proceed," not the named fallback** — its own "Decision" section is marked
"Superseded" and states plainly that the `check-input-assistance.py` false
positive was fixed and merged before phase 4 started, so phase 4 does **not**
wait on the four-checker re-pointing work. (An earlier version of this
profile said phase 4 does not start until that re-pointing ships; that was
true when written and is stale now — confirmed by reading the doc's own
"Superseded" banner, not assumed.) Re-pointing the four blind checkers at
rendered HTML is still worth doing, just no longer blocking.

## The three source-level contracts that fail a build

- `check-semantic-structure.py:223-262` requires the literal `<main`, `<nav`,
  and `<footer` substrings in `Layout.tsx`, `Navigation.tsx`, and `Footer.tsx`
  respectively (`is_layout`/`is_navigation`/`is_footer` defined at lines 223,
  224, 225; the corresponding `<nav`/`<footer` branches at lines 241 and 253).
- `check-navigable.py:104-114` requires `Layout.tsx` to contain either
  `href="#main"`/`href="#content"` or `<main ` (the `has_skip_link` /
  `has_main_landmark` check).
- `check-text-alternatives.py:116` and `:128` are filename-keyed contract
  tests: any file named `Avatar.tsx` must contain the exact alt template
  literal `` alt={`${author.name}...${author.position}...${author.company}`} ``,
  and any file whose name contains `MenuT` (e.g. `MenuToggle.tsx`) must contain
  the literal string `'Open navigation menu'`.

Renaming or restructuring any of `Layout.tsx`, `Navigation.tsx`, `Footer.tsx`,
`Avatar.tsx`, or a `MenuT*.tsx` file is a critical finding — it fails the
build via a hard-coded filename/substring match, independent of whether the
resulting markup is actually accessible.

## Reading `Typography variant="hN"` yourself, not just what the scripts see

The scripts are blind to `Typography variant="hN"` (above), but an agent
reading the diff's source text is not — it can often do better than
`unverifiable` if it looks. `Typography` supports a `render={<h2 />}` (etc.)
prop that puts the literal heading tag in the JSX source: `<Typography
variant="h2" render={<h2 />}>` is as verifiable as a bare `<h2>`, because the
tag name is right there in the diff. Treat `variant="hN"` **with** a matching
`render={<hN />}` as verified, the same as a literal tag. Only
`variant="hN"` **without** a `render` prop is the genuinely unverifiable
case — its rendered tag depends on `@cennso/ui`'s default mapping, which
isn't visible from source. This is not hypothetical: it's the shape of the
one heading in the 4.0 home page (`pages/index.tsx`) that has no `render`
prop — a visually-hidden `<Typography variant="h2" className="sr-only">`
landmark heading for the stats grid — sitting next to three sibling headings
in the same diff that all do pass `render={<hN />}` and are verifiable.

## Default theme is dark; check both, not just the one you're used to

Since `27fe485`, the site ships a light/dark theme (`ThemeProvider`
`defaultSetting="dark"` in `_app.tsx`, `themeScript({ defaultSetting: 'dark'
})` in `_document.tsx`) — a first-time visitor with no stored preference
sees **dark**, not light, regardless of OS setting. Any contrast or
"looks right" claim needs to hold in both palettes, and dark is the one a
first visit actually renders — don't default your own mental check to light
just because that was this site's only palette before phase 4.

## `yarn a11y:contrast` proves nothing

`scripts/check-contrast.py` reads no source file at all. It walks a
hand-copied `COLORS` dict (`check-contrast.py:55`) and a hand-maintained
`TEST_CASES` list (`check-contrast.py:68`), iterated in a fixed loop in
`main()`. Nothing about a diff — adding, removing, or restyling a component —
can make this script fail or pass differently, because it never opens a
component file. A green result here is not evidence of anything. Lighthouse's
`color-contrast` audit is the authority for this WCAG criterion. Say this
explicitly in review: a reviewer that cites a green `yarn a11y:contrast` as
support for a contrast claim is worse than one that says it could not tell.
