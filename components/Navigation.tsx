import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Menu, ThemeToggle } from '@cennso/ui'
import { ChevronDown } from 'lucide-react'

import { Button } from './common'
import { Logo } from './Logo'
import { MenuToggle } from './MenuToogle'
import { useClickOutside } from '../lib/hooks'

import metadata from '../siteMetadata'

import type { FunctionComponent, ReactNode } from 'react'
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
    <div className="relative flex flex-row justify-center w-full max-w-screen py-3 bg-background border-none shadow-none px-8 lg:px-4">
      <nav className="flex flex-row items-center justify-between w-full max-w-screen-2xl py-2">
        <div className="flex-none flex flex-row mr-12">
          <Link title="Home page" href="/">
            <Logo className="w-44 fill-primary" />
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
            } w-full h-auto shadow-none px-8 py-4 xl:p-0 bg-background xl:bg-transparent flex flex-col xl:flex-row items-center xl:gap-1 z-20`}
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
              <ThemeToggle variant="dropdown" />
            </li>
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

/**
 * Builds the `<li>` list for a nav link's children, deferring the whole
 * interactive element to the caller. Each child is ONE element that is both the
 * link and the menu item — not a `Link` wrapping a `Menu.Item`, which would nest
 * a menu-item role inside an anchor and leave navigation and menu focus owned by
 * two different nodes.
 *
 * The desktop dropdown (inside `<Menu>`) uses `Menu.LinkItem`, which renders as
 * the link itself. The mobile accordion is a plain, always-in-flow `<ul>` with no
 * `Menu.Root` ancestor, so it uses a plain `Link`: anything `Menu.*` requires a
 * root it never has, and a disclosure list of links wants link semantics anyway.
 * `renderLeaf` keeps the `className` strings byte-identical across both.
 */
function buildChildItems(
  link: NavigationLink,
  asPath: string,
  toggleOpen: () => void,
  renderLeaf: (props: {
    className: string
    href: string
    onClick: () => void
    target?: string
    children: ReactNode
  }) => ReactNode
): ReactNode[] {
  const items = (link.children ?? []).map((child) => (
    <li key={child.link}>
      {renderLeaf({
        className: `flex items-center gap-3 text-foreground hover:!text-primary-foreground hover:!bg-primary rounded-none lg:rounded-[32px] font-normal lg:font-light text-lg py-1 ${
          asPath.startsWith(child.link)
            ? '!text-primary-foreground !bg-primary lg:rounded-[32px]'
            : ''
        }`,
        href: child.link,
        onClick: () => toggleOpen(),
        target: child.target,
        children: child.title,
      })}
    </li>
  ))

  items.push(
    <li key="show-all" className="block lg:hidden">
      {renderLeaf({
        className: `flex items-center gap-3 text-foreground hover:!text-primary-foreground hover:!bg-primary rounded-none font-normal`,
        href: link.link,
        onClick: () => toggleOpen(),
        target: link.target,
        children: 'Show all...',
      })}
    </li>
  )

  return items
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
      className={`block flex flex-row items-center justify-between gap-1 px-4 py-1.5 border-b border-border xl:border-b-0 w-full xl:w-auto transition-colors duration-300 ease-in-out ${
        asPath.startsWith(link.link)
          ? 'text-primary underline underline-offset-4'
          : 'text-foreground hover:text-primary hover:text-shadow-primary'
      } xl:rounded-full text-lg font-medium font-sans`}
      onClick={() => toggleOpen()}
      target={link.target}
    >
      {link.title}
      {link.children ? (
        <ChevronDown
          strokeWidth={2.5}
          className={`h-6 w-6 transition-transform ${
            isMenuOpen ? 'rotate-180' : ''
          }`}
        />
      ) : null}
    </Link>
  )

  if (link.children) {
    // Menu.LinkItem renders AS the link, so one element owns both navigation and
    // menu semantics. It also needs a Menu.Root ancestor, which the desktop
    // dropdown has and the mobile accordion below never has (and must not get) —
    // hence the leaf is built twice. closeOnClick is explicit because
    // Menu.LinkItem defaults it to false, and a nav menu that stays open after
    // you pick a destination is a bug.
    const desktopItems = buildChildItems(
      link,
      asPath,
      toggleOpen,
      ({ className, href, onClick, target, children }) => (
        <Menu.LinkItem
          closeOnClick
          className={className}
          render={<Link href={href} onClick={onClick} target={target} />}
        >
          {children}
        </Menu.LinkItem>
      )
    )
    const mobileItems = buildChildItems(
      link,
      asPath,
      toggleOpen,
      ({ className, href, onClick, target, children }) => (
        <Link
          className={className}
          href={href}
          onClick={onClick}
          target={target}
        >
          {children}
        </Link>
      )
    )

    return (
      <>
        <div className="hidden lg:block">
          <Menu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <Menu.Trigger
              openOnHover
              render={
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setIsMenuOpen(!isMenuOpen)
                    }
                  }}
                  className="p-0 bg-transparent hover:bg-transparent active:bg-transparent cursor-pointer"
                >
                  {content}
                </div>
              }
              nativeButton={false}
            />
            <Menu.Content
              side="bottom"
              sideOffset={10}
              className="hidden max-w-screen-xl rounded-[32px] lg:block bg-card shadow-none border-border filter drop-shadow-[0px_3px_5px_rgba(68,141,200,0.35)] p-2"
            >
              <ul className="flex flex-col gap-0 outline-none outline-0">
                {desktopItems}
              </ul>
            </Menu.Content>
          </Menu>
        </div>
        <div className="block lg:hidden">
          <div
            className={`block flex flex-row items-center justify-between gap-1 px-4 py-1.5 border-b border-border xl:border-b-0 w-full xl:w-auto transition-colors duration-300 ease-in-out ${
              asPath.startsWith(link.link)
                ? 'text-primary underline underline-offset-4'
                : 'text-foreground hover:text-primary hover:text-shadow-primary'
            } xl:rounded-full text-base text-lg font-medium cursor-pointer`}
            onClick={() => setIsMobileMenuOpen((cur) => !cur)}
          >
            {link.title}
            {link.children ? (
              <ChevronDown
                strokeWidth={2.5}
                className={`h-6 w-6 transition-transform ${
                  isMobileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            ) : null}
          </div>
          <ul
            className={`${isMobileMenuOpen ? 'flex' : 'hidden'} flex-col gap-1 outline-none outline-0 ml-6 mt-1`}
          >
            {mobileItems}
          </ul>
        </div>
      </>
    )
  }

  return content
}
