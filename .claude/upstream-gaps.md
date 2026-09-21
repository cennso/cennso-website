# Upstream gaps

One line per gap, appended in the order found. Format:
`YYYY-MM-DD | <component or area> | <the gap in one clause>`

See `.claude/cennso-web/upstream-gap.md` for how a reviewer should use this
file.

2026-09-17 | Button | no arrow affordance — old `useArrow` prop (rendered a trailing `>`) has no `@cennso/ui` equivalent and was dropped, not replaced
2026-09-17 | CONSUMING.md | documents only App Router wiring — no guidance for where `ThemeProvider`/global CSS/font setup goes in a Pages Router app's `_app.tsx`/`_document.tsx`
2026-09-17 | bundle size | `@cennso/ui@0.1.2`'s ESM barrel is a single pre-bundled module with no per-component subpaths, so no bundler can tree-shake it — every route pays for the whole library (~1.15MB vs. the ~275KB pre-adoption First Load JS); fix already open upstream as `cennso/design-system` PR #22 (measured to bring routes to ~483KB)
