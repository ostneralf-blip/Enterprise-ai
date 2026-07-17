'use client'
// Sitzt im Root-Layout — trackt $pageview auf ALLEN Seiten (öffentlich + authenticated).
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'
import { initPostHog } from '@/lib/posthog/client'

export function PostHogPageView() {
  const pathname = usePathname()
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initPostHog()
    }
    if (posthog.__loaded) posthog.capture('$pageview')
  }, [pathname])

  return null
}
