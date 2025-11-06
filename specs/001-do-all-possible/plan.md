# Implementation Plan: Comprehensive SEO Optimization

**Branch**: `001-do-all-possible` | **Date**: 2025-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-do-all-possible/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement comprehensive SEO improvements across technical SEO foundation, structured data, meta tags, performance optimization, mobile responsiveness, content optimization, and analytics integration. Primary goal is to increase organic search traffic by 50% within 3 months while maintaining Lighthouse Performance scores ≥95% and achieving Core Web Vitals "Good" ratings across all pages.

**Technical Approach**: Leverage Next.js SSG capabilities with enhanced meta tags, implement schema.org structured data using JSON-LD, optimize existing images and performance metrics, add comprehensive Open Graph and Twitter Card metadata, enhance internal linking structure, and integrate Google Search Console for monitoring.

## Technical Context

**Language/Version**: TypeScript 5.3+ / Next.js 14.2.33 (Pages Router, not App Router)
**Primary Dependencies**: 
- React 18, next-seo (SEO meta tags), next-sitemap (sitemap generation)
- TailwindCSS 3.4+ + DaisyUI (optimized config)
- MDX (blog/content parsing), gray-matter (frontmatter), remark/rehype plugins

**Storage**: 
- Static content: YAML files (`content/*.yaml`) for structured data
- MDX files (`content/blog-posts/`, `content/success-stories/`) for articles
- File system as source of truth (no database)

**Testing**: 
- Playwright (E2E - not yet implemented)
- Vitest + React Testing Library (unit/component - not yet implemented)  
- Lighthouse CI (performance/a11y/SEO - active)
- Python validation scripts (accessibility, image optimization - active)

**Target Platform**: 
- Static Site Generation (SSG) deployed on Vercel
- Browser support: Modern evergreen browsers (Chrome, Firefox, Safari, Edge latest)
- Mobile-first responsive design (375px → 768px → 1024px+ breakpoints)

**Project Type**: Web application (Next.js SSG, no backend API)

**Performance Goals**: 
- Lighthouse Performance ≥95% (desktop and mobile)
- Core Web Vitals "Good": LCP < 2.5s, FID < 100ms, CLS < 0.1
- First Load JS ≤ 275KB (current baseline)
- Page load time: < 2s desktop, < 3s mobile (3G)

**Constraints**: 
- Static generation only (no SSR, no client-side data fetching for content)
- Image optimization: WebP format, ≤100KB per file
- Next.js Image `sizes` prop required on all `<Image>` components
- DaisyUI config: Only mask-hexagon-2 utility enabled
- Bundle size: No page chunk > 500KB
- CSS: ~28KB total (optimized from 33.5KB)
- Accessibility: WCAG 2.1 AA compliance (11 automated checks must pass)

**Scale/Scope**: 
- ~18 static pages (blog, success stories, solutions, jobs, marketing pages)
- 50+ functional requirements across 8 SEO categories
- 26 success criteria with 2-week to 6-month timelines
- Target: 10+ primary keywords ranking page 1 within 6 months

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Code Quality & Type Safety ✅ PASS

- TypeScript strict mode already enabled in `tsconfig.json`
- ESLint configuration active (`yarn lint`)
- Prettier formatting enforced (`yarn format`)
- SEO components will use explicit type annotations
- Structured data interfaces will be properly typed

**Action**: No violations. All new code will follow existing type safety standards.

### II. Component Architecture & Reusability ✅ PASS

- SEO component already exists (`components/SEO.tsx`)
- Will enhance existing component rather than create new ones
- Structured data will be added to existing page components
- No new architectural patterns needed

**Action**: Enhance existing `<SEO>` component with schema.org structured data props.

### III. User Experience Consistency ✅ PASS

- Will use existing `<SEO>` component pattern across all pages
- Navigation structure unchanged (no UX impact)
- TailwindCSS + DaisyUI already in use
- Responsive design already implemented

**Action**: Ensure consistent SEO metadata across all pages using centralized patterns.

### IV. Performance & Build Optimization ⚠️ ATTENTION REQUIRED

**Current State**:
- ✅ Lighthouse ≥95% requirement already enforced
- ✅ Images already optimized (WebP, ≤100KB)
- ✅ Next.js Image `sizes` prop requirement documented
- ✅ SSG-only architecture in place
- ✅ DaisyUI optimized configuration active

**SEO Impact Assessment**:
- Adding structured data (JSON-LD): ~2-5KB per page (minimal impact)
- Enhanced meta tags: <1KB per page (negligible)
- Sitemap.xml already generated (no change)
- Internal linking: No bundle size impact (SSG content)

