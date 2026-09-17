import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'

import { Field, Select } from '@cennso/ui'

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

  const filterStories = useCallback(
    (option: IndustryOption) => {
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

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <PageHeader
        title={page.title}
        description={page.description}
        breadcrumbs={[
          {
            title: page.title,
            link: '/success-stories',
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-success-stories.webp',
          title: 'Success stories page background',
          alt: 'Success stories page background',
          width: 900,
          height: 250,
        }}
      />

      <Container className="pt-12 pb-24 px-8 lg:px-4 bg-secondary-400">
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

            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-full">
              {filteredStories.map((successStory, index) => (
                <li
                  key={successStory.frontmatter.title}
                  className="rounded-[32px]"
                >
                  <SuccessStoryItem successStory={successStory} index={index} />
                </li>
              ))}
            </ul>
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
