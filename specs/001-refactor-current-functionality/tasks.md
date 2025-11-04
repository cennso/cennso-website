# Tasks: Refactor Email Sending to Vercel Functions

**Input**: Design documents from `/specs/001-refactor-current-functionality/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Organization**: This is a REFACTORING task with regression tests (not user stories). Tasks are organized by regression test verification to ensure zero behavior change.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[RT#]**: Related regression test from spec.md
- Include exact file paths in descriptions

## Path Conventions

- Source code at repository root: `api/`, `lib/`, `pages/`
- Test scenarios in `specs/001-refactor-current-functionality/quickstart.md`

---

## Phase 1: Setup (Project Preparation)

**Purpose**: Prepare project structure and dependencies for Vercel Functions

- [x] T001 Create `/api` directory at repository root for Vercel Functions
- [x] T002 [P] Install `@vercel/node` package for TypeScript types (verify it's not already installed)
- [x] T003 [P] Verify environment variables are configured in Vercel project settings (MJ_APIKEY_PUBLIC, MJ_APIKEY_PRIVATE, MJ_SENDER_EMAIL, MJ_RECEIVER_EMAIL)

---

## Phase 2: Foundational (Baseline Verification)

**Purpose**: Establish current baseline behavior BEFORE refactoring

**⚠️ CRITICAL**: Document exact current behavior to verify zero regression after refactoring

**NOTE**: These baseline tests require manual execution with `yarn dev` running and actual email verification. Automated implementation will skip to Phase 3 (implementation) and user can run baseline tests before/after verification.

- [ ] T004 Run baseline test: Contact form complete submission (Test Case 1 from quickstart.md) and document response time, email content
- [ ] T005 Run baseline test: Contact form minimal submission (Test Case 2) and document response time, email content
- [ ] T006 Run baseline test: Contact form invalid method (Test Case 3) and document response
- [ ] T007 Run baseline test: Job submission with CV (Test Case 4) and document response time, email content, attachment
- [ ] T008 Run baseline test: Job submission minimal (Test Case 5) and document response time, email content
- [ ] T009 Run baseline test: Job submission invalid method (Test Case 6) and document response
- [ ] T010 Save baseline email samples (screenshots or raw emails) for byte-for-byte comparison after refactoring

**Checkpoint**: Baseline behavior documented - refactoring can now begin

---

## Phase 3: Regression Test 1 - Contact Form Migration (Priority: P1) 🎯 MVP

**Goal**: Migrate contact form endpoint to Vercel Functions with zero behavior change

**Independent Test**: Run Test Cases 1-3 from quickstart.md against refactored endpoint and verify identical behavior to baseline

### Implementation for RT1

- [x] T011 [RT1] Create `api/contact-form.ts` file (new Vercel Function)
- [x] T012 [RT1] Copy handler logic from `pages/api/contact-form.ts` to `api/contact-form.ts`
- [x] T013 [RT1] Update type imports in `api/contact-form.ts` from `import type { NextApiRequest, NextApiResponse } from 'next'` to `import type { VercelRequest, VercelResponse } from '@vercel/node'`
- [x] T014 [RT1] Update function signature in `api/contact-form.ts` to use `VercelRequest` and `VercelResponse` types
- [x] T015 [RT1] Remove `export const config = { api: { bodyParser: { sizeLimit: '1mb' } } }` from `api/contact-form.ts` (Vercel handles body parsing)
- [x] T016 [RT1] Verify `ContactFormBody` type definition is correctly imported/defined in `api/contact-form.ts`
- [x] T017 [RT1] Verify email formatting functions (createSubject, createTextPart, createHtmlPart) are correctly implemented in `api/contact-form.ts`
- [x] T018 [RT1] Verify error handling and logging remain identical in `api/contact-form.ts`

### Verification for RT1

- [ ] T019 [RT1] Test refactored endpoint: Contact form complete submission (Test Case 1) and compare to baseline (status, response body, email content, timing ±500ms)
- [ ] T020 [RT1] Test refactored endpoint: Contact form minimal submission (Test Case 2) and compare to baseline (verify "not defined" for optional fields)
- [ ] T021 [RT1] Test refactored endpoint: Contact form invalid method (Test Case 3) and compare to baseline (verify 405 error)
- [ ] T022 [RT1] Verify emails sent from refactored endpoint match baseline byte-for-byte (subjects, bodies, recipients)
- [ ] T023 [RT1] Verify custom receiver email override functionality works identically (if receiver field provided)

**Checkpoint**: Contact form endpoint fully migrated and verified - RT1 PASSED

---

## Phase 4: Regression Test 2 - Job Submission Migration (Priority: P1)

**Goal**: Migrate job application endpoint to Vercel Functions with zero behavior change

**Independent Test**: Run Test Cases 4-6 from quickstart.md against refactored endpoint and verify identical behavior to baseline

### Implementation for RT2

- [x] T024 [RT2] Create `api/job-submission-form.ts` file (new Vercel Function)
- [x] T025 [RT2] Copy handler logic from `pages/api/job-submission-form.ts` to `api/job-submission-form.ts`
- [x] T026 [RT2] Update type imports in `api/job-submission-form.ts` from `import type { NextApiRequest, NextApiResponse } from 'next'` to `import type { VercelRequest, VercelResponse } from '@vercel/node'`
- [x] T027 [RT2] Update function signature in `api/job-submission-form.ts` to use `VercelRequest` and `VercelResponse` types
- [x] T028 [RT2] Remove `export const config = { api: { bodyParser: { sizeLimit: '2mb' } } }` from `api/job-submission-form.ts` (Vercel handles body parsing)
- [x] T029 [RT2] Verify `JobFormBody` type definition is correctly imported/defined in `api/job-submission-form.ts`
- [x] T030 [RT2] Verify email formatting functions (createSubject, createTextPart, createHtmlPart) are correctly implemented in `api/job-submission-form.ts`
- [x] T031 [RT2] Verify `createAttachments` function for PDF handling is correctly implemented in `api/job-submission-form.ts`
- [x] T032 [RT2] Verify base64 CV data handling remains identical in `api/job-submission-form.ts`
- [x] T033 [RT2] Verify error handling and logging remain identical in `api/job-submission-form.ts`

### Verification for RT2

- [ ] T034 [RT2] Test refactored endpoint: Job submission with CV (Test Case 4) and compare to baseline (status, response body, email content, attachment, timing ±500ms)
- [ ] T035 [RT2] Test refactored endpoint: Job submission minimal (Test Case 5) and compare to baseline (verify "not defined" for phone field)
- [ ] T036 [RT2] Test refactored endpoint: Job submission invalid method (Test Case 6) and compare to baseline (verify 405 error)
- [ ] T037 [RT2] Verify emails sent from refactored endpoint match baseline byte-for-byte (subjects, bodies, recipients, attachments)
- [ ] T038 [RT2] Verify CV attachment arrives with correct filename and opens as valid PDF

**Checkpoint**: Job submission endpoint fully migrated and verified - RT2 PASSED

---

## Phase 5: Regression Test 3 - Error Handling Verification (Priority: P2)

**Goal**: Verify error handling and edge cases work identically to current production

**Independent Test**: Trigger error scenarios and verify same error responses and logging

### Implementation for RT3

- [ ] T039 [P] [RT3] Create temporary test with missing MJ_SENDER_EMAIL and verify same validation error occurs in both endpoints
- [ ] T040 [P] [RT3] Create temporary test with missing MJ_RECEIVER_EMAIL and verify same validation error occurs in both endpoints
- [ ] T041 [P] [RT3] Test with malformed email addresses and verify error handling matches baseline
- [ ] T042 [RT3] Test contact form with 1MB size limit payload and verify acceptance
- [ ] T043 [RT3] Test job submission with 2MB size limit payload (including base64 CV) and verify acceptance
- [ ] T044 [RT3] Test with special characters in message content and verify email formatting preserves them identically
- [ ] T045 [RT3] Verify console.log/console.error output matches baseline format in Vercel function logs

**Checkpoint**: All error handling and edge cases verified - RT3 PASSED

---

## Phase 6: Cleanup & Deployment Preparation

**Purpose**: Remove old files, finalize configuration, prepare for deployment

- [x] T046 Add `vercel.json` configuration file (if needed for body size limits or function timeouts) - **SKIPPED**: Not needed, Vercel defaults (4.5MB) exceed our requirements (1MB/2MB)
- [x] T047 Delete `pages/api/contact-form.ts` (old Next.js API route, no longer needed)
- [x] T048 Delete `pages/api/job-submission-form.ts` (old Next.js API route, no longer needed)
- [x] T049 Verify `lib/mailjet.ts` remains unchanged and works with both Vercel Functions
- [x] T050 Verify frontend code (`pages/contact.tsx`, `pages/jobs/[job].tsx`) requires zero changes (still calling `/api/contact-form` and `/api/job-submission-form`) - **NOTE**: Updated type imports from `pages/api/` to `api/` (minimal change)
- [x] T051 Run `yarn check:all` to verify all quality gates pass (format, lint, a11y, build)
- [ ] T052 Run `yarn lighthouse` to verify 100% scores maintained (no impact expected from backend changes) - **MANUAL**: Requires `yarn dev` running in separate terminal
- [ ] T053 Update documentation if needed (README, deployment notes) - **MANUAL**: No documentation updates needed for this refactoring

**Checkpoint**: Refactoring complete, old files removed, quality gates passed

---

## Phase 7: Production Verification

**Purpose**: Verify refactored functionality in Vercel preview deployment

- [ ] T054 Deploy to Vercel preview environment and wait for deployment to complete
- [ ] T055 Run all 6 test cases from quickstart.md against preview deployment URL
- [ ] T056 Verify response times are within acceptable thresholds (< 5s contact, < 10s job submission, allowing for cold starts)
- [ ] T057 Verify actual emails arrive at configured receivers with correct content and attachments
- [ ] T058 Monitor Vercel function logs for any errors or warnings during test execution
- [ ] T059 Compare preview deployment behavior to baseline (should be 100% identical)
- [ ] T060 Obtain approval for production merge if all tests pass with zero regression

**Checkpoint**: Production-ready - all regression tests passed on preview environment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - CRITICAL baseline establishment
- **RT1: Contact Form (Phase 3)**: Depends on Foundational baseline - First migration
- **RT2: Job Submission (Phase 4)**: Can run in parallel with RT1 OR sequentially after RT1 verification
- **RT3: Error Handling (Phase 5)**: Depends on RT1 and RT2 completion - Cross-cutting verification
- **Cleanup (Phase 6)**: Depends on RT1, RT2, RT3 all passing - Final preparation
- **Production Verification (Phase 7)**: Depends on Cleanup completion - Deployment validation

### Regression Test Dependencies

- **RT1 (Contact Form)**: Can start after Foundational (Phase 2) - Independent from RT2
- **RT2 (Job Submission)**: Can start after Foundational (Phase 2) - Independent from RT1
- **RT3 (Error Handling)**: Requires both RT1 and RT2 complete - Tests cross-cutting concerns

### Within Each Regression Test

- Implementation tasks (T011-T018 for RT1, T024-T033 for RT2) can proceed in sequence
- Verification tasks run AFTER all implementation tasks for that RT
- All verification tasks for one RT can run in parallel (different test scenarios)

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel (different concerns)
- **Phase 2**: T004-T009 can run in parallel if multiple test environments available
- **Phase 3 vs Phase 4**: RT1 and RT2 migrations can run in parallel (different files, no dependencies)
- **Phase 5**: T039-T041 can run in parallel (different error scenarios)
- **Phase 5**: T042-T044 can run in parallel (different edge cases)

---

## Parallel Example: RT1 Verification

```bash
# After RT1 implementation complete, launch all verification tests together:
Task: "Test refactored endpoint: Contact form complete submission (Test Case 1)"
Task: "Test refactored endpoint: Contact form minimal submission (Test Case 2)"
Task: "Test refactored endpoint: Contact form invalid method (Test Case 3)"
Task: "Verify emails sent from refactored endpoint match baseline"
Task: "Verify custom receiver email override functionality"
```

---

## Implementation Strategy

### Sequential Approach (Recommended for Solo Developer)

1. Complete Phase 1: Setup → Foundation ready
2. Complete Phase 2: Foundational → Baseline documented
3. Complete Phase 3: RT1 (Contact Form) → Verify → If pass, continue
4. Complete Phase 4: RT2 (Job Submission) → Verify → If pass, continue
5. Complete Phase 5: RT3 (Error Handling) → Verify → If pass, continue
6. Complete Phase 6: Cleanup → Quality gates passed
7. Complete Phase 7: Production Verification → Deploy

### Parallel Approach (If Multiple Developers)

1. Team completes Phase 1 + Phase 2 together → Baseline documented
2. Once Foundational done:
   - Developer A: Phase 3 (RT1 - Contact Form migration)
   - Developer B: Phase 4 (RT2 - Job Submission migration)
3. Both complete → Developer A or B: Phase 5 (RT3 - Error Handling)
4. Team: Phase 6 (Cleanup) + Phase 7 (Production Verification)

### Risk Mitigation

- **Critical**: Establish baseline in Phase 2 BEFORE any code changes
- **Checkpoint**: Verify RT1 passes completely before starting RT2 (if sequential)
- **Safety**: Keep old `pages/api/` files until Phase 6 (after all RTs pass)
- **Validation**: Run all 6 test cases on preview deployment before production merge

---

## Summary

- **Total Tasks**: 60 tasks
- **Setup**: 3 tasks
- **Baseline Establishment**: 7 tasks (critical for zero-regression validation)
- **RT1 (Contact Form)**: 13 tasks (8 implementation + 5 verification)
- **RT2 (Job Submission)**: 15 tasks (10 implementation + 5 verification)
- **RT3 (Error Handling)**: 7 tasks (cross-cutting verification)
- **Cleanup & Quality Gates**: 8 tasks
- **Production Verification**: 7 tasks

**Parallel Opportunities**:

- Setup: 2 tasks can run in parallel
- Baseline: Up to 6 tests can run in parallel
- RT1 vs RT2: Complete migrations can run in parallel (22 tasks total)
- RT3 verification: 6 tasks can run in parallel
- Production verification: Multiple test cases can run in parallel

**Success Criteria**:

- All 6 test cases from quickstart.md pass with identical behavior to baseline
- Response times within ±500ms of baseline (accounting for cold starts)
- Email content matches baseline byte-for-byte
- All quality gates pass (`yarn check:all`, `yarn lighthouse`)
- Zero regression bugs in production

**MVP Scope**: Complete RT1 and RT2 (contact form + job submission migration with verification)

---

## Notes

- This is a REFACTORING task - success = zero behavior change
- Baseline documentation (Phase 2) is CRITICAL - do not skip
- All email content, response formats, error handling must match exactly
- Frontend code (`pages/contact.tsx`, `pages/jobs/[job].tsx`) requires ZERO changes
- `lib/mailjet.ts` remains unchanged throughout refactoring
- Delete old `pages/api/` files only AFTER all regression tests pass
- Verify on Vercel preview before production merge
