import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the Go backend during development.
    proxy: { '/api': { target: process.env.API_PROXY || 'http://localhost:8080', changeOrigin: true } },
  },
});
