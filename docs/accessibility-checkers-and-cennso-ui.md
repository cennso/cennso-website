# Accessibility checkers vs. `@cennso/ui` markup

The fifteen `yarn a11y:*` scripts under `scripts/` are regular expressions over
`.tsx` source. This document records what happens to each of them once markup
comes from `@cennso/ui` instead of raw HTML tags, established with a throwaway
probe component (`components/CennsoProbe.tsx`, deleted before this commit) that
used `Card`, `Typography variant="h2"`, `Select` with a `placeholder`, and
`next/image` aliased to `NextImage` (forced, because `@cennso/ui` exports its
own `Image`).

At baseline (before the probe existed) all fifteen checkers exit 0. With the
probe present:

| script | baseline exit | probe exit | output byte-identical? |
|---|---|---|---|
| check-contrast.py | 0 | 0 | yes |
| check-text-alternatives.py | 0 | 0 | no (file count only) |
| check-media-accessibility.py | 0 | 0 | no (file count only) |
| check-semantic-structure.py | 0 | 0 | no (file count only) |
| check-distinguishable.py | 0 | 0 | no (file count only) |
| check-keyboard.py | 0 | 0 | no (file count only) |
| check-enough-time.py | 0 | 0 | no (file count only) |
| check-seizures.py | 0 | 0 | no (file count only) |
| check-navigable.py | 0 | 0 | no (file count only) |
| check-input-modalities.py | 0 | 0 | no (file count only) |
| check-readable.py | 0 | 0 | no (file count only) |
| check-predictable.py | 0 | 0 | no (file count only) |
| check-input-assistance.py | 0 | **1** | no — 4 new issues |
| check-compatible.py | 0 | 0 | no (file count only) |
| check-autocomplete.py | 0 | 0 | no (file count only) |

Fourteen of fifteen kept exiting 0. Only `check-contrast.py` produced a
byte-for-byte identical file (it doesn't even count files the way the others
do — its output is unrelated to per-file JSX content). Every other checker's
output changed by exactly one in a "files scanned/checked" counter, which
means the file *was* opened and counted — the question the table below
answers is what each checker did, or failed to do, with what it found inside.

## Per-checker verdict

