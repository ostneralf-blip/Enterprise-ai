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
