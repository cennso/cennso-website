# Tasks: Comprehensive SEO Optimization

**Input**: Design documents from `/specs/001-do-all-possible/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No explicit test tasks included - validation through Lighthouse CI, Python validation scripts, and manual testing with Google tools.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Project uses Next.js Pages Router structure:

- Components: `components/`
- Utilities: `lib/`
- Pages: `pages/`
- Content: `content/`
- Validation scripts: `scripts/`
- Configuration: Root level (next-sitemap.config.js, siteMetadata.js, etc.)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create SEO utility infrastructure and configuration files

- [x] T001 Create `lib/seo/` directory for SEO utility modules
- [x] T002 [P] Create `content/seo-config.yaml` with default SEO configuration (title suffix, OG image defaults, Twitter handle, fallback descriptions)
- [x] T003 [P] Create `scripts/validate-seo.py` skeleton for SEO metadata validation
- [x] T004 [P] Create `scripts/validate-structured-data.py` skeleton for schema.org validation
- [x] T005 [P] Create `scripts/check-internal-links.py` skeleton for internal link auditing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core SEO infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement canonical URL resolver in `lib/seo/canonical.ts` with environment-based URL resolution (NEXT_PUBLIC_SITE_URL)
- [x] T007 Implement meta tag generator in `lib/seo/metaTags.ts` with three-tier fallback (frontmatter > YAML > defaults)
- [x] T008 [P] Create base TypeScript interfaces for SEO entities in `lib/seo/types.ts` (SEOMetadata, OrganizationSchema, ArticleSchema, BreadcrumbListSchema, etc.)
- [x] T009 Enhance `siteMetadata.js` with Organization schema base data (company name, logo URL, social media profiles)
- [x] T010 Create JSON-LD structured data wrapper component in `components/common/SchemaOrg.tsx`
- [x] T011 Enhance existing `components/SEO.tsx` to accept structured data props and render SchemaOrg component
- [x] T012 Add SEO validation scripts to `package.json` (seo:validate, seo:meta, seo:schema, seo:links)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Search Engine Discovery and Indexing (Priority: P1) 🎯 MVP

**Goal**: Enable search engines to discover, crawl, and index all website pages through proper sitemap, robots.txt, canonical URLs, and semantic HTML

**Independent Test**: Submit sitemap to Google Search Console and verify all pages are indexed within 48 hours. Check robots.txt allows proper crawling.

### Implementation for User Story 1

- [x] T013 [P] [US1] Enhance `next-sitemap.config.js` with SEO priorities and change frequencies (homepage: priority 1.0 daily, blog: 0.8 monthly, solutions: 0.9 weekly)
- [x] T014 [P] [US1] Review and optimize `public/robots.txt` with sitemap references and crawl directives (allow all public pages, disallow /\_next/, /api/)
- [x] T015 [US1] Add canonical link tag support to `components/SEO.tsx` using canonical URL resolver from `lib/seo/canonical.ts`
- [x] T016 [US1] Update `pages/index.tsx` to include canonical URL via SEO component
- [x] T017 [US1] Update `pages/about.tsx` to include canonical URL via SEO component
- [x] T018 [US1] Update `pages/contact.tsx` to include canonical URL via SEO component
- [x] T019 [US1] Update `pages/partners.tsx` to include canonical URL via SEO component
- [x] T020 [US1] Update `pages/blog/index.tsx` to include canonical URL via SEO component
- [x] T021 [US1] Update `pages/blog/[blog-post].tsx` to include canonical URL via SEO component
- [x] T022 [US1] Update `pages/success-stories/index.tsx` to include canonical URL via SEO component
- [x] T023 [US1] Update `pages/success-stories/[success-story].tsx` to include canonical URL via SEO component
- [x] T024 [US1] Update `pages/jobs/index.tsx` to include canonical URL via SEO component
- [x] T025 [US1] Update `pages/jobs/[job].tsx` to include canonical URL via SEO component
- [x] T026 [US1] Update `pages/solutions/index.tsx` to include canonical URL via SEO component
- [x] T027 [US1] Update `pages/solutions/[solution].tsx` to include canonical URL via SEO component
- [x] T028 [US1] Implement SEO metadata validation script in `scripts/validate-seo.py` (check title 50-60 chars, description 150-160 chars, canonical URL present)
- [x] T029 [US1] Run `yarn build` and verify sitemap.xml is generated with all pages
- [ ] T030 [US1] Test robots.txt accessibility and validate directives with Google Search Console

**Checkpoint**: At this point, User Story 1 should be fully functional - all pages discoverable via sitemap, crawlable, with proper canonical URLs

---

## Phase 4: User Story 4 - Mobile Search Performance (Priority: P1)

**Goal**: Ensure mobile users experience fast page loads and proper mobile rendering, meeting Core Web Vitals "Good" standards

**Independent Test**: Run Google Mobile-Friendly Test and PageSpeed Insights mobile audit, verify Core Web Vitals scores LCP < 2.5s, FID < 100ms, CLS < 0.1

### Implementation for User Story 4

- [x] T031 [P] [US4] Audit all `<Image>` components to ensure `sizes` prop is present (pages/index.tsx, pages/about.tsx, pages/blog/[blog-post].tsx, etc.)
- [x] T032 [P] [US4] Review image loading strategy and ensure lazy loading for below-the-fold images in all page components
- [x] T033 [US4] Verify mobile viewport meta tag is present in `pages/_document.tsx` (width=device-width, initial-scale=1)
- [x] T034 [US4] Test touch target sizes in navigation components (minimum 48x48 pixels with adequate spacing)
- [x] T035 [US4] Verify font sizes meet minimum 16px base on mobile in `styles/tailwind.css`
- [ ] T036 [US4] Test all pages for horizontal scrolling on mobile viewports (375px, 768px, 1024px)
- [ ] T037 [US4] Run `yarn lighthouse` to verify Performance ≥95% and Core Web Vitals "Good" on mobile
- [ ] T038 [US4] Run Google Mobile-Friendly Test on all major pages and verify 100% pass rate

**Checkpoint**: At this point, User Story 4 should be complete - all pages mobile-optimized with passing Core Web Vitals

---

## Phase 5: User Story 5 - Page Speed and Performance Optimization (Priority: P1)

**Goal**: Achieve Lighthouse Performance ≥95% on desktop and mobile, ensure all pages load in under 3 seconds

**Independent Test**: Run Lighthouse audits showing Performance scores ≥95% and Core Web Vitals passing on both desktop and mobile

### Implementation for User Story 5

- [x] T039 [P] [US5] Verify all images are in WebP format and ≤100KB via `yarn perf:images` script
- [ ] T040 [P] [US5] Review `next.config.js` for proper cache headers and compression settings
- [ ] T041 [US5] Audit JavaScript bundle sizes with `ANALYZE=true yarn build` and identify optimization opportunities
- [x] T042 [US5] Verify code splitting is working for heavy dependencies (framer-motion already dynamically imported)
- [x] T043 [US5] Review TailwindCSS + DaisyUI configuration to ensure only necessary utilities are included
- [ ] T044 [US5] Test browser caching headers for static assets (verify 1 year cache via DevTools Network tab)
- [ ] T045 [US5] Verify gzip/brotli compression is enabled for text content (check response headers)
- [ ] T046 [US5] Run `yarn lighthouse` on desktop and mobile, verify both achieve Performance ≥95%
- [ ] T047 [US5] Measure page load times via PageSpeed Insights (verify < 2s desktop, < 3s mobile)
- [ ] T048 [US5] Test performance on 3G network simulation (Chrome DevTools) to ensure acceptable load times

**Checkpoint**: At this point, User Story 5 should be complete - all pages achieve Lighthouse Performance ≥95% and load within target times

---

## Phase 6: User Story 2 - Rich Search Results with Structured Data (Priority: P2)

**Goal**: Implement schema.org structured data (JSON-LD) for rich snippets in search results (Organization, Article, BreadcrumbList, LocalBusiness, JobPosting)

**Independent Test**: Validate structured data with Google Rich Results Test and monitor Search Console for rich result impressions

### Implementation for User Story 2

- [ ] T049 [P] [US2] Implement Organization schema builder in `lib/seo/structuredData.ts` (generateOrganizationSchema function)
- [ ] T050 [P] [US2] Implement Article schema builder in `lib/seo/structuredData.ts` (generateArticleSchema function)
- [ ] T051 [P] [US2] Implement BreadcrumbList schema builder in `lib/seo/structuredData.ts` (generateBreadcrumbSchema function)
- [ ] T052 [P] [US2] Implement LocalBusiness schema builder in `lib/seo/structuredData.ts` (generateLocalBusinessSchema function)
- [ ] T053 [P] [US2] Implement JobPosting schema builder in `lib/seo/structuredData.ts` (generateJobPostingSchema function)
- [ ] T054 [P] [US2] Implement Service schema builder in `lib/seo/structuredData.ts` (generateServiceSchema function)
- [ ] T055 [US2] Add Organization schema to `pages/_document.tsx` (global schema for all pages)
- [ ] T056 [US2] Add Article schema to `pages/blog/[blog-post].tsx` with author, datePublished, dateModified, image properties
- [ ] T057 [US2] Add Article schema to `pages/success-stories/[success-story].tsx` with relevant business information
- [ ] T058 [US2] Add BreadcrumbList schema to all pages via `components/PageHeader.tsx` integration (use existing breadcrumbs prop)
- [ ] T059 [US2] Add LocalBusiness schema to `pages/contact.tsx` with address, telephone, geo coordinates from content
- [ ] T060 [US2] Add JobPosting schema to `pages/jobs/[job].tsx` with position title, description, datePosted, employmentType
- [ ] T061 [US2] Add Service schema to `pages/solutions/[solution].tsx` with service name, description, provider information
- [ ] T062 [US2] Implement structured data validation in `scripts/validate-structured-data.py` (check JSON validity, required properties, URL formats, date formats)
- [ ] T063 [US2] Run `yarn seo:schema` to validate all structured data locally
- [ ] T064 [US2] Test all structured data with Google Rich Results Test (https://search.google.com/test/rich-results)
- [ ] T065 [US2] Verify zero structured data errors in validation reports

**Checkpoint**: At this point, User Story 2 should be complete - all pages have proper structured data, validated and ready for rich results

---

## Phase 7: User Story 3 - Social Media Preview Optimization (Priority: P2)

**Goal**: Implement Open Graph and Twitter Card meta tags for attractive social media sharing previews

**Independent Test**: Share links on LinkedIn, Twitter, and Facebook and verify preview cards display correctly with custom images and descriptions

### Implementation for User Story 3

- [ ] T066 [P] [US3] Enhance OG image generation script in `scripts/generate-og-images/` to support blog post thumbnails (cover image + title overlay)
- [ ] T067 [P] [US3] Enhance OG image generation script to support success story images (client logo + metrics overlay)
- [ ] T068 [US3] Add Open Graph meta tags to `components/SEO.tsx` (og:title, og:description, og:image, og:url, og:type)
- [ ] T069 [US3] Add Twitter Card meta tags to `components/SEO.tsx` (twitter:card, twitter:title, twitter:description, twitter:image, twitter:site)
- [ ] T070 [US3] Add article:published_time and article:modified_time to `pages/blog/[blog-post].tsx`
- [ ] T071 [US3] Add article:author meta tags to `pages/blog/[blog-post].tsx` using author data from `content/authors.yaml`
- [ ] T072 [US3] Generate unique OG images for all blog posts via `yarn build` (verify images in `public/assets/og-images/`)
- [ ] T073 [US3] Generate unique OG images for all success stories via `yarn build`
- [ ] T074 [US3] Test social media previews with Facebook Sharing Debugger (https://developers.facebook.com/tools/debug/)
- [ ] T075 [US3] Test social media previews with Twitter Card Validator (https://cards-dev.twitter.com/validator)
- [ ] T076 [US3] Test LinkedIn preview by sharing a test link and verifying custom image + description appear
- [ ] T077 [US3] Verify all OG images are 1200x630px and display correctly across all platforms

**Checkpoint**: At this point, User Story 3 should be complete - all pages have attractive social media previews across LinkedIn, Twitter, and Facebook

---

## Phase 8: User Story 7 - Content Discoverability Through Internal Linking (Priority: P2)

**Goal**: Implement strategic internal linking to help search engines discover and understand site content hierarchy

**Independent Test**: Analyze crawl depth in Google Search Console and verify all important pages are within 3 clicks of homepage

### Implementation for User Story 7

- [ ] T078 [P] [US7] Implement related content finder in `lib/seo/relatedContent.ts` (findRelatedPosts function matching by category and tags)
- [ ] T079 [US7] Add "Related Posts" section to `pages/blog/[blog-post].tsx` using relatedContent utility (display 3-5 related posts)
- [ ] T080 [US7] Add "Related Stories" section to `pages/success-stories/[success-story].tsx` using similar logic
- [ ] T081 [US7] Review homepage (`pages/index.tsx`) internal links to ensure important pages (services, solutions, about) are linked
- [ ] T082 [US7] Review navigation component (`components/Navigation.tsx`) to ensure all important pages are accessible
- [ ] T083 [US7] Add contextual internal links to blog posts referencing relevant solutions/services (manual editorial task)
- [ ] T084 [US7] Add contextual internal links from success stories to related solutions (manual editorial task)
- [ ] T085 [US7] Implement internal link checker in `scripts/check-internal-links.py` (verify no broken links, no redirect chains)
- [ ] T086 [US7] Run `yarn seo:links` to audit all internal links
- [ ] T087 [US7] Fix any broken internal links discovered by validation
- [ ] T088 [US7] Test crawl depth in Google Search Console (verify all pages within 3 clicks of homepage)

**Checkpoint**: At this point, User Story 7 should be complete - strategic internal linking in place, all pages discoverable within 3 clicks

---

## Phase 9: User Story 6 - Local SEO Optimization (Priority: P3)

**Goal**: Optimize for local search results with proper business information, location data, and LocalBusiness structured data

**Independent Test**: Search for "[company name] + [location]" in Google and verify local pack appearance with correct business details

### Implementation for User Story 6

- [ ] T089 [US6] Enhance LocalBusiness schema in `pages/contact.tsx` with complete NAP information (Name, Address, Phone)
- [ ] T090 [US6] Add GeoCoordinates to LocalBusiness schema in `pages/contact.tsx` (latitude, longitude)
- [ ] T091 [US6] Add OpeningHoursSpecification to LocalBusiness schema in `pages/contact.tsx` (business hours)
- [ ] T092 [US6] Add priceRange indicator to LocalBusiness schema if applicable
- [ ] T093 [US6] Ensure NAP (Name, Address, Phone) consistency across all pages (homepage, contact, footer)
- [ ] T094 [US6] Add location-specific keywords to meta descriptions for location-targeted pages
- [ ] T095 [US6] Test local search results by searching "[company name] + [city]" in Google
- [ ] T096 [US6] Verify business appears in Google Maps with correct information
- [ ] T097 [US6] Validate LocalBusiness schema with Google Rich Results Test

**Checkpoint**: At this point, User Story 6 should be complete - local SEO optimized with proper structured data and consistent NAP information

---

## Phase 10: User Story 8 - Semantic SEO and Topical Authority (Priority: P3)

**Goal**: Establish topical authority through semantic HTML, topic clustering, and comprehensive content coverage

**Independent Test**: Monitor rankings for topic-cluster keywords and measure search visibility improvements for related terms

### Implementation for User Story 8

- [ ] T098 [P] [US8] Audit all pages for semantic HTML5 elements (header, nav, main, article, aside, footer) in page components
- [ ] T099 [P] [US8] Ensure proper heading hierarchy (H1 → H2 → H3) without skipping levels across all pages
- [ ] T100 [US8] Verify each page has single H1 heading with primary keywords in page components
- [ ] T101 [US8] Review blog post taxonomy and ensure topic clustering via categories and tags in `content/blog-posts/`
- [ ] T102 [US8] Add semantic keywords to content (editorial task - identify industry terminology to incorporate)
- [ ] T103 [US8] Create content pillar pages for main topic areas (editorial task - comprehensive guides linking to related posts)
- [ ] T104 [US8] Implement topic cluster visualization in blog navigation to show content relationships
- [ ] T105 [US8] Add FAQ schema to relevant pages if question-based content exists (optional enhancement)
- [ ] T106 [US8] Monitor topical authority metrics in Google Search Console (track rankings for long-tail variations)

**Checkpoint**: At this point, User Story 8 should be complete - semantic HTML in place, topic clusters established, foundation for topical authority built

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements that affect multiple user stories and ensure production readiness

- [ ] T107 [P] Update `AGENTS.md` with SEO implementation patterns and validation commands
- [ ] T108 [P] Create SEO troubleshooting guide in `specs/001-do-all-possible/quickstart.md` (already exists, review and enhance)
- [ ] T109 Add comprehensive SEO validation to CI/CD pipeline in `.github/workflows/` (run seo:validate, seo:schema, seo:links on PR)
- [ ] T110 [P] Document Google Search Console integration steps in `docs/` or `README.md`
- [ ] T111 [P] Document Vercel Analytics Core Web Vitals monitoring in `docs/` or `README.md`
- [ ] T112 Run full Lighthouse audit (desktop + mobile) on all major pages and verify all ≥95%
- [ ] T113 Run `yarn check:all` to ensure all quality gates pass (format, lint, a11y, build)
- [ ] T114 Submit sitemap to Google Search Console and verify indexing starts
- [ ] T115 Monitor Google Search Console for any errors or warnings (week 1 post-deployment)
- [ ] T116 Set up Core Web Vitals monitoring alerts in Vercel Analytics
- [ ] T117 Validate all success criteria from spec.md are testable and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - Critical for SEO foundation
- **User Story 4 (Phase 4)**: Depends on Foundational - Can run in parallel with US1, US5
- **User Story 5 (Phase 5)**: Depends on Foundational - Can run in parallel with US1, US4
- **User Story 2 (Phase 6)**: Depends on Foundational - Can run after P1 stories, in parallel with US3, US7
- **User Story 3 (Phase 7)**: Depends on Foundational - Can run in parallel with US2, US7
- **User Story 7 (Phase 8)**: Depends on Foundational - Can run in parallel with US2, US3
- **User Story 6 (Phase 9)**: Depends on US2 (LocalBusiness schema) - P3 priority
- **User Story 8 (Phase 10)**: Depends on Foundational - P3 priority, can run independently
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### Priority-Based Execution Order

**P1 Stories (Critical - Must Complete First)**:

1. User Story 1: Search Engine Discovery and Indexing (Phase 3)
2. User Story 4: Mobile Search Performance (Phase 4)
3. User Story 5: Page Speed and Performance Optimization (Phase 5)

**P2 Stories (Important - Complete After P1)**: 4. User Story 2: Rich Search Results with Structured Data (Phase 6) 5. User Story 3: Social Media Preview Optimization (Phase 7) 6. User Story 7: Content Discoverability Through Internal Linking (Phase 8)

**P3 Stories (Nice to Have - Complete Last)**: 7. User Story 6: Local SEO Optimization (Phase 9) 8. User Story 8: Semantic SEO and Topical Authority (Phase 10)

### User Story Independence

- **User Story 1 (P1)**: Fully independent - can start after Foundational
- **User Story 4 (P1)**: Fully independent - can start after Foundational
- **User Story 5 (P1)**: Fully independent - can start after Foundational
- **User Story 2 (P2)**: Fully independent - can start after Foundational
- **User Story 3 (P2)**: Fully independent - can start after Foundational
- **User Story 7 (P2)**: Fully independent - can start after Foundational
- **User Story 6 (P3)**: Depends on US2 for LocalBusiness schema - start after US2
- **User Story 8 (P3)**: Fully independent - can start after Foundational

### Parallel Opportunities

- **After Foundational Phase**: All P1 stories (US1, US4, US5) can run in parallel
- **After P1 Complete**: All P2 stories (US2, US3, US7) can run in parallel
- **Within Each Story**: Tasks marked [P] can run in parallel (different files, no dependencies)

---

## Parallel Example: User Story 1

```bash
# Launch sitemap and robots.txt tasks together:
Task T013: "Enhance next-sitemap.config.js with SEO priorities"
Task T014: "Review and optimize public/robots.txt"

