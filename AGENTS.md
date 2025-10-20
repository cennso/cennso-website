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
yarn check:all             # Run all checks (format, lint, a11y, build)
```

## Important Notes

- Hot reload doesn't work for content changes (manual browser refresh needed)
- OG images auto-generated during build via `scripts/generate-og-images`
- All author/testimonial references use ID lookups from `authors.yaml`
- **All UI text MUST come from YAML files in `/content` directory** - no hardcoded strings in components
- File paths in content must be absolute from `/public` (e.g., `/assets/image.png`)
- Link checking configured in `lychee.toml` and runs with dedicated GitHub Action workflow

## Quality Standards

All code changes must comply with constitution principles:

- **Type Safety**: No `any` types without justification, explicit return types on exported functions
- **Accessibility**: WCAG 2.1 AA compliance
  - Contrast ratios: ≥4.5:1 for normal text, ≥3:1 for large text (validated by `yarn a11y:contrast`)
  - Text alternatives: All images, icons, buttons have alt/aria-label (validated by `yarn a11y:text-alternatives`)
  - Keyboard navigation, ARIA, semantic HTML
- **Performance**: Lighthouse score ≥100, bundles <500KB, SSG only (no client-side content fetching)
- **Components**: Feature-based organization, one primary component per file, props explicitly typed
- **Quality Gates**: `yarn check:all` must pass (format, lint, a11y, build)

**Before committing, run:**

```bash
yarn check:all
```

## AI Agent Instructions

**CRITICAL**: AI agents working on this codebase MUST always run `yarn check:all` at the end of any changes to ensure all quality gates pass. This includes format, lint, accessibility, and build validation. Never complete a task without running this final validation step.
