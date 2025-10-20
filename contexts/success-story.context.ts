import { createContext, useContext } from 'react'

import type { MDXRemoteProps } from 'next-mdx-remote'
import type { TocHeader } from '../lib/markdown'

export interface SuccessStoryMetadata {
  title: string
  company: {
    name: string
    website: string
    logo: string
    location: string
    industry: string
  }
  excerpt: string
  tags: string[]
  cover: string
  canonical?: string
  show?: boolean
  layout?: 'new' | 'old'
}

export interface SuccessStoryItem {
  link: string
  frontmatter: SuccessStoryMetadata
}

export interface SuccessStoryContextValue {
  frontmatter: SuccessStoryMetadata
  toc: TocHeader[]
  mdxSource: MDXRemoteProps
  currentPath: string
}

export const SuccessStoryContext = createContext<SuccessStoryContextValue>(
  {} as any
)

export function useSuccessStoryContext() {
  return useContext(SuccessStoryContext)
}
