import { promises as fsPromises } from 'fs'
import path from 'path'

import { PageHeader } from '../components/PageHeader'
import { Markdown } from '../components/Markdown/Markdown'
import { Container } from '../components/common'
import { SEO } from '../components/SEO'

import { parseMDX } from '../lib/mdx'
import { createNavigation } from '../lib/navigation'

import type { NextPage, GetStaticProps } from 'next'
import type { MDXRemoteProps } from 'next-mdx-remote'

type ImprintPageProps = {
  mdxSource: MDXRemoteProps
}

const ImprintPage: NextPage<ImprintPageProps> = ({ mdxSource }) => {
  const { frontmatter } = mdxSource as Record<string, any>

  return (
    <>
      <SEO
        title={frontmatter.page.title}
        description={frontmatter.page.description}
        nofollow={true}
        noindex={true}
      />

      <PageHeader
        title={frontmatter.page.title}
        description={frontmatter.page.description}
        breadcrumbs={[
          {
            title: frontmatter.page.title,
            link: '/imprint',
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-contact-3.webp',
          title: 'Imprint page background',
          alt: 'Imprint page background',
          width: 180,
          height: 150,
          className: 'mr-64',
        }}
      />

      <Container className="mt-12 mb-24">
        <div className="flex flex-row h-full w-full">
          <article className="flex-1 max-w-full w-full">
            <div className="flex flex-col gap-12">
              <Markdown mdxSource={mdxSource} />
            </div>
          </article>
        </div>
      </Container>
    </>
  )
}

export default ImprintPage

export const getStaticProps: GetStaticProps<ImprintPageProps> =
  async function () {
    const contentPath = path.join(process.cwd(), 'content', 'imprint.md')
    const mdContent = (await fsPromises.readFile(contentPath)).toString()
    const mdxSource = await parseMDX(mdContent)

    return {
      props: {
        mdxSource,
        $$app: {
          navigation: await createNavigation(),
        },
      },
    }
  }
