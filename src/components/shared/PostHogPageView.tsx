'use client'
// Root-Layout — trackt $pageview auf ALLEN Seiten (öffentlich + authenticated).
// Nutzt posthog loaded-Callback für ersten Aufruf, direkt für folgende Navigationen.
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { initPostHog } from '@/lib/posthog/client'

export function PostHogPageView() {
  const pathname = usePathname()

  useEffect(() => {
    if (posthog.__loaded) {
      posthog.capture('$pageview')
      return
    }
    // Erster Aufruf: init + pageview im loaded-Callback (garantiert nach __loaded = true)
    initPostHog(() => {
      posthog.capture('$pageview')
    })
  }, [pathname])

  return null
}
