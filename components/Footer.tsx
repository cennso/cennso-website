import Link from 'next/link'

import { CONTENT_MEASURE } from './common'
import { Logo } from './Logo'

import type { FunctionComponent } from 'react'
import type { FooterData } from '../lib/footer'

interface FooterProps {
  footerData?: FooterData
}

export const Footer: FunctionComponent<FooterProps> = ({ footerData }) => {
  const year = new Date().getFullYear()

  // Provide fallback empty data if footerData is not provided
  const defaultFooterData = {
    footerLinks: [],
    exploreLinks: [],
    llmLinks: [],
    copyright: {
      yearPrefix: 'Copyright ©',
      companySuffix: 'CENNSO',
      rights: 'All rights reserved',
    },
  }

  const { footerLinks, exploreLinks, llmLinks, copyright } =
    footerData || defaultFooterData

  return (
    // The 2px top rule is dark-only, and it is what makes the footer a footer
    // there: the dark frame's Footer symbol (1:575) carries no fill, so the
    // band is the page's own plate continuing to the bottom edge, and the only
    // thing dividing the two is the rule the symbol draws across its own top
    // (1:582, 1360x2, #284467). The light frame's footer (1:7579) has no such
    // node - it does not need one, because its #0d406a plate already separates
    // itself from the light page. Written as a literal for the same reason the
    // "Why Cennso?" outlines are: no theme token carries it (dark --border is
    // #0c446e, a different colour). Decorative, so no contrast floor applies.
    <div className="flex flex-row justify-center w-full max-w-screen py-6 bg-footer px-8 lg:px-4 font-light dark:border-t-2 dark:border-t-[#284467]">
      {/* Same content measure as Container/Navigation, so the footer wordmark
          lines up with the header's and with every page heading - the frames
          put both logos on the page's own gutter (1:584 at x=81). */}
      <footer
        className={`relative flex flex-col xl:flex-row justify-between 2xl:justify-between w-full ${CONTENT_MEASURE} pt-4 pb-8 gap-8 2xl:gap-32`}
      >
        <div className="flex flex-col order-last xl:order-0 mt-0 2xl:mt-2">
          <Logo className="w-44 fill-white" />
          <div className="flex flex-col mt-4 text-white text-sm">
            <span>{`${copyright.yearPrefix} ${year} ${copyright.companySuffix}`}</span>
            <span>{copyright.rights}</span>
          </div>
        </div>

        <ul className="grid grid-cols-2 lg:grid-cols-3 xl:flex gap-16 gap-y-0 lg:gap-32 xl:gap-16 2xl:gap-32 mb-8 md:mb-0">
          <li className="col-span-2 lg:col-auto flex flex-col gap-4 lg:mb-0 mb-8">
            <h2 className="font-bold text-lg text-white border-b pb-1 border-white">
              Company
            </h2>
            <ul className="grid grid-rows-2 grid-flow-col gap-x-12 gap-y-1">
              {footerLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    className="flex flex-row items-center text-white hover:text-secondary-200 transition-colors duration-300 ease-in-out lg:min-w-[125px] py-3"
                  >
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="flex flex-col gap-4 mb-2 md:mb-0">
            <h2 className="font-bold text-lg text-white border-b pb-1 border-white">
              Explore
            </h2>
            <ul className="flex flex-col gap-1">
              {exploreLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    className="flex flex-row items-center gap-2 text-white hover:text-secondary-200 transition-colors duration-300 ease-in-out py-3"
                    target={link.target}
                  >
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="flex flex-col gap-4 mb-2 md:mb-0">
            <h2 className="font-bold text-lg text-white border-b pb-1 border-white">
              AI / LLM
            </h2>
            <ul className="flex flex-col gap-1">
              {llmLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    aria-label={link.ariaLabel}
                    className="flex flex-row items-center gap-2 text-white hover:text-secondary-200 transition-colors duration-300 ease-in-out py-3"
                  >
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          {/* <li className="flex flex-col gap-4 mb-2 md:mb-0 w-[205px]">
            <h2 className="font-bold text-lg text-white border-b pb-1 border-transparent">
              Social
            </h2>
            <ul className="flex flex-col gap-1">
              {socialLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    className="flex flex-row items-center gap-2 text-white hover:text-secondary-200 transition-colors duration-300 ease-in-out"
                    target="_blank"
                  >
                    {link.icon}
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li> */}
        </ul>
      </footer>
    </div>
  )
}