**Lighthouse Score Protection**:
- Must maintain ≥95% Performance after adding structured data
- Schema.org JSON-LD is render-blocking but small (<5KB)
- Open Graph images already generated (no additional generation needed)

**Action Required**:
1. Measure Lighthouse scores before and after structured data implementation
2. If Performance drops below 95%, inline critical JSON-LD in `<head>`
3. Defer non-critical schema types to end of `<body>`
4. Run `yarn lighthouse` validation after each phase

### V. Accessibility Standards (WCAG 2.1 AA) ✅ PASS

- SEO improvements enhance accessibility (better page titles, semantic structure)
- Breadcrumb navigation improves WCAG 2.4 (Navigable) compliance
- Alt text on images serves both SEO and a11y
- Semantic HTML5 structure aids both search engines and screen readers

**Synergies**:
- Schema.org structured data + semantic HTML = better screen reader experience
- Descriptive page titles benefit both SEO and WCAG 2.4.2 (Page Titled)
- Image alt text serves WCAG 1.1.1 (Text Alternatives) and Google Image Search

**Action**: All `yarn a11y` checks must continue to pass (11 automated validations).

### Content Management Standards ✅ PASS

- UI text externalization: SEO metadata will be stored in YAML or page-level config
- No hardcoded strings in components
- Asset paths follow `/assets/` convention
- Link validity checked via `lychee.toml`

**Action**: Store reusable SEO templates in `siteMetadata.js` and page-specific overrides in frontmatter/YAML.

### Quality Gates - Enhanced for SEO ✅ PASS

**Existing gates remain**:
- ✅ `yarn build` (no errors)
- ✅ `yarn lint` (ESLint)
- ✅ `yarn format` (Prettier)
- ✅ TypeScript compilation
- ✅ `yarn a11y` (11 WCAG 2.1 AA checks)
- ✅ `yarn lighthouse` (≥95% on all categories)

**New SEO-specific validations to add**:
1. **Structured Data Validation**: Google Rich Results Test API integration
2. **Meta Tag Completeness**: Verify all pages have title, description, OG tags
3. **Sitemap Validation**: Ensure sitemap.xml contains all public pages
4. **Internal Link Audit**: Detect broken internal links before deployment

**Action**: Add SEO-specific validation scripts to `package.json` and CI/CD.

### Summary: Constitution Compliance ✅ APPROVED

**No violations detected**. SEO improvements align with all constitution principles:

- Type safety maintained through TypeScript interfaces for schema.org types
- Component reusability enhanced via centralized SEO component patterns  
- User experience consistency through uniform meta tag implementation
- Performance preserved via careful JSON-LD optimization (<5KB impact)
- Accessibility improved through semantic structure and descriptive content
- Content management standards followed for metadata externalization
- Quality gates enhanced with SEO-specific validations

**Decision**: Proceed to Phase 0 (Research) without constitution amendments.

## Project Structure

### Documentation (this feature)

