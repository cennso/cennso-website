import { FaLinkedin, FaYoutube } from 'react-icons/fa'

import siteMetadata from '../siteMetadata'

import type { ReactNode } from 'react'

type SocialLink = {
  title: string
  link: string
  icon: ReactNode
}

const mapping: Record<string, Omit<SocialLink, 'link'>> = {
  linkedIn: {
    title: 'LinkedIn',
    icon: <FaLinkedin className="w-5 h-5" />,
  },
  youtube: {
    title: 'YouTube',
    icon: <FaYoutube className="w-5 h-5" />,
  },
}

export function createSocialLinks(): SocialLink[] {
  return Object.entries(siteMetadata.social.platforms).map(
    ([platform, link]) => ({
      ...mapping[platform],
      link,
    })
  )
}
