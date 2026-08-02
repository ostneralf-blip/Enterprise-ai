// Öffentlich erreichbare Routen — Gegenstück zu private-routes.ts.
//
// Wird vom Auth-Guard in src/proxy.ts benutzt. Bewusst hier statt inline im Proxy,
// damit die Entscheidung „öffentlich oder nicht" ohne next/server-Abhängigkeit
// testbar ist (src/__tests__/security/public-routes-security.test.ts).
//
// Hintergrund: Beim Anlegen des Blogs (02.08.2026) fehlte /blog zunächst in dieser
// Liste. Folge war kein Fehler, sondern eine stille Umleitung anonymer Besucher auf
// /login — die Seite war für Nutzer UND Suchmaschinen unerreichbar, obwohl sie in
// Sitemap und robots.txt als öffentlich auftauchte.

/** Exakt zu matchende öffentliche Routen (keine Unterseiten). */
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/verify',
  '/forgot-password',
  '/reset-password',
  '/preise',
  '/sitemap.xml',
  '/robots.txt',
  '/impressum',
  '/datenschutz',
  '/agb',
  '/widerruf',
] as const

/**
 * Öffentliche Bereiche MIT Unterseiten — hier zählt auch jeder Unterpfad als
 * öffentlich (z. B. /blog/ki-governance-betriebsmodelle).
 *
 * Beim Anlegen eines neuen öffentlichen Content-Bereichs hier ergänzen.
 */
export const PUBLIC_PREFIXES = ['/share', '/trust', '/leitfaden', '/tools', '/blog'] as const

/**
 * Prüft einen Pfad OHNE Locale-Präfix (also `/blog`, nicht `/en/blog`).
 *
 * Der Präfix-Vergleich verlangt exakte Gleichheit oder einen echten Unterpfad mit
 * Schrägstrich. Ein bloßes startsWith('/trust') würde sonst auch `/trustcenter`
 * durchlassen und damit versehentlich eine private Route öffentlich machen.
 */
export function isPublicPath(localelessPath: string): boolean {
  if ((PUBLIC_ROUTES as readonly string[]).includes(localelessPath)) return true
  return PUBLIC_PREFIXES.some(
    (prefix) => localelessPath === prefix || localelessPath.startsWith(`${prefix}/`)
  )
}
