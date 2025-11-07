/**
 * Breadcrumb Schema Generator
 *
 * Generates Schema.org BreadcrumbList structured data for navigation hierarchy.
 * Used on all pages to show structure in search results.
 */

import type { BreadcrumbListSchema, ListItem } from './types'
import { toAbsoluteUrl } from './utils'

interface BreadcrumbItem {
  name: string
  path: string
}

/**
 * Parses URL path into breadcrumb hierarchy
 * @param path - Current page path (e.g., '/blog/getting-started')
 * @returns Array of breadcrumb items
 */
function parseBreadcrumbsFromPath(path: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [{ name: 'Home', path: '/' }]

  // Remove trailing slash and split path
  const cleanPath = path.replace(/\/$/, '')
  if (cleanPath === '' || cleanPath === '/') {
    return breadcrumbs
  }

  const segments = cleanPath.split('/').filter(Boolean)
  let currentPath = ''

  for (const segment of segments) {
    currentPath += `/${segment}`

    // Convert slug to title (e.g., 'getting-started' -> 'Getting Started')
    const name = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    breadcrumbs.push({ name, path: currentPath })
  }

  return breadcrumbs
}

/**
 * Generates BreadcrumbList schema from current page path
 * @param path - Current page path from router
 * @returns BreadcrumbListSchema object for JSON-LD embedding
 */
export function generateBreadcrumbSchema(path: string): BreadcrumbListSchema {
  const breadcrumbs = parseBreadcrumbsFromPath(path)

  const itemListElement: ListItem[] = breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1, // Schema.org requires 1-indexed positions
    name: crumb.name,
    item: toAbsoluteUrl(crumb.path),
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  }
}
