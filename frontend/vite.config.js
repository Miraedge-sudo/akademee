import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Akademee — Système de Gestion Scolaire',
        short_name: 'Akademee',
        description: 'Plateforme de gestion scolaire pour établissements d\'enseignement au Cameroun',
        theme_color: '#085041',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        categories: ['education', 'productivity'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,woff2}'],
        navigateFallback: '/offline.html',
        navigateFallbackAllowlist: [/^\/[^_]*$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 12 },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
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
