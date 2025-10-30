import { promises as fsPromises } from 'fs'
import path from 'path'
import imageSize from 'image-size'
import { parse as YamlParse } from 'yaml'

import Image from 'next/image'
import Link from 'next/link'

import { Button, Container, GradientHeader } from '../components/common'
import { Partners } from '../components/LandingPage/Partners'
import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'

import type { NextPage, GetStaticProps } from 'next'
import type { Author, Testimonial, Partner } from '../contexts'

type LandingPageProps = {
  content: Record<string, any>
  testimonials: { title: string; items: Testimonial[] }
  partners: Partner[]
  partnersNumber: number
}

const LandingPage: NextPage<LandingPageProps> = ({ content, partners }) => {
  const { sections } = content
  const { main, overview, features, partners: partnersContent } = sections

  return (
    <>
      <SEO />

      <Container className="bg-[#36AADD]">
        <header className="flex flex-col md:flex-row items-center w-full relative py-12 lg:py-20">
          <div className="w-full md:w-1/2 flex flex-col z-10 pb-12 md:py-12 order-last lg:order-none">
            <h1 className="font-bold text-3xl lg:text-5xl text-white">
              {main.title}
            </h1>
            <p className="text-xl lg:text-3xl mt-6 text-white">
              {main.description}
            </p>
            <div className="mt-10 lg:mt-12 flex">
              <Link href={main.link} target="_blank">
                <Button
                  variant="action"
                  useArrow={true}
                  className="!text-2xl px-4 py-1.5 lg:!text-3xl lg:px-8 lg:py-3"
                  aria-label={main.linkContent}
                >
                  {main.linkContent}
                </Button>
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <Image
              className="w-[112.5%] max-w-[112.5%] -ml-8 sm-ml-16 pointer-events-none"
              width={1290}
              height={779}
              src="/assets/backgrounds/bg-paper-models.webp"
              title="Cennso main background"
              alt="Cennso main background"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </header>
      </Container>

      <Container className="bg-secondary-600">
        <div className="flex flex-col items-center lg:flex-row gap-4 lg:gap-20 w-full my-20">
          <Image
            className="w-[16rem] lg:w-[20rem] pointer-events-none"
            width={947}
            height={737}
            src="/assets/landing-page/cennso-icon.webp"
            title="Cennso logo inside hexagon"
            alt="Cennso logo inside hexagon"
            sizes="(max-width: 1024px) 256px, 320px"
          />
          <div className="flex flex-col gap-4 lg:gap-8">
            <header className="flex flex-row justify-center lg:justify-start">
              <GradientHeader
                variant="primary"
                as="h2"
                className="text-transparent text-center lg:text-left font-bold text-3xl lg:text-5xl inline-block"
              >
                {overview.title}
              </GradientHeader>
            </header>
            <p className="text-base lg:text-xl text-center lg:text-left px-4 lg:px-0 text-white">
              {overview.description}
            </p>
            <div className="flex">
              <Link href={overview.link} target="_blank">
                <Button variant="primary" useArrow={true}>
                  {overview.linkContent}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>

      <Container className="bg-secondary-400">
        <ul className="flex flex-col gap-16 px-0 my-16">
          <li className="flex flex-col lg:flex-row items-center justify-evenly gap-6 lg:gap-16 w-full">
            <div className="w-[275px] sm:w-[400px] flex justify-center order-none lg:order-last">
              <Image
                className="pointer-events-none"
                title={`${features[0].title} icon`}
                alt={`${features[0].title} icon`}
                src={features[0].cover}
                width={400}
                height={600}
                sizes="(max-width: 640px) 275px, 400px"
              />
            </div>
            <div className="flex flex-col gap-4 lg:w-1/2 px-0 md:px-12 lg:px-0">
              <h2 className="text-secondary-200 text-center lg:text-right font-bold text-2xl lg:text-3xl">
                {features[0].title}
              </h2>
              <p className="text-base lg:text-lg text-center lg:text-right px-4 lg:px-0 text-white">
                {features[0].description}
              </p>
              <div className="mt-2 mx-auto lg:mx-0 flex lg:justify-end">
                <Link href={features[0].link}>
                  <Button variant="secondary" useArrow={true}>
                    {features[0].linkContent}
                  </Button>
                </Link>
              </div>
            </div>
          </li>

          <li className="landing-page-feature-top-gradient landing-page-feature-corner-hex filter drop-shadow-[0px_15px_20px_rgba(68,141,200,0.35)] relative flex flex-col lg:flex-row items-center justify-evenly gap-6 lg:gap-16 w-full rounded-[32px] bg-secondary-600 overflow-hidden">
            <div className="w-[275px] flex justify-center">
              <Image
                className="pointer-events-none"
                title={`${features[1].title} icon`}
                alt={`${features[1].title} icon`}
                src={features[1].cover}
                width={275}
                height={230}
                sizes="275px"
              />
            </div>
            <div className="flex flex-col gap-4 lg:w-1/2 px-0 md:px-12 lg:px-0 pb-16 lg:pb-0">
              <h2 className="text-secondary-200 text-center lg:text-left font-bold text-2xl lg:text-3xl">
                {features[1].title}
              </h2>
              <p className="text-base lg:text-lg text-center lg:text-left px-4 lg:px-0 text-white">
                {features[1].description}
              </p>
              <div className="mt-2 mx-auto lg:mx-0">
                <Link href={features[1].link}>
                  <Button variant="tertiary" useArrow={true}>
                    {features[1].linkContent}
                  </Button>
                </Link>
              </div>
            </div>
          </li>

          <li className="flex flex-col lg:flex-row items-center justify-evenly gap-6 lg:gap-16 w-full">
            <div className="w-[225px] sm:w-[400px] flex justify-center order-none lg:order-last">
              <Image
                className="pointer-events-none"
                title={`${features[2].title} icon`}
                alt={`${features[2].title} icon`}
                src={features[2].cover}
                width={300}
                height={600}
                sizes="(max-width: 640px) 225px, 400px"
              />
            </div>
            <div className="flex flex-col gap-4 lg:w-1/2 px-0 md:px-12 lg:px-0">
              <h2 className="text-secondary-200 text-center lg:text-right font-bold text-2xl lg:text-3xl">
                {features[2].title}
              </h2>
              <p className="text-base lg:text-lg text-center lg:text-right px-4 lg:px-0 text-white">
                {features[2].description}
              </p>
              <div className="mt-2 mx-auto lg:mx-0 flex lg:justify-end">
                <Link href={features[2].link}>
                  <Button variant="secondary" useArrow={true}>
                    {features[2].linkContent}
                  </Button>
                </Link>
              </div>
            </div>
          </li>

          <li className="landing-page-feature-top-gradient landing-page-feature-sessions filter drop-shadow-[0px_15px_20px_rgba(68,141,200,0.35)] relative flex flex-col lg:flex-row items-center justify-evenly gap-6 lg:gap-16 w-full rounded-[32px] bg-secondary-600 overflow-hidden py-16">
            <div className="w-[275px] flex justify-center">
              <Image
                className="pointer-events-none"
                title={`${features[3].title} icon`}
                alt={`${features[3].title} icon`}
                src={features[3].cover}
                width={175}
                height={230}
                sizes="275px"
              />
            </div>
            <div className="flex flex-col gap-4 lg:w-1/2 px-0 md:px-12 lg:px-0">
              <h2 className="text-secondary-200 text-center lg:text-left font-bold text-2xl lg:text-3xl">
                {features[3].title}
              </h2>
              <p className="text-base lg:text-lg text-center lg:text-left px-4 lg:px-0 text-white">
                {features[3].description}
              </p>
              <div className="mt-2 mx-auto lg:mx-0">
                <Link href={features[3].link}>
                  <Button variant="tertiary" useArrow={true}>
                    {features[3].linkContent}
                  </Button>
                </Link>
              </div>
            </div>
          </li>
        </ul>
      </Container>

      {/* <Container className="bg-secondary-600 py-16 !px-0 md:!px-8">
        <div className="w-full flex flex-col gap-4">
          <header className="relative flex flex-row justify-center">
            <GradientHeader
              as="h3"
              className="trusted-partners text-4xl font-bold text-center"
              variant="primary"
            >
              {testimonials.title}
            </GradientHeader>
          </header>

          <Testimonials testimonials={testimonials.items} />
        </div>
      </Container> */}

      <Container className="bg-secondary-600 overflow-hidden !px-0">
        <Partners content={partnersContent} partners={partners} />
      </Container>
    </>
  )
}