```
specs/001-do-all-possible/
├── spec.md              # Feature specification (completed)
├── checklists/
│   └── requirements.md  # Spec quality checklist (completed)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── structured-data-schemas.json  # Schema.org type definitions
│   └── meta-tag-templates.json       # Reusable meta tag patterns
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root - Next.js Pages Router structure)

```
/
├── components/
│   ├── SEO.tsx                    # [ENHANCE] Add structured data support
│   ├── common/
│   │   └── SchemaOrg.tsx          # [NEW] JSON-LD structured data wrapper
│   └── Breadcrumbs.tsx            # [EXISTING] Already implements BreadcrumbList schema
│
├── lib/
│   ├── seo/                       # [NEW] SEO utilities
│   │   ├── structuredData.ts      # Schema.org builders (Organization, Article, etc.)
│   │   ├── metaTags.ts            # Open Graph, Twitter Card generators
│   │   ├── breadcrumbs.ts         # BreadcrumbList schema generator
│   │   └── canonical.ts           # Canonical URL resolver
│   └── navigation.ts              # [EXISTING] Already used for nav structure
│
├── pages/
│   ├── _app.tsx                   # [EXISTING] Global wrapper
│   ├── _document.tsx              # [ENHANCE] Add global schema.org Organization
│   ├── index.tsx                  # [ENHANCE] Homepage structured data
│   ├── about.tsx                  # [ENHANCE] About page SEO
│   ├── contact.tsx                # [ENHANCE] LocalBusiness schema
│   ├── blog/
│   │   ├── index.tsx              # [ENHANCE] Blog listing SEO
│   │   └── [blog-post].tsx        # [ENHANCE] Article schema + enhanced meta
│   ├── success-stories/
│   │   ├── index.tsx              # [ENHANCE] Success stories listing
│   │   └── [success-story].tsx    # [ENHANCE] Case study schema
│   ├── jobs/
│   │   ├── index.tsx              # [ENHANCE] Jobs listing
│   │   └── [job].tsx              # [ENHANCE] JobPosting schema
│   └── solutions/
│       ├── index.tsx              # [ENHANCE] Solutions listing
│       └── [solution].tsx         # [ENHANCE] Service/Product schema
│
├── content/
│   ├── seo-config.yaml            # [NEW] Centralized SEO configuration
│   ├── authors.yaml               # [EXISTING] Author data (for Article schema)
│   ├── blog-posts/                # [EXISTING] MDX blog content
│   ├── success-stories/           # [EXISTING] MDX success story content
│   └── jobs/                      # [EXISTING] YAML job listings
│
├── public/
│   ├── robots.txt                 # [ENHANCE] Review and optimize directives
│   ├── sitemap.xml                # [EXISTING] Auto-generated by next-sitemap
│   └── assets/                    # [EXISTING] Optimized images (WebP, ≤100KB)
│
├── scripts/
│   ├── validate-seo.py            # [NEW] SEO metadata completeness check
│   ├── validate-structured-data.py # [NEW] Schema.org validation
│   └── check-internal-links.py    # [NEW] Internal link audit
│
├── siteMetadata.js                # [ENHANCE] Add schema.org Organization base data
├── next-sitemap.config.js         # [EXISTING] Sitemap generation config
├── next.config.js                 # [REVIEW] Ensure redirects preserve SEO value
└── package.json                   # [ENHANCE] Add SEO validation scripts
```

**Structure Decision**: 

Existing Next.js Pages Router structure is ideal for SEO implementation. Key decisions:

1. **Component Enhancement over Creation**: Enhance existing `<SEO>` component rather than creating new architecture
2. **Centralized SEO Utilities**: Create `/lib/seo/` for reusable schema builders and meta tag generators
3. **Content-Driven Configuration**: Store SEO templates in `/content/seo-config.yaml` following existing content management patterns
4. **Validation Scripts in Python**: Follow existing accessibility validation pattern for SEO checks
5. **Schema.org in JSON-LD**: Use JSON-LD format (preferred by Google) embedded in `<script type="application/ld+json">` tags

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

**Status**: No constitution violations detected. This section intentionally left empty.

All SEO improvements align with existing architectural patterns and quality standards. No justification required.

---

## Phase 0: Research ✅ COMPLETE

**Status**: All unknowns resolved. See `research.md` for full details.

**10 Research Decisions Made**:

1. **Structured Data Format**: JSON-LD (Google's preference over Microdata/RDFa)
2. **OG Image Generation**: Enhance existing script with format validation
3. **Sitemap Configuration**: Enhance next-sitemap with SEO priorities
4. **Canonical URL Resolution**: Environment-based with NEXT_PUBLIC_SITE_URL
5. **Internal Linking Strategy**: Contextual link suggestion system
6. **robots.txt Enhancement**: Add sitemap references and crawl optimization
7. **Core Web Vitals Monitoring**: Google Search Console + Vercel Analytics
8. **Meta Tag Management**: Three-tier (frontmatter > YAML > defaults)
9. **Schema.org Types**: 7 types (Organization, Article, JobPosting, LocalBusiness, BreadcrumbList, Service, nested types)
10. **Validation Strategy**: Three-tier (pre-commit, PR CI/CD, post-deployment)

**Output**: `research.md` (24KB, 10 decisions with rationale and alternatives)

---

## Phase 1: Design & Contracts ✅ COMPLETE

### Data Model

**Status**: 9 entities defined with TypeScript interfaces, validation rules, relationships, and state transitions.

**Entities**:
1. SEOMetadata (meta tags, OG, Twitter Card)
2. OrganizationSchema (company-level structured data)
3. ArticleSchema (blog posts, success stories)
4. JobPostingSchema (career opportunities)
5. LocalBusinessSchema (contact page, local SEO)
6. BreadcrumbListSchema (navigation hierarchy)
7. ServiceSchema (solution pages)
8. SitemapEntry (sitemap.xml configuration)
9. SEOValidationResult (validation tracking)

**Output**: `data-model.md` (18KB, complete TypeScript interfaces with validation constraints)

### Contracts

**Status**: JSON contracts created for structured data schemas and meta tag templates.

**Files Created**:
1. `contracts/structured-data-schemas.json`:
   - JSON Schema definitions for all 7 schema.org types
   - Nested type definitions (Person, PostalAddress, ContactPoint, etc.)
   - Validation rules (required fields, format constraints, patterns)
   - 500+ lines of comprehensive type definitions

2. `contracts/meta-tag-templates.json`:
   - Title templates (6 patterns: default, home, blog, solution, job, success story)
   - Description templates (5 patterns with length constraints)
   - Open Graph templates (3 types: article, website, profile)
   - Twitter Card templates (2 types: summary_large_image, summary)
   - Robots meta templates (4 directives: default, noindex, nofollow, none)
   - Canonical URL templates (production, preview)
   - Validation rules (length limits, URL formats, image dimensions)
   - Fallback values (default OG image, site name, locale)

**Output**: 2 JSON contract files (structured-data-schemas.json, meta-tag-templates.json)

### Quickstart Guide

**Status**: Developer onboarding documentation created with comprehensive examples and troubleshooting.

**Sections**:
1. Overview (architecture pattern, requirements)
2. Prerequisites (development setup, contract files)
3. Adding SEO to New Pages (step-by-step with code examples)
4. Creating Structured Data (schema type selection, JSON-LD examples)
5. Meta Tags Best Practices (title, description, OG images guidelines)
6. Running SEO Validation (local, CI/CD, post-deployment)
7. Troubleshooting (8 common issues with solutions)
8. Quick Reference (checklist, commands, resources)

**Output**: `quickstart.md` (14KB, comprehensive developer guide)

### Agent Context Update

**Status**: GitHub Copilot instructions updated with SEO patterns and technologies.

**Changes**:
- Added TypeScript 5.3+ / Next.js 14.2.33 to active technologies
- Created agent-specific context file from template
- Documented SEO implementation patterns for AI assistance

**Output**: `.github/copilot-instructions.md` updated

---

## Phase 2: Tasks

**Status**: NOT PART OF /speckit.plan COMMAND

The `/speckit.plan` command ends after Phase 1 (Design & Contracts). To generate implementation tasks, run:

```bash
/speckit.tasks
```

This will create `tasks.md` with prioritized development tasks based on the completed plan.

---

## Plan Summary ✅ PHASE 1 COMPLETE

**✅ Deliverables Completed**:
1. Technical Context defined (Next.js, TypeScript, constraints)
2. Constitution Check passed (no violations)
3. Project Structure documented (Next.js file tree with enhancement markers)
4. Research completed (10 decisions resolving technical unknowns)
5. Data Model created (9 entities with TypeScript interfaces)
6. Contracts generated (structured-data-schemas.json, meta-tag-templates.json)
7. Quickstart Guide written (comprehensive developer onboarding)
8. Agent Context updated (GitHub Copilot instructions)

**📊 Metrics**:
- 50 functional requirements across 8 SEO categories
- 26 success criteria with 2-week to 6-month timelines
- 10 research decisions documented with rationale
- 9 entity data models with validation rules
- 7 schema.org types fully defined in JSON Schema format
- 6 meta tag template patterns for different page types
- 500+ lines of JSON contract specifications
- 0 constitution violations

**🎯 Next Steps**:
1. Run `/speckit.tasks` to generate implementation tasks
2. Break down tasks into development sprints
3. Implement Phase 1 (Technical SEO Foundation)
4. Validate with `yarn check:all` + `yarn lighthouse`
5. Deploy and monitor Core Web Vitals

**⚠️ Critical Reminders**:
- Must maintain Lighthouse ≥95% on all categories (Performance, Accessibility, Best Practices, SEO)
- Run both desktop AND mobile Lighthouse audits (both must pass ≥95%)
- All images must be WebP format, ≤100KB
- All `<Image>` components require `sizes` prop
- Run `yarn check:all` before every commit
- Validate structured data with Google Rich Results Test
- Monitor Core Web Vitals in Google Search Console + Vercel Analytics

**📚 Documentation**:
- Full specification: `specs/001-do-all-possible/spec.md`
- Research decisions: `specs/001-do-all-possible/research.md`
- Data models: `specs/001-do-all-possible/data-model.md`
- Developer guide: `specs/001-do-all-possible/quickstart.md`
- Contracts: `specs/001-do-all-possible/contracts/*.json`

---

**Plan Status**: ✅ READY FOR TASK GENERATION (`/speckit.tasks`)
````
