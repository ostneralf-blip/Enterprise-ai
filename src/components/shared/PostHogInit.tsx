'use client'
// #212: PostHog-Initialisierung + User-Identifikation + Pageview-Tracking.
// Wird einmalig im Dashboard-Layout gemountet und erhält User-Daten vom Server.
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { initPostHog, identify, track } from '@/lib/posthog/client'

interface PostHogInitProps {
  userId: string
  email: string | undefined
  tier: string | undefined
}

export function PostHogInit({ userId, email, tier }: PostHogInitProps) {
  const pathname = usePathname()
  const initialized = useRef(false)
  // capture_pageview: true lässt PostHog das initiale $pageview intern feuern.
  // Dieser Flag überspringt den ersten Pathname-Effekt, damit kein Duplikat entsteht.
  const skipFirst = useRef(true)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initPostHog()
    identify(userId, { email, tier })
    track('user_logged_in', { tier })
  }, [userId, email, tier])

  useEffect(() => {
    // Erster Aufruf überspringen — initPostHog() mit capture_pageview: true
    // hat das initiale $pageview bereits intern gefeuert.
    if (skipFirst.current) { skipFirst.current = false; return }
    posthog.capture('$pageview')
  }, [pathname])

  return null
}
