import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'

import siteMetadata from '../siteMetadata'

import type { FunctionComponent } from 'react'
import type { NextSeoProps } from 'next-seo'

export interface SEOProps extends NextSeoProps {}

export const SEO: FunctionComponent<SEOProps> = (props) => {
  const router = useRouter()

  const defaultTitle = siteMetadata.title
  const defaultDescription = siteMetadata.description
  const siteUrl = siteMetadata.siteUrl
  const pageUrl = `${siteUrl}${router.asPath}`

  const title = props.title ? `${props.title} | ${defaultTitle}` : defaultTitle
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
    <NextSeo
      {...props}
      nofollow={true}
      noindex={true}
      themeColor={siteMetadata.theme}
      title={title}
      description={description}
      openGraph={openGraph}
      // twitter={twitter}
      canonical={props.canonical ? props.canonical : pageUrl}
    />
  )
}
