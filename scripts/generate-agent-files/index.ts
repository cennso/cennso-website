/**
 * What AI agents read about the site, written after every build (`postbuild`)
 * from the pages the build rendered:
 *
 *   - `/<page>.md` for every page (the home page's is `/index.md`): the
 *     page's main content as markdown, converted from its rendered HTML, so it
 *     says exactly what the page says.
 *   - `/llms.txt`, the index an agent reads first, in the llmstxt.org shape: a
 *     heading, a one-line summary, then sections of `- [name](url): description`,
 *     every link to a page's markdown.
 *   - `/llms-full.txt`: every page's markdown in one file.
 *
 *     yarn generate:agents      # after `next build`
 *
 * The pages are the HTML `next build` prerendered, the same list the sitemap is
 * made from: a page switched off with `notFound` is in neither, with no list to
 * keep in step by hand.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkGfm from 'remark-gfm'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { parse as parseYaml } from 'yaml'

import siteMetadata from '../../siteMetadata'

import type { Element, ElementContent, Root as HastRoot } from 'hast'
import type { Root as MdastRoot, RootContent } from 'mdast'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const PAGES = join(ROOT, '.next/server/pages')
const PUBLIC = join(ROOT, 'public')
/**
 * `next build` copies `public/` into the standalone output before `postbuild`
 * runs, and CI's quality checks restore only `.next/` from the build. What is
 * written after the build is copied there too, so the checks read it.
 */
const STANDALONE_PUBLIC = join(ROOT, '.next/standalone/public')

const SITE = siteMetadata.siteUrl

/** Pages listed under "Optional": legal text an agent rarely needs. */
const LEGAL = new Set(['/imprint', '/privacy-policy'])

interface Page {
  /** `/`, `/contact`, `/success-stories/cennso-on-ibm-cloud`. */
  readonly path: string
  /** The page's name, as its `og:title` gives it. */
  readonly name: string
  readonly description: string
  /** The page's main content as markdown, its own headings as written. */
  readonly markdown: MdastRoot
}

/** Every prerendered page but the error pages. */
function pageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) return pageFiles(file)
    if (!entry.name.endsWith('.html') || entry.name.startsWith('_')) return []
    if (entry.name === '404.html' || entry.name === '500.html') return []
    return [file]
  })
}

function routeOf(file: string): string {
  const route = `/${relative(PAGES, file).replace(/\.html$/, '')}`
  return route === '/index' ? '/' : route
}

/** The page's address, as its canonical gives it. */
const pageUrl = (path: string) => (path === '/' ? `${SITE}/` : `${SITE}${path}`)

/** The page's markdown: `/index.md` for the home page. */
const markdownPath = (path: string) =>
  path === '/' ? '/index.md' : `${path}.md`

const markdownUrl = (path: string) => `${SITE}${markdownPath(path)}`

function attribute(node: Element, name: string): string | undefined {
  const value = node.properties?.[name]
  if (Array.isArray(value)) return value.join(' ')
  return value === undefined || value === null ? undefined : String(value)
}

function find(
  node: HastRoot | Element,
  test: (element: Element) => boolean
): Element | undefined {
  for (const child of node.children) {
    if (child.type !== 'element') continue
    if (test(child)) return child
    const found = find(child, test)
    if (found) return found
  }
  return undefined
}

function meta(tree: HastRoot, key: 'name' | 'property', value: string) {
  const element = find(
    tree,
    (node) => node.tagName === 'meta' && attribute(node, key) === value
  )
  return element ? (attribute(element, 'content') ?? '') : ''
}

/** Elements that carry nothing an agent reads: scripts, artwork, the trail, controls. */
const DROPPED = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'nav',
  'button',
  'form',
  'iframe',
])

/** A root-relative address made absolute; an optimised image's back to its own file. */
function absolute(url: string): string {
  if (url.startsWith('/_next/image')) {
    const original = new URL(url, SITE).searchParams.get('url')
    if (original) return absolute(original)
  }
  return url.startsWith('/') ? `${SITE}${url}` : url
}

/**
 * The main content without what is not content: dropped elements, anything
 * hidden from every reader, the sentence for agents (the markdown carries its
 * own), and decorative images; every address absolute.
 */
