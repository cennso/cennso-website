<!--
Sync Impact Report:
- Version: Initial → 1.0.0 → 1.1.0 → 1.2.0 → 1.3.0 → 1.4.0 → 1.5.0 → 1.6.0 → 1.7.0 → 1.8.0 → 1.9.0 → 2.0.0 → 2.1.0 → 2.2.0 → 2.3.0 → 2.4.0 → 2.5.0 → 2.6.0 → 2.6.1 → 2.7.0
- Changes in v1.1.0:
  - Testing Policy expanded with specific technology stack (Playwright, Vitest, React Testing Library)
  - Test organization requirements added
  - Coverage targets specified
- Changes in v1.2.0:
  - Principle V (Accessibility Standards) significantly expanded
  - Added: Keyboard navigation details, ARIA best practices, dynamic content guidelines
  - Added: Media accessibility (captions, reduced motion), form error handling
  - Added: Specific testing tools (axe-core, Lighthouse, screen readers)
  - Enhanced contrast requirements with specific ratios and legal context
- Changes in v1.3.0:
  - Principle V (Accessibility Standards) enhanced with automated contrast validation
  - Added: Automated WCAG 2.1 AA contrast checking requirement (yarn a11y:contrast)
  - Added: Automated text alternatives validation (yarn a11y:text-alternatives)
  - Added: Comprehensive text alternatives guidelines for all non-text content
  - Added: Specific requirements for SVG icons, decorative elements, and interactive buttons
  - Quality Gates expanded to include accessibility validation
  - Content Management Standards updated with text alternative requirements
- Changes in v1.4.0:
  - Principle V (Accessibility Standards) expanded with time-based media requirements
  - Added: Comprehensive WCAG 1.2 (Time-based Media) guidelines
  - Added: Requirements for captions, audio descriptions, and transcripts
  - Added: Live media captioning requirements (Level AA)
  - Added: Auto-play restrictions and keyboard control requirements
  - Documentation: Created accessibility-time-based-media.md with implementation patterns
- Changes in v1.5.0:
  - Principle V (Accessibility Standards) expanded with semantic structure requirements
  - Added: Comprehensive WCAG 1.3 (Adaptable) guidelines for semantic HTML
  - Added: Automated semantic structure validation (yarn a11y:semantic)
  - Added: Heading hierarchy requirements (h1→h2→h3, exactly one h1 per page)
  - Added: Landmark elements requirements (<main>, <nav>, <footer>)
  - Added: Form label association and table header requirements
  - Quality Gates expanded to include semantic structure validation
  - All a11y scripts consolidated under `yarn a11y` command
- Changes in v1.6.0:
  - Principle V (Accessibility Standards) expanded with comprehensive Distinguishable requirements
  - Added: Automated distinguishable content validation (yarn a11y:distinguishable)
  - Added: Complete WCAG 1.4 (Distinguishable) guidelines beyond contrast
  - Added: Use of Color, Resize Text, Images of Text, Reflow, Text Spacing requirements
  - Added: Non-text Contrast and Audio Control validation
  - Quality Gates expanded to include distinguishable content validation
  - All a11y scripts consolidated under `yarn a11y` command
- Changes in v1.7.0:
  - Principle V (Accessibility Standards) expanded with comprehensive Keyboard Accessible requirements
  - Added: Automated keyboard accessibility validation (yarn a11y:keyboard)
  - Added: Complete WCAG 2.1 Guideline 2.1 (Keyboard Accessible) requirements
  - Added: Keyboard (SC 2.1.1), No Keyboard Trap (SC 2.1.2), Character Key Shortcuts (SC 2.1.4)
  - Enhanced existing "Keyboard & Navigation" section with detailed WCAG 2.1 requirements
  - Added: Skip links, focus management, tab order, and escape mechanisms
  - Quality Gates expanded to include keyboard accessibility validation
  - All a11y scripts consolidated under `yarn a11y` command
- Changes in v1.8.0:
  - Principle V (Accessibility Standards) expanded with comprehensive Enough Time requirements
  - Added: Automated enough time validation (yarn a11y:enough-time)
  - Added: Complete WCAG 2.1 Guideline 2.2 (Enough Time) requirements
  - Added: Timing Adjustable (SC 2.2.1), Pause, Stop, Hide (SC 2.2.2)
  - Added: Guidelines for session timeouts, auto-playing content, and moving elements
  - Quality Gates expanded to include enough time validation
  - All a11y scripts consolidated under `yarn a11y` command
- Changes in v1.9.0:
  - Principle V (Accessibility Standards) expanded with comprehensive Seizures requirements
  - Added: Automated seizures and physical reactions validation (yarn a11y:seizures)
  - Added: Complete WCAG 2.1 Guideline 2.3 (Seizures and Physical Reactions) requirements
  - Added: Three Flashes or Below Threshold (SC 2.3.1 - Level A)
  - Added: Animation from Interactions/Reduced Motion support (SC 2.3.3 - Level AAA best practice)
  - Enhanced: Added prefers-reduced-motion media query to tailwind.css for all animations
  - Quality Gates expanded to include seizures validation
  - All a11y scripts consolidated under `yarn a11y` command
- Changes in v2.0.0 (MAJOR):
  - **MILESTONE: Complete WCAG 2.1 Principle 2 (Operable) automated validation**
  - Principle V (Accessibility Standards) expanded with comprehensive Navigable requirements
  - Added: Automated navigable validation (yarn a11y:navigable)
  - Added: Complete WCAG 2.1 Guideline 2.4 (Navigable) requirements (SC 2.4.1-2.4.7)
  - Added: Bypass Blocks, Page Titled, Focus Order, Link Purpose, Multiple Ways, Headings and Labels, Focus Visible
  - Fixed: Breadcrumbs home icon link now has aria-label="Home"
  - Quality Gates expanded to include navigable validation
  - All a11y scripts consolidated under `yarn a11y` command
  - WCAG 2.1 Coverage: ~75-80% of Level AA automated (Perceivable + Operable complete)
  - EN 301 549 Compliance: Sections 9.1 (Perceivable) and 9.2 (Operable) fully validated
- Changes in v2.1.0 (MINOR):
  - Principle V (Accessibility Standards) expanded with Input Modalities requirements
  - Added: Automated input modalities validation (yarn a11y:input-modalities)
  - Added: Complete WCAG 2.1 Guideline 2.5 (Input Modalities) requirements (SC 2.5.1-2.5.6)
  - Added: Pointer Gestures, Pointer Cancellation, Label in Name, Motion Actuation validation
  - Added: Level AAA best practices - Target Size (≥44×44px), Concurrent Input Mechanisms
  - Quality Gates expanded to include input modalities validation
  - All a11y scripts consolidated under `yarn a11y` command
  - WCAG 2.1 Principle 2 (Operable): Complete with all 5 guidelines automated
  - EN 301 549 Section 9.2.5 (Input Modalities): COMPLIANT
- Changes in v2.2.0 (MINOR):
  - **MILESTONE: Begin WCAG 2.1 Principle 3 (Understandable) automated validation**
  - Principle V (Accessibility Standards) expanded with Readable requirements
  - Added: Automated readable validation (yarn a11y:readable)
  - Added: Complete WCAG 2.1 Guideline 3.1 (Readable) requirements (SC 3.1.1-3.1.6)
  - Added: Language of Page validation (lang attribute in _document.tsx)
  - Added: Language of Parts validation (foreign language passages)
  - Added: Level AAA informational best practices - Unusual Words, Abbreviations, Reading Level, Pronunciation
  - Quality Gates expanded to include readable validation
  - All a11y scripts consolidated under `yarn a11y` command
  - WCAG 2.1 Principle 3 (Understandable): 1 of 3 guidelines automated
  - EN 301 549 Section 9.3.1 (Readable): COMPLIANT
  EN 301 549 Section 9.3.1 (Readable): COMPLIANT
