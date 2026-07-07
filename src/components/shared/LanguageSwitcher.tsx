'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing, type Locale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = async (next: Locale) => {
    if (next === locale) return

    // next-intl liest NEXT_LOCALE-Cookie für Persistenz
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`

    // Sprache in DB persistieren (D2)
    await fetch('/api/account/language', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: next }),
    }).catch(() => null) // nicht blockieren wenn nicht eingeloggt

    router.replace(pathname, { locale: next })
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)} role="group" aria-label="Sprache wählen">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchTo(loc)}
          aria-pressed={loc === locale}
          className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors uppercase tracking-wide',
            loc === locale
              ? 'bg-primary text-white'
              : 'text-slate-400 hover:text-slate-700'
          )}
        >
          {loc}
        </button>
      ))}
    </div>
  )
}
