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
> - **`check-input-assistance.py`** newly fails (exit 1) on the probe, and this
>   is a genuine false positive on markup that WCAG does not require to change,
>   not a real defect the checker happened to stumble onto. Its
>   `<(input|select|textarea)[^>]*>` pattern (`check-input-assistance.py:72`,
>   case-insensitive) matches any tag whose name *starts with* `select`
>   followed by any non-`>` characters, so it coincidentally also matches
>   `Select.Trigger`, `Select.Content`, and `Select.Item` — none of which are
>   form controls in their own right. Verified directly: re-running the same
>   `find_labelled_inputs` logic against the probe markup with a correct
>   `aria-label` added to both `<Select>` and `<Select.Trigger>` still reports
>   `<Select.Content>` and `<Select.Item>` as "missing associated label" — the
>   false positive survives the fix. This checker also already carries a
>   hand-written workaround for its own unreliability: line 60 hard-codes
>   `if str(p).endswith('components/common/Select.tsx'): continue`, skipping
>   this repository's own pre-existing `Select` primitive outright.

**Consequence for review:** on a page built from `@cennso/ui`, a green
`yarn a11y` is **not** evidence about heading hierarchy, form labelling, or
ARIA roles. Any finding in those three areas belongs in `unverifiable`, not
waved through because the script passed. And a `check-input-assistance.py`
failure on `Select`/`Select.Trigger`/`Select.Content`/`Select.Item` is expected
noise, tracked in `docs/accessibility-checkers-and-cennso-ui.md`, not a new
defect to report per-page.

The full verdict table (all fifteen checkers, ten `unchanged`) lives in
`docs/accessibility-checkers-and-cennso-ui.md`; that document's own conclusion
is the **named fallback** (re-point the five affected checkers at rendered
`.next/server/pages/**/*.html`), not "proceed" — phase 4 does not start until
that re-pointing work ships.

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
