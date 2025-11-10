/**
 * Shared base configuration for desktop Lighthouse audits
 * Used by both local (.lighthouserc.js) and CI (.lighthouserc.ci.js) configs
 */
const urls = require('./lighthouse.urls.js')

const desktopConfig = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 3,
      settings: {
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 2,
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
      outputDir: './.lighthouse',
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

module.exports = desktopConfig
