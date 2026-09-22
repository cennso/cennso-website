import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import NextImage from 'next/image'
import Link from 'next/link'

import { Button, Card, Typography } from '@cennso/ui'

import { Container } from '../components/common'
import { LogoBand } from '../components/Home/LogoBand'
import { StatCard } from '../components/Home/StatCard'
import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'
import { loadFooterData } from '../lib/footer'

import type { NextPage, GetStaticProps } from 'next'

type LandingPageProps = {
  content: Record<string, any>
}

const LandingPage: NextPage<LandingPageProps> = ({ content }) => {
  const { page, sections } = content
  const { hero, customerLogos, whyCennso, stats } = sections

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <Container className="bg-secondary">
        <div className="flex w-full flex-col">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 py-16 md:py-24 w-full">
            <div className="flex flex-col gap-6 w-full md:w-1/2 items-center md:items-start text-center md:text-left">
              {/* tailwind-merge (bundled inside @cennso/ui's cn()) doesn't know the app's
              custom `h1` fontSize key, so it buckets `text-h1` as a text *colour* utility
              and a plain `text-primary` here would evict it, silently collapsing the
              headline back to browser-default size (see the branch review). Re-declaring
              the size as a typed arbitrary value keeps it in tailwind-merge's font-size
              group instead, so it survives alongside the color override. */}
              <Typography
                variant="h1"
                render={<h1 />}
                className="whitespace-pre-line text-primary text-(length:--type-size-h1) leading-(--type-line-h1)"
              >
                {hero.headline}
              </Typography>
              <Typography variant="lead">{hero.description}</Typography>
              <Button
                variant="cta"
                render={(props) => <Link {...props} href="/contact" />}
              >
                {hero.ctaText}
              </Button>
            </div>
            <div className="w-full md:w-1/2 flex justify-center">
              <NextImage
                src="/assets/landing-page/hero-illustration.webp"
                alt="Illustration of a phone, cell tower, server racks and a globe connected together in a hexagon panel, with the Cennso wordmark on the server node"
                width={1300}
                height={1013}
                sizes="(max-width: 768px) 80vw, 40vw"
                priority
                className="w-full max-w-md md:max-w-none pointer-events-none"
              />
            </div>
          </div>

          <div className="pb-16 md:pb-20 w-full">
            <LogoBand logos={customerLogos} />
          </div>
        </div>
      </Container>

      <Container>
        <div className="flex flex-col gap-12 py-16 md:py-24 w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <NextImage
                src="/assets/landing-page/why-cennso-glyph.webp"
                alt=""
                aria-hidden="true"
                width={640}
                height={643}
                sizes="56px"
                className="h-14 w-auto"
              />
              <Typography
                variant="display"
                render={<h2 />}
                className="text-foreground"
              >
                {whyCennso.heading}
              </Typography>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {whyCennso.cards.map(
              (card: { title: string; description: string }) => (
                <Card key={card.title} className="shadow-none">
                  <Card.Header>
                    <Card.Title render={<h3 />}>{card.title}</Card.Title>
                  </Card.Header>
                  <Card.Content>
                    <Card.Description>{card.description}</Card.Description>
                  </Card.Content>
                </Card>
              )
            )}
          </div>
        </div>
      </Container>

      <Container>
        <div className="flex flex-col gap-8 pb-16 md:pb-24 w-full">
          <Typography variant="h2" className="sr-only">
            {stats.heading}
          </Typography>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard
              figure={
                <NextImage
                  src="/assets/landing-page/stat-locations.webp"
                  alt=""
                  aria-hidden="true"
                  width={625}
                  height={369}
                  sizes="160px"
                  className="h-20 w-auto"
                />
              }
              title={stats.cards[0].title}
              description={stats.cards[0].description}
            />
            <StatCard
              figure={
                <Typography variant="stat" className="text-primary">
                  {stats.cards[1].figure}
                </Typography>
              }
              title={stats.cards[1].title}
              description={stats.cards[1].description}
            />
            <StatCard
              figure={
                <NextImage
                  src="/assets/landing-page/stat-bandwidth.webp"
                  alt=""
                  aria-hidden="true"
                  width={652}
                  height={580}
                  sizes="160px"
                  className="h-20 w-auto"
                />
              }
              title={stats.cards[2].title}
              description={stats.cards[2].description}
            />
            <StatCard
              figure={
                <NextImage
                  src="/assets/landing-page/stat-sessions.webp"
                  alt=""
                  aria-hidden="true"
                  width={402}
                  height={508}
                  sizes="120px"
                  className="h-20 w-auto"
                />
              }
              title={stats.cards[3].title}
              description={stats.cards[3].description}
            />
          </div>
        </div>
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
