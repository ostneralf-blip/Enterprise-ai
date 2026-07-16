'use client'
// #212: PostHog-Initialisierung + User-Identifikation + Pageview-Tracking.
// Wird einmalig im Dashboard-Layout gemountet und erhält User-Daten vom Server.
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
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
    if (typeof window === 'undefined') return
    // App-Router ändert pathname client-seitig ohne vollständigen Page-Load →
    // $pageview manuell capturen
    import('posthog-js').then(({ default: posthog }) => {
      if (posthog.__loaded) posthog.capture('$pageview', { $current_url: window.location.href })
    })
  }, [pathname])

  return null
}
