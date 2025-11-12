# Research: LLM-Friendly Data Exposure

**Date**: 2025-11-12  
**Feature**: LLM-Friendly Data Exposure  
**Purpose**: Research file format standards, generation patterns, and validation requirements

## 1. llms.txt File Format Standard

### Decision: Use llms.txt Specification

**Rationale**: The llms.txt specification is an emerging standard for exposing website data to LLMs, similar to how robots.txt works for web crawlers. It provides a simple, text-based format that's easy for LLMs to parse.

**Format Specification**:
```
# llms.txt - LLM-friendly website data
# Based on the llms.txt specification (https://llmstxt.org/)

# Metadata
> url: https://www.cennso.com
> last_updated: 2025-11-12T10:00:00Z
> version: 1.0
> content_summary: Mobile core network solutions, consulting services, success stories

# About
[Company name and description]

# Services
- [Service 1]
- [Service 2]

# Contact
Email: [email]
...

# Content
## Blog Posts
[List of blog posts with titles and URLs]

## Solutions
[List of solutions]
```

**Key Characteristics**:
- Plain text format with Markdown-style headings
- Metadata headers prefixed with `>`
- Sections organized by content type
- Hierarchical structure using `#` and `##` headers
- Lists use `-` or `*` bullets
- URLs are absolute (full domain)

**Alternatives Considered**:
- JSON-LD: More structured but harder for humans to read, requires parsing
- Markdown: Too flexible, lacks standard metadata format
- Plain text with custom format: Reinventing the wheel, no ecosystem support
- XML/RSS: Too verbose, dated format

**Why llms.txt**: Simple, human-readable, follows established patterns (robots.txt, sitemap.xml), emerging standard with growing LLM support.

## 2. Two-File Strategy: Basic vs. Full

### Decision: Separate llm.txt (basic) and llm-full.txt (comprehensive)

**Rationale**: Not all LLM systems need comprehensive data. Providing a lightweight summary file reduces bandwidth and parsing time for basic queries.

**llm.txt (Basic Summary)** - ~50-200KB:
- Metadata headers
- Company overview
- Primary services (1-2 sentences each)
- Contact information
- Key pages (Home, About, Services, Contact)
- Recent blog posts (5-10 most recent titles + URLs)
- No full blog post content

**llm-full.txt (Comprehensive Data)** - ~1-5MB:
- Everything from llm.txt
- All blog posts with full content (stripped of HTML)
- All solutions with detailed descriptions
- All success stories with full case studies
- Team member bios
- Job postings with full descriptions
- Testimonials
- Partner information

**Benefits**:
- Faster initial discovery for LLM crawlers (llm.txt)
- Reduced bandwidth for simple queries
- Comprehensive data available when needed (llm-full.txt)
- Follows progressive enhancement pattern

**Alternatives Considered**:
- Single file: Too large for quick lookups, wastes bandwidth
- Three-tier system (basic/medium/full): Overengineering, increases maintenance
- On-demand generation: Adds latency, requires server processing

**Why Two Files**: Balances simplicity with efficiency. Most LLM queries can be answered from llm.txt; detailed research uses llm-full.txt.

## 3. Generation Script Architecture

### Decision: TypeScript scripts in `/scripts/generate-llm-data/` with modular generators

**Rationale**: Follows existing pattern (`generate-og-images/`), uses TypeScript for type safety, modular design allows independent testing.

**Architecture**:
```typescript
// scripts/generate-llm-data/index.ts
// Main orchestrator - reads content, calls generators, writes files

// scripts/generate-llm-data/generators/basic.ts
// Generates llm.txt with summary data

// scripts/generate-llm-data/generators/full.ts
// Generates llm-full.txt with comprehensive data

// scripts/generate-llm-data/generators/shared.ts
// Shared utilities: header generation, URL formatting, text cleaning
```

