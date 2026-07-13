import 'server-only'

export async function trackServer(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.posthog.com'
  if (!key || !distinctId) return
  // fire-and-forget — blockiert nie die API-Antwort
  fetch(`${host}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: key,
      distinct_id: distinctId,
      event,
      properties,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {})
}
