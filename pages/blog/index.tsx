import { promises as fsPromises } from 'fs'
import path from 'path'
import { default as readingTimeFn } from 'reading-time'
import { parse as YamlParse } from 'yaml'
import mimeTypes from 'mime-types'
// @ts-ignore
import json2xml from 'jgexml/json2xml'

import { ImRss2 } from 'react-icons/im'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'

import { PageHeader } from '../../components/PageHeader'
import { BlogPostItem } from '../../components/Blog/BlogPostItem'
import { SEO } from '../../components/SEO'
import { Container, Select } from '../../components/common'

import { mdRegex } from '../../lib/markdown'
import { kebabCase } from '../../lib/casing'
import { getQueryParam } from '../../lib/getQueryParam'
import { parseMDX } from '../../lib/mdx'
import { createNavigation } from '../../lib/navigation'

import siteMetadata from '../../siteMetadata'

import type { NextPage, GetStaticProps } from 'next'
import type { Author, BlogPostItem as BlogPostItemType } from '../../contexts'
import type { SelectProps, SelectOption } from '../../components/common'

type BlogPageProps = {
  content: Record<string, any>
  posts: Array<BlogPostItemType>
  categories: SelectProps['options']
}

const BlogPage: NextPage<BlogPageProps> = ({ content, posts, categories }) => {
  const router = useRouter()
  const [filteredPosts, setFilteredPosts] = useState<Array<BlogPostItemType>>(
    () => {
      const category = getQueryParam(router.asPath, 'category')
      if (!category) {
        return posts
      }

      const categoryValue = categories.find((i) => i.id === category)?.value
      return posts.filter((s) => s.frontmatter.category === categoryValue)
    }
  )

  const { page } = content

  const filterStories = useCallback(
    (value: SelectOption) => {
      if (value.id === '') {
        setFilteredPosts(posts)
        delete router.query.category
        router.replace(
          {
            query: { ...router.query },
          },
          undefined,
          { shallow: false }
        )
        return
      }

      router.replace(
        {
          query: { ...router.query, category: value.id },
        },
        undefined,
        { shallow: false }
      )
      setFilteredPosts(
        posts.filter((s) => s.frontmatter.category === value.value)
      )
    },
    [setFilteredPosts, posts, router]
  )

  return (
    <>
      <SEO
        title={page.title}
        description={page.description}
        additionalLinkTags={[
          {
            rel: 'alternate',
            type: 'application/rss+xml',
            href: `${siteMetadata.siteUrl}/feeds/blog.xml`,
          },
        ]}
      />

      <PageHeader
        title={page.title}
        description={page.description}
        breadcrumbs={[
          {
            title: page.title,
            link: '/blog',
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-blog.webp',
          title: 'Blog page background',
          alt: 'Blog page background',
          width: 750,
          height: 250,
        }}
      >
        <a
          rel="noreferrer noopener"
          target="_blank"
          href="/feeds/blog.xml"
          aria-label="Subscribe to blog RSS feed"
          className="flex flex-row gap-1.5 text-white items-center hover:underline decoration-2"
        >
          <span>Subscribe to our</span>
          <ImRss2 className="w-5 h-5" aria-hidden="true" />
          <span>RSS Feed</span>
        </a>
      </PageHeader>

      <Container className="mt-12 mb-24 px-8 lg:px-4">
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="select-category"
              id="select-category-label"
              className="sr-only"
            >
              {content.categorySelectLabel}
            </label>
            <Select
              id="select-category"
              ariaLabelledBy="select-category-label"
              placeholder="All Categories"
              selected={getQueryParam(router.asPath, 'category')}
              options={categories}
              onChange={filterStories}
            />
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full h-full">
            {filteredPosts.map((post) => (
              <li key={post.frontmatter.title} className="rounded-[32px]">
                <BlogPostItem post={post} />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </>
  )
}

export default BlogPage

export const getStaticProps: GetStaticProps<BlogPageProps> = async function () {
  // TODO: remove when we will have at least one blog post
  return {
    notFound: true,
  }

  const postsDirectory = path.join(process.cwd(), 'content', 'blog-posts')
  const dirents = await fsPromises.readdir(postsDirectory, {
    withFileTypes: true,
  })

  let categories: SelectProps['options'] = [
    {
      value: 'All Categories',
      id: '',
    },
  ]
  let posts: BlogPostItemType[] = (
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isFile() && mdRegex.test(dirent.name)) {
          const mdPath = path.join(
            process.cwd(),
            'content',
            'blog-posts',
            dirent.name
          )
          const mdContent = (await fsPromises.readFile(mdPath)).toString()

          const mdxSource = await parseMDX(mdContent)
          if (mdxSource.frontmatter.show === false) {
            return null as any
          }
          const readingTime = Math.ceil(readingTimeFn(mdContent).minutes)
          const excerpt = mdxSource.frontmatter.excerpt

          const authorsPath = path.join(
            process.cwd(),
            'content',
            'authors.yaml'
          )
          const authorsContent = (
            await fsPromises.readFile(authorsPath)
          ).toString()
          const parsedAuthors = YamlParse(authorsContent).authors
          const formatterAuthors: Author[] = (
            mdxSource.frontmatter.authors as string[]
          )
            .map((author) => {
              return parsedAuthors[author]
            })
            .filter(Boolean)

          const category = (
            mdxSource.frontmatter as unknown as BlogPostItemType['frontmatter']
          ).category
          if (category && !categories.some((i) => i.value === category)) {
            categories.push({
              value: category,
              id: kebabCase(category),
            })
          }

          return {
            link: `/blog/${dirent.name.replace(mdRegex, '')}`,
            frontmatter: {
              ...mdxSource.frontmatter,
              authors: formatterAuthors,
            },
            readingTime,
            excerpt,
          }
        }

        return null as any
      })
    )
  ).filter(Boolean)

  // sorting blog posts from newest to oldest
  posts = posts.sort((firstPost, secondPost) => {
    return (
      new Date(secondPost.frontmatter.date).getTime() -
      new Date(firstPost.frontmatter.date).getTime()
    )
  })

  // sorting categories
  categories = categories.sort((a, b) => {
    if (a.id < b.id) {
      return -1
    }
    if (a.id > b.id) {
      return 1
    }
    return 0
  })

  const contentPath = path.join(process.cwd(), 'content', 'blog-page.yaml')
  const content = (await fsPromises.readFile(contentPath)).toString()
  const parsedContent = YamlParse(content)

  // generating rss feed for blog posts
  await generateRssFeed(posts)

  return {
    props: {
      content: parsedContent,
      posts,
      categories,
      $$app: {
        navigation: await createNavigation(),
      },
    },
  }
}

