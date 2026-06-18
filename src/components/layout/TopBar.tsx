'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@/types'
import { reset } from '@/lib/posthog/client'

interface TopBarProps {
  profile: UserProfile | null
}

export function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    reset()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-slate-500">
        {profile?.company && (
          <span className="font-medium text-slate-700">{profile.company}</span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500">
          {profile?.email}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          profile?.tier === 'pro' ? 'bg-blue-100 text-blue-700' :
          profile?.tier === 'enterprise' ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {profile?.tier === 'pro' ? 'Professional' : profile?.tier === 'enterprise' ? 'Enterprise' : 'Explorer'}
        </span>
        <button onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-900 transition-colors">
          Abmelden
        </button>
      </div>
    </header>
  )
}
