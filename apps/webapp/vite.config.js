import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        login: './login-react.html',
        quest: './quest-dashboard-v0.html',
        chat: './chat.html',
      },
      output: {
        // Code splitting configuration
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
          
          // Core client chunks
          if (id.includes('/js/zantara-client')) {
            return 'core-client';
          }
          if (id.includes('/js/core/state-manager') || id.includes('/js/core/error-handler')) {
            return 'core-state';
          }
          
          // Collective memory chunks
          if (id.includes('collective-memory')) {
            return 'collective-memory';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Generate source maps
    sourcemap: true,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    open: '/quest-dashboard-v0.html',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
  },
});
