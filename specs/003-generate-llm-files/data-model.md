# Data Model: LLM-Friendly Data Exposure

**Date**: 2025-11-12  
**Feature**: LLM-Friendly Data Exposure  
**Purpose**: Define data structures, transformations, and relationships for LLM file generation

## Overview

This data model describes how content from various sources (YAML, MDX) is transformed into LLM-friendly plain text format following the llms.txt specification.

## Entities

### 1. LLMDocument

**Description**: Root structure representing a complete LLM text file (llms.txt or llms-full.txt)

**Fields**:

- `metadata`: DocumentMetadata - File metadata headers
- `sections`: Section[] - Ordered list of content sections
- `generatedAt`: Date - Timestamp of generation
- `fileType`: 'basic' | 'full' - Which file type this represents

**Validation Rules**:

- Must have at least one section
- Metadata fields must be present and valid
- File size must be within limits (5MB basic, 20MB full)

**Relationships**:

- Contains multiple Section entities
- Has one DocumentMetadata entity

---

### 2. DocumentMetadata

**Description**: Metadata headers that appear at the top of LLM text files

**Fields**:

- `url`: string - Canonical website URL (e.g., "https://www.cennso.com")
- `lastUpdated`: string - ISO 8601 timestamp of generation
- `version`: string - File format version (e.g., "1.0")
- `contentSummary`: string - Brief description of website content

**Validation Rules**:

- `url` must be absolute HTTPS URL
- `lastUpdated` must be valid ISO 8601 format
- `version` must follow semver pattern
- `contentSummary` must be 1-200 characters

**Format Example**:

```
> url: https://www.cennso.com
> last_updated: 2025-11-12T10:30:00Z
> version: 1.0
> content_summary: Mobile core network solutions, consulting services, success stories
```

---

### 3. Section

**Description**: Major content section within an LLM document (e.g., About, Services, Blog Posts)

**Fields**:

