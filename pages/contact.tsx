import { promises as fsPromises } from 'fs'
import path from 'path'
import { parse as YamlParse } from 'yaml'

import {
  EnvelopeIcon,
  PhoneIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/solid'

import { ContactForm } from '../components/Contact/ContactForm'
import {
  CircleAvatar,
  Container,
  GradientHeader,
  HexagonDouble,
} from '../components/common'
import { PageHeader } from '../components/PageHeader'
import { SEO } from '../components/SEO'

import { createNavigation } from '../lib/navigation'

import type { NextPage, GetStaticProps } from 'next'
import type { Author } from '../contexts'

type ContactPageProps = {
  content: Record<string, any>
}

const ContactPage: NextPage<ContactPageProps> = ({ content }) => {
  const { page, sections } = content

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <PageHeader
        title={page.title}
        description={page.description}
        breadcrumbs={[
          {
            title: page.title,
            link: '/contact',
          },
        ]}
        background={{
          src: '/assets/backgrounds/bg-header-contact-3.jpg',
          title: 'Contact page background',
          alt: 'Contact page background',
          width: 180,
          height: 150,
          className: 'mr-64',
        }}
      />

      <Container className="pt-12 md:pt-24 pb-24 bg-secondary-400">
        <div className="flex flex-col gap-24">
          {Object.entries(sections).map(([, section]: [string, any]) => {
            return (
              <div className="w-full flex flex-col gap-2" key={section.company}>
                <header className="flex flex-row">
                  <GradientHeader
                    as="h2"
                    className="text-4xl font-bold text-left"
                    variant="primary"
                  >
                    {section.title}
                  </GradientHeader>
                </header>

                <div className="flex flex-col xl:flex-row gap-12 text-white">
                  <div className="flex flex-col gap-8 w-full xl:w-1/2">
                    <h3 className="text-3xl">{section.company}</h3>
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
                          />
                        </div>
                      </div>
                      {section.contact ? (
                        <div className="flex flex-col sm:flex-row md:flex-col items-center justify-center md:items-start gap-3 sm:gap-12 w-full md:w-1/2">
                          {section.contact.email ? (
                            <div className="flex flex-row gap-6 items-center">
                              <HexagonDouble
                                gradient={true}
                                className="p-1"
                                subClassName="bg-secondary-400"
                              >
                                <EnvelopeIcon className="w-12 p-2 text-white" />
                              </HexagonDouble>
                              <div className="flex flex-col">
                                <a
                                  href={`mailto:${section.contact.email}`}
                                  rel="noopener"
                                  className="flex flex-row gap-1 items-center text-secondary-200 hover:text-white transition duration-300 ease-in-out"
                                >
                                  <span>Email</span>
                                  <ArrowTopRightOnSquareIcon className="w-4" />
                                </a>
                                <span className="text-sm text-white">
                                  {section.contact.email}
                                </span>
                              </div>
                            </div>
                          ) : null}
                          {section.contact.phone ? (
                            <div className="flex flex-row gap-6 items-center">
                              <HexagonDouble
                                gradient={true}
                                className="p-1"
                                subClassName="bg-secondary-400"
                              >
                                <PhoneIcon className="w-12 p-2 text-white" />
                              </HexagonDouble>
                              <div className="flex flex-col">
                                <a
                                  href={`tel:${section.contact.phone.replace(' ', '')}`}
                                  className="flex flex-row gap-1 items-center text-secondary-200 hover:text-white transition duration-300 ease-in-out"
                                >
                                  <span>Phone</span>
                                  <ArrowTopRightOnSquareIcon className="w-4" />
                                </a>
                                <span className="text-sm text-white">
                                  {section.contact.phone}
                                </span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2 w-full xl:w-[calc(50%-1rem)]">
                      <header className="flex flex-row justify-center">
                        <h4 className="font-bold text-xl text-secondary-200 text-center">
                          {section.person.name}
                        </h4>
                      </header>
                      <p className="text-center text-white">
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
      },
    },
  }
}
