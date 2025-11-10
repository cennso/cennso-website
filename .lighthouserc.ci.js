const urls = require('./lighthouse.urls.js')

module.exports = {
  ci: {
    collect: {
      url: urls,
      settings: {
        configPath: './lighthouserc.js',
        // skip seo crawlable in CI as crawlability is blocked on Vercel preview deployments
        skipAudits: ['is-crawlable'],
      },
    },
  },
}
