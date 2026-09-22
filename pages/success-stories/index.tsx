import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/router'

import { Field, Pagination, Select } from '@cennso/ui'

import { PageHeader } from '../../components/PageHeader'
import { SuccessStoryItem } from '../../components/SuccessStories/SuccessStoryItem'
import { SEO } from '../../components/SEO'
import { Container } from '../../components/common'

import { mdRegex } from '../../lib/markdown'
import { kebabCase } from '../../lib/casing'
import { getQueryParam } from '../../lib/getQueryParam'
import { parseMDX } from '../../lib/mdx'
import { createNavigation } from '../../lib/navigation'
import { loadFooterData } from '../../lib/footer'

import type { NextPage, GetStaticProps } from 'next'
import type { SuccessStoryItem as SuccessStoryItemType } from '../../contexts'

// `@cennso/ui`'s `Select` types `items` as
// `Record<string, ReactNode> | readonly { label: ReactNode; value: any }[] | readonly Group<any>[]`
// (verified against node_modules/@cennso/ui/dist/index.d.ts and
// node_modules/@base-ui/react/select/root/SelectRoot.d.ts). `value` is the
// identifier Select compares and reports back through `onValueChange`;
// `label` is what's rendered. The old `SelectOption` had this inverted
// (`id` was the identifier, `value` was the display text), so both
// `getStaticProps`'s array construction and this page's lookups swap
// accordingly.
type IndustryOption = {
  label: string
  value: string
}

type SuccessStoriesPageProps = {
  content: Record<string, any>
  successStories: Array<SuccessStoryItemType>
  industries: Array<IndustryOption>
}

// Matches the design's 4-rows-per-page layout (frames 1:1062 / 1:585).
const PAGE_SIZE = 4

const SuccessStoriesPage: NextPage<SuccessStoriesPageProps> = ({
  content,
  successStories,
  industries,
}) => {
  const { page } = content

  const router = useRouter()
  const [filteredStories, setFilteredStories] = useState<
    Array<SuccessStoryItemType>
  >(() => {
    const industry = getQueryParam(router.asPath, 'industry')
    if (!industry) {
      return successStories
    }

    const industryLabel = industries.find((i) => i.value === industry)?.label
    return successStories.filter(
      (s) => s.frontmatter.company?.industry === industryLabel
    )
  })
  const [currentPage, setCurrentPage] = useState(1)

  const filterStories = useCallback(
    (option: IndustryOption) => {
      setCurrentPage(1)

      if (option.value === '') {
        setFilteredStories(successStories)
        delete router.query.industry
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
          query: { ...router.query, industry: option.value },
        },
        undefined,
        { shallow: false }
      )
      setFilteredStories(
        successStories.filter(
          (s) => s.frontmatter.company?.industry === option.label
        )
      )
    },
    //
    [setFilteredStories, successStories, router]
  )

  const totalPages = Math.ceil(filteredStories.length / PAGE_SIZE)
  const pagedStories = useMemo(
    () =>
      filteredStories.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
      ),
    [filteredStories, currentPage]
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
          width: 339,
          height: 263,
        }}
      />

      <Container className="pt-12 pb-24 px-8 lg:px-4 bg-secondary">
        <div className="flex flex-col gap-12">
          <div>
            <div className="mb-4 w-72">
              <Field>
                <Field.Label className="sr-only">
                  {content.content.industrySelectLabel}
                </Field.Label>
                <Select
                  items={industries}
                  value={getQueryParam(router.asPath, 'industry') ?? ''}
                  onValueChange={(value) => {
                    const option = industries.find((i) => i.value === value)
                    if (option) {
                      filterStories(option)
                    }
                  }}
                >
                  {/* No explicit `id` here: Base UI's Field/Select association is
                  registered client-side (see `useLabelableId` in
                  `@base-ui/react/internals/labelable-provider`), and an
                  explicit `id` prop is used verbatim on first render while the
                  Field.Label's `for`/aria-labelledby still point at the
                  Field's own generated id — the pair is unassociated in
                  server-rendered HTML until hydration reconciles them.
                  Leaving `id` unset lets Select.Trigger and Field.Label read
                  the same generated id from the shared context on the very
                  first render, so the label is correctly associated even in
                  the pre-hydration markup. Verified in the built HTML: with an
                  explicit id, the trigger's `id` and the label's `for`
                  diverged; without it, they match. */}
                  <Select.Trigger
                    placeholder={content.content.industrySelectPlaceholder}
                  />
                  <Select.Content>
                    {industries.map((industry) => (
                      <Select.Item key={industry.value} value={industry.value}>
                        {industry.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Field>
            </div>

            <ul className="flex w-full flex-col gap-8">
              {pagedStories.map((successStory, index) => (
                <li key={successStory.link}>
                  <SuccessStoryItem
                    successStory={successStory}
                    index={(currentPage - 1) * PAGE_SIZE + index}
                    linkText={content.content.storyLinkText}
                    linkAccessibleName={content.content.storyLinkAccessibleName}
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

    let industries: Array<IndustryOption> = [
      {
        label: 'All Industries',
        value: '',
      },
    ]
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

            const industry = (
              mdxSource.frontmatter as unknown as SuccessStoryItemType['frontmatter']
            ).company?.industry
            if (industry && !industries.some((i) => i.label === industry)) {
              industries.push({
                label: industry,
                value: kebabCase(industry),
              })
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

    // sorting industries
    industries = industries.sort((a, b) => {
      if (a.value < b.value) {
        return -1
      }
      if (a.value > b.value) {
        return 1
      }
      return 0
    })

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
        industries,
        $$app: {
          navigation: await createNavigation(),
          footerData: await loadFooterData(),
        },
      },
    }
  }
