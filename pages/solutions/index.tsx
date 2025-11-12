import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { PageHeader } from '../../components/PageHeader'
import { SolutionItem } from '../../components/Solutions/SolutionItem'
import { SEO } from '../../components/SEO'
import { Container } from '../../components/common'
import { generateFAQSchema, type FAQItem } from '../../lib/seo/schema'

import { mdRegex } from '../../lib/markdown'
import { parseMDX } from '../../lib/mdx'
import { createNavigation } from '../../lib/navigation'
import { loadFooterData } from '../../lib/footer'

import type { NextPage, GetStaticProps } from 'next'
import type { SolutionItem as SolutionItemType } from '../../contexts'

type SolutionsPageProps = {
  content: Record<string, any>
  solutions: Array<SolutionItemType>
}

const SolutionsPage: NextPage<SolutionsPageProps> = ({
  content,
  solutions,
}) => {
  const { page, faqs } = content

  // Generate FAQ schema if FAQs are available
  const faqSchema =
    faqs && faqs.length >= 2 ? generateFAQSchema(faqs as FAQItem[]) : undefined

  return (
    <>
      <SEO
        title={page.title}
        description={page.description}
        structuredData={faqSchema}
      />

      <PageHeader
        title={page.title}
        description={page.description}
        breadcrumbs={[
          {
            title: page.title,
            link: '/solutions',
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-solutions.webp',
          title: 'Solutions page background',
          alt: 'Solutions page background',
          width: 550,
          height: 250,
        }}
      />

      <Container className="mt-12 mb-24 px-8 lg:px-4">
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-full">
          {solutions.map((solution, index) => (
            <li key={solution.frontmatter.title} className="rounded-[32px]">
              <SolutionItem solution={solution} index={index} />
            </li>
          ))}
        </ul>
      </Container>
    </>
  )
}

export default SolutionsPage

export const getStaticProps: GetStaticProps<SolutionsPageProps> =
  async function () {
    // TODO: remove when we will have at least solution
    return {
      notFound: true,
    }

    const solutionsPath = path.join(process.cwd(), 'content', 'solutions')
    const dirents = await fsPromises.readdir(solutionsPath, {
      withFileTypes: true,
    })

    const solutions: SolutionItemType[] = (
      await Promise.all(
        dirents.map(async (dirent) => {
          if (dirent.isFile() && mdRegex.test(dirent.name)) {
            const mdPath = path.join(
              process.cwd(),
              'content',
              'solutions',
              dirent.name
            )
            const mdContent = (await fsPromises.readFile(mdPath)).toString()
            const mdxSource = await parseMDX(mdContent)

            return {
              link: `/solutions/${dirent.name.replace(mdRegex, '')}`,
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
      'solutions-page.yaml'
    )
    const content = (await fsPromises.readFile(contentPath)).toString()
    const parsedContent = YamlParse(content)

    return {
      props: {
        content: parsedContent,
        solutions,
        $$app: {
          navigation: await createNavigation(),
          footerData: await loadFooterData(),
        },
      },
    }
  }
