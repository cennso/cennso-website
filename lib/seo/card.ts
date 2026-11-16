/**
 * The preview card a page is shared with: the PNG `scripts/generate-og-images`
 * draws at build time, and what the page's `<head>` says about it.
 *
 * Both sides read the card's text through the functions here, so the image and
 * the tags that describe it cannot disagree.
 */

/** What a card prints: an optional badge, its title and its description. */
export interface CardText {
  /** The page kind in the amber badge above the title, e.g. "Success story". */
  readonly badge?: string
  readonly title: string
  readonly description?: string
}

/** The badge each kind of content page carries on its card. */
export const CARD_BADGE = {
  successStory: 'Success story',
  solution: 'Solution',
  blogPost: 'Blog post',
  jobOffer: 'Job offer',
} as const

/** Every card is drawn at this size, the one every network unfurling a link expects. */
export const CARD_SIZE = { width: 1200, height: 630 } as const

export const CARD_CONTENT_TYPE = 'image/png'

/** The metadata of a page or an entry, as content YAML and MDX frontmatter write it. */
interface CardSource {
  readonly title?: string
  readonly description?: string
  readonly og?: { readonly title?: string; readonly description?: string }
}

/**
 * The title on a page's card: `og.title` when the content sets one, else the page's
 * title. A card has room for a headline the page's name does not need to be.
 */
export function cardTitle(page: CardSource): string | undefined {
  return page.og?.title ?? page.title
}

/** The description on a page's card: `og.description`, else the page's description. */
export function cardDescription(page: CardSource): string | undefined {
  return page.og?.description ?? page.description
}

/** A page's whole card, for `<SEO card={…}>`: what the generator draws for it. */
export function pageCard(
  page: CardSource & { readonly title: string },
  badge?: string
): CardText {
  return {
    ...(badge === undefined ? {} : { badge }),
    title: cardTitle(page) ?? page.title,
    description: cardDescription(page),
  }
}

/**
 * The card as words, for `og:image:alt`: everything it prints, in the order it
 * prints it.
 */
export function cardAlt(card: CardText): string {
  return [card.badge, card.title, card.description]
    .filter((part): part is string => Boolean(part))
    .join(' · ')
}

/**
 * A short hash of what the card says, appended to its address.
 *
 * A network that unfurls a link fetches the image once and keeps it by its
 * address. With the text in the address, a card whose text changed is a new
 * address and is fetched again; one whose text did not is the same address and
 * is not. FNV-1a, 32 bits: cache-busting, not security.
 */
export function cardVersion(card: CardText): string {
  const text = [card.badge ?? '', card.title, card.description ?? ''].join('\n')
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/**
 * Where a page's card is, relative to the site: `/assets/og-images/<page>/image.png`,
 * with the home page's under `landing-page`. `path` is the page's canonical path.
 */
export function cardPath(path: string): string {
  const page = path === '/' ? 'landing-page' : path.replace(/^\/+/, '')
  return `/assets/og-images/${page}/image.png`
}