**Content Processing Pipeline**:
1. **Read Sources**: Use existing `lib/mdx.ts` to parse blog posts, `js-yaml` for YAML files
2. **Transform**: Strip HTML/JSX, format as plain text, convert relative URLs to absolute
3. **Format**: Apply llms.txt structure with headers and sections
4. **Write**: Output to `public/llm.txt` and `public/llm-full.txt`

**Build Integration**:
- Add `prebuild` script to package.json: `"prebuild": "yarn generate:llm"`
- Generation runs automatically before every `yarn build`
- Ensures LLM files are always up-to-date with content

**Alternatives Considered**:
- Python scripts: Requires parsing TypeScript content types, adds language complexity
- Single monolithic script: Harder to test, violates single responsibility
- Runtime generation (Next.js API route): Adds latency, not cacheable, overcomplicates

**Why TypeScript in Scripts**: Reuses existing content parsing utilities, type-safe, integrates seamlessly with build pipeline.

## 4. Content Sources and Data Extraction

### Decision: Use existing content parsing utilities

**Content Sources** (all existing):
- **Blog Posts**: `content/blog-posts/*.mdx` → `lib/mdx.ts` (getMDXContent)
- **Solutions**: `content/solutions/*.mdx` → `lib/mdx.ts`
- **Success Stories**: `content/success-stories/*.mdx` → `lib/mdx.ts`
- **Authors**: `content/authors.yaml` → `js-yaml`
- **Jobs**: `content/jobs/*.mdx` → `lib/mdx.ts`
- **Testimonials**: `content/testimonials.yaml` → `js-yaml`
- **Partners**: `content/partners.yaml` → `js-yaml`
- **Static Pages**: `content/*-page.yaml` → `js-yaml`

**Text Cleaning Strategy**:
- Strip JSX/HTML tags using regex or markdown parser
- Convert Markdown to plain text (preserve structure with indentation/bullets)
- Remove code blocks (not useful for LLM summaries)
- Preserve links but convert to absolute URLs
- Normalize whitespace (multiple newlines → 2 newlines max)

**Metadata Extraction**:
- Timestamps: Use file modification time or frontmatter `date` field
- Authors: Resolve author IDs from `authors.yaml`
- Categories: Extract from frontmatter `category` field
- URLs: Construct from slug using `siteMetadata.siteUrl`

**Alternatives Considered**:
- Parse HTML from built pages: Fragile, requires parsing complex HTML
- Maintain separate content database: Duplicates data, adds maintenance burden
- Use Next.js API to query content: Over-complicates, not available at build time

**Why Existing Utilities**: Single source of truth, proven parsing logic, no duplication.

## 5. Validation Requirements

### Decision: Python validation script with comprehensive checks

**Validation Script**: `scripts/validate-llm-data.py`

**Checks to Implement**:
1. **File Existence**: Both llm.txt and llm-full.txt must exist
2. **UTF-8 Encoding**: Files must be valid UTF-8
3. **File Size**: 
   - llm.txt: 1KB-5MB (sanity check)
   - llm-full.txt: 10KB-20MB (sanity check)
