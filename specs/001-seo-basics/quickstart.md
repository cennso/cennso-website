# Quickstart: Adding SEO to New Pages

**Version:** 1.0.0  
**Last Updated:** 2024-01-XX  
**Audience:** Developers working on Cennso website

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Adding SEO to a New Page](#adding-seo-to-a-new-page)
4. [Creating Structured Data](#creating-structured-data)
5. [Meta Tags Best Practices](#meta-tags-best-practices)
6. [Running SEO Validation](#running-seo-validation)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide explains how to add proper SEO to new pages on the Cennso website. All pages MUST include:

- **Meta tags** (title, description, Open Graph, Twitter Cards)
- **Canonical URLs** (absolute HTTPS URLs)
- **Structured data** (schema.org JSON-LD where applicable)
- **Breadcrumb navigation** (for nested pages)

**Architecture Pattern:** Enhance the existing `<SEO>` component instead of creating custom implementations.

---

## Prerequisites

Before starting, ensure you have:

1. **Development environment set up** (see `/docs/setup-environment.md`)
2. **Familiarity with Next.js Pages Router** (we use `getStaticProps` SSG)
3. **Access to contract files:**
   - `specs/001-seo-basics/contracts/structured-data-schemas.json`
   - `specs/001-seo-basics/contracts/meta-tag-templates.json`
4. **Quality tools installed:**
   ```bash
   yarn install
   ```

---

## Adding SEO to a New Page

### Step 1: Import the SEO Component

```tsx
import { SEO } from '@/components/SEO'
```

### Step 2: Add SEO Component to Your Page

```tsx
export default function MyPage({ pageData }) {
  return (
    <>
      <SEO
        title="My Page Title"
        description="A compelling description between 150-160 characters that includes the primary keyword and a call-to-action."
        canonical="https://www.cennso.com/my-page"
        openGraph={{
          type: 'website',
          title: 'My Page Title',
          description: 'Same compelling description',
          images: [
            {
              url: 'https://www.cennso.com/assets/og-images/my-page-og.png',
              width: 1200,
              height: 630,
              alt: 'Descriptive alt text for OG image',
            },
          ],
          url: 'https://www.cennso.com/my-page',
        }}
        twitter={{
          cardType: 'summary_large_image',
          handle: '@cennso',
        }}
      />
      {/* Your page content */}
    </>
  )
}
```

### Step 3: Use Meta Tag Templates

Refer to `contracts/meta-tag-templates.json` for standardized patterns:

**Title Templates:**

- Default: `"{pageTitle} | Cennso"` (max 60 chars)
- Blog: `"{postTitle} | Cennso Blog"` (max 60 chars)
- Solution: `"{solutionName} - {category} | Cennso"` (max 60 chars)

**Description Templates:**

- Min: 150 characters
- Max: 160 characters
- Must include primary keyword + CTA

**Example:**

```tsx
// ✅ Good - Uses template pattern
title: 'Cloud Migration - IT Services | Cennso'
description: "Learn how Cennso's cloud migration services help businesses reduce costs and improve scalability. Schedule a consultation today."

// ❌ Bad - Too short, no CTA
title: 'Cloud Migration'
description: 'Cloud services.'
```

### Step 4: Generate Canonical URLs

**Production:**

```tsx
const canonicalUrl = `https://www.cennso.com${router.asPath}`
```

**With Environment Detection:**

```tsx
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cennso.com'
const canonicalUrl = `${baseUrl}${router.asPath}`
```

**Rules:**

- ✅ HTTPS only
- ✅ Absolute URLs
- ✅ No trailing slashes (unless homepage)
- ✅ Lowercase
- ❌ No query parameters (unless essential for content)

---

## Creating Structured Data

### Step 1: Choose Appropriate Schema Type

Refer to `contracts/structured-data-schemas.json` for available types:

| Content Type  | Schema.org Type            | Use Case              |
| ------------- | -------------------------- | --------------------- |
| Blog Post     | `Article` or `BlogPosting` | Individual blog posts |
| Solution Page | `Service`                  | Service/product pages |
| Job Posting   | `JobPosting`               | Career opportunities  |
| About Page    | `Organization`             | Company information   |
| Success Story | `Article`                  | Case studies          |
| Contact Page  | `LocalBusiness`            | Location/contact info |

### Step 2: Create JSON-LD Structured Data

**Example: Blog Post (Article Schema)**

```tsx
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Getting Started with Next.js',
  description: 'A comprehensive guide to building modern web applications.',
  image: 'https://www.cennso.com/assets/blog/nextjs-guide-cover.png',
  datePublished: '2024-01-15T10:00:00Z',
  dateModified: '2024-01-20T14:30:00Z',
  author: {
    '@type': 'Person',
    name: 'John Doe',
    url: 'https://www.cennso.com/authors/john-doe',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Cennso',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.cennso.com/assets/logo.png',
    },
  },
  mainEntityOfPage: 'https://www.cennso.com/blog/getting-started-nextjs',
}
```

**Example: Job Posting Schema**

```tsx
const jobPostingSchema = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: 'Senior Frontend Developer',
  description: 'Join our team as a Senior Frontend Developer...',
  datePosted: '2024-01-15T10:00:00Z',
  validThrough: '2024-03-15T23:59:59Z',
  employmentType: ['FULL_TIME'],
  hiringOrganization: {
    '@type': 'Organization',
    name: 'Cennso',
    sameAs: 'https://www.cennso.com',
    logo: 'https://www.cennso.com/assets/logo.png',
  },
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Main St',
      addressLocality: 'Berlin',
      postalCode: '10115',
      addressCountry: 'DE',
    },
  },
}
```

### Step 3: Embed JSON-LD in Page

**Option A: Via SEO Component (Recommended)**

```tsx
<SEO
  title="Getting Started with Next.js | Cennso Blog"
  description="A comprehensive guide to building modern web applications with Next.js."
  structuredData={articleSchema}
