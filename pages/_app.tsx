import { Poppins } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'

import { Layout } from '../components/Layout'

import type { AppProps } from 'next/app'

import '../styles/tailwind.css'

const poppinsFont = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
})

export default function App({ Component, pageProps, router }: AppProps) {
  let [pathName] = router.asPath.split('#')
  ;[pathName] = pathName.split('?')

  const { $$app, ...rest } = pageProps
  const { navigation } = $$app || {}

  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${poppinsFont.style.fontFamily};
        }
      `}</style>

      <Layout navigation={navigation}>
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={() =>
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
          }
        >
          <motion.main
            key={pathName}
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 750,
              damping: 50,
            }}
            className="flex-1 flex flex-col"
          >
            <Component {...rest} />
          </motion.main>
        </AnimatePresence>
      </Layout>
    </>
  )
}
