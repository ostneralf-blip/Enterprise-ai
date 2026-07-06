'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm() {
  const supabase = createClient()
  const captchaRef = useRef<HCaptcha>(null)
  const [email, setEmail] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
      captchaToken,
    })

    captchaRef.current?.resetCaptcha()
    setCaptchaToken(null)

    // Bewusst KEINE Fehlermeldung bei "User nicht gefunden" anzeigen —
    // das würde E-Mail-Enumeration ermöglichen (gleiche Sicherheitslogik
    // wie beim Login-Formular: nie verraten, ob eine E-Mail existiert).
    if (resetError) {
      console.error('Password reset error:', resetError)
    }

    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-8 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-white text-lg font-semibold mb-2">E-Mail unterwegs</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Falls ein Konto mit <strong className="text-white">{email}</strong> existiert,
          haben wir Ihnen einen Link zum Zurücksetzen des Passworts geschickt.
        </p>
        <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
          ← Zurück zur Anmeldung
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-8">
      <h1 className="text-white text-xl sm:text-2xl font-semibold mb-2">Passwort vergessen</h1>
      <p className="text-slate-400 text-sm mb-6">
        Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">E-MAIL</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="name@unternehmen.de"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex justify-center">
          <HCaptcha
            sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY!}
            onVerify={setCaptchaToken}
            onExpire={() => setCaptchaToken(null)}
            ref={captchaRef}
            theme="dark"
          />
        </div>

        <button type="submit" disabled={loading || !captchaToken}
          className="w-full bg-primary hover:bg-primary disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading ? 'Wird gesendet…' : 'Link zum Zurücksetzen senden'}
        </button>
      </form>

      <p className="text-center text-slate-500 text-xs mt-6">
        <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
          ← Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  )
}
