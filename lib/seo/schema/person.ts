/**
 * Person Schema Generator
 *
 * Generates Schema.org Person structured data for authors and team members.
 * Used in Article.author and standalone author pages.
 */

import type { PersonSchema } from './types'
import { toAbsoluteUrl } from './utils'

export interface AuthorData {
  id: string
  name: string
  position?: string
  company?: string
  socialLink?: string
  email?: string
  avatar?: string
}

/**
 * Generates Person schema for an author
 * @param author - Author data from authors.yaml
 * @returns PersonSchema object for JSON-LD embedding
 */
export function generatePersonSchema(author: AuthorData): PersonSchema {
  const schema: PersonSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: toAbsoluteUrl(`/authors/${author.id}`),
  }

  // Add optional properties if available
  if (author.avatar) {
    schema.image = toAbsoluteUrl(author.avatar)
  }

  if (author.position) {
    schema.jobTitle = author.position
  }

  if (author.email) {
    schema.email = author.email
  }

  // Add social media links
  const sameAs: string[] = []
  if (author.socialLink) {
    sameAs.push(author.socialLink)
  }
  if (sameAs.length > 0) {
    schema.sameAs = sameAs
  }

  // Add description combining position and company
  if (author.position && author.company) {
    schema.description = `${author.position} at ${author.company}`
  }

  return schema
}
