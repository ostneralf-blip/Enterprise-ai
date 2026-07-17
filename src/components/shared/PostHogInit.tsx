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
    // $pageview manuell capturen. posthog.__loaded ist nach initPostHog() (Effect 1)
    // synchron true — kein separater Guard nötig.
    if (typeof window === 'undefined' || !posthog.__loaded) return
    posthog.capture('$pageview')
  }, [pathname])

  return null
}
