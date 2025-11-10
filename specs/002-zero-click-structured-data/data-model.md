# Data Model: Zero-Click SEO Optimization

**Date**: 2025-11-07  
**Feature**: Zero-Click SEO Optimization  
**Phase**: 1 - Design & Contracts

## Entity Definitions

### 1. Structured Data Schema (JSON-LD)

**Purpose**: Machine-readable metadata embedded in HTML pages following Schema.org vocabulary

**Properties**:

- `@context`: string - Always "https://schema.org"
- `@type`: string | string[] - Schema type(s) (e.g., "BlogPosting", "Organization")
- `@id`: string (optional) - Unique identifier for the entity
- Additional properties vary by type (see type-specific schemas below)

**Validation Rules**:

- Must be valid JSON
- Must include required properties for the specified @type
- Property values must match expected types (string, URL, Date, nested object)
- URLs must be absolute (https://)
- Dates must be ISO 8601 format

**Relationships**:

- Can be nested (e.g., Person inside Article.author)
- Can reference other schemas via @id
- Multiple schemas can exist on one page (array of objects)

---

### 2. Organization Schema

**Purpose**: Represents Cennso company information for knowledge panel and brand search results

**Required Properties**:

- `name`: string - Company name ("Cennso")
- `url`: string (URL) - Company website homepage
- `logo`: string (URL) - Company logo (ImageObject or direct URL)
- `description`: string - Brief company description

**Optional Properties**:

- `address`: PostalAddress object - Company address
- `contactPoint`: ContactPoint object - Contact information
- `sameAs`: string[] (URLs) - Social media profile URLs
- `foundingDate`: string (Date) - Company founding date
- `founder`: Person[] - Company founders
- `email`: string - Contact email
- `telephone`: string - Contact phone

**Source Data**: `content/landing-page.yaml`, `content/about-page.yaml`

**Used On**: All pages (global organization schema)

---

### 3. Article/BlogPosting Schema

**Purpose**: Represents blog posts and articles for rich result cards and featured snippets

**Required Properties**:

- `@type`: "BlogPosting" (for blogs) or "Article" (for other content)
- `headline`: string - Article title (max 110 characters)
- `author`: Person object or Person[] - Article author(s)
- `datePublished`: string (Date) - Publication date (ISO 8601)
- `dateModified`: string (Date) - Last modification date
- `publisher`: Organization object - Publishing organization (Cennso)
- `image`: string (URL) or ImageObject - Article cover image

**Optional Properties**:

- `description`: string - Article excerpt/summary
- `articleBody`: string - Full article text content
- `keywords`: string[] - Article keywords/tags
- `wordCount`: number - Article word count
- `articleSection`: string - Article category
- `inLanguage`: string - Content language (e.g., "en-US")

**Source Data**: `content/blog-posts/*.mdx` frontmatter + content

**Used On**: Blog post pages (`/blog/[slug]`)

**Validation Rules**:

- headline must be ≤110 characters
- datePublished must be ≤ current date
- dateModified must be ≥ datePublished
- image must be absolute URL to WebP image
- author must reference valid Person schema

---

### 4. Person Schema

**Purpose**: Represents individual authors and team members for author rich cards

**Required Properties**:

- `name`: string - Person's full name
- `url`: string (URL) - Person's profile page URL

**Optional Properties**:

- `image`: string (URL) or ImageObject - Person's avatar/photo
- `jobTitle`: string - Person's role/position
- `worksFor`: Organization object - Employer (Cennso)
- `description`: string - Bio/description
- `sameAs`: string[] (URLs) - Social profiles (LinkedIn, GitHub, etc.)
- `email`: string - Contact email

**Source Data**: `content/authors.yaml`

**Used On**:

- Author profile pages (if/when created)
- Nested in Article.author for blog posts
- Team page (if/when created)

**Validation Rules**:

- name must match author ID in authors.yaml
- image should be WebP format, ≤100KB
- url must be absolute

---

### 5. BreadcrumbList Schema

**Purpose**: Represents page navigation hierarchy for breadcrumb display in search results

**Required Properties**:

- `@type`: "BreadcrumbList"
- `itemListElement`: ListItem[] - Array of breadcrumb items

**ListItem Properties**:

- `@type`: "ListItem"
- `position`: number - 1-indexed position in breadcrumb trail
- `name`: string - Display text for breadcrumb
- `item`: string (URL) - URL of the page

**Source Data**: Generated from page URL structure and `lib/navigation.ts`

**Used On**: All pages (global navigation hierarchy)

**Validation Rules**:

- position must start at 1 and increment sequentially
- First item should always be homepage ("/")
- Last item is current page
- URLs must be absolute
- Minimum 2 items (home + current)

---

### 6. FAQPage Schema

**Purpose**: Represents FAQ content for "People Also Ask" boxes

**Required Properties**:

- `@type`: "FAQPage"
- `mainEntity`: Question[] - Array of Question objects

**Question Properties**:

- `@type`: "Question"
- `name`: string - The question text
- `acceptedAnswer`: Answer object

**Answer Properties**:

- `@type`: "Answer"
- `text`: string - The answer text

**Source Data**:

- Extracted from MDX content with FAQ structure
- Dedicated FAQ sections in YAML content files

**Used On**: Pages with Q&A format content

**Validation Rules**:

- name (question) should be natural language query
- text (answer) should be 40-300 words
- At least 2 question/answer pairs required
- Questions should be unique within page

---

### 7. Service Schema

**Purpose**: Represents service offerings for service-related rich results

**Required Properties**:

- `@type`: "Service"
- `name`: string - Service name
- `description`: string - Service description
- `provider`: Organization object - Service provider (Cennso)

**Optional Properties**:

- `serviceType`: string - Type/category of service
- `areaServed`: string - Geographic area served
- `hasOfferCatalog`: OfferCatalog - Catalog of service offerings
- `category`: string - Service category

**Source Data**: `content/solutions/*.mdx`

**Used On**: Solution/service pages (`/solutions/[slug]`)

---

### 8. LocalBusiness Schema

**Purpose**: Represents company location for local search and map results

**Required Properties**:

- `@type`: "LocalBusiness" (or more specific subtype)
- `name`: string - Business name
- `address`: PostalAddress object
- `telephone`: string - Contact phone

**Optional Properties**:

- `geo`: GeoCoordinates object - Latitude/longitude
- `openingHours`: string - Business hours
- `priceRange`: string - Price indicator (e.g., "$$")
- `image`: string (URL) - Business location photo

**PostalAddress Properties**:

- `@type`: "PostalAddress"
- `streetAddress`: string
- `addressLocality`: string (city)
- `addressRegion`: string (state/province)
- `postalCode`: string
- `addressCountry`: string (ISO code)

**GeoCoordinates Properties**:

- `@type`: "GeoCoordinates"
- `latitude`: number
- `longitude`: number

**Source Data**: `content/contact-page.yaml`

**Used On**: Contact page, company information pages

---

## Schema Composition Patterns

### Pattern 1: Multiple Schemas on One Page

Pages can include multiple independent schemas:

```json
[
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Cennso",
    ...
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [...]
  }
]
```

**Used On**: All pages (Organization + BreadcrumbList minimum)

### Pattern 2: Nested Schemas

Schemas can reference other schemas:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Mobile Core Modernization: A Complete Guide",
  "author": {
    "@type": "Person",
    "name": "John Doe",
    "url": "https://www.cennso.com/authors/john-doe"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Cennso",
    "logo": "https://www.cennso.com/assets/logo.png"
  }
}
```

**Used On**: Blog posts, articles, success stories

### Pattern 3: Schema References via @id

Schemas can reference each other by ID to avoid duplication:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.cennso.com/#organization",
  "name": "Cennso",
  ...
}

// Later in another schema:
{
  "@type": "BlogPosting",
  "publisher": { "@id": "https://www.cennso.com/#organization" }
}
```

