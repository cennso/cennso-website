import siteMetadata from '../siteMetadata'

import type { ReactNode, FunctionComponent, SVGProps } from 'react'

type SocialLink = {
  title: string
  link: string
  icon: ReactNode
}

// lucide-react intentionally ships no brand/logo marks (LinkedIn, YouTube,
// etc. are excluded on trademark grounds, matching Feather's upstream
// policy), so these two brand glyphs are authored locally instead of
// imported from a second icon set. Sized and stroked to match the lucide
// icons used elsewhere (24x24 viewBox, currentColor).
const LinkedInIcon: FunctionComponent<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.114 20.452H3.558V9h3.556v11.452z" />
  </svg>
)

const YouTubeIcon: FunctionComponent<SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M21.582 7.186a2.51 2.51 0 0 0-1.768-1.775C18.254 5 12 5 12 5s-6.254 0-7.814.411A2.51 2.51 0 0 0 2.418 7.186 26.28 26.28 0 0 0 2 12a26.28 26.28 0 0 0 .418 4.814 2.51 2.51 0 0 0 1.768 1.775C5.746 19 12 19 12 19s6.254 0 7.814-.411a2.51 2.51 0 0 0 1.768-1.775A26.28 26.28 0 0 0 22 12a26.28 26.28 0 0 0-.418-4.814ZM9.955 15.005V8.995L15.818 12l-5.863 3.005Z" />
  </svg>
)

const mapping: Record<string, Omit<SocialLink, 'link'>> = {
  linkedIn: {
    title: 'LinkedIn',
    icon: <LinkedInIcon className="w-5 h-5" />,
  },
  youtube: {
    title: 'YouTube',
    icon: <YouTubeIcon className="w-5 h-5" />,
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
