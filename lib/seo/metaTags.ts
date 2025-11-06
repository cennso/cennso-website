/**
 * Meta Tags Generator
 *
 * Generates SEO meta tags with three-tier fallback system:
 * 1. Page-specific frontmatter/props
 * 2. Content type YAML configuration
 * 3. Global defaults from seo-config.yaml
 */

import type { SEOMetadata } from './types'

/**
 * Partial metadata overrides for generating complete SEO metadata
 * Allows callers to provide partial metadata that gets merged with defaults
 */
export type MetadataOverrides = Partial<SEOMetadata>

export interface SEOConfig {
  siteDefaults: {
    titleSuffix: string
    titleSeparator: string
    defaultTitle: string
    defaultDescription: string
  }
  social: {
    twitterHandle: string
    twitterCardType: string
    ogType: string
    ogImageDefault: string
    ogImageWidth: number
    ogImageHeight: number
  }
  fallbackDescriptions: {
    [key: string]: string
  }
}

/**
 * Generate full page title with suffix
 *
 * @param title - Page-specific title
 * @param config - SEO configuration
 * @param includeSuffix - Whether to append site suffix
 * @returns Full formatted title
 */
export function generateTitle(
  title: string | undefined,
  config: SEOConfig,
  includeSuffix: boolean = true
): string {
  const baseTitle = title || config.siteDefaults.defaultTitle

  if (!includeSuffix || baseTitle === config.siteDefaults.defaultTitle) {
    return baseTitle
  }

  return `${baseTitle}${config.siteDefaults.titleSuffix}`
}

/**
 * Generate meta description with fallback
 *
 * @param description - Page-specific description
 * @param pageType - Type of page (blog, solutions, etc.)
 * @param config - SEO configuration
 * @returns Meta description
 */
export function generateDescription(
  description: string | undefined,
  pageType: string | undefined,
  config: SEOConfig
): string {
  // 1. Use page-specific description if provided
  if (description) {
    return description
  }

  // 2. Use page type fallback if available
  if (pageType && config.fallbackDescriptions[pageType]) {
    return config.fallbackDescriptions[pageType]
  }

  // 3. Use global default
  return config.siteDefaults.defaultDescription
}

/**
 * Generate Open Graph image URL
 *
 * @param ogImage - Page-specific OG image path
 * @param config - SEO configuration
 * @param baseUrl - Site base URL
 * @returns Full OG image URL
 */
export function generateOgImage(
  ogImage: string | undefined,
  config: SEOConfig,
  baseUrl: string
): string {
  const imagePath = ogImage || config.social.ogImageDefault

  // If already absolute URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // Convert relative path to absolute URL
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${baseUrl}${cleanPath}`
}

/**
 * Validate title length (SEO best practice: 50-60 characters)
 *
 * @param title - Title to validate
 * @returns Validation result with warnings
 */
export function validateTitle(title: string): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  const length = title.length

  if (length < 50) {
    warnings.push(
      `Title is short (${length} chars). Optimal: 50-60 characters.`
    )
  } else if (length > 60) {
    warnings.push(
      `Title is long (${length} chars). May be truncated in search results. Optimal: 50-60 characters.`
    )
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}

/**
 * Validate meta description length (SEO best practice: 150-160 characters)
 *
 * @param description - Description to validate
 * @returns Validation result with warnings
 */
export function validateDescription(description: string): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  const length = description.length

  if (length < 150) {
    warnings.push(
      `Description is short (${length} chars). Optimal: 150-160 characters.`
    )
  } else if (length > 160) {
    warnings.push(
      `Description is long (${length} chars). May be truncated in search results. Optimal: 150-160 characters.`
    )
  }

  return {
    valid: warnings.length === 0,
    warnings,
  }
}

/**
 * Generate complete SEO metadata object with fallbacks
 *
 * @param metadata - Page-specific metadata overrides
 * @param pageType - Type of page
 * @param config - SEO configuration
 * @param canonical - Canonical URL
 * @returns Complete SEO metadata (all required fields populated)
 */
export function generateSEOMetadata(
  metadata: MetadataOverrides,
  pageType: string | undefined,
  config: SEOConfig,
  canonical: string
): SEOMetadata {
  const baseUrl = canonical.split('/').slice(0, 3).join('/') // Extract base URL

  return {
    title: generateTitle(metadata.title, config, true),
    description: generateDescription(metadata.description, pageType, config),
    canonical: metadata.canonical || canonical,
    ogImage: generateOgImage(metadata.ogImage, config, baseUrl),
    ogType: metadata.ogType || config.social.ogType,
    twitterCard: metadata.twitterCard || config.social.twitterCardType,
    noindex: metadata.noindex || false,
    nofollow: metadata.nofollow || false,
  }
}
