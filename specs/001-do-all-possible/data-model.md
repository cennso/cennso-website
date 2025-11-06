# Data Model: SEO Optimization

**Feature**: 001-do-all-possible  
**Date**: 2025-11-06  
**Purpose**: Define data structures for SEO metadata, structured data, and validation entities

---

## Entity: SEOMetadata

**Purpose**: Represents complete SEO metadata for a single page

**Properties**:
- `title` (string, required): Page title tag content (50-60 characters recommended)
- `description` (string, required): Meta description content (150-160 characters recommended)
- `canonical` (string, required): Canonical URL (absolute, HTTPS)
- `ogTitle` (string, optional): Open Graph title (defaults to `title`)
- `ogDescription` (string, optional): Open Graph description (defaults to `description`)
- `ogImage` (string, required): Open Graph image URL (absolute, 1200x630px)
- `ogType` (string, optional): Open Graph type (default: "website", articles use "article")
- `twitterCard` (string, optional): Twitter Card type ("summary" or "summary_large_image", default: "summary_large_image")
- `twitterSite` (string, optional): Twitter handle (e.g., "@cennso")
- `twitterCreator` (string, optional): Content creator Twitter handle
- `noindex` (boolean, optional): Prevent indexing (default: false)
- `nofollow` (boolean, optional): Prevent following links (default: false)
- `articlePublishedTime` (ISO8601 string, optional): Publication date for articles
- `articleModifiedTime` (ISO8601 string, optional): Last modification date for articles
- `articleAuthor` (string[], optional): Article author names

**Validation Rules**:
- `title` length MUST be 1-60 characters
- `description` length MUST be 1-160 characters
- `canonical` MUST be absolute URL starting with https://
- `ogImage` MUST be absolute URL starting with https://
- `ogType` MUST be one of: "website", "article", "profile"
- `twitterCard` MUST be one of: "summary", "summary_large_image"
- `articlePublishedTime` MUST be valid ISO 8601 date if present
- `articleModifiedTime` MUST be valid ISO 8601 date if present

**TypeScript Interface**:
```typescript
export interface SEOMetadata {
  title: string
  description: string
  canonical: string
  ogTitle?: string
  ogDescription?: string
  ogImage: string
  ogType?: 'website' | 'article' | 'profile'
  twitterCard?: 'summary' | 'summary_large_image'
  twitterSite?: string
  twitterCreator?: string
  noindex?: boolean
  nofollow?: boolean
  articlePublishedTime?: string  // ISO 8601
  articleModifiedTime?: string   // ISO 8601
  articleAuthor?: string[]
}
```

---

## Entity: OrganizationSchema

**Purpose**: Represents schema.org Organization structured data (homepage, global)

**Properties**:
- `@context` (string, required): Always "https://schema.org"
- `@type` (string, required): Always "Organization"
- `name` (string, required): Company name
- `url` (string, required): Company website URL (absolute)
- `logo` (string, required): Company logo URL (absolute)
- `description` (string, optional): Company description
- `contactPoint` (ContactPoint, optional): Contact information
- `sameAs` (string[], optional): Social media profile URLs
- `address` (PostalAddress, optional): Physical address

**Nested: ContactPoint**:
- `@type` (string, required): Always "ContactPoint"
- `telephone` (string, required): Phone number (E.164 format recommended)
- `contactType` (string, required): Type of contact (e.g., "customer service")
- `email` (string, optional): Contact email
- `areaServed` (string, optional): Geographic area served
- `availableLanguage` (string[], optional): Languages spoken

**Nested: PostalAddress**:
- `@type` (string, required): Always "PostalAddress"
- `streetAddress` (string, required): Street address
- `addressLocality` (string, required): City
- `addressRegion` (string, optional): State/province
- `postalCode` (string, required): ZIP/postal code
- `addressCountry` (string, required): Country code (ISO 3166-1 alpha-2, e.g., "US")

**Validation Rules**:
- `name` MUST NOT be empty
- `url` MUST be absolute HTTPS URL
- `logo` MUST be absolute HTTPS URL to image
- `sameAs` URLs MUST be absolute HTTPS URLs
- `telephone` SHOULD follow E.164 format (+1234567890)
- `addressCountry` MUST be valid ISO 3166-1 alpha-2 code

