'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Verhindert, dass der Browser-Zurück-Button nach dem Logout
 * eine gecachte Version des Dashboards anzeigt (bfcache).
 *
 * Das pageshow-Event feuert beim bfcache-Restore mit persisted=true.
 * In diesem Fall erzwingen wir ein vollständiges Reload, das den
 * Server-seitigen Auth-Check auslöst → Redirect zu Login.
 */
export function BfcacheGuard() {
  const router = useRouter()

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload()
      }
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router])

  return null // rendert nichts, nur Logik
}
