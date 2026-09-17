# upstream-gap: cennso-website

## Where a declined gap is recorded

When this repository needs something `@cennso/ui` (or `@cennso/theme`, or the
design system's docs) does not provide, and the decision is to work around it
here rather than fix it upstream, write one line to `.claude/upstream-gaps.md`
(repository root, not under `.claude/cennso-web/`), formatted:

```
YYYY-MM-DD | <component or area> | <the gap in one clause>
```

One line per gap, append-only. This file is the input a future upstream
contribution or a `cennso/design-system` issue draws from — it is a log, not
a profile, and a reviewer should not propose adding *rules* here the way it
would in `ds-fidelity.md`; it should propose *entries* when it finds a new
gap, and check existing entries before re-reporting one that's already known.

## Seeded with what this phase found

```
2026-09-17 | Button | no arrow affordance — old `useArrow` prop (rendered a trailing `>`) has no `@cennso/ui` equivalent and was dropped, not replaced
2026-09-17 | CONSUMING.md | documents only App Router wiring — no guidance for where `ThemeProvider`/global CSS/font setup goes in a Pages Router app's `_app.tsx`/`_document.tsx`
2026-09-17 | bundle size | `@cennso/ui@0.1.2`'s ESM barrel is a single pre-bundled module with no per-component subpaths, so no bundler can tree-shake it — every route pays for the whole library (~1.15MB vs. the ~275KB pre-adoption First Load JS); fix already open upstream as `cennso/design-system` PR #22 (measured to bring routes to ~483KB)
```

The third entry is not "declined" in the same sense as the first two — it is
already being worked on upstream — but it is seeded here because a reviewer
must not propose a consumer-side workaround for it (there is none: the
package exports no per-component subpaths) and must not report it as caused
by whichever diff happens to add the next `@cennso/ui` import.
