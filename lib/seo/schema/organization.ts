/**
 * Organization Schema Generator
 *
 * Generates Schema.org Organization structured data for Cennso company information.
 * Used on all pages for brand knowledge panel and search result enhancement.
 */

import type { OrganizationSchema, ContactPoint } from './types'
import { toAbsoluteUrl, createSchemaId, formatSchemaDate } from './utils'
import { generatePersonSchema, type AuthorData } from './person'

export interface OrganizationData {
  foundingDate?: string
  founders?: AuthorData[]
  contactPoint?: {
    telephone?: string
    email?: string
    contactType?: string
    availableLanguage?: string[]
  }
}

/**
 * Generates Organization schema with Cennso company information
 * @param enhancedData - Optional enhanced data (founding date, founders, contact info)
 * @returns OrganizationSchema object for JSON-LD embedding
 */
export function generateOrganizationSchema(
  enhancedData?: OrganizationData
): OrganizationSchema {
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': createSchemaId('organization'),
    name: 'Cennso',
    url: toAbsoluteUrl('/'),
    logo: toAbsoluteUrl('/assets/logo.png'),
    description:
      'Your mobile core deployed within 24 hours. Use Cennso Network Solutions to create your global mobile core platform, ready to deploy in over 170 cloud locations.',
    sameAs: [
      'https://www.linkedin.com/company/cennso',
      'https://github.com/cennso',
    ],
  }

  // Add enhanced data if provided
  if (enhancedData) {
    if (enhancedData.foundingDate) {
      schema.foundingDate = formatSchemaDate(enhancedData.foundingDate)
    }

    if (enhancedData.founders && enhancedData.founders.length > 0) {
      const founderSchemas = enhancedData.founders.map((founder) =>
        generatePersonSchema(founder)
      )
      schema.founder =
        founderSchemas.length === 1 ? founderSchemas[0] : founderSchemas
    }

    if (enhancedData.contactPoint) {
      const contactPoint: ContactPoint = {
        '@type': 'ContactPoint',
        contactType:
          enhancedData.contactPoint.contactType || 'customer service',
      }

      if (enhancedData.contactPoint.telephone) {
        contactPoint.telephone = enhancedData.contactPoint.telephone
      }

      if (enhancedData.contactPoint.email) {
        contactPoint.email = enhancedData.contactPoint.email
      }

      if (enhancedData.contactPoint.availableLanguage) {
        contactPoint.availableLanguage =
          enhancedData.contactPoint.availableLanguage
      }

      schema.contactPoint = contactPoint
    }
  }

  return schema
}
