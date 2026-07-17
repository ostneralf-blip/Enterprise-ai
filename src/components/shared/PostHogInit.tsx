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

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initPostHog()
    identify(userId, { email, tier })
    track('user_logged_in', { tier })
  }, [userId, email, tier])

  useEffect(() => {
    // App-Router ändert pathname client-seitig ohne vollständigen Page-Load →
    // $pageview manuell capturen. initialized.current-Guard stellt sicher, dass
    // PostHog bereits durch den Init-Effekt geladen wurde bevor wir capturen.
    if (!initialized.current || typeof window === 'undefined') return
    posthog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname])

  return null
}
