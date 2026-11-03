import { Html, Head, Main, NextScript } from 'next/document'
import { themeScript } from '@cennso/ui/theme-script'

export default function Document() {
  return (
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: themeScript({ defaultSetting: 'dark' }),
          }}
        />
      </Head>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
