/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'zantara-bg-0': '#0A0A12',
        'zantara-bg-1': '#12121A',
        'zantara-gold': '#C7A75E',
        'zantara-gold-2': '#D6B87A',
        'zantara-line': '#2A2A32',
        'zantara-text': '#E8E8E8',
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
