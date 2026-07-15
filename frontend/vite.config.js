import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.lvh.me', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:1000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Warn if any chunk exceeds 300kB (down from default 500kB)
    chunkSizeWarningLimit: 300,
    // Manual chunk splitting for better caching and parallel loading
    // Note: Vite 8 with Rolldown uses a function, not an object
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/react-icons') || id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules/i18next')) return 'vendor-i18n';
          if (id.includes('node_modules/axios')) return 'vendor-utils';
          if (id.includes('node_modules/lottie-react')) return 'vendor-anim';
        },
      },
    },
  },
})
