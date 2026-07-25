import type { MetadataRoute } from 'next'

// PWA-Manifest (App Router erkennt manifest.ts automatisch und verlinkt es).
// Icons + Farben aus dem AI-Navigator-Logo-Paket (Brand-Blau #1D4ED8, Ivory #F8F5EE).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Navigator',
    short_name: 'AI Navigator',
    description: 'Enterprise AI. Strukturiert navigiert.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F5EE',
    theme_color: '#1D4ED8',
    icons: [
      { src: '/brand/app-icon/app-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/app-icon/app-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
