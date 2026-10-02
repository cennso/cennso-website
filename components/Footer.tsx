import Link from 'next/link'

import { CONTENT_MEASURE } from './common'
import { Logo } from './Logo'

import type { FunctionComponent } from 'react'
import type { FooterData } from '../lib/footer'

/**
 * The footer's link type. Every link column in both Footer nodes (dark 1:579 /
 * 1:580 / 1:581, light 1:7583 / 1:7584 / 1:7585) is Poppins Regular 15px on a
 * 24px line box in white - one step under the 16px these links inherited from
 * the body. The 18px SemiBold column headings and the 14px copyright below are
 * already the frames' own and do not move with it. From lg up there is no
 * vertical padding: the frames stack the links 24px line on 24px line with a
 * small step between. Below lg each link keeps 6px above and below, a 36px
 * tap target (halved from 12px at the owner's request). Packed at 24px they
 * sat too close for a finger and Lighthouse's mobile tap-targets audit failed
 * them; 36px clears WCAG 2.2's 24px minimum but is under the audit's 48px.
 */
const LINK_CLASS =
  'flex flex-row items-center text-[15px] leading-6 text-white underline-offset-4 hover:underline py-1.5 lg:py-0'

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
    // The top rule is dark-only, and it is what makes the footer a footer
    // there: the dark footer carries no fill, so the band is the page's own
    // plate continuing to the bottom edge, and the only thing dividing the two
    // is this rule. It is the same 1px `border-border/50` the header draws
    // under itself (see Navigation), minus the header's glow. The light footer
    // needs none: its #0d406a plate already separates itself from the page.
    <div className="flex flex-row justify-center w-full max-w-screen py-6 bg-footer px-6 lg:px-4 font-normal dark:border-t dark:border-border/50">
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
          <li className="col-span-2 lg:col-auto flex flex-col gap-3 lg:mb-0 mb-8">
            <h2 className="font-semibold text-lg text-white">Company</h2>
            <ul className="grid grid-rows-2 grid-flow-col gap-x-12 gap-y-0.5">
              {footerLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    className={LINK_CLASS + ' lg:min-w-[125px]'}
                  >
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="flex flex-col gap-3 mb-2 md:mb-0">
            <h2 className="font-semibold text-lg text-white">Explore</h2>
            <ul className="flex flex-col gap-0.5">
              {exploreLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    className={LINK_CLASS + ' gap-2'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="flex flex-col gap-3 mb-2 md:mb-0">
            <h2 className="font-semibold text-lg text-white">AI / LLM</h2>
            <ul className="flex flex-col gap-0.5">
              {llmLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    aria-label={link.ariaLabel}
                    className={LINK_CLASS + ' gap-2'}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          {/* <li className="flex flex-col gap-4 mb-2 md:mb-0 w-[205px]">
            <h2 className="font-semibold text-lg text-white border-b pb-1 border-transparent">
              Social
            </h2>
            <ul className="flex flex-col gap-0.5">
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
