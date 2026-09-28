import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import NextImage from 'next/image'
import Link from 'next/link'

import { Button, Card, Typography } from '@cennso/ui'
import { ChevronRight } from 'lucide-react'

import { Container, CTA_HERO } from '../components/common'
import { LogoBand } from '../components/Home/LogoBand'
import { StatCard } from '../components/Home/StatCard'
import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'
import { loadFooterData } from '../lib/footer'

import type { NextPage, GetStaticProps } from 'next'

type LandingPageProps = {
  content: Record<string, any>
}

// Design 4.0 tints each "Why Cennso?" card with a different glow token at ~41%
// over the page background (Figma frames 1:11 / 1:12 / 1:10, left to right).
// The light frames (1:4442 / 1:4443 / 1:4441) leave all three plain white,
// which is what Card's own bg-card already gives, so the tint is dark-only.
// Written as whole static class names so Tailwind's scanner finds them.
// Spelled hsl(var(--x)/0.4) rather than the /40 opacity modifier: Tailwind 4
// compiles a `/40` opacity modifier to color-mix(in oklab, ...), which the browser
// computes as oklab(...). Lighthouse's bundled axe-core cannot parse that and
// nulls the whole accessibility category, failing the CI gate. This spelling
// computes to plain rgba() and is the same colour.
const whyCennsoTints = [
  'dark:bg-[hsl(var(--glow-blue)/0.4)]',
  'dark:bg-[hsl(var(--glow-cyan)/0.4)]',
  'dark:bg-[hsl(var(--glow-teal)/0.4)]',
] as const

// Each tinted card is outlined in the bright end of its own glow family in the
// dark frames - #3fabff on 1:11, #41d2ff on 1:12, #00ffe4 on 1:10 - not in the
// theme's flat --border. There is no token for these: --glow-* is the fill
// (35%/33% lightness), and the outlines sit far above it, so they are written
// as literals here the same way the tints above name their token. Dark only:
// the light frames (1:4442 / 1:4443 / 1:4441) draw the cards as plain white
// with no outline at all. Decorative, so no non-text contrast floor applies.
const whyCennsoOutlines = [
  'dark:border-[#3fabff]',
  'dark:border-[#41d2ff]',
  'dark:border-[#00ffe4]',
] as const

// 24px corner, 32px inset - Figma 1:11 (400x338, r24) with its title at x+33
// and body at x+33. Card ships an 8px corner and a 20px --card-spacing.
const CARD_SHELL = 'rounded-3xl [--card-spacing:--spacing(8)]'

