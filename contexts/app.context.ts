import type { ReactNode } from 'react'

export type NavigationLink = {
  title: string
  link: string
  target?: string
  children?: Array<Omit<NavigationLink, 'children'>>
}

export type FooterLink = {
  title: string
  link: string
  icon?: ReactNode
  target?: string
  ariaLabel?: string
}
