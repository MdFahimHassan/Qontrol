import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // sockjs-client (used for the game WebSocket) expects Node's `global`
  // object, which Vite doesn't polyfill in the browser like webpack did.
  // Without this, sockjs-client.js throws "global is not defined" on load.
  define: {
    global: 'window',
  },
});