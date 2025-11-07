module.exports = {
  extends: './lighthouse.mobile.config.js',
  ci: {
    collect: {
      settings: {
        // Skip is-crawlable audit in CI since Vercel preview deployments are blocked from indexing
        skipAudits: ['is-crawlable'],
      },
    },
  },
}
