/**
 * The site's structured data: one `@graph` per page, every value from
 * `siteMetadata`.
 *
 * Every page carries the Organization and the WebSite; a success story adds
 * its Article, the contact page its ContactPage. Nodes name each other by
 * `@id`, and search engines join them by that exact string - which is why the
 * Organization's `@id` must never change: other sites name it as their
 * publisher.
 *
 * The breadcrumb trail is not here: `PageHeader`, which draws the visible
 * trail, writes it, so the two cannot differ.
 */

import siteMetadata from '../../../siteMetadata'
import { CARD_SIZE } from '../card'

/** A node of the graph: a schema.org object without its own `@context`. */
export type GraphNode = Record<string, unknown>

/** The site's home page, with its slash: what every `@id` here is built on. */
const HOME = `${siteMetadata.siteUrl}/`

export const ORGANIZATION_ID = `${HOME}#organization`
export const WEBSITE_ID = `${HOME}#website`

/** Drawn by scripts/generate-icons: the sign on a tile, on white, as Google wants a logo. */
const LOGO = {
  '@type': 'ImageObject',
  url: `${siteMetadata.siteUrl}/assets/logo.png`,
  width: 512,
  height: 512,
}

/** The page's language, as `<html lang>` gives it. */
const LANGUAGE = 'en'

/** The company: who publishes this site, and the two portals. */
export function organizationNode(): GraphNode {
  const { contact } = siteMetadata
  const { address } = contact

  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: siteMetadata.title,
    legalName: siteMetadata.companyName,
    url: HOME,
    logo: LOGO,
    description: siteMetadata.description,
    slogan: siteMetadata.slogan,
    email: contact.email,
    telephone: contact.tel,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.streetAddress,
      postalCode: address.postalCode,
      addressLocality: address.addressLocality,
      addressCountry: address.addressCountry,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: contact.email,
      telephone: contact.tel,
      availableLanguage: ['English', 'German'],
    },
    vatID: contact.vatID,
    sameAs: siteMetadata.social.profiles,
  }
}

/** The site itself: Google reads the site's name in its results from this node. */
export function websiteNode(): GraphNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: siteMetadata.title,
    alternateName: siteMetadata.alternateName,
    url: HOME,
    inLanguage: LANGUAGE,
    publisher: { '@id': ORGANIZATION_ID },
  }
}

export interface PageFacts {
  /** The page's own address, as its canonical and `og:url` give it. */
  readonly url: string
  readonly title: string
  readonly description?: string
  /** The page's preview card, as its `og:image` names it. */
  readonly image?: string
}

/**
 * A success story, as an article the company wrote. No dates and no person:
 * the content has neither, and structured data says only what the page says.
 */
export function articleNode(page: PageFacts): GraphNode {
  return {
    '@type': 'Article',
    '@id': `${page.url}#article`,
    headline: page.title,
    ...(page.description ? { description: page.description } : {}),
    url: page.url,
    inLanguage: LANGUAGE,
    ...(page.image
      ? { image: { '@type': 'ImageObject', url: page.image, ...CARD_SIZE } }
      : {}),
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    author: { '@id': ORGANIZATION_ID },
  }
}

/** The contact page: a page about reaching the company, whose details are the Organization's. */
export function contactPageNode(page: PageFacts): GraphNode {
  return {
    '@type': 'ContactPage',
    '@id': `${page.url}#webpage`,
    name: page.title,
    ...(page.description ? { description: page.description } : {}),
    url: page.url,
    inLanguage: LANGUAGE,
    isPartOf: { '@id': WEBSITE_ID },
    about: { '@id': ORGANIZATION_ID },
  }
}

export interface Crumb {
  readonly title: string
  /** The crumb's path on the site, e.g. `/success-stories`. */
  readonly link: string
}

/**
 * The trail above a page, as the page draws it, or nothing when it has fewer
 * than two crumbs: Google reads a trail as a path between pages, and one crumb
 * is no path. The home page is not a crumb: a search result already starts
 * from it.
 */
export function breadcrumbNode(
  crumbs: readonly Crumb[]
): GraphNode | undefined {
  if (crumbs.length < 2) return undefined
  const page = crumbs[crumbs.length - 1]

  return {
    '@type': 'BreadcrumbList',
    '@id': `${siteMetadata.siteUrl}${page.link}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.title,
      item: `${siteMetadata.siteUrl}${crumb.link}`,
    })),
  }
}

/** Nodes as one document: the context once, the nodes under `@graph`. */
export function graph(nodes: readonly GraphNode[]): GraphNode {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.map(({ '@context': _context, ...node }) => node),
  }
}

/**
 * A document as the text of a `<script type="application/ld+json">`. A `</script>`
 * in a title would end the element and turn the rest into markup; `<` written
 * as `<` is the same character to a JSON parser and none to an HTML one.
 */
export function jsonLd(document: GraphNode): string {
  return JSON.stringify(document).replace(/</g, '\\u003c')
}
