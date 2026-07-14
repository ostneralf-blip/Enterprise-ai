import { createClient } from '@/lib/supabase/server'
import type { ComponentUpsert } from './sync-adapters'

export type UpsertMode = 'curated' | 'sync'

export interface UpsertResult {
  upserted: number
  skipped: number
  error?: string
}

/**
 * Kanonische Upsert-Funktion für alle Katalog-Erweiterungs-Pfade.
 * Matching-Key: lower(trim(name)) via name_key generated column + unique index.
 *
 * mode='curated'  → Admin-Upload/Seed: überschreibt alle Felder
 * mode='sync'     → Externe Adapter:   ignoriert bestehende Einträge (ignoreDuplicates: true),
 *                   damit kuratierte Daten nie durch Sync überschrieben werden
 */
export async function upsertComponents(
  components: ComponentUpsert[],
  mode: UpsertMode = 'sync'
): Promise<UpsertResult> {
  if (components.length === 0) return { upserted: 0, skipped: 0 }

  const supabase = await createClient()

  // Dedup innerhalb der Eingabe nach name_key — last occurrence wins
  const dedupMap = new Map<string, ComponentUpsert>()
  for (const c of components) {
    dedupMap.set(c.name.toLowerCase().trim(), c)
  }
  const deduped = Array.from(dedupMap.values())

  const { data, error } = await supabase
    .from('component_catalog')
    .upsert(
      deduped.map(c => ({ ...c, is_active: true })),
      { onConflict: 'name_key', ignoreDuplicates: mode === 'sync' }
    )
    .select('id')

  if (error) return { upserted: 0, skipped: 0, error: error.message }

  return {
    upserted: data?.length ?? deduped.length,
    skipped: components.length - deduped.length,
  }
}
