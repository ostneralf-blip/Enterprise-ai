import 'server-only'
import { createAdminClient } from '@/lib/supabase/server'

// Öffentliche Preis-/Promo-Daten — EINE Quelle der Wahrheit für Preisseite,
// Tool-Landingpages, UpgradeModal und die /api/pricing-Route. Preise in EURO
// (nicht Cent). Admin-konfigurierbar über den Pricing-Tab (price_config) +
// Promotions-Editor (promotions). Kein Hardcode mehr im Marketing.

export interface PricingPromotion {
  id: string
  name: string
  badge_text: string
  description: string | null
  promo_price: number
  promo_price_yearly: number | null
  stripe_price_id: string | null
  stripe_price_id_yearly: string | null
  valid_until: string | null
}

export interface PricingData {
  monthly: number
  yearly: number | null
  currency: string
  stripe_price_id: string | null
  stripe_price_id_yearly: string | null
  promotion: PricingPromotion | null
}

const FALLBACK: PricingData = {
  monthly: 49,
  yearly: 399,
  currency: 'EUR',
  stripe_price_id: null,
  stripe_price_id_yearly: null,
  promotion: null,
}

export async function getPublicPricing(): Promise<PricingData> {
  try {
    const supabase = await createAdminClient()
    const nowIso = new Date().toISOString()
    const [{ data: config }, { data: promos }] = await Promise.all([
      supabase.from('price_config').select('*').eq('tier', 'pro').single(),
      supabase.from('promotions').select('*')
        .eq('is_active', true)
        .or(`valid_from.is.null,valid_from.lte.${nowIso}`)
        .or(`valid_until.is.null,valid_until.gte.${nowIso}`)
        .order('valid_from', { ascending: false })
        .limit(1),
    ])

    if (!config) return FALLBACK

    const activePromo = promos?.[0] ?? null

    return {
      monthly: Number(config.monthly_price),
      yearly: config.yearly_price ? Number(config.yearly_price) : null,
      currency: config.currency,
      stripe_price_id: config.stripe_price_id,
      stripe_price_id_yearly: config.stripe_price_id_yearly,
      promotion: activePromo ? {
        id: activePromo.id,
        name: activePromo.name,
        badge_text: activePromo.badge_text,
        description: activePromo.description,
        promo_price: Number(activePromo.promo_price),
        promo_price_yearly: activePromo.promo_price_yearly ? Number(activePromo.promo_price_yearly) : null,
        stripe_price_id: activePromo.stripe_price_id,
        stripe_price_id_yearly: activePromo.stripe_price_id_yearly,
        valid_until: activePromo.valid_until,
      } : null,
    }
  } catch {
    return FALLBACK
  }
}

/** Formatiert einen Euro-Betrag (ganzzahlig ohne Nachkommastellen, sonst mit). */
export function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}
