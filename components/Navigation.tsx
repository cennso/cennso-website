import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NavigationMenu, ThemeToggle } from '@cennso/ui'
import { ChevronDown } from 'lucide-react'

import metadata from '../siteMetadata'
import { ButtonChevron, CONTENT_MEASURE } from './common'
import { Logo } from './Logo'
import { MenuToggle } from './MenuToogle'
import { useClickOutside } from '../lib/hooks'

import type { FunctionComponent, ReactNode } from 'react'
import type { NavigationLink } from '../contexts'

/**
 * The header's own call to action, as drawn in the Design 4.0 Header symbol
 * (Figma 1:107 dark / 1:4534 light - the symbol nobody expanded, which is how
 * a "Sign in" pill ended up here instead). The two palettes draw it
 * differently, so this is not one of `@cennso/ui`'s Button variants:
 *
 * - dark  (1:107): page-coloured fill, 1px `#ffb31b` border, `#ffb31b` label
 * - light (1:4534): solid `#185f99` fill, white label, no border
 *
 * Every literal below is the frame's: 37px radius (`rounded-btn`), 16px
 * horizontal padding, 9px gap, Poppins Medium 18px, 36px tall. `dark:` resolves
 * to `:root:not([data-theme="light"])` via the theme preset, so the dark
 * treatment is the one that survives if the attribute is ever missing - which
 * matches `defaultSetting="dark"`.
 */
const NAV_CTA_CLASS = [
  'inline-flex h-9 items-center gap-[9px] rounded-btn border px-4',
  'text-lg font-medium transition-colors',
  // Light: #185F99 fill and border, white label; #FF6D12 on hover (owner's
  // call). The label and chevron stay white on both.
  'border-[#185f99] bg-[#185f99] text-white',
  'hover:border-[#ff6d12] hover:bg-[#ff6d12] hover:text-white',
  // Dark keeps the frame's outline pill. Marked important (`!`): each dark
  // rule has the same specificity as its light twin (the dark variant's
  // :where() adds none), so without it build order picked the winner.
  'dark:border-primary! dark:bg-background! dark:text-primary!',
  // Dark hover: amber #FFB31B (the dark frame's own #ffb31b) fill and
  // border, dark navy #081927 label; the chevron follows via currentColor.
  'dark:hover:border-[#ffb31b]! dark:hover:bg-[#ffb31b]! dark:hover:text-[#081927]!',
].join(' ')

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
    // The header band is its own surface, not the page plate. All three light
    // frames paint the Header symbol #ffffff (1:4530 main, 1:1543 use cases,
    // 1:7570 contact) over a page plate that is #e1eaf0 - leaving it on
    // `bg-background` alone painted the band that plate colour, which is the
    // only visually obvious mismatch of the set. The dark frames' Header
    // symbol (1:99 on 1:9) carries no fill of its own, so there the band IS
    // the page plate (#001a2a vs the token's #001929) - hence
    // `dark:bg-background` rather than a second literal. `dark:` resolves to
    // `:root:not([data-theme="light"])` via the theme preset, so the dark
    // treatment survives a missing attribute, matching `defaultSetting="dark"`.
    // White raises the light-theme nav link and wordmark contrast (both
    // #185f99) from 5.49:1 to 6.70:1, so nothing loses headroom by this.
    //
    // Dark glow: copied 1:1 from cennso/cloud's TOPBAR_SURFACE (cloud-portal
    // and docs-portal chrome-surfaces.ts) - the same border-border/50 rule
    // under the bar and an ::after hung off its lower edge, one radial
    // gradient of --glow-blue sourced at the middle of that edge. `relative`
    // makes this div the ::after's containing block.
    <div className="relative flex flex-row justify-center w-full max-w-screen py-3 bg-white dark:bg-background shadow-none px-6 lg:px-4 dark:border-border/50 dark:border-b dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:top-full dark:after:h-8 dark:after:bg-[image:radial-gradient(50%_100%_at_50%_0%,hsl(var(--glow-blue)/0.30)_0%,transparent_70%)]">
      <nav
        className={`flex flex-row items-center justify-between w-full ${CONTENT_MEASURE} py-2`}
      >
        <div className="flex-none flex flex-row mr-12">
          <Link title="Home page" href="/">
            {/* Figma 1:111 renders the wordmark white on the dark frame and
                `#185f99` (= --primary in the light palette) on the light one.
                `fill-primary` alone painted it gold in dark, because --primary
                is the amber accent there. */}
            <Logo className="w-44 fill-primary dark:fill-white" />
          </Link>
        </div>

        <div ref={menuRef}>
          <div className="relative flex flex-row items-center block xl:hidden z-30">
            <MenuToggle toggle={() => setIsOpen(!isOpen)} isOpen={isOpen} />
          </div>

          {/* Below xl this list IS the dropped-down header panel, hanging
              straight off the band above it, so it takes the band's own
              surface rather than the page plate - otherwise the light theme
              shows an #e1eaf0 panel seamed onto a white bar. At xl it is
              inline in the bar and transparent, as before. */}
          <ul
            className={`absolute top-18 xl:top-0 left-0 right-0 xl:relative transition-all duration-300 ease-in-out ${
              isOpen
                ? 'opacity-100'
                : 'opacity-0 -translate-y-[calc(100%+4.5rem)] xl:opacity-100 xl:translate-y-0'
            } w-full h-auto shadow-none px-6 py-4 xl:p-0 bg-white dark:bg-background xl:bg-transparent flex flex-col xl:flex-row items-center xl:gap-1 z-20`}
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
            {/* The Contact link before it carries 16px of its own padding, so
                the list's 4px gap already makes 20px to the pill. */}
            <li className="mt-4 xl:mt-0 font-normal">
              <Link
                href={metadata.explore.cloudPortal}
                target="_blank"
                rel="noopener noreferrer"
                className={NAV_CTA_CLASS}
              >
                Sign In
                <ButtonChevron />
              </Link>
            </li>
            {/* Last in the bar. xl:ml-4 matches the 20px on the pill's other
                side. icon-lg is control-height-lg, the same 36px the Sign In
                pill stands, so the hover wash is the pill's height rather than
                a smaller square next to it. */}
            <li className="mt-4 xl:mt-0 xl:ml-4 font-normal">
              {/* align="center" centres the menu under the moon icon; the
                  library default ("end") lines its right edge up with the
                  button's instead. */}
              <ThemeToggle
                variant="dropdown"
                size="icon-lg"
                align="center"
                className="rounded-full"
              />
            </li>
          </ul>
        </div>
      </nav>
    </div>
  )
}

