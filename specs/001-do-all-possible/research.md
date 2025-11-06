# Research: Comprehensive SEO Optimization

**Feature**: 001-do-all-possible  
**Date**: 2025-11-06  
**Purpose**: Resolve technical unknowns and establish best practices for SEO implementation

---

## Decision 1: Schema.org Implementation Format

**Decision**: Use JSON-LD format for all structured data, embedded in `<script type="application/ld+json">` tags

**Rationale**:
- **Google's Preferred Format**: Google explicitly recommends JSON-LD over Microdata or RDFa
- **Separation of Concerns**: JSON-LD doesn't clutter HTML markup, making it easier to maintain
- **Dynamic Generation**: TypeScript/React can easily generate JSON-LD objects
- **Validation**: JSON-LD is easier to validate programmatically vs. Microdata spread across HTML
- **SSG Compatibility**: Next.js `getStaticProps` can generate JSON-LD at build time

**Alternatives Considered**:
- **Microdata**: Inline HTML attributes (`itemprop`, `itemscope`) - rejected due to HTML clutter and harder validation
- **RDFa**: RDF in Attributes - rejected due to complexity and lower adoption than JSON-LD
- **Both JSON-LD + Microdata**: Redundant and increases page weight

**Implementation Pattern**:
```typescript
// lib/seo/structuredData.ts
export function generateArticleSchema(post: BlogPost): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.date,
    author: { "@type": "Person", name: post.authorName },
    image: post.coverImage,
  }
  return JSON.stringify(schema)
}
```

**References**:
- Google Structured Data Guidelines: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Schema.org JSON-LD: https://schema.org/docs/jsonld.html

---

## Decision 2: Open Graph Image Generation Strategy

**Decision**: Continue using existing OG image generation script (`scripts/generate-og-images/`) with enhancements for blog post thumbnails

**Rationale**:
- **Already Implemented**: System generates OG images during build (`prebuild` script)
- **1200x630px Standard**: Current implementation uses correct dimensions for social platforms
- **SVG-to-PNG Pipeline**: Uses `@resvg/resvg-js` for high-quality rendering
- **Performance**: Pre-generated images avoid runtime overhead

**Enhancements Needed**:
1. **Blog Post Thumbnails**: Auto-generate unique OG images for each blog post using cover image + title overlay
2. **Success Story Images**: Create custom templates for case studies with client logo + metrics
3. **Fallback Logic**: Default OG image when custom image unavailable

**Current Implementation** (no changes needed):
```javascript
// scripts/generate-og-images/index.tsx
// Already generates: landing page, blog, success stories, solutions, jobs, about, contact, partners
```

**Alternatives Considered**:
- **Vercel OG Image**: Runtime generation via Vercel Edge Functions - rejected due to SSG requirement and cold start latency
- **Cloudinary**: Third-party service - rejected to avoid external dependencies and cost
- **Manual Design**: One-off image creation - rejected due to maintenance burden

**References**:
- Open Graph Protocol: https://ogp.me/
- Twitter Cards: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards

---

## Decision 3: Sitemap Generation and Update Strategy

**Decision**: Continue using `next-sitemap` with enhanced configuration for SEO priorities and change frequencies

**Rationale**:
- **Already Integrated**: `next-sitemap.config.js` exists and generates sitemap.xml post-build
- **Automatic Discovery**: Scans `/pages` directory for all routes
- **Dynamic Routes**: Handles `[param]` routes via `getStaticPaths`
- **Build-Time Generation**: Sitemap created during `yarn build`, ensuring accuracy

**Enhancements Needed**:
```javascript
// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://cennso.com',
  generateRobotsTxt: true,
  changefreq: 'weekly',  // Default for all pages
  priority: 0.7,         // Default priority
  transform: async (config, path) => {
    // Custom priority mapping
    if (path === '/') return { ...config, priority: 1.0, changefreq: 'daily' }
    if (path.startsWith('/blog/')) return { ...config, priority: 0.8, changefreq: 'monthly' }
    if (path.startsWith('/solutions/')) return { ...config, priority: 0.9, changefreq: 'weekly' }
    return config
  }
}
```

**Alternatives Considered**:
- **Manual sitemap.xml**: Static file - rejected due to maintenance difficulty with dynamic routes
- **Custom script**: Build own sitemap generator - rejected since next-sitemap handles all requirements
- **Runtime generation**: Generate on request - rejected due to SSG architecture

**References**:
- next-sitemap: https://github.com/iamvishnusankar/next-sitemap
- Sitemap Protocol: https://www.sitemaps.org/protocol.html

---

## Decision 4: Canonical URL Strategy

**Decision**: Implement canonical link tags on all pages with absolute URLs, using environment-based URL resolution

