'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { track } from '@/lib/posthog/client'

export function RegisterForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
 
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault()
  console.log('=== FORM SUBMITTED ===')
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
      }
    })

    console.log('=== SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('=== RESULT:', JSON.stringify(result))

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    track('register_completed', { has_company: !!company })
    setDone(true)
  } catch (err) {
    console.error('=== CATCH ERROR:', err)
    setError('Unbekannter Fehler — siehe Konsole')
    setLoading(false)
  }
}

  if (done) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h2 className="text-white text-lg font-semibold mb-2">E-Mail bestätigen</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Wir haben eine Bestätigungsmail an <strong className="text-white">{email}</strong> gesendet.
          Bitte klicken Sie auf den Link, um Ihr Konto zu aktivieren.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
      <h1 className="text-white text-xl font-semibold mb-2">Kostenlosen Account erstellen</h1>
      <p className="text-slate-400 text-sm mb-6">Keine Kreditkarte erforderlich.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">NAME</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Max Mustermann"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
          <div>
            <label className="block text-slate-400 text-xs mb-1.5 font-medium">UNTERNEHMEN</label>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Optional"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">E-MAIL</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@unternehmen.de"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">PASSWORT</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Mindestens 8 Zeichen"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors" />
        </div>
        <button type="submit" disabled={loading}
        onClick={() => console.log('=== BUTTON CLICKED ===')}  // ← neu
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading ? 'Wird registriert…' : 'Kostenlosen Account erstellen'}
        </button>
      </form>

      <p className="text-center text-slate-500 text-xs mt-4">
        Bereits registriert?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300">Anmelden</Link>
      </p>
      <p className="text-center text-slate-600 text-xs mt-2">
        Mit der Registrierung akzeptieren Sie unsere{' '}
        <Link href="/agb" className="underline">AGB</Link> und{' '}
        <Link href="/datenschutz" className="underline">Datenschutzerklärung</Link>.
      </p>
    </div>
  )
}
