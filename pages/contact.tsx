import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { Phone } from 'lucide-react'

import { ContactForm } from '../components/Contact/ContactForm'
import { CircleAvatar, Container, PENCIL_BANNER } from '../components/common'
import { PageHeader } from '../components/PageHeader'
import { SEO } from '../components/SEO'
import {
  generateLocalBusinessSchema,
  type LocalBusinessData,
} from '../lib/seo/schema'

import { createNavigation } from '../lib/navigation'
import { loadFooterData } from '../lib/footer'

import type { FunctionComponent } from 'react'
import type { NextPage, GetStaticProps } from 'next'
import type { Author } from '../contexts'

type ContactPageProps = {
  content: Record<string, any>
}

/**
 * lucide's `mail` glyph, solid: the envelope filled in primary with the flap
 * cut out in the page plate's colour, as the contact frames draw it. Same
 * geometry as lucide's, but not lucide's `Mail` with a fill - that one paints
 * the flap first and the envelope over it, so filling it hides the flap.
 */
const MailSolid: FunctionComponent<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 24 24"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="2"
      className="fill-primary stroke-primary"
    />
    <path
      d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"
      className="fill-none stroke-page"
    />
  </svg>
)

const ContactPage: NextPage<ContactPageProps> = ({ content }) => {
  const { page, sections, localBusiness } = content

  // Generate LocalBusiness schema if data is available
  const localBusinessSchema = localBusiness
    ? generateLocalBusinessSchema(localBusiness as LocalBusinessData)
    : undefined

  return (
    <>
      <SEO
        title={page.title}
        description={page.description}
        structuredData={localBusinessSchema}
      />

      <PageHeader
        title={page.heading}
        description={page.subheading}
        breadcrumbs={[
          {
            title: page.title,
            link: '/contact',
          },
        ]}
        background={PENCIL_BANNER}
      />

      {/* Both contact frames (1:3471 / 1:7084) sit on one flat plate; there is
          no band behind the form column. */}
      <Container className="pt-12 md:pt-0 pb-24">
        <div className="flex flex-col gap-24">
          {Object.entries(sections).map(([, section]: [string, any], index) => {
            return (
              <div className="w-full flex flex-col gap-2" key={section.company}>
                <header className="flex flex-row">
                  <h2 className="text-4xl font-bold text-left text-primary">
                    {section.title}
                  </h2>
                </header>

                <div className="flex flex-col xl:flex-row gap-12 text-foreground">
                  {/* 640-1279px (tablet:): a two-column grid - the heading and copy span both
                      columns, then the photo sits left across two rows with
                      name + title above the contacts on its right. Below
                      640px the column stays stacked; from xl up the
                      original row layout takes over. */}
                  <div className="flex flex-col gap-8 w-full xl:w-1/2 tablet:grid tablet:grid-cols-[auto_1fr] tablet:gap-x-10 tablet:gap-y-6">
                    <h3 className="text-3xl text-primary dark:text-white tablet:col-span-2">{section.company}</h3>
                    {/* Figma 1:3924 / 1:7420 draw the body copy beside the form
                        at Regular 20px; the owner set it to 18px (text-lg). */}
                    <div className="flex flex-col gap-4 text-lg tablet:col-span-2">
                      {section.description.map(
                        (text: string, index: number) => (
                          <p key={index}>{text}</p>
                        )
                      )}
                    </div>
                    {/* Below xl (1280px) this row dissolves (max-xl:contents) so
                        the avatar and the contacts join the column as siblings
                        of the name block, and the contacts move last: avatar,
                        name, title, then e-mail and phone as a centred column
                        with their icons aligned (pulled up so the title-to-
                        contacts gap is 22px on mobile, 17px on tablet: 30%
                        under the column/grid gap). From xl up it is the
                        avatar | contacts row again, name below. */}
                    <div className="max-xl:contents flex flex-col xl:flex-row items-center gap-6 xl:gap-12">
                      <div className="flex items-center flex-col gap-6 xl:w-1/2 tablet:row-span-2 tablet:self-center">
                        <CircleAvatar
                          src={section.person.avatar}
                          author={section.person}
                          // White disc behind the photo in light (owner's
                          // call); dark keeps the amber --primary ring. The
                          // [data-theme=light] ancestor selector outranks the
                          // component's own bg-primary.
                          className="w-64 h-64 [[data-theme=light]_&]:bg-white"
                          priority={index === 0}
                        />
                      </div>
                      {section.contact ? (
                        <div className="max-xl:order-last flex flex-col items-start justify-center gap-3 sm:gap-6 w-fit mx-auto xl:mx-0 xl:w-1/2 tablet:mx-0 tablet:self-start max-sm:-mt-[10px] tablet:-mt-[7px]">
                          {/* Figma 1:3936 / 1:3929 draw the address lines at
                              Regular 22px next to 58px icon discs (1:3958 /
                              1:3959); the owner set them to 20px, with a 24px
                              gap (sm:gap-6) between e-mail and phone. */}
                          {section.contact.email ? (
                            <a
                              href={`mailto:${section.contact.email}`}
                              rel="noopener"
                              className="flex flex-row gap-4 items-center text-[20px] text-foreground hover:text-primary transition duration-300 ease-in-out"
                            >
                              <span className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary shrink-0">
                                <MailSolid className="w-7 h-7" />
                              </span>
                              <span className="whitespace-nowrap">
                                {section.contact.email}
                              </span>
                            </a>
                          ) : null}
                          {section.contact.phone ? (
                            <a
                              href={`tel:${section.contact.phone.replace(' ', '')}`}
                              className="flex flex-row gap-4 items-center text-[20px] text-foreground hover:text-primary transition duration-300 ease-in-out"
                            >
                              <span className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary shrink-0">
                                <Phone
                                  className="w-6 h-6 fill-primary stroke-primary"
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="whitespace-nowrap">
                                {section.contact.phone}
                              </span>
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    {/* Both contact frames pitch this block off the address
                        lines above it, not off the stack's own rhythm: the
                        phone line (1:3929, bottom 906) sits 69px above the
                        name (1:3945, top 975), where the 32px stack gap alone
                        measured 75px. The -6px is taken here rather than off
                        `gap-8` so only the gap the frames pin actually moves -
                        the three gaps above it are not design values. */}
                    <div className="-mt-1.5 flex flex-col gap-[17px] max-xl:gap-[12px] w-full xl:w-[calc(50%-1rem)] tablet:mt-0 tablet:self-end">
                      {/* Figma 1:3945 / 1:3946: Bold 24px in --primary over
                          Regular 20px in --foreground, both centred, with 17px
                          between them (1:3945 bottom 1000 -> 1:3946 top 1017);
                          `gap-2` put 8px there. */}
                      <header className="flex flex-row justify-center tablet:justify-start">
                        <h4 className="font-bold text-2xl text-primary text-center tablet:text-left">
                          {section.person.name}
                        </h4>
                      </header>
                      <p className="text-center text-lg text-foreground tablet:text-left">
                        {section.person.position}
                      </p>
                    </div>
                  </div>
                  <div className="w-full xl:w-1/2 mt-0 xl:mt-4">
                    <ContactForm
                      receiverEmail={section.contact.email}
                      content={content}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </>
  )
}

export default ContactPage

export const getStaticProps: GetStaticProps = async function () {
  const contentPath = path.join(process.cwd(), 'content', 'contact-page.yaml')
  const content = (await fsPromises.readFile(contentPath)).toString()
  const parsedContent = YamlParse(content)

  const authorsPath = path.join(process.cwd(), 'content', 'authors.yaml')
  const authorsContent = (await fsPromises.readFile(authorsPath)).toString()
  const parsedAuthors: Record<string, Author> =
    YamlParse(authorsContent).authors

  Object.values(parsedContent.sections).forEach((section: any) => {
    section.person = parsedAuthors[section.person]
  })

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
