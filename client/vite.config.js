import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/guess-who/',
  plugins: [react()],
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
      '/images': {
        target: 'http://localhost:3001',
      },
    },
  },
});
