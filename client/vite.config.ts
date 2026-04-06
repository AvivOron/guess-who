import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/guess-who/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/guess-who/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/guess-who/, ''),
      },
    },
  },
});
