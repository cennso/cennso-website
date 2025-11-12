# Feature Specification: LLM-Friendly Data Exposure

**Feature Branch**: `003-generate-llm-files`  
**Created**: 2025-11-12  
**Status**: Draft  
**Input**: User description: "I want this project to expose to outside world data needed for consumer to easy use it for LLM so scripts that will generate llm.txt and llm-full.txt and expose as links in footer. Of course proper validation is needed. If other standards are known, implement them too"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - LLM Crawlers Discover Website Data (Priority: P1)

LLM systems (ChatGPT, Claude, Gemini, etc.) and AI crawlers can automatically discover and consume structured website information through standardized endpoints. The website exposes its content in formats specifically designed for AI consumption, making it easy for LLMs to reference accurate, up-to-date information about Cennso services, expertise, and content.

**Why this priority**: Core functionality that enables the entire feature - without discoverable endpoints, no LLM can access the data. This is the foundation that all other stories build upon.

**Independent Test**: Can be fully tested by requesting `/llm.txt` and `/llm-full.txt` URLs and verifying they return properly formatted content with correct headers. Delivers immediate value by making website discoverable to AI systems.

**Acceptance Scenarios**:

1. **Given** an LLM crawler visits the website root, **When** it checks for `/llm.txt`, **Then** it receives a valid response with basic website information
2. **Given** an LLM crawler needs detailed content, **When** it requests `/llm-full.txt`, **Then** it receives comprehensive structured data including all pages, blog posts, and solutions
3. **Given** a user visits the website footer, **When** they look for AI access information, **Then** they see links to both `/llm.txt` and `/llm-full.txt` with clear labels
4. **Given** an LLM accesses these files, **When** it parses the content, **Then** the format follows established standards (llms.txt, robots.txt patterns, and Schema.org where applicable)

---

### User Story 2 - Automated Content Generation and Validation (Priority: P2)

The website automatically generates LLM-friendly data files during the build process, ensuring they always reflect the current state of content (blog posts, solutions, success stories, job postings). Validation scripts verify the generated files meet quality standards before deployment.

**Why this priority**: Ensures data accuracy and consistency - without automated generation, the LLM files would become stale and provide incorrect information. Critical for maintaining trust with AI systems.

**Independent Test**: Can be tested by running the build process and verifying that llm.txt and llm-full.txt are generated with current content, then running validation to confirm they pass all quality checks. Delivers value by preventing outdated or malformed data from being served.

**Acceptance Scenarios**:

1. **Given** content has been updated (new blog post, modified solution), **When** the build script runs, **Then** LLM files are regenerated with the latest content
2. **Given** LLM files are generated, **When** validation runs, **Then** it checks for proper formatting, required fields, correct metadata, and data completeness
3. **Given** validation detects issues, **When** the build completes, **Then** the process fails with clear error messages indicating what needs to be fixed
4. **Given** all content sources (YAML, MDX), **When** generation runs, **Then** data is correctly extracted, formatted, and included in the appropriate LLM file

---

### User Story 3 - Developers Understand LLM Data Format (Priority: P3)

Documentation clearly explains the LLM data format, generation process, validation requirements, and how to extend or modify the content included in LLM files. This enables team members to maintain and improve the feature over time.

**Why this priority**: Supports long-term maintainability but isn't required for the feature to function. Can be added after core functionality is working.

