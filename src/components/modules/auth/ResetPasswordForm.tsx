'use client'
import { useState, useEffect } from 'react'
import { AlertBox } from '@/components/shared/AlertBox'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function ResetPasswordForm() {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('auth')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null)

  useEffect(() => {
    const establish = async () => {
      const params = new URLSearchParams(window.location.search)
      const tokenHash = params.get('token_hash')
      const type = params.get('type')
      const code = params.get('code')
      try {
        if (tokenHash && type === 'recovery') {
          // Robuster Weg: kein PKCE-code_verifier nötig — verifyOtp löst den
          // token_hash direkt ein (funktioniert browser-/kontextübergreifend).
          await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        } else if (code) {
          // Legacy-PKCE-Pfad: detectSessionInUrl hat den Code beim Init evtl. schon
          // eingelöst — nur nachlegen, wenn noch keine Session besteht.
          const { data } = await supabase.auth.getSession()
          if (!data.session) await supabase.auth.exchangeCodeForSession(code)
        }
      } catch {
        // getSession unten entscheidet über gültig/ungültig
      }

      const { data } = await supabase.auth.getSession()
      setHasValidSession(!!data.session)
    }
    void establish()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) { setError(t('errors.passwordTooShort')); return }
    if (password !== confirmPassword) { setError(t('errors.passwordMismatch')); return }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(t('errors.passwordUpdateFailed'))
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (hasValidSession === false) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-slate-900 text-lg font-semibold mb-2">{t('invalidLinkTitle')}</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Bitte fordern Sie über{' '}
          <Link href="/forgot-password" className="text-primary hover:text-primary-hover">
            {t('forgotPasswordLink')}
          </Link>{' '}
          einen neuen Link an.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-slate-900 text-lg font-semibold mb-2">{t('passwordUpdatedTitle')}</h2>
        <p className="text-slate-500 text-sm">{t('passwordUpdatedDesc')}</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8">
      <h1 className="text-slate-900 text-xl sm:text-2xl font-semibold font-serif mb-6">{t('resetPasswordTitle')}</h1>

      {error && (
        <AlertBox variant="error" className="mb-4">{error}</AlertBox>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-xs mb-1.5 font-medium">{t('newPasswordLabel')}</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
            placeholder={t('passwordHint')}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-500 text-xs mb-1.5 font-medium">{t('confirmPasswordLabel')}</label>
          <input
            type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8}
            placeholder={t('confirmPasswordPlaceholder')}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors"
          />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading ? t('savePasswordLoading') : t('updatePassword')}
        </button>
      </form>
    </div>
  )
}
