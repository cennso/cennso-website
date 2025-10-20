import type { ISizeCalculationResult } from 'image-size/dist/types/interface'

export interface Author {
  name: string
  position: string
  company: string
  socialLink: string
  email: string
  avatar: string
}

export interface Testimonial {
  author: Author
  content: string
  link?: string
  linkContent?: string
}

export interface Partner {
  name: string
  content: string
  logo: string
  link?: string
  logoSize?: ISizeCalculationResult
}
