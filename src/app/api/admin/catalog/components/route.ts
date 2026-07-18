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
      source:             'manual',
      is_active:          true,
    })
    .select('id, name, vendor, category, architecture_layer')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