| script | what it reads | verdict | evidence | what it would take to fix |
|---|---|---|---|---|
| `check-contrast.py` | Not JSX tags at all — a hardcoded `COLORS` dict and `TEST_CASES` list of named component/color pairs (`check-contrast.py:55-96`), iterated in a fixed loop in `main()` (`check-contrast.py:109`: `for name, fg_key, bg_key, _, is_large in TEST_CASES:`). There is no file-scanning function in this script. | unchanged | Output byte-identical with the probe present (no file-count line even changed, because there is no file count — this script never reads `.tsx` source). Nothing in the probe (a `Card`/`Typography`/`Select`/`NextImage` tree) can affect a script that never looks at component files. | N/A |
| `check-text-alternatives.py` | `.tsx` source, regex `<Image\s+(?![^>]*\balt=)` at line 74 for missing `alt` on Next's `Image`, plus a separate `<img\s+...>` pattern for raw `<img>`. | **blind** | Probe file counted (60→61) but "Files passed" also went 60→61 — zero engagement with the file's one image. The regex requires the literal tag name `Image`; the probe imports `next/image` as `NextImage` (forced, since `@cennso/ui` exports its own `Image`), so `<NextImage` never matches `<Image\s`. The probe's image happens to have a correct `alt`, so no false negative was demonstrated here — but the checker would have said nothing even if `alt` were missing, which is the finding. Alt-text presence is no longer verified on any image imported under a name other than exactly `Image`. | Either require the alias be `Image` (fragile, breaks the moment two libraries both export `Image`), or re-point the check at rendered HTML (`.next/server/pages/**/*.html`), where every `<img>` DOM node — regardless of the component name that produced it — has a real, matchable tag. |
| `check-media-accessibility.py` | `.tsx` source, literal `<video>`/`<audio>`/`<iframe>` tags — e.g. `video_pattern = r'<video[^>]*>.*?</video>'` at `check-media-accessibility.py:71-72`. | unchanged | Probe file counted (60→61), no findings either way. The probe contains no media elements at all, so this is a correct vacuous pass, not blindness — `@cennso/ui` doesn't change this checker's exposure since it has nothing analogous to check here. | N/A |
| `check-semantic-structure.py` | `.tsx` source. Heading hierarchy for regular pages (`check_heading_hierarchy`, lines 66–160) is gated to run only on `pages/*.tsx` and matches only literal `<h[1-6]>` or `<GradientHeader ... as="hN">` at line 125 (`heading_pattern = r'<(h[1-6]|GradientHeader[^>]*as="h([1-6])")[^>]*>'`). A separate, narrower branch of the same function special-cases `SuccessStoryItem.tsx`/`BlogPostItem.tsx`/`SolutionItem.tsx` and matches only literal `<h[4-6]>` at line 99 — a different, stricter pattern for a different rule (card headings must be h2/h3), not evidence for the general Typography-blindness claim. Form-label checks (`check_form_labels`, line ~314) only run on files whose *path* contains `Form`. Landmark checks (`check_landmarks`, lines 223–262) only run on `Layout.tsx`/`Navigation.tsx`/`Footer.tsx`/`CookiesBanner.tsx` and match literal `<main`, `<nav`, `<footer`. | **blind** (confirmed by reading, not fully exercised by this probe) | The probe's `Typography variant="h2"` produced no heading-hierarchy finding, but that's because `CennsoProbe.tsx` is none of the file types this function inspects (not a page, not one of the three special-cased item components) — the probe alone doesn't prove the risk. Reading line 125 shows the *only* way the page-level branch ever sees a heading is the literal string `<h1>`–`<h6>` or `GradientHeader as="hN"`. The moment Task 7 converts a real page's `<h1>…<h6>` to `Typography variant="hN"`, `check_heading_hierarchy`'s `headings` list is permanently empty for that file and every one of its checks (first-heading-is-h1, skipped-levels, multiple-h1s) silently stops firing. Separately: `check_landmarks` (223–262) requires the literal `<main`, `<nav`, `<footer` in `Layout.tsx`/`Navigation.tsx`/`Footer.tsx` — **latent**, not triggered by this probe, but it will fire as a false positive the moment those three files' root elements are replaced with a `@cennso/ui` layout primitive that renders the same landmark role without the literal tag name. | For heading hierarchy: re-point at rendered HTML, where a `Typography variant="h2"` still becomes a real `<h2>` in the DOM (assuming `@cennso/ui` renders semantic tags, which needs separate confirmation before Task 7). For landmarks: same fix, or explicitly assert on `role="main"`/`role="navigation"`/`role="contentinfo"` as an accepted equivalent to the literal tag, whichever `@cennso/ui`'s Layout/Nav/Footer primitives actually emit. |
| `check-distinguishable.py` | `.tsx` source. `check_use_of_color` (lines 62–89) is dead code — it always `return violations` (empty) before ever running. `check_images_of_text` (line 121) matches literal `<img[^>]+alt=...>` for suspicious alt text. | unchanged | Probe file counted (89→90), no findings. `check_images_of_text` shares `check-text-alternatives`'s `NextImage`-aliasing blind spot in principle (its `<img` regex doesn't match `<NextImage` either), but it's a warning-level, best-effort heuristic already, and the probe's `alt` text contains none of its suspicious words, so no behavior change is demonstrable here. | Same rendered-HTML fix as `check-text-alternatives.py` would close this incidental gap too. |
| `check-keyboard.py` | `.tsx` source, `onClick`-without-`onKeyDown` on non-semantic elements: `if re.search(r'<(div\|span)[^>]*\bonClick\s*=', line_stripped):` at `check-keyboard.py:90`. | unchanged | Probe file counted (110→111), no findings. The probe's source contains no raw `<div>`/`<span>` with `onClick` — `Select`'s keyboard handling lives inside `@cennso/ui`, outside any static source checker's reach regardless of markup style. This is a pre-existing limitation of static analysis, not new blindness introduced by the design system. | N/A (inherent to static source scanning) |
| `check-enough-time.py` | `.tsx` source, `setTimeout`/`setInterval` patterns: `r'\b(setTimeout\|setInterval)\s*\('` at `check-enough-time.py:89`. | unchanged | Probe file counted (110→111), no findings. Nothing in the probe resembles a timer or auto-refresh. | N/A |
| `check-seizures.py` | `.tsx` source, flash/animation-name patterns: `r'\b(blink\|flash\|strobe)\b'` at `check-seizures.py:74`. | unchanged | Probe file counted (111→112), no findings. Nothing in the probe animates or names an animation. | N/A |
| `check-navigable.py` | `.tsx` source. `check_headings_labels` (SC 2.4.6, lines 354–438) matches literal `<h([1-6])>...</h\1>` (line 372) for empty/placeholder heading text, and literal `<label>...</label>` (line 419) for empty/placeholder label text. `check_page_titled` (line ~155) requires the literal `<SEO\s` in every file under `pages/`. | **blind** (heading/label descriptiveness) with a **latent false positive** (`<SEO `) | Probe file counted (58→59), 0 issues before and after — true blindness, not a vacuous pass: the probe's heading and (absent) label are real content this function is built to inspect, and it inspected neither. `Typography variant="h2"` never matches `<h([1-6])`, so an empty or placeholder (`"Heading"`, `"TODO"`, etc.) Typography heading would go completely undetected. The `Select` has no `<label>` element at all (it uses a `placeholder` prop), so the label-descriptiveness check never even runs on it. Separately, `check_page_titled`'s `<SEO\s` requirement (lines 161–170) is **latent** — not triggered by a `components/` file — but it fires the moment any page's metadata call is restructured to not literally start with `<SEO `. | Re-point at rendered HTML: a `<title>` and heading text are both present in the DOM regardless of what authored them. This is also the fix for the `<SEO ` false positive, since `validate-seo.py:115` already reads `.next/server/pages/**/*.html` for the equivalent check and is unaffected by this whole class of problem. |
| `check-input-modalities.py` | `.tsx` source. `check_label_in_name` (SC 2.5.3, lines 199–270) matches literal `<[Bb]utton...aria-label=...>` and `<input...aria-label=...>` paired with a `<label for=...>`. | unchanged | Probe file counted (58→59), no findings. The regex requires the literal substring `utton` or `input`, not a loose case-insensitive prefix the way `check-input-assistance.py`'s does — `Select`/`Select.Trigger` doesn't collide with it. No aria-label is present on anything in the probe either, so the check has nothing to compare even if the tag matched. | N/A for this probe; would need re-verification for a `Button`/`Input` consumed from `@cennso/ui` with a mismatched visible/aria label, which is a different scenario than this task tested. |
| `check-readable.py` | `.tsx` source, but `check_language_of_page` (SC 3.1.1) is gated to `_document.tsx` only: `if '_document.tsx' not in str(file_path): return issues` at `check-readable.py:96`. | unchanged | Probe file counted (60→61), no findings. This checker is gated to a single file (`_document.tsx`) unrelated to component markup; `@cennso/ui` adoption in `components/` or `pages/` doesn't touch its scanning surface at all. | N/A |
| `check-predictable.py` | `.tsx` source, on-focus context-change patterns such as `r'onFocus\s*=\s*\{[^}]*(?:window\.location\|router\.push\|navigate\()'` at `check-predictable.py:78-83`, plus on-input and navigation-consistency checks elsewhere in the file. | unchanged | File count changed (127→128), no new issues. Nothing in the probe matches its on-focus/on-input/nav-consistency heuristics. | N/A |
| `check-input-assistance.py` | `.tsx` source, `find_labelled_inputs` (lines 65–72), regex `<(input|select|textarea)[^>]*>` case-insensitive, checking for `id`+matching `<label for>`, `aria-label`, or `aria-labelledby`. | **false positive** | Newly exit 1, 4 new "SC 3.3.2 — Form control missing associated label" issues at `CennsoProbe.tsx:32` (`<Select items={options}>`), `:33` (`<Select.Trigger placeholder={selectLabel} />`), `:34` (`<Select.Content>`), `:36` (`<Select.Item key={option.value} value={option.value}>`). This is *not* the checker understanding `@cennso/ui`'s `Select` — `re.IGNORECASE` on the pattern `<select[^>]*>` matches any tag whose name starts with `select` case-insensitively followed by any non-`>` characters, so it coincidentally also matches `Select.Trigger`, `Select.Content`, and `Select.Item`, none of which are form controls in their own right (`Select.Content` is a popup wrapper, `Select.Item` is a single option). Only one real form control exists in the probe (the `Select` as a whole) and it genuinely does lack an accessible name (`placeholder` alone is not one, matching the checker's own stated purpose) — but the checker reports the same defect four times, three of them against elements that are not controls at all, and would just as easily miss the identical defect on a component renamed `Dropdown` or `Combobox`, or falsely fire on an unrelated component whose name happens to start with "select" (e.g., a `SelectedItemsList`). | This is the one checker that both under- and over-fires by accident and needs a real fix, not a tolerance adjustment: teach it the compound-component shape (only the root/trigger element carries the accessible name) or, better, re-point at rendered HTML where the ARIA combobox pattern's actual accessible-name computation can be tested against the DOM instead of guessed from tag-name substrings. |
| `check-compatible.py` | `.tsx` source; bails out entirely at line 482 (`if not re.search(r'<[a-z]', content): return []`) for any file with no lowercase JSX tag. Also skips `components/common/*` outright (line 91). | **blind** | File count changed (127→128), zero new issues — but that's because the file was never actually inspected: verified directly (Step 5) — `sed -n '478,486p' scripts/check-compatible.py` shows the exact guard, and `python3 -c "print(bool(re.search(r'<[a-z]', open('components/CennsoProbe.tsx').read())))"` printed `False`. All six of this checker's WCAG 4.1.2 (Name, Role, Value)/4.1.3 (Status Messages) checks — missing accessible names on interactive elements, ARIA-attribute/role mismatches, ARIA role-hierarchy violations, `aria-hidden` on focusable elements, nested interactive elements, missing live-region markup for dynamic content — are skipped for **any** file whose entire markup is `@cennso/ui` components, silently, with no output indicating the file was skipped rather than passed. | Drop the lowercase-tag heuristic (it exists to dodge TS generics like `<ButtonProps>`, which a smarter check — requiring a following space/`>`/`/` as line 88's `interactive_pattern` already does — handles without needing to skip the whole file) or re-point at rendered HTML, where every element is a real lowercase DOM tag regardless of source markup. |
| `check-autocomplete.py` | `.tsx` source, the attribute itself rather than a tag name: `pattern = re.compile(r'auto[Cc]omplete\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)` at `check-autocomplete.py:125`. | unchanged | File count changed (112→113), no findings. The probe has no `autoComplete`/`autocomplete` attribute anywhere; this checker validates attribute *values*, not which tag carries the attribute, so it isn't sensitive to `Select` vs `select` at all. | N/A |

## What is already immune

`validate-seo.py:115`, `validate-structured-data.py:241`, `check-internal-links.py:20`,
and `validate-og-images.py:39-41` all parse `.next/server/pages/**/*.html` — the
build's rendered output — rather than `.tsx` source. They see the actual DOM a
browser or screen reader would see, so it makes no difference to them whether
that DOM was produced by a literal `<h1>` or by `Typography variant="h1"`, by
`<img>` or by `@cennso/ui`'s `Image`. This isn't incidental: it is the working
precedent, already in this repository and already passing in CI, for the
fallback below.

## What goes blind

Four checkers stopped asserting things they used to assert, without ever
failing or printing that anything was skipped:

- **`check-text-alternatives.py`**: alt-text presence is no longer verified on
  any image whose JSX tag name isn't exactly `Image` — including `next/image`
  imported under any alias, which `@cennso/ui` usage forces the moment a page
  also imports `@cennso/ui`'s own `Image`.
- **`check-semantic-structure.py`**: heading hierarchy (first-heading-is-h1,
  no-skipped-levels, no-multiple-h1s) is no longer verified on any `pages/*.tsx`
  file that uses `Typography variant="hN"` instead of a literal `<h1>`–`<h6>`
  tag. (Not demonstrated by this probe, since the function only runs on pages
  and a few named components, but confirmed by reading `check_heading_hierarchy`
  at line 125 — the page-level heading pattern matches only literal heading
  tags.)
- **`check-navigable.py`**: heading- and label-text descriptiveness (SC 2.4.6 —
  catching empty or placeholder text like `"Heading"`/`"TODO"`) is no longer
  verified on any `Typography`-based heading or any form control labeled via a
  `placeholder` prop instead of a `<label>` element.
- **`check-compatible.py`**: all six of its WCAG 4.1.2/4.1.3 checks (accessible
  names on interactive elements, ARIA-attribute/role consistency, ARIA role
  hierarchy, `aria-hidden`-on-focusable, nested interactive elements, live-region
  markup for dynamic status changes) are no longer verified on any file whose
  entire markup is `@cennso/ui` components — the file is skipped outright by
  the lowercase-tag guard at line 482.

## What would produce a false positive

- **`check-input-assistance.py`** newly fails (exit 1) on the probe, and this
  is a genuine false positive on markup that WCAG does not require to change,
  not a real defect the checker happened to stumble onto. Its
  `<(input|select|textarea)[^>]*>` pattern (`check-input-assistance.py:72`,
  case-insensitive) matches any tag whose name *starts with* `select`
  followed by any non-`>` characters, so it coincidentally also matches
  `Select.Trigger`, `Select.Content`, and `Select.Item` — none of which are
  form controls in their own right (`Select.Content` is a popup wrapper,
  `Select.Item` is a single option). Verified directly: re-running the same
  `find_labelled_inputs` logic against the probe markup with a correct
  `aria-label` added to both `<Select>` and `<Select.Trigger>` (the actual
  fix for the one real defect) still reports `<Select.Content>` and
  `<Select.Item>` as "missing associated label" — the false positive survives
  the fix. It is unreliable in both directions: it will fire on non-form
  sub-elements of any component whose name happens to start with
  "select"/"input"/"textarea" even when correctly labeled, and it will miss
  the identical real defect the moment a consuming team renames the import
  (e.g. `import { Select as Dropdown }`). This checker also already carries a
  hand-written workaround for its own unreliability: line 60 hard-codes
  `if str(p).endswith('components/common/Select.tsx'): continue`, skipping
  this repository's own pre-existing `Select` primitive outright rather than
  fixing the detection logic — evidence that this checker's approach to
  `Select`-shaped components was already known to be broken before
  `@cennso/ui` was introduced.
- **Latent — not triggered by this probe, but named because Task 7 and phase 4
  will trigger it:**
  - `check-semantic-structure.py:223-262` requires the literal `<main`, `<nav`,
    `<footer` in `Layout.tsx`, `Navigation.tsx`, and `Footer.tsx` respectively.
    Neither is triggered by a component in `components/`; it fires the moment
    one of those three files' root element is replaced by a `@cennso/ui`
    layout primitive that renders the same landmark role without the literal
    tag name.
  - `check-navigable.py:161-170` requires the literal string `<SEO ` in every
    file under `pages/`. It fires the moment a page's metadata call is
    restructured — for example, if `@cennso/ui` or the migration introduces a
    wrapper around the existing `SEO` component, or renames/relocates the call.

## Decision

**The answer is bad: the named fallback applies. Task 7 still runs; phase 4
waits for the re-pointing work.**

The brief's Step 7 gives exactly two outcomes. Proceed only holds if checkers
go blind but *none* produces a false positive on correct markup. That
condition is false: `check-input-assistance.py` produces a false positive on
markup that is, or can trivially be made, fully correct — verified above by
adding a real `aria-label` to the `Select` and its `Trigger` and observing the
checker still fail on `Select.Content` and `Select.Item`. A Level A criterion
(SC 3.3.2) failing on compliant markup is precisely the case the brief calls
"bad," so the named fallback applies, not the "proceed" branch.

**The fallback: re-point the affected checkers at rendered HTML.** Following
the pattern `validate-seo.py:115` already uses to read
`.next/server/pages/**/*.html` instead of `.tsx` source, the following five
checkers need to move to reading rendered output rather than have their regex
sets taught `@cennso/ui`'s vocabulary (a repair that would need to be redone
for every future component the library ships, and would still only be reading
source, never the actual accessible-name computation a screen reader
performs):

