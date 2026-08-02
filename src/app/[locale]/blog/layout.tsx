import Link from 'next/link'
import { PublicNav } from '@/components/shared/PublicNav'
import { setRequestLocale } from 'next-intl/server'

// Lese-Shell für den Blog — bewusst identisch aufgebaut zur Leitfaden-Shell
// (src/app/[locale]/leitfaden/layout.tsx), damit beide Content-Bereiche sich für
// Besucher gleich anfühlen: PublicNav oben, ruhiger Ivory-Lesebereich, schlanker
// Rechtsfooter unten.
export default async function BlogLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Erlaubt Next.js das statische Vorrendern der Blogseiten (next-intl).
  setRequestLocale(locale)
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <PublicNav locale={locale} />
      <main>{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-slate-500 text-xs">
        © 2026 AI Navigator · enterprise-ai.biz ·{' '}
        <Link href={`${prefix}/datenschutz`} className="hover:text-slate-700">{isEn ? 'Privacy' : 'Datenschutz'}</Link> ·{' '}
        <Link href={`${prefix}/impressum`} className="hover:text-slate-700">{isEn ? 'Imprint' : 'Impressum'}</Link>
      </footer>
    </div>
  )
}
