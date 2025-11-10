import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        login: './login-react.html'
      }
    }
  },
  server: {
    port: 3000,
    open: '/login-react.html'
  }
});

