import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const VALID_LAYERS  = ['data', 'model', 'serving', 'mlops', 'application', 'governance', 'security'] as const
const VALID_DSGVO   = ['compliant', 'conditional', 'non_compliant'] as const
const VALID_AI_ACT  = ['minimal', 'limited', 'high', 'unacceptable'] as const

const RowSchema = z.object({
  name:               z.string().min(1).max(200),
  vendor:             z.string().max(100).nullish(),
  category:           z.string().max(100).nullish(),
  architecture_layer: z.enum(VALID_LAYERS).nullish(),
  hosting:            z.array(z.string()).default([]),
  dsgvo_status:       z.enum(VALID_DSGVO).default('compliant'),
  eu_ai_act_risk:     z.enum(VALID_AI_ACT).default('minimal'),
  sap_compatible:     z.boolean().default(false),
  sap_components:     z.array(z.string()).default([]),
  use_case_types:     z.array(z.string()).default([]),
  infra_types:        z.array(z.string()).default([]),
  cloud_provider:     z.string().max(50).nullish(),
  tags:               z.array(z.string()).default([]),
  description:        z.string().max(2000).nullish(),
  website_url:        z.string().url().nullish(),
  icon_name:          z.string().max(50).nullish(),
})

function splitField(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean)
  if (typeof val !== 'string' || !val.trim()) return []
  return val.split(/[,;|]/).map(s => s.trim()).filter(Boolean)
}

function parseBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  const s = String(val).toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

function normalizeRow(raw: Record<string, unknown>) {
  return {
    name:               String(raw.name ?? '').trim(),
    vendor:             raw.vendor ? String(raw.vendor).trim() : null,
    category:           raw.category ? String(raw.category).trim() : null,
    architecture_layer: raw.architecture_layer ? String(raw.architecture_layer).trim() : null,
    hosting:            splitField(raw.hosting),
    dsgvo_status:       String(raw.dsgvo_status ?? 'compliant').trim() || 'compliant',
    eu_ai_act_risk:     String(raw.eu_ai_act_risk ?? 'minimal').trim() || 'minimal',
    sap_compatible:     parseBool(raw.sap_compatible),
    sap_components:     splitField(raw.sap_components),
    use_case_types:     splitField(raw.use_case_types),
    infra_types:        splitField(raw.infra_types),
    cloud_provider:     raw.cloud_provider ? String(raw.cloud_provider).trim() : null,
    tags:               splitField(raw.tags),
    description:        raw.description ? String(raw.description).trim() : null,
    website_url:        raw.website_url ? String(raw.website_url).trim() : null,
    icon_name:          raw.icon_name ? String(raw.icon_name).trim() : null,
  }
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes }
      else if (ch === ',' && !inQuotes) { values.push(current); current = '' }
      else { current += ch }
    }
    values.push(current)
    return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? '']))
  })
}

export async function POST(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let formData: FormData
  try { formData = await request.formData() } catch {
    return NextResponse.json({ error: 'Keine Datei empfangen' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Feld "file" fehlt' }, { status: 400 })
  }

  const text = await (file as File).text()
  const filename = (file as File).name.toLowerCase()

  let rawRows: Record<string, unknown>[]
  if (filename.endsWith('.json')) {
    try {
      const parsed: unknown = JSON.parse(text)
      if (!Array.isArray(parsed)) return NextResponse.json({ error: 'JSON muss ein Array sein' }, { status: 400 })
      rawRows = parsed as Record<string, unknown>[]
    } catch {
      return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
    }
  } else if (filename.endsWith('.csv')) {
    rawRows = parseCsv(text)
    if (rawRows.length === 0) return NextResponse.json({ error: 'CSV leer oder kein Header' }, { status: 400 })
  } else {
    return NextResponse.json({ error: 'Nur .csv und .json werden unterstützt' }, { status: 400 })
  }

  const errors: string[] = []
  const valid: ReturnType<typeof normalizeRow>[] = []

  for (let i = 0; i < rawRows.length; i++) {
    const normalized = normalizeRow(rawRows[i])
    const result = RowSchema.safeParse(normalized)
    if (!result.success) {
      errors.push(`Zeile ${i + 2}: ${result.error.issues[0]?.message} (${normalized.name || '—'})`)
    } else {
      valid.push(normalized)
    }
  }

  if (valid.length === 0) {
    return NextResponse.json(
      { error: 'Keine gültigen Zeilen', details: errors.slice(0, 5) },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('component_catalog')
    .upsert(
      valid.map(r => ({ ...r, source: 'manual', is_active: true })),
      { onConflict: 'name,vendor', ignoreDuplicates: false }
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: {
      upserted: data?.length ?? valid.length,
      skipped_errors: errors.length,
      errors: errors.slice(0, 10),
    }
  })
}
