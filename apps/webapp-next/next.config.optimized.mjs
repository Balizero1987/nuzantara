/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    // Ottimizza bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui-components',
            chunks: 'all',
            priority: 20,
            enforce: true
          },
          modernSidebar: {
            test: /[\\/]components[\\/]modern-sidebar[\\/]/,
            name: 'sidebar',
            chunks: 'all',
            priority: 30,
            enforce: true
          }
        }
      }
    }

    // Rimuovi duplicazioni
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash': 'lodash-es',
    }

    return config
  },
  // Abilita SWC minification
  swcMinify: true,

  // Ottimizza output
  output: 'standalone',

  // Compressione
  compress: true,

  poweredByHeader: false,

  // Headers per sicurezza e performance
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ]
      }
    ]
  }
}

export default nextConfig