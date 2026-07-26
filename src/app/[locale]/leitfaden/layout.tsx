import Link from 'next/link'
import { PublicNav } from '@/components/shared/PublicNav'

// #220: Eigene Public-Reading-Shell für den Leitfaden-Hub, bewusst getrennt von der
// App-Shell (Sidebar/Navbar unter (dashboard)). Helles, ruhiges Lese-Design; Header
// (Logo + „Kostenlos starten"-CTA via PublicNav) und Footer (Impressum/Datenschutz)
// liegen hier zentral, statt in jeder Guide-/Hub-Seite dupliziert zu werden.
export default async function LeitfadenLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const isEn = locale === 'en'
  const prefix = isEn ? '/en' : ''

  return (
    <div className="min-h-screen bg-ivory text-slate-900">
      <PublicNav locale={locale} />
      {children}
      <footer className="border-t border-slate-200 py-6 text-center text-slate-500 text-xs">
        © 2026 AI Navigator · enterprise-ai.biz ·{' '}
        <Link href={`${prefix}/datenschutz`} className="hover:text-slate-700">{isEn ? 'Privacy' : 'Datenschutz'}</Link> ·{' '}
        <Link href={`${prefix}/impressum`} className="hover:text-slate-700">{isEn ? 'Imprint' : 'Impressum'}</Link>
      </footer>
    </div>
  )
}
