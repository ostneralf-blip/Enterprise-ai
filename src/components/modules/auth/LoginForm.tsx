'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { track } from '@/lib/posthog/client'

interface LoginFormProps {
  searchParams: Promise<{ redirect?: string; message?: string }>
}

export function LoginForm({ searchParams }: LoginFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [redirectTo, setRedirectTo] = useState('/dashboard')

  useEffect(() => {
    searchParams.then(params => {
      if (params.redirect) setRedirectTo(params.redirect)
      if (params.message) setError(params.message)
    })
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await supabase.auth.signInWithPassword({ email, password })

      if (result.error) {
        setError('E-Mail oder Passwort nicht korrekt.')
        setLoading(false)
        return
      }

      track('login', { method: 'email' })
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten. Bitte erneut versuchen.')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` }
    })
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-8">
      <h1 className="text-white text-xl sm:text-2xl font-semibold mb-6">Anmelden</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-slate-400 text-xs mb-1.5 font-medium">E-MAIL</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="name@unternehmen.de"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-slate-400 text-xs font-medium">PASSWORT</label>
            <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Passwort vergessen?
            </Link>
          </div>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="••••••••"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-colors text-sm">
          {loading ? 'Wird angemeldet…' : 'Anmelden'}
        </button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700" /></div>
        <div className="relative flex justify-center"><span className="bg-slate-800 px-3 text-xs text-slate-500">oder</span></div>
      </div>

      <button onClick={handleGoogleLogin}
        className="w-full border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
        <span>G</span> Mit Google anmelden
      </button>

      <p className="text-center text-slate-500 text-xs mt-6">
        Noch kein Konto?{' '}
        <Link href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
          Kostenlos registrieren
        </Link>
      </p>
    </div>
  )
}