**Used On**: When same entity appears in multiple schemas on one page

---

## Data Flow

```
Content Source (YAML/MDX)
    ↓
Schema Generator Functions (TypeScript)
    ↓
JSON-LD Object (validated)
    ↓
SchemaOrg Component (React)
    ↓
HTML <script type="application/ld+json"> (SSG)
    ↓
Search Engine Crawler (Google, Bing)
    ↓
Rich Results / Knowledge Panel (SERP)
```

---

## Validation State Machine

```
[Draft Schema]
    ↓ TypeScript type checking
[Type-Valid Schema]
    ↓ JSON Schema validation
[Schema.org Valid]
    ↓ Google Rich Results Test
[Eligible for Rich Results]
    ↓ Deployed to production
[Indexed by Search Engines]
    ↓ Performance monitoring
[Active in Search Results]
```

**State Transitions**:

- Draft → Type-Valid: Compilation passes
- Type-Valid → Schema.org Valid: Build validation passes
- Schema.org Valid → Eligible: Google API returns "eligible" status
- Eligible → Indexed: Search Console shows "discovered" status
- Indexed → Active: Search Console shows "served" in rich results report

**Error Handling**:

- Type errors: Fail build, show compiler error
- Schema errors: Fail build, show validation message
- Google ineligible: Log warning, deploy anyway (may fix with content updates)
- Indexing delays: Monitor in Search Console, no action needed

---

## Implementation Notes

1. **Single Source of Truth**: All structured data generated from existing content files, no duplication
2. **Type Safety**: TypeScript interfaces for every Schema.org type ensure compile-time validation
3. **Composability**: Schema generators can call other generators for nested schemas
4. **Testability**: Pure functions make unit testing straightforward
5. **Performance**: All generation happens at build time, zero runtime overhead