# Launch all page canonical URL updates together (different files):
Task T016: "Update pages/index.tsx canonical URL"
Task T017: "Update pages/about.tsx canonical URL"
Task T018: "Update pages/contact.tsx canonical URL"
Task T019: "Update pages/partners.tsx canonical URL"
# ... etc for all pages
```

## Parallel Example: User Story 2

```bash
# Launch all schema builder implementations together (different functions in same file):
Task T049: "Implement Organization schema builder"
Task T050: "Implement Article schema builder"
Task T051: "Implement BreadcrumbList schema builder"
Task T052: "Implement LocalBusiness schema builder"
Task T053: "Implement JobPosting schema builder"
Task T054: "Implement Service schema builder"
```

---

## Implementation Strategy

### MVP First (P1 Stories Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Search Engine Discovery)
4. Complete Phase 4: User Story 4 (Mobile Performance)
5. Complete Phase 5: User Story 5 (Page Speed)
6. **STOP and VALIDATE**: Test P1 stories independently
7. Deploy/demo if ready

**MVP Validation**:

- All pages indexed in Google Search Console
- Lighthouse Performance ≥95% on desktop AND mobile
- Core Web Vitals "Good" on all pages
- Mobile-Friendly Test passes 100%

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add P1 Stories (US1, US4, US5) → Test independently → Deploy (MVP!)
3. Add P2 Stories (US2, US3, US7) → Test independently → Deploy
4. Add P3 Stories (US6, US8) → Test independently → Deploy
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With 3 developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Search Engine Discovery)
   - Developer B: User Story 4 (Mobile Performance)
   - Developer C: User Story 5 (Page Speed)
3. After P1 complete:
   - Developer A: User Story 2 (Structured Data)
   - Developer B: User Story 3 (Social Media)
   - Developer C: User Story 7 (Internal Linking)
4. After P2 complete:
   - Developer A: User Story 6 (Local SEO)
   - Developer B: User Story 8 (Semantic SEO)
   - Developer C: Polish & Documentation

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] labels**: Map tasks to specific user stories for traceability
- **No explicit test tasks**: Validation through Lighthouse CI, Python scripts, Google tools
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `yarn check:all` before each commit
- Run `yarn lighthouse` after completing performance-related stories
- **Critical**: Maintain Lighthouse ≥95% on ALL categories (Performance, Accessibility, Best Practices, SEO) for BOTH desktop AND mobile throughout implementation

## Total Task Count: 117 tasks

**By User Story**:

- Setup: 5 tasks
- Foundational: 7 tasks
- User Story 1 (P1): 18 tasks
- User Story 4 (P1): 8 tasks
- User Story 5 (P1): 10 tasks
- User Story 2 (P2): 17 tasks
- User Story 3 (P2): 12 tasks
- User Story 7 (P2): 11 tasks
- User Story 6 (P3): 9 tasks
- User Story 8 (P3): 9 tasks
- Polish: 11 tasks

**Parallel Opportunities**: 45 tasks marked [P] can run in parallel (38% of total)

**MVP Scope**: Setup + Foundational + User Stories 1, 4, 5 (P1 only) = 48 tasks
