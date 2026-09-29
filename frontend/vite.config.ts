import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_PORT === '5000' ? 'http://localhost:5000' : 'http://localhost:5001',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.VITE_BACKEND_PORT === '5000' ? 'http://localhost:5000' : 'http://localhost:5001',
        changeOrigin: true,
      },
      '/ready': {
        target: process.env.VITE_BACKEND_PORT === '5000' ? 'http://localhost:5000' : 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  }
});
