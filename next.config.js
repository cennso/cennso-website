const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
