module.exports = {
  extends: './.lighthouserc.js',
  ci: {
    assert: {
      assertions: {
        // Vercel preview deployments are not crawlable by default, so we disable this check in CI
        'is-crawlable': 'off',
      },
    },
  },
}
