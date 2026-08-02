import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'
import createNextIntlPlugin from 'next-intl/plugin'
import bundleAnalyzer from '@next/bundle-analyzer'
import { PRIVATE_ROUTES_HEADER_SOURCE } from './src/config/private-routes'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Bundle-Analyse: `ANALYZE=true npm run build` öffnet die Treemap-Reports unter
// .next/analyze/. Im Normalbetrieb vollständig inaktiv (kein Laufzeit-Overhead).
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

const nextConfig: NextConfig = {
  allowedDevOrigins: ['host.docker.internal', '192.168.178.121'],
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        // Clickjacking-Schutz + verhindert, dass Seiten (z. B. der Passwort-Reset)
        // in fremden/sandboxed iframes (Webmail-Vorschau) landen und dort tot sind.
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
      {
        // Alle Dashboard-Routen: Browser-Cache komplett deaktivieren (mit und ohne /en/-Prefix).
        // Routenliste zentral in src/config/private-routes.ts — dieselbe Quelle wie robots.ts.
        source: PRIVATE_ROUTES_HEADER_SOURCE,
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        // Statische Bild-Assets aus /public (Markenlogos, Tool-Vorschaubilder, Icons).
        // Ohne expliziten Header liefert Vercel hier `max-age=0, must-revalidate` aus —
        // PageSpeed monierte deshalb eine ineffiziente Cache-Strategie (~31 KiB).
        //
        // Bewusst über die DATEIENDUNG gematcht, nicht über das Verzeichnis: `/tools`
        // ist gleichzeitig Asset-Ordner (public/tools/*.svg) UND öffentliche Route
        // (/tools/governance-check). Ein verzeichnisbasiertes Muster würde die
        // HTML-Seite mitfangen — und die zeigt über getPublicPricing() den aktuellen
        // Preis, der dann bis zu 30 Tage im Browser-Cache veralten könnte.
        // Routen haben keine Dateiendung, Assets schon.
        //
        // Bewusst NICHT `immutable` mit einem Jahr: Diese Dateien liegen unter stabilen,
        // nicht gehashten Pfaden (z. B. /brand/app-icon/app-icon.svg wird aus JSON-LD,
        // Manifest und Nav referenziert). Ein Logo-Austausch ohne Dateinamenswechsel
        // würde bei Bestandsnutzern sonst bis zu einem Jahr nicht ankommen. 30 Tage plus
        // stale-while-revalidate lösen den Befund und halten die Datei aktualisierbar.
        source: '/:path*.:ext(svg|png|jpg|jpeg|webp|avif|gif|ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
}

export default withSentryConfig(withBundleAnalyzer(withNextIntl(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
})