**TypeScript Interface**:
```typescript
export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url: string
  logo: string
  description?: string
  contactPoint?: ContactPointSchema
  sameAs?: string[]
  address?: PostalAddressSchema
}

export interface ContactPointSchema {
  '@type': 'ContactPoint'
  telephone: string
  contactType: string
  email?: string
  areaServed?: string
  availableLanguage?: string[]
}

export interface PostalAddressSchema {
  '@type': 'PostalAddress'
  streetAddress: string
  addressLocality: string
  addressRegion?: string
  postalCode: string
  addressCountry: string
}
```

---

## Entity: ArticleSchema

**Purpose**: Represents schema.org Article structured data (blog posts, success stories)

**Properties**:
- `@context` (string, required): Always "https://schema.org"
- `@type` (string, required): "Article", "BlogPosting", or "NewsArticle"
- `headline` (string, required): Article title (≤110 characters for AMP)
- `description` (string, optional): Article summary/excerpt
- `image` (string | string[], required): Featured image URL(s)
- `datePublished` (ISO8601 string, required): Publication date
- `dateModified` (ISO8601 string, optional): Last modification date
- `author` (Person | Person[], required): Article author(s)
- `publisher` (Organization, required): Publishing organization
- `mainEntityOfPage` (string, optional): Canonical URL
- `articleBody` (string, optional): Full article text (optional for SEO)
- `keywords` (string[], optional): Article keywords/tags

**Nested: Person (Author)**:
- `@type` (string, required): Always "Person"
- `name` (string, required): Author full name
- `url` (string, optional): Author profile URL
- `image` (string, optional): Author avatar URL
- `jobTitle` (string, optional): Author job title
- `sameAs` (string[], optional): Author social media URLs

**Validation Rules**:
- `headline` length SHOULD be ≤110 characters (Google truncates longer headlines)
- `image` MUST be absolute HTTPS URL(s), minimum 1200x675px recommended
- `datePublished` MUST be valid ISO 8601 date
- `dateModified` MUST be >= `datePublished` if present
- `author.name` MUST NOT be empty
- `publisher` MUST reference Organization schema (can reuse global organization)

**TypeScript Interface**:
```typescript
export interface ArticleSchema {
  '@context': 'https://schema.org'
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle'
  headline: string
  description?: string
  image: string | string[]
  datePublished: string  // ISO 8601
  dateModified?: string  // ISO 8601
  author: PersonSchema | PersonSchema[]
  publisher: OrganizationSchema
  mainEntityOfPage?: string
  articleBody?: string
  keywords?: string[]
}

export interface PersonSchema {
  '@type': 'Person'
  name: string
  url?: string
  image?: string
  jobTitle?: string
  sameAs?: string[]
}
```

---

## Entity: JobPostingSchema

**Purpose**: Represents schema.org JobPosting structured data (job listings)

**Properties**:
- `@context` (string, required): Always "https://schema.org"
- `@type` (string, required): Always "JobPosting"
- `title` (string, required): Job title
- `description` (string, required): Job description (HTML allowed)
- `datePosted` (ISO8601 string, required): Date job was posted
- `validThrough` (ISO8601 string, optional): Expiration date
- `employmentType` (string[], optional): Employment type(s) (FULL_TIME, PART_TIME, CONTRACTOR, etc.)
- `hiringOrganization` (Organization, required): Hiring company
- `jobLocation` (Place, required): Job location or TELECOMMUTE
- `baseSalary` (MonetaryAmount, optional): Salary information
- `directApply` (boolean, optional): Can apply directly via website

**Nested: Place (JobLocation)**:
- `@type` (string, required): Always "Place"
- `address` (PostalAddress | string, required): Physical address or "TELECOMMUTE"

**Nested: MonetaryAmount (BaseSalary)**:
- `@type` (string, required): Always "MonetaryAmount"
- `currency` (string, required): Currency code (ISO 4217, e.g., "USD")
- `value` (number | object, required): Salary amount or range
  - If range: `{ minValue: number, maxValue: number, unitText: 'YEAR' | 'MONTH' | 'HOUR' }`

**Validation Rules**:
- `title` MUST NOT be empty
- `description` MUST be at least 300 characters (Google requirement)
- `datePosted` MUST be valid ISO 8601 date
- `validThrough` MUST be >= `datePosted` if present
- `employmentType` values MUST be from: FULL_TIME, PART_TIME, CONTRACTOR, TEMPORARY, INTERN, VOLUNTEER, PER_DIEM, OTHER
- `baseSalary.currency` MUST be valid ISO 4217 code

