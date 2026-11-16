const siteMetadata = {
  // The site's name: what every tab title ends with ("Contact · Cennso") and
  // what link previews call the site (`og:site_name`).
  title: 'Cennso',
  // The company's slogan, for what machines read about the site: the
  // Organization's `slogan` in structured data and the summary in llms.txt.
  // People read it as the home page's headline and on its preview card, both
  // written in content/landing-page.yaml (`hero.headline`, `page.og.title`) -
  // change all three together.
  slogan: 'Build Network Solutions. Anywhere.',
  // Another name the site goes by, for the WebSite in structured data.
  alternateName: 'Cennso Technologies',
  // What the company does, in one sentence: the Organization's description in
  // structured data and the summary of llms.txt. The home page's meta
  // description says the same (content/landing-page.yaml, `page.description`).
  description:
    'Cennso lets you deploy 5G anywhere - build MVNOs, travel SIM solutions, or private networks with seamless interoperability and centralized control today.',
  author: 'Cennso Technologies GmbH',
  language: 'en-us',
  locale: 'en-US',
  siteUrl: 'https://www.cennso.com',
  siteLogo: '/logo.svg',
  companyName: 'Cennso Technologies GmbH',
  // Cennso Technologies GmbH's own contact details, as its imprint gives them
  // (the same as the PDFs and the cloud portal print). The number on the
  // contact page's solution-provider card is Travelping's, not this one.
  contact: {
    phone: '+49 (0) 391 – 660 999 99',
    // The same number as a `tel:` link and structured data write it (E.164).
    tel: '+4939166099999',
    email: 'info@cennso.com',
    address: {
      place: [
        'Cennso Technologies GmbH',
        'Südstraße 6',
        '39179 Barleben',
        'Germany',
      ],
      streetAddress: 'Südstraße 6',
      postalCode: '39179',
      addressLocality: 'Barleben',
      // ISO 3166-1 alpha-2, as schema.org's PostalAddress takes it.
      addressCountry: 'DE',
      googleMaps:
        'https://www.google.com/maps/place/S%C3%BCdstra%C3%9Fe+6,+39179+Barleben,+Germany/@52.1991585,11.6199481,17z/data=!3m1!4b1!4m6!3m5!1s0x47af5e898a2f52a9:0x819e861701827256!8m2!3d52.1991585!4d11.622523!16s%2Fg%2F11c4kj5w9j!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D',
    },
    // As the imprint gives it (content/imprint.md).
    vatID: 'DE250071497',
  },
  social: {
    // What the footer draws an icon for.
    platforms: {
      linkedIn: 'https://www.linkedin.com/company/cennso-technologies/',
    },
    // The company's own profiles elsewhere: the Organization's `sameAs`.
    profiles: [
      'https://github.com/cennso',
      'https://www.linkedin.com/company/cennso-technologies',
    ],
  },
  explore: {
    cloudPortal: 'https://cloud.cennso.com/',
    documentationPortal: 'https://docs.cennso.com/',
    // What llms.txt says about the documentation: that it is there, not here,
    // and where its own llms.txt is.
    documentation: {
      name: 'Cennso Documentation',
      llms: 'https://docs.cennso.com/llms.txt',
      description:
        'Guides, references and release notes for Cennso components and solutions: requirements, installation, configuration, operation and what changed in each release.',
    },
  },
}

export default siteMetadata