/** The top-level nav entry's look, shared by the plain link, the dropdown
 * trigger and the mobile accordion header so the three stay identical. */
/**
 * Active page, desktop bar (xl+): no underline; instead a 5px rectangle as wide
 * as the item's text (inset-x-4 cancels its px-4), sitting flush on the header band's bottom edge - #185F99 light,
 * #FFB31B dark. It hangs off the item (`relative` + `::after`), so it needs the
 * distance from the item's bottom to the band's: the band's py-3 plus the
 * nav's py-2 is 20px, and the dark band adds its 1px
 * `border-b`, which the bar covers. The mobile accordion keeps the underline,
 * since its items are stacked rows with no bar edge to sit on.
 */
const ACTIVE_BAR =
  'xl:no-underline xl:relative xl:after:absolute xl:after:inset-x-4 xl:after:-bottom-5 xl:after:h-[5px] xl:after:bg-[#185f99] dark:xl:after:-bottom-[21px] dark:xl:after:bg-[#ffb31b]'

function topLevelClass(active: boolean): string {
  return `block flex flex-row items-center justify-between gap-1 px-4 py-1.5 border-b border-border xl:border-b-0 w-full xl:w-auto transition-colors duration-300 ease-in-out ${
    active
      ? `text-primary underline underline-offset-4 ${ACTIVE_BAR}`
      : // Hover: #FF6D12 in light (owner's call), the theme's --primary
        // (amber) in dark, as before. The 1px #1D75BC text-shadow glow is
        // dark-only: on the light bar it read as a blue outline.
        'text-foreground hover:text-[#ff6d12] dark:hover:text-primary! dark:hover:text-shadow-primary'
  } xl:rounded-full text-lg font-medium font-sans`
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
 * Used by the mobile accordion only; the desktop dropdown is a
 * `NavigationMenu` with the design system's own styling.
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
        className: `flex items-center gap-3 text-foreground hover:text-primary-foreground! hover:bg-primary! rounded-none lg:rounded-[32px] font-normal lg:font-light text-lg py-1 ${
          asPath.startsWith(child.link)
            ? 'text-primary-foreground! bg-primary! lg:rounded-[32px]'
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
    <li key="show-all">
      {renderLeaf({
        className: `flex items-center gap-3 text-foreground hover:text-primary-foreground! hover:bg-primary! rounded-none font-normal`,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isActive = asPath.startsWith(link.link)

  const content = (
    <Link
      href={link.link}
      className={topLevelClass(isActive)}
      onClick={() => toggleOpen()}
      target={link.target}
    >
      {link.title}
    </Link>
  )

  if (link.children) {
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
        {/* Root renders a <nav> by default; this already sits inside the
            header's <nav>, so it is a <div> here to avoid nesting landmarks. */}
        <NavigationMenu render={<div />} className="hidden lg:flex">
          <NavigationMenu.List>
            <NavigationMenu.Item>
              <NavigationMenu.Trigger
                className={`${topLevelClass(isActive)} rounded-none hover:bg-transparent data-popup-open:bg-transparent data-popup-open:text-[#ff6d12] dark:data-popup-open:text-primary! cursor-pointer`}
                icon={<ChevronDown strokeWidth={2.5} className="h-6 w-6" />}
              >
                {link.title}
              </NavigationMenu.Trigger>
              <NavigationMenu.Content>
                {/* closeOnClick is explicit because it defaults to false, and
                    a nav menu that stays open after you pick a destination is
                    a bug. The trigger is a button, so "Show all..." is the
                    desktop path to the index page. */}
                <ul className="flex w-max flex-col">
                  {[
                    ...(link.children ?? []),
                    { title: 'Show all...', link: link.link },
                  ].map((child) => (
                    <li key={child.link}>
                      <NavigationMenu.Link
                        closeOnClick
                        active={asPath === child.link}
                        render={<Link href={child.link} />}
                      >
                        {child.title}
                      </NavigationMenu.Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          </NavigationMenu.List>
          <NavigationMenu.Panel />
        </NavigationMenu>
        <div className="block lg:hidden">
          <div
            className={`${topLevelClass(isActive)} cursor-pointer`}
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
            className={`${isMobileMenuOpen ? 'flex' : 'hidden'} flex-col gap-1 outline-hidden outline-0 ml-6 mt-1`}
          >
            {mobileItems}
          </ul>
        </div>
      </>
    )
  }

  return content
}
