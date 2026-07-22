import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import { getLocale } from 'next-intl/server'

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
  logo: `${BASE}/favicon.ico`,
  founder: {
    '@type': 'Person',
    name: 'Daniel Ostner',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, supabase] = await Promise.all([
    getLocale(),
    createClient(),
  ])

  const { data: { user } } = await supabase.auth.getUser()

  let theme = 'book'
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('theme')
      .eq('id', user.id)
      .maybeSingle()
    if (data?.theme) theme = data.theme
  }

  return (
    <html lang={locale} suppressHydrationWarning className={lora.variable} data-theme={theme}>
      <body className="font-sans antialiased bg-ivory text-slate-900">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
