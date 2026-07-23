import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AMAZON_BOOK_URL } from '@/config/leitfaden-data'

// Gemeinsame Nav für alle öffentlichen Marketing-Seiten (Startseite, Leitfaden-Hub,
// Guide-Detail, Preise) — nutzt dieselben landing.nav*-Keys wie die Startseite,
// damit Leitfaden/Tools/Buch/Preise überall konsistent verlinkt sind.
export async function PublicNav({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' })
  const tc = await getTranslations({ locale, namespace: 'common' })
  const prefix = locale === 'en' ? '/en' : ''

  return (
    <nav className="border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
      <Link href={`${prefix}/`} className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-sm text-white">N</div>
        <span className="font-semibold">AI Navigator</span>
      </Link>
      <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
        <Link href={`${prefix}/leitfaden`} className="hover:text-slate-900 transition-colors">{t('navLeitfaden')}</Link>
        <Link href={`${prefix}/tools`} className="hover:text-slate-900 transition-colors">{t('navTools')}</Link>
        <a href={AMAZON_BOOK_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">{t('navBuch')}</a>
        <Link href={`${prefix}/preise`} className="hover:text-slate-900 transition-colors">{t('navPreise')}</Link>
      </div>
      <div className="flex items-center gap-4">
        <Link href={`${prefix}/login`} className="hidden sm:inline text-slate-500 hover:text-slate-900 text-sm transition-colors">{tc('login')}</Link>
        <Link href={`${prefix}/register`} className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          {t('navStart')}
        </Link>
      </div>
    </nav>
  )
}
