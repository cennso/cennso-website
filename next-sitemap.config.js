/**
 * The sitemap: every page the build rendered, by its canonical address.
 *
 * No `lastmod`: the only date a build has for a file is when it was checked
 * out, which is the build's own date, and a sitemap whose dates are wrong
 * teaches Google to ignore them. Honest dates, from each page's content in git,
 * are a later change. No `changefreq` or `priority`: Google ignores both.
 *
 * @type {import('next-sitemap').IConfig}
 */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.cennso.com',
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  transform(_, pagePath) {
    // The home page with its slash, `https://www.cennso.com/`, the same as its
    // canonical address (lib/seo/canonical.ts); every other page without one.
    return {
      loc: pagePath,
      ...(pagePath === '/' ? { trailingSlash: true } : {}),
    }
  },
}
