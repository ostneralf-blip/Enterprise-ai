// Gemeinsame SEO-/Social-Bausteine.
//
// Hintergrund (Befund 02.08.2026): Außer der Startseite hatte KEINE Seite ein
// `og:image` — geteilte Links auf LinkedIn, Slack oder X erschienen ohne Vorschaubild.
//
// Ursache: Next.js führt Metadaten nur FLACH zusammen. Sobald eine Seite in
// `generateMetadata` ein eigenes `openGraph`-Objekt zurückgibt, ersetzt das den
// `openGraph`-Block aus dem Layout vollständig — inklusive der dort hinterlegten
// Bilder. Die Startseite trug deshalb bereits eine handgeschriebene `images`-Zeile;
// alle später gebauten Seiten (Leitfaden, Tools, Blog) hatten sie nicht.
//
// Konsequenz für neue Seiten: Wer `openGraph` setzt, MUSS `images: OG_IMAGES`
// mitgeben. Der Test `src/__tests__/unit/seo-metadata.test.ts` erzwingt das.

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

/**
 * Das gebrandete Vorschaubild (1200×630) aus `src/app/opengraph-image.tsx`.
 *
 * Bewusst als absolute URL: Social-Crawler lösen relative Pfade nicht zuverlässig
 * gegen `metadataBase` auf.
 */
// Bewusst OHNE `as const`: Der Metadata-Typ von Next erwartet ein veränderbares
// Array (OGImage[]); ein readonly-Tupel wird abgelehnt.
export const OG_IMAGES: { url: string; width: number; height: number; alt: string }[] = [
  {
    url: `${BASE}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: 'AI Navigator — Enterprise AI. Strukturiert navigiert.',
  },
]

/** Locale-Kennung für Open Graph aus dem Routen-Locale. */
export function ogLocale(locale: string): string {
  return locale === 'en' ? 'en_GB' : 'de_DE'
}