/>
```

**Option B: Custom Script Tag**

```tsx
<Script
  id="article-schema"
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
/>
```

### Step 4: Add Breadcrumb Schema (For Nested Pages)

```tsx
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.cennso.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: 'https://www.cennso.com/blog',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Getting Started with Next.js',
      item: 'https://www.cennso.com/blog/getting-started-nextjs',
    },
  ],
}
```

---

## Meta Tags Best Practices

### Title Tags

**Rules:**

- ✅ 50-60 characters (optimal: 55)
- ✅ Include primary keyword near the beginning
- ✅ Use template pattern from `contracts/meta-tag-templates.json`
- ✅ Unique per page
- ❌ Don't keyword stuff
- ❌ Don't use all caps

**Examples:**

```tsx
// ✅ Good
'Cloud Migration Services - IT Consulting | Cennso'

// ❌ Bad - Too long (68 chars)
'Cloud Migration Services and Solutions for Enterprise Businesses | Cennso'

// ❌ Bad - Keyword stuffing
'Cloud Migration Cloud Services Cloud Hosting | Cennso'
```

### Meta Descriptions

**Rules:**

- ✅ 150-160 characters (optimal: 155)
- ✅ Include primary keyword naturally
- ✅ Add clear call-to-action
- ✅ Focus on user benefit
- ❌ Don't duplicate title
- ❌ Don't keyword stuff

**Examples:**

```tsx
// ✅ Good (156 chars)
"Learn how Cennso's cloud migration services help businesses reduce costs and improve scalability. Schedule a consultation today."

// ❌ Bad - Too short (45 chars)
'Cennso offers cloud migration services.'

// ❌ Bad - No CTA, generic
'We provide cloud migration services to businesses of all sizes around the world.'
```

### Open Graph Images

**Requirements:**

- ✅ Dimensions: 1200×630 pixels (1.91:1 aspect ratio)
- ✅ Format: WebP, PNG, or JPG
- ✅ Max file size: 100KB
- ✅ Alt text: Descriptive, keyword-rich
- ❌ Don't use text-heavy images

**Location:**

```
/public/assets/og-images/{page-slug}-og.png
```

**Auto-generation:**

```bash
# Generate OG images during build
yarn build
```

---

## Running SEO Validation

### Local Validation (Pre-Commit)

**1. Run Lighthouse Audit:**

```bash
# Terminal 1: Start dev server
yarn dev

# Terminal 2: Run Lighthouse (desktop + mobile)
yarn lighthouse
```

**Required scores:** ≥95% on ALL categories (Performance, Accessibility, Best Practices, SEO)

**2. Validate Structured Data:**

```bash
# Validate schema.org JSON-LD (coming soon)
yarn validate:schemas
```

**3. Check Meta Tags:**

```bash
# Validate title/description lengths (coming soon)
yarn validate:meta-tags
```

**4. Run All Quality Checks:**

```bash
yarn check:all
```

This runs:

- ✅ Prettier formatting
- ✅ ESLint
- ✅ Accessibility checks (11 WCAG 2.1 AA scripts)
- ✅ Image optimization validation
- ✅ Production build

### CI/CD Validation (GitHub Actions)

**Automated on every PR:**

- ✅ Lighthouse audit (≥95% enforced)
- ✅ Link checking (via lychee)
- ✅ Structured data validation
- ✅ Meta tag validation
- ✅ Core Web Vitals monitoring

**Manual validation:**

- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/

### Post-Deployment Monitoring

**Google Search Console:**

1. Monitor Core Web Vitals (LCP, FID, CLS)
2. Check Coverage report for indexing errors
3. Validate structured data in Enhancements section
4. Review mobile usability issues

**Vercel Analytics:**

- Real User Monitoring (RUM) for Core Web Vitals
- Performance metrics tracking

---

## Troubleshooting

### Issue: Lighthouse SEO Score < 95%

**Common causes:**

1. Missing meta description
2. Title too long/short
3. Missing canonical URL
4. Images missing alt text
5. Links not crawlable

**Solution:**

```bash
# Run lighthouse with full report
yarn lighthouse

