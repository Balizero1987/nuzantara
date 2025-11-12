import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        login: './login-react.html',
        quest: './quest-dashboard-v0.html',
      },
    },
  },
  server: {
    port: 5173,
    open: '/quest-dashboard-v0.html',
  },
});
