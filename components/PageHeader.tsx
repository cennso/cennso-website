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
        className="bg-secondary"
        subClassName={
          // `justify-between` (from Container) has no minimum gap of its
          // own - at md widths the header text's flex-basis and the
          // image's rendered width can sum to exactly the row's width,
          // leaving zero space between them. `md:gap-8` guarantees
          // breathing room regardless of how much either side shrinks.
          // `min-w-0` on the header (below) is what lets it actually
          // shrink/wrap to make room instead of overflowing past the
          // image.
          background
            ? 'overflow-hidden flex-col-reverse md:flex-row md:gap-8'
            : ''
        }
      >
        <header className="flex flex-col justify-center w-full min-w-0 min-h-[250px] relative z-20 mt-0 py-16">
          {/* {breadcrumbs.length > 1 ? (
            <div className="mb-3 lg:mb-6">
              <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
          ) : null} */}
          <h1 className="font-bold text-4xl lg:text-5xl text-primary">
            {title}
          </h1>
          {description ? (
            <p className="text-base md:text-lg lg:text-xl mt-2 text-foreground max-w-[800px]">
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-2">{children}</div> : null}
        </header>
        {background ? (
          <div className="hidden md:block mt-8 -mb-24 md:mt-0 md:mb-0">
            <Image
              {...background}
              alt={background.alt}
              className={background.className ?? ''}
              // The wrapper switches to visible at Tailwind's `md:` breakpoint
              // (768px and up); `max-width: 768px` here included 768px
              // itself, so at exactly that width the image was both visible
              // and told it needed 0px, picking the smallest (16w) srcset
              // candidate and rendering it visibly blurry once stretched.
              // 767px keeps the two boundaries from overlapping.
              sizes="(max-width: 767px) 0px, 500px"
            />
          </div>
        ) : null}
      </Container>
    </>
  )
}
