/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Bali Zero Brand Colors (McKinsey dark aesthetic)
        'bz': {
          black: '#000000',     // Pure black (McKinsey-style)
          navy: '#0a0e27',      // Dark navy layer (5% opacity)
          midnight: '#1a1f3a',  // Midnight blue (subtle cards)
          red: '#FF0000',       // Logo red (accent)
          white: '#f5f5f5',     // Off-white (text)
          cream: '#e8d5b7',     // Logo cream (secondary)
          gray: '#444444',      // Subtle text
          'gray-light': '#666666',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],  // Headers
        body: ['Inter', 'sans-serif'],          // Body text
      },
      fontSize: {
        // McKinsey-inspired scale
        'display-xl': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],      // 64px
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],      // 48px
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],   // 36px
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],  // 30px
        'body-xl': ['1.25rem', { lineHeight: '1.6' }],   // 20px
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],  // 18px
        'body': ['1rem', { lineHeight: '1.7' }],         // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],  // 14px
      },
      maxWidth: {
        'article': '800px',     // Article content max width
        'container': '1400px',  // Container max width
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
    },
  },
  plugins: [],
}
