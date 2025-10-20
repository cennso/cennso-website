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
    // landing page
    if (pagePath === '/') {
      return {
        loc: pagePath,
        changefreq: 'monthly',
        priority: 1,
      }
    }

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

    if (pagePath.startsWith('/blog')) {
      return {
        loc: pagePath,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: getLastModificationDate(pagePath, 'blog') || undefined,
      }
    }

    if (pagePath.startsWith('/success-stories')) {
      return {
        loc: pagePath,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod:
          getLastModificationDate(pagePath, 'success-stories') || undefined,
      }
    }

    if (pagePath.startsWith('/solutions')) {
      return {
        loc: pagePath,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: getLastModificationDate(pagePath, 'solutions') || undefined,
      }
    }

    if (pagePath.startsWith('/jobs')) {
      return {
        loc: pagePath,
        changefreq: 'monthly',
        priority: 0.5,
        lastmod: getLastModificationDate(pagePath, 'jobs') || undefined,
      }
    }

    return {
      loc: pagePath,
      changefreq: 'yearly',
      priority: 0.5,
    }
  },
}
