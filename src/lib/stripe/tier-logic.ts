import 'server-only'
import { getGracePeriodDays } from '@/lib/app-settings'

export interface TierResult {
  tier: 'pro' | 'free'
  subscription_status: string
}

// Grace-Period-Reihenfolge: DB (app_settings) > Env-Var STRIPE_GRACE_PERIOD_DAYS > Default 7
export async function deriveTier(subStatus: string, periodEnd: number | undefined): Promise<TierResult> {
  switch (subStatus) {
    case 'active':
    case 'trialing':
      return { tier: 'pro', subscription_status: subStatus }

    case 'past_due': {
      if (periodEnd) {
        const graceDays = await getGracePeriodDays()
        const graceUntil = new Date(periodEnd * 1000 + graceDays * 86_400_000)
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

export function safePeriodEnd(sub: unknown): number | undefined {
  const s = sub as Record<string, unknown>
  const items = s?.items as { data?: Array<Record<string, unknown>> } | undefined
  const fromItem = items?.data?.[0]?.current_period_end as number | undefined
  const fromSub  = s?.current_period_end as number | undefined
  return fromItem ?? fromSub
}
