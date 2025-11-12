import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { ArrowLeftIcon } from '@heroicons/react/24/solid'

import { Button } from '../components/common'
import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'
import { loadFooterData } from '../lib/footer'

import type { NextPage, GetStaticProps } from 'next'

type Custom404PageProps = {
  content: Record<string, any>
}

const Custom404Page: NextPage<Custom404PageProps> = ({ content }) => {
  const router = useRouter()
  const { page, buttons } = content

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <div className="flex-1 w-full flex flex-col items-center justify-center text-secondary-200">
        <h1 className="text-[2rem] sm:text-[3rem] lg:text-[4rem] text-center">
          {page.title}
        </h1>

        <div className="mx-2 sm:mx-0 mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link href="" onClick={() => router.back()}>
            <Button
              variant="tertiary"
              className="flex flex-row items-center gap-2"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              {buttons.previous}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">{buttons.main}</Button>
          </Link>
        </div>
      </div>
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
