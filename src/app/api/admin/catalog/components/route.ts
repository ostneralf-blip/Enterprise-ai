import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

// Minimale Erstellung eines neuen Katalog-Eintrags — primär für den
// Admin-Vorschlag-Flow (catalog_suggestions → "Zum Katalog hinzufügen"),
// bei dem der Name bereits feststeht und der Rest von Hand nachgepflegt wird.
// Bulk-Import bleibt weiterhin Aufgabe von /api/admin/catalog/seed und /upload.
const CreateSchema = z.object({
  name:               z.string().min(1).max(200),
  vendor:             z.string().max(100).optional(),
  category:           z.string().max(50).optional(),
  architecture_layer: z.string().max(50).optional(),
  cloud_provider:     z.string().max(50).optional(),
  hosting:            z.array(z.string().max(20)).max(10).optional(),
  use_case_types:     z.array(z.string().max(50)).max(10).optional(),
  tags:               z.array(z.string().min(1).max(50)).max(30).optional(),
  description:        z.string().max(2000).optional(),
  sap_compatible:     z.boolean().optional(),
  dsgvo_status:       z.enum(['compliant', 'conditional', 'non_compliant']).optional(),
  eu_ai_act_risk:     z.enum(['minimal', 'limited', 'high', 'prohibited']).optional(),
  website_url:        z.string().max(300).optional(),
  aliases:            z.array(z.string().min(1).max(100)).max(10).optional(),
})

export async function POST(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }

  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const supabase = await createClient()

  // Bug-Report Daniel (18.07.2026): derselbe KI-Vorschlag kann mehrfach
  // protokolliert werden (occurrence_count zählt nur, wie oft er AUFTRAT —
  // sagt nichts darüber aus, ob er schon im Katalog ist). Ohne diesen Check
  // würde ein zweiter "Zum Katalog hinzufügen"-Klick für denselben Namen an
  // component_catalog_name_key_unique scheitern (roher 500er). Stattdessen:
  // existierenden aktiven Eintrag finden und zurückgeben, statt zu duplizieren.
  const nameKey = parsed.data.name.toLowerCase().trim()
  const newAliases = parsed.data.aliases ?? []

  // Fehlende Aliase in einen bestehenden Eintrag nachtragen, statt sie zu
  // verwerfen — sonst würde derselbe kurze KI-Name (z. B. "Databricks") beim
  // nächsten Wizard-Lauf erneut nicht erkannt (Bug-Report Daniel, 18.07.2026).
  async function mergeAliasesInto(component: { id: string; aliases?: string[] | null }) {
    const existingAliases = component.aliases ?? []
    const merged = [...new Set([...existingAliases, ...newAliases])]
    if (merged.length === existingAliases.length) return
    await supabase.from('component_catalog').update({ aliases: merged, updated_at: new Date().toISOString() }).eq('id', component.id)
  }

  const { data: existing } = await supabase
    .from('component_catalog')
    .select('id, name, vendor, category, architecture_layer, aliases')
    .eq('name_key', nameKey)
    .maybeSingle()
  if (existing) {
    if (newAliases.length > 0) await mergeAliasesInto(existing)
    return NextResponse.json({ data: existing, alreadyExisted: true })
  }

  const { data, error } = await supabase
    .from('component_catalog')
    .insert({
      name:               parsed.data.name,
      vendor:             parsed.data.vendor ?? null,
      category:           parsed.data.category ?? null,
      architecture_layer: parsed.data.architecture_layer ?? null,
      cloud_provider:     parsed.data.cloud_provider ?? null,
      hosting:            parsed.data.hosting ?? [],
      use_case_types:     parsed.data.use_case_types ?? [],
      tags:               parsed.data.tags ?? [],
      description:        parsed.data.description ?? null,
      sap_compatible:     parsed.data.sap_compatible ?? false,
      dsgvo_status:       parsed.data.dsgvo_status ?? null,
      eu_ai_act_risk:     parsed.data.eu_ai_act_risk ?? null,
      website_url:        parsed.data.website_url ?? null,
      aliases:            newAliases,
      source:             'manual',
      is_active:          true,
    })
    .select('id, name, vendor, category, architecture_layer')
    .single()

  if (error) {
    // Race: zwei gleichzeitige Requests legen denselben Namen an — zweiter
    // Versuch schlägt am Unique-Index fehl, statt 500 den existierenden
    // Eintrag nachladen.
    if (error.code === '23505') {
      const { data: raceExisting } = await supabase
        .from('component_catalog')
        .select('id, name, vendor, category, architecture_layer, aliases')
        .eq('name_key', nameKey)
        .maybeSingle()
      if (raceExisting) {
        if (newAliases.length > 0) await mergeAliasesInto(raceExisting)
        return NextResponse.json({ data: raceExisting, alreadyExisted: true })
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
