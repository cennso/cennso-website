/**
 * TypeScript Interfaces for SEO Entities
 *
 * Based on schema.org specifications and SEO best practices
 */

/**
 * Core SEO Metadata
 */
export interface SEOMetadata {
  title: string
  description: string
  canonical: string
  keywords?: string[]
  ogImage?: string
  ogType?: string
  twitterCard?: string
  noindex?: boolean
  nofollow?: boolean
  structuredData?: StructuredData[]
}

/**
 * Base Schema.org type
 */
export interface StructuredData {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: any
}

/**
 * Schema.org Organization
 * https://schema.org/Organization
 */
export interface OrganizationSchema extends StructuredData {
  '@type': 'Organization'
  name: string
  url: string
  logo?: string | ImageObject
  description?: string
  email?: string
  telephone?: string
  address?: PostalAddress
  sameAs?: string[] // Social media profiles
  foundingDate?: string
  founders?: Person[]
  contactPoint?: ContactPoint
}

/**
 * Schema.org Article (for blog posts)
 * https://schema.org/Article
 */
export interface ArticleSchema extends StructuredData {
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle'
  headline: string
  description?: string
  image?: string | ImageObject | ImageObject[]
  author: Person | Organization
  publisher?: Organization
  datePublished: string // ISO 8601 format
  dateModified?: string // ISO 8601 format
  mainEntityOfPage?: string
  articleBody?: string
  keywords?: string[]
  wordCount?: number
}

/**
 * Schema.org BreadcrumbList
 * https://schema.org/BreadcrumbList
 */
export interface BreadcrumbListSchema extends StructuredData {
  '@type': 'BreadcrumbList'
  itemListElement: ListItem[]
}

export interface ListItem {
  '@type': 'ListItem'
  position: number
  name: string
  item?: string // URL
}

/**
 * Schema.org LocalBusiness
 * https://schema.org/LocalBusiness
 */
export interface LocalBusinessSchema extends StructuredData {
  '@type': 'LocalBusiness'
  name: string
  image?: string | ImageObject
  '@id'?: string
  url: string
  telephone?: string
  priceRange?: string
  address: PostalAddress
  geo?: GeoCoordinates
  openingHoursSpecification?: OpeningHoursSpecification[]
  aggregateRating?: AggregateRating
}

/**
 * Schema.org JobPosting
 * https://schema.org/JobPosting
 */
export interface JobPostingSchema extends StructuredData {
  '@type': 'JobPosting'
  title: string
  description: string
  datePosted: string // ISO 8601 format
  validThrough?: string // ISO 8601 format
  employmentType?: string // FULL_TIME, PART_TIME, CONTRACTOR, etc.
  hiringOrganization: Organization
  jobLocation: Place
  baseSalary?: MonetaryAmount
  qualifications?: string
  responsibilities?: string
  skills?: string
  workHours?: string
  experienceRequirements?: string
}

/**
 * Schema.org Service
 * https://schema.org/Service
 */
export interface ServiceSchema extends StructuredData {
  '@type': 'Service'
  name: string
  description?: string
  provider: Organization
  serviceType?: string
  areaServed?: string | Place
  audience?: Audience
  category?: string
  offers?: Offer
}

/**
 * Supporting Schema.org Types
 */

export interface Person {
  '@type': 'Person'
  name: string
  url?: string
  image?: string | ImageObject
  jobTitle?: string
  email?: string
  sameAs?: string[]
}

export interface Organization {
  '@type': 'Organization'
  name: string
  url?: string
  logo?: string | ImageObject
  sameAs?: string[]
}

export interface PostalAddress {
  '@type': 'PostalAddress'
  streetAddress?: string
  addressLocality?: string // City
  addressRegion?: string // State/Province
  postalCode?: string
  addressCountry?: string
}

export interface GeoCoordinates {
  '@type': 'GeoCoordinates'
  latitude: number
  longitude: number
}

export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification'
  dayOfWeek: string | string[] // Monday, Tuesday, etc.
  opens: string // HH:MM format
  closes: string // HH:MM format
}

export interface AggregateRating {
  '@type': 'AggregateRating'
  ratingValue: number
  reviewCount: number
  bestRating?: number
  worstRating?: number
}

export interface ImageObject {
  '@type': 'ImageObject'
  url: string
  width?: number
  height?: number
  caption?: string
}

export interface ContactPoint {
  '@type': 'ContactPoint'
  telephone?: string
  contactType: string // customer service, sales, etc.
  email?: string
  areaServed?: string
  availableLanguage?: string | string[]
}

export interface Place {
  '@type': 'Place'
  name?: string
  address: PostalAddress
  geo?: GeoCoordinates
}

export interface MonetaryAmount {
  '@type': 'MonetaryAmount'
  currency: string // USD, EUR, etc.
  value: {
    '@type': 'QuantitativeValue'
    value?: number
    minValue?: number
    maxValue?: number
    unitText: string // HOUR, WEEK, MONTH, YEAR
  }
}

export interface Audience {
  '@type': 'Audience'
  audienceType?: string
  name?: string
}

export interface Offer {
  '@type': 'Offer'
  price?: string | number
  priceCurrency?: string
  availability?: string // https://schema.org/ItemAvailability
  url?: string
}

/**
 * Sitemap Entry
 */
export interface SitemapEntry {
  url: string
  lastmod?: string // ISO 8601 format
  changefreq?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  priority?: number // 0.0 to 1.0
}

/**
 * SEO Validation Result
 */
export interface SEOValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  pageUrl?: string
  timestamp?: string
}

/**
 * Type guards for schema validation
 */

export function isOrganizationSchema(
  data: StructuredData
): data is OrganizationSchema {
  return data['@type'] === 'Organization'
}

export function isArticleSchema(data: StructuredData): data is ArticleSchema {
  return ['Article', 'BlogPosting', 'NewsArticle'].includes(data['@type'])
}

export function isBreadcrumbListSchema(
  data: StructuredData
): data is BreadcrumbListSchema {
  return data['@type'] === 'BreadcrumbList'
}

export function isLocalBusinessSchema(
  data: StructuredData
): data is LocalBusinessSchema {
  return data['@type'] === 'LocalBusiness'
}

export function isJobPostingSchema(
  data: StructuredData
): data is JobPostingSchema {
  return data['@type'] === 'JobPosting'
}

export function isServiceSchema(data: StructuredData): data is ServiceSchema {
  return data['@type'] === 'Service'
}
