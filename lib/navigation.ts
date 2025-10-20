import { promises as fsPromises } from 'fs'
import path from 'path'

import { NavigationLink } from '../contexts'
import { mdRegex } from './markdown'
import { parseMDX } from './mdx'

import metadata from '../siteMetadata'

export async function createNavigation(): Promise<NavigationLink[]> {
  const successStoriesLinks = await createSuccessStoriesNavigation()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const solutionsLinks = await createSolutionsNavigation()

  return [
    {
      title: 'Success Stories',
      link: '/success-stories',
      children: successStoriesLinks,
    },
    // {
    //   title: 'Solutions',
    //   link: '/solutions',
    //   children: solutionsLinks,
    // },
    // {
    //   title: 'About',
    //   link: '/about',
    // },
    {
      title: 'Documentation',
      link: metadata.explore.documentationPortal,
      target: '_blank',
    },
    // {
    //   title: 'Blog',
    //   link: '/blog',
    // },
    // {
    //   title: 'Jobs',
    //   link: '/jobs',
    // },
    {
      title: 'Contact',
      link: '/contact',
    },
  ]
}

async function createSuccessStoriesNavigation(): Promise<NavigationLink[]> {
  const links: NavigationLink[] = []

  const successStoriesPath = path.join(
    process.cwd(),
    'content',
    'success-stories'
  )
  const dirents = await fsPromises.readdir(successStoriesPath, {
    withFileTypes: true,
  })

  for (const dirent of dirents) {
    if (!dirent.isFile() || !mdRegex.test(dirent.name)) {
      continue
    }

    const mdPath = path.join(
      process.cwd(),
      'content',
      'success-stories',
      dirent.name
    )
    const mdContent = (await fsPromises.readFile(mdPath)).toString()
    const mdxSource = await parseMDX(mdContent)
    if (mdxSource.frontmatter.show === false) {
      return null as any
    }

    const title = mdxSource.frontmatter.title as string
    links.push({
      title,
      link: `/success-stories/${dirent.name.replace(mdRegex, '')}`,
    })
  }

  return links
}

async function createSolutionsNavigation(): Promise<NavigationLink[]> {
  const links: NavigationLink[] = []

  const solutionsPath = path.join(process.cwd(), 'content', 'solutions')
  const dirents = await fsPromises.readdir(solutionsPath, {
    withFileTypes: true,
  })

  for (const dirent of dirents) {
    if (!dirent.isFile() || !mdRegex.test(dirent.name)) {
      continue
    }

    const mdPath = path.join(process.cwd(), 'content', 'solutions', dirent.name)
    const mdContent = (await fsPromises.readFile(mdPath)).toString()
    const mdxSource = await parseMDX(mdContent)
    if (mdxSource.frontmatter.show === false) {
      return null as any
    }

    const title = mdxSource.frontmatter.title as string
    links.push({
      title,
      link: `/solutions/${dirent.name.replace(mdRegex, '')}`,
    })
  }

  return links
}
