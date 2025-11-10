---
description: 'Implementation tasks for Zero-Click SEO Optimization'
---

# Tasks: Zero-Click SEO Optimization

**Input**: Design documents from `/specs/002-zero-click-structured-data/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Project uses Next.js Pages Router at repository root with:

- `lib/` - Utilities and business logic
- `components/` - React components
- `pages/` - Next.js pages
- `content/` - Static YAML/MDX content
- `scripts/` - Build and validation scripts

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create branch `002-zero-click-structured-data` from main
- [x] T002 Create schema generator directory structure `lib/seo/schema/`
- [x] T003 [P] Copy TypeScript contracts from `specs/002-zero-click-structured-data/contracts/schema-types.ts` to `lib/seo/schema/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Update `components/common/SchemaOrg.tsx` to accept `SchemaType | SchemaCollection` prop with proper typing
- [x] T005 Update `components/SEO.tsx` to accept optional `schema` prop and integrate `SchemaOrg` component
- [x] T006 Create schema utilities in `lib/seo/schema/utils.ts` for common schema operations (date formatting, URL validation)
- [ ] T007 Extend `scripts/validate-structured-data.py` to validate Schema.org markup using Google Rich Results Test API
- [ ] T008 Add `seo:schema` script to `package.json` that runs structured data validation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Search Engine Discovers Rich Content (Priority: P1) 🎯 MVP

**Goal**: Add Organization and BreadcrumbList schemas to all pages so search engines can display rich company information and navigation hierarchy in search results

**Independent Test**: Submit any page URL to Google Rich Results Test and verify Organization + BreadcrumbList schemas validate without errors

### Implementation for User Story 1

- [x] T009 [P] [US1] Create Organization schema generator in `lib/seo/schema/organization.ts` with `generateOrganizationSchema()` function
- [x] T010 [P] [US1] Create BreadcrumbList schema generator in `lib/seo/schema/breadcrumb.ts` with `generateBreadcrumbSchema(path, navigation)` function
- [x] T011 [US1] Create schema exports in `lib/seo/schema/index.ts` exporting all generator functions
- [x] T012 [US1] Update `components/SEO.tsx` to generate and pass Organization + BreadcrumbList schemas to `SchemaOrg` component
- [x] T013 [US1] Source Organization data from `content/landing-page.yaml` and `content/about-page.yaml` in generator
- [x] T014 [US1] Test Organization schema on homepage by building and validating in Google Rich Results Test
- [x] T015 [US1] Test BreadcrumbList schema on nested pages (e.g., `/blog`, `/solutions/async-api`) by validating navigation hierarchy
- [x] T016 [US1] Verify all pages include both schemas by running `yarn build` and checking built HTML in `.next/server/pages/`

**Checkpoint**: At this point, User Story 1 should be fully functional - all pages have Organization + BreadcrumbList schemas that validate successfully

---

## Phase 4: User Story 2 - Content Answers Direct Questions (Priority: P1)

**Goal**: Add Article/BlogPosting schemas to blog posts so search engines can display them as rich cards and extract content for featured snippets

**Independent Test**: Open any blog post, view source, verify BlogPosting schema with all required properties (headline, author, datePublished, publisher, image), submit to Google Rich Results Test

### Implementation for User Story 2

- [x] T017 [P] [US2] Create Person schema generator in `lib/seo/schema/person.ts` with `generatePersonSchema(author)` function
- [x] T018 [P] [US2] Create Article schema generator in `lib/seo/schema/article.ts` with `generateArticleSchema(post, authors)` function
- [x] T019 [US2] Update `pages/blog/[blog-post].tsx` to generate Article schema and pass to SEO component
- [x] T020 [US2] Ensure Person schemas in Article.author reference data from `content/authors.yaml`
- [x] T021 [US2] Verify Article schema includes publisher as Organization (reuse from US1)
- [x] T022 [US2] Test Article schema validation on at least 3 different blog posts in Google Rich Results Test
- [x] T023 [US2] Create FAQ schema generator in `lib/seo/schema/faq.ts` with `generateFAQSchema(faqs)` function
- [x] T024 [US2] Add FAQ data structure to `content/solutions-page.yaml` with at least 3 question/answer pairs
- [x] T025 [US2] Update `pages/solutions/[solution].tsx` to conditionally generate FAQ schema if FAQ data exists
- [x] T026 [US2] Test FAQ schema validation on solutions pages with Q&A content

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - all blog posts have Article schemas, pages with FAQs have FAQ schemas

