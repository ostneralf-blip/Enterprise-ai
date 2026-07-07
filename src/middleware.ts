import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

// Feature-Flag: EN ist öffentlich erst wenn P1+P2 abgeschlossen sind.
// Wird über Env-Variable gesteuert; Admin-Nutzer können EN via Cookie erzwingen.
const EN_ENABLED = process.env.NEXT_PUBLIC_EN_ENABLED === 'true'

const intlMiddleware = createIntlMiddleware(routing)

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API-Routen, statische Assets und interne Next.js-Pfade überspringen
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // EN-Pfade blockieren wenn Feature-Flag inaktiv (außer Admin-Override-Cookie)
  if (!EN_ENABLED && pathname.startsWith('/en')) {
    const isAdminEnOverride = request.cookies.get('en_admin_preview')?.value === 'true'
    if (!isAdminEnOverride) {
      // Auf deutschen Äquivalent-Pfad umleiten
      const dePath = pathname.replace(/^\/en/, '') || '/'
      return NextResponse.redirect(new URL(dePath, request.url))
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