**TypeScript Interface**:
```typescript
export interface JobPostingSchema {
  '@context': 'https://schema.org'
  '@type': 'JobPosting'
  title: string
  description: string
  datePosted: string  // ISO 8601
  validThrough?: string  // ISO 8601
  employmentType?: Array<'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'TEMPORARY' | 'INTERN' | 'VOLUNTEER' | 'PER_DIEM' | 'OTHER'>
  hiringOrganization: OrganizationSchema
  jobLocation: PlaceSchema
  baseSalary?: MonetaryAmountSchema
  directApply?: boolean
}

export interface PlaceSchema {
  '@type': 'Place'
  address: PostalAddressSchema | 'TELECOMMUTE'
}

export interface MonetaryAmountSchema {
  '@type': 'MonetaryAmount'
  currency: string  // ISO 4217
  value: number | {
    minValue: number
    maxValue: number
    unitText: 'YEAR' | 'MONTH' | 'HOUR'
  }
}
```

---

## Entity: LocalBusinessSchema

**Purpose**: Represents schema.org LocalBusiness structured data (contact page)

**Properties**:
- `@context` (string, required): Always "https://schema.org"
- `@type` (string, required): "LocalBusiness" or more specific type (e.g., "ProfessionalService")
- `name` (string, required): Business name
- `image` (string, optional): Business image/photo
- `telephone` (string, required): Phone number
- `email` (string, optional): Contact email
- `address` (PostalAddress, required): Physical address
- `geo` (GeoCoordinates, optional): Geographic coordinates
- `url` (string, optional): Website URL
- `openingHoursSpecification` (OpeningHours[], optional): Business hours
- `priceRange` (string, optional): Price range indicator (e.g., "$$")

**Nested: GeoCoordinates**:
- `@type` (string, required): Always "GeoCoordinates"
- `latitude` (number, required): Latitude (-90 to 90)
- `longitude` (number, required): Longitude (-180 to 180)

**Nested: OpeningHoursSpecification**:
- `@type` (string, required): Always "OpeningHoursSpecification"
- `dayOfWeek` (string[], required): Days of week (e.g., ["Monday", "Tuesday"])
- `opens` (string, required): Opening time (HH:MM format, 24-hour)
- `closes` (string, required): Closing time (HH:MM format, 24-hour)

**Validation Rules**:
- `name` MUST NOT be empty
- `telephone` SHOULD follow E.164 format
- `address` MUST be complete PostalAddress
- `geo.latitude` MUST be between -90 and 90
- `geo.longitude` MUST be between -180 and 180
- `opens` and `closes` MUST be in HH:MM 24-hour format
- `dayOfWeek` values MUST be: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

**TypeScript Interface**:
```typescript
export interface LocalBusinessSchema {
  '@context': 'https://schema.org'
  '@type': 'LocalBusiness' | 'ProfessionalService'
  name: string
  image?: string
  telephone: string
  email?: string
  address: PostalAddressSchema
  geo?: GeoCoordinatesSchema
  url?: string
  openingHoursSpecification?: OpeningHoursSpecificationSchema[]
  priceRange?: string
}

export interface GeoCoordinatesSchema {
  '@type': 'GeoCoordinates'
  latitude: number
  longitude: number
}

export interface OpeningHoursSpecificationSchema {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>
  opens: string  // HH:MM
  closes: string  // HH:MM
}
```

---

## Entity: BreadcrumbListSchema

**Purpose**: Represents schema.org BreadcrumbList structured data (all pages with navigation hierarchy)

**Properties**:
- `@context` (string, required): Always "https://schema.org"
- `@type` (string, required): Always "BreadcrumbList"
- `itemListElement` (ListItem[], required): Breadcrumb items in order

**Nested: ListItem**:
- `@type` (string, required): Always "ListItem"
- `position` (number, required): Position in list (1-indexed)
- `name` (string, required): Breadcrumb label
- `item` (string, required): Breadcrumb URL (absolute)

**Validation Rules**:
- `itemListElement` MUST have at least 2 items (home + current page)
- `position` MUST be sequential starting from 1
- `item` MUST be absolute HTTPS URL
- `name` MUST NOT be empty

**TypeScript Interface**:
```typescript
export interface BreadcrumbListSchema {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbItemSchema[]
}

export interface BreadcrumbItemSchema {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}
```

