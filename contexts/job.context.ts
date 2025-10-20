import { createContext, useContext } from 'react'

import type { MDXRemoteProps } from 'next-mdx-remote'

export interface JobMetadata {
  position: string
  kind: string
  mode: string
  show?: boolean
}

export interface JobItem {
  link: string
  frontmatter: JobMetadata
}

export interface JobContextValue {
  frontmatter: JobMetadata
  mdxSource: MDXRemoteProps
}

export const JobContext = createContext<JobContextValue>({} as any)

export function useJobContext() {
  return useContext(JobContext)
}