async function generateRssFeed(posts: BlogPostItemType[]) {
  // TODO: remove when we will have at least one blog post
  return

  const siteUrl = process.env.SITE_URL || 'https://www.cennso.com'
  // for google analitycs tracing
  const tracking = '?utm_source=rss'

  const rss: any = {}
  const feed: any = { rss }

  rss['@version'] = '2.0'
  rss['@xmlns:atom'] = 'http://www.w3.org/2005/Atom'
  rss.channel = {
    title: `Blog | ${siteMetadata.title}`,
    description: 'Blog posts from CENNSO',
    link: siteUrl,
    language: 'en-us',
    managingEditor: `${siteMetadata.contact.email} (${siteMetadata.companyName})`,
    webMaster: `${siteMetadata.contact.email} (${siteMetadata.companyName})`,
    pubDate: new Date().toUTCString(),
    lastBuildDate: new Date().toUTCString(),
    ttl: 60, // refresh per hour
    image: {
      url: `${siteUrl}/favicon.png`,
      link: siteUrl,
      title: `Blog | ${siteMetadata.title}`,
    },
    copyright: `All rights reserved ${new Date().getFullYear()}, CENNSO`,
    'atom:link': {
      '@rel': 'self',
      '@href': `${siteUrl}/feeds/blog.xml`,
      '@type': 'application/rss+xml',
    },
    generator: 'Next.js (https://nextjs.org/)',
    item: [],
  }

  for (const post of posts) {
    const {
      title,
      excerpt,
      date,
      authors,
      category,
      tags = [],
      cover,
    } = post.frontmatter

    const link = `${siteUrl}${post.link}${tracking}`
    const item: any = {
      title: title,
      description: excerpt,
      link,
      guid: { '@isPermaLink': true, '': link },
      pubDate: new Date(date).toUTCString(),
      category: ['blog', category, tags],
      author: authors
        .map((author) =>
          author.email ? `${author.email} (${author.name})` : undefined
        )
        .filter(Boolean),
      source: {
        '@url': `${siteUrl}/feeds/blog.xml`,
        '': `Blog | ${siteMetadata.title}`,
      },
    }

    if (cover) {
      const coverUrl = cover.startsWith('/') ? cover : `/${cover}`
      const type = mimeTypes.lookup(cover)
      const coverLocalPath = path.resolve(
        process.cwd(),
        'public',
        cover.startsWith('/') ? cover.slice(1) : cover
      )
      const length = (await fsPromises.stat(coverLocalPath)).size

      item.enclosure = {
        '@url': `${siteUrl}${coverUrl}`,
        '@length': length,
        '@type': type,
      }
    }

    rss.channel.item.push(item)
  }

  const xml = json2xml.getXml(feed, '@', '', 2)
  await fsPromises.mkdir('./public/feeds', { recursive: true })
  await fsPromises.writeFile('./public/feeds/blog.xml', xml, 'utf8')
}
