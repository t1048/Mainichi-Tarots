import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '毎日タロット＆占い',
        short_name: '毎日タロット',
        description: '毎日タロット＆占い — ブラウザで気軽に引ける本格占い SPA',
        theme_color: '#1a0f2e',
        background_color: '#1a0f2e',
        display: 'standalone',
        lang: 'ja',
        start_url: '/Mainichi-Tarots/',
        scope: '/Mainichi-Tarots/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,png}'],
      },
    }),
  ],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
