const fs = require('fs')
const path = require('path')

const pageFolders = {
  blog: 'blog-posts',
  'success-stories': 'success-stories',
  solutions: 'solutions',
  jobs: 'jobs',
}

function getLastModificationDate(pagePath, type) {
  const fileName = pagePath.split('/').pop()

  const contentDirectory = path.join(
    process.cwd(),
    'content',
    pageFolders[type]
  )
  const dirents = fs.readdirSync(contentDirectory, {
    withFileTypes: true,
  })

  const file = dirents.find((dirent) => {
    if (dirent.isFile()) {
      const name = path.parse(dirent.name).name
      return name === fileName
    }
    return false
  })

  if (file) {
    const filePath = path.join(
      process.cwd(),
      'content',
      pageFolders[type],
      file.name
    )
    const stat = fs.statSync(filePath)
    return stat.mtime.toISOString().split('T')[0]
  }
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://cennso.com',
  changefreq: 'monthly',
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  transform(_, pagePath) {
    // landing page - highest priority, check daily
    if (pagePath === '/') {
      return {
        loc: pagePath,
        changefreq: 'daily',
        priority: 1.0,
      }
    }

    // about and contact pages - important, stable content
    if (pagePath === '/about') {
      return {
        loc: pagePath,
        changefreq: 'yearly',
        priority: 0.8,
      }
    }

    if (pagePath === '/contact') {
      return {
        loc: pagePath,
        changefreq: 'yearly',
        priority: 0.8,
      }
    }

    if (pagePath === '/partners') {
      return {
        loc: pagePath,
        changefreq: 'monthly',
        priority: 0.7,
      }
    }

    // blog posts - updated monthly, good SEO value
    if (pagePath.startsWith('/blog')) {
      return {
        loc: pagePath,
        changefreq: 'monthly',
        priority: 0.8,
        lastmod: getLastModificationDate(pagePath, 'blog') || undefined,
      }
    }

    // success stories - high value content, updated monthly
    if (pagePath.startsWith('/success-stories')) {
      return {
        loc: pagePath,
        changefreq: 'monthly',
        priority: 0.8,
        lastmod:
          getLastModificationDate(pagePath, 'success-stories') || undefined,
      }
    }

    // solutions - core service pages, check weekly
    if (pagePath.startsWith('/solutions')) {
      return {
        loc: pagePath,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: getLastModificationDate(pagePath, 'solutions') || undefined,
      }
    }

    // jobs - updated frequently, moderate priority
    if (pagePath.startsWith('/jobs')) {
      return {
        loc: pagePath,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: getLastModificationDate(pagePath, 'jobs') || undefined,
      }
    }

    // other pages - lower priority
    return {
      loc: pagePath,
      changefreq: 'yearly',
      priority: 0.5,
    }
  },
}