- `title`: string - Section heading (e.g., "About", "Services", "Blog Posts")
- `level`: 1 | 2 - Heading level (# or ##)
- `content`: string | ContentItem[] - Section content (text or structured items)
- `schemaType`?: string - Optional Schema.org type reference (e.g., "BlogPosting", "Organization")

**Validation Rules**:

- `title` must be non-empty
- `level` must be 1 or 2
- If `content` is array, all items must be valid ContentItem
- `schemaType` must be valid Schema.org type if present

**Section Types**:

- **About**: Company description (text)
- **Services**: List of services (ContentItem[])
- **Contact**: Contact information (text)
- **Blog Posts**: List of blog posts (ContentItem[])
- **Solutions**: List of solutions (ContentItem[])
- **Success Stories**: List of case studies (ContentItem[])
- **Team**: List of team members (ContentItem[], full only)
- **Jobs**: List of job postings (ContentItem[], full only)
- **Testimonials**: List of testimonials (ContentItem[], full only)

**Relationships**:

- Belongs to one LLMDocument
- Contains multiple ContentItem entities (if structured)

---

### 4. ContentItem

**Description**: Individual piece of structured content within a section (blog post, solution, job, etc.)

**Fields**:

- `title`: string - Item title
- `url`: string - Absolute URL to item page
- `author`?: string - Author name(s) (for blog posts)
- `published`?: string - Publication date (ISO 8601 or human-readable)
- `summary`: string - Brief description or excerpt
- `fullContent`?: string - Complete content text (full file only)
- `metadata`?: Record<string, string> - Additional type-specific fields

**Validation Rules**:

- `title` must be non-empty
- `url` must be absolute URL starting with site domain
- `summary` must be 50-500 characters
- `fullContent` only present in llms-full.txt

**Content Types**:

- **BlogPost**: title, url, author, published, summary, fullContent
- **Solution**: title, url, summary, fullContent
- **SuccessStory**: title, url, summary, fullContent
- **JobPosting**: title, url, published, summary, fullContent
- **TeamMember**: name (title), role (summary), bio (fullContent)
- **Testimonial**: author (title), company (metadata), quote (summary)

**Relationships**:

- Belongs to one Section
- May reference Author entity (blog posts)

---

### 5. Author

**Description**: Author information resolved from authors.yaml

**Fields**:

- `id`: string - Unique author identifier (from YAML)
- `name`: string - Full name
- `position`?: string - Job title
- `company`?: string - Company affiliation
- `avatar`?: string - Avatar image path
- `bio`?: string - Short biography

**Source**: `content/authors.yaml`

**Validation Rules**:

- `id` must match reference in content files
- `name` must be non-empty
- All referenced authors must exist in authors.yaml

**Relationships**:

- Referenced by ContentItem (blog posts)

---

## Data Transformations

### Input Sources → Entities

#### 1. Blog Posts (MDX → ContentItem)

**Source**: `content/blog-posts/*.mdx`

**Transformation**:

```typescript
// Input: MDX file with frontmatter
{
  title: string
  date: string
  authors: string[]  // author IDs
  category: string
  excerpt: string
  content: string  // MDX content
}

// Output: ContentItem
{
  title: frontmatter.title
  url: `${siteUrl}/blog/${slug}`
  author: authors.map(id => resolveAuthor(id).name).join(', ')
  published: formatDate(frontmatter.date)
  summary: frontmatter.excerpt
  fullContent: stripMDX(content)  // llms-full.txt only
}
```

**Text Cleaning**:

- Strip JSX components: `<Component />` → removed
- Convert Markdown: `**bold**` → plain text
- Remove code blocks: ` ```code``` ` → removed
- Preserve structure: Use line breaks and indentation
- Absolute URLs: `/path` → `https://www.cennso.com/path`

#### 2. Solutions (MDX → ContentItem)

**Source**: `content/solutions/*.mdx`

**Transformation**:

```typescript
// Input: MDX file
{
  title: string
  description: string
  content: string
}

// Output: ContentItem
{
  title: frontmatter.title
  url: `${siteUrl}/solutions/${slug}`
  summary: frontmatter.description
  fullContent: stripMDX(content) // llms-full.txt only
}
```

#### 3. Success Stories (MDX → ContentItem)

**Source**: `content/success-stories/*.mdx`

**Transformation**: Similar to Solutions

#### 4. Jobs (MDX → ContentItem)

**Source**: `content/jobs/*.mdx`

**Transformation**: Similar to Blog Posts with publication date

#### 5. Testimonials (YAML → ContentItem)

**Source**: `content/testimonials.yaml`

**Transformation**:

```typescript
// Input: YAML entry
{
  id: string
  author: string
  position: string
  company: string
  quote: string
  avatar: string
}

// Output: ContentItem
{
  title: author
  url: null // testimonials don't have dedicated pages
  summary: quote
  metadata: {
    ;(position, company)
  }
}
```

#### 6. Static Pages (YAML → Section content)

**Source**: `content/*-page.yaml`

**Transformation**: Extract page.description or page.content as section text

---

## File Structure Templates

### llms.txt (Basic)

```
# llms.txt - LLM-friendly website data
# Generated: [timestamp]

> url: https://www.cennso.com
> last_updated: [ISO 8601]
> version: 1.0
> content_summary: [summary]

# About
[Company description from about-page.yaml]

# Services
- [Service 1 name]: [Brief description]
- [Service 2 name]: [Brief description]
- [Service 3 name]: [Brief description]

# Contact
Email: [email]
Phone: [phone]
Address: [address]
Website: https://www.cennso.com/contact

# Recent Blog Posts (5 most recent)
## [Blog Post 1 Title]
URL: https://www.cennso.com/blog/post-1
Author: [Author Name]
Published: [Date]
Summary: [Excerpt]

[... 4 more posts ...]

# Solutions
- [Solution 1]: [Description]
- [Solution 2]: [Description]

# Success Stories
- [Story 1]: [Brief summary]
- [Story 2]: [Brief summary]

# Pages
- Home: https://www.cennso.com/
- About: https://www.cennso.com/about
- Services: https://www.cennso.com/services
- Contact: https://www.cennso.com/contact
- Blog: https://www.cennso.com/blog
```

**Estimated Size**: 50-200KB

---

### llms-full.txt (Comprehensive)

```
[Same header and sections as llms.txt, plus:]

# All Blog Posts ([count] posts)
[For each post:]
## [Title]
URL: [url]
Author: [author]
Published: [date]
Category: [category]

[Full post content with HTML/JSX stripped]

---

# All Solutions ([count] solutions)
[For each solution:]
## [Title]
URL: [url]

[Full solution description]

---

# Success Stories ([count] stories)
[For each story:]
## [Title]
URL: [url]

[Full case study content]

---

# Team ([count] members)
[For each team member:]
## [Name]
Position: [position]
Company: [company]

[Biography]

---

# Job Postings ([count] open positions)
[For each job:]
## [Title]
URL: [url]
Posted: [date]
Location: [location]

[Full job description]

---

# Testimonials ([count] testimonials)
[For each testimonial:]
> "[Quote]"
> — [Author], [Position] at [Company]

---

# Partners
[List of partners with descriptions]
```

**Estimated Size**: 1-5MB

---

## Validation Rules

### Document-Level

- File must be valid UTF-8
- File size within limits (5MB basic, 20MB full)
- All required sections present
- No duplicate sections
- Metadata headers valid

### Section-Level

- All section titles non-empty
- Heading levels consistent (# for major, ## for items)
- No empty sections
- Schema.org types valid (if present)

### Content-Level

- All URLs absolute (start with https://www.cennso.com)
- No HTML/JSX tags (`<tag>`)
- No broken internal links
- Timestamps in ISO 8601 format
- Special characters properly encoded (UTF-8)

### Size Constraints

- llms.txt: 1KB - 5MB
- llms-full.txt: 10KB - 20MB
- Individual blog posts: <100KB in full file
- Section sizes reasonable (<500KB per section)

---

## Generation Pipeline

```
1. Load Content Sources
   ├── Parse MDX files (blog, solutions, stories, jobs)
   ├── Parse YAML files (authors, testimonials, partners, pages)
   └── Resolve references (author IDs → author names)

2. Transform to Entities
   ├── Create DocumentMetadata
   ├── Create Section entities for each content type
   └── Create ContentItem entities for each piece of content

3. Apply Filtering (basic vs. full)
   ├── Basic: Recent posts only, summaries only
   └── Full: All content, full text

4. Format as Plain Text
   ├── Generate metadata headers
   ├── Format sections with proper headings
   ├── Convert ContentItems to text blocks
   └── Apply text cleaning (strip HTML/JSX)

5. Validate Output
   ├── Check required sections
   ├── Validate URLs
   ├── Check file size
   └── Run Python validation script

6. Write Files
  ├── Write public/llms.txt
  └── Write public/llms-full.txt
```

---

## State Transitions

LLM files are **stateless** - they are regenerated completely on each build. No incremental updates or state management required.

**Lifecycle**:

1. **Generation**: On `yarn build` (via prebuild hook)
2. **Validation**: Immediately after generation
3. **Serving**: Static files served by Next.js
4. **Expiration**: On next build (files replaced)

**No State Persistence**: Files are ephemeral build artifacts, not stored in database or tracked in version control (added to .gitignore).

---

## Summary

This data model provides:

- Clear entity definitions for LLM document structure
- Transformation rules from source content to LLM format
- Validation requirements at document, section, and content levels
- File structure templates for both basic and full variants
- Generation pipeline overview

**Ready for Contracts**: File format specification can now be formalized in `/contracts` directory.