---

## Phase 5: User Story 3 - Brand Visibility in Knowledge Graph (Priority: P2)

**Goal**: Enhance Organization schema with additional brand information (founding date, founders, contact points) to increase eligibility for knowledge panel display

**Independent Test**: Search "Cennso" in Google (after indexing), verify knowledge panel appears with logo, description, social links

### Implementation for User Story 3

- [x] T027 [US3] Enhance Organization schema in `lib/seo/schema/organization.ts` to include `foundingDate`, `founder`, `contactPoint` properties
- [x] T028 [US3] Add founding date and founder information to `content/about-page.yaml`
- [x] T029 [US3] Add contact point data (email, phone, contact type) to `content/contact-page.yaml`
- [x] T030 [US3] Update Organization schema generator to source enhanced data from YAML files
- [x] T031 [US3] Verify enhanced Organization schema validates in Schema Markup Validator
- [x] T032 [US3] Submit homepage to Google Search Console and monitor for knowledge graph eligibility

**Checkpoint**: All user stories 1, 2, and 3 should now be independently functional - Organization schema includes all brand information needed for knowledge panel

---

## Phase 6: User Story 4 - Local Search Optimization (Priority: P3)

**Goal**: Add LocalBusiness schema to contact page so business information appears in local search results and Google Maps

**Verification**:

```bash
yarn build
# Check .next/server/pages/contact.html for LocalBusiness JSON-LD
# Test locally at http://localhost:3000/contact
```

**Independent Test**: Search "mobile core solutions [city]" and verify Cennso appears in local results with complete NAP (Name, Address, Phone) data

### Implementation for User Story 4

- [x] T033 [P] [US4] Create LocalBusiness schema generator in `lib/seo/schema/local-business.ts` with `generateLocalBusinessSchema()` function
- [x] T034 [P] [US4] Add complete NAP data to `content/contact-page.yaml` (street address, city, state, postal code, country, phone)
- [x] T035 [US4] Add GeoCoordinates (latitude, longitude) to contact page YAML for office location
- [x] T036 [US4] Add business hours data to contact page YAML in OpeningHoursSpecification format
- [x] T037 [US4] Update `pages/contact.tsx` to generate LocalBusiness schema and pass to SEO component
- [x] T038 [US4] Test LocalBusiness schema validation in Google Rich Results Test
- [x] T039 [US4] Verify contact page includes both Organization (US1) and LocalBusiness (US4) schemas

