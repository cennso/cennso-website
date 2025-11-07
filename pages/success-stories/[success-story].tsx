import { promises as fsPromises } from 'fs'
import path from 'path'
import { LinkIcon } from '@heroicons/react/24/outline'

import Image from 'next/image'

import { PageHeader } from '../../components/PageHeader'
import { Markdown } from '../../components/Markdown/Markdown'
import { Share } from '../../components/Markdown/Share'
import { TableOfContents } from '../../components/Markdown/TableOfContents'
import { SEO } from '../../components/SEO'
import { Button, Container, FeatureCard } from '../../components/common'
import { SuccessStoryContext } from '../../contexts'

import { mdRegex, generateToc } from '../../lib/markdown'
import { parseMDX } from '../../lib/mdx'
import { createNavigation } from '../../lib/navigation'

import type { NextPage, GetStaticProps, GetStaticPathsResult } from 'next'
import type { MDXRemoteProps } from 'next-mdx-remote'
import type { TocHeader } from '../../lib/markdown'
import type { SuccessStoryMetadata } from '../../contexts'

type SuccessStoryPageProps = {
  frontmatter: SuccessStoryMetadata
  toc: TocHeader[]
  mdxSource: MDXRemoteProps
  currentPath: string
  successStoryQuery: string
}

const SuccessStoryPage: NextPage<SuccessStoryPageProps> = ({
  successStoryQuery,
  ...props
}) => {
  const { frontmatter, toc, mdxSource, currentPath } = props
  const { title, excerpt, company, canonical, layout } = frontmatter

  return (
    <>
      <SEO title={title} description={excerpt} canonical={canonical} />

      <PageHeader
        title={title}
        description={excerpt}
        breadcrumbs={[
          {
            title: 'Success stories',
            link: '/success-stories',
          },
          {
            title,
            link: `/success-stories/${successStoryQuery}`,
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-success-story.webp',
          title: 'Success story page background',
          alt: 'Success story page background',
          width: 425,
          height: 200,
          className: 'relative md:right-16 top-2',
        }}
      />

      {layout === 'old' ? (
        <>
          <Container className="mt-12">
            <FeatureCard
              className="flex flex-col md:flex-row items-center rounded-[32px] px-8 md:px-16 py-4 transition-color ease-in-out duration-300 w-full bg-secondary-600"
              useGlow={true}
              useHexagon={true}
            >
              <div className="flex flex-row items-center justify-center">
                <div className="bg-transparent flex flex-row items-center justify-center p-2 filter drop-shadow-[0px_15px_20px_rgba(68,141,200,0.35)]">
                  <div className="bg-white mask mask-hexagon-2 p-2 min-w-[200px] min-h-[200px] max-w-[200px] max-h-[200px] flex flex-row justify-center items-center">
                    <Image
                      title={`${title} logo`}
                      alt={`${title} logo`}
                      src={company.logo}
                      width={150}
                      height={150}
                      sizes="150px"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col w-full md:w-auto md:ml-16 xl:ml-24 mt-8 md:mt-0">
                <h2 className="text-4xl text-secondary-200 font-bold">
                  {title}
                </h2>
                <ul className="flex flex-col lg:flex-row text-secondary-200 lg:gap-6 mt-2">
                  <li>
                    <span>
                      Company{' '}
                      <a href={company.website} target="_blank" rel="noopener">
                        <strong className="inline-flex flex-row items-center gap-0.5 font-semibold hover:underline">
                          <span>{company.name}</span>
                          <LinkIcon className="w-4" />
                        </strong>
                      </a>
                    </span>
                  </li>
                  {company.industry ? (
                    <li>
                      <span>
                        Industry{' '}
                        <strong className="font-semibold">
                          {company.industry}
                        </strong>
                      </span>
                    </li>
                  ) : null}
                </ul>
              </div>
            </FeatureCard>
          </Container>

          <Container className="mt-12 mb-24">
            <SuccessStoryContext.Provider value={props}>
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
            </SuccessStoryContext.Provider>
          </Container>
        </>
      ) : (
        <>
          <Container className="mt-12 mb-24">
            <SuccessStoryContext.Provider value={props}>
              <div className="flex flex-row gap-16 h-full w-full">
                <article className="flex-1 max-w-full w-full">
                  <div className="flex flex-col gap-12">
                    <Markdown mdxSource={mdxSource} />

                    {canonical ? (
                      <div className="mx-0">
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
                  </div>
                </article>
              </div>
            </SuccessStoryContext.Provider>
          </Container>
        </>
      )}
    </>
  )
}

export default SuccessStoryPage

export const getStaticProps: GetStaticProps<SuccessStoryPageProps> =
  async function (context) {
    const successStory = context.params?.['success-story'] as string

    const postsDirectory = path.join(
      process.cwd(),
      'content',
      'success-stories'
    )
    const dirents = await fsPromises.readdir(postsDirectory, {
      withFileTypes: true,
    })
    const mdFile = dirents.find(
      (dirent) =>
        dirent.isFile() && dirent.name.replace(mdRegex, '') === successStory
    )?.name as string
    const mdPath = path.join(
      process.cwd(),
      'content',
      'success-stories',
      mdFile
    )
    const mdContent = (await fsPromises.readFile(mdPath)).toString()

    const mdxSource = await parseMDX(mdContent)
    const toc = generateToc(mdContent)
    const frontmatter = mdxSource.frontmatter as unknown as SuccessStoryMetadata

    return {
      props: {
        frontmatter: {
          ...frontmatter,
          layout: frontmatter.layout || 'old',
        },
        toc,
        mdxSource,
        successStoryQuery: successStory,
        currentPath: `https://cennso.com/success-stories/${successStory}`,
        $$app: {
          navigation: await createNavigation(),
        },
      },
    }
  }

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const successStoriesPath = path.join(
    process.cwd(),
    'content',
    'success-stories'
  )
  const dirents = await fsPromises.readdir(successStoriesPath, {
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
      'success-stories',
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
          'success-story': dirent.name.replace(mdRegex, ''),
        },
      })
    }
  }

  return {
    paths,
    fallback: false,
  }
}
