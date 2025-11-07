import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'

import siteMetadata from '../siteMetadata'
import { SchemaOrg } from './common/SchemaOrg'
import { StructuredData } from '@/lib/seo/types'
import { getCanonicalUrl } from '@/lib/seo/canonical'

import type { FunctionComponent } from 'react'
import type { NextSeoProps } from 'next-seo'

export interface SEOProps extends NextSeoProps {
  structuredData?: StructuredData | StructuredData[]
}

export const SEO: FunctionComponent<SEOProps> = (props) => {
  const router = useRouter()

  const defaultTitle = siteMetadata.title
  const defaultDescription = siteMetadata.description
  const siteUrl = siteMetadata.siteUrl

  // Use canonical URL resolver for proper URL generation
  const canonicalUrl = props.canonical || getCanonicalUrl(router.asPath)
  const pageUrl = canonicalUrl

  // Use custom title if provided, otherwise use default site title
  // Don't concatenate to avoid overly long titles (SEO recommends 50-60 chars)
  const title = props.title || defaultTitle
  const description = props.description || defaultDescription

  const imageUrl =
    router.asPath === '/'
      ? '/assets/og-images/landing-page/image.png'
      : `/assets/og-images${router.asPath}/image.png`

  const images = props.openGraph?.images
    ? props.openGraph?.images.map((image) => {
        let url = image.url
        if (!url.startsWith(siteUrl)) {
          url = `${siteUrl}${url}`
        }
        return { width: 1200, height: 630, ...image, url }
      })
    : [
        {
          url: `${siteUrl}${imageUrl}`,
          alt: description,
          width: 1200,
          height: 630,
        },
      ]

  const openGraph: NextSeoProps['openGraph'] = {
    type: 'website',
    locale: 'en-us',
    siteName: defaultTitle,
    url: pageUrl,
    defaultImageWidth: 1200,
    defaultImageHeight: 630,
    title,
    description,
    ...(props.openGraph || {}),
    images,
  }

  // Uncomment when we will have Twitter account for Cennso
  // const twitter: NextSeoProps['twitter'] = {
  //   handle: '@handle',
  //   site: '@site',
  //   cardType: 'summary_large_image',
  // }

  return (
    <>
      <NextSeo
        {...props}
        themeColor={siteMetadata.theme}
        title={title}
        description={description}
        openGraph={openGraph}
        // twitter={twitter}
        canonical={canonicalUrl}
      />
      {props.structuredData && <SchemaOrg data={props.structuredData} />}
    </>
  )
}
