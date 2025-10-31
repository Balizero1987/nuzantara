/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Disabled for development - API routes need server
  // For production on Cloudflare Pages, we'll use Pages Functions instead
  images: {
    unoptimized: true
  },
  trailingSlash: true,
}

module.exports = nextConfig
