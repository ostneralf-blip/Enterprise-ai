'use client'
import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window !== 'undefined' && !posthog.__loaded) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false, // handled manually
      capture_pageleave: true,
      autocapture: false, // manual tracking only (DSGVO)
    })
  }
  return posthog
}

export type TrackingEvent =
  | 'tool_started'
  | 'tool_completed'
  | 'export_pdf'
  | 'share_created'
  | 'upgrade_clicked'
  | 'feedback_submitted'
  | 'version_saved'
  | 'register_started'
  | 'register_completed'
  | 'login'
  | 'guidance_viewed'
  | 'dashboard_tiles_reordered'

export function track(event: TrackingEvent, props?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(event, props)
  }
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, props)
  }
}

export function reset() {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset()
  }
}
