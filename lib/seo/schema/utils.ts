/**
 * Schema Utility Functions
 *
 * Common utilities for schema generation including date formatting,
 * URL validation, and helper functions.
 */

import siteMetadata from '../../../siteMetadata'

/**
 * Formats a date to ISO 8601 format (required by Schema.org)
 * @param date - Date object or ISO string
 * @returns ISO 8601 formatted date string
 */
export function formatSchemaDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString()
}

/**
 * Ensures URL is absolute (required by Schema.org)
 * @param path - Relative or absolute URL
 * @returns Absolute URL
 */
export function toAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const baseUrl = siteMetadata.siteUrl
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Validates that a URL is absolute
 * @param url - URL to validate
 * @returns true if URL is absolute
 */
export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

/**
 * Truncates headline to maximum length (110 chars recommended for Article schema)
 * @param headline - Original headline
 * @param maxLength - Maximum length (default 110)
 * @returns Truncated headline
 */
export function truncateHeadline(
  headline: string,
  maxLength: number = 110
): string {
  if (headline.length <= maxLength) {
    return headline
  }
  return headline.substring(0, maxLength - 3) + '...'
}

/**
 * Validates required schema properties
 * @param schema - Schema object to validate
 * @param requiredProps - Array of required property names
 * @throws Error if required property is missing
 */
export function validateRequiredProps(
  schema: Record<string, any>,
  requiredProps: string[]
): void {
  const missing = requiredProps.filter((prop) => !(prop in schema))
  if (missing.length > 0) {
    throw new Error(
      `Schema validation failed: Missing required properties: ${missing.join(', ')}`
    )
  }
}

/**
 * Creates a schema ID for referencing
 * @param type - Schema type (e.g., 'organization', 'person')
 * @param identifier - Optional unique identifier
 * @returns Schema ID string
 */
export function createSchemaId(type: string, identifier?: string): string {
  const base = `${siteMetadata.siteUrl}/#${type}`
  return identifier ? `${base}-${identifier}` : base
}
