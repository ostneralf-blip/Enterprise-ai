'use client'
import posthog from 'posthog-js'

export function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (typeof window === 'undefined' || posthog.__loaded || !key) return posthog
  // Dev-Guard: kein Tracking in der lokalen Entwicklung
  if (process.env.NODE_ENV === 'development') return posthog
  posthog.init(key, {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com',
    defaults: '2026-05-30',    // PostHog-Defaults auf dieses Datum pinnen → kein unerwartetes Verhalten bei SDK-Updates
    person_profiles: 'identified_only',
    capture_pageview: false,   // manuell via PostHogPageView im Root-Layout
    capture_pageleave: true,
    autocapture: false,        // nur manuelle Events (DSGVO)
    persistence: 'memory',     // kein Cookie vor Consent
    disable_session_recording: true,
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
