# Tasks: LLM-Friendly Data Exposure

**Feature Branch**: `003-generate-llm-files`  
**Input**: Design documents from `/specs/003-generate-llm-files/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for LLM data generation

- [x] T001 Create directory structure: `scripts/generate-llm-data/` with subdirectories `generators/`, `utils/`, `types/`
- [x] T002 Add TypeScript configuration for generation scripts: `scripts/generate-llm-data/tsconfig.json` extending root config
- [x] T003 [P] Add LLM files to .gitignore: `public/llms.txt` and `public/llms-full.txt` (build artifacts, not committed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Define TypeScript types in `scripts/generate-llm-data/types/index.ts`: LLMDocument, DocumentMetadata, Section, ContentItem, Author interfaces per data-model.md
- [x] T005 Create shared utilities in `scripts/generate-llm-data/utils/content-loader.ts`: functions to load and parse MDX files (blog, solutions, stories, jobs) using existing lib/mdx.ts
- [x] T006 [P] Create shared utilities in `scripts/generate-llm-data/utils/yaml-loader.ts`: functions to load YAML files (authors, testimonials, partners, pages) using js-yaml
- [x] T007 [P] Create text cleaning utility in `scripts/generate-llm-data/utils/text-cleaner.ts`: stripMDX(), stripHTML(), convertToPlainText() functions
- [x] T008 [P] Create URL utility in `scripts/generate-llm-data/utils/url-builder.ts`: buildAbsoluteUrl() to convert relative paths to absolute URLs
- [x] T009 Create metadata builder in `scripts/generate-llm-data/utils/metadata-builder.ts`: generateDocumentMetadata() function per data-model.md DocumentMetadata spec

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - LLM Crawlers Discover Website Data (Priority: P1) 🎯 MVP

**Goal**: Generate and serve `/llms.txt` and `/llms-full.txt` files with discoverable footer links

**Independent Test**: Request both URLs and verify they return properly formatted content with required sections. Check footer links are visible on all pages.

### Implementation for User Story 1


**Checkpoint**: At this point, User Story 1 should be fully functional - LLM files generated, served, and discoverable via footer


## Phase 4: User Story 2 - Automated Content Generation and Validation (Priority: P2)

**Goal**: Ensure LLM files always reflect current content with automated validation

**Independent Test**: Run build process, verify llms.txt and llms-full.txt generated with latest content, run validation to confirm quality standards met

### Implementation for User Story 2


**Checkpoint**: At this point, User Stories 1 AND 2 both work - files generated, served, discoverable, AND automatically validated on every build/CI run


## Phase 5: User Story 3 - Developers Understand LLM Data Format (Priority: P3)

**Goal**: Comprehensive documentation for maintaining and extending LLM data feature

**Independent Test**: Have a developer (not involved in implementation) read the documentation and successfully add a new content type to LLM files

### Implementation for User Story 3

- [ ] T028 [P] [US3] Create developer guide in `docs/llm-data-format.md`: Document llms.txt specification, file structure differences (basic vs full), metadata requirements, section types, content formatting rules per contracts/llms-txt-format.txt
- [ ] T029 [P] [US3] Create generation guide in `docs/generate-llm-data.md`: Document generation pipeline, how to run generators, TypeScript scripts structure, content sources (YAML/MDX), transformation rules per data-model.md
- [ ] T030 [P] [US3] Create validation guide in `docs/validate-llm-data.md`: Document validation requirements, how to run validation locally, validation rules (metadata, sections, URLs, format, size), troubleshooting validation failures
- [ ] T031 [P] [US3] Create extension guide in `docs/extend-llm-data.md`: Document how to add new content types, step-by-step example (add new section), generator patterns, validation updates
- [ ] T032 [US3] Update main README: Add section explaining LLM data endpoints under "Features" or "API", link to `/llms.txt` and `/llms-full.txt`, link to docs/llm-data-format.md (depends on T028)
- [ ] T033 [US3] Update `docs/README.md`: Add links to new LLM documentation files (llm-data-format.md, generate-llm-data.md, validate-llm-data.md, extend-llm-data.md)
- [ ] T034 [US3] Add code comments: Document all generator functions, utility functions, and validation logic with JSDoc/docstring comments explaining purpose, parameters, return values

**Checkpoint**: All user stories now independently functional with comprehensive documentation

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality assurance

- [ ] T035 [P] Add TypeScript compilation check: Update `scripts/generate-llm-data/tsconfig.json` to ensure strict mode, add compilation check to `yarn build` or `yarn lint`
- [ ] T036 [P] Add logging to generation: Update `scripts/generate-llm-data/index.ts` to log generation progress (loading content, creating sections, writing files, timing info)
- [ ] T037 [P] Add error handling: Wrap all generation and validation functions in try-catch blocks with meaningful error messages indicating which step failed
- [ ] T038 [P] Optimize text cleaning: Review `scripts/generate-llm-data/utils/text-cleaner.ts` for performance with large content (memoization, regex optimization)
- [ ] T039 Add Schema.org references: Update generators to include Schema.org type comments in sections (e.g., `# Blog Posts [Schema.org: BlogPosting]`) per data-model.md Section.schemaType field
- [ ] T040 [P] Add file size monitoring: Update validation to warn if files approaching size limits (llms.txt >4MB, llms-full.txt >18MB) before they fail
- [ ] T041 [P] Add content completeness check: Update validation to verify all expected content types present (count blog posts, solutions, etc. and warn if unexpectedly low)
- [ ] T042 Test footer links accessibility: Run `yarn a11y` to verify footer links meet WCAG 2.1 AA standards (contrast, keyboard navigation, screen reader support)
- [ ] T043 Test build performance: Measure LLM generation time with `yarn build`, verify <30 seconds per success criteria SC-003
- [ ] T044 Test file sizes: Verify llms.txt <5MB and llms-full.txt <20MB per success criteria SC-005
- [ ] T045 Test response times: Measure HTTP response time for both files, verify <1 second per success criteria SC-001
- [ ] T046 Run quickstart.md validation: Follow `specs/003-generate-llm-files/quickstart.md` user/developer/content creator guides and verify all instructions work correctly
- [ ] T047 Final code review: Review all TypeScript and Python code for constitution compliance (type safety, no `any`, proper error handling, ESLint/Prettier)
- [ ] T048 Update AGENTS.md: Add LLM data generation and validation to commands section, document new `yarn validate:llm` command

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories. Delivers MVP: LLM files generated, served, and discoverable.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Adds validation to US1 output but US1 can function without it. Independently testable by running validation on US1 files.
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Pure documentation, no code dependencies. Can be written while US1/US2 are in progress. Independently testable by having someone read docs and extend feature.

