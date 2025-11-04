import Slugger from 'github-slugger'

export interface TocHeader {
  id: string
  title: string
  level: number
  children: TocHeader[]
}

export const mdRegex = /\.mdx?$/

const slugs = new Slugger()
const slugRegex = /<[^>]*>|[^a-zA-Z0-9,;\-.!?<> ]/g

export function generateToc(markdown: string): TocHeader[] {
  slugs.reset()
  const headers: Array<TocHeader> = []

  // structure for collecting children children of appropriate header
  const parents: Record<number, TocHeader> = {
    1: { children: headers } as TocHeader,
  }

  markdown
    .split('\n')
    .map((text) => text.match(/^(#{2,6})\ (.+)/))
    .filter(Boolean)
    .forEach((header) => {
      const level = header?.[1]?.length || 2
      let title = header?.[2] || ''

      title = title.replace(slugRegex, '')
      const id = slugs.slug(title)
      const tocHeader: TocHeader = {
        level,
        id,
        title,
        children: [],
      }
      parents[level] = tocHeader
      const parent = findParent(parents, tocHeader)
      if (parent) {
        parent.children.push(tocHeader)
      }
    })

  return headers
}

function findParent(
  parents: Record<number, TocHeader>,
  header: TocHeader
): TocHeader | undefined {
  let deep = 1
  let parent = parents[header.level - deep]
  while (!parent) {
    parent = parents[header.level - ++deep]
  }
  return parent
}