const LandingPage: NextPage<LandingPageProps> = ({ content }) => {
  const { page, sections } = content
  const { hero, customerLogos, whyCennso, stats } = sections

  return (
    <>
      <SEO title={page.title} description={page.description} />

      {/* No `bg-secondary` band: both 4.0 main-page frames paint one flat
          plate edge to edge (#001a2a dark / #e1eaf0 light) and draw no
          separate hero surface on top of it. */}
      <Container>
        <div className="flex w-full flex-col">
          {/* The frames put the copy in a 601px column (1:24 x=81 -> 1:25
              right edge 686) hard against the artwork at x=687, so the split
              is not 50/50 and the gutter between them is nominal. A half-width
              column with a 64px gutter left the 48px headline too narrow for
              its own first line and broke "Build Network Solutions." across
              two, which the design sets on one. */}
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-6 pt-10 pb-16 md:pt-16 md:pb-24 w-full">
            <div className="flex flex-col gap-6 w-full md:w-[52%] items-center md:items-start text-center md:text-left">
              {/* Figma 1:24 / 1:4451: Poppins Bold 48/64, no tracking. The
                  library's `h1` variant is the theme's 36/40 step with
                  -0.025em tracking, which is the app-UI heading, not this
                  marketing hero. */}
              <Typography
                variant="h1"
                render={<h1 />}
                className="whitespace-pre-line text-primary md:text-5xl md:leading-[64px] md:tracking-normal"
              >
                {hero.headline}
              </Typography>
              {/* Figma 1:25 / 1:4452: Regular 26px. `lead` is 18/28. */}
              <Typography variant="lead" className="md:text-[26px]">
                {hero.description}
              </Typography>
              <Button
                variant="cta"
                className={CTA_HERO}
                render={(props) => <Link {...props} href="/contact" />}
              >
                {hero.ctaText}
                {/* Figma 1:68 trails the label with an 11x15 chevron vector,
                    17px after it. Decorative: the label already names the
                    action, so it carries no accessible name of its own. */}
                <ChevronRight className="h-4 w-3" aria-hidden="true" />
              </Button>
            </div>
            <div className="w-full md:w-[48%] flex justify-center">
              {/* Two exports, not one. The dark and light frames draw the slab
                  in different colours (dark navy vs. bright blue) over
                  different plates, and the single artwork shipped before was
                  cut from the LIGHT frame and reused for both, which is why
                  the dark page showed a light slab. Each file is the hero
                  composite of its own frame (Figma 687,126 -> 1344,596),
                  alpha-keyed off that frame's flat plate so neither carries a
                  background rectangle. */}
              <NextImage
                src="/assets/landing-page/hero-illustration-dark.webp"
                alt={hero.illustrationAlt}
                width={1000}
                height={715}
                sizes="(max-width: 768px) 80vw, 40vw"
                priority
                className="hidden w-full max-w-md md:max-w-none pointer-events-none dark:block"
              />
              <NextImage
                src="/assets/landing-page/hero-illustration-light.webp"
                alt={hero.illustrationAlt}
                width={1000}
                height={715}
                sizes="(max-width: 768px) 80vw, 40vw"
                priority
                className="w-full max-w-md md:max-w-none pointer-events-none dark:hidden"
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
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-10 text-center sm:text-left">
              <NextImage
                src="/assets/landing-page/why-cennso-glyph.webp"
                alt=""
                aria-hidden="true"
                width={640}
                height={643}
                sizes="160px"
                className="h-40 w-auto"
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
              (card: { title: string; description: string }, index: number) => (
                <Card
                  key={card.title}
                  className={`${CARD_SHELL} ${whyCennsoTints[index] ?? ''} ${
                    whyCennsoOutlines[index] ?? ''
                  }`}
                >
                  <Card.Header>
                    {/* Figma 1:96-1:98: Bold 32px, 1.4 line height. */}
                    <Card.Title
                      render={<h3 />}
                      className="text-[32px] font-bold leading-[1.4]"
                    >
                      {card.title}
                    </Card.Title>
                  </Card.Header>
                  <Card.Content>
                    {/* Figma 1:93-1:95: Regular 16px, 1.6 line height, in the
                        page's own foreground - not the muted 14px the library
                        gives a Card.Description by default. */}
                    <Card.Description className="text-base leading-[1.6] text-foreground">
                      {card.description}
                    </Card.Description>
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
                  // `h-20 w-auto` pins the height to 80px at every breakpoint
                  // and lets the width follow the artwork's own aspect ratio,
                  // so the rendered width is 80 * 625/369 = 136px - not the
                  // 160px that used to be declared. `sizes` is what next/image
                  // multiplies by the device pixel ratio to pick a srcset
                  // candidate, so over-declaring it fetches a needlessly large
                  // source for the same on-screen box.
                  sizes="136px"
                  className="h-20 w-auto"
                />
              }
              title={stats.cards[0].title}
              description={stats.cards[0].description}
            />
            <StatCard
              figure={
                // Figma 1:61 / 1:4488: Bold 115px, -4.6px tracking. `stat` is
                // the theme's 80px step, so the size and tracking are taken
                // from the frame - but NOT its light-frame colour. 1:4488
                // paints the figure #ff6d12 (--cta) on the white stat panel,
                // which measures 2.82:1 and misses WCAG 2.1 AA even at the
                // 3:1 large-text floor (axe-core flags it as a colour-contrast
                // violation); the constitution outranks the frame, so it stays
                // on --primary, which is the amber the dark frame asks for
                // anyway and the navy every other light-mode heading uses.
                <Typography
                  variant="stat"
                  className="text-[115px] leading-none tracking-[-0.04em] text-primary"
                >
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
                  // 80 * 652/580 = 90px rendered, not the 160px declared
                  // before: Lighthouse measured this one at 90x80 CSS px while
                  // next/image was serving the 640px-wide candidate, 82% of
                  // which was thrown away.
                  sizes="90px"
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
                  // 80 * 402/508 = 64px rendered, not the 120px declared
                  // before.
                  sizes="64px"
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
