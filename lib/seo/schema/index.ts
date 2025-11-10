/**
 * Schema Generators Index
 *
 * Exports all Schema.org structured data generators for use throughout the application.
 */

export {
  generateOrganizationSchema,
  type OrganizationData,
} from './organization'
export { generateBreadcrumbSchema } from './breadcrumb'
export { generatePersonSchema } from './person'
export { generateArticleSchema } from './article'
export { generateFAQSchema } from './faq'
export {
  generateLocalBusinessSchema,
  type LocalBusinessData,
} from './local-business'

// Re-export data types
export type { AuthorData } from './person'
export type { BlogPostData } from './article'
export type { FAQItem } from './faq'

// Re-export types for convenience
export type {
  SchemaType,
  SchemaCollection,
  OrganizationSchema,
  BreadcrumbListSchema,
  ArticleSchema,
  PersonSchema,
  FAQPageSchema,
  ServiceSchema,
  LocalBusinessSchema,
} from './types'

// Re-export utilities
export {
  formatSchemaDate,
  toAbsoluteUrl,
  isAbsoluteUrl,
  truncateHeadline,
  validateRequiredProps,
  createSchemaId,
} from './utils'
