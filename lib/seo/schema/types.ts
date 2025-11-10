/**
 * TypeScript Type Definitions for Schema.org Structured Data
 *
 * Based on Schema.org vocabulary for zero-click SEO optimization
 * All types are designed for JSON-LD format embedded in HTML
 */

/**
 * Base schema with required @context and @type properties
 */
export interface BaseSchema {
  '@context': 'https://schema.org'
  '@type': string | string[]
  '@id'?: string
}

/**
 * Organization schema for company information
 * Used on all pages for brand knowledge panel
 */
export interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization'
  name: string
  url: string
  logo: string | ImageObject
  description?: string
  address?: PostalAddress
  contactPoint?: ContactPoint | ContactPoint[]
  sameAs?: string[]
  foundingDate?: string
  founder?: PersonSchema | PersonSchema[]
}

/**
 * LocalBusiness schema for location-based search
 * Extends Organization with location-specific properties
 * LocalBusiness is a subtype of Organization in Schema.org hierarchy
 */
export interface LocalBusinessSchema extends Omit<OrganizationSchema, '@type' | 'address'> {
  '@type': 'LocalBusiness' | 'ProfessionalService'
  address: PostalAddress // Required (override optional from Organization)
  telephone: string // Required for local business
  geo?: GeoCoordinates
  openingHours?: string | string[]
  priceRange?: string
  image?: string | ImageObject // Business location photo
}

/**
 * Article schema for blog posts and articles
 * Use BlogPosting for blog-specific content
 */
export interface ArticleSchema extends BaseSchema {
  '@type': 'Article' | 'BlogPosting'
  headline: string
  author: PersonSchema | PersonSchema[]
  datePublished: string
  dateModified: string
  publisher: OrganizationSchema
  image: string | ImageObject | ImageObject[]
  description?: string
  articleBody?: string
  keywords?: string | string[]
  wordCount?: number
  articleSection?: string
  inLanguage?: string
}

/**
 * Person schema for authors and team members
 * Used in Article.author and standalone author pages
 */
export interface PersonSchema extends BaseSchema {
  '@type': 'Person'
  name: string
  url: string
  image?: string | ImageObject
  jobTitle?: string
  worksFor?: OrganizationSchema
  description?: string
  sameAs?: string[]
  email?: string
}

/**
 * BreadcrumbList schema for navigation hierarchy
 * Used on all pages to show structure in search results
 */
export interface BreadcrumbListSchema extends BaseSchema {
  '@type': 'BreadcrumbList'
  itemListElement: ListItem[]
}

export interface ListItem {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

/**
 * FAQPage schema for Q&A content
 * Enables "People Also Ask" boxes in search results
 */
export interface FAQPageSchema extends BaseSchema {
  '@type': 'FAQPage'
  mainEntity: Question[]
}

export interface Question {
  '@type': 'Question'
  name: string
  acceptedAnswer: Answer
}

export interface Answer {
  '@type': 'Answer'
  text: string
}

/**
 * Service schema for service/solution offerings
 * Used on solution pages
 */
export interface ServiceSchema extends BaseSchema {
  '@type': 'Service'
  name: string
  description: string
  provider: OrganizationSchema
  serviceType?: string
  areaServed?: string | string[]
  hasOfferCatalog?: OfferCatalog
  category?: string
}

/**
 * Supporting schema types
 */

export interface ImageObject {
  '@type': 'ImageObject'
  url: string
  width?: number
  height?: number
  caption?: string
}

export interface PostalAddress {
  '@type': 'PostalAddress'
  streetAddress: string
  addressLocality: string
  addressRegion?: string
  postalCode: string
  addressCountry: string
}

export interface ContactPoint {
  '@type': 'ContactPoint'
  contactType: string
  telephone?: string
  email?: string
  availableLanguage?: string | string[]
}

export interface GeoCoordinates {
  '@type': 'GeoCoordinates'
  latitude: number
  longitude: number
}

export interface OfferCatalog {
  '@type': 'OfferCatalog'
  name: string
  itemListElement: Offer[]
}

export interface Offer {
  '@type': 'Offer'
  itemOffered: Service
}

export interface Service {
  '@type': 'Service'
  name: string
  description?: string
}

/**
 * Union type for all schema types that can appear on a page
 */
export type SchemaType =
  | OrganizationSchema
  | LocalBusinessSchema
  | ArticleSchema
  | PersonSchema
  | BreadcrumbListSchema
  | FAQPageSchema
  | ServiceSchema

/**
 * Type for multiple schemas on one page
 */
export type SchemaCollection = SchemaType[]

/**
 * Generator function signature
 * All schema generators should follow this pattern
 */
export type SchemaGenerator<T extends SchemaType, S = any> = (source: S) => T

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

/**
 * Google Rich Results Test API response (simplified)
 */
export interface RichResultsTestResult {
  eligible: boolean
  richResultTypes: string[]
  issues: {
    severity: 'ERROR' | 'WARNING'
    message: string
    path?: string
  }[]
}