**Rationale**:
- **Duplicate Content Prevention**: Canonical tags tell search engines which version of a page is authoritative
- **HTTPS Preference**: Ensure all canonical URLs use https://cennso.com
- **Vercel Preview URLs**: Canonical tags prevent preview deployments from being indexed

**Implementation Pattern**:
```typescript
// lib/seo/canonical.ts
export function getCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cennso.com'
  return `${baseUrl}${path}`
}

// In page components
<SEO canonical={getCanonicalUrl('/blog/my-post')} />
```

**Edge Cases**:
- **Trailing Slashes**: Decide on consistent pattern (with or without) and enforce
- **Query Parameters**: Canonical URL should exclude query params unless they change content
- **Pagination**: Use `rel="prev"` and `rel="next"` for paginated content

**Alternatives Considered**:
- **Relative Canonical**: `<link rel="canonical" href="/path">` - rejected because Google requires absolute URLs
- **No Canonical Tags**: - rejected because Vercel preview URLs would compete with production

**References**:
- Google Canonical URLs: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls

---

## Decision 5: Internal Linking Strategy

**Decision**: Implement contextual internal linking in blog posts and success stories using a link suggestion system

**Rationale**:
- **PageRank Distribution**: Internal links pass authority to important pages
- **Crawl Depth**: Ensures all pages are within 3 clicks of homepage
- **User Engagement**: Related content links increase time on site (positive SEO signal)
- **Anchor Text Optimization**: Descriptive link text improves keyword relevance

**Implementation Approach**:

1. **Navigation**: Already implemented in `lib/navigation.ts`
2. **Breadcrumbs**: Already implemented in `<PageHeader breadcrumbs={...} />`
3. **Related Content**: Add to blog post and success story pages

```typescript
// lib/seo/relatedContent.ts
export function findRelatedPosts(currentPost: BlogPost, allPosts: BlogPost[], limit = 3): BlogPost[] {
  // Match by category, then by tags, then by author
  return allPosts
    .filter(p => p.slug !== currentPost.slug)
    .sort((a, b) => {
      const aScore = (a.category === currentPost.category ? 10 : 0) + 
                     (a.tags.some(t => currentPost.tags.includes(t)) ? 5 : 0)
      const bScore = (b.category === currentPost.category ? 10 : 0) + 
                     (b.tags.some(t => currentPost.tags.includes(t)) ? 5 : 0)
      return bScore - aScore
    })
    .slice(0, limit)
}
```

**Manual Linking Opportunities**:
- Blog posts should link to relevant solutions/services
- Success stories should link to related solutions
- About page should link to solutions and jobs

**Alternatives Considered**:
- **Automated Link Insertion**: Parse content and inject links - rejected due to quality concerns
- **External Link Building**: Outreach campaigns - out of scope for technical SEO
- **Footer Sitemap**: Full site links in footer - rejected due to link dilution

**References**:
- Moz Internal Linking Guide: https://moz.com/learn/seo/internal-link

---

## Decision 6: Robots.txt Configuration

**Decision**: Enhance `public/robots.txt` to allow all search engines while blocking admin/preview paths

**Rationale**:
- **Crawl Budget**: Direct search engines to index public pages only
- **Vercel Previews**: Block preview deployments from being indexed
- **Next.js Internals**: Block /_next/ directory (already excluded by default)

**Recommended Configuration**:
```txt
# public/robots.txt
User-agent: *
Allow: /
Disallow: /_next/
Disallow: /api/
Disallow: /*.json$

# Sitemap location
Sitemap: https://cennso.com/sitemap.xml
Sitemap: https://cennso.com/sitemap-0.xml
```

**Note**: `next-sitemap` can auto-generate robots.txt via `generateRobotsTxt: true` option

**Alternatives Considered**:
- **No robots.txt**: Rely on meta robots tags - rejected because sitemap reference needs robots.txt
- **Restrictive robots.txt**: Block specific bots - rejected unless spam becomes an issue

**References**:
- robots.txt Specification: https://www.robotstxt.org/
- Google robots.txt Guide: https://developers.google.com/search/docs/crawling-indexing/robots/intro

---

## Decision 7: Core Web Vitals Monitoring Strategy

**Decision**: Integrate Google Search Console + Vercel Analytics for Core Web Vitals tracking with automated alerts

**Rationale**:
- **Google Search Console**: Official source for how Google measures Core Web Vitals
- **Vercel Analytics**: Real User Monitoring (RUM) data from actual visitors
- **Lighthouse CI**: Already integrated for PR validation
- **Combined Approach**: Lab data (Lighthouse) + field data (RUM) gives complete picture

**Implementation Plan**:

