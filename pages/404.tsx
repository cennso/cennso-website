import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeft } from 'lucide-react'
import { Button, Empty } from '@cennso/ui'

import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'
import { loadFooterData } from '../lib/footer'

import type { NextPage, GetStaticProps } from 'next'

type Custom404PageProps = {
  content: Record<string, any>
}

/**
 * Laid out as cennso/cloud's cloud-portal 404 (`components/common/NotFound`):
 * `Empty` on the page's own surface, the sentence, and the two ways out under
 * it, the first with an arrow pointing back. Where the portal puts a mark over
 * the sentence, this page puts the "404 Page Not Found" heading instead.
 *
 * "To the main page" carries `nativeButton={false}` because it renders a
 * `<Link>`, which is an `<a>`; Base UI checks that claim against what it
 * rendered and logs an error when the two disagree.
 */
const Custom404Page: NextPage<Custom404PageProps> = ({ content }) => {
  const router = useRouter()
  const { page, heading, message, buttons } = content

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <Empty className="w-full flex-1 justify-center py-24">
        <Empty.Header className="max-w-2xl">
          <Empty.Title
            render={<h1 />}
            className="mb-2 text-4xl font-bold text-primary md:text-5xl"
          >
            {heading}
          </Empty.Title>
          <Empty.Description className="text-primary dark:text-muted-foreground">
            {message}
          </Empty.Description>
        </Empty.Header>
        <Empty.Content className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <Button variant="outlinePrimary" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {buttons.previous}
          </Button>
          <Button
            variant="primary"
            nativeButton={false}
            render={<Link href="/" />}
          >
            {buttons.main}
          </Button>
        </Empty.Content>
      </Empty>
    </>
  )
}

export default Custom404Page

export const getStaticProps: GetStaticProps = async function () {
  const contentPath = path.join(process.cwd(), 'content', '404-page.yaml')
  const content = (await fsPromises.readFile(contentPath)).toString()
  const parsedContent = YamlParse(content)

  return {
    props: {
      content: parsedContent,
      $$app: {
        navigation: await createNavigation(),
        footerData: await loadFooterData(),
      },
    },
  }
}
