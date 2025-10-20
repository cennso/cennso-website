import { FooterLink } from '../contexts'

export function createFooterLinks(): FooterLink[] {
  return [
    {
      title: 'Success Stories',
      link: '/success-stories',
    },
    // {
    //   title: 'Solutions',
    //   link: '/solutions',
    // },
    // {
    //   title: 'About Us',
    //   link: '/about',
    // },
    {
      title: 'Contact Us',
      link: '/contact',
    },
    // {
    //   title: 'Jobs',
    //   link: '/jobs',
    // },
    // {
    //   title: 'Blog',
    //   link: '/blog',
    // },
    // {
    //   title: 'Partners',
    //   link: '/partners',
    // },
    {
      title: 'Privacy Policy',
      link: '/privacy-policy',
    },
    {
      title: 'Imprint',
      link: '/imprint',
    },
  ]
}
