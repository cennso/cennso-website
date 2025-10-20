import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'
import { Typography } from '@material-tailwind/react'

import { PageHeader } from '../../components/PageHeader'
import { JobItem } from '../../components/Jobs/JobItem'
import { SEO } from '../../components/SEO'
import { Container } from '../../components/common'

import { mdRegex } from '../../lib/markdown'
import { parseMDX } from '../../lib/mdx'
import { createNavigation } from '../../lib/navigation'

import type { NextPage, GetStaticProps } from 'next'
import type { JobItem as JobItemType } from '../../contexts'

type JobsPageProps = {
  content: Record<string, any>
  jobs: Array<JobItemType>
}

const JobsPage: NextPage<JobsPageProps> = ({ content, jobs }) => {
  const { page, content: mainContent } = content

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <PageHeader
        title={page.title}
        description={page.description}
        breadcrumbs={[
          {
            title: page.title,
            link: '/jobs',
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-success-story.jpeg',
          title: 'Jobs page background',
          alt: 'Jobs page background',
          width: 550,
          height: 250,
        }}
      />

      <Container className="pt-12 pb-24 px-8 lg:px-4 bg-secondary-400">
        <div className="flex flex-col gap-12 text-white">
          <p>{mainContent.description}</p>

          {jobs.length === 0 ? (
            <div className="flex flex-row items-center justify-center text-center pt-4">
              <Typography
                variant="h4"
                className="text-center text-white"
                placeholder={undefined}
                onPointerEnterCapture={undefined}
                onPointerLeaveCapture={undefined}
              >
                {mainContent.zeroJobs}
              </Typography>
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full h-full">
              {jobs.map((job) => (
                <li key={job.frontmatter.position} className="rounded-[32px]">
                  <JobItem job={job} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </>
  )
}

export default JobsPage

export const getStaticProps: GetStaticProps<JobsPageProps> = async function () {
  // TODO: remove when we will have at least one job
  return {
    notFound: true,
  }

  const jobsPath = path.join(process.cwd(), 'content', 'jobs')
  const dirents = await fsPromises.readdir(jobsPath, {
    withFileTypes: true,
  })

  const jobs: JobItemType[] = (
    await Promise.all(
      dirents.map(async (dirent) => {
        if (dirent.isFile() && mdRegex.test(dirent.name)) {
          const mdPath = path.join(
            process.cwd(),
            'content',
            'jobs',
            dirent.name
          )
          const mdContent = (await fsPromises.readFile(mdPath)).toString()

          const mdxSource = await parseMDX(mdContent)
          if (mdxSource.frontmatter.show === false) {
            return null as any
          }

          return {
            link: `/jobs/${dirent.name.replace(mdRegex, '')}`,
            frontmatter: {
              ...mdxSource.frontmatter,
            },
          }
        }

        return null as any
      })
    )
  ).filter(Boolean)

  const contentPath = path.join(process.cwd(), 'content', 'jobs-page.yaml')
  const content = (await fsPromises.readFile(contentPath)).toString()
  const parsedContent = YamlParse(content)

  return {
    props: {
      content: parsedContent,
      jobs,
      $$app: {
        navigation: await createNavigation(),
      },
    },
  }
}