4. **Required Metadata**: Headers must include url, last_updated, version, content_summary
5. **Required Sections**: Both files must have About, Services, Contact sections
6. **URL Format**: All URLs must be absolute (start with https://www.cennso.com)
7. **No HTML/JSX**: Detect and flag any `<tag>` patterns (indicates incomplete cleaning)
8. **No Broken Internal References**: Validate internal links point to existing pages
9. **Duplicate Content**: Check for accidentally duplicated sections
10. **Timestamp Validity**: last_updated must be valid ISO 8601 format

**Error Levels**:
- **ERROR**: Critical issues that break spec compliance (exit code 1)
- **WARNING**: Best practice violations that don't break functionality (exit code 0)

**Integration**:
- Add `validate:llm` script to package.json
- Run as part of `yarn check:all` command
- Run in CI/CD GitHub Actions workflow

**Alternatives Considered**:
- TypeScript validation: Python scripts are standard for validation in this project
- No validation: Risks serving malformed data to LLMs
- Manual validation: Not scalable, error-prone

**Why Python Validation**: Follows existing patterns (`validate-og-images.py`, `check-*.py`), simple text processing, independent of build process.

## 6. Footer Integration

### Decision: Add links to Footer component using YAML configuration

**Footer Link Pattern** (existing):
```tsx
// components/Footer.tsx already has sections
<div className="footer-section">
  <h3>Resources</h3>
  <ul>
    <li><Link href="/privacy-policy">Privacy Policy</Link></li>
    <li><Link href="/imprint">Imprint</Link></li>
    <!-- NEW -->
    <li><Link href="/llm.txt">LLM Data (Basic)</Link></li>
    <li><Link href="/llm-full.txt">LLM Data (Full)</Link></li>
  </ul>
</div>
```

**Configuration** (new file):
```yaml
# content/llm-links.yaml
llm_links:
  basic:
    label: "LLM Data (Basic)"
    description: "Lightweight website summary for AI systems"
    url: "/llm.txt"
  full:
    label: "LLM Data (Full)"
    description: "Comprehensive website content for AI systems"
    url: "/llm-full.txt"
```

**Implementation**:
1. Create `content/llm-links.yaml` with link configuration
2. Load in Footer component via getStaticProps or direct import
3. Render links in appropriate footer section (Resources or Company)
4. Use existing Link component and styling
5. Add optional tooltip/title attribute with description

**Accessibility**: Links are semantic `<a>` elements with descriptive text, keyboard accessible, meet contrast requirements.

**Alternatives Considered**:
- Hardcoded links: Violates "no hardcoded UI text" principle
- Hide from footer: Reduces discoverability for human users
- Special /ai or /robots page: Non-standard, requires extra navigation

**Why Footer Links**: Maximizes discoverability, follows existing patterns, maintains consistency.

## 7. Schema.org Integration

### Decision: Reference Schema.org types in comments, not embed structured data

**Rationale**: The llm.txt files are plain text, not HTML. Schema.org structured data (JSON-LD) is already present in HTML pages. The LLM files should reference these existing schemas in comments for clarity.

**Implementation**:
```
# Blog Posts (Schema.org: BlogPosting, Article)
## [Blog Post Title]
URL: https://www.cennso.com/blog/post-slug
Author: [Author Name]
Published: 2025-01-15
Summary: [excerpt]
```

**Schema.org Types to Reference**:
- **Organization**: Company information (already in HTML)
- **BlogPosting/Article**: Blog posts (already in HTML)
- **JobPosting**: Job listings (already in HTML)
- **Person**: Team members/authors
- **Service**: Service descriptions
- **Review/Testimonial**: Customer testimonials

**Alternatives Considered**:
- Embed JSON-LD in llm.txt: Mixing formats, harder for humans to read
- Separate schema.json file: Duplicates data, maintenance burden
- No Schema.org reference: Misses opportunity to clarify content types

**Why Comment-Based References**: Provides context without complicating format, aligns with structured data already in HTML.

## 8. Caching and Performance

### Decision: Static file serving with standard HTTP caching headers

**Next.js Static Serving**: Files in `/public` are served with:
- `Cache-Control: public, max-age=31536000, immutable` (default for static assets)
- `ETag` header for change detection

**Cache Strategy**:
- LLM files regenerated on every build (deployment)
- Old file contents are replaced
- Next.js handles cache headers automatically
- No custom caching logic needed

**Performance Optimizations**:
1. **Compression**: Enable gzip/brotli in deployment (Vercel does this automatically)
2. **CDN**: Static files automatically served from CDN edge (Vercel Edge Network)
3. **File Size**: Enforce size limits during validation
4. **Minimal Processing**: Generation is one-time at build, no runtime overhead

**Alternatives Considered**:
- Dynamic generation with aggressive caching: Adds complexity, runtime overhead
- Short cache TTL: Unnecessary, content only changes on deployment
- No caching: Wasteful bandwidth, slower responses

**Why Static with Long TTL**: Zero runtime overhead, fastest possible responses, CDN-friendly.

## 9. Testing and Validation Strategy

### Decision: Multi-layer validation approach

**Layer 1: Build-Time Validation** (Python script):
- Run `yarn validate:llm` after generation
- Checks: file existence, format, metadata, URLs, file sizes
- Blocks build if critical errors found

**Layer 2: CI/CD Validation** (GitHub Actions):
- Run validation in `tests-and-other-validation.yml` workflow
- Integrate with existing quality checks matrix
- Fails PR if validation errors

**Layer 3: Manual Review**:
- Test LLM file content in ChatGPT/Claude
- Verify: completeness, readability, accuracy
- Check: footer links are visible and functional
- Validate: response times are acceptable (<1s)

**Layer 4: Integration Testing**:
- Verify `yarn build` completes successfully
- Check generated files exist and are non-empty
- Confirm footer links render correctly
- Test static file serving (request /llm.txt returns 200)

**Test Cases**:
- Empty blog posts directory → generates valid file with no blog section
- Special characters in content → proper UTF-8 encoding
- Very long blog posts → file size limits enforced
- Missing required YAML fields → validation catches error
- Broken internal links → validation detects and reports

**Alternatives Considered**:
- Unit tests for generators: Overkill for simple text transformation
- Snapshot testing: Brittle, breaks with any content change
- Only manual testing: Not scalable, misses edge cases

**Why Multi-Layer**: Catches errors early (build-time), prevents regressions (CI), confirms quality (manual).

## 10. Migration and Rollout Plan

### Decision: Phased rollout with validation gates

**Phase 1: Generation** (P1 MVP):
1. Implement generation scripts
2. Add prebuild hook
3. Run `yarn build` and verify files generated
4. Manual review of llm.txt and llm-full.txt content

**Phase 2: Validation** (P2):
1. Implement Python validation script
2. Add `validate:llm` to package.json
3. Run validation and fix any errors
4. Integrate with `yarn check:all`

**Phase 3: Footer Links** (P1 MVP):
1. Create `content/llm-links.yaml`
2. Update Footer component
3. Test footer links on all pages
4. Verify accessibility (keyboard, screen reader)

**Phase 4: CI/CD Integration** (P2):
1. Add validation to GitHub Actions workflow
2. Test PR workflow end-to-end
3. Verify build fails on validation errors

**Phase 5: Documentation** (P3):
1. Create `/docs/llm-data-format.md` explaining format
2. Document generation process
3. Document validation requirements
4. Add examples of good llm.txt content

**Rollback Plan**:
- Remove prebuild hook from package.json
- Remove generated files from /public
- Revert Footer component changes
- Feature is cleanly removable without side effects

**Success Metrics**:
- Build completes in <60s (including LLM generation)
- Validation passes on first run
- Footer links accessible and functional
- LLM files loadable in ChatGPT/Claude

**Alternatives Considered**:
- Big bang release: Higher risk, harder to debug
- Feature flag: Unnecessary complexity for build-time feature
- Beta testing with select users: LLM files are passive, no user impact

**Why Phased Rollout**: Reduces risk, allows incremental validation, easy to debug issues.

## Summary

**Key Decisions**:
1. **Format**: llms.txt specification (plain text with metadata headers)
2. **Architecture**: Two files (basic + full), TypeScript generation, Python validation
3. **Integration**: Prebuild hook, Footer links, static file serving
4. **Validation**: Multi-layer approach (build-time, CI/CD, manual)
5. **Performance**: Static files with CDN caching, <30s generation time

**No Unresolved Questions**: All technical decisions made with clear rationale and alternatives considered.

**Ready for Phase 1**: Data model and contracts can now be defined based on this research.
