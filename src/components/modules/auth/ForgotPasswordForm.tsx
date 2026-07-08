'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm() {
  const supabase = createClient()
  const captchaRef = useRef<HCaptcha>(null)
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      captchaToken,
    })

    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)

    // Bewusst KEINE Fehlermeldung bei "User nicht gefunden" —
    // verhindert E-Mail-Enumeration (gleiche Logik wie LoginForm).
    if (error) console.error('Password reset error:', error)

    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-slate-900 text-lg font-semibold mb-2">{t('resetSentTitle')}</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          {t('resetSentDesc', { email })}
        </p>
        <Link href="/login" className="text-primary hover:text-primary-hover text-sm transition-colors">
          {t('backToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8">
      <h1 className="text-slate-900 text-xl sm:text-2xl font-semibold font-serif mb-2">{t('forgotPasswordTitle')}</h1>
      <p className="text-slate-500 text-sm mb-6">{t('forgotPasswordDesc')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-xs mb-1.5 font-medium">{t('emailLabel')}</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder={t('emailPlaceholder')}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors"
          />
        </div>

        <div className="flex justify-center">
          <HCaptcha
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            ref={captchaRef}
            theme="light"
          />
        </div>

        <button type="submit" disabled={loading || !captchaToken}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading ? t('sendLinkLoading') : t('sendResetLink')}
        </button>
      </form>

      <p className="text-center text-slate-500 text-xs mt-6">
        <Link href="/login" className="text-primary hover:text-primary-hover transition-colors">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  )
}
