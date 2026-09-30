const fs = require('fs')
const path = require('path')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const LUCIDE_BARREL = /lucide-react[\\/]dist[\\/]esm[\\/]icons[\\/]index\.mjs$/
const LUCIDE_ICONS_SHIM = path.join(__dirname, 'lib', 'lucide-icons.mjs')

/**
 * `@cennso/ui`'s Icon looks glyphs up through lucide-react's `icons` namespace,
 * which covers all ~1845 icons and therefore cannot be tree-shaken - 648KB
 * parsed / 179KB transferred on every page for a handful of glyphs. The plugin
 * below swaps that namespace for `lib/lucide-icons.mjs`.
 *
 * This recomputes what the swap has to cover, so the build fails loudly if
 * `@cennso/ui` ever reaches for a glyph the shim does not re-export - the
 * alternative is `icons[name]` returning undefined and React throwing on a
 * page nobody audited. See `lib/lucide-icons.mjs` for the standing limits.
 */
function assertLucideShimIsComplete() {
  const lucideEntry = path.join(
    __dirname,
    'node_modules/lucide-react/dist/esm/lucide-react.mjs'
  )
  const uiDist = path.join(__dirname, 'node_modules/@cennso/ui/dist')
  // Throw rather than return: a silent skip leaves NormalModuleReplacementPlugin
  // swapping the barrel with nothing verifying the shim, which is exactly the
  // undefined-icon render this guard exists to prevent.
  if (!fs.existsSync(lucideEntry) || !fs.existsSync(uiDist)) {
    throw new Error(
      `Cannot verify ${LUCIDE_ICONS_SHIM}: missing ${lucideEntry} or ${uiDist}.`
    )
  }

  // Only the re-exports that come out of `./icons/*` count: lucide's entry
  // also exports helpers like `Icon` and `createLucideIcon`, whose names
  // collide with ordinary strings in `@cennso/ui` and would be reported as
  // missing glyphs forever.
  const iconExportNames = new Set()
  const lucideSource = fs.readFileSync(lucideEntry, 'utf8')
  for (const block of lucideSource.matchAll(
    /export \{([^}]*)\} from '\.\/icons\/[^']+';/g
  )) {
    for (const specifier of block[1].split(',')) {
      const exported = specifier.trim().match(/^default as (\w+)$/)
      if (exported) iconExportNames.add(exported[1])
    }
  }

  // An empty set would make every later check pass vacuously, so treat a parse
  // that finds nothing as a broken parser rather than as "no icons needed".
  if (iconExportNames.size === 0) {
    throw new Error(
      `Parsed zero icon exports from ${lucideEntry}; lucide-react's format ` +
        `changed and the parser in next.config.js needs updating.`
    )
  }

  const required = new Set()
  // Recursive: @cennso/ui ships most of its components in subdirectories of
  // dist, so a top-level-only scan misses the majority of icon references.
  for (const file of fs.readdirSync(uiDist, { recursive: true })) {
    if (!file.endsWith('.mjs')) continue
    const source = fs.readFileSync(path.join(uiDist, file), 'utf8')
    for (const match of source.matchAll(/"([A-Z][A-Za-z0-9]{1,40})"/g)) {
      if (iconExportNames.has(match[1])) required.add(match[1])
    }
  }

  const shim = fs.readFileSync(LUCIDE_ICONS_SHIM, 'utf8')
  const provided = new Set(
    [...shim.matchAll(/default as (\w+)/g)].map((match) => match[1])
  )
  const missing = [...required].filter((name) => !provided.has(name)).sort()
  if (missing.length) {
    throw new Error(
      `lib/lucide-icons.mjs is missing ${missing.length} icon(s) that @cennso/ui ` +
        `references: ${missing.join(', ')}.\nAdd them (see the header comment in ` +
        `that file) or the icons will render as undefined at runtime.`
    )
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    assertLucideShimIsComplete()
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        LUCIDE_BARREL,
        LUCIDE_ICONS_SHIM
      )
    )
    return config
  },
  output: 'standalone',
  images: {
    // Device sizes for responsive images (used with sizes prop)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different viewport widths (used with sizes prop)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Supported formats (WebP is automatically optimized)
    formats: ['image/webp'],
    // Cache optimized images for 60 days (5184000 seconds)
    minimumCacheTTL: 5184000,
  },
  // Custom headers for caching and compression
  async headers() {
    return [
      {
        // Cache static assets with short client TTL but longer CDN TTL
        // Allows asset updates to propagate quickly to clients while CDN still caches
        // max-age=3600 (1 hour client cache), s-maxage=86400 (1 day CDN cache)
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, must-revalidate',
          },
        ],
      },
      {
        // Cache Next.js static files for 1 year (client + CDN)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
      {
        // Cache optimized images for 1 year (client + CDN)
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
      {
        // Cache HTML/SSR responses on CDN while avoiding stale clients
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
