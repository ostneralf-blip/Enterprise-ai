'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const router = useRouter()
  const supabase = createClient()
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

    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.')
      return
    }
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError('Passwort konnte nicht aktualisiert werden. Bitte fordern Sie einen neuen Link an.')
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
        <h2 className="text-slate-900 text-lg font-semibold mb-2">Link abgelaufen oder ungültig</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Bitte fordern Sie über{' '}
          <a href="/forgot-password" className="text-primary hover:text-primary-hover">
            Passwort vergessen
          </a>{' '}
          einen neuen Link an.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-slate-900 text-lg font-semibold mb-2">Passwort aktualisiert</h2>
        <p className="text-slate-500 text-sm">Sie werden weitergeleitet…</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8">
      <h1 className="text-slate-900 text-xl sm:text-2xl font-semibold font-serif mb-6">Neues Passwort festlegen</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-xs mb-1.5 font-medium">NEUES PASSWORT</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
            placeholder="Mindestens 8 Zeichen"
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors"
          />
        </div>
        <div>
          <label className="block text-slate-500 text-xs mb-1.5 font-medium">PASSWORT BESTÄTIGEN</label>
          <input
            type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8}
            placeholder="Passwort wiederholen"
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors"
          />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading ? 'Wird gespeichert…' : 'Passwort aktualisieren'}
        </button>
      </form>
    </div>
  )
}
