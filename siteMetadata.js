const siteMetadata = {
  title: 'Mobile Core: Built faster, performs better, costs less.',
  description:
    'Our Mobile Core is engineered to accelerate time-to-market, giving you the agility to launch faster than ever. With optimized performance, it delivers seamless reliability and scale to meet the demands of modern networks. And by reducing operational costs, it ensures long-term efficiency without compromising quality—so you can grow smarter, faster, and more cost-effectively.',
  author: 'Cennso Technologies GmbH',
  language: 'en-us',
  locale: 'en-US',
  theme: 'light',
  siteUrl: 'https://cennso.com',
  siteLogo: '/logo.svg',
  socialBanner: '/assets/thumbnails/cennso-thumbnail.webp',
  companyName: 'Cennso Technologies GmbH',
  contact: {
    phone: '+49 (391) 660 98560',
    email: 'info@cennso.com',
    address: {
      place: [
        'Cennso Technologies GmbH',
        'Südstr. 6',
        '39179 Barleben',
        'Germany',
      ],
      googleMaps:
        'https://www.google.com/maps/place/S%C3%BCdstra%C3%9Fe+6,+39179+Barleben,+Germany/@52.1991585,11.6199481,17z/data=!3m1!4b1!4m6!3m5!1s0x47af5e898a2f52a9:0x819e861701827256!8m2!3d52.1991585!4d11.622523!16s%2Fg%2F11c4kj5w9j!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D',
    },
  },
  social: {
    platforms: {
      linkedIn: 'https://www.linkedin.com/company/cennso-technologies/',
    },
  },
  explore: {
    cloudPortal: 'https://cloud.cennso.com',
    documentationPortal: 'https://docs.cennso.com',
  },
}

// Generate Organization schema from existing metadata to avoid duplication
siteMetadata.organization = {
  '@type': 'Organization',
  name: siteMetadata.companyName,
  url: siteMetadata.siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${siteMetadata.siteUrl}${siteMetadata.siteLogo}`,
    width: 372,
    height: 73,
  },
  description: siteMetadata.description,
  email: siteMetadata.contact.email,
  telephone: siteMetadata.contact.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Südstr. 6',
    addressLocality: 'Barleben',
    postalCode: '39179',
    addressCountry: 'DE',
  },
  sameAs: [siteMetadata.social.platforms.linkedIn],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: siteMetadata.contact.phone,
    contactType: 'customer service',
    email: siteMetadata.contact.email,
    areaServed: 'DE',
    availableLanguage: ['en', 'de'],
  },
}

export default siteMetadata
