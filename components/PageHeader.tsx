import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
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
  /** A small "< label" link above the title, back to the parent listing. */
  backLink?: { href: string; label: string }
}

export const PageHeader: FunctionComponent<PageHeaderProps> = ({
  title,
  description,
  background,
  breadcrumbs,
  backLink,
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
        subClassName={
          // `justify-between` (from Container) has no minimum gap of its
          // own - at md widths the header text's flex-basis and the
          // image's rendered width can sum to exactly the row's width,
          // leaving zero space between them. `md:gap-8` guarantees
          // breathing room regardless of how much either side shrinks.
          // `min-w-0` on the header (below) is what lets it actually
          // shrink/wrap to make room instead of overflowing past the
          // image.
          //
          // No overflow-hidden: the Design 4.0 banners are drawn past the
          // column's right edge (and, on /contact, up under the header bar),
          // the way the landing page's hero art is. Layout's overflow-x-clip
          // keeps that from ever scrolling the page sideways.
          background ? 'flex-col-reverse md:flex-row md:gap-8' : ''
        }
      >
        {/* Beside a banner the text starts at the top of the row, as the
            frames draw it (the heading 65px below the header bar on both
            /contact and use cases), rather than centring on the banner's
            height, which pushed it 20-35px lower. */}
        <header
          className={`flex flex-col justify-center w-full min-w-0 min-h-[250px] relative z-20 mt-0 py-16 ${
            background ? 'md:justify-start md:self-start' : ''
          }`}
        >
          {/* {breadcrumbs.length > 1 ? (
            <div className="mb-3 lg:mb-6">
              <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
          ) : null} */}
          {/* Design 4.0 page headings are Poppins Bold 48/64 in --primary
              (Figma 1:589 use cases, 1:1066 light) and the supporting line is
              Regular 26px in --foreground (1:590 / 1:1067). Both were a step
              too small here: the lead topped out at 20px and the heading
              carried no line height of its own. */}
          {backLink ? (
            <Link
              href={backLink.href}
              className="mb-3 inline-flex w-fit items-center gap-1 text-sm text-primary underline underline-offset-4 hover:decoration-2"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {backLink.label}
            </Link>
          ) : null}
          <h1 className="font-bold text-4xl lg:text-5xl lg:leading-[64px] text-primary">
            {title}
          </h1>
          {description ? (
            <p
              // Capped only beside a banner, where it shares the row; with no
              // banner the lede runs the full column like the title above it.
              className={`text-base md:text-xl lg:text-[26px] mt-2 text-foreground ${
                background ? 'max-w-[800px]' : ''
              }`}
            >
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-2">{children}</div> : null}
        </header>
        {background ? (
          // shrink-0: beside a `w-full` header this flex item was squeezed, and
          // the image (max-width: 100% from preflight) shrank with it, so a
          // banner never reached the width its page asked for. self-start
          // keeps it level with the heading when the text is the taller side.
          <div className="hidden md:block md:self-start shrink-0 mt-8 -mb-24 md:mt-0 md:mb-0">
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
              sizes={background.sizes ?? '(max-width: 767px) 0px, 500px'}
            />
          </div>
        ) : null}
      </Container>
    </>
  )
}
