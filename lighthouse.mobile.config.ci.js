/**
 * CI mobile Lighthouse configuration
 * Extends shared base config and adds CI-specific overrides
 */
const baseConfig = require('./lighthouse.mobile.base.js')

// Deep clone to avoid mutating the base config
const ciConfig = JSON.parse(JSON.stringify(baseConfig))

// Add CI-specific setting: skip is-crawlable audit
// (Vercel preview deployments block crawlers)
ciConfig.ci.collect.settings.skipAudits = ['is-crawlable']

module.exports = ciConfig
