# Implementation Plan: Refactor Email Sending to Vercel Functions

**Branch**: `001-refactor-current-functionality` | **Date**: 2025-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-refactor-current-functionality/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This is a refactoring task to migrate existing Next.js API routes (`pages/api/contact-form.ts`, `pages/api/job-submission-form.ts`) to Vercel Functions format. The goal is to ensure compatibility with Vercel's serverless deployment infrastructure while preserving all existing behavior. The email sending logic uses Mailjet and must continue to work identically after refactoring.

## Technical Context

**Language/Version**: TypeScript 5.x (existing codebase), Node.js runtime on Vercel Functions  
**Primary Dependencies**: `node-mailjet@6.0.5`, `next@14.1.0`, `@vercel/node` (Vercel Functions runtime)  
**Storage**: N/A (stateless email sending)  
**Testing**: Manual regression testing (compare behavior to current production)  
**Target Platform**: Vercel Functions (serverless, Node.js runtime)  
**Project Type**: Web application (Next.js with Pages Router)  
**Performance Goals**: Email delivery within 5s (contact form), 10s (job applications with 2MB attachments)  
**Constraints**:

- Must preserve exact existing behavior (zero regression)
- Must work with Vercel's serverless environment (cold starts, stateless execution)
- Body size limits: 1MB (contact form), 2MB (job applications)
- Must use existing environment variables without changes
  **Scale/Scope**: 2 API endpoints to refactor, ~200 lines of code total

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**I. Code Quality & Type Safety**: ✅ PASS

- Existing code uses TypeScript with strict mode
- All functions have explicit return types
- No `any` types in current implementation
- Refactoring will maintain same type safety standards

**II. Component Architecture & Reusability**: ✅ PASS

- Email logic properly separated in `/lib/mailjet.ts`
- API handlers in `/pages/api/` follow Next.js conventions
- No changes to component architecture needed (frontend untouched)

**III. User Experience Consistency**: ✅ PASS

- No UX changes - this is backend refactoring only
- Frontend components remain unchanged
- Same API endpoints, same response format

**IV. Performance & Build Optimization**: ✅ PASS

- No impact on page bundles (API routes not bundled with client)
- Lighthouse scores unaffected (server-side only)
- Performance maintained (same email delivery times)

**V. Accessibility Standards**: ✅ PASS

- No accessibility impact (backend refactoring only)
- Frontend forms remain unchanged

**Content Management Standards**: ✅ PASS

- No content changes required
- Environment variables unchanged

**Development Workflow - Quality Gates**: ✅ PASS

- All existing quality gates will continue to pass
- `yarn check:all` will pass after refactoring
- No new dependencies affecting build

**Refactoring-Specific Checks**:

- ✅ Existing functionality works in production
- ✅ Frontend components will not change
- ✅ API contracts (request/response format) will not change
- ✅ Environment variables will not change
- ✅ No new external dependencies (using existing `node-mailjet`)

**GATE STATUS**: ✅ **PASSED** - No constitution violations, refactoring maintains all existing standards

## Project Structure

### Documentation (this feature)

```
specs/001-refactor-current-functionality/
├── spec.md              # Feature specification (already exists)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (Vercel Functions compatibility research)
├── quickstart.md        # Phase 1 output (testing guide for refactored endpoints)
├── checklists/
│   └── requirements.md  # Specification quality checklist (already exists)
└── contracts/           # Phase 1 output (API contract documentation)
    ├── contact-form.json    # Contact form API contract (OpenAPI)
    └── job-submission.json  # Job submission API contract (OpenAPI)
```

### Source Code (repository root)

**Current Structure** (before refactoring):

```
pages/api/
├── contact-form.ts          # Contact form API handler (Next.js API route)
└── job-submission-form.ts   # Job application API handler (Next.js API route)

lib/
└── mailjet.ts               # Mailjet client wrapper

pages/
├── contact.tsx              # Contact page (uses contact-form API)
└── jobs/[job].tsx           # Job details page (uses job-submission API)
```

