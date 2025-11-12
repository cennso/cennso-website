import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/router'

import { PageHeader } from '../../components/PageHeader'
import { SuccessStoryItem } from '../../components/SuccessStories/SuccessStoryItem'
import { SEO } from '../../components/SEO'
import { Container, Select } from '../../components/common'

import { mdRegex } from '../../lib/markdown'
import { kebabCase } from '../../lib/casing'
import { getQueryParam } from '../../lib/getQueryParam'
import { parseMDX } from '../../lib/mdx'
import { createNavigation } from '../../lib/navigation'
import { loadFooterData } from '../../lib/footer'

import type { NextPage, GetStaticProps } from 'next'
import type { SuccessStoryItem as SuccessStoryItemType } from '../../contexts'
import type { SelectProps, SelectOption } from '../../components/common'

type SuccessStoriesPageProps = {
  content: Record<string, any>
  successStories: Array<SuccessStoryItemType>
  industries: SelectProps['options']
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

    const industryValue = industries.find((i) => i.id === industry)?.value
    return successStories.filter(
      (s) => s.frontmatter.company?.industry === industryValue
    )
  })

  const filterStories = useCallback(
    (value: SelectOption) => {
      if (value.id === '') {
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
          query: { ...router.query, industry: value.id },
        },
        undefined,
        { shallow: false }
      )
      setFilteredStories(
        successStories.filter(
          (s) => s.frontmatter.company?.industry === value.value
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
            <div className="mb-4">
              <label
                htmlFor="select-industry"
                id="select-industry-label"
                className="sr-only"
              >
                {content.industrySelectLabel}
              </label>
              <Select
                id="select-industry"
                ariaLabelledBy="select-industry-label"
                placeholder="All Industries"
                selected={getQueryParam(router.asPath, 'industry')}
                options={industries}
                onChange={filterStories}
              />
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

    let industries: SelectProps['options'] = [
      {
        value: 'All Industries',
        id: '',
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
            if (industry && !industries.some((i) => i.value === industry)) {
              industries.push({
                value: industry,
                id: kebabCase(industry),
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
      if (a.id < b.id) {
        return -1
      }
      if (a.id > b.id) {
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
