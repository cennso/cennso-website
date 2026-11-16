import fs from 'fs'
import path from 'path'

import { parse as YamlParse } from 'yaml'
import readFrontMatter from 'front-matter'

import { __dirname } from './common'
import { CARD_BADGE, cardDescription, cardTitle } from '../../lib/seo/card'

export type DataItem = {
  /** The page kind in the amber badge above the title, e.g. "Success story". */
  badge?: string
  title: string
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
    badge: CARD_BADGE.successStory,
  })
  const solutionsPages = await preparePages({
    folderName: 'solutions',
    pagePath: 'solutions',
    descriptionField: 'description',
    badge: CARD_BADGE.solution,
    generate: false,
  })
  const blogPostsPages = await preparePages({
    folderName: 'blog-posts',
    pagePath: 'blog',
    badge: CARD_BADGE.blogPost,
    generate: false,
  })
  const jobsPages = await preparePages({
    folderName: 'jobs',
    pagePath: 'jobs',
    titleField: 'position',
    badge: CARD_BADGE.jobOffer,
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
      title: cardTitle(landingPage.page) ?? '',
      description: cardDescription(landingPage.page) ?? '',
      path: ['landing-page'],
    },
    {
      title: cardTitle(aboutPage.page) ?? '',
      description: cardDescription(aboutPage.page) ?? '',
      path: ['about'],
      // TODO: Enable OG image generation when about page content is finalized
      // Currently disabled because page is not fully populated with real data
      generate: false,
    },
    {
      title: cardTitle(contactPage.page) ?? '',
      description: cardDescription(contactPage.page) ?? '',
      path: ['contact'],
    },
    {
      title: cardTitle(successStoriesPage.page) ?? '',
      description: cardDescription(successStoriesPage.page) ?? '',
      path: ['success-stories'],
    },
    {
      title: cardTitle(solutionsPage.page) ?? '',
      description: cardDescription(solutionsPage.page) ?? '',
      path: ['solutions'],
      // TODO: Enable OG image generation when solutions page content is finalized
      // Currently disabled because page is not fully populated with real data
      generate: false,
    },
    {
      title: cardTitle(blogPage.page) ?? '',
      description: cardDescription(blogPage.page) ?? '',
      path: ['blog'],
      // TODO: Enable OG image generation when blog page content is finalized
      // Currently disabled because page is not fully populated with real data
      generate: false,
    },
    {
      title: cardTitle(jobsPage.page) ?? '',
      description: cardDescription(jobsPage.page) ?? '',
      path: ['jobs'],
      // TODO: Enable OG image generation when jobs page content is finalized
      // Currently disabled because page is not fully populated with real data
      generate: false,
    },
    {
      title: cardTitle(partnersPage.page) ?? '',
      description: cardDescription(partnersPage.page) ?? '',
      path: ['partners'],
      // TODO: Enable OG image generation when partners page content is finalized
      // Currently disabled because page is not fully populated with real data
      generate: false,
    },
    {
      title: cardTitle(privacyPolicyPage.page) ?? '',
      description: cardDescription(privacyPolicyPage.page) ?? '',
      path: ['privacy-policy'],
    },
    {
      title: cardTitle(imprintPage.page) ?? '',
      description: cardDescription(imprintPage.page) ?? '',
      path: ['imprint'],
    },
    {
      title: cardTitle(notFoundPage.page) ?? '',
      description: cardDescription(notFoundPage.page) ?? '',
      path: ['404'],
    },
  ]
}

async function preparePages(ctx: {
  folderName: string
  pagePath: string
  titleField?: string
  descriptionField?: string
  badge?: string
  generate?: boolean
}): Promise<DataItem[]> {
  const {
    folderName,
    pagePath,
    titleField = 'title',
    descriptionField = 'excerpt',
    badge,
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
    dataItems.push({
      badge,
      // The page's own `<SEO card>` reads the same two fields through the same
      // functions, so the image and `og:image:alt` cannot disagree.
      title:
        cardTitle({ ...frontmatter, title: frontmatter[titleField] }) ?? '',
      description:
        cardDescription({
          ...frontmatter,
          description: frontmatter[descriptionField],
        }) ?? '',
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
