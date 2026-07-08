'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { UserProfile } from '@/types'
import { reset } from '@/lib/posthog/client'
import { useMobileNav } from './MobileNavContext'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

interface TopBarProps {
  profile: UserProfile | null
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toggle } = useMobileNav()
  const t = useTranslations('topbar')
  const tc = useTranslations('common')
  const ts = useTranslations('sidebar')

  const handleSignOut = async () => {
    reset()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const tierLabel =
    profile?.tier === 'pro' ? tc('pro') :
    profile?.tier === 'enterprise' ? tc('enterprise') :
    tc('explorer')

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — nur unterhalb von lg sichtbar */}
        <button onClick={toggle} aria-label={ts('menuOpen')}
          className="lg:hidden text-slate-500 hover:text-slate-900 p-1 shrink-0">
          <span className="text-lg">☰</span>
        </button>
        {profile?.company && (
          <span className="font-medium text-slate-700 text-sm truncate min-w-0">{profile.company}</span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <LanguageSwitcher />
        {/* E-Mail: nur ab md sichtbar */}
        <div className="text-xs text-slate-500 hidden md:block truncate max-w-[180px]">
          {profile?.email}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
          profile?.tier === 'pro' ? 'bg-primary-soft text-primary-hover' :
          profile?.tier === 'enterprise' ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {tierLabel}
        </span>
        <button onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">
          {t('signOut')}
        </button>
      </div>
    </header>
  )
}