- Principles Modified: V. Accessibility Standards (complete Input Modalities, add Readable - MINOR version bump)
Principles Modified: V. Accessibility Standards (complete Input Modalities, add Readable - MINOR version bump)
Changes in v2.3.0 (MINOR):
  - Added: Automated predictable validation (yarn a11y:predictable)
  - Added: Complete WCAG 2.1 Guideline 3.2 (Predictable) validation (SC 3.2.1-3.2.4)
  - Added: Level AAA informational guidance (Change on Request - SC 3.2.5)
  - Quality Gates expanded to include predictable validation
  - Changes in v2.4.0 (MINOR):
    - Added: Automated input assistance validation (yarn a11y:input-assistance)
    - Added: Complete WCAG 2.1 Guideline 3.3 (Input Assistance) validation (SC 3.3.1-3.3.4)
    - Quality Gates expanded to include input assistance validation
    - WCAG 2.1 Principle 3 (Understandable): 3 of 3 guidelines automated (Principle 3 complete)
  - Changes in v2.5.0 (MINOR):
    - Added: Automated compatible validation (yarn a11y:compatible)
    - Added: Complete WCAG 2.1 Guideline 4.1 (Compatible) validation (SC 4.1.2 Name, Role, Value; SC 4.1.3 Status Messages)
    - Quality Gates expanded to include compatible validation
    - WCAG 2.1 Principle 4 (Robust): Automated validation complete
  - Changes in v2.6.0 (MINOR):
    - SEO Standards: Comprehensive SEO metadata requirements added
    - Added: Title requirements (50-60 chars, unique across pages)
    - Added: Description requirements (150-160 chars, unique across pages)
    - Added: Canonical URL requirements
    - Added: Automated SEO metadata validation (yarn seo:validate)
    - Added: Schema.org structured data validation (yarn seo:schema)
    - Added: Internal links validation (yarn seo:links)
    - Quality Gates: Updated check:all command to include seo validation
  - Changes in v2.6.1 (PATCH):
    - Accessibility: Added autocomplete attribute validation (yarn a11y:autocomplete)
    - Added: WCAG 2.1 SC 1.3.5 (Identify Input Purpose) compliance enforcement
    - Added: HTML spec validation for autocomplete tokens (tel, email, given-name, etc.)
    - Added: Common mistakes detection (phone→tel, firstname→given-name, etc.)
    - Quality Gates: All accessibility checks now include autocomplete validation
  - Changes in v2.7.0 (MINOR):
    - Performance: OG image generation improvements and validation
    - Added: PNG optimization with sharp (~70% file size reduction)
    - Added: Adaptive font sizing for OG images (prevents text overflow)
    - Added: Automated OG image validation (yarn validate:ogimages)
    - Fixed: OG image path resolution bug (images now save to correct directory)
    - Fixed: Deprecated fs.rmdir → fs.rm
    - Quality Gates: check:all now includes OG image validation
    - Documentation: Created docs/validate-og-images.md validation guide
      - Quality Gates expanded to include compatible validation
      - Requirement: `yarn a11y:compatible` MUST pass (no Level A issues) before merging to main
