'use client'

import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

// Geteilter Google-OAuth-Button für Login + Register (DRY, vorher nur in LoginForm
// inline). Der Provider muss in Supabase unter Auth → Providers → Google mit
// Client-ID/Secret aus der Google Cloud Console aktiviert sein; Redirect-URL ist
// /api/auth/callback (siehe api/auth/callback/route.ts, exchangeCodeForSession).
export function GoogleAuthButton() {
  const t = useTranslations('auth')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    // Bei Erfolg leitet der Browser sofort zu Google weiter — nur bei Fehler zurücksetzen.
    if (error) setLoading(false)
  }

  return (
    <>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-slate-400">{tc('or')}</span>
        </div>
      </div>
      <button type="button" onClick={handleGoogleLogin} disabled={loading}
        className="w-full border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-60">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
        {t('googleLogin')}
      </button>
    </>
  )
}