1. **Google Search Console Setup**:
   - Verify site ownership via DNS TXT record
   - Enable Core Web Vitals report
   - Set up email alerts for indexing issues

2. **Vercel Analytics** (already integrated):
   - Review `/analytics` dashboard for Core Web Vitals
   - Track P75 metrics for LCP, FID, CLS
   - Identify pages not meeting "Good" thresholds

3. **Automated Monitoring**:
   - Lighthouse CI already runs on PRs (≥95% enforcement)
   - Add post-deployment validation to CI/CD

**Metrics to Track**:
- **LCP (Largest Contentful Paint)**: < 2.5s (Good), 2.5-4s (Needs Improvement), > 4s (Poor)
- **FID (First Input Delay)**: < 100ms (Good), 100-300ms (Needs Improvement), > 300ms (Poor)  
- **CLS (Cumulative Layout Shift)**: < 0.1 (Good), 0.1-0.25 (Needs Improvement), > 0.25 (Poor)

**Alternatives Considered**:
- **Google Analytics 4**: Tracks Core Web Vitals - supplement to GSC, not replacement
- **Third-party RUM**: SpeedCurve, Calibre - rejected due to cost and Vercel Analytics availability
- **Self-hosted Monitoring**: Custom solution - rejected due to maintenance overhead

**References**:
- Core Web Vitals: https://web.dev/vitals/
- Google Search Console: https://search.google.com/search-console
- Vercel Analytics: https://vercel.com/docs/analytics

---

## Decision 8: Meta Description and Title Tag Strategy

**Decision**: Store SEO metadata in page-level configuration with fallback hierarchy: frontmatter > YAML config > siteMetadata defaults

**Rationale**:
- **Content-Driven**: Authors control SEO metadata in same place as content (MDX frontmatter)
- **Centralized Defaults**: Shared templates in `content/seo-config.yaml`
- **Type Safety**: TypeScript interfaces ensure consistency
- **DRY Principle**: Reusable patterns avoid duplication

**Implementation Pattern**:

```yaml
# content/seo-config.yaml
defaults:
  title_suffix: " | Cennso"
  og_image_default: "/assets/og-image-default.png"
  twitter_site: "@cennso"

templates:
  blog_post:
    title_template: "{title} - Cennso Blog"
    description_template: "Read {title} on the Cennso blog. {excerpt}"
  
  success_story:
    title_template: "{title} - Customer Success Story"
    description_template: "Learn how {company} achieved success with Cennso. {excerpt}"
```

```typescript
// lib/seo/metaTags.ts
export interface SEOMetadata {
  title: string
  description: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  twitterCard?: 'summary' | 'summary_large_image'
  canonical?: string
  noindex?: boolean
}

export function generateMetaTags(page: PageData, defaults: SEODefaults): SEOMetadata {
  return {
    title: page.seo?.title || `${page.title}${defaults.title_suffix}`,
    description: page.seo?.description || page.excerpt || defaults.description,
    ogTitle: page.seo?.ogTitle || page.title,
    ogDescription: page.seo?.ogDescription || page.excerpt,
    ogImage: page.seo?.ogImage || page.coverImage || defaults.og_image_default,
    twitterCard: page.seo?.twitterCard || 'summary_large_image',
    canonical: page.seo?.canonical || getCanonicalUrl(page.slug),
  }
}
```

**Character Limits**:
- **Title Tag**: 50-60 characters (Google truncates at ~60)
- **Meta Description**: 150-160 characters (Google truncates at ~160)
- **OG Title**: 60-90 characters (optimal for Facebook/LinkedIn)
- **OG Description**: 200 characters (Facebook displays up to 200)

**Alternatives Considered**:
- **Hardcoded in Components**: - rejected due to maintainability issues
- **Database/CMS**: - rejected because project uses file-based content
- **Auto-generated**: Use first paragraph as description - rejected due to quality concerns

**References**:
- Google Title Tag Guidelines: https://developers.google.com/search/docs/appearance/title-link
- Meta Description Best Practices: https://moz.com/learn/seo/meta-description

---

## Decision 9: Schema.org Type Selection for Content Types

**Decision**: Implement these schema.org types mapped to content types:

| Content Type | Schema.org Type | Required Properties |
|--------------|----------------|---------------------|
| Homepage | Organization | name, logo, url, sameAs (social links), contactPoint |
| Blog Post | Article | headline, author, datePublished, dateModified, image, articleBody |
| Success Story | Article (or Case Study if available) | headline, author, datePublished, image, about (company) |
| Job Listing | JobPosting | title, description, datePosted, employmentType, hiringOrganization |
| Solution Page | Service | name, description, provider, serviceType |
| Contact Page | LocalBusiness | name, address, telephone, geo (coordinates), openingHours |
| All Pages | BreadcrumbList | itemListElement (navigation path) |

