/**
 * URL building utility for converting relative paths to absolute URLs
 */

import siteMetadata from '../../../siteMetadata'

/**
 * Base site URL from site metadata
 */
const SITE_URL = siteMetadata.siteUrl

/**
 * Build an absolute URL from a relative path
 * @param relativePath - Relative path (e.g., '/blog/post-name', 'blog/post-name')
 * @returns Absolute URL (e.g., 'https://www.cennso.com/blog/post-name')
 */
export function buildAbsoluteUrl(relativePath: string): string {
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/')
    ? relativePath.slice(1)
    : relativePath

  // Ensure SITE_URL doesn't end with slash
  const cleanBaseUrl = SITE_URL.endsWith('/') ? SITE_URL.slice(0, -1) : SITE_URL

  return `${cleanBaseUrl}/${cleanPath}`
}

/**
 * Build URL for blog post
 * @param slug - Blog post slug
 */
export function buildBlogPostUrl(slug: string): string {
  return buildAbsoluteUrl(`blog/${slug}`)
}

/**
 * Build URL for solution
 * @param slug - Solution slug
 */
export function buildSolutionUrl(slug: string): string {
  return buildAbsoluteUrl(`solutions/${slug}`)
}

/**
 * Build URL for success story
 * @param slug - Success story slug
 */
export function buildSuccessStoryUrl(slug: string): string {
  return buildAbsoluteUrl(`success-stories/${slug}`)
}

/**
 * Build URL for job posting
 * @param slug - Job slug
 */
export function buildJobUrl(slug: string): string {
  return buildAbsoluteUrl(`jobs/${slug}`)
}

/**
 * Get the base site URL
 */
export function getSiteUrl(): string {
  return SITE_URL
}
