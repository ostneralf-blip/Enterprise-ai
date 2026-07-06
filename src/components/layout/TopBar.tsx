'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@/types'
import { reset } from '@/lib/posthog/client'
import { useMobileNav } from './MobileNavContext'

interface TopBarProps {
  profile: UserProfile | null
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toggle } = useMobileNav()

  const handleSignOut = async () => {
    reset()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-3 sm:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — nur unterhalb von lg sichtbar */}
        <button onClick={toggle} aria-label="Menü öffnen"
          className="lg:hidden text-slate-500 hover:text-slate-900 p-1 shrink-0">
          <span className="text-lg">☰</span>
        </button>
        {profile?.company && (
          <span className="font-medium text-slate-700 text-sm truncate min-w-0">{profile.company}</span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* E-Mail: nur ab md sichtbar, nimmt sonst zu viel Platz weg */}
        <div className="text-xs text-slate-500 hidden md:block truncate max-w-[180px]">
          {profile?.email}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
          profile?.tier === 'pro' ? 'bg-primary-soft text-primary-hover' :
          profile?.tier === 'enterprise' ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {profile?.tier === 'pro' ? 'Pro' : profile?.tier === 'enterprise' ? 'Enterprise' : 'Explorer'}
        </span>
        <button onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap">
          Abmelden
        </button>
      </div>
    </header>
  )
}
