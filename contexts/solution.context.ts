import { createContext, useContext } from 'react'

import type { MDXRemoteProps } from 'next-mdx-remote'

export interface SolutionMetadata {
  title: string
  description: string
  logo: string
  cover: string
}

export interface SolutionItem {
  link: string
  frontmatter: SolutionMetadata
}

export interface SolutionContextValue {
  frontmatter: SolutionMetadata
  mdxSource: MDXRemoteProps
}

export const SolutionContext = createContext<SolutionContextValue>({} as any)

export function useSolutionContext() {
  return useContext(SolutionContext)
}
