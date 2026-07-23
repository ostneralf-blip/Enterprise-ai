import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

// Feature-Flag: EN ist öffentlich erst wenn P1+P2 abgeschlossen sind.
// Admin-Nutzer können EN via Cookie erzwingen.
const EN_ENABLED = process.env.NEXT_PUBLIC_EN_ENABLED === 'true'

const intlMiddleware = createIntlMiddleware(routing)

const PUBLIC_ROUTES = ['/', '/login', '/register', '/verify', '/share', '/forgot-password', '/reset-password', '/trust', '/leitfaden', '/tools', '/preise', '/sitemap.xml', '/robots.txt', '/impressum', '/datenschutz', '/agb', '/widerruf']
const AUTH_ROUTES = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API-Routen, PostHog-Proxy, statische Assets und spezielle Next.js-Dateien überspringen
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/ingest/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // EN-Pfade blockieren wenn Feature-Flag inaktiv (außer Admin-Override-Cookie)
  if (!EN_ENABLED && pathname.startsWith('/en')) {
    const isAdminEnOverride = request.cookies.get('en_admin_preview')?.value === 'true'
    if (!isAdminEnOverride) {
      const dePath = pathname.replace(/^\/en/, '') || '/'
      const redirectResponse = NextResponse.redirect(new URL(dePath, request.url))
      // NEXT_LOCALE=de setzen, damit next-intl nicht zurück zu /en/... redirectet (Loop-Schutz)
      redirectResponse.cookies.set('NEXT_LOCALE', 'de', { path: '/', sameSite: 'lax' })
      return redirectResponse
    }
  }

  // Supabase-Session auffrischen + Auth-Guard
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Locale-Präfix für Route-Matching entfernen (z.B. /en/login → /login)
  const localelessPath = pathname.replace(/^\/en/, '') || '/'

  // Eingeloggte Nutzer von Auth-Seiten weglenken
  if (user && AUTH_ROUTES.some(r => localelessPath.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Private Routen schützen: nicht eingeloggte Nutzer zu Login umleiten
  const isPublic = PUBLIC_ROUTES.some(r => localelessPath === r || localelessPath.startsWith('/share') || localelessPath.startsWith('/trust') || localelessPath.startsWith('/leitfaden') || localelessPath.startsWith('/tools'))
  if (!user && !isPublic) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', localelessPath)
    return NextResponse.redirect(redirectUrl)
  }

  // i18n-Locale-Routing — Supabase-Cookies in die Antwort mergen
  const intlResponse = intlMiddleware(request)
  supabaseResponse.cookies.getAll().forEach(cookie => {
    intlResponse.cookies.set(cookie)
  })
  return intlResponse
}

export const config = {
  matcher: [
    '/((?!api|ingest|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
