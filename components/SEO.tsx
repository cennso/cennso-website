import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'

import siteMetadata from '../siteMetadata'
import { SchemaOrg } from './common/SchemaOrg'
import { StructuredData } from '@/lib/seo/types'
import type { SchemaType, SchemaCollection } from '@/lib/seo/schema/types'
import { canonicalPath, getCanonicalUrl } from '@/lib/seo/canonical'
import {
  CARD_CONTENT_TYPE,
  CARD_SIZE,
  cardAlt,
  cardPath,
  cardVersion,
  type CardText,
} from '@/lib/seo/card'
import {
  generateOrganizationSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo/schema'

import type { FunctionComponent } from 'react'
import type { NextSeoProps } from 'next-seo'

export interface SEOProps
  extends Omit<
    NextSeoProps,
    'title' | 'titleTemplate' | 'defaultTitle' | 'themeColor'
  > {
  /**
   * The page's name, e.g. "Contact". The tab title is it followed by the site's
   * name, "Contact · Cennso"; `og:title` is the name alone, because previews
   * print the site's name beside it from `og:site_name`.
   */
  title: string
  /**
   * The whole tab title, as written, with no site name added. The home page
   * only: its title starts with the site's name.
   */
  absoluteTitle?: string
  /**
   * What the page's card prints, when that is not just its title and
   * description - see `lib/seo/card.ts`. Names the card's address and
   * `og:image:alt`.
   */
  card?: CardText
  /**
   * The 404 page: kept out of search results, and no canonical address, since
   * it answers at whatever address was not found.
   */
  notFound?: boolean
  structuredData?:
    | StructuredData
    | StructuredData[]
    | SchemaType
    | SchemaCollection
}

/** The site's name: what every tab title ends with and what previews call the site. */
const SITE_NAME = siteMetadata.title

/** The separator between a page's name and the site's, as the documentation portal writes it. */
const TITLE_SEPARATOR = ' · '

/** `en-US` as Open Graph spells a locale: language and territory, `en_US`. */
function openGraphLocale(locale: string): string {
  const [language, region] = locale.split('-')
  return region === undefined ? language : `${language}_${region.toUpperCase()}`
}

export const SEO: FunctionComponent<SEOProps> = ({
  title,
  absoluteTitle,
  card,
  notFound = false,
  structuredData,
  description: pageDescription,
  canonical,
  openGraph: pageOpenGraph,
  noindex,
  ...props
}) => {
  const router = useRouter()

  const siteUrl = siteMetadata.siteUrl
  const description = pageDescription || siteMetadata.description

  // Built from the path rather than taken from `router.asPath` as it is: a
  // shared link carries query strings (`?utm_source=…`) the page's address and
  // its card's file name must not.
  const path = notFound ? '/404' : canonicalPath(router.asPath)
  const canonicalUrl = notFound ? undefined : canonical || getCanonicalUrl(path)

  const cardText: CardText = card ?? { title, description }
  const images = pageOpenGraph?.images
    ? pageOpenGraph.images.map((image) => {
        let url = image.url
        if (!url.startsWith(siteUrl)) {
          url = `${siteUrl}${url}`
        }
        return { ...CARD_SIZE, ...image, url }
      })
    : [
        {
          url: `${siteUrl}${cardPath(path)}?v=${cardVersion(cardText)}`,
          ...CARD_SIZE,
          type: CARD_CONTENT_TYPE,
          alt: cardAlt(cardText),
        },
      ]

  const openGraph: NextSeoProps['openGraph'] = {
    type: 'website',
    locale: openGraphLocale(siteMetadata.locale),
    siteName: SITE_NAME,
    url: canonicalUrl,
    title,
    description,
    ...(pageOpenGraph || {}),
    images,
  }

  // Generate global schemas that appear on all pages
  const organizationSchema = generateOrganizationSchema()
  const breadcrumbSchema = generateBreadcrumbSchema(router.asPath)

  // Combine global schemas with page-specific schemas
  const allSchemas = [
    organizationSchema,
    breadcrumbSchema,
    ...(structuredData
      ? Array.isArray(structuredData)
        ? structuredData
        : [structuredData]
      : []),
  ]

  return (
    <>
      <NextSeo
        {...props}
        title={absoluteTitle ?? `${title}${TITLE_SEPARATOR}${SITE_NAME}`}
        description={description}
        canonical={canonicalUrl}
        noindex={notFound || noindex}
        // A snippet of any length and a large image preview, which Google
        // otherwise keeps small for a page that does not say so.
        robotsProps={{ maxSnippet: -1, maxImagePreview: 'large' }}
        openGraph={openGraph}
        // No account to name: the card type alone makes X draw the large card
        // from the Open Graph tags.
        twitter={{ cardType: 'summary_large_image' }}
      />
      <SchemaOrg data={allSchemas} />
    </>
  )
}
