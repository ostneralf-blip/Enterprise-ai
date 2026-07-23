import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { FREE_DAILY_SAVES_PER_MODULE } from '@/config/tiers'
import type { Tier } from '@/types'

// Tools, für die das Free-Tageslimit gilt (Issue #222). Architektur + Compliance
// sind Pro-only und erhalten daher gar kein Limit.
export type SaveModule = 'assessment' | 'canvas' | 'usecase' | 'governance' | 'roadmap'

export interface SaveUsageStatus {
  used: number
  limit: number
  remaining: number
  exceeded: boolean
}

/**
 * Liest den heutigen Save-Stand eines Free-Nutzers für ein Tool (ohne zu erhöhen).
 * Pro/Enterprise: unbegrenzt.
 */
export async function getSaveUsageStatus(userId: string, tier: Tier, module: SaveModule): Promise<SaveUsageStatus> {
  if (tier !== 'free') {
    return { used: 0, limit: -1, remaining: -1, exceeded: false }
  }
  const supabase = await createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('save_usage_log')
    .select('save_count')
    .eq('user_id', userId)
    .eq('save_date', today)
    .eq('module', module)
    .maybeSingle()

  const used = (data as { save_count: number } | null)?.save_count ?? 0
  const limit = FREE_DAILY_SAVES_PER_MODULE
  return { used, limit, remaining: Math.max(0, limit - used), exceeded: used >= limit }
}

/**
 * Setzt das Free-Tageslimit fürs Speichern eines neuen Ergebnisses durch.
 * - Pro/Enterprise: kein Limit → null (erlaubt).
 * - Free: atomares Increment via RPC. Bei erreichtem Limit → 403 mit code
 *   'SAVE_LIMIT_REACHED', sonst null (erlaubt, Zähler erhöht).
 *
 * WICHTIG: nur beim Erstellen eines NEUEN gespeicherten Ergebnisses aufrufen —
 * nicht beim Aktualisieren/Bearbeiten (das zählt bewusst nicht mit).
 */
export async function enforceSaveQuota(userId: string, tier: Tier, module: SaveModule): Promise<NextResponse | null> {
  if (tier !== 'free') return null

  const supabase = await createAdminClient()
  const { data, error } = await supabase.rpc('increment_save_usage', {
    p_user: userId,
    p_module: module,
    p_limit: FREE_DAILY_SAVES_PER_MODULE,
  })

  // Bei einem DB-Fehler das Speichern nicht blockieren (fail-open) — das Limit ist
  // ein Fairness-Deckel, kein Sicherheitsgate.
  if (error) return null

  if (data === null) {
    return NextResponse.json(
      {
        error: `Tageslimit erreicht: Free-Konten können pro Tool ${FREE_DAILY_SAVES_PER_MODULE} Ergebnisse pro Tag speichern. Mit Pro speichern Sie unbegrenzt.`,
        code: 'SAVE_LIMIT_REACHED',
        limit: FREE_DAILY_SAVES_PER_MODULE,
      },
      { status: 429 }
    )
  }
  return null
}
