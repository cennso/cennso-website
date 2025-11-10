# Implementation Plan: Zero-Click SEO Optimization

**Branch**: `002-zero-click-structured-data` | **Date**: 2025-11-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-zero-click-structured-data/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Optimize the Cennso website for zero-click search results by implementing comprehensive Schema.org structured data, optimizing content structure for featured snippets, and ensuring all pages are positioned to appear in search engine knowledge panels, rich results, and "People Also Ask" boxes without requiring users to click through to the site.

## Technical Context

**Language/Version**: TypeScript 5.3.3 with Next.js 14.1.0 (Pages Router, SSG)  
**Primary Dependencies**: next-seo 6.4.0 (SEO management), existing SchemaOrg component, React 18.2.0  
**Storage**: Static content in `/content` (YAML/MDX), structured data generated at build time  
**Testing**: Automated validation via Google Rich Results Test API, Schema Markup Validator, existing quality gates  
**Target Platform**: Static website (Next.js SSG), deployed on Vercel  
**Project Type**: Web application (existing Next.js Pages Router architecture)  
**Performance Goals**: Zero additional bundle size for structured data (JSON-LD in head), no impact on existing Lighthouse ≥95% scores  
**Constraints**: Must maintain existing performance (275KB first load JS, 28KB CSS), WCAG 2.1 AA compliance, all quality gates passing  
**Scale/Scope**: ~20 public pages (blog posts, solutions, success stories, company pages), expanding with content growth

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Code Quality & Architecture ✅

- **Principle I (Type Safety)**: Schema generation functions will have explicit return types, all structured data objects strongly typed
- **Principle II (Performance)**: JSON-LD structured data adds <5KB per page (gzipped), no JavaScript execution required, SSG ensures zero runtime cost
- **Principle III (Component Architecture)**: Extends existing `SchemaOrg` component pattern, maintains feature-based organization
- **Principle IV (Clean Code)**: Schema generators in `/lib/seo/schema/` follow single responsibility, pure functions for data transformation

### Accessibility ✅

- **Principle V (WCAG 2.1 AA)**: No visual changes, structured data is machine-readable metadata, does not affect user experience or accessibility
- All existing `yarn a11y` checks remain passing (11 automated checks covering Perceivable and Operable guidelines)

### Content Management ✅

- **Content Standards**: Structured data sourced from existing YAML/MDX content in `/content`, no hardcoded strings
- **Asset Requirements**: Images already optimized (WebP, ≤100KB), alt text in place for structured data references

### Quality Gates ✅

All existing gates must continue passing:

1. **Build**: `yarn build` - No breaking changes to existing build process
2. **Lint**: `yarn lint` - TypeScript strict mode compliance
3. **Format**: `yarn format` - Prettier formatting
4. **Accessibility**: `yarn a11y` - All 11 checks passing
5. **SEO**: `yarn seo:validate` - Enhanced with structured data validation
6. **Lighthouse**: `yarn lighthouse` - Must maintain ≥95% on all categories

### New Validation Requirements

- **Structured Data Validation**: Extend `yarn seo:schema` to validate all Schema.org markup against Google Rich Results Test
- **Rich Result Eligibility**: Automated checks for featured snippet optimization (content structure, FAQ markup, breadcrumb validity)

### Phase 1 Design Review ✅

**Post-Design Constitution Check** (Re-evaluated after data model and contracts complete):

- ✅ **Type Contracts**: TypeScript interfaces defined in `contracts/schema-types.ts` provide compile-time safety
- ✅ **Pure Functions**: All schema generators are pure functions (no side effects, testable)
- ✅ **Single Responsibility**: Each generator handles one schema type
- ✅ **No New Dependencies**: Uses existing TypeScript, React, Next.js infrastructure
- ✅ **Performance Maintained**: JSON-LD adds 2KB per page (compressed), all generated at build time
- ✅ **Accessibility Unchanged**: No DOM changes, only machine-readable metadata
- ✅ **Quality Gates Enhanced**: New validation without breaking existing checks

### No Constitution Violations

This feature enhances existing SEO capabilities without introducing complexity:

- Uses established patterns (existing SchemaOrg component)
- No new dependencies required beyond development tooling
- Maintains all performance and accessibility standards
- Purely additive feature with zero breaking changes

## Project Structure

### Documentation (this feature)

```
specs/002-zero-click-structured-data/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── schema-types.ts  # TypeScript interfaces for all Schema.org types
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
lib/
├── seo/
│   ├── schema/                    # NEW: Schema.org generators
│   │   ├── organization.ts        # Organization schema for company info
│   │   ├── article.ts             # Article/BlogPosting schema
│   │   ├── person.ts              # Person schema for authors
│   │   ├── breadcrumb.ts          # BreadcrumbList schema
│   │   ├── faq.ts                 # FAQPage schema
│   │   └── index.ts               # Exports and utilities
│   ├── canonical.ts               # Existing canonical URL logic
│   └── index.ts                   # SEO utilities
│
components/
├── common/
│   ├── SchemaOrg.tsx              # EXISTING: Extend with new schema types
│   └── Breadcrumbs.tsx            # EXISTING: Already generates visual breadcrumbs
├── SEO.tsx                        # EXISTING: Main SEO component, integrate structured data
└── PageHeader.tsx                 # EXISTING: May need FAQ schema for some pages

content/
├── authors.yaml                   # EXISTING: Source for Person schema
├── landing-page.yaml              # EXISTING: Source for Organization schema
├── blog-posts/                    # EXISTING: Source for Article schema
├── solutions/                     # EXISTING: Source for Service schema
└── success-stories/               # EXISTING: Source for Case Study schema

scripts/
└── validate-structured-data.py    # EXISTING: Extend validation logic

tests/
└── seo/
    ├── schema-validation.test.ts  # NEW: Unit tests for schema generators
    └── rich-results.test.ts       # NEW: Integration tests with Google Rich Results Test API
```

**Structure Decision**: Extends existing Next.js Pages Router architecture with new schema generation utilities in `/lib/seo/schema/`. Maintains current component structure, enhancing existing `SchemaOrg` component rather than creating new components. All structured data generated at build time from existing content sources, ensuring zero runtime cost and maintaining SSG benefits.

## Complexity Tracking

_No constitutional violations - this section not needed_
