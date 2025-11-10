import React from 'react'
import { StructuredData } from '@/lib/seo/types'
import type { SchemaType, SchemaCollection } from '@/lib/seo/schema/types'

export interface SchemaOrgProps {
  data: StructuredData | StructuredData[] | SchemaType | SchemaCollection
}

/**
 * SchemaOrg Component
 *
 * Renders schema.org structured data as JSON-LD script tags.
 * Supports single or multiple structured data objects.
 *
 * @param {SchemaOrgProps} props - Component props
 * @returns {JSX.Element} JSON-LD script tag(s)
 *
 * @example
 * // Single schema
 * <SchemaOrg data={organizationSchema} />
 *
 * @example
 * // Multiple schemas
 * <SchemaOrg data={[organizationSchema, breadcrumbSchema]} />
 */
export function SchemaOrg({ data }: SchemaOrgProps): JSX.Element {
  // Handle array of structured data
  if (Array.isArray(data)) {
    return (
      <>
        {data.map((schema, index) => (
          <script
            key={`schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema, null, 0), // Minified JSON
            }}
          />
        ))}
      </>
    )
  }

  // Handle single structured data object
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0), // Minified JSON
      }}
    />
  )
}

export default SchemaOrg