**Independent Test**: Can be tested by having a developer (who wasn't involved in implementation) read the documentation and successfully add a new content type to the LLM files. Delivers value by reducing maintenance burden.

**Acceptance Scenarios**:

1. **Given** a developer needs to modify LLM content, **When** they read the documentation, **Then** they understand the file structure, generation script location, and validation requirements
2. **Given** documentation exists, **When** a developer wants to add new content types, **Then** clear examples show how to extend the generation script
3. **Given** the feature is deployed, **When** team members review it, **Then** they can verify the implementation follows documented standards (llms.txt specification, Schema.org types)

---

### Edge Cases

- What happens when content contains special characters or formatting that might break LLM file structure?
- How does the system handle very large content (blog posts with 10,000+ words)?
- What if generation fails during build - should it block deployment or serve stale files?
- How are images and assets referenced in LLM files (absolute URLs, relative paths)?
- What happens if YAML or MDX files have parsing errors during generation?
- How does the system handle multilingual content or internationalization?
- What if an LLM file exceeds reasonable size limits (e.g., >10MB)?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST generate `/llm.txt` file containing basic website information (name, description, primary services, contact information)
- **FR-002**: System MUST generate `/llm-full.txt` file containing comprehensive structured data including all pages, blog posts, solutions, success stories, testimonials, job postings, and team information
- **FR-003**: System MUST run generation scripts automatically during the build process (integrated into `yarn build`)
- **FR-004**: System MUST validate generated LLM files for proper formatting, required fields, data completeness, and size constraints
- **FR-005**: System MUST fail the build if LLM validation detects critical errors
- **FR-006**: Website footer MUST include visible links to both `/llm.txt` and `/llm-full.txt` with clear labels explaining their purpose
- **FR-007**: LLM files MUST use UTF-8 encoding and handle special characters correctly
- **FR-008**: System MUST follow the llms.txt specification (based on established patterns like robots.txt) for file structure and formatting
- **FR-009**: System MUST include proper metadata headers in LLM files (last updated timestamp, version, content summary)
- **FR-010**: System MUST use absolute URLs for all links and resources within LLM files
- **FR-011**: Generated content MUST strip HTML/JSX formatting and provide clean, readable text suitable for LLM consumption
- **FR-012**: System MUST include Schema.org structured data references where applicable (Articles for blog posts, JobPosting for jobs, Organization for company info)
- **FR-013**: Validation script MUST check for duplicate content, broken internal references, and missing required sections
- **FR-014**: System MUST document the LLM file format, generation process, and validation requirements in the `/docs` directory
- **FR-015**: LLM files MUST be accessible via standard HTTP GET requests with appropriate caching headers

### Key Entities

- **LLM Text File**: Plain text file following llms.txt specification containing structured website data for AI consumption. Includes metadata headers, content sections, and proper delimiting.
- **Content Source**: YAML configuration files and MDX content files (blog posts, solutions, success stories) that provide the raw data for LLM file generation.
- **Generation Script**: Automated script that extracts, transforms, and formats content from sources into LLM-friendly text files during build process.
- **Validation Script**: Quality assurance script that verifies generated LLM files meet formatting standards, contain required sections, and have no data integrity issues.
- **Footer Link**: User-facing link in website footer that provides access to LLM files with clear labeling for discovery.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: LLM systems can successfully discover and parse website data through `/llm.txt` and `/llm-full.txt` endpoints within 1 second of request
- **SC-002**: Generated LLM files include 100% of current website content (all published blog posts, solutions, success stories, jobs, team members)
- **SC-003**: Build process completes LLM file generation and validation in under 30 seconds
- **SC-004**: Validation catches 100% of formatting errors, missing required fields, and broken internal references before deployment
- **SC-005**: LLM files remain under 5MB for `/llm.txt` and under 20MB for `/llm-full.txt` to ensure reasonable load times
- **SC-006**: Footer links to LLM files are visible and clickable on all pages across desktop and mobile viewports
- **SC-007**: Documentation enables a new developer to understand and extend the LLM generation system within 30 minutes of reading
- **SC-008**: LLM files conform to established standards (llms.txt specification, Schema.org types where applicable) with 100% compliance
- **SC-009**: Generated content is refreshed automatically on every deployment, ensuring data is never more than one deployment cycle out of date

## Assumptions

- The llms.txt specification follows similar patterns to robots.txt (simple, line-based format with sections and key-value pairs)
- LLM systems will respect standard HTTP caching headers (Cache-Control, ETag) when accessing these files
- Plain text format is preferred over JSON/XML for simplicity and broad LLM compatibility
- Website content sources (YAML, MDX) are the single source of truth for all data included in LLM files
- The feature should work similarly to how sitemaps.xml and robots.txt are generated and served
- Performance impact of serving static text files is negligible compared to HTML pages
- Most LLM crawlers will request `/llm.txt` first (lightweight summary) before requesting `/llm-full.txt`
- The build process already has access to all content through existing parsing utilities (lib/mdx.ts, lib/markdown.ts)

## Dependencies

- Existing content parsing utilities (lib/mdx.ts for blog posts, YAML parsers for structured content)
- Build process (package.json scripts, next.config.js)
- Footer component for adding links
- Public directory for serving static files
- Validation framework (Python scripts in /scripts directory following existing patterns)

## Open Questions

None - all critical aspects have reasonable defaults based on established patterns (robots.txt, sitemap.xml, llms.txt emerging standard).
