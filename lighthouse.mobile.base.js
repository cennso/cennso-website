/**
 * Shared base configuration for mobile Lighthouse audits
 * Used by both local (lighthouse.mobile.config.js) and CI (lighthouse.mobile.config.ci.js) configs
 */
const urls = require('./lighthouse.urls.js')

const mobileConfig = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 3,
          disabled: false,
        },
        throttling: {
          rttMs: 150,
          throughputKbps: 1638,
          cpuSlowdownMultiplier: 4,
        },
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouse-mobile',
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Enforce 95% minimum on all categories
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
  },
}

module.exports = mobileConfig
