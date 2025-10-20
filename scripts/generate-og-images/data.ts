import fs from 'fs'
import path from 'path'

import { parse as YamlParse } from 'yaml'
import readFrontMatter from 'front-matter'

import { __dirname } from './common'

export type DataItem = {
  title: string
  subTitle?: string
  description: string
  path: string[]
  generate?: boolean
}

const mdRegex = /\.mdx?$/

export async function prepareData(): Promise<DataItem[]> {
  const mainPages = await prepareMainPages()
  const successStoriesPages = await preparePages({
    folderName: 'success-stories',
    pagePath: 'success-stories',
    title: 'Success story',
  })
  const solutionsPages = await preparePages({
    folderName: 'solutions',
    pagePath: 'solutions',
    descriptionField: 'description',
    title: 'Solution',
    generate: false,
  })
  const blogPostsPages = await preparePages({
    folderName: 'blog-posts',
    pagePath: 'blog',
    title: 'Blog post',
    generate: false,
  })
  const jobsPages = await preparePages({
    folderName: 'jobs',
    pagePath: 'jobs',
    titleField: 'position',
    title: 'Job offer',
    generate: false,
  })

  return [
    ...mainPages,
    ...successStoriesPages,
    ...solutionsPages,
    ...blogPostsPages,
    ...jobsPages,
  ]
}

async function prepareMainPages(): Promise<DataItem[]> {
  const landingPage = await loadContent('landing-page.yaml')
  const aboutPage = await loadContent('about-page.yaml')
  const contactPage = await loadContent('contact-page.yaml')
  const successStoriesPage = await loadContent('success-stories-page.yaml')
  const solutionsPage = await loadContent('solutions-page.yaml')
  const blogPage = await loadContent('blog-page.yaml')
  const jobsPage = await loadContent('jobs-page.yaml')
  const partnersPage = await loadContent('partners.yaml')
  const privacyPolicyPage = await loadContent('privacy-policy.md')
  const imprintPage = await loadContent('imprint.md')
  const notFoundPage = await loadContent('404-page.yaml')

  return [
    {
      title: landingPage.page.title,
      description: landingPage.page.description,
      path: ['landing-page'],
    },
    {
      title: aboutPage.page.title,
      description: aboutPage.page.description,
      path: ['about'],
      generate: false,
    },
    {
      title: contactPage.page.title,
      description: contactPage.page.description,
      path: ['contact'],
    },
    {
      title: successStoriesPage.page.title,
      description: successStoriesPage.page.description,
      path: ['success-stories'],
    },
    {
      title: solutionsPage.page.title,
      description: solutionsPage.page.description,
      path: ['solutions'],
      generate: false,
    },
    {
      title: blogPage.page.title,
      description: blogPage.page.description,
      path: ['blog'],
      generate: false,
    },
    {
      title: jobsPage.page.title,
      description: jobsPage.page.description,
      path: ['jobs'],
      generate: false,
    },
    {
      title: partnersPage.page.title,
      description: partnersPage.page.description,
      path: ['partners'],
      generate: false,
    },
    {
      title: privacyPolicyPage.page.title,
      description: privacyPolicyPage.page.description,
      path: ['privacy-policy'],
    },
    {
      title: imprintPage.page.title,
      description: imprintPage.page.description,
      path: ['imprint'],
    },
    {
      title: notFoundPage.page.title,
      description: notFoundPage.page.description,
      path: ['404'],
    },
  ]
}

async function preparePages(ctx: {
  folderName: string
  pagePath: string
  titleField?: string
  descriptionField?: string
  title?: string
  generate?: boolean
}): Promise<DataItem[]> {
  const {
    folderName,
    pagePath,
    titleField = 'title',
    descriptionField = 'excerpt',
    title: inputTitle,
    generate,
  } = ctx
  const directoryPath = path.join(__dirname, '../../', 'content', folderName)
  const dirents = await fs.promises.readdir(directoryPath, {
    withFileTypes: true,
  })

  const dataItems: DataItem[] = []
  for (const dirent of dirents) {
    if (!dirent.isFile()) {
      continue
    }

    const mdPath = path.join(
      __dirname,
      '../../',
      'content',
      folderName,
      dirent.name
    )
    const content = (await fs.promises.readFile(mdPath)).toString()
    const frontMatterContent = readFrontMatter(content)
    const frontmatter = frontMatterContent.attributes as Record<string, any>
    const itemPath = dirent.name.replace(mdRegex, '')
    const title = frontmatter[titleField]

    dataItems.push({
      title: inputTitle || title,
      subTitle: inputTitle ? title : undefined,
      description: frontmatter[descriptionField],
      path: [pagePath, itemPath],
      generate,
    })
  }
  return dataItems
}

async function loadContent(file: string): Promise<Record<string, any>> {
  const contentPath = path.join(__dirname, '../../', 'content', file)
  const content = (await fs.promises.readFile(contentPath)).toString()

  if (file.endsWith('.yaml')) {
    const parsedContent = YamlParse(content)
    return parsedContent
  }

  const frontmatter = readFrontMatter(content)
  return frontmatter.attributes as Record<string, any>
}