**Target Structure** (after refactoring):

```
api/
├── contact-form.ts          # Vercel Function for contact form (migrated from pages/api/)
└── job-submission-form.ts   # Vercel Function for job application (migrated from pages/api/)

lib/
└── mailjet.ts               # Mailjet client wrapper (unchanged)

pages/
├── contact.tsx              # Contact page (unchanged - calls /api/contact-form)
└── jobs/[job].tsx           # Job details page (unchanged - calls /api/job-submission-form)
```

**Structure Decision**:

- Move API routes from `pages/api/` to `api/` directory (Vercel Functions convention)
- This follows Vercel's recommended structure for serverless functions
- Frontend code remains in `pages/` directory unchanged
- Utility code in `lib/` remains unchanged
- API endpoints remain at `/api/contact-form` and `/api/job-submission-form` (transparent to frontend)

## Complexity Tracking

_No complexity violations - this is a straightforward refactoring task._

**Justification**: This refactoring maintains existing architecture and does not introduce any new patterns or complexities that violate the constitution. All code quality, type safety, and architectural standards are preserved.

---

## Phase 0: Research

All technical unknowns resolved in [`research.md`](./research.md):

1. **File structure**: Use `/api` directory (Vercel convention, separate from `/pages/api`)
2. **Package compatibility**: `node-mailjet` works in serverless (standard HTTP client)
3. **Environment variables**: `process.env.*` works identically
4. **Body parsing**: Remove Next.js `config` export, Vercel handles parsing
5. **TypeScript support**: Use `@vercel/node` types (compatible with Next.js types)
6. **Cold starts**: Acceptable overhead (~200-500ms, well within budgets)
7. **Logging**: `console.*` captured by Vercel, same as Next.js

**Risk Assessment**: ✅ LOW RISK - Direct migration path with no blockers identified.

## Phase 1: Design & Contracts

### Data Model

Comprehensive documentation in [`data-model.md`](./data-model.md):

- **ContactFormSubmission**: 7 fields (firstName, lastName, company, email, phone, message, receiver)
- **JobApplicationSubmission**: 8 fields (adds position, cvData base64, cvName)
- **EmailMessage**: Mailjet structure (Messages array with From/To/CC/Subject/TextPart/HtmlPart/Attachments)
- **Environment Variables**: 4 required (MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, MJ_SENDER_EMAIL, MJ_RECEIVER_EMAIL)
- **API Responses**: Success (200, `{success:true}`), Method Error (405), Server Error (500, `{success:false}`)
- **Data Flows**: 10-step process diagrams for both endpoints

### API Contracts

OpenAPI 3.0.3 specifications documented in [`contracts/`](./contracts/):

1. **Contact Form** ([`contact-form.json`](./contracts/contact-form.json)):

   - POST /api/contact-form
   - Request: 7 properties (4 required)
   - Responses: 200/405/500
   - Examples: Complete/minimal submissions

2. **Job Submission** ([`job-submission.json`](./contracts/job-submission.json)):
   - POST /api/job-submission-form
   - Request: 8 properties (7 required, includes cvData/cvName)
   - Responses: 200/405/500
   - Examples: Complete/minimal with CV attachment

### Testing Guide

Regression testing documentation in [`quickstart.md`](./quickstart.md):

- 6 test cases (3 per endpoint)
- curl examples with expected responses
- Before/after comparison table
- Verification checklist
- Troubleshooting guide

### Agent Context Update

✅ Updated GitHub Copilot context (`.github/copilot-instructions.md`) with:

- TypeScript 5.x + Node.js runtime on Vercel Functions
- Dependencies: `node-mailjet@6.0.5`, `next@14.1.0`, `@vercel/node`
- Database: N/A (stateless)

---

## Next Steps

Phase 1 (Design & Contracts) is complete. This implementation plan is ready for task breakdown.

**To generate implementation tasks**, run:

```bash
/speckit.tasks
```

This will create `tasks.md` with specific implementation steps organized by dependency order.