---

## Entity: ServiceSchema

**Purpose**: Represents schema.org Service structured data (solution pages)

**Properties**:
- `@context` (string, required): Always "https://schema.org"
- `@type` (string, required): Always "Service"
- `name` (string, required): Service name
- `description` (string, required): Service description
- `provider` (Organization, required): Service provider (organization)
- `serviceType` (string, optional): Type of service
- `areaServed` (string | string[], optional): Geographic area served
- `offers` (Offer, optional): Pricing/availability information

**Nested: Offer**:
- `@type` (string, required): Always "Offer"
- `url` (string, optional): URL to purchase/learn more
- `priceCurrency` (string, optional): Currency code (ISO 4217)
- `price` (number, optional): Price
- `availability` (string, optional): "InStock", "OutOfStock", etc.

**Validation Rules**:
- `name` MUST NOT be empty
- `description` MUST be at least 100 characters
- `provider` MUST reference Organization schema
- `offers.priceCurrency` MUST be valid ISO 4217 code if present
- `offers.availability` MUST be schema.org ItemAvailability value if present

**TypeScript Interface**:
```typescript
export interface ServiceSchema {
  '@context': 'https://schema.org'
  '@type': 'Service'
  name: string
  description: string
  provider: OrganizationSchema
  serviceType?: string
  areaServed?: string | string[]
  offers?: OfferSchema
}

export interface OfferSchema {
  '@type': 'Offer'
  url?: string
  priceCurrency?: string  // ISO 4217
  price?: number
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'Discontinued'
}
```

---

## Entity: SitemapEntry

**Purpose**: Represents a single entry in sitemap.xml

**Properties**:
- `loc` (string, required): Page URL (absolute, HTTPS)
- `lastmod` (ISO8601 string, optional): Last modification date
- `changefreq` (string, optional): Change frequency hint
- `priority` (number, optional): Priority hint (0.0 to 1.0)

**Validation Rules**:
- `loc` MUST be absolute HTTPS URL
- `lastmod` MUST be valid ISO 8601 date if present
- `changefreq` MUST be one of: always, hourly, daily, weekly, monthly, yearly, never
- `priority` MUST be between 0.0 and 1.0 if present

**TypeScript Interface**:
```typescript
export interface SitemapEntry {
  loc: string
  lastmod?: string  // ISO 8601
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number  // 0.0 - 1.0
}
```

---

## Entity: SEOValidationResult

**Purpose**: Represents validation result for SEO checks

**Properties**:
- `page` (string, required): Page path being validated
- `checks` (ValidationCheck[], required): Individual validation checks
- `passed` (boolean, required): Overall pass/fail status
- `errors` (string[], required): Error messages (empty if passed)
- `warnings` (string[], required): Warning messages

**Nested: ValidationCheck**:
- `name` (string, required): Check name (e.g., "title-length", "meta-description-present")
- `passed` (boolean, required): Whether check passed
- `message` (string, optional): Descriptive message
- `severity` (string, required): "error" or "warning"

**TypeScript Interface**:
```typescript
export interface SEOValidationResult {
  page: string
  checks: ValidationCheck[]
  passed: boolean
  errors: string[]
  warnings: string[]
}

export interface ValidationCheck {
  name: string
  passed: boolean
  message?: string
  severity: 'error' | 'warning'
}
```

---

## Relationships

```
SEOMetadata (1) ←→ (1) Page
  - Every page has exactly one SEOMetadata instance

OrganizationSchema (1) ←→ (∞) Page
  - Global organization schema embedded in _document.tsx
  - Referenced by ArticleSchema.publisher and other schemas

ArticleSchema (1) ←→ (1) BlogPost/SuccessStory
  - Blog posts and success stories have Article schema

JobPostingSchema (1) ←→ (1) Job
  - Job listing pages have JobPosting schema

LocalBusinessSchema (1) ←→ (1) ContactPage
  - Contact page has LocalBusiness schema

BreadcrumbListSchema (1) ←→ (∞) Page
  - All pages with breadcrumbs have BreadcrumbList schema
  - Generated from PageHeader breadcrumbs prop

ServiceSchema (1) ←→ (1) SolutionPage
  - Solution pages have Service schema

SitemapEntry (∞) ←→ (1) Sitemap
  - Sitemap.xml contains multiple SitemapEntry instances
  - One entry per public page

SEOValidationResult (1) ←→ (1) Page
  - Validation results generated per page during validation
```

