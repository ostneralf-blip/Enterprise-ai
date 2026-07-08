'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { createClient } from '@/lib/supabase/client'
import { track } from '@/lib/posthog/client'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const captchaRef = useRef<HCaptcha>(null)
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const pwRules = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9\W]/.test(password),
  }
  const pwValid = Object.values(pwRules).every(Boolean)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pwValid) { setError(t('errors.passwordRequirements')); return }
    if (!captchaToken) return
    setLoading(true)
    setError('')
    track('register_started')

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, company },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          captchaToken,
        }
      })

      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)

      if (result.error) {
        setError(result.error.message)
        setLoading(false)
        return
      }

      track('register_completed', { has_company: !!company })

      if (result.data.session) {
        router.push('/dashboard')
        router.refresh()
        return
      }

      setDone(true)
    } catch (err) {
      console.error('Register error:', err)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
      setError(t('errors.registerFailed'))
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-slate-900 text-lg font-semibold mb-2">{t('confirmEmailTitle')}</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          {t('confirmEmailDesc', { email })}
        </p>
      </div>
    )
  }

  const pwRuleList = [
    { ok: pwRules.length,    label: t('pwRuleLength') },
    { ok: pwRules.uppercase, label: t('pwRuleUppercase') },
    { ok: pwRules.number,    label: t('pwRuleNumber') },
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8">
      <h1 className="text-slate-900 text-xl sm:text-2xl font-semibold font-serif mb-2">{t('registerTitle')}</h1>
      <p className="text-slate-500 text-sm mb-6">{t('registerSubtitle')}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-500 text-xs mb-1.5 font-medium">{t('nameLabel')}</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required
              placeholder={t('fullNamePlaceholder')}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors" />
          </div>
          <div>
            <label className="block text-slate-500 text-xs mb-1.5 font-medium">{t('companyLabel')}</label>
            <input value={company} onChange={e => setCompany(e.target.value)}
              placeholder={t('companyPlaceholder')}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-slate-500 text-xs mb-1.5 font-medium">{t('emailLabel')}</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder={t('emailPlaceholder')}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors" />
        </div>
        <div>
          <label className="block text-slate-500 text-xs mb-1.5 font-medium">{t('passwordLabel')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder={t('passwordHint')}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors" />
          {password.length > 0 && (
            <ul className="mt-2 space-y-1" aria-label={t('pwRequirements')}>
              {pwRuleList.map(({ ok, label }) => (
                <li key={label} className={`text-xs flex items-center gap-1.5 transition-colors ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span aria-hidden="true">{ok ? '✓' : '○'}</span> {label}
                </li>
              ))}
            </ul>
          )}
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
          {loading ? t('registerLoading') : t('registerButton2')}
        </button>
      </form>

      <p className="text-center text-slate-500 text-xs mt-4">
        {t('hasAccount')}{' '}
        <Link href="/login" className="text-primary hover:text-primary-hover">{t('loginLink')}</Link>
      </p>
      <p className="text-center text-slate-400 text-xs mt-2">
        {t('privacyConsent')}{' '}
        <Link href="/agb" className="underline">{t('agbLink')}</Link>{' '}
        und{' '}
        <Link href="/datenschutz" className="underline">{t('privacyLink')}</Link>.
      </p>
    </div>
  )
}
