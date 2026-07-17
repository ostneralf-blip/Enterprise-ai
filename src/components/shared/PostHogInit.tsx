'use client'
// Sitzt im Dashboard-Layout — identifiziert den eingeloggten User in PostHog.
// Init + $pageview-Tracking übernimmt PostHogPageView im Root-Layout.
import { useEffect, useRef } from 'react'
import { identify, track } from '@/lib/posthog/client'

interface PostHogInitProps {
  userId: string
  email: string | undefined
  tier: string | undefined
}

export function PostHogInit({ userId, email, tier }: PostHogInitProps) {
  const identified = useRef(false)

  useEffect(() => {
    if (identified.current) return
    identified.current = true
    identify(userId, { email, tier })
    track('user_logged_in', { tier })
  }, [userId, email, tier])

  return null
}
