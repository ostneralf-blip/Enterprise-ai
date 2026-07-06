'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { createClient } from '@/lib/supabase/client'
import { track } from '@/lib/posthog/client'

interface LoginFormProps {
  searchParams: Promise<{ redirect?: string; message?: string }>
}

const MESSAGE_LABELS: Record<string, string> = {
  account_suspended: 'Ihr Konto wurde gesperrt. Bitte wenden Sie sich an den Support.',
}

export function LoginForm({ searchParams }: LoginFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const captchaRef = useRef<HCaptcha>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [redirectTo, setRedirectTo] = useState('/dashboard')

  useEffect(() => {
    searchParams.then(params => {
      if (params.redirect) setRedirectTo(params.redirect)
      if (params.message) setError(MESSAGE_LABELS[params.message] ?? params.message)
    })
  }, [searchParams])

  // Hash-basierten Magic-Link-Token verarbeiten (implicit flow)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('access_token')) return
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    if (!accessToken || !refreshToken) return
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (!error) {
          track('login', { method: 'magic_link' })
          router.push('/dashboard')
          router.refresh()
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaToken) return
    setLoading(true)
    setError('')

    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken },
      })

      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)

      if (result.error) {
        setError('E-Mail oder Passwort nicht korrekt.')
        setLoading(false)
        return
      }

      // Profile laden und is_banned prüfen
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', result.data.user!.id)
        .single()

      if (profile?.is_banned) {
        await supabase.auth.signOut()
        setError(MESSAGE_LABELS.account_suspended)
        setLoading(false)
        return
      }

      track('login', { method: 'email' })
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      captchaRef.current?.resetCaptcha()
      setCaptchaToken(null)
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
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8">
      <h1 className="text-slate-900 text-xl sm:text-2xl font-semibold font-serif mb-6">Anmelden</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-slate-500 text-xs mb-1.5 font-medium">E-MAIL</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="name@unternehmen.de"
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-primary-ring transition-colors"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-slate-500 text-xs font-medium">PASSWORT</label>
            <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-hover transition-colors">
              Passwort vergessen?
            </Link>
          </div>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="••••••••"
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
          {loading ? 'Wird angemeldet…' : 'Anmelden'}
        </button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">oder</span></div>
      </div>

      <button onClick={handleGoogleLogin}
        className="w-full border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2">
        <span>G</span> Mit Google anmelden
      </button>

      <p className="text-center text-slate-500 text-xs mt-6">
        Noch kein Konto?{' '}
        <Link href="/register" className="text-primary hover:text-primary-hover transition-colors">
          Kostenlos registrieren
        </Link>
      </p>
    </div>
  )
}
