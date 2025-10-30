# AI Agent Context

**Constitution**: See `.specify/memory/constitution.md` for non-negotiable standards (code quality, accessibility, performance, testing requirements)

## Stack

- Next.js 14 (Pages Router, not App Router)
- React 18
- TypeScript (strict mode enabled)
- TailwindCSS + DaisyUI
- MDX for content (blog posts, success stories)
- YAML for structured content (authors, testimonials, jobs, etc.)

## Project Structure

```
/pages          - Next.js pages (use getStaticProps pattern)
/components     - React components (organized by feature/common)
/content        - All content (YAML configs + MDX files)
/lib            - Utilities (markdown parsing, navigation, etc.)
/contexts       - React contexts for passing data
/public/assets  - Static assets (images, avatars, etc.)
/docs           - Content creation guides
```

## Key Patterns

### Pages

- All pages use `getStaticProps` for SSG
- Navigation created via `createNavigation()` from `lib/navigation.ts`
- SEO handled with `next-seo` and custom `<SEO>` component

### Adding Content

- **Author**: Add to `content/authors.yaml` with unique ID
- **Blog post**: Create `content/blog-posts/filename.mdx`, reference author IDs in frontmatter
- **UI Text**: All user interface text (form labels, status messages, select options) MUST be defined in appropriate YAML files in `/content` directory, never hardcoded in components
- **Assets**: Place in `/public/assets/` folder, reference as `/assets/filename.ext`

See `/docs` folder for detailed guides.

## Commands

```bash
yarn dev                   # Local dev server (port 3000)
yarn build                 # Production build (runs OG image generation first)
yarn lint                  # ESLint check
yarn lint:fix              # autofix ESLint check
yarn format                # Prettier check
yarn format:fix            # Auto-fix Prettier formatting issues
yarn a11y                  # Run all accessibility checks
yarn perf:images           # Validate all images are WebP and under 150KB
yarn perf:images:optimize  # Automatically optimize images to WebP format
yarn lighthouse            # Run Lighthouse audit (requires dev server running)
yarn check:all             # Run all checks (format, lint, a11y, build)
```

## Lighthouse Automation

### Local Testing

Run in parallel:

- **Terminal 1**: `yarn dev` (starts dev server on localhost:3000)
- **Terminal 2**: `yarn lighthouse` (runs lighthouse-ci with .lighthouserc.js config, enforces 100% scores)

The `yarn lighthouse` command uses **lighthouse-ci** (`@lhci/cli`) which reads `.lighthouserc.js` configuration:

- Audits 4 categories: Performance, Accessibility, Best Practices, SEO
- Enforces 100% minimum score on each category
- Fails with exit code 1 if any category < 100%
- Saves detailed results to `.lighthouse/` directory

### Quality Requirements

All PRs must pass Lighthouse audits with **100% scores** on:

- **Performance** - Page speed, optimization
- **Accessibility** - WCAG 2.1 AA compliance
- **Best Practices** - Security, standards compliance
- **SEO** - Search engine optimization

Configuration in `.lighthouserc.js` enforces 100% minimum scores locally and on CI. When running `yarn lighthouse` locally, it will fail with exit code 1 if scores don't reach 100%, providing detailed failure information for each category.

### GitHub Actions Integration

Lighthouse workflow (`.github/workflows/lighthouse.yml`) automatically:

1. Waits for Vercel deployment preview to be ready
2. Runs audits against the Vercel deployment URL
3. Posts results to PR
4. Blocks merge if any category < 100%

## Important Notes

- Hot reload doesn't work for content changes (manual browser refresh needed)
- OG images auto-generated during build via `scripts/generate-og-images`
- All author/testimonial references use ID lookups from `authors.yaml`
- **All UI text MUST come from YAML files in `/content` directory** - no hardcoded strings in components
- File paths in content must be absolute from `/public` (e.g., `/assets/image.png`)
- Link checking configured in `lychee.toml` and runs with dedicated GitHub Action workflow
- **Images MUST be optimized**: WebP format, maximum 150KB per file (validated by `yarn perf:images`)
- **Next.js Image components**: ALL `<Image>` components MUST have `sizes` prop
  - Tells Next.js which image size to serve based on viewport (prevents oversized downloads)
  - Without `sizes`, Next.js may serve 828px image when displaying at 550px (wasteful bandwidth)
  - `next.config.js` configures deviceSizes/imageSizes, but components need `sizes` prop to use them
  - See Performance section above for `sizes` prop examples

## Quality Standards

All code changes must comply with constitution principles:

- **Type Safety**: No `any` types without justification, explicit return types on exported functions
- **Accessibility**: WCAG 2.1 AA compliance
  - Contrast ratios: ≥4.5:1 for normal text, ≥3:1 for large text (validated by `yarn a11y:contrast`)
  - Text alternatives: All images, icons, buttons have alt/aria-label (validated by `yarn a11y:text-alternatives`)
  - Keyboard navigation, ARIA, semantic HTML
- **Performance**: **Lighthouse 100% on all categories** (Performance, Accessibility, Best Practices, SEO)
  - Bundles <500KB, SSG only (no client-side content fetching)
  - Images: WebP format, ≤150KB each (validated by `yarn perf:images`)
  - **Next.js Image `sizes` prop**: REQUIRED on all `<Image>` components for responsive optimization
    - Fixed size: `sizes="150px"` (avatars, icons)
    - Responsive: `sizes="(max-width: 768px) 100vw, 50vw"` (hero images)
    - Hidden on mobile: `sizes="(max-width: 768px) 0px, 45vw"` (blog cards)
- **Components**: Feature-based organization, one primary component per file, props explicitly typed
- **Quality Gates**: `yarn check:all` must pass (format, lint, a11y, images, build) + Lighthouse 100%

**Before committing, run:**

```bash
yarn check:all
```

Then verify locally with Lighthouse:

```bash
yarn dev          # Terminal 1
yarn lighthouse   # Terminal 2
```

## AI Agent Instructions

**CRITICAL**: AI agents working on this codebase MUST always run `yarn check:all` at the end of any changes to ensure all quality gates pass. This includes format, lint, accessibility, and build validation. Never complete a task without running this final validation step.
