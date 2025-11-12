import { promises as fsPromises } from 'fs'
import path from 'path'

import { PageHeader } from '../../components/PageHeader'
import { Markdown } from '../../components/Markdown/Markdown'
import { SEO } from '../../components/SEO'
import { Container } from '../../components/common'
import { SolutionContext } from '../../contexts'

import { parseMDX } from '../../lib/mdx'
import { mdRegex } from '../../lib/markdown'
import { createNavigation } from '../../lib/navigation'
import { loadFooterData } from '../../lib/footer'

import type { NextPage, GetStaticProps, GetStaticPathsResult } from 'next'
import type { MDXRemoteProps } from 'next-mdx-remote'
import type { SolutionMetadata } from '../../contexts'

type SolutionPageProps = {
  frontmatter: SolutionMetadata
  mdxSource: MDXRemoteProps
  solutionQuery: string
}

const SolutionPage: NextPage<SolutionPageProps> = ({
  solutionQuery,
  ...props
}) => {
  const { frontmatter, mdxSource } = props
  const { title, description } = frontmatter

  return (
    <>
      <SEO title={title} description={description} />

      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[
          {
            title: 'Solutions',
            link: '/solutions',
          },
          {
            title,
            link: `/solutions/${solutionQuery}`,
          },
        ]}
      />

      <Container className="mt-12 mb-24">
        <SolutionContext.Provider value={props}>
          <div className="flex flex-row h-full w-full">
            <article className="flex-1 max-w-full w-full">
              <div className="flex flex-col gap-12">
                <Markdown mdxSource={mdxSource} />
              </div>
            </article>
          </div>
        </SolutionContext.Provider>
      </Container>
    </>
  )
}

export default SolutionPage

export const getStaticProps: GetStaticProps<SolutionPageProps> =
  async function (context) {
    // TODO: remove when we will have at least one solution
    return {
      notFound: true,
    }

    const solution = context.params?.['solution'] as string

    const solutionsPath = path.join(process.cwd(), 'content', 'solutions')
    const dirents = await fsPromises.readdir(solutionsPath, {
      withFileTypes: true,
    })
    const mdFile = dirents.find(
      (dirent) =>
        dirent.isFile() && dirent.name.replace(mdRegex, '') === solution
    )?.name as string
    const mdPath = path.join(process.cwd(), 'content', 'solutions', mdFile)
    const mdContent = (await fsPromises.readFile(mdPath)).toString()

    const mdxSource = await parseMDX(mdContent)
    const frontmatter = mdxSource.frontmatter as unknown as SolutionMetadata

    return {
      props: {
        frontmatter,
        mdxSource,
        solutionQuery: solution,
        $$app: {
          navigation: await createNavigation(),
          footerData: await loadFooterData(),
        },
      },
    }
  }

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const solutionsPath = path.join(process.cwd(), 'content', 'solutions')
  const dirents = await fsPromises.readdir(solutionsPath, {
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
          solution: dirent.name.replace(mdRegex, ''),
        },
      })
    }
  })

  return {
    paths,
    fallback: false,
  }
}
