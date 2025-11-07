# Quick Start: Zero-Click SEO Implementation

**Date**: 2025-11-07  
**Feature**: Zero-Click SEO Optimization  
**Estimated Time**: 2-3 hours for P1 stories

## Prerequisites

- Node.js 20+ and Yarn installed
- Existing Cennso website repository cloned
- Branch `002-optimize-website-to` checked out
- Understanding of Schema.org basics (see [schema.org](https://schema.org))

## Phase 1: Global Structured Data (P1 - Highest Priority)

**Goal**: Add Organization and BreadcrumbList schemas to all pages

### Step 1: Create Schema Generator Functions (30 min)

1. Create schema generators directory:

```bash
mkdir -p lib/seo/schema
```

2. Create `lib/seo/schema/organization.ts`:

```typescript
import type { OrganizationSchema } from '../../../specs/002-optimize-website-to/contracts/schema-types'

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://cennso.com/#organization',
    name: 'Cennso',
    url: 'https://cennso.com',
    logo: 'https://cennso.com/assets/logo.png',
    description: 'AsyncAPI consulting and event-driven architecture expertise',
    sameAs: [
      'https://www.linkedin.com/company/cennso',
      'https://github.com/cennso',
      'https://twitter.com/cennso',
    ],
  }
}
```

3. Create `lib/seo/schema/breadcrumb.ts`:

```typescript
import type { BreadcrumbListSchema } from '../../../specs/002-optimize-website-to/contracts/schema-types'

export function generateBreadcrumbSchema(
  path: string,
  navigation: any
): BreadcrumbListSchema {
  // Implementation: Parse path and navigation to create breadcrumb hierarchy
  // Return structured breadcrumb list
}
```

4. Create `lib/seo/schema/index.ts`:

```typescript
export { generateOrganizationSchema } from './organization'
export { generateBreadcrumbSchema } from './breadcrumb'
```

### Step 2: Update SchemaOrg Component (15 min)

1. Modify `components/common/SchemaOrg.tsx`:

```typescript
import type { SchemaType, SchemaCollection } from '../../specs/002-optimize-website-to/contracts/schema-types';

interface SchemaOrgProps {
  schema: SchemaType | SchemaCollection;
}

export function SchemaOrg({ schema }: SchemaOrgProps) {
  const schemaString = JSON.stringify(schema, null, 0);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html__ schemaString }}
    />
  );
}

export default SchemaOrg;
```

### Step 3: Integrate in SEO Component (15 min)

1. Update `components/SEO.tsx`:

```typescript
import { SchemaOrg } from './common/SchemaOrg';
import { generateOrganizationSchema, generateBreadcrumbSchema } from '../lib/seo/schema';

export function SEO({ ...props }) {
  const orgSchema = generateOrganizationSchema();
  const breadcrumbSchema = generateBreadcrumbSchema(router.asPath, navigation);

  return (
    <>
      <NextSeo {...seoConfig} />
      <SchemaOrg schema={[orgSchema, breadcrumbSchema]} />
    </>
  );
}
```

### Step 4: Validate (15 min)

```bash
# Build the site
yarn build

# Run structured data validation
yarn seo:schema

# Test in Google Rich Results Test
# Visit: https://search.google.com/test/rich-results
# Enter URL: http://localhost:3000 (after running yarn dev)
```

**Expected Result**: Organization and BreadcrumbList schemas appear on all pages, validate without errors

---

## Phase 2: Blog Post Structured Data (P1)

**Goal**: Add Article/BlogPosting schema to blog posts

### Step 1: Create Article Schema Generator (30 min)

1. Create `lib/seo/schema/article.ts`:

```typescript
import type {
  ArticleSchema,
  PersonSchema,
} from '../../../specs/002-optimize-website-to/contracts/schema-types'
import { generateOrganizationSchema } from './organization'

export function generateArticleSchema(
  post: any,
  authors: any[]
): ArticleSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    author: authors.map((author) => ({
      '@type': 'Person',
      name: author.name,
      url: `https://cennso.com/authors/${author.id}`,
      image: author.avatar,
    })),
    datePublished: post.date,
    dateModified: post.updatedDate || post.date,
    publisher: generateOrganizationSchema(),
    image: post.cover,
    description: post.excerpt,
    articleSection: post.category,
  }
}
```

### Step 2: Integrate in Blog Post Page (15 min)

1. Update `pages/blog/[blog-post].tsx`:

```typescript
import { generateArticleSchema } from '../../lib/seo/schema';