- `check-input-assistance.py` — the false positive that forces this decision.
  Re-pointing lets it test the ARIA combobox pattern's real accessible-name
  computation against the DOM instead of guessing from tag-name substrings,
  which fixes both the over-firing on `Select.Content`/`Select.Item` and the
  brittleness that would let the identical real defect through on a
  differently-named or differently-aliased component.
- `check-text-alternatives.py` — recovers alt-text verification for any image
  component regardless of its JSX tag name (`Image`, `NextImage`, or any other
  alias forced by import collisions).
- `check-semantic-structure.py` — recovers heading-hierarchy verification for
  any page using `Typography variant="hN"` instead of literal `<h1>`–`<h6>`,
  and landmark verification for `Layout.tsx`/`Navigation.tsx`/`Footer.tsx`
  regardless of what tag or component renders the `<main>`/`<nav>`/`<footer>`
  role.
- `check-navigable.py` — recovers heading/label-descriptiveness verification
  (SC 2.4.6) for `Typography`-based headings and `placeholder`-only form
  controls, and removes the latent `<SEO ` literal-string requirement that
  would otherwise false-positive the moment a page's metadata call is
  restructured.
- `check-compatible.py` — removes the `if not re.search(r'<[a-z]', content):
  return []` kill switch (line 482) entirely, since every element in rendered
  HTML is a real lowercase DOM tag regardless of what authored it, recovering
  all six of its WCAG 4.1.2/4.1.3 checks for `@cennso/ui`-only files.

