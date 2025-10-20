import { promises as fsPromises } from 'fs'
import path from 'path'
import { default as readingTimeFn } from 'reading-time'
import markdownToTxt from 'markdown-to-txt'
import { parse as YamlParse } from 'yaml'
import { ArticleJsonLd } from 'next-seo'

import { PageHeader } from '../../components/PageHeader'
import { BlogPostAuthors } from '../../components/Blog/BlogPostAuthors'
import { Markdown } from '../../components/Markdown/Markdown'
import { Share } from '../../components/Markdown/Share'
import { TableOfContents } from '../../components/Markdown/TableOfContents'
import { SEO } from '../../components/SEO'
import { Button, Container } from '../../components/common'
import { BlogPostContext } from '../../contexts'

import { mdRegex, generateToc } from '../../lib/markdown'
import { parseMDX } from '../../lib/mdx'
import { createNavigation } from '../../lib/navigation'

import siteMetadata from '../../siteMetadata'

import type { NextPage, GetStaticPathsResult, GetStaticProps } from 'next'
import type { MDXRemoteProps } from 'next-mdx-remote'
import type { TocHeader } from '../../lib/markdown'
import type { BlogPostMetadata, Author } from '../../contexts'

type BlogPostPageProps = {
  frontmatter: BlogPostMetadata
  excerpt: string
  readingTime: number
  toc: TocHeader[]
  mdxSource: MDXRemoteProps
  currentPath: string
  blogPostQuery: string
}

const BlogPostPage: NextPage<BlogPostPageProps> = ({
  blogPostQuery,
  ...props
}) => {
  const { frontmatter, toc, mdxSource, readingTime, currentPath } = props
  const { title, date, authors, excerpt, cover, tags, canonical } = frontmatter
  const datePublished = new Date(date).toISOString()

  return (
    <>
      <SEO
        title={title}
        description={excerpt}
        openGraph={{
          type: 'article',
          article: {
            publishedTime: datePublished,
            modifiedTime: datePublished,
            tags: tags || undefined,
          },
        }}
        canonical={canonical}
      />

      <ArticleJsonLd
        useAppDir={false}
        keyOverride="blogPost"
        type="BlogPosting"
        url="https://example.com/blog"
        title={title}
        description={excerpt}
        images={[`${siteMetadata.siteUrl}${cover}`]}
        authorName={authors.map((author) => ({
          name: author.name,
          type: 'Person',
          url: author.email || author.socialLink,
        }))}
        publisherName={siteMetadata.title}
        publisherLogo={`${siteMetadata.siteUrl}${siteMetadata.siteLogo}`}
        datePublished={datePublished}
        dateModified={datePublished}
        isAccessibleForFree={true}
      />

      <PageHeader
        title={title}
        description={excerpt}
        breadcrumbs={[
          {
            title: 'Blog',
            link: '/blog',
          },
          {
            title,
            link: `/blog/${blogPostQuery}`,
          },
        ]}
      >
        <div className="text-white">
          <BlogPostAuthors
            authors={authors}
            date={date}
            readingTime={readingTime}
          />
        </div>
      </PageHeader>

      <Container className="mt-12 mb-24">
        <BlogPostContext.Provider value={props}>
          <div className="flex flex-row gap-16 h-full w-full">
            <article className="flex-1 max-w-full lg:max-w-[calc(100%-20rem)] w-full">
              <div className="flex flex-col gap-12">
                <Markdown mdxSource={mdxSource} />

                {canonical ? (
                  <div className="mt-2 mx-0">
                    <a
                      rel="noreferrer noopener"
                      target="_blank"
                      href={canonical}
                    >
                      <Button variant="secondary" useArrow={true}>
                        Read rest of the blog post
                      </Button>
                    </a>
                  </div>
                ) : null}

                <footer className="block lg:hidden border-t-2 border-gray-300 py-4">
                  <Share title={title} currentPath={currentPath} />
                </footer>
              </div>
            </article>
            <div className="hidden lg:block flex-none w-64">
              <div className="sticky top-32 w-full">
                <div className="flex flex-col gap-4">
                  <TableOfContents toc={toc} mdxSource={mdxSource} />
                  <div className="ml-2">
                    <Share title={title} currentPath={currentPath} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BlogPostContext.Provider>
      </Container>
    </>
  )
}

export default BlogPostPage

export const getStaticProps: GetStaticProps<BlogPostPageProps> =
  async function (context) {
    // TODO: remove when we will have at least one blog post
    return {
      notFound: true,
    }

    const blogPost = context.params?.['blog-post'] as string

    const postsDirectory = path.join(process.cwd(), 'content', 'blog-posts')
    const dirents = await fsPromises.readdir(postsDirectory, {
      withFileTypes: true,
    })
    const mdFile = dirents.find(
      (dirent) =>
        dirent.isFile() && dirent.name.replace(mdRegex, '') === blogPost
    )?.name as string
    const mdPath = path.join(process.cwd(), 'content', 'blog-posts', mdFile)
    const mdContent = (await fsPromises.readFile(mdPath)).toString()

    const mdxSource = await parseMDX(mdContent)
    const toc = generateToc(mdContent)
    const readingTime = Math.ceil(readingTimeFn(mdContent).minutes)
    const excerpt =
      mdxSource.frontmatter.excerpt || markdownToTxt(mdContent).substr(0, 200)

    const authorsPath = path.join(process.cwd(), 'content', 'authors.yaml')
    const authorsContent = (await fsPromises.readFile(authorsPath)).toString()
    const parsedAuthors = YamlParse(authorsContent).authors
    const formatterAuthors: Author[] = (
      mdxSource.frontmatter.authors as string[]
    )
      .map((author) => {
        return parsedAuthors[author]
      })
      .filter(Boolean)

    return {
      props: {
        frontmatter: {
          ...mdxSource.frontmatter,
          authors: formatterAuthors,
        },
        readingTime,
        excerpt,
        toc,
        mdxSource,
        blogPostQuery: blogPost,
        currentPath: `https://cennso.com/blog/${blogPost}`,
        $$app: {
          navigation: await createNavigation(),
        },
      } as unknown as BlogPostPageProps,
    }
  }

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const postsDirectory = path.join(process.cwd(), 'content', 'blog-posts')
  const dirents = await fsPromises.readdir(postsDirectory, {
    withFileTypes: true,
  })

  const paths: GetStaticPathsResult['paths'] = []
  for (const dirent of dirents) {
    if (!dirent.isFile()) {
      continue
    }

    const mdPath = path.join(
      process.cwd(),
      'content',
      'blog-posts',
      dirent.name
    )
    const mdContent = (await fsPromises.readFile(mdPath)).toString()
    const mdxSource = await parseMDX(mdContent)

    if (mdxSource.frontmatter.show === false) {
      continue
    }

    if (mdRegex.test(dirent.name)) {
      paths.push({
        params: {
          'blog-post': dirent.name.replace(mdRegex, ''),
        },
      })
    }
  }

  return {
    paths,
    fallback: false,
  }
}