### Within Each User Story

**User Story 1**:

- T010 (basic generator) and T011 (full generator) can run in parallel (different files)
- T012 (orchestrator) depends on T010 and T011
- T013 (prebuild hook) depends on T012
- T014 (verify serving) depends on T013
- T015 (footer links) can run in parallel with T010-T014 (different file)
- T016 (footer YAML) should be done before or with T015
- T017 (manual verification) depends on all others

**User Story 2**:

- T018-T023 (validation functions) can all run in parallel (same file but independent functions)
- T024 (CLI command) depends on T018-T023
- T025 (build integration) depends on T024
- T026 (CI workflow) and T027 (check:all) can run in parallel after T025

**User Story 3**:

- T028-T031 (all documentation files) can all run in parallel (different files, independent)
- T032 (README update) depends on T028
- T033 (docs README) depends on T028-T031
- T034 (code comments) can run in parallel with docs

**Phase 6 Polish**:

- T035-T041 (various improvements) can mostly run in parallel (different files/concerns)
- T042-T045 (testing) should run after T035-T041
- T046 (quickstart validation) depends on all user stories complete
- T047 (code review) depends on all code complete
- T048 (AGENTS.md update) can run any time after T024 (CLI command exists)

### Parallel Opportunities

**Setup Phase**: T001, T002, T003 all independent but small enough to do sequentially

**Foundational Phase**:

```bash
# Launch utilities in parallel (different files):
Task T006: Create yaml-loader.ts
Task T007: Create text-cleaner.ts
Task T008: Create url-builder.ts
```

**User Story 1**:

```bash
# Launch generators in parallel:
Task T010: Implement basic.ts generator
Task T011: Implement full.ts generator
Task T015: Add footer links (can start independently)
```

**User Story 2**:

```bash
# Launch validation functions in parallel (same file, different functions):
Task T019: Implement check_metadata()
Task T020: Implement check_sections()
Task T021: Implement check_urls()
Task T022: Implement check_format()
Task T023: Implement check_size()
```

**User Story 3**:

```bash
# Launch all documentation in parallel:
Task T028: Create llm-data-format.md
Task T029: Create generate-llm-data.md
Task T030: Create validate-llm-data.md
Task T031: Create extend-llm-data.md
Task T034: Add code comments
```

**Phase 6 Polish**:

```bash
# Launch improvements in parallel:
Task T035: Add TypeScript compilation check
Task T036: Add logging
Task T037: Add error handling
Task T038: Optimize text cleaning
Task T040: Add file size monitoring
Task T041: Add content completeness check
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009) - **CRITICAL CHECKPOINT**
3. Complete Phase 3: User Story 1 (T010-T017)
4. **STOP and VALIDATE**:
   - Request `/llms.txt` and `/llms-full.txt`, verify formatted correctly
   - Check footer links visible on all pages
   - Test on desktop and mobile
   - If working, you have a deployable MVP! ✅

### Incremental Delivery

1. **Foundation** (Phase 1 + 2): Setup + utilities ready
2. **MVP** (Phase 3): User Story 1 complete → Deploy/Demo (LLM files discoverable!)
3. **Quality** (Phase 4): User Story 2 complete → Deploy/Demo (automated validation!)
4. **Maintainable** (Phase 5): User Story 3 complete → Deploy/Demo (fully documented!)
5. **Polished** (Phase 6): All improvements → Final deployment

Each delivery adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. **Together**: Complete Setup + Foundational (small, foundational work)
2. **Split after Foundational**:
   - Developer A: User Story 1 (T010-T017) - MVP implementation
   - Developer B: User Story 2 (T018-T027) - Validation scripts
   - Developer C: User Story 3 (T028-T034) - Documentation
3. **Integrate**: Each story completes independently, then merge
4. **Polish Together**: Phase 6 improvements (T035-T048)

---

## Success Criteria Mapping

**SC-001** (Response time <1 second): Tested in T045  
**SC-002** (100% content coverage): Validated in T041  
**SC-003** (Generation <30 seconds): Tested in T043  
**SC-004** (Validation catches errors): Implemented in T018-T025  
**SC-005** (File size limits): Validated in T023, T044  
**SC-006** (Footer links visible): Implemented in T015-T016, tested in T017  
**SC-007** (Developer understands in 30 min): Documented in T028-T034, tested in T046  
**SC-008** (100% standards compliance): Enforced in T019-T022, documented in T028  
**SC-009** (Data freshness): Ensured by T013 (prebuild hook)

---

## Estimated Effort

**Phase 1 (Setup)**: 1-2 hours  
**Phase 2 (Foundational)**: 4-6 hours  
**Phase 3 (User Story 1)**: 6-8 hours  
**Phase 4 (User Story 2)**: 6-8 hours  
**Phase 5 (User Story 3)**: 4-6 hours  
**Phase 6 (Polish)**: 4-6 hours

**Total**: 25-36 hours (3-5 days for one developer working full-time)

**MVP Only** (Phase 1 + 2 + 3): 11-16 hours (1.5-2 days)

---

## Notes

- [P] tasks = different files or independent functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- MVP (User Story 1) delivers immediate value: LLM-discoverable website
- Phase 2 (Foundational) is CRITICAL - all utilities must work before stories begin
- All TypeScript code must pass `yarn lint` and `yarn format`
- All Python code must follow existing validation script patterns
- Constitution requirements enforced: strict types, no `any`, WCAG 2.1 AA, SEO metadata N/A (text files)
- Validation must run in CI (GitHub Actions) and locally (`yarn validate:llm`)
- Files must be in .gitignore (build artifacts)
- Footer labels must come from YAML (no hardcoded strings per constitution)

---

**Ready to Start**: All design documents complete, task breakdown atomic and actionable. Begin with Phase 1 (Setup)! 🚀