Per the constitution, this document *proposes* that fallback and stops there —
nothing under `scripts/` is edited in this task, and no checker is weakened or
disabled to make a failure go away. Turning the proposal into a change is,
in the brief's own words, "its own spec and its own pull request," scoped to
these five scripts and the shared pattern already proven by `validate-seo.py`.

**Task 7 still runs.** One page, converted, is exactly the fixture the
re-pointing work needs: it exercises `Typography` headings, real images, and
(if the page has one) a real `@cennso/ui` `Select`, against real rendered
output. Task 7's author gives any `Select` it uses a real accessible name
regardless of this checker's state, since that is a genuine WCAG requirement
independent of tooling — but `yarn check:all` will still need to pass, and
`check-input-assistance.py` will still misfire on `Select.Content`/`Select.Item`
after that fix ships, so Task 7 will hit this exact false positive and needs
to be told, in advance, that it is expected and tracked by this document
rather than something to route around locally.

**Phase 4 waits for the re-pointing work.** The remaining ten checkers marked
`unchanged` in the per-checker table above — contrast, media, distinguishable,
keyboard, enough-time, seizures, input-modalities, readable, predictable, and
autocomplete — stay as they are; none of their assertions apply to the markup
this migration changes, and re-pointing them at rendered HTML is unnecessary
work. That accounts for all fifteen: ten unchanged, four blind
(text-alternatives, semantic-structure, navigable, compatible), and one false
positive (input-assistance). Phase 4's
page-by-page conversion does not start until the five checkers above are
re-pointed, because phase 4 is exactly the work that would otherwise repeat
this same false positive at scale, once per page, on every `Select` (and every
other compound component the blind checkers can no longer see) the migration
touches.
