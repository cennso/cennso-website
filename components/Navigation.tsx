import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Menu, MenuHandler, MenuList, MenuItem } from '@material-tailwind/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

import { Button } from './common'
import { Logo } from './Logo'
import { MenuToggle } from './MenuToogle'
import { useClickOutside } from '../lib/hooks'

import metadata from '../siteMetadata'

import type { FunctionComponent } from 'react'
import type { NavigationLink } from '../contexts'

interface NavigationProps {
  navigation: NavigationLink[]
}

export const Navigation: FunctionComponent<NavigationProps> = ({
  navigation = [],
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  useClickOutside(menuRef, () => setIsOpen(false))

  return (
    <div className="relative flex flex-row justify-center w-full max-w-screen py-3 bg-white border-none shadow-lg px-8 lg:px-4">
      <nav className="flex flex-row items-center justify-between w-full max-w-screen-2xl py-2">
        <div className="flex-none flex flex-row mr-12">
          <Link title="Home page" href="/">
            <Logo className="w-44 fill-[#185f99]" />
          </Link>
        </div>

        <div ref={menuRef}>
          <div className="relative flex flex-row items-center block xl:hidden z-30">
            <MenuToggle toggle={() => setIsOpen(!isOpen)} isOpen={isOpen} />
          </div>

          <ul
            className={`absolute top-[4.5rem] xl:top-0 left-0 right-0 xl:relative transition-all duration-300 ease-in-out ${
              isOpen
                ? 'opacity-100'
                : 'opacity-0 -translate-y-[calc(100%+4.5rem)] xl:opacity-100 xl:translate-y-0'
            } w-full h-auto shadow-2xl xl:shadow-none shadow-primary-400 px-8 py-4 xl:p-0 bg-white xl:bg-transparent flex flex-col xl:flex-row items-center xl:gap-1 z-20`}
          >
            {navigation.map((link) => (
              <li
                key={link.title}
                className="w-full xl:w-auto text-lg font-normal"
              >
                <NavigationItem
                  link={link}
                  toggleOpen={() => setIsOpen(false)}
                />
              </li>
            ))}
            <li className="mt-4 xl:mt-0 font-normal">
              <Link href={metadata.explore.cloudPortal} target="_blank">
                <Button
                  variant="primary"
                  className="flex flex-row items-center gap-2"
                >
                  <Image
                    src="/assets/common/cloud.svg"
                    alt="Cloud icon"
                    title="Cloud icon"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                    sizes="24px"
                  />
                  Sign in
                </Button>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  )
}

interface NavigationItemProps {
  link: NavigationLink
  toggleOpen: () => void
}

const NavigationItem: FunctionComponent<NavigationItemProps> = ({
  link,
  toggleOpen,
}) => {
  const { asPath } = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const content = (
    <Link
      href={link.link}
      className={`block flex flex-row items-center justify-between gap-1 px-4 py-1.5 border-b border-primary-400 xl:border-b-0 w-full xl:w-auto transition-colors duration-300 ease-in-out ${
        asPath.startsWith(link.link)
          ? 'bg-[#185F99] text-white'
          : 'hover:bg-[#185F99] hover:text-shadow-primary text-[#185F99] hover:text-white'
      } xl:rounded-full text-lg font-medium font-sans`}
      onClick={() => toggleOpen()}
      target={link.target}
    >
      {link.title}
      {link.children ? (
        <ChevronDownIcon
          strokeWidth={2.5}
          className={`h-6 w-6 transition-transform ${
            isMenuOpen ? 'rotate-180' : ''
          }`}
        />
      ) : null}
    </Link>
  )

  if (link.children) {
    const items = link.children.map((child) => (
      <li key={child.link}>
        <Link
          href={child.link}
          onClick={() => toggleOpen()}
          target={child.target}
        >
          <MenuItem
            className={`flex items-center gap-3 text-[#185F99] lg:text-white hover:text-secondary-200 hover:!bg-[#185F99] lg:hover:!text-secondary-200 rounded-none lg:rounded-[32px] font-normal lg:font-light text-lg py-1 ${
              asPath.startsWith(child.link)
                ? 'text-secondary-200 !bg-[#185F99] lg:!text-secondary-200 lg:rounded-[32px]'
                : ''
            }`}
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            {child.title}
          </MenuItem>
        </Link>
      </li>
    ))

    items.push(
      <li key="show-all" className="block lg:hidden">
        <Link
          href={link.link}
          onClick={() => toggleOpen()}
          target={link.target}
        >
          <MenuItem
            className={`flex items-center gap-3 text-[#185F99] hover:text-secondary-200 hover:!bg-[#185F99] rounded-none font-normal`}
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            Show all...
          </MenuItem>
        </Link>
      </li>
    )

    return (
      <>
        <div className="hidden lg:block">
          <Menu
            open={isMenuOpen}
            handler={setIsMenuOpen}
            allowHover={true}
            offset={{ mainAxis: 10 }}
            placement="bottom"
          >
            <MenuHandler>
              <div
                role="button"
                tabIndex={0}
                className="p-0 bg-transparent hover:bg-transparent active:bg-transparent cursor-pointer"
              >
                {content}
              </div>
            </MenuHandler>
            <MenuList
              className="hidden max-w-screen-xl rounded-[32px] lg:block bg-[#185F99] shadow-none border-[#185F99] filter drop-shadow-[0px_3px_5px_rgba(68,141,200,0.35)] p-2"
              placeholder={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              <ul
                className="flex flex-col gap-0 outline-none outline-0"
                role="menu"
              >
                {items}
              </ul>
            </MenuList>
          </Menu>
        </div>
        <div className="block lg:hidden">
          <div
            className={`block flex flex-row items-center justify-between gap-1 px-4 py-1.5 border-b border-primary-400 xl:border-b-0 w-full xl:w-auto transition-colors duration-300 ease-in-out ${
              asPath.startsWith(link.link)
                ? 'bg-[#185F99] text-secondary-200'
                : 'hover:bg-[#185F99] hover:text-shadow-primary hover:text-secondary-200'
            } xl:rounded-full text-[#185F99] text-base text-lg font-medium cursor-pointer`}
            onClick={() => setIsMobileMenuOpen((cur) => !cur)}
          >
            {link.title}
            {link.children ? (
              <ChevronDownIcon
                strokeWidth={2.5}
                className={`h-6 w-6 transition-transform ${
                  isMobileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            ) : null}
          </div>
          <ul
            className={`${isMobileMenuOpen ? 'flex' : 'hidden'} flex-col gap-1 outline-none outline-0 ml-6 mt-1`}
            role="menu"
          >
            {items}
          </ul>
        </div>
      </>
    )
  }

  return content
}
