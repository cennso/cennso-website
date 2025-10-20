import { createContext, useContext } from 'react'

import type { MDXRemoteProps } from 'next-mdx-remote'
import type { Author } from './landing-page.context'
import type { TocHeader } from '../lib/markdown'

export interface BlogPostMetadata {
  title: string
  date: string
  excerpt: string
  category: string
  tags: string[]
  cover: string
  authors: Author[]
  canonical?: string
  show?: boolean
}

export interface BlogPostItem {
  link: string
  frontmatter: BlogPostMetadata
  excerpt: string
  readingTime: number
}

export interface BlogPostContextValue {
  frontmatter: BlogPostMetadata
  excerpt: string
  readingTime: number
  toc: TocHeader[]
  mdxSource: MDXRemoteProps
  currentPath: string
}

export const BlogPostContext = createContext<BlogPostContextValue>({} as any)

export function useBlogPostContext() {
  return useContext(BlogPostContext)
}
