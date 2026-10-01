import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import NextImage from 'next/image'
import Link from 'next/link'

import { Button, Card, Typography } from '@cennso/ui'

import {
  ButtonChevron,
  GLOW_OUTLINES,
  GLOW_TINTS,
  Container,
  CTA_HERO,
} from '../components/common'
import { LogoBand } from '../components/Home/LogoBand'
import { StatCard } from '../components/Home/StatCard'
import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'
import { loadFooterData } from '../lib/footer'

import type { NextPage, GetStaticProps } from 'next'
import type { FunctionComponent } from 'react'

type LandingPageProps = {
  content: Record<string, any>
}

// Design 4.0 tints each "Why Cennso?" card with a different glow token at ~41%
// over the page background (Figma frames 1:11 / 1:12 / 1:10, left to right).
// The light frames (1:4442 / 1:4443 / 1:4441) leave all three plain white,
// which is what Card's own bg-card already gives, so the tint is dark-only.
// Written as whole static class names so Tailwind's scanner finds them.
// 24px corner, 32px horizontal inset - Figma 1:11 (400x338, r24) with its body
// at x+33 (1:94 and 1:95 are hand-placed at +43 and +38, so 32 is the round
// value closest to what the frames repeat). Card ships an 8px corner and a
// 20px --card-spacing that drives padding and gap alike, so the vertical
// metrics are pinned separately: 19px above the title, 13px between title and
// body, 55px under the body. All three are identical on all six cards across
// both frames - 1:96 at y+19 in a card at y=1100, 1:93 starting 13px under its
// 45px title box, and ending 55px above the card's bottom edge.
//
// The 13px is the one the owner reported: --card-spacing alone put 32px there,
// two and a half times the frame's.
//
// The light frames draw these cards as a plain white rounded rectangle
// (1:4442 is `bg-white rounded-[24px]` with no stroke), so the border box is
// kept for layout and its colour cleared; the dark frames' per-card outlines
// are reinstated by GLOW_OUTLINES.
// `dark:bg-clip-padding` is what lets the translucent outline above land on
// the frames' colour instead of a brighter one. CSS paints an element's
// background under its border box by default, so a 40% stroke would composite
// over the card's own 40% tint and come out ~rgb(31,100,154) where 1:11 draws
// ~rgb(26,85,129). In Figma the fill and the stroke are one node dimmed once,
// so the stroke sits on the page plate, not on the fill; clipping the
// background to the padding box reproduces exactly that. Dark only - in light
// the border is transparent and the fill IS wanted underneath it, otherwise a
// 1px ring of page plate would cut around every white card.
const CARD_SHELL =
  'rounded-3xl gap-[13px] pt-[19px] pb-[19px] shadow-none border-transparent dark:border-border dark:bg-clip-padding [--card-spacing:--spacing(8)]'

/**
 * The three stat-card illustrations, one file per theme.
 *
 * Every one of them is drawn in #ffb31b in the dark frame (1:29, 1:69, 1:83)
 * and in #ff6d12 in the light one (1:4456, 1:4496, 1:4510) - read off the
 * nodes, not sampled off a screenshot. A single orange export was being used
 * for both, which is why the dark page showed an orange world map where the
 * design draws a yellow one. Same split the hero already needs, for the same
 * reason.
 *
 * Each pair is exported from its own frame with `contentsOnly`, so no page
 * plate is baked in and the corners are genuinely transparent - a plain node
 * export composites the frame's background rectangle into the PNG.
 *
 * `height` is the figure's height in the frame; the width follows the
 * artwork's own ratio, and `sizes` states that rendered width so next/image
 * picks a srcset candidate for the box it actually paints.
 */
const StatIllustration: FunctionComponent<{
  name: string
  dark: { width: number; height: number }
  light: { width: number; height: number }
  /** Tailwind height utility, e.g. `h-[111px]` - the Figma figure height. */
  heightClass: string
  /** Rendered CSS width at that height, for `sizes`. */
  sizes: string
}> = ({ name, dark, light, heightClass, sizes }) => (
  <>
    <NextImage
      src={`/assets/landing-page/${name}-dark.webp`}
      alt=""
      aria-hidden="true"
      width={dark.width}
      height={dark.height}
      sizes={sizes}
      className={`hidden w-auto dark:block ${heightClass}`}
    />
    <NextImage
      src={`/assets/landing-page/${name}-light.webp`}
      alt=""
      aria-hidden="true"
      width={light.width}
      height={light.height}
      sizes={sizes}
      className={`w-auto dark:hidden ${heightClass}`}
    />
  </>
)

