import Image from 'next/image'
import { BreadcrumbJsonLd } from 'next-seo'

import { Container } from './common'

import siteMetadata from '../siteMetadata'

import type { FunctionComponent, PropsWithChildren } from 'react'
import type { ImageProps } from 'next/image'
import type { Breadcrumb } from './Breadcrumbs'

interface PageHeaderProps extends PropsWithChildren {
  title: string
  description?: string
  background?: ImageProps
  breadcrumbs: Breadcrumb[]
}

export const PageHeader: FunctionComponent<PageHeaderProps> = ({
  title,
  description,
  background,
  breadcrumbs,
  children,
}) => {
  return (
    <>
      <BreadcrumbJsonLd
        useAppDir={false}
        keyOverride="breadcrumbs"
        itemListElements={breadcrumbs.map((breadcrumb, index) => ({
          position: index + 1,
          name: breadcrumb.title,
          item: `${siteMetadata.siteUrl}${breadcrumb.link}`,
        }))}
      />

      <Container
        className="bg-[#36AADD]"
        subClassName={
          background ? 'overflow-hidden flex-col-reverse md:flex-row' : ''
        }
      >
        <header className="flex flex-col justify-center w-full min-h-[250px] relative z-20 mt-0">
          {/* {breadcrumbs.length > 1 ? (
            <div className="mb-3 lg:mb-6">
              <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
          ) : null} */}
          <h1 className="font-bold text-4xl lg:text-5xl text-white">{title}</h1>
          {description ? (
            <p className="text-base md:text-lg lg:text-xl mt-2 text-white max-w-[800px]">
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-2">{children}</div> : null}
        </header>
        {background ? (
          <div className="hidden md:block mt-8 -mb-24 md:mt-0 md:mb-0 md:-mr-16">
            <Image
              {...background}
              alt={background.alt}
              sizes="(max-width: 768px) 0px, 500px"
            />
          </div>
        ) : null}
      </Container>
    </>
  )
}
