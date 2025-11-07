/**
 * Article Schema Generator
 *
 * Generates Schema.org Article/BlogPosting structured data for blog posts.
 * Used on blog post pages for rich result cards and featured snippets.
 */

import type { ArticleSchema, PersonSchema } from './types'
import { toAbsoluteUrl, formatSchemaDate, truncateHeadline } from './utils'
import { generateOrganizationSchema } from './organization'
import { generatePersonSchema, AuthorData } from './person'

export interface BlogPostData {
  title: string
  date: string
  updatedDate?: string
  excerpt?: string
  cover?: string
  category?: string
  tags?: string[]
  content?: string
}

/**
 * Generates Article/BlogPosting schema for a blog post
 * @param post - Blog post frontmatter data
 * @param authors - Array of author data from authors.yaml
 * @returns ArticleSchema object for JSON-LD embedding
 */
export function generateArticleSchema(
  post: BlogPostData,
  authors: AuthorData[]
): ArticleSchema {
  // Generate author schemas
  const authorSchemas: PersonSchema[] = authors.map((author) =>
    generatePersonSchema(author)
  )

  // Use single author or array based on count
  const author = authorSchemas.length === 1 ? authorSchemas[0] : authorSchemas

  const schema: ArticleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: truncateHeadline(post.title, 110),
    author,
    datePublished: formatSchemaDate(post.date),
    dateModified: formatSchemaDate(post.updatedDate || post.date),
    publisher: generateOrganizationSchema(),
    image: post.cover
      ? toAbsoluteUrl(post.cover)
      : toAbsoluteUrl('/assets/logo.png'),
  }

  // Add optional properties
  if (post.excerpt) {
    schema.description = post.excerpt
  }

  if (post.content) {
    schema.articleBody = post.content
    // Calculate word count
    const wordCount = post.content.split(/\s+/).length
    schema.wordCount = wordCount
  }

  if (post.category) {
    schema.articleSection = post.category
  }

  if (post.tags && post.tags.length > 0) {
    schema.keywords = post.tags
  }

  schema.inLanguage = 'en-US'

  return schema
}
