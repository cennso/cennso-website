module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/success-stories',
        'http://localhost:3000/contact',
      ],
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
          cpuSlowdownMultiplier: 2, // Simulate slower CPU (was 1, now 2x slowdown)
        },
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
        output: ['json', 'html'],
        outputPath: './lighthouse-desktop',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouse',
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Enforce 100% on all categories
        'categories:performance': ['error', { minScore: 1.0 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 1.0 }],
        'categories:seo': ['error', { minScore: 1.0 }],
      },
    },
  },
}
