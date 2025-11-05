/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0891B2',
          hover: '#0E7490',
        },
        background: '#FAFAFA',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
        },
      },
    },
  },
  plugins: [],
}
