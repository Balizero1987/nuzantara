import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://insights.balizero.com',
  integrations: [
    mdx(),
    tailwind({
      applyBaseStyles: false, // We'll use custom base styles
    }),
    sitemap(),
  ],

  // Content collections
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },

  // Build optimization
  build: {
    inlineStylesheets: 'auto',
  },

  // Server configuration
  server: {
    port: 4321,
    host: true,
  },

  // Output mode
  output: 'static',
});
