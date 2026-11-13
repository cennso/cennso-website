/**
 * Canonical URL Resolver
 *
 * Generates canonical URLs for pages based on environment configuration.
 * Uses NEXT_PUBLIC_SITE_URL for production URLs.
 *
 * The home page is written with its slash, `https://www.cennso.com/`, and every
 * other page without one, `https://www.cennso.com/contact`. The slash on the
 * home page is how a URL serialises (`new URL('/', base).href`), and the
 * site's structured data builds its `@id`s on it
 * (`https://www.cennso.com/#organization`), which other sites match by the
 * exact string. The sitemap writes the same form (`next-sitemap.config.js`).
 */

/**
 * Get the base site URL from environment or fallback
 */
export function getBaseSiteUrl(): string {
  // Use environment variable in production
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '') // Remove trailing slash
  }

  // Fallback for development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  // Default production URL as fallback
  return 'https://www.cennso.com'
}

/**
 * A page's path in its canonical form: no query string, no fragment, a leading
 * slash, and no trailing slash except for the home page, which is `/`.
 *
 * @example
 * canonicalPath('/contact/?utm_source=x') // '/contact'
 * canonicalPath('') // '/'
 */
export function canonicalPath(path: string): string {
  const cleanedPath = path.split('?')[0].split('#')[0]
  const normalizedPath = cleanedPath.startsWith('/')
    ? cleanedPath
    : `/${cleanedPath}`

  return normalizedPath === '/' ? '/' : normalizedPath.replace(/\/+$/, '')
}

/**
 * Generate canonical URL for a given path
 *
 * @param path - The page path (e.g., '/blog/my-post', '/about')
 * @returns Fully qualified canonical URL without query strings or fragments
 *
 * @example
 * getCanonicalUrl('/blog/my-post') // 'https://www.cennso.com/blog/my-post'
 * getCanonicalUrl('/blog/my-post?id=123') // 'https://www.cennso.com/blog/my-post'
 * getCanonicalUrl('/blog/my-post#section') // 'https://www.cennso.com/blog/my-post'
 * getCanonicalUrl('/') // 'https://www.cennso.com/'
 */
export function getCanonicalUrl(path: string): string {
  return `${getBaseSiteUrl()}${canonicalPath(path)}`
}

/**
 * Extract path from full URL
 *
 * @param url - Full URL or path
 * @returns Normalized path
 *
 * @example
 * extractPath('https://www.cennso.com/blog/post') // '/blog/post'
 * extractPath('/blog/post') // '/blog/post'
 */
export function extractPath(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname
  } catch {
    // Already a path, not a full URL
    return url.startsWith('/') ? url : `/${url}`
  }
}

/**
 * Check if URL is canonical (no query params, no fragments, no trailing slash)
 *
 * @param url - URL to check
 * @returns True if URL is canonical format
 */
export function isCanonicalFormat(url: string): boolean {
  try {
    const urlObj = new URL(url)

    // Should not have query parameters
    if (urlObj.search) {
      return false
    }

    // Should not have fragment
    if (urlObj.hash) {
      return false
    }

    // Should not have trailing slash (except root)
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      return false
    }

    // Should use HTTPS in production
    if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
      return false
    }

    return true
  } catch {
    return false
  }
}
