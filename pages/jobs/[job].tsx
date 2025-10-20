import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { BriefcaseIcon, MapPinIcon } from '@heroicons/react/24/solid'

import { PageHeader } from '../../components/PageHeader'
import { Markdown } from '../../components/Markdown/Markdown'
import { JobForm } from '../../components/Jobs/JobForm'
import { SEO } from '../../components/SEO'
import { Container, GradientHeader } from '../../components/common'
import { JobContext } from '../../contexts'

import { parseMDX } from '../../lib/mdx'
import { mdRegex } from '../../lib/markdown'
import { createNavigation } from '../../lib/navigation'

import type { NextPage, GetStaticProps, GetStaticPathsResult } from 'next'
import type { MDXRemoteProps } from 'next-mdx-remote'
import type { JobMetadata } from '../../contexts'

type JobPageProps = {
  frontmatter: JobMetadata
  mdxSource: MDXRemoteProps
  jobQuery: string
  content: Record<string, any>
}

const ProductPage: NextPage<JobPageProps> = ({
  jobQuery,
  content,
  ...props
}) => {
  const { frontmatter, mdxSource } = props
  const { position, kind, mode } = frontmatter

  return (
    <>
      <SEO title={position} />

      <PageHeader
        title={position}
        breadcrumbs={[
          {
            title: 'Jobs',
            link: '/jobs',
          },
          {
            title: position,
            link: `/jobs/${jobQuery}`,
          },
        ]}
      >
        <ul className="flex-1 flex flex-col md:flex-row md:gap-8 text-white">
          <li className="flex flex-row gap-2">
            <BriefcaseIcon className="w-5 h-5" />
            <span>{kind}</span>
          </li>
          <li className="flex flex-row gap-2">
            <MapPinIcon className="w-5 h-5" />
            <span>{mode}</span>
          </li>
        </ul>
      </PageHeader>

      <Container className="mt-12 mb-24">
        <JobContext.Provider value={props}>
          <div className="flex flex-col h-full w-full">
            <article className="flex-1 max-w-full w-full">
              <div className="flex flex-col">
                <Markdown mdxSource={mdxSource} />
              </div>
            </article>

            <div className="w-full mt-16">
              <header className="flex flex-row justify-center">
                <GradientHeader
                  as="h2"
                  className="text-3xl font-bold text-center mb-4"
                >
                  Job submission
                </GradientHeader>
              </header>
              <JobForm position={position} content={content} />
            </div>
          </div>
        </JobContext.Provider>
      </Container>
    </>
  )
}

export default ProductPage

export const getStaticProps: GetStaticProps<JobPageProps> = async function (
  context
) {
  // TODO: remove when we will have at least one job
  return {
    notFound: true,
  }

  const job = context.params?.['job'] as string

  // Load jobs page content
  const jobsPagePath = path.join(process.cwd(), 'content', 'jobs-page.yaml')
  const jobsPageContent = (await fsPromises.readFile(jobsPagePath)).toString()
  const content = YamlParse(jobsPageContent) as Record<string, any>

  const jobsDirectory = path.join(process.cwd(), 'content', 'jobs')
  const dirents = await fsPromises.readdir(jobsDirectory, {
    withFileTypes: true,
  })
  const mdFile = dirents.find(
    (dirent) => dirent.isFile() && dirent.name.replace(mdRegex, '') === job
  )?.name as string
  const mdPath = path.join(process.cwd(), 'content', 'jobs', mdFile)
  const mdContent = (await fsPromises.readFile(mdPath)).toString()

  const mdxSource = await parseMDX(mdContent)
  const frontmatter = mdxSource.frontmatter as unknown as JobMetadata

  return {
    props: {
      frontmatter,
      mdxSource,
      jobQuery: job,
      content,
      $$app: {
        navigation: await createNavigation(),
      },
    },
  }
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const jobsPath = path.join(process.cwd(), 'content', 'jobs')
  const dirents = await fsPromises.readdir(jobsPath, {
    withFileTypes: true,
  })

  const paths: GetStaticPathsResult['paths'] = []
  dirents.forEach((dirent) => {
    if (!dirent.isFile()) {
      return
    }

    if (mdRegex.test(dirent.name)) {
      paths.push({
        params: {
          job: dirent.name.replace(mdRegex, ''),
        },
      })
    }
  })

  return {
    paths,
    fallback: false,
  }
}