- Changes in v2.6.0 (MINOR):
  - **MILESTONE: SEO Standards Added**
  - Added: New Principle VI - SEO Standards
  - Added: Title requirements (50-60 characters, unique, no duplicates)
  - Added: Description requirements (150-160 characters, unique, no duplicates)
  - Added: Canonical URL requirements
  - Added: Automated SEO validation (yarn seo:validate)
  - Added: BeautifulSoup4 dependency for HTML parsing
  - Quality Gates expanded to include SEO validation (new gate #6)
  - Updated check:all command to include seo validation
  - CI/CD enforcement: yarn seo:validate blocks merge on errors
  - Principles Modified: New Principle VI added (MINOR version bump)
- Changes in v2.6.1 (PATCH):
  - Enhanced: Input Assistance (WCAG 2.1 Guideline 3.3) with autocomplete validation
  - Added: Automated autocomplete validation (yarn a11y:autocomplete)
  - Added: WCAG 2.1 SC 1.3.5 (Identify Input Purpose) requirements and common corrections
  - Fixed: Phone input autocomplete changed from "phone" to "tel" (HTML spec compliance)
  - Fixed: axe rule autocomplete-valid violations in ContactForm and JobForm
  - Quality Gates expanded to include autocomplete validation (12th a11y check)
  - All a11y scripts consolidated under `yarn a11y` command
  - Principles Modified: V. Accessibility Standards (PATCH - clarification/enhancement)
- Templates Status:
  ✅ plan-template.md - accessibility requirements now enforceable in specs
  ✅ spec-template.md - acceptance criteria can reference specific a11y checks
  ✅ tasks-template.md - accessibility tasks now have concrete requirements
  ⚠ agent-file-template.md - exists but contains specify-specific guidance, no updates needed
- Follow-up: Semantic validation integrated, runs automatically in CI/CD
-->

# Cennso Website Constitution

## Core Principles

### I. Code Quality & Type Safety

All code MUST meet these non-negotiable standards:

- TypeScript MUST be used with strict mode enabled (`strict: true` in tsconfig.json)
- ESLint MUST pass without errors (`yarn lint` returns exit code 0)
- Prettier MUST be enforced for consistent formatting (`yarn format` checks)
- No `any` types unless explicitly justified in code comments with `// @ts-expect-error` explanation
- All public functions and components MUST have explicit return type annotations
- All exported interfaces and types MUST be properly documented

**Rationale**: Type safety prevents runtime errors, improves IDE support, and makes refactoring safer. Consistent formatting reduces cognitive load and merge conflicts.

### II. Component Architecture & Reusability

React components MUST follow these architectural patterns:

- Components organized by feature in `/components/[Feature]` or shared in `/components/common`
- Each component file contains ONE primary component (helper components allowed in same file if tightly coupled)
- Props interfaces MUST be explicitly typed and exported when component is exported
- Business logic MUST be extracted to `/lib` utilities or React contexts in `/contexts`
- No direct data fetching in components; use `getStaticProps` at page level
- Shared UI components in `/components/common` MUST be framework-agnostic (no page-specific logic)

**Rationale**: Clear separation of concerns enables independent testing, reuse across features, and easier maintenance. Next.js SSG pattern requires data fetching at build time.

### III. User Experience Consistency

All user-facing features MUST maintain consistent experience:

- Design system: TailwindCSS + DaisyUI components MUST be used; no inline styles or CSS modules
- Responsive design MUST support mobile (375px), tablet (768px), and desktop (1024px+) breakpoints
- Navigation MUST be consistent across all pages via `createNavigation()` from `lib/navigation.ts`
- SEO metadata MUST be present on every page using `<SEO>` component with title, description, and OG image
- All images MUST use Next.js `<Image>` component with proper width/height and alt text
- Loading states MUST be shown for async operations (forms, data fetching)

**Rationale**: Consistent UX reduces user confusion, improves accessibility, and reinforces brand identity. SEO is critical for discoverability.

### IV. Performance & Build Optimization

Performance requirements that MUST be met:

- All pages MUST use Static Site Generation (SSG) via `getStaticProps` - no client-side data fetching for content
- Images MUST be optimized:
  - WebP format preferred (maximum 100KB per image, validated by `yarn perf:images`)
  - **All Next.js `<Image>` components MUST have `sizes` prop** to enable responsive optimization
  - `sizes` prop MUST reflect actual rendered dimensions at different breakpoints
  - Examples:
    - Fixed size: `sizes="150px"` (avatars, icons)
    - Responsive: `sizes="(max-width: 768px) 100vw, 50vw"` (hero images)
    - Hidden on mobile: `sizes="(max-width: 768px) 0px, (max-width: 1024px) 45vw, 33vw"` (blog cards)
  - `next.config.js` MUST configure image optimization (deviceSizes, imageSizes, formats)
- **CSS Optimization**:
  - DaisyUI MUST be configured to include only used utilities (`styled: false`, `base: false`, `utils: true`)
  - Only mask-hexagon-2 utility is needed from DaisyUI (reduces CSS by ~6KB)
  - Tailwind purge MUST be configured to scan all component files
  - Critical classes MUST be safelisted in `tailwind.config.js`
- **JavaScript Optimization**:
  - Bundle size: No single page bundle > 500KB (analyze with `next build`)
  - Heavy dependencies MUST be dynamically imported to enable code-splitting
  - Navigation component uses `dynamic()` import to code-split framer-motion (~60KB savings)
  - Page transition animations removed from `_app.tsx` for performance (minimal UX trade-off)
- **Lighthouse MUST score ≥95% on ALL categories**:
  - Performance (Page speed, optimization)
  - Accessibility (WCAG 2.1 AA compliance)
  - Best Practices (Security, standards compliance)
  - SEO (Search engine optimization)
- All PRs MUST pass Lighthouse audits with ≥95% scores (enforced by `.github/workflows/lighthouse.yml`)
- Local testing: `yarn dev` + `yarn lighthouse` before submitting PR
- OG images MUST be auto-generated during build (via `prebuild` script)
  - Dimensions: 1200×630px (optimal for Facebook, Twitter, LinkedIn)
  - Format: PNG with sharp optimization (~70% size reduction)
  - File size: <300KB per image (validated by `yarn validate:ogimages`)
  - Adaptive font sizing based on content length to prevent overflow
  - Generated from page metadata (title, description) in `scripts/generate-og-images/`
- No blocking JavaScript on initial page load; use dynamic imports for heavy components
- Image optimization validated via `yarn perf:images` - all raster images must be WebP format and under 100KB

**Rationale**: Static generation provides fastest load times and best SEO. Lighthouse ≥95% ensures consistent performance, accessibility, and best practices across all pages. The `sizes` prop tells Next.js which image size to serve based on viewport, preventing oversized images from being downloaded (e.g., serving 116KB when 54KB would suffice). CSS and JavaScript optimizations reduce bundle sizes (CSS: 33.5KB → 27.9KB, JS: 339KB → 275KB, ~70KB total savings). Performance directly impacts user retention and search rankings. Automated enforcement on PRs prevents regressions.

### V. Accessibility Standards (WCAG 2.1 AA)

Accessibility MUST be implemented from the start, not retrofitted:

### VI. SEO Standards

All pages MUST have optimized metadata for search engine discoverability:

**Title Requirements:**

- All pages MUST have unique, descriptive titles
- Title length MUST be 50-60 characters (optimal for search results)
- Titles MUST NOT be duplicated across pages
- Titles come from:
  - YAML files: `page.title` property (e.g., `content/contact-page.yaml`)
  - MDX frontmatter: `title` property (e.g., blog posts, success stories)
  - Page components: `title` prop passed to `<SEO>` component
- Format: Use descriptive title directly (no concatenation with site name)
- Examples:
  - ✅ "Contact Cennso - Mobile Core Network Solutions & Support" (51 chars)
  - ❌ "Contact us" (10 chars - too short)
  - ❌ "Contact us | Cennso Mobile Core Network Solutions" (87 chars - too long)

**Description Requirements:**

- All pages MUST have unique, descriptive meta descriptions
- Description length MUST be 150-160 characters (optimal for search snippets)
- Descriptions MUST NOT be duplicated across pages
- Descriptions come from:
  - YAML files: `page.description` property
  - MDX frontmatter: `excerpt` property
  - Page components: `description` prop passed to `<SEO>` component
- Content: Summarize page purpose, include relevant keywords naturally
- Examples:
  - ✅ "Get in touch with Cennso's Solution and Channel Partners. Learn how we can help you build custom mobile core network solutions for your business needs." (151 chars)
  - ❌ "Contact us to learn more." (26 chars - too short)
  - ❌ "Contact us to learn more about our mobile core network solutions, consulting services, partnership opportunities, and how we can help your business." (182 chars - too long)

**Canonical URL Requirements:**

- All pages MUST have canonical URL meta tag
- Format: `<link rel="canonical" href="https://www.cennso.com/page-path" />`
- Handled automatically by `<SEO>` component
- Prevents duplicate content issues

**Implementation:**

- Use `<SEO title="..." description="..." />` component on all pages
- SEO component location: `components/SEO.tsx`
- Component handles: title tag, meta description, canonical URL, Open Graph tags
- Built HTML location: `.next/server/pages/*.html` (minified)

**Validation:**

- Automated validation: `yarn seo:validate` MUST pass
- Validates: Title length (50-60 chars), description length (150-160 chars), canonical URLs
- Detects: Duplicate titles, duplicate descriptions, missing metadata
- Scans: All built HTML files in `.next/server/pages/` (excludes auto-generated 500.html)
- Dependencies: BeautifulSoup4 (defined in `scripts/requirements.txt`)
- Script location: `scripts/validate-seo.py`
- CI/CD enforcement: Exit code 1 on errors (blocks merge)

**Rationale**: SEO metadata is critical for search engine rankings and click-through rates. Titles and descriptions are the first impression users see in search results. Optimal character lengths maximize visibility in search snippets without truncation. Unique content prevents duplicate content penalties. Canonical URLs prevent indexing issues.

**Keyboard Accessible (WCAG 2.1 Guideline 2.1 - EN 301 549 Section 9.2.1):**

**Keyboard (WCAG 2.1 SC 2.1.1 - Level A):**

- All functionality MUST be operable through keyboard alone (no mouse required)
- Interactive elements MUST be keyboard accessible: buttons, links, forms, controls, menus
- Skip links MUST be provided to bypass repetitive navigation ("Skip to main content")
- Custom interactive components MUST have keyboard event handlers (onKeyDown/onKeyPress)
- onClick handlers on non-semantic elements (div/span) MUST include keyboard handler or use role="button"
- Tab order MUST be logical and follow visual flow (avoid positive tabIndex values)
- Focus states MUST be visible on all interactive elements (≥3:1 contrast against adjacent colors)
- **Automated**: `yarn a11y:keyboard` validates keyboard handler patterns

**No Keyboard Trap (WCAG 2.1 SC 2.1.2 - Level A):**

- Users MUST be able to move focus away from any component using only keyboard
- Modals/dialogs MUST allow closing via Escape key
- Focus trapping in modals is acceptable IF user can exit with standard keys (Escape, Tab to close button)
- Positive tabIndex values MUST be avoided (they create unpredictable tab order)
- event.preventDefault() on keyboard events MUST allow Escape key to work
- **Automated**: `yarn a11y:keyboard` validates keyboard trap patterns

**Character Key Shortcuts (WCAG 2.1 SC 2.1.4 - Level A):**

- Single character keyboard shortcuts (e.g., pressing 's' to search) MUST:
  - Require a modifier key (Ctrl/Alt/Cmd), OR
  - Be turn-off-able by the user, OR
  - Only be active when component has focus
- Single letter shortcuts without modifiers interfere with screen readers and typing
- **Automated**: `yarn a11y:keyboard` validates single character shortcut patterns

**Focus Management:**

- Focus MUST move to meaningful content after navigation
- Modal open: Focus MUST move to first interactive element or modal itself
- Modal close: Focus MUST return to trigger element
- Delete action: Focus MUST move to next logical element
- Keyboard traps MUST be avoided (users can always escape modals, menus, etc.)
- Material-Tailwind Menu components have built-in keyboard support
- Headless UI Dialog components have built-in Escape key handling

**Enough Time (WCAG 2.1 Guideline 2.2 - EN 301 549 Section 9.2.2):**

**Timing Adjustable (WCAG 2.1 SC 2.2.1 - Level A):**

- Time limits MUST be adjustable - users can:
  - Turn off the time limit before encountering it, OR
  - Adjust the time limit before encountering it (at least 10x default), OR
  - Extend the time limit before it expires (at least 20 seconds warning, extend at least 10x with simple action)
- Exceptions allowed for:
  - Real-time events (e.g., auctions) where timing is essential
  - Time limits over 20 hours
- Session timeouts MUST warn users before expiration and allow extension
- Forms with time limits MUST preserve data when time expires
- **Automated**: `yarn a11y:enough-time` validates setTimeout/setInterval patterns

**Pause, Stop, Hide (WCAG 2.1 SC 2.2.2 - Level A):**

- Auto-playing content (moving, blinking, scrolling) that:
  - Starts automatically, AND
  - Lasts more than 5 seconds, AND
  - Is presented in parallel with other content
- MUST provide mechanism to pause, stop, or hide
- Applies to: Carousels, slideshows, auto-scrolling news tickers, animations
- Exceptions: Content that is essential (e.g., real-time status updates)
- UI animations/transitions under 5 seconds are acceptable
- **Automated**: `yarn a11y:enough-time` validates auto-playing patterns

**Implementation Guidelines:**

- Use debouncing/throttling for performance (acceptable pattern)
- Loading state delays under 5 seconds (acceptable pattern)
- Modal close animations (acceptable pattern)
- Avoid session timeouts when possible
- If session timeout required: Warn 2 minutes before expiration, allow extension
- Auto-playing carousels MUST have pause button (visible and keyboard accessible)
- Auto-updating content (news feeds, stock tickers) MUST have pause/stop control

**Seizures and Physical Reactions (WCAG 2.1 Guideline 2.3 - EN 301 549 Section 9.2.3):**

**Three Flashes or Below Threshold (WCAG 2.1 SC 2.3.1 - Level A):**

- Content MUST NOT flash more than 3 times per second (333ms threshold)
- Applies to: Flashing, blinking, or strobing content
- No content should have rapid opacity/visibility changes that could trigger seizures
- Video content MUST be checked for flashing sequences before publishing
- Animations with rapid state changes MUST be avoided
- **Automated**: `yarn a11y:seizures` validates animation durations and flash patterns

**Animation from Interactions (WCAG 2.1 SC 2.3.3 - Level AAA - Best Practice):**

- Motion animations triggered by interactions SHOULD respect `prefers-reduced-motion`
- Users with vestibular disorders can disable animations in OS settings
- All CSS animations SHOULD check `@media (prefers-reduced-motion: reduce)`
- When reduced motion is preferred: Disable or reduce animations
- Safe alternatives: Fade opacity, reduce duration, use static positioning
- **Implementation**: Added to `styles/tailwind.css` for all animations
- **Automated**: `yarn a11y:seizures` validates prefers-reduced-motion support

**Implementation Guidelines:**

- All @keyframes animations MUST respect prefers-reduced-motion
- Smooth transitions and slow animations are safe (orbital rotations, scrolling logos)
- Never use rapid flashing/blinking effects for any purpose
- Test animations at different speeds to ensure safety
- Framer Motion and CSS transitions automatically respect user preferences
- Orbital animations (partners page) disabled when prefers-reduced-motion: reduce
- Logo scrolling animations disabled when prefers-reduced-motion: reduce

**Navigable (WCAG 2.1 Guideline 2.4 - EN 301 549 Section 9.2.4):**

**Bypass Blocks (WCAG 2.1 SC 2.4.1 - Level A):**

- Mechanism MUST be provided to bypass blocks of repeated content
- Skip links OR semantic landmarks (`<main>`, `<nav>`, `<footer>`) satisfy this requirement
- Layout component wraps all pages with `<main>` element (implicit bypass mechanism)
- Pages with navigation MUST use Layout component or provide skip link
- Skip link pattern: `<a href="#main">Skip to main content</a>` as first focusable element
- Alternative: Use semantic HTML5 landmarks for screen reader navigation
- **Automated**: `yarn a11y:navigable` validates Layout usage and landmark presence

**Page Titled (WCAG 2.1 SC 2.4.2 - Level A):**

- All pages MUST have descriptive page titles that identify the topic or purpose
- Title format: `{page.title} | {siteMetadata.title}` (handled by `<SEO>` component)
- Landing page can use default title (siteMetadata.title only)
- Page titles MUST NOT be generic (e.g., "Untitled", "Page", "New Page")
- `<SEO>` component MUST be used on every page with `title` prop
- Title should describe page content and help users navigate via browser tabs/bookmarks
- **Automated**: `yarn a11y:navigable` validates SEO component usage and title props

**Focus Order (WCAG 2.1 SC 2.4.3 - Level A):**

- Focus order MUST follow logical sequence (typically DOM order)
- Positive `tabIndex` values (tabIndex > 0) MUST NOT be used (disrupts natural order)
- Only use `tabIndex={0}` (include in tab order) or `tabIndex={-1}` (exclude from tab order)
- Modal dialogs MUST use `aria-modal` or `role="dialog"` for focus management
- Complex components SHOULD follow natural left-to-right, top-to-bottom flow
- **Automated**: `yarn a11y:navigable` detects positive tabIndex values

**Link Purpose (In Context) (WCAG 2.1 SC 2.4.4 - Level A):**

- Link purpose MUST be clear from link text alone or from link text + context
- Avoid generic link text: "click here", "read more", "here", "more", "link"
- Use descriptive text: "View success story", "Download report", "Contact sales team"
- Icon-only links MUST have `aria-label` or `title` attribute
- Links with images MUST have descriptive `alt` text on the image
- Same destination links SHOULD have consistent link text across the site
- Example: `<Link href="/contact" aria-label="Contact us">` for icon-only links
- **Automated**: `yarn a11y:navigable` validates link text and icon-only links

**Multiple Ways (WCAG 2.1 SC 2.4.5 - Level AA):**

- More than one way MUST be provided to locate pages within the site
- Required mechanisms: Navigation menu + at least one of:
  - Sitemap (`sitemap.xml` at root, generated by `next-sitemap`)
  - Search functionality
  - Breadcrumbs on sub-pages (PageHeader component)
- Current implementation:
  - ✓ Navigation menu (Navigation.tsx, createNavigation())
  - ✓ Sitemap (sitemap.xml, auto-generated)
  - ✓ Breadcrumbs (PageHeader component with breadcrumbs prop)
- Exceptions: Pages that are steps in a process (e.g., checkout flow)
- **Automated**: `yarn a11y:navigable` validates PageHeader breadcrumbs usage

**Headings and Labels (WCAG 2.1 SC 2.4.6 - Level AA):**

- Headings MUST describe topic or purpose clearly
- Form labels MUST describe input controls clearly
- Headings MUST NOT be empty or use placeholder text ("Heading", "Title", "TBD")
- Form labels MUST NOT be empty or use placeholder text ("Label", "Field")
- Headings describe sections; labels describe form controls
- Use descriptive text or JSX expressions that resolve to descriptive content
- PageHeader component provides `<h1>` automatically with page title
- **Automated**: `yarn a11y:navigable` validates heading and label content (allows JSX expressions)

**Focus Visible (WCAG 2.1 SC 2.4.7 - Level AA):**

- Keyboard focus indicator MUST be visible on all interactive elements
- `outline: none` MUST be replaced with alternative focus styles (ring, border, shadow)
- Focus indicators MUST have ≥3:1 contrast ratio against background (validated by `yarn a11y:contrast`)
- Acceptable patterns:
  - Use `focus-visible:` pseudo-class for keyboard-only focus styles
  - Provide custom focus styles with `ring-*`, `border-*`, or `shadow-*` classes
  - Tailwind: `focus:ring-2 focus:ring-primary-500 focus:outline-none`
- DaisyUI and Material-Tailwind components have built-in focus styles
- **Automated**: `yarn a11y:navigable` detects `outline: none` without alternatives

**Implementation Guidelines:**

- All pages MUST use `<SEO title="..." description="..." />`
- Sub-pages SHOULD use `<PageHeader breadcrumbs={[...]} />`
- Use Next.js `<Link>` component (provides proper keyboard support)
- Icon-only links: `<Link href="..." aria-label="descriptive text">`
- Breadcrumbs provide secondary navigation (Multiple Ways requirement)
- Semantic landmarks (`<main>`, `<nav>`, `<footer>`) in Layout.tsx
- Layout component ensures consistent bypass mechanism across all pages
- Focus order follows natural DOM order (no positive tabIndex)
- Headings use descriptive content from page frontmatter/YAML
- Form labels always paired with inputs using `htmlFor`/`id`

**Input Modalities (WCAG 2.1 Guideline 2.5 - EN 301 549 Section 9.2.5):**

**Pointer Gestures (WCAG 2.1 SC 2.5.1 - Level A):**

- Multi-point gestures (pinch-zoom, two-finger scroll) MUST have single-pointer alternatives
- Path-based gestures (swipe, drag) MUST have simple pointer alternatives
- Touch events with `touches.length > 1` MUST provide `onClick` or button alternatives
- Drag-and-drop MUST have keyboard alternatives (cut/paste, arrow keys, buttons)
- Canvas/SVG interactions MUST provide click/tap alternatives
- Progressive enhancement: Touch events can enhance but not replace basic interaction
- **Automated**: `yarn a11y:input-modalities` validates multi-touch patterns

**Pointer Cancellation (WCAG 2.1 SC 2.5.2 - Level A):**

- Actions MUST trigger on up-event (`onClick`, `onPointerUp`), NOT down-event
- `onMouseDown`/`onPointerDown`/`onTouchStart` MUST NOT trigger significant actions
- Users MUST be able to abort actions by moving pointer away before release
- Exceptions: Emulating keyboard (piano keys), essential down-event actions
- React's `onClick` uses up-event by default (safe pattern)
- Down-events acceptable for: Focus, hover states, visual feedback only
- **Automated**: `yarn a11y:input-modalities` validates down-event action patterns

**Label in Name (WCAG 2.1 SC 2.5.3 - Level A):**

- Accessible name (aria-label, aria-labelledby) MUST contain visible label text
- Voice input users speak visible labels to activate controls
- If button shows "Submit", aria-label should be "Submit" or "Submit form"
- Mismatch between visible and accessible names causes voice control failures
- Best practice: Use visible text as label, add aria-label only if needed for context
- Form labels: Visible `<label>` text MUST match or be contained in `aria-label`
- **Automated**: `yarn a11y:input-modalities` validates label text matching

**Motion Actuation (WCAG 2.1 SC 2.5.4 - Level A):**

- Device motion/orientation APIs MUST have UI control alternatives
- Shake-to-undo MUST have button alternative
- Tilt-to-scroll MUST have traditional scroll
- Motion actuation MUST be disableable to prevent accidental triggers
- Exceptions: Motion is essential (e.g., pedometer app)
- devicemotion, deviceorientation, accelerometer, gyroscope need alternatives
- **Automated**: `yarn a11y:input-modalities` validates motion event listeners

**Target Size (WCAG 2.1 SC 2.5.5 - Level AAA - Best Practice):**

- Interactive targets SHOULD be ≥44×44 CSS pixels
- Applies to: Buttons, links, form controls, touch targets
- Mobile guideline: 48×48dp (≈44×44 CSS pixels)
- Exceptions: Inline links in text, essential small targets
- Tailwind/DaisyUI default button sizes meet this requirement
- Icon buttons: Ensure adequate padding (p-2 minimum for touch targets)
- Level AAA (best practice): Informational only, not enforced

**Concurrent Input Mechanisms (WCAG 2.1 SC 2.5.6 - Level AAA - Best Practice):**

- DON'T restrict input to single modality (touch-only, mouse-only)
- Users SHOULD be able to switch between input methods freely
- DON'T detect touch and disable mouse, or vice versa
- Input method detection SHOULD NOT restrict functionality
- Progressive enhancement: Add touch support without removing mouse/keyboard
- Level AAA (best practice): Informational only, not enforced
- **Automated**: `yarn a11y:input-modalities` validates input restriction patterns

**Implementation Guidelines:**

- Use React's `onClick` for all actions (safe up-event pattern)
- Avoid `onMouseDown`, `onTouchStart` for triggering state changes
- Icon-only buttons: Provide aria-label matching visible tooltip/icon meaning
- Voice control: Match visible text in accessible names
- Multi-touch: Progressive enhancement only, never required for functionality
- Drag-and-drop: Implement keyboard alternatives (Material-Tailwind DnD does this)
- Motion APIs: Always provide UI controls for same functionality
- Target sizes: Use TailwindCSS classes that ensure adequate touch targets
- Test with: Voice control (Voice Control on iOS/macOS, Voice Access on Android)

**Readable (WCAG 2.1 Guideline 3.1 - EN 301 549 Section 9.3.1):**

**Language of Page (WCAG 2.1 SC 3.1.1 - Level A):**

- Primary language of page MUST be specified with `lang` attribute on `<html>` element
- Use valid BCP 47 language tags (e.g., `en`, `en-US`, `de`, `fr`, `es`, `ja`)
- Screen readers use `lang` to select correct pronunciation rules and accent
- In Next.js: Set in `pages/_document.tsx` on `<Html lang="en">` component
- Current implementation: `<Html lang="en">` in \_document.tsx ✓
- **Automated**: `yarn a11y:readable` validates lang attribute presence and format

**Language of Parts (WCAG 2.1 SC 3.1.2 - Level AA):**

- Text passages in different languages MUST be marked with `lang` attribute
- Applies to: Quotes, foreign phrases, mixed-language content
- Inline foreign text: `<span lang="fr">Bonjour</span>`
- Block foreign text: `<blockquote lang="de">...</blockquote>`
- Exceptions: Proper names, technical terms, words that became part of the language
- Examples: "café" (common in English), "JavaScript" (technical term)
- Manual review recommended for multilingual content
- **Automated**: `yarn a11y:readable` provides guidance (difficult to fully automate)

**Unusual Words (WCAG 2.1 SC 3.1.3 - Level AAA - Best Practice):**

- Jargon, idioms, slang SHOULD have definitions or glossary available
- Technical terms SHOULD be explained on first use
- Implementation options:
  - Glossary page linked from footer
  - Inline definitions with `<dfn>` element
  - Tooltips or expandable sections for term explanations
- Examples requiring definition: "edge computing", "idempotent", "isomorphic"
- Level AAA (informational): Manual content review recommended

**Abbreviations (WCAG 2.1 SC 3.1.4 - Level AAA - Best Practice):**

- Abbreviations SHOULD use `<abbr>` element with title attribute
- Format: `<abbr title="Application Programming Interface">API</abbr>`
- Well-known abbreviations may not need expansion: HTML, CSS, URL, HTTP
- Spell out on first use: "World Wide Web Consortium (W3C)"
- Level AAA (informational): Consider for technical documentation
- Common tech abbreviations: API, REST, JSON, XML, SDK, CLI, GUI, WCAG, ARIA

**Reading Level (WCAG 2.1 SC 3.1.5 - Level AAA - Best Practice):**

- Content SHOULD not exceed lower secondary education reading level
- When complex text required: Provide supplementary simplified version
- Exceptions: Technical/professional content (developer docs, legal text)
- Best practices:
  - Use short sentences and paragraphs
  - Prefer common words over complex ones
  - Use active voice ("We recommend" vs "It is recommended")
  - Break complex ideas into steps
- Level AAA (informational): Apply to marketing/user-facing content

**Pronunciation (WCAG 2.1 SC 3.1.6 - Level AAA - Best Practice):**

- Ambiguous pronunciation words SHOULD have guidance
- Relevant for: Proper names, heteronyms (read/read, live/live)
- Use `<ruby>` annotations for pronunciation: `<ruby>漢字<rt>かんじ</rt></ruby>`
- Level AAA (informational): Mainly for linguistic/educational content
- Not typically needed for standard business websites

**Implementation Guidelines:**

- Always set `lang="en"` (or appropriate language) in \_document.tsx
- Use `<span lang="xx">` for inline foreign phrases
- Content guidelines: Aim for clear, simple language
- Technical terms: Define on first use or link to glossary
- Abbreviations: Spell out on first use, consider `<abbr>` for documentation
- Reading level: Use Hemingway Editor or similar tools to check clarity
- Multilingual content: Add `lang` attribute consistently
- SEO benefit: `lang` attribute helps search engines understand content

**Predictable (WCAG 2.1 Guideline 3.2 - EN 301 549 Section 9.3.2):**

**On Focus (WCAG 2.1 SC 3.2.1 - Level A):**

- Focusing an element MUST NOT cause a change of context (navigation, form submit, open new windows)
- Use `onFocus` only for visual hints (styling, tooltips) and avoid triggering actions
- Automated: `yarn a11y:predictable` validates common focus handlers that perform navigation or submission

**On Input (WCAG 2.1 SC 3.2.2 - Level A):**

- Changing a control (select, checkbox, radio) MUST NOT automatically change context unless the user is warned beforehand
- If auto-submit or navigation is necessary, provide explicit label/instruction ("Selecting an option will submit the form")
- Prefer explicit action controls ("Submit") rather than implicit onChange submissions

**Consistent Navigation (WCAG 2.1 SC 3.2.3 - Level AA):**

- Navigational mechanisms repeated across pages MUST appear in the same relative order (header nav, breadcrumbs, footer links)
- Use centralized `Navigation` and `Layout` components to ensure consistency across pages
- Manual review required: Visual consistency of navigation order across site

**Consistent Identification (WCAG 2.1 SC 3.2.4 - Level AA):**

- Components with the same functionality MUST use the same labels and icons (e.g., "Submit" always labeled "Submit")
- Maintain a design-token mapping for icons and labels used for common actions
- Manual review required: Ensure consistent identification across pages and components

**Change on Request (WCAG 2.1 SC 3.2.5 - Level AAA - Best Practice):**

- Automatic changes of context (redirects, auto-refresh) SHOULD be avoided or user-controllable
- Provide opt-out or countdown where automatic behavior is unavoidable

**Testing & Validation (Predictable):**

- Automated: `yarn a11y:predictable` MUST pass (validates onFocus/onChange navigation patterns and warns about auto-redirects)
- Manual: Keyboard navigation and user-flow testing MUST be performed for interactive features (forms, navigation, modal dialogs)
- Screen reader testing SHOULD confirm that focus and input do not unexpectedly change context

**Input Assistance (WCAG 2.1 Guideline 3.3 - EN 301 549 Section 9.3.3):**

**Error Identification (WCAG 2.1 SC 3.3.1 - Level A):**

- Errors MUST be identified and described to the user in text
- Error messages SHOULD be programmatically associated with form controls (e.g., `aria-describedby`, `role="alert"`)
- Automated: `yarn a11y:input-assistance` validates presence of programmatic error regions and flags missing patterns

**Labels or Instructions (WCAG 2.1 SC 3.3.2 - Level A):**

- All form controls MUST have an associated label (`<label for="id">`) or an accessible name (`aria-label`/`aria-labelledby`)
- Placeholders MUST NOT be used as the only label
- Use semantic input types (`type="email"`, `type="tel"`) for improved input assistance
- **Autocomplete attributes** (WCAG 2.1 SC 1.3.5 - Level AA):
  - Form inputs that collect user information MUST use correct autocomplete values from HTML spec
  - Common required corrections:
    - `phone` → `tel` (telephone numbers)
    - `telephone` → `tel`
    - `firstname` → `given-name` (first names)
    - `lastname` → `family-name` (last names)
    - `zip` → `postal-code` (postal codes)
    - `e-mail` → `email` (email addresses)
  - Purpose: Enables browsers to autofill forms, helps users with cognitive disabilities
  - Reference: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
  - Automated: `yarn a11y:autocomplete` validates all autocomplete attribute values
  - axe rule: autocomplete-valid

**Error Suggestion (WCAG 2.1 SC 3.3.3 - Level AA):**

- Where suggestions are possible (typos, formatting), provide suggestions in error messages
- Example: "Did you mean example@domain.com?"

**Error Prevention (WCAG 2.1 SC 3.3.4 - Level AA):**

- For legal, financial, or data-submission forms, provide review/confirm steps and prevent accidental submissions
- Avoid auto-submit on input change without clear prior warning

**Testing & Validation (Input Assistance):**

- Automated: `yarn a11y:input-assistance` MUST pass (flags missing labels, missing error regions, auto-submit patterns)
- Automated: `yarn a11y:autocomplete` MUST pass (validates autocomplete attribute values against HTML spec)
- Manual: Verify error messages are announced by screen readers and input elements are focused when errors occur

**Distinguishable (WCAG 2.1 Guideline 1.4 - EN 301 549 Section 9.1.4):**

**Use of Color (WCAG 2.1 SC 1.4.1):**

- Information MUST NOT be conveyed by color alone
- Error states MUST use icons or text in addition to red color
- Required fields MUST use asterisk (\*) or "Required" text, not just color
- Links MUST be underlined or have another visual indicator beyond color
- Status indicators MUST use text labels or icons in addition to color coding

**Audio Control (WCAG 2.1 SC 1.4.2):**

- No content may auto-play audio for more than 3 seconds
- If audio auto-plays, MUST provide controls to pause/stop/mute
- Background audio MUST be at least 20dB lower than foreground speech

**Contrast (Minimum) (WCAG 2.1 SC 1.4.3) & Contrast (Enhanced) (WCAG 2.1 SC 1.4.6):**

- Color contrast MUST meet WCAG AA: 4.5:1 for normal text, 3:1 for large text (≥18pt or 14pt bold)
- Automated contrast validation MUST pass via `yarn a11y:contrast` (validates 16+ color combinations)
- All button states (default, hover, focus, active) MUST maintain WCAG AA contrast ratios
- Focus indicators MUST have ≥3:1 contrast against adjacent colors

**Resize Text (WCAG 2.1 SC 1.4.4):**

- Text MUST be resizable up to 200% without loss of content or functionality
- Use relative units (rem, em, %) not fixed pixel sizes for text
- Layout MUST adapt to enlarged text without horizontal scrolling
- No content may be clipped or cut off when text is enlarged

**Images of Text (WCAG 2.1 SC 1.4.5):**

- Images of text MUST NOT be used except for:
  - Logos and brand names
  - Text that is part of a photograph
  - Customizable text (e.g., user-generated content)
- Real text MUST be used whenever technologically possible

**Reflow (WCAG 2.1 SC 1.4.10):**

- Content MUST reflow at 320px viewport width without horizontal scrolling
- Two-dimensional layout required only for: images, maps, diagrams, video, games, presentations, data tables
- Use responsive design with breakpoints (Tailwind: sm, md, lg, xl, 2xl)
- Avoid fixed min-width values > 320px on content containers

**Non-text Contrast (WCAG 2.1 SC 1.4.11):**

- UI components MUST have 3:1 contrast against adjacent colors
- Graphical objects (icons, chart elements) MUST have 3:1 contrast
- Focus indicators MUST have 3:1 contrast ratio
- Form input borders MUST have 3:1 contrast

**Text Spacing (WCAG 2.1 SC 1.4.12):**

- Content MUST work with increased text spacing:
  - Line height (line spacing) at least 1.5x the font size
  - Paragraph spacing at least 2x the font size
  - Letter spacing at least 0.12x the font size
  - Word spacing at least 0.16x the font size
- No content may be clipped or overlapped with increased spacing
- Use flexible layouts that accommodate text expansion

**Automated Validation:**

- Distinguishable content validation with `yarn a11y:distinguishable` MUST pass
- Script validates: use of color, audio control, images of text, resize text, reflow, text spacing
- Contrast validated separately by `yarn a11y:contrast`

**Text Alternatives (WCAG 2.1 SC 1.1.1):**

- **Images**: All `<Image>` and `<img>` elements MUST have descriptive `alt` attributes
- **Decorative Elements**: Decorative images/icons MUST use `alt=""` and `aria-hidden="true"` or `role="presentation"`
- **SVG Icons**: Informative SVGs MUST use `role="img"` with `<title>` and `<desc>` elements OR `aria-label`
- **Icon-only Buttons**: ALL icon-only buttons MUST have `aria-label` with descriptive text
- **Loading Indicators**: MUST use `role="status"` and `aria-label="Loading"` for screen reader announcement
- **Avatar Images**: MUST include author name, position, and company in alt text
- **Feature Icons**: MUST include feature name in alt text
- **Share Buttons**: Each platform button MUST have specific `aria-label` (e.g., "Share this post on LinkedIn")
- **Menu Toggle**: MUST have dynamic `aria-label` based on state ("Open/Close navigation menu") and `aria-expanded` attribute

**Implementation Requirements:**

- All new image/icon components MUST follow established patterns
- Social share buttons MUST use platform-specific aria-labels
- Decorative elements MUST be explicitly marked to prevent redundant announcements

**Content & Semantics:**

- Semantic HTML MUST be used: `<nav>`, `<main>`, `<article>`, `<header>`, `<footer>`, `<button>`, etc.
- Headings MUST follow logical hierarchy (h1 → h2 → h3, no skipping levels)
- All images MUST have descriptive `alt` attributes; decorative images use `alt=""`
- Links MUST have descriptive text (avoid "click here" or "read more" without context)

**Forms & Input:**

- Form inputs MUST have associated `<label>` elements or `aria-label` attributes
- Required fields MUST be clearly marked (not just by color)
- Error messages MUST be associated with inputs (`aria-describedby`, `aria-invalid`)
- Form submission errors MUST be announced to screen readers (use `role="alert"` or live regions)

**Dynamic Content & Interaction:**

- Dynamic content updates MUST use ARIA live regions (`aria-live="polite"` or `"assertive"`)
- Loading states MUST be announced to screen readers (`aria-busy`, `aria-live`)
- Modals/dialogs MUST trap focus and announce when opened (`role="dialog"`, `aria-modal`)

**Time-based Media (WCAG 2.1 Guideline 1.2):**

- **Pre-recorded Audio**: MUST provide text transcript for all audio-only content
- **Pre-recorded Video**: MUST provide synchronized captions for all video with audio (Level A)
- **Pre-recorded Video**: MUST provide audio descriptions for all video content (Level AA)
- **Live Content**: MUST provide real-time captions for live video streams (Level AA)
- **Transcripts**: MUST be available as downloadable text files
- **Captions Quality**: Must include all dialogue, speaker identification, and important sound effects
- **Auto-play**: Videos MUST NOT auto-play with audio; if auto-playing, MUST be muted with visible controls
- **Keyboard Controls**: All media controls MUST be fully keyboard accessible
- **WebVTT Format**: Captions and descriptions MUST use WebVTT (.vtt) format for web delivery

**Implementation Requirements:**

- See `docs/accessibility-time-based-media.md` for comprehensive guidelines
- When adding first video/audio, update `scripts/check-text-alternatives.py` with media validation
- Caption accuracy MUST be ≥99% for professional content
- Audio descriptions MUST describe all important visual information not in dialogue

**Adaptable Content (WCAG 2.1 Guideline 1.3 - EN 301 549 Section 9.1.3):**

**Semantic Structure (WCAG 2.1 SC 1.3.1):**

- **Landmark Elements**: All pages MUST use semantic HTML5 landmarks
  - `<main>` MUST wrap primary page content (exactly one per page)
  - `<nav>` MUST wrap navigation regions
  - `<footer>` MUST wrap footer content
  - `<header>` for page/section headers
- **Heading Hierarchy**: MUST follow logical, sequential order
  - Each page MUST have exactly ONE `<h1>` element identifying the main topic
  - Headings MUST NOT skip levels (e.g., h1 → h2 → h3, NOT h1 → h3)
  - Sections MUST use appropriate heading levels based on hierarchy
  - When using `PageHeader` component, it provides the `<h1>` automatically
- **Form Labels**: All form inputs MUST have accessible labels
  - Use `<label for="input-id">` with matching `id` attribute, OR
  - Wrap input in `<label>` element (wrapper pattern), OR
  - Use `aria-label` or `aria-labelledby` for custom controls
- **Table Structure**: Data tables MUST have proper header identification
  - All header cells MUST use `<th>` elements with `scope="col"` or `scope="row"`
  - Complex tables MUST use `<thead>`, `<tbody>`, and `<tfoot>` where appropriate
  - Table caption SHOULD use `<caption>` element
- **Lists**: Use semantic list elements for related items
  - Navigation links MUST use `<ul>` or `<ol>` with `<li>` elements
  - Definition lists MUST use `<dl>`, `<dt>`, `<dd>` elements

**Meaningful Sequence (WCAG 2.1 SC 1.3.2):**

- DOM order MUST match visual reading order
- CSS positioning/flexbox/grid MUST NOT create illogical tab order
- Content MUST be understandable when stylesheets are disabled

**Automated Validation:**

- Semantic structure validation with `yarn a11y:semantic` MUST pass with zero errors and zero warnings
- Script validates: heading hierarchy, landmarks, form labels, table structure
- Generic component libraries (e.g., `Form.tsx`) are excluded from validation as they receive proper labels when used

**Media & Animation:**

- Animations MUST respect `prefers-reduced-motion` media query for users with vestibular disorders
- Auto-playing animations longer than 5 seconds MUST have pause/stop controls

**ARIA Best Practices:**

- Use native HTML elements over ARIA when possible (e.g., `<button>` not `<div role="button">`)
- ARIA attributes MUST be used correctly (invalid ARIA is worse than no ARIA)
- Avoid redundant ARIA (e.g., `<nav role="navigation">` is redundant)

**Testing & Validation:**

- Automated accessibility testing with `yarn a11y` MUST pass (runs all checks below)
- Automated contrast testing with `yarn a11y:contrast` MUST pass (validates 16+ color combinations)
- Automated text alternatives testing with `yarn a11y:text-alternatives` MUST pass
- Automated time-based media testing with `yarn a11y:media` MUST pass
- Automated semantic structure testing with `yarn a11y:semantic` MUST pass
- Automated distinguishable content testing with `yarn a11y:distinguishable` MUST pass
- Automated keyboard accessibility testing with `yarn a11y:keyboard` MUST pass
- Automated enough time testing with `yarn a11y:enough-time` MUST pass
- Automated seizures and physical reactions testing with `yarn a11y:seizures` MUST pass
- Automated navigable testing with `yarn a11y:navigable` MUST pass (validates bypass blocks, page titles, focus order, link purpose, headings, focus visible)
- Automated input modalities testing with `yarn a11y:input-modalities` MUST pass (validates pointer gestures, pointer cancellation, label in name, motion actuation)
- Automated readable testing with `yarn a11y:readable` MUST pass (validates language of page, language of parts)
- Automated autocomplete testing with `yarn a11y:autocomplete` MUST pass (validates autocomplete attribute values against HTML spec)
- Automated testing with axe-core or Lighthouse MUST be run before merging
- Manual keyboard navigation testing MUST be performed for interactive features
- Screen reader testing SHOULD be performed (NVDA on Windows, VoiceOver on macOS/iOS)
- Browser zoom testing up to 200% MUST be performed for new pages/components
- Responsive testing at 320px viewport width MUST be performed
- Text alternatives MUST be verified for all new images, icons, and interactive elements
- Heading hierarchy MUST be verified for all new pages and components
- Color alone MUST NOT convey information (verify with grayscale filter)
- Tab order and focus flow MUST be tested with keyboard only navigation
- Modal focus trapping MUST be tested (focus stays in modal, Escape to close)
- Session timeouts MUST be tested (if applicable) - verify warning and extension mechanisms
- Auto-playing content MUST be tested - verify pause/stop controls work
- Animations MUST be tested with OS reduced motion setting enabled
- Video content MUST be checked for flashing sequences (3+ flashes per second)
- Page titles MUST be verified for descriptiveness (check browser tabs)
- Breadcrumbs MUST be tested for logical navigation paths
- Link text MUST be verified for clarity (avoid "click here", "read more")
- Icon-only links MUST have aria-label or title attributes
- Voice control SHOULD be tested (Voice Control on iOS/macOS, Voice Access on Android)
- Touch target sizes SHOULD be verified on mobile devices (≥44×44px recommended)
- Actions MUST trigger on up-event (click/release), not down-event (press)
- Language attribute MUST be verified in \_document.tsx (`lang="en"` or appropriate)
- Foreign language passages SHOULD have `lang` attribute (manual review)
- Content clarity SHOULD be reviewed for reading level (aim for simplicity)

**Rationale**: Accessibility is both a legal requirement (ADA, Section 508, EU Accessibility Act/EN 301 549) and moral imperative. Building accessibility in from the start is 10x easier than retrofitting. Approximately 15% of the global population has some form of disability. Automated testing catches ~40% of accessibility issues; manual testing is essential. WCAG 2.1 Principle 2 (Operable) fully automated (5/5 guidelines), Principle 3 (Understandable) started (1/3 guidelines) - ~82% of Level AA coverage achieved.

## Content Management Standards

Content architecture requirements:

- All content MUST be in `/content` directory: YAML for structured data, MDX for long-form content
- Authors MUST be defined in `content/authors.yaml` with unique IDs before being referenced
- Blog posts MUST use MDX format in `content/blog-posts/` with required frontmatter: `title`, `date`, `authors`, `category`, `excerpt`, `cover`
- **UI Text Externalization**: All user interface text (labels, messages, status text) MUST be sourced from YAML files in `/content` directory, never hardcoded in components
- Asset paths MUST be absolute from `/public` directory (e.g., `/assets/image.png`)
- All assets (images, avatars, icons) MUST have descriptive filenames reflecting their content
- Image alt text MUST be descriptive and contextual
- Link validity MUST be checked via `lychee.toml` configuration before merging PRs
- Hot reload does NOT work for content changes; manual browser refresh required during development

## Development Workflow

### Quality Gates

Before any PR can be merged, ALL of the following MUST pass:

1. **Build**: `yarn build` completes without errors
2. **Lint**: `yarn lint` returns no errors
3. **Format**: `yarn format` shows no formatting violations
4. **Type Check**: TypeScript compilation succeeds with no errors
5. **Accessibility**: `yarn a11y` passes all WCAG 2.1 AA checks:
   - Contrast ratios (`yarn a11y:contrast`)
   - Text alternatives (`yarn a11y:text-alternatives`)
   - Time-based media (`yarn a11y:media`)
   - Semantic structure (`yarn a11y:semantic`)
   - Distinguishable content (`yarn a11y:distinguishable`)
   - Keyboard accessible (`yarn a11y:keyboard`)
   - Enough time (`yarn a11y:enough-time`)
   - Seizures prevention (`yarn a11y:seizures`)
   - Navigable (`yarn a11y:navigable`)
   - Input modalities (`yarn a11y:input-modalities`)
   - Readable (`yarn a11y:readable`)
   - Autocomplete attributes (`yarn a11y:autocomplete`)
6. **SEO**: `yarn seo:validate` passes all metadata requirements:
   - All titles 50-60 characters
   - All descriptions 150-160 characters
   - No duplicate titles or descriptions
   - All pages have canonical URLs
7. **Lighthouse**: `yarn lighthouse` passes with **≥95% scores on all 4 categories**:
   - Performance (page speed, optimization)
   - Accessibility (WCAG 2.1 AA compliance)
   - Best Practices (security, standards)
   - SEO (search engine optimization)

**Recommended Pre-commit Command**: `yarn check:all` (runs format, lint, a11y, perf, seo, OG image validation, and build in sequence)

**Local Lighthouse Testing**: Run `yarn dev` in terminal 1, then `yarn lighthouse` in terminal 2 to validate ≥95% scores before pushing

**Automated Quality Checks**: GitHub Actions workflows enforce all quality gates on pull requests

- `tests-and-other-validation.yml`: Format, lint, type check, build, a11y, seo (metadata, structured data, internal links), and image optimization
- `lighthouse.yml`: Lighthouse audits with ≥95% enforcement (blocks merge if any category < 95%)
  - Uses CI-specific configs (`.lighthouserc.ci.js`, `lighthouse.mobile.config.ci.js`) that skip `is-crawlable` audit since Vercel preview deployments are blocked from indexing by default

### Testing Policy

When tests are introduced, they MUST use the following technology stack:

- **Integration/E2E Tests**: Playwright for end-to-end user journeys and critical flows
- **Unit Tests**: Vitest for utility functions in `/lib` and isolated logic
- **Component Tests**: React Testing Library for component behavior validation
- **Visual Regression**: (Future) Chromatic or Percy for UI consistency checks

Test organization requirements:

- Test files MUST be in `/tests` directory
- Integration tests MUST cover: form submissions, navigation flows, content rendering
- Unit tests MUST cover: markdown parsing, navigation generation, data transformations
- Test coverage target: >80% for new utility code in `/lib`

## Governance

This constitution defines the non-negotiable standards for the Cennso Website project.

### Amendment Process

- Amendments require pull request to `.specify/memory/constitution.md`
- Version MUST be incremented per semantic versioning:
  - MAJOR: Breaking changes to principles (removing/redefining core standards)
  - MINOR: New principles added or existing principles significantly expanded
  - PATCH: Clarifications, wording improvements, non-semantic changes
- All dependent templates in `.specify/templates/` MUST be reviewed and updated to align with changes
- Migration plan required for changes affecting existing codebase

### Compliance

- All PRs and code reviews MUST verify compliance with constitution principles
- Violations MUST be documented and justified in PR description
- AGENTS.md serves as runtime guidance for AI assistants and human developers
- Template files in `.specify/templates/` enforce constitution through structured workflows

**Version**: 2.6.1 | **Ratified**: 2025-10-15 | **Last Amended**: 2025-01-10
