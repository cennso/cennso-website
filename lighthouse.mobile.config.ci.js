/**
 * CI mobile Lighthouse configuration
 * Extends shared base config and adds CI-specific overrides
 */
const baseConfig = require('./lighthouse.mobile.base.js')

// Deep clone to avoid mutating the base config
const ciConfig = JSON.parse(JSON.stringify(baseConfig))

// Add CI-specific settings:
// - skip is-crawlable audit (Vercel preview deployments block crawlers)
// - skip largest-contentful-paint audit (unreliable in CI environment)
ciConfig.ci.collect.settings.skipAudits = ['is-crawlable', 'largest-contentful-paint']

module.exports = ciConfig
