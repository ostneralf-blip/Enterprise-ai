import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Nur in Development nutzbar — loggt mit übergebenen Credentials ein und setzt korrekte SSR-Cookies
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  const { email, password } = await req.json().catch(() => ({}))
  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const response = NextResponse.json({ ok: true })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { flowType: 'pkce' },
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return NextResponse.json({ error: error.message }, { status: 401 })

  return response
}
