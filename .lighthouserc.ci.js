module.exports = {
  ci: {
    collect: {
      settings: {
        configPath: './lighthouserc.js',
        // skip seo crawlable in CI as crawlability is blocked on Vercel preview deployments
        skipAudits: ['is-crawlable'],
      },
    },
  },
};