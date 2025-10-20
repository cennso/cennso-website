import { promises as fsPromises } from 'fs'
import path from 'path'
import imageSize from 'image-size'
import { parse as YamlParse } from 'yaml'

import Image from 'next/image'
import Link from 'next/link'

import { PageHeader } from '../components/PageHeader'
import { Button, Container, FeatureCard } from '../components/common'
import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'

import type { NextPage, GetStaticProps } from 'next'
import type { Partner } from '../contexts'

type PartnersPageProps = {
  content: Record<string, any>
  partners: Partner[]
}

const PartnersPage: NextPage<PartnersPageProps> = ({ content, partners }) => {
  const { page } = content

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <PageHeader
        title={page.title}
        description={page.description}
        breadcrumbs={[
          {
            title: page.title,
            link: '/partners',
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-success-stories.jpg',
          title: 'Partners page background',
          alt: 'Partners page background',
          width: 900,
          height: 250,
        }}
      />

      <Container className="mt-12 mb-24">
        <ul className="flex flex-col h-full w-full gap-16">
          {partners.map((partner, index) => {
            const isEven = index % 2 === 0

            if (isEven) {
              return (
                <li
                  key={partner.name}
                  className="flex flex-col lg:flex-row items-center justify-evenly gap-6 lg:gap-16 w-full"
                >
                  <div className="w-[275px] sm:w-[400px] flex justify-center order-none lg:order-last">
                    <Image
                      className="pointer-events-none max-w-[200px]"
                      width={partner.logoSize!.width}
                      height={partner.logoSize!.height}
                      title={`${partner.name} logo`}
                      alt={`${partner.name} logo`}
                      src={partner.logo}
                    />
                  </div>
                  <div className="flex flex-col gap-4 lg:w-1/2 px-0 md:px-12 lg:px-0">
                    <h2 className="text-secondary-200 text-center lg:text-right font-bold text-2xl lg:text-3xl">
                      {partner.name}
                    </h2>
                    <p className="text-sm lg:text-base text-center lg:text-right px-4 lg:px-0 text-white">
                      {partner.content}
                    </p>
                    {partner.link ? (
                      <div className="mt-2 mx-auto lg:mx-0 flex lg:justify-end">
                        <Link href={partner.link}>
                          <Button variant="secondary" useArrow={true}>
                            More info
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </li>
              )
            }

            return (
              <li key={partner.name}>
                <FeatureCard
                  className="relative flex flex-col lg:flex-row items-center justify-evenly gap-6 lg:gap-16 w-full rounded-[32px] bg-secondary-600 overflow-hidden pt-12 lg:py-6 px-6 md:px-0"
                  useGlow={true}
                  useHexagon={true}
                >
                  <div className="w-[275px] flex justify-center z-50">
                    <Image
                      className="pointer-events-none max-w-[200px]"
                      width={partner.logoSize!.width}
                      height={partner.logoSize!.height}
                      title={`${partner.name} logo`}
                      alt={`${partner.name} logo`}
                      src={partner.logo}
                    />
                  </div>
                  <div className="flex flex-col gap-4 lg:w-1/2 px-0 md:px-12 lg:px-0 pb-16 lg:pb-0">
                    <h2 className="text-secondary-200 text-center lg:text-left font-bold text-2xl lg:text-3xl">
                      {partner.name}
                    </h2>
                    <p className="text-sm lg:text-base text-center lg:text-left px-4 lg:px-0 text-white">
                      {partner.content}
                    </p>
                    {partner.link ? (
                      <div className="mt-2 mx-auto lg:mx-0">
                        <Link href={partner.link}>
                          <Button variant="tertiary" useArrow={true}>
                            More info
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </FeatureCard>
              </li>
            )
          })}
        </ul>
      </Container>
    </>
  )
}

export default PartnersPage

export const getStaticProps: GetStaticProps<PartnersPageProps> =
  async function () {
    // TODO: remove when we will have at least one description for partner

    const contentPath = path.join(process.cwd(), 'content', 'partners.yaml')
    const content = (await fsPromises.readFile(contentPath)).toString()
    const { partners: partnersContent, ...rest } = YamlParse(content)
    const partners: Partner[] = partnersContent.map((partner: Partner) => ({
      ...partner,
      logoSize: imageSize(path.join(process.cwd(), 'public', partner.logo)),
    }))

    return {
      props: {
        content: rest,
        partners,
        $$app: {
          navigation: await createNavigation(),
        },
      },
    }
  }
