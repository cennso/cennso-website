# expected-findings: unvalidated

**This list has not been checked against a real review.** Phase 1's
`cennso-web` plugin (installed from a `cennso/design-system` marketplace) does
not exist yet — `cennso/design-system` has no `plugins/` directory and no
`.claude-plugin/marketplace.json` at the time this file was written. Steps 1,
3, 4, 5, and 11 of this task's brief (install the plugin, run
`/cennso-web:review-change`, triage its output, file defects, re-run) could
not be executed. Nothing below has ever been run through the harness it
describes.

This is written down anyway, before the harness exists, because it becomes
the acceptance list for whenever phase 1 ships: run `/cennso-web:review-change`
against the diff described below, compare its output to this list, and only
then triage per-reviewer as the original brief's Step 4 describes (a table of
what it found vs. what it should have found, verdict `correct` / `missed` /
`false positive` / `buried`).

## The known content of the diff (Tasks 1-7), and the reviewer each item belongs to

1. `Button`'s old `useArrow` has no equivalent in `@cennso/ui` and was
   dropped — `upstream-gap`, advisory. See `.claude/upstream-gaps.md`.

2. The old `Button`'s `tertiary` variant maps to `secondary` because
   `@cennso/ui`'s `buttonVariants` has no `tertiary` — `ds-fidelity` should
   accept this; flagging it as a hand-rolled/unexplained control would be a
   false positive.

3. `content.content.industrySelectLabel`
   (`pages/success-stories/index.tsx:127`) reads a nested `content:` block
   inside `content/success-stories-page.yaml` (which also has a top-level
   `page:` block) through a prop that is itself named `content`. **Verified
   against the current tree: this resolves correctly to `"Industries"` at
   HEAD** — it is not currently reproducing an empty `sr-only` label. It is
   listed here because the double-`content.content` naming is exactly the
   fragile shape `content-rules.md` warns about (a YAML key rename or a
   `getStaticProps` shape change desyncs silently, no type error, just an
   empty string at runtime) — belongs to `a11y-gate` or `content-rules` if a
   future diff reintroduces the break, not to this one.

4. `SuccessStoryItem.tsx:55-60` replaced a literal `<h3>` with
   `Typography variant="h3"` — `a11y-gate` should say, in `unverifiable`, that
   it cannot confirm the rendered heading level from source. This is also the
   specific case `check-semantic-structure.py`'s card-heading special case
   (`SuccessStoryItem.tsx`/`BlogPostItem.tsx`/`SolutionItem.tsx`, which
   requires a literal `<h[4-6]>`) goes blind on, on top of the page-level
   heading-hierarchy blindness already documented in
   `docs/accessibility-checkers-and-cennso-ui.md`.

5. Two `BreadcrumbList` JSON-LD blocks are emitted per page that renders
   `PageHeader`: one from `components/SEO.tsx:85`, one from
   `components/PageHeader.tsx:28-36` (`next-seo`'s `BreadcrumbJsonLd`) —
   `seo-gate`. This is pre-existing and outside the diff, so `unverifiable`
   is the honest place for it, and silence on it is the review's failure, not
   the correct behavior.

6. `@heroicons/react` and `react-icons` were removed and `lucide-react` was
   the (already-present) survivor — `perf-gate` should treat this as a
   *reduction* in dependencies, not "a new dependency added." A finding that
   treats `lucide-react` as new/risky is a false positive and a phase 1
   defect, not something to route around in a profile.

7. `daisyui` was removed and its two utility classes (`mask`,
   `mask-hexagon-2`) were inlined as a local `addUtilities` plugin in
   `tailwind.config.js:125-134` — nothing should fire. `ds-fidelity` names
   the hexagon frame as brand shape, not a library gap.

8. The Equinix image
   (`public/assets/success-stories/cennso-on-equinix-metal/equinix-story-pic.webp`)
   is 166,710 bytes (162.8KB) against the 100KB budget — `perf-gate` may
   well raise it; correct to raise, correct not to block on, since it
   predates this diff and the file itself is untouched by it.

## What "correct" looks like when the harness exists

For each of the eight items, the harness run is `correct` if the matching
reviewer surfaces it, in the right bucket (`unverifiable` for items 3-5
specifically, since none of those are confirmable from source alone), and
does *not* bury it among unrelated low-value findings. A `buried` verdict —
the real finding present but ranked below a dozen trivial ones — is treated
as failing, per the phase 1 `content-rules` agent's own stated risk that
noise gets a reviewer muted within a week.
