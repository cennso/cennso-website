# perf-gate: cennso-website

## Budgets and their source

- Images: WebP format, under 100KB (102400 bytes) —
  `scripts/check-image-optimization.py:24` (`MAX_SIZE_BYTES = 100 * 1024`),
  required by `.specify/memory/constitution.md:259`.
- No single page bundle over 500KB — `.specify/memory/constitution.md:241`.
  **This budget is currently failing for every route** because of the
  `@cennso/ui` barrel defect below; judge new findings against that baseline,
  not against 500KB, until the upstream fix lands.
- OG images under 300KB — `.specify/memory/constitution.md:255`, validated by
  `yarn validate:ogimages`.
- Lighthouse at or above 95 on all four categories, audited on `/`,
  `/success-stories`, and `/contact` (`lighthouse.urls.js`). This is a
  CI-against-the-Vercel-preview gate (`.github/workflows/lighthouse.yml`), not
  a local one — see "Lighthouse baseline" below before treating a local run as
  a regression.

## Repository-specific rules

1. **Every `next/image` needs a `sizes` prop.** `scripts/check-mobile-performance.py`
   gates its entire image audit on the literal import string `from 'next/image'`
   (`check-mobile-performance.py:38`). A page or component that imports
   `@cennso/ui`'s own `Image` instead is not being checked by this script at
   all — that belongs in `unverifiable`, not "passes perf:mobile".

2. **The one icon set is `lucide-react`.** `@heroicons/react` and `react-icons`
   were removed in phase 2, `@material-tailwind/react` and `daisyui` with them;
   reintroducing any of the four is a finding. Removing an icon library (as
   phase 2 did, converging on `lucide-react`) is a *reduction*, and flagging a
   dependency removal as "a new dependency added" or as risk is a false
   positive — a phase 1 defect, not something to route around here.

   One trademark-driven exception: `lucide-react@1.x` ships no brand marks —
   `Linkedin`, `Youtube`, `Twitter`, and `Github` are all `undefined` exports,
   excluded on trademark grounds. `lib/social-links.tsx` therefore hand-authors
   two inline SVGs (`LinkedInIcon`, `YouTubeIcon`) instead of importing them.
   Do not suggest "import `Linkedin` from `lucide-react`" as a fix for this
   file — that import does not exist and would break the build.

3. **The bundle-size defect is upstream, not this diff's fault.** Every route
   is ~1.15MB instead of the pre-`@cennso/ui` ~275KB First Load JS, because
   `@cennso/ui@0.1.2` ships a single pre-bundled ESM barrel that no bundler can
   tree-shake — importing one component pulls all of them
   (`AGENTS.md:199-206`). A fix is open upstream as `cennso/design-system`
   PR #22, measured to bring routes back to ~483KB. Do not report the ~1.15MB
   figure as caused by a diff that merely adds one more `@cennso/ui` import —
   the number was already ~1.15MB before that import, and there is no
   consumer-side workaround: the package exports no per-component subpaths to
   import from instead.

4. **The Equinix image is a known pre-existing failure.**
   `public/assets/success-stories/cennso-on-equinix-metal/equinix-story-pic.webp`
   is 166,710 bytes (162.8KB) against the 100KB (102,400-byte) limit, and
   `check-image-optimization.py`'s `SIZE_CHECK_EXCLUSIONS` set is empty
   (`check-image-optimization.py:46`) — nothing exempts it. Report it once,
   never as this change's fault, unless the diff itself touches that file.

5. **`components/Markdown/components/Quote.tsx`'s first `<Image>` (line 35,
   the decorative quote-mark SVG) has no `sizes` prop** — its sibling at line
   48/55 does (`sizes="92px"`). This is masked in `yarn check:all` because
   `perf` is `perf:images && perf:mobile` (`package.json:37`): `perf:images`
   fails first on the Equinix image and `perf:mobile` never runs. Report the
   missing `sizes` once as pre-existing, not as new.

## Lighthouse baseline

The ≥95 gate runs against a Vercel preview, not a local `yarn dev` server.
Measured on `upstream/main` on the same machine: performance 0.90-0.93,
accessibility 0.96-0.98, best practices 0.92, SEO 1.00.
`errors-in-console` fails on a 404 for `/_vercel/insights/script.js` (the
Vercel Analytics beacon, present only on Vercel), and `valid-source-maps`
fails on `_app`'s missing map — both environmental, not code defects. A local
sub-95 run is not evidence of a regression on its own; compare against a
baseline measured the same way (same machine, same "local" caveats) on
`upstream/main`, not against the raw 95 threshold.
