# Upstream gaps

One line per gap, appended in the order found. Format:
`YYYY-MM-DD | <component or area> | <the gap in one clause>`

See `.claude/cennso-web/upstream-gap.md` for how a reviewer should use this
file.

2026-09-17 | Button | no arrow affordance — old `useArrow` prop (rendered a trailing `>`) has no `@cennso/ui` equivalent and was dropped, not replaced
2026-09-17 | CONSUMING.md | documents only App Router wiring — no guidance for where `ThemeProvider`/global CSS/font setup goes in a Pages Router app's `_app.tsx`/`_document.tsx`
2026-09-17 | bundle size | `@cennso/ui@0.1.2`'s ESM barrel is a single pre-bundled module with no per-component subpaths, so no bundler can tree-shake it — every route pays for the whole library (~1.15MB vs. the ~275KB pre-adoption First Load JS); fix already open upstream as `cennso/design-system` PR #22 (measured to bring routes to ~483KB)
2026-09-21 | ThemeProvider | `readInitialSetting` returns `defaultSetting` during SSR (no window, so localStorage is unreadable) but the stored choice on the client's first render, so any UI keyed off `setting` — `ThemeToggle`'s icon — throws a hydration mismatch (React #418) on reload for any reader whose stored theme differs from the default; the `data-theme` attribute itself is unaffected because `themeScript` sets it pre-paint
2026-09-22 | StatCard | no stat/metric card in the registry, composed locally from Card + Typography
2026-09-22 | LogoBand | no logo wall or marquee in the registry, composed locally
2026-09-22 | Card | `cardVariants` (`gap-(--card-spacing)`, `py-(--card-spacing)`, `px-(--card-spacing)`, `[--card-spacing:--spacing(5)]`) is authored in Tailwind 4's arbitrary-property-shorthand syntax; this app is pinned to Tailwind 3 (`tailwind.config.js`), which has no `prop-(--var)` parsing, so every one of those classes compiles to no CSS at all - Card renders with zero padding/gap sitewide until a call site restates the same value as plain utilities (`gap-5 py-5`, `px-5` on Header/Content/Footer)
2026-09-22 | Card | RESOLVED, not an upstream gap after all: the 2026-09-22 Card entry above was a consumer version lag, not something `@cennso/ui` owed us. This app now runs Tailwind 4, so `gap-(--card-spacing)` / `py-(--card-spacing)` / `px-(--card-spacing)` compile as authored and the `gap-5 py-5` / `px-5` restatements on the home page have been removed
