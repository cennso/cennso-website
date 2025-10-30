/** @type {import('next').NextConfig} */
module.exports = {
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
    // Increase compression quality slightly for better Lighthouse scores
    // Lower values = more compression = smaller files but lower quality
    // 75 is default, keeping it for now but can reduce if needed
    minimumCacheTTL: 60,
  },
}
