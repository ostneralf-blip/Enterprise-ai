import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { AMAZON_BOOK_URL } from '@/config/leitfaden-data'
import { PublicNavMobileMenu, type PublicNavLink } from './PublicNavMobileMenu'

// Gemeinsame Nav für alle öffentlichen Marketing-Seiten (Startseite, Leitfaden-Hub,
// Guide-Detail, Preise) — nutzt dieselben landing.nav*-Keys wie die Startseite,
// damit Leitfaden/Tools/Buch/Preise überall konsistent verlinkt sind. Auf Mobile
// (<768px) klappt ein Hamburger-Menü die Links auf.
export async function PublicNav({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing' })
  const tc = await getTranslations({ locale, namespace: 'common' })
  const prefix = locale === 'en' ? '/en' : ''

  const links: PublicNavLink[] = [
    { label: t('navLeitfaden'), href: `${prefix}/leitfaden` },
    { label: t('navBlog'), href: `${prefix}/blog` },
    { label: t('navTools'), href: `${prefix}/tools` },
    { label: t('navBuch'), href: AMAZON_BOOK_URL, external: true },
    { label: t('navPreise'), href: `${prefix}/preise` },
  ]

  return (
    <nav className="relative border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
      <Link href={`${prefix}/`} className="flex items-center gap-3">
        {/* Dekoratives Logo: alt="" ist hier korrekt, weil der Markenname direkt
            daneben als Text steht. Ein zweites „AI Navigator" im Alt-Text würde
            Screenreader-Nutzern den Namen doppelt vorlesen (axe: image-redundant-alt). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/app-icon/app-icon.svg" alt="" width={32} height={32} className="w-8 h-8" />
        <span className="font-semibold">AI Navigator</span>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-sm text-slate-600">
        {links.map(l => l.external ? (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">{l.label}</a>
        ) : (
          <Link key={l.href} href={l.href} className="hover:text-slate-900 transition-colors">{l.label}</Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link href={`${prefix}/login`} className="hidden sm:inline text-slate-500 hover:text-slate-900 text-sm transition-colors">{tc('login')}</Link>
        <Link href={`${prefix}/register`} className="bg-primary hover:bg-primary-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
          {t('navStart')}
        </Link>
        <PublicNavMobileMenu
          links={links}
          loginHref={`${prefix}/login`}
          loginLabel={tc('login')}
          menuLabel={locale === 'en' ? 'Menu' : 'Menü'}
        />
      </div>
    </nav>
  )
}