const LandingPage: NextPage<LandingPageProps> = ({ content }) => {
  const { page, sections } = content
  const { hero, customerLogos, whyCennso, stats } = sections

  return (
    <>
      <SEO title={page.title} description={page.description} />

      {/* No `bg-secondary` band: both 4.0 main-page frames paint one flat
          plate edge to edge (#001a2a dark / #e1eaf0 light) and draw no
          separate hero surface on top of it. */}
      {/* The page's own 1200px column, the one the header wordmark and every
          other page heading sit on (Figma: headline and logo both at x=81).
          Only the logo band and the cards below are drawn wider. */}
      <Container>
        <div className="flex w-full flex-col">
          {/* The frames put the copy in a 601px column (1:24 x=81 -> 1:25
              right edge 686) hard against the artwork at x=687, so the split
              is not 50/50 and the gutter between them is nominal. A half-width
              column with a 64px gutter left the 48px headline too narrow for
              its own first line and broke "Build Network Solutions." across
              two, which the design sets on one. */}
          <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6 pt-10 pb-16 md:pt-16 md:pb-24 w-full">
            <div className="flex flex-col gap-6 w-full md:w-[56%] items-center md:items-start text-center md:text-left">
              {/* Figma 1:24 / 1:4451: Poppins Bold 48/64, no tracking. The
                  library's `h1` variant is the theme's 36/40 step with
                  -0.025em tracking, which is the app-UI heading, not this
                  marketing hero. */}
              <Typography
                variant="h1"
                render={<h1 />}
                className="whitespace-pre-line text-primary md:text-5xl md:leading-[64px] md:tracking-normal lg:whitespace-pre lg:text-[54px] lg:leading-[1.25]"
              >
                {hero.headline}
              </Typography>
              {/* Figma 1:25 / 1:4452: Regular 26px. `lead` is 18/28. */}
              <Typography
                variant="lead"
                className="md:text-[26px] md:leading-[1.4]"
              >
                {hero.description}
              </Typography>
              <Button
                variant="cta"
                className={CTA_HERO}
                render={(props) => <Link {...props} href="/contact" />}
              >
                {hero.ctaText}
                {/* Figma 1:68 trails the label with a chevron 17px after it
                    (the gap is on the pill, see CTA_HERO). */}
                <ButtonChevron />
              </Button>
            </div>
            {/* Mobile stacks the artwork above the copy (order-first); from
                md: up it returns to the right of the copy in source order. */}
            <div className="order-first md:order-none w-full md:w-[44%] flex justify-center">
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
                sizes="(max-width: 768px) 80vw, 50vw"
                priority
                className="hidden w-full max-w-md md:max-w-none md:scale-[1.2] pointer-events-none dark:block"
              />
              <NextImage
                src="/assets/landing-page/hero-illustration-light.webp"
                alt={hero.illustrationAlt}
                width={1000}
                height={715}
                sizes="(max-width: 768px) 80vw, 50vw"
                priority
                className="w-full max-w-md md:max-w-none md:scale-[1.2] pointer-events-none dark:hidden"
              />
            </div>
          </div>
        </div>
      </Container>

      {/* The same 1200px column as the header wordmark, the hero and every
          page heading, so the logo band and the cards line up with them. The
          frames draw this row at 1246px; the owner ruled for one straight
          edge down the page instead. */}
      <Container>
        <div className="flex flex-col pb-16 md:pb-24 w-full">
          <LogoBand logos={customerLogos} />
          {/* 80px between the heading row and the cards: the glyph (Figma 1:13)
            ends at y=1019.65 and the first card (1:11) starts at y=1100. */}
          <div className="flex flex-col gap-20 pt-12 md:pt-24 w-full">
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
                {/* Figma 1:16 / 1:4529: Poppins Bold 64px on a 42px line box
                  and no tracking. The `display` variant is the right size but
                  carries `tracking-tight` (-0.025em, i.e. -1.6px here) and
                  inherits the body's 1.5 line height, which set the heading
                  96px tall - more than twice the frame's box, and what pushed
                  the glyph row apart from the cards under it. The frame's 42px
                  box made the two lines overlap once the heading wraps on
                  mobile, so it is line-height: 1 (leading-none) instead. */}
                <Typography
                  variant="display"
                  render={<h2 />}
                  className="text-foreground leading-none tracking-normal"
                >
                  {whyCennso.heading}
                </Typography>
              </div>
            </div>

            {/* 23px between cards in the frames (1:11 ends at x=461, 1:12 starts
              at 484). On the 1200px column, three equal columns and a 23px
              gutter give each card ~385px, a little under the frames' 400px. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[23px]">
              {whyCennso.cards.map(
                (
                  card: { title: string; description: string },
                  index: number
                ) => (
                  <Card
                    key={card.title}
                    className={`${CARD_SHELL} ${GLOW_TINTS[index] ?? ''} ${
                      GLOW_OUTLINES[index] ?? ''
                    }`}
                  >
                    {/* `gap-0` is not cosmetic. Card.Header is a
                      `grid-rows-[auto_auto] gap-2` two-track grid sized for a
                      title + description pair; with only a title in it the
                      second track is empty but the 8px row gap between the two
                      tracks is still laid out, so the header box ran 8px
                      taller than its text and the frames' 13px title-to-body
                      step measured 21px. Zeroing the header's own gap leaves
                      the Card's `gap-[13px]` as the only thing between them. */}
                    <Card.Header className="gap-0">
                      {/* Figma 1:96-1:98 / 1:4526-1:4528: Poppins Bold 32px,
                        1.4 line height, CENTRED - all six title nodes carry
                        text-align center, and each sits on its card's own
                        centre line (1:98 spans x=1022..1192 in a card centred
                        at 1107). This was left-aligned, which is the defect
                        the owner reported. */}
                      <Card.Title
                        render={<h3 />}
                        className="text-[32px] font-bold leading-[1.4] text-center"
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
        </div>
      </Container>

      {/* The same 1200px column again. The frames put these panels on a
          1237px row; one straight edge down the page wins over that. */}
      <Container>
        <div className="flex flex-col gap-8 pb-16 md:pb-24 w-full">
          <Typography variant="h2" className="sr-only">
            {stats.heading}
          </Typography>

          {/* 37px between the stat panels and 43px between the rows in the
              frames (1:20 ends at x=661, 1:21 starts at 698; row 1 ends at
              y=1981, row 2 starts at 2024). On the 1237px row above, two equal
              columns and a 37px gutter give each panel exactly the frames'
              600px. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[37px] gap-y-[43px]">
            <StatCard
              figure={
                <StatIllustration
                  name="stat-locations"
                  dark={{ width: 810, height: 460 }}
                  light={{ width: 810, height: 460 }}
                  // Figma 1:29 / 1:4456: 196.46 x 111 in the frame.
                  heightClass="h-[111px]"
                  sizes="196px"
                />
              }
              title={stats.cards[0].title}
              description={stats.cards[0].description}
            />
            <StatCard
              figure={
                // Figma 1:61 / 1:4488: Poppins Bold 115.063px, -4.6025px
                // tracking (-0.04em), line height auto - 1.5 for Poppins,
                // which is the 173px box the frame measures and what centres
                // the figure in the 205px band the way the frames do.
                //
                // Colour is per theme, from the nodes: 1:61 is #ffb31b, which
                // is exactly what --primary resolves to in the dark theme;
                // 1:4488 is #ff6d12, which is --cta. The light value measures
                // 2.82:1 on the white panel and misses WCAG 2.1 AA even at
                // the 3:1 large-text floor - the same pair as the CTA pill's
                // label, and the same owner decision. See ctaButton.ts.
                <Typography
                  variant="stat"
                  className="text-[115px] leading-[1.5] tracking-[-0.04em] text-cta dark:text-primary"
                >
                  {stats.cards[1].figure}
                </Typography>
              }
              title={stats.cards[1].title}
              description={stats.cards[1].description}
            />
            <StatCard
              figure={
                <StatIllustration
                  name="stat-bandwidth"
                  dark={{ width: 652, height: 580 }}
                  light={{ width: 652, height: 580 }}
                  // Figma 1:69 / 1:4496: 158.10 x 145 in the frame.
                  heightClass="h-[145px]"
                  sizes="163px"
                />
              }
              title={stats.cards[2].title}
              description={stats.cards[2].description}
            />
            <StatCard
              figure={
                <StatIllustration
                  name="stat-sessions"
                  dark={{ width: 394, height: 500 }}
                  light={{ width: 402, height: 508 }}
                  // Figma 1:83 / 1:4510: 96.39 x 122.79 in the frame.
                  heightClass="h-[123px]"
                  sizes="98px"
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
