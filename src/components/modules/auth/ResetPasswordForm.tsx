'use client'
import { useState, useEffect } from 'react'
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
    // Supabase setzt nach Klick auf den Reset-Link automatisch eine
    // temporäre Recovery-Session. Wir prüfen, ob diese vorhanden ist.
    supabase.auth.getSession().then(({ data }) => {
      setHasValidSession(!!data.session)
    })
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
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
          {error}
        </div>
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