function clean(nodes: ElementContent[]): ElementContent[] {
  // The previous image's description, so the same artwork drawn once per theme
  // (one image shown in light, the other in dark) is listed once.
  let previousAlt: string | undefined
  const kept = nodes.flatMap((node): ElementContent[] => {
    if (node.type !== 'element') return node.type === 'comment' ? [] : [node]
    if (DROPPED.has(node.tagName)) return []
    if (attribute(node, 'ariaHidden') === 'true') return []
    if (node.properties?.dataAgentDirective !== undefined) return []
    if (node.tagName === 'img') {
      const alt = attribute(node, 'alt')
      if (!alt || alt === previousAlt) return []
      previousAlt = alt
      node.properties = { src: absolute(attribute(node, 'src') ?? ''), alt }
      return [node]
    }
    if (node.tagName === 'a') {
      const href = attribute(node, 'href')
      if (href) node.properties = { ...node.properties, href: absolute(href) }
    }
    node.children = clean(node.children)
    // A heading's self-link anchor, an icon-only link: nothing to read.
    if (node.tagName === 'a' && !hasContent(node)) return []
    return [node]
  })
  return separated(kept)
}

function hasContent(node: Element): boolean {
  return node.children.some((child) =>
    child.type === 'text'
      ? child.value.trim() !== ''
      : child.type === 'element' &&
        (child.tagName === 'img' || hasContent(child))
  )
}

/** Phrasing elements: markdown runs them together on one line. */
const INLINE = new Set(['a', 'span', 'strong', 'em', 'b', 'i', 'code', 'img'])

/**
 * A layout's column of links - an e-mail and a phone number stacked by CSS -
 * is several inline elements side by side in the HTML, which markdown would
 * run together. Where elements stand alone with no text between them, each
 * inline one becomes a paragraph of its own.
 */
function separated(nodes: ElementContent[]): ElementContent[] {
  const elements = nodes.filter((node) => node.type === 'element')
  const text = nodes.some(
    (node) => node.type === 'text' && node.value.trim() !== ''
  )
  const inline = elements.filter((node) => INLINE.has(node.tagName))
  if (text || inline.length < 2 || inline.length !== elements.length) {
    return nodes
  }
  return elements.map(
    (node): Element => ({
      type: 'element',
      tagName: 'p',
      properties: {},
      children: [node],
    })
  )
}

const toMarkdown = unified()
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify, { bullet: '-', emphasis: '_', rule: '-' })

function readPage(file: string): Page {
  const path = routeOf(file)
  const tree = unified()
    .use(rehypeParse)
    .parse(readFileSync(file, 'utf8')) as HastRoot
  const main = find(tree, (node) => node.tagName === 'main')
  if (main === undefined) throw new Error(`${path}: no <main>`)

  const content: HastRoot = { type: 'root', children: clean(main.children) }
  const markdown = toMarkdown.runSync(content) as MdastRoot

  return {
    path,
    name: path === '/' ? 'Home' : meta(tree, 'property', 'og:title'),
    description: meta(tree, 'name', 'description'),
    markdown,
  }
}

function stringify(markdown: MdastRoot): string {
  return toMarkdown.stringify(markdown).trim()
}

/** The same content two heading levels down: under the file's H1 and the page's own H2. */
function nested(markdown: MdastRoot): MdastRoot {
  const shift = (node: RootContent): RootContent => {
    if (node.type === 'heading') {
      return {
        ...node,
        depth: Math.min(node.depth + 2, 6) as typeof node.depth,
      }
    }
    return 'children' in node
      ? ({
          ...node,
          children: (node.children as RootContent[]).map(shift),
        } as RootContent)
      : node
  }
  return { ...markdown, children: markdown.children.map(shift) }
}

/** The sentence every page's HTML carries for agents, from the same content. */
function directive(): string {
  const footer = parseYaml(
    readFileSync(join(ROOT, 'content/footer.yaml'), 'utf8')
  ).footer.agent_directive
  return `${footer.before}${absolute(footer.link)}${footer.after}`
}

/** One line of an llms.txt section. Brackets in a name would end the link early. */
function entry(name: string, url: string, description?: string): string {
  const text = name.replace(/\s+/g, ' ').replace(/\[/g, '(').replace(/\]/g, ')')
  const link = `- [${text}](${url})`
  return description ? `${link}: ${description.replace(/\s+/g, ' ')}` : link
}

