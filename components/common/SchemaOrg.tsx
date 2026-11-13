import React from 'react'

import { jsonLd, type GraphNode } from '@/lib/seo/schema/graph'

export interface SchemaOrgProps {
  /** One JSON-LD document: a node with its `@context`, or a `@graph`. */
  data: GraphNode
}

/**
 * One `<script type="application/ld+json">`. The text is escaped by `jsonLd`,
 * so a title that contains `</script>` cannot end the element.
 */
export function SchemaOrg({ data }: SchemaOrgProps): React.JSX.Element {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
    />
  )
}

export default SchemaOrg