**Rationale**:
- **Google Rich Results**: These types enable rich snippets in search results
- **Alignment with Content**: Schema types match existing content structure
- **Validation**: All types supported by Google Rich Results Test

**Implementation Priority**:
1. **P1 (Phase 1)**: Organization, Article (blog), BreadcrumbList
2. **P2 (Phase 2)**: JobPosting, LocalBusiness
3. **P3 (Phase 3)**: Service, more detailed Article properties

**Alternatives Considered**:
- **Generic WebPage**: - rejected because specific types enable rich results
- **Custom Schema**: - rejected because Google only recognizes schema.org vocabulary
- **Multiple Types per Page**: - acceptable but use sparingly (e.g., Article + BreadcrumbList)

**References**:
- Schema.org Full Hierarchy: https://schema.org/docs/full.html
- Google Structured Data Gallery: https://developers.google.com/search/docs/appearance/structured-data/search-gallery

---

## Decision 10: SEO Validation and Testing Strategy

**Decision**: Implement three-tier validation: pre-commit (local), PR validation (CI), and post-deployment monitoring

**Tier 1: Pre-commit Validation (Local)**
```bash
# Add to yarn commands
yarn seo:validate      # Run all SEO checks
yarn seo:meta          # Check meta tag completeness
yarn seo:schema        # Validate structured data
yarn seo:links         # Internal link audit
```

**Tier 2: PR Validation (GitHub Actions)**
- Lighthouse CI: Already enforces ≥95% scores
- Structured Data Validation: Google Rich Results Test API
- Meta Tag Completeness: Python script checks all pages
- Internal Link Check: Verify no broken links

**Tier 3: Post-Deployment Monitoring**
- Google Search Console: Weekly review of indexing status
- Vercel Analytics: Core Web Vitals dashboard
- Lighthouse: Monthly full-site audit

**Validation Scripts to Create**:

```python
# scripts/validate-seo.py
# Checks:
# - All pages have <title> tag (50-60 chars)
# - All pages have meta description (150-160 chars)
# - All pages have og:image tag
# - All pages have canonical URL
# Exit code 1 if any page fails

# scripts/validate-structured-data.py
# Checks:
# - All JSON-LD is valid JSON
# - Required properties present for each schema type
# - URLs are absolute (https://...)
# - Dates in ISO 8601 format
# Exit code 1 if validation fails

# scripts/check-internal-links.py
# Checks:
# - All internal links resolve to existing pages
# - No broken anchor links (#section)
# - No redirect chains (A→B→C)
# Exit code 1 if broken links found
```

**Alternatives Considered**:
- **Manual Testing Only**: - rejected due to error-prone nature
- **Third-party SEO Tools**: Ahrefs, SEMrush - supplement, not replacement for validation
- **Runtime Validation**: Check on page load - rejected due to SSG architecture

**References**:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci

---

## Best Practices Summary

### Schema.org JSON-LD
- Use TypeScript interfaces for type safety
- Generate at build time in `getStaticProps`
- Embed in `<script type="application/ld+json">` in `<head>`
- Validate all JSON-LD before deployment

### Meta Tags
- Store in YAML for reusability
- Override at page level via frontmatter
- Enforce character limits (title: 60, description: 160)
- Always provide fallback defaults

### Internal Linking
- Minimum 3-5 internal links per page
- Use descriptive anchor text (not "click here")
- Link to high-value pages (solutions, services)
- Related content sections on blog/success stories

### Performance
- Maintain Lighthouse ≥95% after all SEO additions
- JSON-LD should add <5KB per page
- Lazy-load non-critical schema types
- Monitor Core Web Vitals in Google Search Console

### Monitoring
- Weekly Google Search Console review
- Monthly full Lighthouse audit
- Real-time Core Web Vitals via Vercel Analytics
- Automated PR validation for all SEO checks

---

## Next Steps (Phase 1: Design & Contracts)

With all research complete, Phase 1 will:

1. **Create Data Models** (`data-model.md`):
   - TypeScript interfaces for all schema.org types
   - Meta tag data structures
   - SEO configuration schemas

2. **Generate Contracts** (`contracts/`):
   - `structured-data-schemas.json`: Complete schema.org type definitions
   - `meta-tag-templates.json`: Reusable meta tag patterns
   - `seo-validation-rules.json`: Validation criteria for automation

3. **Document Quick Start** (`quickstart.md`):
   - Adding SEO to new pages
   - Creating structured data for new content types
   - Running SEO validation locally

4. **Update Agent Context**:
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
   - Add SEO patterns to agent instructions

All unknowns from Technical Context have been resolved. Ready to proceed to Phase 1.