**Checkpoint**: All user stories should now be independently functional - contact page has complete local business information

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 [P] Create unit tests in `tests/seo/schema-validation.test.ts` for all schema generator functions
- [ ] T041 [P] Add integration tests in `tests/seo/rich-results.test.ts` using Google Rich Results Test API
- [x] T042 Run full validation suite: `yarn check:all` to ensure all quality gates pass
- [ ] T043 Run structured data validation: `yarn seo:schema` on all built pages
- [ ] T044 [P] Update `docs/create-blog-post.md` to document Article schema generation
- [ ] T045 [P] Update `AGENTS.md` to document new schema generation patterns
- [ ] T046 Test Lighthouse scores on 5 representative pages (homepage, blog post, solution, success story, contact) - verify ≥95% maintained
- [ ] T047 Measure JSON-LD size impact - verify <5KB per page (compressed)
- [x] T048 Verify bundle size unchanged - First Load JS should remain ~275KB
- [ ] T049 Create validation checklist in `specs/002-zero-click-structured-data/validation.md` documenting all manual testing steps
- [ ] T050 Run quickstart validation steps from `specs/002-zero-click-structured-data/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1) → User Story 2 (P1) → User Story 3 (P2) → User Story 4 (P3)
  - **Recommended order**: Implement in priority sequence for incremental value delivery
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Depends on User Story 1 for Organization schema reuse in Article.publisher
- **User Story 3 (P2)**: Enhances User Story 1 Organization schema - depends on T009 completion
- **User Story 4 (P3)**: Can start after Foundational - uses Organization schema from User Story 1

### Within Each User Story

**User Story 1**:

- T009 (Organization) and T010 (Breadcrumb) can run in parallel ✅
- T011 (exports) depends on T009, T010 completion
- T012 (SEO integration) depends on T011
- T013-T016 (testing/validation) depend on T012

**User Story 2**:

- T017 (Person) and T018 (Article) can run in parallel ✅
- T023 (FAQ) can run in parallel with T017, T018 ✅
- T019-T022 (Article integration) depend on T017, T018
- T024-T026 (FAQ integration) depend on T023

**User Story 3**:

- All tasks sequential (enhance existing Organization schema from US1)

**User Story 4**:

- T033 (LocalBusiness generator) and T034 (YAML data) can run in parallel ✅
- T035, T036 (additional data) can run in parallel ✅
- T037-T039 (integration/testing) depend on T033-T036

### Parallel Opportunities

- **Phase 1**: All tasks can run in parallel (T001-T003 are independent)
- **Phase 2**: T004, T005, T006 can run in parallel ✅ (different files)
- **User Story 1**: T009, T010 can run in parallel ✅
- **User Story 2**: T017, T018, T023 can all run in parallel ✅
- **User Story 4**: T033, T034, T035, T036 can all run in parallel ✅
- **Phase 7**: T040, T041, T044, T045 can all run in parallel ✅

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008) - CRITICAL blocking phase
3. Complete Phase 3: User Story 1 (T009-T016)
4. **STOP and VALIDATE**: Test Organization + BreadcrumbList schemas on all pages
5. Deploy/demo if ready - MVP provides foundation for knowledge graph eligibility

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready (T001-T008)
2. Add User Story 1 → Test independently → Deploy/Demo (T009-T016) 🎯 **MVP!**
3. Add User Story 2 → Test independently → Deploy/Demo (T017-T026) - Featured snippets enabled
4. Add User Story 3 → Test independently → Deploy/Demo (T027-T032) - Knowledge panel enhanced
5. Add User Story 4 → Test independently → Deploy/Demo (T033-T039) - Local search enabled
6. Polish phase → Final validation → Production deployment (T040-T050)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With 2-3 developers:

1. **Phase 1-2**: Team completes Setup + Foundational together (T001-T008)
2. **Phase 3**: Developer A implements User Story 1 (T009-T016)
3. **Phase 4**: Once US1 complete, Developer A moves to User Story 2 (T017-T026), Developer B can start User Story 4 (T033-T039) in parallel
4. **Phase 5**: Developer C implements User Story 3 (T027-T032) in parallel with US2/US4
5. **Phase 7**: Team converges for polish and validation (T040-T050)

**Note**: User Story 2 should complete before User Story 3 starts (US3 enhances US1's Organization schema which US2 depends on).

---

## Validation Checkpoints

After each user story phase:

**User Story 1 Checkpoint**:

- [ ] Run `yarn build` - Builds successfully
- [ ] Run `yarn seo:schema` - Organization and BreadcrumbList validate on all pages
- [ ] Test 3 pages in Google Rich Results Test (homepage, blog index, contact)
- [ ] View source on 3 pages - Verify JSON-LD in `<head>` with both schemas
- [ ] Verify no bundle size increase

**User Story 2 Checkpoint**:

- [ ] Run `yarn build` - Builds successfully
- [ ] Run `yarn seo:schema` - Article and FAQ schemas validate
- [ ] Test 3 blog posts in Google Rich Results Test
- [ ] Test 1 solutions page with FAQ in Google Rich Results Test
- [ ] Verify Person schemas reference correct author data from `authors.yaml`

**User Story 3 Checkpoint**:

- [ ] Run `yarn seo:schema` - Enhanced Organization schema validates
- [ ] Verify founding date, founders, contact points in Organization schema
- [ ] Submit homepage to Schema Markup Validator

**User Story 4 Checkpoint**:

- [ ] Run `yarn seo:schema` - LocalBusiness schema validates
- [ ] Test contact page in Google Rich Results Test
- [ ] Verify NAP data matches `contact-page.yaml`
- [ ] Verify GeoCoordinates and business hours included

**Final Polish Checkpoint**:

- [ ] Run `yarn check:all` - All quality gates pass
- [ ] Run `yarn lighthouse` - Maintain ≥95% on all categories
- [ ] Verify bundle size: First Load JS ~275KB (no increase)
- [ ] Unit tests pass: `yarn test tests/seo/`
- [ ] Manual testing: Follow `quickstart.md` validation steps

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- User Story 1 is MVP - deploy after T016 for immediate value
- User Story 2 enables featured snippets - high ROI, deploy quickly
- User Stories 3 and 4 are enhancements - can be deployed later
- All schemas generated at build time (SSG), zero runtime cost
- JSON-LD format chosen for clean separation from HTML (see research.md)
- Multi-layer validation: TypeScript → JSON Schema → Google Rich Results Test
- Monitor Google Search Console after deployment for rich result indexing status
