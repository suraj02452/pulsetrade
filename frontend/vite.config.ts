import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // sockjs-client expects Node's `global`; map it to the browser's globalThis.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173, // must match an origin allowed by the backend's CORS settings
  },
});
