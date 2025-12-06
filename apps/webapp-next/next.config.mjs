/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',

  // Security Headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + inline (for Next.js) + unsafe-eval (for dev mode)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Styles: self + inline (for styled components/tailwind)
              "style-src 'self' 'unsafe-inline'",
              // Images: self + data URIs (for avatars) + blob + specific domains
              "img-src 'self' data: blob: https://*.fly.dev https://*.cloudinary.com https://*.unsplash.com",
              // Fonts: self + Google Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Connect: self + API backends
              "connect-src 'self' https://*.fly.dev wss://*.fly.dev https://nuzantara-rag.fly.dev",
              // Frame ancestors: prevent clickjacking
              "frame-ancestors 'self'",
              // Base URI: self
              "base-uri 'self'",
              // Form actions: self
              "form-action 'self'",
              // Object sources: none (no plugins)
              "object-src 'none'",
              // Upgrade insecure requests in production
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // XSS Protection (legacy browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions Policy (disable unused features)
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'accelerometer=()',
            ].join(', '),
          },
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
}

export default nextConfig
