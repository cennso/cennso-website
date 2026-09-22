import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import { Mail, Phone } from 'lucide-react'

import { ContactForm } from '../components/Contact/ContactForm'
import { CircleAvatar, Container } from '../components/common'
import { PageHeader } from '../components/PageHeader'
import { SEO } from '../components/SEO'
import {
  generateLocalBusinessSchema,
  type LocalBusinessData,
} from '../lib/seo/schema'

import { createNavigation } from '../lib/navigation'
import { loadFooterData } from '../lib/footer'

import type { NextPage, GetStaticProps } from 'next'
import type { Author } from '../contexts'

type ContactPageProps = {
  content: Record<string, any>
}

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
        background={{
          src: '/assets/backgrounds/pencil-illustration.webp',
          alt: '',
          'aria-hidden': 'true',
          width: 286,
          height: 128,
          className: 'mr-64',
        }}
      />

      <Container className="pt-12 md:pt-24 pb-24 bg-secondary">
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
                    <h3 className="text-3xl text-primary">{section.company}</h3>
                    <div className="flex flex-col gap-4">
                      {section.description.map(
                        (text: string, index: number) => (
                          <p key={index}>{text}</p>
                        )
                      )}
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12">
                      <div className="flex items-end xl:items-center flex-col gap-6 md:w-1/2">
                        <div className="filter drop-shadow-[0px_10px_15px_rgba(68,141,200,0.35)]">
                          <CircleAvatar
                            src={section.person.avatar}
                            author={section.person}
                            className="w-64 h-64"
                            priority={index === 0}
                          />
                        </div>
                      </div>
                      {section.contact ? (
                        <div className="flex flex-col sm:flex-row md:flex-col items-center justify-center md:items-start gap-3 sm:gap-12 w-full md:w-1/2">
                          {section.contact.email ? (
                            <a
                              href={`mailto:${section.contact.email}`}
                              rel="noopener"
                              className="flex flex-row gap-4 items-center text-foreground hover:text-primary transition duration-300 ease-in-out"
                            >
                              <span className="flex items-center justify-center w-12 h-12 rounded-full border border-border shrink-0">
                                <Mail
                                  className="w-5 h-5 text-primary"
                                  aria-hidden="true"
                                />
                              </span>
                              <span>{section.contact.email}</span>
                            </a>
                          ) : null}
                          {section.contact.phone ? (
                            <a
                              href={`tel:${section.contact.phone.replace(' ', '')}`}
                              className="flex flex-row gap-4 items-center text-foreground hover:text-primary transition duration-300 ease-in-out"
                            >
                              <span className="flex items-center justify-center w-12 h-12 rounded-full border border-border shrink-0">
                                <Phone
                                  className="w-5 h-5 text-primary"
                                  aria-hidden="true"
                                />
                              </span>
                              <span>{section.contact.phone}</span>
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 w-full xl:w-[calc(50%-1rem)]">
                      <header className="flex flex-row justify-center">
                        <h4 className="font-bold text-xl text-primary text-center">
                          {section.person.name}
                        </h4>
                      </header>
                      <p className="text-center text-foreground">
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
