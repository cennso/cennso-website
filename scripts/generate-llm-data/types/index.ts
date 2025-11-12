/**
 * TypeScript type definitions for LLM data generation
 * Based on data-model.md specification
 */

/**
 * Author information resolved from authors.yaml
 */
export interface Author {
  id: string
  name: string
  position?: string
  company?: string
  avatar?: string
  bio?: string
}

/**
 * Individual piece of structured content within a section
 * (blog post, solution, job, etc.)
 */
export interface ContentItem {
  title: string
  url: string
  author?: string
  published?: string
  summary: string
  fullContent?: string
  metadata?: Record<string, string>
}

/**
 * Major content section within an LLM document
 */
export interface Section {
  title: string
  level: 1 | 2
  content: string | ContentItem[]
  schemaType?: string
}

/**
 * Metadata headers that appear at the top of LLM text files
 */
export interface DocumentMetadata {
  url: string
  lastUpdated: string
  version: string
  contentSummary: string
}

/**
 * Root structure representing a complete LLM text file
 */
export interface LLMDocument {
  metadata: DocumentMetadata
  sections: Section[]
  generatedAt: Date
  fileType: 'basic' | 'full'
}

/**
 * MDX frontmatter structure for blog posts
 */
export interface BlogPostFrontmatter {
  title: string
  date: string
  authors: string[]
  category: string
  excerpt: string
  featured?: boolean
  coverImage?: string
}

/**
 * MDX frontmatter structure for solutions
 */
export interface SolutionFrontmatter {
  title: string
  description: string
  icon?: string
  order?: number
}

/**
 * MDX frontmatter structure for success stories
 */
export interface SuccessStoryFrontmatter {
  title: string
  client: string
  industry: string
  excerpt: string
  coverImage?: string
  date?: string
}

/**
 * MDX frontmatter structure for job postings
 */
export interface JobFrontmatter {
  title: string
  location: string
  type: string
  department: string
  description: string
  postedDate: string
}

/**
 * Parsed MDX content with frontmatter and body
 */
export interface ParsedMDX<T = any> {
  frontmatter: T
  content: string
  slug: string
}

/**
 * YAML structure for testimonials
 */
export interface Testimonial {
  id: string
  author: string
  position: string
  company: string
  quote: string
  avatar?: string
}

/**
 * YAML structure for partners
 */
export interface Partner {
  id: string
  name: string
  description: string
  logo?: string
  url?: string
}

/**
 * Page metadata from YAML files
 */
export interface PageMetadata {
  title: string
  description: string
  content?: string
}
