import 'dotenv/config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiPort = process.env.PORT || 3000;
const clientPort = Number(process.env.VITE_PORT || 5173);

export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: clientPort,
    strictPort: true,
    proxy: {
      '/api': `http://localhost:${apiPort}`
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  }
});
