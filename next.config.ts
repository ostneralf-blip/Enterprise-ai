import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['host.docker.internal'],
  async headers() {
    return [
      {
        // Alle Dashboard-Routen: Browser-Cache komplett deaktivieren
        source: '/(dashboard|assessment|usecase|governance|roadmap|canvas|compliance|architecture)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },
}

export default nextConfig
