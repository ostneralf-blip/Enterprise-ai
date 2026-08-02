import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import '../globals.css'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { PostHogPageView } from '@/components/shared/PostHogPageView'
import { OG_IMAGES } from '@/lib/seo'

// Dies ist das Wurzel-Layout der App (es rendert <html>/<body>). Vorher lag es in
// src/app/layout.tsx, also OBERHALB des [locale]-Segments — und musste dort per
// getLocale() eine dynamische Request-API benutzen, um `lang` zu setzen. Dadurch
// konnte Next.js keine einzige Seite statisch vorrendern: alle Routen waren `ƒ`
// (server-rendered on demand) und damit CDN-uncachebar.
//
// Mit dem Layout innerhalb von [locale] kommt die Sprache aus dem Segment-Parameter.
// Zusammen mit generateStaticParams + setRequestLocale kann Next.js die öffentlichen
// Marketing- und Rechtsseiten wieder als statisches HTML ausliefern. Das ist die von
// next-intl dokumentierte Struktur für statisches Rendering.
//
// Seiten, die Cookies oder die Datenbank lesen (Dashboard, Auth, Share, Preise),
// bleiben davon unberührt und werden weiterhin dynamisch gerendert.

const lora = Lora({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-lora',
})

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'

// Suchmaschinen-Verifikation (#219): Tokens kommen aus Env-Variablen, damit sie
// nicht im Repo landen und pro Umgebung gesetzt werden können. Setzen in Vercel:
//   GOOGLE_SITE_VERIFICATION = <Google Search Console „HTML-Tag"-Token, nur der content-Wert>
//   BING_SITE_VERIFICATION   = <Bing Webmaster „msvalidate.01"-Token>
// Sind sie nicht gesetzt, wird kein leeres Verifikations-Tag gerendert.
// IndexNow (separater Mechanismus) benötigt eine Key-Datei unter /public — erst
// einrichten, wenn ein IndexNow-Key vorliegt; kein Metadaten-Tag nötig.
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION
const bingVerification = process.env.BING_SITE_VERIFICATION
const hasVerification = Boolean(googleVerification || bingVerification)

export const metadata: Metadata = {
  title: { default: 'AI Navigator', template: '%s | AI Navigator' },
  description: 'Enterprise AI. Structured navigation. Strategic frameworks for AI readiness, governance and use-case prioritization.',
  metadataBase: new URL(BASE),
  openGraph: {
    images: OG_IMAGES,
    type: 'website',
    siteName: 'AI Navigator',
  },
  twitter: {
    card: 'summary_large_image',
  },
  ...(hasVerification && {
    verification: {
      ...(googleVerification && { google: googleVerification }),
      ...(bingVerification && { other: { 'msvalidate.01': bingVerification } }),
    },
  }),
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AI Navigator',
  url: BASE,
  logo: `${BASE}/brand/app-icon/app-icon-512.png`,
  founder: {
    '@type': 'Person',
    name: 'Daniel Ostner',
  },
}

// Ohne generateStaticParams kann Next.js das [locale]-Segment nicht vorrendern —
// dann bleibt trotz allem jede Route dynamisch.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Das Theme wird hier bewusst auf den Markenstandard gesetzt. Das persönliche Theme
// eingeloggter Nutzer setzt <ThemeAttribute> im (dashboard)-Layout — siehe dort.
const DEFAULT_THEME = 'book'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  // Muss vor jedem next-intl-Aufruf stehen, sonst fällt Next.js beim Vorrendern
  // auf dynamisches Rendering zurück.
  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning className={lora.variable} data-theme={DEFAULT_THEME}>
      <body className="font-sans antialiased bg-ivory text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PostHogPageView />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
