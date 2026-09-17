import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Hosted on GitHub Pages under https://<user>.github.io/VinApp/
export default defineConfig({
  base: '/VinApp/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vinspil',
        short_name: 'Vinspil',
        description: 'Lær vin gennem spil: blindsmagning, kortquiz og daglig udfordring.',
        lang: 'da',
        start_url: '/VinApp/',
        scope: '/VinApp/',
        display: 'standalone',
        background_color: '#f7f1e8',
        theme_color: '#7a1f3d',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the whole app: code, content and the GeoJSON are all bundled into these.
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        // The MapLibre chunk is a little over 1 MB.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/VinApp/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // UI tests render the whole app through jsdom; on a loaded machine the 5 s default flakes.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/engine/**'],
      exclude: ['src/engine/**/*.test.ts', 'src/engine/index.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
})
