import 'server-only'

const GRACE_PERIOD_DAYS = parseInt(process.env.STRIPE_GRACE_PERIOD_DAYS ?? '7', 10)

export interface TierResult {
  tier: 'pro' | 'free'
  subscription_status: string
}

/**
 * Einzige Quelle der Wahrheit für Tier-Ableitung aus Stripe-Subscription-Status.
 * past_due = Pro bleibt erhalten bis period_end + STRIPE_GRACE_PERIOD_DAYS (Default: 7).
 */
export function deriveTier(subStatus: string, periodEnd: number | undefined): TierResult {
  switch (subStatus) {
    case 'active':
    case 'trialing':
      return { tier: 'pro', subscription_status: subStatus }

    case 'past_due': {
      if (periodEnd) {
        const graceUntil = new Date(periodEnd * 1000 + GRACE_PERIOD_DAYS * 86_400_000)
        if (new Date() < graceUntil) {
          return { tier: 'pro', subscription_status: 'past_due' }
        }
      }
      return { tier: 'free', subscription_status: 'past_due' }
    }

    default:
      return { tier: 'free', subscription_status: subStatus }
  }
}

/**
 * Liest current_period_end versionssicher aus Stripe-Subscription.
 * Neuere API-Versionen legen das Feld auf items.data[0], ältere direkt auf der Sub.
 */
export function safePeriodEnd(sub: unknown): number | undefined {
  const s = sub as Record<string, unknown>
  const items = s?.items as { data?: Array<Record<string, unknown>> } | undefined
  const fromItem = items?.data?.[0]?.current_period_end as number | undefined
  const fromSub  = s?.current_period_end as number | undefined
  return fromItem ?? fromSub
}
