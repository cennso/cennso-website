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
                  <div className="flex flex-col gap-8 w-full xl:w-1/2">
                    <h3 className="text-3xl text-primary dark:text-white">{section.company}</h3>
                    {/* Figma 1:3924 / 1:7420 draw the body copy beside the form
                        at Regular 20px; the owner set it to 18px (text-lg). */}
                    <div className="flex flex-col gap-4 text-lg">
                      {section.description.map(
                        (text: string, index: number) => (
                          <p key={index}>{text}</p>
                        )
                      )}
                    </div>
                    {/* Below md this row dissolves (max-md:contents) so the
                        avatar and the contacts join the column as siblings of
                        the name block, and the contacts move last: avatar,
                        name, title, then e-mail and phone. From md up it is
                        the avatar | contacts row again, name below. */}
                    <div className="max-md:contents flex flex-col md:flex-row items-center gap-6 md:gap-12">
                      <div className="flex items-center md:items-end xl:items-center flex-col gap-6 md:w-1/2">
                        <CircleAvatar
                          src={section.person.avatar}
                          author={section.person}
                          className="w-64 h-64"
                          priority={index === 0}
                        />
                      </div>
                      {section.contact ? (
                        <div className="max-md:order-last flex flex-col sm:flex-row md:flex-col items-start sm:items-center justify-center md:items-start gap-3 sm:gap-6 w-full max-sm:w-fit max-sm:mx-auto md:w-1/2">
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
                    <div className="-mt-1.5 flex flex-col gap-[17px] w-full xl:w-[calc(50%-1rem)]">
                      {/* Figma 1:3945 / 1:3946: Bold 24px in --primary over
                          Regular 20px in --foreground, both centred, with 17px
                          between them (1:3945 bottom 1000 -> 1:3946 top 1017);
                          `gap-2` put 8px there. */}
                      <header className="flex flex-row justify-center">
                        <h4 className="font-bold text-2xl text-primary text-center">
                          {section.person.name}
                        </h4>
                      </header>
                      <p className="text-center text-lg text-foreground">
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
