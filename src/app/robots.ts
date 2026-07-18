import type { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

// Private Tool-Routen aus next.config.ts (Cache-Control-Header-Regel) — dieselbe Liste,
// damit robots.txt und die Auth-/Cache-Konfiguration nicht auseinanderlaufen.
const PRIVATE_TOOL_ROUTES = [
  'dashboard',
  'assessment',
  'usecase',
  'governance',
  'roadmap',
  'canvas',
  'compliance',
  'architecture',
]

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    '/api/',
    '/ingest/',
    // Passwort-/Verifizierungs-Flows: URLs tragen ggf. Token als Query-Parameter,
    // gehören nicht in den Suchindex.
    '/verify',
    '/en/verify',
    '/forgot-password',
    '/en/forgot-password',
    '/reset-password',
    '/en/reset-password',
    // Share-Links: nutzergenerierte, ggf. vertrauliche Auswertungen — nie indexieren.
    '/share/',
    '/en/share/',
    // Private Tool-/Dashboard-Routen (DE ohne Prefix, EN mit /en-Prefix)
    ...PRIVATE_TOOL_ROUTES.flatMap((route) => [`/${route}`, `/en/${route}`]),
  ]

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
