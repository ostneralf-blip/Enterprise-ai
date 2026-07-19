'use client'
import posthog from 'posthog-js'

export function initPostHog(onLoaded?: () => void) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (typeof window === 'undefined' || !key) return posthog
  if (process.env.NODE_ENV === 'development') return posthog
  if (posthog.__loaded) {
    onLoaded?.()
    return posthog
  }
  posthog.init(key, {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    persistence: 'memory',
    disable_session_recording: true,
    loaded: () => onLoaded?.(),
  })
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
  | 'user_logged_in'
  | 'guidance_viewed'
  | 'dashboard_tiles_reordered'
  | 'rasic_edited'
  | 'ai_suggestion_accepted'
  | 'ai_suggestion_rejected'
  | 'report_exported'

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
