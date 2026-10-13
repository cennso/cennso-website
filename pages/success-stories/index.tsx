import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { useMemo, useState } from 'react'

import { Pagination } from '@cennso/ui'

import { PageHeader } from '../../components/PageHeader'
import { SuccessStoryItem } from '../../components/SuccessStories/SuccessStoryItem'
import { SEO } from '../../components/SEO'
import { Container } from '../../components/common'

import { mdRegex } from '../../lib/markdown'
import { parseMDX } from '../../lib/mdx'
import { createNavigation } from '../../lib/navigation'
import { loadFooterData } from '../../lib/footer'

import type { NextPage, GetStaticProps } from 'next'
import type { SuccessStoryItem as SuccessStoryItemType } from '../../contexts'

type SuccessStoriesPageProps = {
  content: Record<string, any>
  successStories: Array<SuccessStoryItemType>
}

// Matches the design's 4-rows-per-page layout (frames 1:1062 / 1:585).
const PAGE_SIZE = 4

const SuccessStoriesPage: NextPage<SuccessStoriesPageProps> = ({
  content,
  successStories,
}) => {
  const { page } = content
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(successStories.length / PAGE_SIZE)
  const pagedStories = useMemo(
    () =>
      successStories.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [successStories, currentPage]
  )

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <PageHeader
        title={page.heading}
        description={page.subheading}
        breadcrumbs={[
          {
            title: page.title,
            link: '/success-stories',
          },
        ]}
        background={{
          // Design 4.0's own banner illustration (frames 1:1062 / 1:585),
          // exported from Figma - not `bg-header-success-stories.webp`
          // (partners.tsx's old CENNSO-blocks graphic, still in place there).
          src: '/assets/backgrounds/success-stories-illustration.webp',
          alt: '',
          'aria-hidden': 'true',
          // The file is Figma's "Mask group" 1:614 at 2x: 586x362, drawn at
          // x=731..1317 - 37px past the 1280px column edge. Stepped down below
          // lg so it does not squeeze the heading on a tablet-width row.
          width: 586,
          height: 362,
          sizes: '(max-width: 767px) 0px, (max-width: 1023px) 320px, 586px',
          className:
            'block h-auto w-80 lg:w-[586px] lg:max-w-none lg:-mr-[37px]',
        }}
      />

      {/* The 4.0 use-cases frames (1:585 / 1:1062) paint one flat plate behind
          the whole page and draw no separate band behind the list. */}
      <Container className="pt-12 md:pt-4 pb-24 px-6 lg:px-4">
        <div className="flex w-full flex-col gap-12">
          <div>
            {/* Rows are pitched 481px apart on a 422px card in the frames
                (1:592 -> 1:594 -> 1:593), i.e. a ~59px gutter, not 32. */}
            <ul className="flex w-full flex-col gap-14">
              {pagedStories.map((successStory, index) => (
                <li key={successStory.link}>
                  <SuccessStoryItem
                    successStory={successStory}
                    index={(currentPage - 1) * PAGE_SIZE + index}
                    linkText={content.content.storyLinkText}
                    linkContext={content.content.storyLinkContext}
                  />
                </li>
              ))}
            </ul>

            {totalPages > 1 ? (
              <Pagination className="mt-12">
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      href="#"
                      aria-label={content.content.pagination.previous}
                      aria-disabled={currentPage === 1}
                      onClick={(event) => {
                        event.preventDefault()
                        setCurrentPage((current) => Math.max(1, current - 1))
                      }}
                    />
                  </Pagination.Item>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNumber) => (
                      <Pagination.Item key={pageNumber}>
                        <Pagination.Link
                          href="#"
                          isActive={pageNumber === currentPage}
                          onClick={(event) => {
                            event.preventDefault()
                            setCurrentPage(pageNumber)
                          }}
                        >
                          {pageNumber}
                        </Pagination.Link>
                      </Pagination.Item>
                    )
                  )}

                  <Pagination.Item>
                    <Pagination.Next
                      href="#"
                      aria-label={content.content.pagination.next}
                      aria-disabled={currentPage === totalPages}
                      onClick={(event) => {
                        event.preventDefault()
                        setCurrentPage((current) =>
                          Math.min(totalPages, current + 1)
                        )
                      }}
                    />
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            ) : null}
          </div>
        </div>
      </Container>
    </>
  )
}

export default SuccessStoriesPage

export const getStaticProps: GetStaticProps<SuccessStoriesPageProps> =
  async function () {
    const successStoriesPath = path.join(
      process.cwd(),
      'content',
      'success-stories'
    )
    const dirents = await fsPromises.readdir(successStoriesPath, {
      withFileTypes: true,
    })

    const successStories: SuccessStoryItemType[] = (
      await Promise.all(
        dirents.map(async (dirent) => {
          if (dirent.isFile() && mdRegex.test(dirent.name)) {
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

            return {
              link: `/success-stories/${dirent.name.replace(mdRegex, '')}`,
              frontmatter: {
                ...mdxSource.frontmatter,
              },
            }
          }

          return null as any
        })
      )
    ).filter(Boolean)

    const contentPath = path.join(
      process.cwd(),
      'content',
      'success-stories-page.yaml'
    )
    const content = (await fsPromises.readFile(contentPath)).toString()
    const parsedContent = YamlParse(content)

    return {
      props: {
        content: parsedContent,
        successStories,
        $$app: {
          navigation: await createNavigation(),
          footerData: await loadFooterData(),
        },
      },
    }
  }
