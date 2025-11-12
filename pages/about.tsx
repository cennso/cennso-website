import { useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { PageHeader } from '../components/PageHeader'
import {
  Button,
  Container,
  FeatureCard,
  GradientHeader,
  HexagonDouble,
} from '../components/common'
import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'
import { loadFooterData } from '../lib/footer'
import { useDeviceKind } from '../lib/useDeviceKind'

import type { NextPage, GetStaticProps } from 'next'

type AboutPageProps = {
  content: Record<string, any>
  members: any[]
}

const AboutPage: NextPage<AboutPageProps> = ({ content, members }) => {
  const { device } = useDeviceKind()
  const { page, mission, team, recruitment } = content

  const missionEven = useCallback(
    (index: number) => {
      return device === 'mobile' ? index % 2 === 0 : index === 1 || index === 2
    },
    [device]
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
            link: '/about',
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-about.webp',
          title: 'About page background',
          alt: 'About page background',
          width: 500,
          height: 250,
        }}
      />

      <Container className="pt-12 md:pt-24 bg-secondary-400">
        <div className="flex flex-col w-full gap-12">
          <div>
            <header className="flex flex-row justify-center">
              <GradientHeader
                as="h2"
                className="text-4xl font-bold text-center"
              >
                {mission.title}
              </GradientHeader>
            </header>
            <p className="text-center md:px-16 xl:px-40 mt-2 text-white">
              {mission.description}
            </p>
          </div>

          <ul className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-full">
            {mission.sections.map((section: any, index: number) => (
              <FeatureCard
                key={section.title}
                className={`flex flex-col items-center rounded-[32px] px-8 lg:px-20 py-8 ${
                  missionEven(index) ? 'bg-secondary-600' : ''
                } transition-color ease-in-out duration-300`}
                useGlow={missionEven(index)}
                useHexagon={missionEven(index)}
              >
                <HexagonDouble
                  gradient={true}
                  className="p-12 w-52 h-52"
                  subClassName={
                    missionEven(index)
                      ? 'bg-secondary-600'
                      : 'bg-secondary-600 lg:bg-secondary-400'
                  }
                >
                  <Image
                    title={`${section.title} icon`}
                    alt={`${section.title} icon`}
                    src={section.cover}
                    width={150}
                    height={150}
                    sizes="150px"
                  />
                </HexagonDouble>
                <header className="flex flex-row justify-center mt-8 text-center">
                  <h3 className="font-bold text-2xl text-secondary-200 px-0 lg:px-8">
                    {section.title}
                  </h3>
                </header>
                <p className="mt-4 text-center text-white px-0 lg:px-8">
                  {section.description}
                </p>
              </FeatureCard>
            ))}
          </ul>
        </div>
      </Container>

      <Container className="my-28 bg-secondary-400">
        <div className="flex flex-col w-full gap-6">
          <div>
            <header className="flex flex-row justify-center">
              <GradientHeader
                as="h2"
                className="text-4xl font-bold text-center"
              >
                {team.title}
              </GradientHeader>
            </header>
            <p className="text-center mt-2 text-white">{team.description}</p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full h-full">
            {members.map((member: any) => (
              <li
                key={member.name}
                className="flex flex-col items-center rounded-[32px]"
              >
                <div className="bg-transparent flex flex-row items-center justify-center p-2 filter drop-shadow-[0px_15px_20px_rgba(68,141,200,0.35)]">
                  <div className="bg-white mask mask-hexagon-2 p-2">
                    <Image
                      width={270}
                      height={270}
                      src={member.avatar}
                      className="overflow-hidden mask mask-hexagon-2"
                      title={`${member.name}, ${member.position}`}
                      alt={`${member.name}, ${member.position}`}
                      sizes="270px"
                    />
                  </div>
                </div>
                <header className="flex flex-row justify-center">
                  <h3 className="font-bold text-xl text-secondary-200 text-center">
                    {member.name}
                  </h3>
                </header>
                <p className="text-center text-white">{member.position}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <Container className="pb-24 bg-secondary-400">
        <FeatureCard
          className="w-full rounded-[32px] bg-secondary-600"
          useGlow={true}
          useHexagon={true}
        >
          <div className="py-8 px-16 rounded-[32px] flex flex-col gap-2">
            <header className="flex flex-row justify-center">
              <GradientHeader
                as="h2"
                className="text-4xl font-bold text-center"
              >
                {recruitment.title}
              </GradientHeader>
            </header>
            <p className="text-center lg:px-16 xl:px-32 mt-2 mb-4 text-white">
              {recruitment.description}
            </p>
            <div className="mx-auto">
              <Link href={recruitment.link}>
                <Button variant="action" useArrow={true}>
                  {recruitment.linkContent}
                </Button>
              </Link>
            </div>
          </div>
        </FeatureCard>
      </Container>
    </>
  )
}

export default AboutPage

export const getStaticProps: GetStaticProps<AboutPageProps> =
  async function () {
    // TODO: remove when we will have content for about page
    return {
      notFound: true,
    }

    const contentPath = path.join(process.cwd(), 'content', 'about-page.yaml')
    const content = (await fsPromises.readFile(contentPath)).toString()
    const parsedContent = YamlParse(content)

    const authorsPath = path.join(process.cwd(), 'content', 'authors.yaml')
    const authorsContent = (await fsPromises.readFile(authorsPath)).toString()
    const parsedAuthors = YamlParse(authorsContent).authors
    const members = parsedContent.team.members
      .map((member: string) => parsedAuthors[member])
      .filter(Boolean)

    return {
      props: {
        content: parsedContent,
        members,
        $$app: {
          navigation: await createNavigation(),
          footerData: await loadFooterData(),
        },
      },
    }
  }