---

## State Transitions

### SEO Metadata Lifecycle

1. **Draft**: Content created with minimal SEO metadata (title only)
2. **Enhanced**: Description, OG image, and other meta tags added
3. **Optimized**: Character limits enforced, keywords incorporated
4. **Published**: Metadata frozen at build time via getStaticProps
5. **Updated**: Content modified, articleModifiedTime updated

**Validation Points**:
- Pre-commit: Local validation via `yarn seo:validate`
- PR: CI/CD validation ensures all checks pass
- Post-deployment: Google Search Console monitors indexing

### Structured Data Lifecycle

1. **Generated**: Schema created from page data in getStaticProps
2. **Validated**: JSON-LD validated against schema.org spec
3. **Embedded**: JSON-LD injected into <script> tag in <head>
4. **Crawled**: Search engines parse structured data
5. **Rendered**: Rich results appear in search (if eligible)

**Validation Points**:
- Build time: JSON validation in structured data builders
- PR validation: Google Rich Results Test API
- Post-deployment: Google Search Console Rich Results report

---

## Indexes and Access Patterns

### Meta Tag Access
- Primary access: By page path (e.g., `/blog/my-post`)
- Lookup pattern: `getStaticProps` → load content → generate SEOMetadata → pass to <SEO> component

### Structured Data Access
- Primary access: By page type (e.g., "blog-post", "job", "solution")
- Lookup pattern: `getStaticProps` → detect page type → call appropriate schema builder → embed JSON-LD

### Sitemap Access
- Build-time generation: `next-sitemap` scans `/pages` directory
- Runtime access: Served statically at `/sitemap.xml`

### Validation Results
- Access pattern: By page path for individual results
- Aggregation: All results combined for CI/CD pass/fail decision

---

## Data Integrity Constraints

### Cross-Entity Constraints
- `SEOMetadata.canonical` MUST match actual page URL
- `ArticleSchema.datePublished` MUST match `SEOMetadata.articlePublishedTime`
- `BreadcrumbList.itemListElement[last].item` MUST match page canonical URL
- `ArticleSchema.publisher` MUST reference the same Organization across all articles

### Format Constraints
- All ISO 8601 dates MUST include timezone (prefer UTC with 'Z' suffix)
- All URLs MUST be absolute and use HTTPS protocol
- All schema.org @type values MUST be valid schema.org types
- All currency codes MUST be valid ISO 4217 codes
- All country codes MUST be valid ISO 3166-1 alpha-2 codes

### Business Rules
- Blog posts MUST have at least one author
- Job postings MUST have description ≥300 characters
- Solutions MUST have description ≥100 characters
- All pages (except homepage) MUST have breadcrumbs
- Homepage MUST have Organization schema
- Contact page MUST have LocalBusiness schema with physical address

---

## Performance Considerations

### JSON-LD Size Limits
- Target: <5KB per schema instance
- Maximum: 10KB total structured data per page
- Monitoring: Add to Lighthouse custom audits if exceeds limits

### Build-Time Generation
- All structured data generated during `getStaticProps` (no runtime overhead)
- Schema builders should be pure functions (no I/O, deterministic)
- Cache schema templates in memory where appropriate

### Validation Performance
- Validation scripts should complete in <30 seconds for full site
- Parallelize page validation where possible
- Cache validation results during CI/CD to avoid re-validation

---

## Migration Strategy

### Phase 1: Core SEO (Weeks 1-2)
- Enhance `<SEO>` component with all meta tag properties
- Add `OrganizationSchema` to `_document.tsx`
- Implement `BreadcrumbListSchema` for all pages with breadcrumbs

### Phase 2: Content Schemas (Weeks 3-4)
- Add `ArticleSchema` to blog posts and success stories
- Implement `JobPostingSchema` for job listings
- Add `ServiceSchema` to solution pages

### Phase 3: Local + Advanced (Weeks 5-6)
- Add `LocalBusinessSchema` to contact page
- Implement automated validation scripts
- Set up Google Search Console integration
- Create SEO monitoring dashboard

### Rollback Strategy
- Schema.org: Remove `<SchemaOrg>` component wrapper, page still functions
- Meta tags: Existing `<SEO>` component already provides basic tags
- Validation: Can be disabled in CI/CD if blocking deployments
