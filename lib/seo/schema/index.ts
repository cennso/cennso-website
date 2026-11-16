/**
 * Schema Generators Index
 *
 * Exports all Schema.org structured data generators for use throughout the application.
 */

export {
  ORGANIZATION_ID,
  WEBSITE_ID,
  organizationNode,
  websiteNode,
  articleNode,
  contactPageNode,
  breadcrumbNode,
  graph,
  jsonLd,
  type GraphNode,
  type Crumb,
  type PageFacts,
} from './graph'
export { generatePersonSchema } from './person'
export { generateArticleSchema } from './article'
export { generateFAQSchema } from './faq'

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