/** What the company is and how to reach it: the summary and prose both files open with. */
function introduction(): string[] {
  const { contact, explore } = siteMetadata
  return [
    `# ${siteMetadata.title}`,
    '',
    `> ${siteMetadata.slogan} ${siteMetadata.description}`,
    '',
    `${contact.address.place.join(', ')}; ${contact.email}, ${contact.phone}. ` +
      `Customers run Cennso from the cloud portal at ${explore.cloudPortal} (sign-in required).`,
  ]
}

function llmsTxt(pages: readonly Page[]): string {
  const top = pages.filter(
    (page) => page.path.split('/').length === 2 && !LEGAL.has(page.path)
  )
  const lines = [
    ...introduction().map((line, index) =>
      index === 2 ? `${line} Every page below is linked as markdown.` : line
    ),
    '',
    '## Pages',
    '',
    ...top.map((page) =>
      entry(page.name, markdownUrl(page.path), page.description)
    ),
  ]

  // A page under another is listed under that page's name: the success
  // stories under "Success Stories".
  for (const parent of top) {
    const children = pages.filter(
      (page) => page.path.startsWith(`${parent.path}/`) && parent.path !== '/'
    )
    if (children.length === 0) continue
    lines.push(
      '',
      `## ${parent.name}`,
      '',
      ...children.map((page) =>
        entry(page.name, markdownUrl(page.path), page.description)
      )
    )
  }

  const { explore } = siteMetadata
  lines.push(
    '',
    '## Documentation',
    '',
    entry(
      explore.documentation.name,
      explore.documentation.llms,
      explore.documentation.description
    ),
    '',
    '## Optional',
    '',
    entry(
      'Full content',
      `${SITE}/llms-full.txt`,
      'every page of this site inline, as markdown'
    ),
    entry('Sitemap', `${SITE}/sitemap.xml`, 'the address of every page'),
    ...pages
      .filter((page) => LEGAL.has(page.path))
      .map((page) => entry(page.name, markdownUrl(page.path), page.description))
  )

  return `${lines.join('\n')}\n`
}

function llmsFullTxt(pages: readonly Page[]): string {
  const ordered = [
    ...pages.filter((page) => !LEGAL.has(page.path)),
    ...pages.filter((page) => LEGAL.has(page.path)),
  ]
  const sections = ordered.map((page) =>
    [
      `## ${page.name}`,
      '',
      `Source: ${pageUrl(page.path)}`,
      '',
      stringify(nested(page.markdown)),
    ].join('\n')
  )
  return `${[introduction().join('\n'), ...sections].join('\n\n')}\n`
}

function pageMarkdown(page: Page, sentence: string): string {
  return `> ${sentence}\n\n${stringify(page.markdown)}\n\nSource: ${pageUrl(page.path)}\n`
}

function write(path: string, text: string) {
  const file = join(PUBLIC, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
  console.log(`  ✓ public${path}  ${text.length} characters`)
}

/** What was written after the build, mirrored into the standalone output. */
function mirror(paths: readonly string[]) {
  if (!existsSync(STANDALONE_PUBLIC)) return
  for (const path of paths) {
    const target = join(STANDALONE_PUBLIC, path)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(PUBLIC, path), target)
  }
}

function main() {
  console.log('🤖 Writing the files for AI agents...\n')
  if (!existsSync(PAGES)) {
    throw new Error(`${PAGES} not found: run \`next build\` first`)
  }

  const pages = pageFiles(PAGES)
    .map(readPage)
    .sort((left, right) =>
      left.path === '/'
        ? -1
        : right.path === '/'
          ? 1
          : left.path.localeCompare(right.path)
    )
  const sentence = directive()

  const written: string[] = []
  for (const page of pages) {
    write(markdownPath(page.path), pageMarkdown(page, sentence))
    written.push(markdownPath(page.path))
  }
  write('/llms.txt', llmsTxt(pages))
  write('/llms-full.txt', llmsFullTxt(pages))
  written.push('/llms.txt', '/llms-full.txt')

  // next-sitemap writes it just before this, in the same postbuild.
  if (existsSync(join(PUBLIC, 'sitemap.xml'))) written.push('/sitemap.xml')
  mirror(written)

  console.log(`\n✨ ${pages.length} pages written for agents.`)
}

main()