# Check HTML output for specific failures
open lighthouse-desktop.html
```

### Issue: Structured Data Validation Errors

**Common causes:**

1. Missing required fields (`@context`, `@type`, etc.)
2. Invalid URL format (must be absolute HTTPS)
3. Invalid date format (must be ISO 8601)
4. Missing nested required properties

**Solution:**

1. Check against contract schema: `contracts/structured-data-schemas.json`
2. Validate with Google Rich Results Test: https://search.google.com/test/rich-results
3. Use Schema.org Validator: https://validator.schema.org/

**Example fix:**

```tsx
// ❌ Bad - Missing required fields
const articleSchema = {
  '@type': 'Article',
  headline: 'My Post',
}

// ✅ Good - All required fields
const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'My Post',
  image: 'https://www.cennso.com/assets/post-cover.png',
  datePublished: '2024-01-15T10:00:00Z',
  author: { '@type': 'Person', name: 'John Doe' },
  publisher: { '@type': 'Organization', name: 'Cennso', logo: '...' },
}
```

### Issue: Canonical URL Conflicts

**Common causes:**

1. Duplicate content on multiple URLs
2. HTTP vs HTTPS mismatch
3. Trailing slash inconsistency
4. Query parameter variations

**Solution:**

1. Always use absolute HTTPS URLs
2. Remove trailing slashes (except homepage)
3. Strip non-essential query parameters
4. Add canonical link on all pages

```tsx
// ✅ Good - Consistent canonical URLs
const canonicalUrl = 'https://www.cennso.com/blog/post-slug'

// ❌ Bad - Multiple variations
;('http://www.cennso.com/blog/post-slug') // HTTP (should be HTTPS)
;('https://www.cennso.com/blog/post-slug/') // Trailing slash
;('https://www.cennso.com/blog/post-slug?ref=twitter') // Query param
```

### Issue: Meta Tags Not Updating

**Common causes:**

1. Hot reload doesn't work for content changes
2. OG image cache (Facebook/Twitter)
3. Next.js build cache

**Solution:**

```bash
# 1. Manual browser refresh after content changes
# (hot reload doesn't work for YAML/MDX content)

# 2. Clear Facebook OG cache
# https://developers.facebook.com/tools/debug/

# 3. Clear Twitter card cache
# https://cards-dev.twitter.com/validator

# 4. Clear Next.js build cache
rm -rf .next
yarn build
```

### Issue: Images Not Optimized

**Common causes:**

1. Non-WebP format
2. File size > 100KB
3. Missing `sizes` prop on `<Image>` component
4. Oversized source images

**Solution:**

```bash
# Check image optimization
yarn perf:images

# Auto-optimize images to WebP
yarn perf:images:optimize
```

**Fix `<Image>` components:**

```tsx
// ❌ Bad - Missing sizes prop
<Image src="/assets/hero.png" width={800} height={600} alt="Hero" />

// ✅ Good - Responsive sizes
<Image
  src="/assets/hero.png"
  width={800}
  height={600}
  alt="Hero image showing cloud infrastructure"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

---

## Quick Reference

### Checklist for New Pages

- [ ] Added `<SEO>` component with title (50-60 chars)
- [ ] Added meta description (150-160 chars)
- [ ] Added canonical URL (absolute HTTPS)
- [ ] Added Open Graph tags (type, title, description, image)
- [ ] Added Twitter Card tags (card type, title, description, image)
- [ ] Added structured data (JSON-LD schema.org)
- [ ] Added breadcrumb schema (for nested pages)
- [ ] Generated OG image (1200×630px, <100KB)
- [ ] Optimized all images (WebP, <100KB, `sizes` prop)
- [ ] Ran `yarn check:all` (all checks passed)
- [ ] Ran `yarn lighthouse` (≥95% on all categories, desktop + mobile)
- [ ] Validated structured data (Google Rich Results Test)
- [ ] Tested on mobile (responsive, fast)

### Useful Commands

```bash
yarn dev                    # Start dev server
yarn lighthouse             # Run Lighthouse (desktop + mobile)
yarn check:all              # Run all quality checks
yarn perf:images            # Validate image optimization
yarn perf:images:optimize   # Auto-optimize images
yarn build                  # Production build (includes OG generation)
```

### Useful Resources

- **Contract Schemas:** `specs/001-seo-basics/contracts/structured-data-schemas.json`
- **Meta Tag Templates:** `specs/001-seo-basics/contracts/meta-tag-templates.json`
- **Data Models:** `specs/001-seo-basics/data-model.md`
- **Research Decisions:** `specs/001-seo-basics/research.md`
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Schema.org Validator:** https://validator.schema.org/
- **Facebook OG Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator

---

**Questions?** Check the full specification in `specs/001-seo-basics/spec.md` or research decisions in `specs/001-seo-basics/research.md`.