export default LandingPage

export const getStaticProps: GetStaticProps<LandingPageProps> =
  async function () {
    const contentPath = path.join(process.cwd(), 'content', 'landing-page.yaml')
    const content = (await fsPromises.readFile(contentPath)).toString()
    const parsedContent = YamlParse(content)

    const partnersPath = path.join(process.cwd(), 'content', 'partners.yaml')
    const partnersContent = (await fsPromises.readFile(partnersPath)).toString()
    const partners: Partner[] = YamlParse(partnersContent).partners.map(
      (partner: Partner) => ({
        ...partner,
        logoSize: imageSize(path.join(process.cwd(), 'public', partner.logo)),
      })
    )

    const testimonialsPath = path.join(
      process.cwd(),
      'content',
      'testimonials.yaml'
    )
    const testimonialsContent = (
      await fsPromises.readFile(testimonialsPath)
    ).toString()
    const parsedTestimonials = YamlParse(testimonialsContent)

    const authorsPath = path.join(process.cwd(), 'content', 'authors.yaml')
    const authorsContent = (await fsPromises.readFile(authorsPath)).toString()
    const parsedAuthors: Record<string, Author> =
      YamlParse(authorsContent).authors

    const testimonials: Testimonial[] = parsedTestimonials.testimonials.items
      .map((testimonial: Testimonial) => ({
        ...testimonial,
        author: parsedAuthors[testimonial.author as unknown as string],
      }))
      .filter((testimonial: Testimonial) => testimonial.author)

    return {
      props: {
        content: parsedContent,
        testimonials: {
          ...parsedTestimonials.testimonials,
          items: testimonials,
        },
        partnersNumber: partners.length,
        partners,
        $$app: {
          navigation: await createNavigation(),
        },
      },
    }
  }
