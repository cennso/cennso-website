import { useMemo } from 'react'
import Link from 'next/link'

import { Logo } from './Logo'
import { createFooterLinks } from '../lib/footer'
// import { createSocialLinks } from '../lib/social-links'

import metadata from '../siteMetadata'

import type { FunctionComponent } from 'react'
import type { FooterLink } from '../contexts/app.context'

interface FooterProps {}

export const Footer: FunctionComponent<FooterProps> = () => {
  const year = new Date().getFullYear()
  const companyLinks = createFooterLinks()
  // const socialLinks = createSocialLinks()

  const exloreLinks: FooterLink[] = useMemo(() => {
    return [
      {
        title: 'Cloud Portal',
        link: metadata.explore.cloudPortal,
        target: '_blank',
      },
      {
        title: 'Documentation',
        link: metadata.explore.documentationPortal,
        target: '_blank',
      },
    ]
  }, [])

  return (
    <div className="flex flex-row justify-center w-full max-w-screen py-6 bg-secondary-600 px-8 lg:px-4 font-light">
      <footer className="relative flex flex-col xl:flex-row justify-between 2xl:justify-between w-full max-w-screen-2xl pt-4 pb-8 gap-8 2xl:gap-32">
        <div className="flex flex-col order-last xl:order-none mt-0 2xl:mt-2">
          <Logo className="w-44 fill-white" />
          <div className="flex flex-col mt-4 text-white text-sm">
            <span>Copyright © {year} CENNSO</span>
            <span>All rights reserved</span>
          </div>
        </div>

        <ul className="grid grid-cols-2 lg:grid-cols-3 xl:flex gap-16 gap-y-0 lg:gap-32 xl:gap-16 2xl:gap-32 mb-8 md:mb-0">
          <li className="col-span-2 lg:col-auto flex flex-col gap-4 lg:mb-0 mb-8">
            <h4 className="font-bold text-lg text-white border-b-[1px] pb-1 border-white">
              Company
            </h4>
            <ul className="grid grid-rows-2 grid-flow-col gap-x-12 gap-y-1">
              {companyLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    className="flex flex-row items-center text-white hover:text-secondary-200 transition-colors duration-300 ease-in-out lg:min-w-[125px]"
                  >
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className="flex flex-col gap-4 mb-2 md:mb-0 w-[205px]">
            <h4 className="font-bold text-lg text-white border-b-[1px] pb-1 border-transparent">
              Explore
            </h4>
            <ul className="flex flex-col gap-1">
              {exloreLinks.map((link) => (
                <li key={link.title}>
                  <Link
                    title={link.title}
                    href={link.link}
                    className="flex flex-row items-center gap-2 text-white hover:text-secondary-200 transition-colors duration-300 ease-in-out"
                    target={link.target}
                  >
                    <span>{link.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          {/* <li className="flex flex-col gap-4 mb-2 md:mb-0 w-[205px]">
            <h4 className="font-bold text-lg text-white border-b-[1px] pb-1 border-transparent">
              Social
            </h4>
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