export default function BlogPost({ post, authors }) {
  const articleSchema = generateArticleSchema(post, authors);

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        schema={articleSchema}
      />
      {/* Rest of blog post */}
    </>
  );
}
```

### Step 3: Test (15 min)

```bash
yarn dev
# Open http://localhost:3000/blog/[any-post]
# View source, verify <script type="application/ld+json"> with BlogPosting schema
# Test in Google Rich Results Test
```

**Expected Result**: Blog posts show Article rich cards in search results

---

## Phase 3: FAQ Schema (P2)

**Goal**: Add FAQPage schema to pages with Q&A content

### Step 1: Identify FAQ Content (15 min)

Review existing pages for FAQ-style content:

- Solutions pages with common questions
- About page with company FAQs
- Service pages with Q&A sections

### Step 2: Create FAQ Schema Generator (20 min)

1. Create `lib/seo/schema/faq.ts`:

```typescript
import type { FAQPageSchema } from '../../../specs/002-optimize-website-to/contracts/schema-types'

interface FAQItem {
  question: string
  answer: string
}

export function generateFAQSchema(faqs: FAQItem[]): FAQPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
```

### Step 3: Add FAQ Data to Content Files (30 min)

1. Update relevant YAML files (e.g., `content/solutions-page.yaml`):

```yaml
faqs:
  - question: 'What is AsyncAPI consulting?'
    answer: 'AsyncAPI consulting helps teams design, implement, and optimize event-driven architectures using the AsyncAPI specification...'
  - question: 'How long does implementation take?'
    answer: 'Implementation timelines vary based on complexity, typically ranging from 4-12 weeks for most projects...'
```

### Step 4: Integrate in Pages (20 min)

```typescript
import { generateFAQSchema } from '../lib/seo/schema';

export default function SolutionsPage({ faqs }) {
  const faqSchema = generateFAQSchema(faqs);

  return (
    <>
      <SEO schema={faqSchema} />
      {/* Page content */}
    </>
  );
}
```

**Expected Result**: FAQ content appears in "People Also Ask" boxes

---

## Validation Checklist

After implementing each phase:

- [ ] Run `yarn build` - Builds successfully
- [ ] Run `yarn seo:schema` - All schemas validate
- [ ] Test in [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] View page source - Verify JSON-LD in `<head>`
- [ ] Check Google Search Console - No structured data errors
- [ ] Run `yarn lighthouse` - Maintain ≥95% scores
- [ ] Monitor bundle size - No increase in JS bundle

---

## Troubleshooting

### Schema Validation Errors

**Problem**: "Missing required property"
**Solution**: Check type definition in `contracts/schema-types.ts`, ensure all required properties included

**Problem**: "Invalid date format"
**Solution**: Ensure dates are ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

**Problem**: "Invalid URL"
**Solution**: All URLs must be absolute (start with `https://`)

### Rich Results Not Appearing

**Problem**: "Eligible but not shown"
**Solution**: Normal - Google may take weeks to show rich results after indexing

**Problem**: "Not eligible for rich results"
**Solution**: Check Google Rich Results Test for specific issues, verify all required properties present

### Performance Issues

**Problem**: Lighthouse score decreased
**Solution**: Check JSON-LD size, ensure no duplicate schemas, verify SSG still working (no client-side generation)

---

## Next Steps

1. Monitor Search Console "Enhancements" tab for rich result status
2. Track impressions and click-through rates for pages with structured data
3. Expand FAQ content based on search query data
4. Add LocalBusiness schema to contact page
5. Create Person schemas for author profile pages

---

## Resources

- [Schema.org Documentation](https://schema.org)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org)
- [JSON-LD Playground](https://json-ld.org/playground/)
