# Implementation Plan: LLM-Friendly Data Exposure

**Branch**: `003-generate-llm-files` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-generate-llm-files/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Expose website content in LLM-friendly formats (llms.txt standard) through two endpoints: `/llms.txt` (basic summary) and `/llms-full.txt` (comprehensive data). Files are generated during build from existing YAML/MDX content sources, validated for quality, and served as static text files. Footer links provide discoverability. Technical approach uses Node.js/TypeScript generation scripts integrated into existing build pipeline, Python validation scripts following established patterns, and Next.js static file serving.

## Technical Context

**Language/Version**: TypeScript 5.x (generation scripts), Python 3.11 (validation scripts), Next.js 14 (serving)  
**Primary Dependencies**:

- Existing: `lib/mdx.ts` (blog post parsing), `lib/markdown.ts` (content utilities), `js-yaml` (YAML parsing)
- New: None required (use existing utilities)

**Storage**: Static files in `/public` directory (llms.txt, llms-full.txt) - served by Next.js static file handler  
**Testing**:

- Generation: TypeScript compilation, manual verification of output format
- Validation: Python script with pytest framework (follows `scripts/validate-*.py` pattern)
- Integration: `yarn build` must complete successfully with LLM files generated

**Target Platform**: Next.js static site (Node.js build environment, browser serving)  
**Project Type**: Web application (existing Next.js site, adding build-time generation + static serving)  
**Performance Goals**:

- Generation: Complete in <30 seconds during build
- Serving: Response time <1 second for both files
- File sizes: <5MB (llms.txt), <20MB (llms-full.txt)

**Constraints**:

- Must integrate seamlessly with existing `yarn build` pipeline
- Must use existing content parsing utilities (no duplicate parsing logic)
- Must follow established validation script patterns (Python in `/scripts` directory)
- Must not impact build time significantly (<30s addition)
- UTF-8 encoding for international character support
- Plain text format (not JSON/XML) for broad LLM compatibility

**Scale/Scope**:

- Content sources: ~20-30 blog posts, ~5-10 solutions, ~5-10 success stories, ~5-10 job postings, ~10 pages, ~5-10 team members
- Total content volume: Estimated 500KB-2MB uncompressed text
- Regeneration frequency: Every deployment (on `yarn build`)
- Expected traffic: Moderate (LLM crawlers + occasional developer access)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Code Quality & Type Safety

- ✅ **TypeScript Strict Mode**: Generation scripts will use TypeScript with strict mode
- ✅ **Type Annotations**: All exported functions will have explicit return types
- ✅ **ESLint/Prettier**: Will follow existing code style and linting rules
- ✅ **No `any` Types**: Will use proper typing for content parsing results

### II. Component Architecture & Reusability

- ✅ **Footer Integration**: Footer component will be updated following existing patterns
- ✅ **Utility Organization**: Generation logic in `/scripts` directory (not `/lib` - build-time only)
- ✅ **No Business Logic in Components**: Footer only renders links, no generation logic

### III. User Experience Consistency

- ✅ **Design System**: Footer links will use TailwindCSS + DaisyUI button/link styles
- ✅ **Responsive Design**: Footer links visible and accessible on all breakpoints
- ✅ **SEO Metadata**: N/A (static text files don't need SEO components)
- ✅ **Navigation**: Consistent with existing footer link patterns

### IV. Performance & Build Optimization

- ✅ **Static Generation**: LLM files generated at build time (SSG pattern)
- ✅ **No Client-Side Fetching**: Files served as static assets from `/public`
- ✅ **Build Time**: Target <30s for generation (acceptable overhead)
- ✅ **File Size**: Optimized text format, <5MB and <20MB limits enforced
- ✅ **Lighthouse**: No impact on Lighthouse scores (static text files)
- ✅ **Image Optimization**: N/A (text-only feature)

### V. Accessibility Standards (WCAG 2.1 AA)

- ✅ **Footer Links**: Will have descriptive text ("LLM Data - Basic", "LLM Data - Full")
- ✅ **Keyboard Accessible**: Links follow standard `<a>` element patterns
- ✅ **Screen Reader**: Descriptive link text provides context
- ✅ **Focus Visible**: Will use existing focus styles from design system
- ✅ **Color Contrast**: Will use existing footer link colors (already validated)

### VI. SEO Standards

- ⚠️ **Special Case**: LLM text files are NOT HTML pages, don't need title/description meta tags
- ✅ **Discoverability**: Footer links provide human-discoverable access
- ✅ **Robots.txt**: LLM files should be crawlable (no disallow needed)
- ✅ **Sitemap**: Consider adding llms.txt and llms-full.txt to sitemap.xml for crawler discovery

### Content Management Standards

- ✅ **Content Sources**: Will use existing `/content` directory YAML/MDX files
- ✅ **No Hardcoded Text**: Footer link labels will come from YAML configuration
- ✅ **Asset Paths**: Will use absolute URLs in generated files
- ✅ **Link Validity**: Generated internal references will be validated

### Quality Gates

- ✅ **Build**: Generation integrated into `yarn build` (must complete without errors)
- ✅ **Lint**: TypeScript generation scripts will pass `yarn lint`
- ✅ **Format**: Scripts will follow Prettier formatting
- ✅ **Type Check**: Generation scripts will compile without TypeScript errors
- ✅ **Custom Validation**: New `yarn validate:llm` command will validate generated files
- ✅ **CI/CD**: Validation will run in GitHub Actions workflow

**GATE RESULT**: ✅ **PASS** - No constitution violations. Feature aligns with all core principles.

## Project Structure

### Documentation (this feature)

```
specs/003-generate-llm-files/
├── spec.md              # Feature specification (COMPLETE)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── llms-txt-format.txt  # llms.txt file format specification
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
# Web application (Next.js) - existing structure, new additions marked with [NEW]

scripts/
├── generate-llm-data/              [NEW] Generation scripts
│   ├── index.ts                   [NEW] Main orchestration script
│   ├── generators/                [NEW] Content generators
│   │   ├── basic.ts              [NEW] Generate llms.txt (basic summary)
│   │   ├── full.ts               [NEW] Generate llms-full.txt (comprehensive)
│   │   └── shared.ts             [NEW] Shared utilities (header, formatting)
│   └── tsconfig.json             [NEW] TypeScript config for generation scripts
├── validate-llm-data.py           [NEW] Python validation script
├── requirements.txt               [UPDATED] Add any new Python dependencies (if needed)
└── [existing validation scripts]

public/
├── llms.txt                        [NEW] Generated basic summary file
├── llms-full.txt                   [NEW] Generated comprehensive data file
└── [existing static assets]

components/
├── Footer.tsx                     [UPDATED] Add LLM data links
└── [existing components]

content/
├── llm-links.yaml                 [NEW] Footer link labels and descriptions
└── [existing content files]       [SOURCE] Used by generation scripts

lib/
├── mdx.ts                         [EXISTING] Used by generation scripts
├── markdown.ts                    [EXISTING] Used by generation scripts
└── [other utilities]

package.json                       [UPDATED] Add scripts:
                                            - generate:llm (TypeScript execution)
                                            - validate:llm (Python validation)
                                            - prebuild hook (run generate:llm)
```

**Structure Decision**: Web application pattern using existing Next.js structure. Generation scripts in `/scripts` directory follow established pattern (similar to `generate-og-images/`). Validation follows existing Python script pattern. Static output files in `/public` directory for Next.js static serving.

## Complexity Tracking

_No constitution violations - this section intentionally left empty._
