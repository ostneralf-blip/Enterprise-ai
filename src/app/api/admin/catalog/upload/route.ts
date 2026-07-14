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
  incompatible_with:  z.array(z.string()).default([]),
  requires:           z.array(z.string()).default([]),
  suggests:           z.array(z.string()).default([]),
})

// ── Helpers ────────────────────────────────────────────────────────────────

function splitField(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean)
  if (typeof val !== 'string' || !val.trim()) return []
  // handles both comma and the unicode ‚ separator used in SAP CSVs
  return val.split(/[,;|‚]/).map(s => s.trim()).filter(Boolean)
}

function parseBool(val: unknown): boolean {
  if (typeof val === 'boolean') return val
  const s = String(val).toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

function parseCsv(text: string): Record<string, string>[] {
  // Strip BOM
  const cleaned = text.replace(/^﻿/, '')
  const lines = cleaned.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0]).map(h => h.trim())
  return lines.slice(1)
    .map(line => {
      const values = parseCsvLine(line)
      return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? '']))
    })
    .filter(row => Object.values(row).some(v => v !== ''))
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { values.push(current); current = '' }
    else { current += ch }
  }
  values.push(current)
  return values
}

// ── Format detection ───────────────────────────────────────────────────────

type DetectedFormat = 'sap_discovery' | 'standard'

interface DetectionResult {
  format: DetectedFormat
  formatLabel: string
  detected_vendor: string
  detected_layer: string
  layer_confidence: 'high' | 'medium' | 'low'
  row_count: number
  sample_names: string[]
  ambiguous: boolean
}

const SAP_DISCOVERY_HEADERS = ['AI Type', 'Detail Page', 'Product Category', 'Quick Filters', 'Identifier']

function detectFormat(headers: string[], rows: Record<string, string>[]): DetectionResult {
  const headerSet = new Set(headers.map(h => h.toLowerCase()))
  const isSap = SAP_DISCOVERY_HEADERS.filter(h => headerSet.has(h.toLowerCase())).length >= 3

  const sampleNames = rows.slice(0, 5).map(r => r['Name'] ?? r['name'] ?? '').filter(Boolean)

  if (isSap) {
    // Detect layer from content
    const joulesCount = rows.filter(r => splitField(r['Quick Filters']).some(v => v.toLowerCase() === 'joule')).length
    const techPlatformCount = rows.filter(r => (r['Product Category'] ?? '').toLowerCase().includes('technology platform')).length
    const total = rows.length

    let detected_layer = 'application'
    let layer_confidence: 'high' | 'medium' | 'low' = 'medium'

    if (joulesCount / total > 0.2) {
      detected_layer = 'application'
      layer_confidence = 'high'
    } else if (techPlatformCount / total > 0.5) {
      detected_layer = 'mlops'
      layer_confidence = 'medium'
    }

    // Is the file mixed (multiple possible layers)?
    const ambiguous = techPlatformCount > 0 && joulesCount > 0 && techPlatformCount / total > 0.15

    return {
      format: 'sap_discovery',
      formatLabel: 'SAP AI Discovery Center',
      detected_vendor: 'SAP',
      detected_layer,
      layer_confidence,
      row_count: total,
      sample_names: sampleNames,
      ambiguous,
    }
  }

  // Standard format: try to detect vendor from rows
  const vendors = rows.map(r => String(r['vendor'] ?? r['Vendor'] ?? '')).filter(Boolean)
  const vendorCount: Record<string, number> = {}
  for (const v of vendors) vendorCount[v] = (vendorCount[v] ?? 0) + 1
  const topVendor = Object.entries(vendorCount).sort(([, a], [, b]) => b - a)[0]?.[0] ?? ''

  const layers = rows.map(r => String(r['architecture_layer'] ?? '')).filter(Boolean)
  const layerCount: Record<string, number> = {}
  for (const l of layers) layerCount[l] = (layerCount[l] ?? 0) + 1
  const topLayer = Object.entries(layerCount).sort(([, a], [, b]) => b - a)[0]?.[0] ?? ''

  return {
    format: 'standard',
    formatLabel: 'Standard-Format',
    detected_vendor: topVendor,
    detected_layer: topLayer,
    layer_confidence: topLayer ? 'high' : 'low',
    row_count: rows.length,
    sample_names: sampleNames,
    ambiguous: !topLayer,
  }
}

// ── Row mappers ────────────────────────────────────────────────────────────

function mapSapRow(raw: Record<string, string>, vendorOverride: string, layerOverride: string): Record<string, unknown> {
  const product = (raw['Product'] ?? '').trim()
  const quickFilters = splitField(raw['Quick Filters'])
  const availability = (raw['Availability'] ?? '').trim()
  const commercialType = (raw['Commercial Type'] ?? '').trim()
  const pkg = (raw['Package'] ?? '').trim()
  const aiType = (raw['AI Type'] ?? '').trim()

  const tags: string[] = [
    ...quickFilters,
    availability,
    commercialType,
    aiType,
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i)

  const sapComponents = product ? [product] : []
  if (pkg && !sapComponents.includes(pkg)) sapComponents.push(pkg)

  const websiteUrl = (raw['Detail Page'] ?? '').trim()

  return {
    name:               (raw['Name'] ?? '').trim(),
    vendor:             vendorOverride || 'SAP',
    category:           (raw['Product Category'] ?? '').trim() || null,
    architecture_layer: layerOverride || 'application',
    hosting:            ['cloud'],
    dsgvo_status:       'conditional',
    eu_ai_act_risk:     'limited',
    sap_compatible:     true,
    sap_components:     sapComponents,
    use_case_types:     [],
    infra_types:        [],
    cloud_provider:     'sap',
    tags,
    description:        (raw['Description'] ?? '').trim().slice(0, 2000) || null,
    website_url:        websiteUrl.startsWith('http') ? websiteUrl : null,
    icon_name:          null,
    incompatible_with:  [],
    requires:           [],
    suggests:           [],
  }
}

function normalizeStandardRow(raw: Record<string, unknown>, vendorOverride: string, layerOverride: string) {
  return {
    name:               String(raw.name ?? '').trim(),
    vendor:             vendorOverride || (raw.vendor ? String(raw.vendor).trim() : null),
    category:           raw.category ? String(raw.category).trim() : null,
    architecture_layer: layerOverride || (raw.architecture_layer ? String(raw.architecture_layer).trim() : null),
    hosting:            splitField(raw.hosting),
    dsgvo_status:       String(raw.dsgvo_status ?? 'compliant').trim() || 'compliant',
    eu_ai_act_risk:     String(raw.eu_ai_act_risk ?? 'minimal').trim() || 'minimal',
    sap_compatible:     parseBool(raw.sap_compatible),
    sap_components:     splitField(raw.sap_components),
    use_case_types:     splitField(raw.use_case_types),
    infra_types:        splitField(raw.infra_types),
    cloud_provider:     raw.cloud_provider ? String(raw.cloud_provider).trim() : null,
    tags:               splitField(raw.tags),
    description:        raw.description ? String(raw.description).trim().slice(0, 2000) : null,
    website_url:        raw.website_url ? String(raw.website_url).trim() : null,
    icon_name:          raw.icon_name ? String(raw.icon_name).trim() : null,
    incompatible_with:  splitField(raw.incompatible_with),
    requires:           splitField(raw.requires),
    suggests:           splitField(raw.suggests),
  }
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') ?? 'import'

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

  let rawRows: Record<string, string>[]
  let headers: string[]

  if (filename.endsWith('.json')) {
    try {
      const parsed: unknown = JSON.parse(text)
      if (!Array.isArray(parsed)) return NextResponse.json({ error: 'JSON muss ein Array sein' }, { status: 400 })
      rawRows = parsed as Record<string, string>[]
      headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : []
    } catch {
      return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
    }
  } else if (filename.endsWith('.csv')) {
    rawRows = parseCsv(text)
    if (rawRows.length === 0) return NextResponse.json({ error: 'CSV leer oder kein Header' }, { status: 400 })
    headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : []
  } else {
    return NextResponse.json({ error: 'Nur .csv und .json werden unterstützt' }, { status: 400 })
  }

  const detection = detectFormat(headers, rawRows)

  // Preview mode: return detection result only, no DB write
  if (mode === 'preview') {
    return NextResponse.json({ detection })
  }

  // Import mode
  const vendorOverride = String(formData.get('vendor_override') ?? '').trim()
  const layerOverride  = String(formData.get('layer_override') ?? '').trim()

  const errors: string[] = []
  const valid: ReturnType<typeof normalizeStandardRow>[] = []

  for (let i = 0; i < rawRows.length; i++) {
    const normalized = detection.format === 'sap_discovery'
      ? mapSapRow(rawRows[i], vendorOverride, layerOverride)
      : normalizeStandardRow(rawRows[i] as Record<string, unknown>, vendorOverride, layerOverride)

    const result = RowSchema.safeParse(normalized)
    if (!result.success) {
      errors.push(`Zeile ${i + 2}: ${result.error.issues[0]?.message} (${String(normalized.name) || '—'})`)
    } else {
      valid.push(result.data as ReturnType<typeof normalizeStandardRow>)
    }
  }

  if (valid.length === 0) {
    return NextResponse.json(
      { error: 'Keine gültigen Zeilen', details: errors.slice(0, 5) },
      { status: 400 }
    )
  }

  // Deduplicate by lower(trim(name)) — entspricht dem DB-Unique-Index auf name_key
  const dedupMap = new Map<string, typeof valid[0]>()
  for (const row of valid) {
    dedupMap.set(row.name.toLowerCase().trim(), row)
  }
  const deduped = Array.from(dedupMap.values())

  const supabase = await createClient()

  // Fetch existing rows that will be overwritten (backup before upsert)
  const { data: backupData } = await supabase
    .from('component_catalog')
    .select('*')
    .in('name', deduped.map(r => r.name))

  const { data, error } = await supabase
    .from('component_catalog')
    .upsert(
      deduped.map(r => ({ ...r, source: 'manual', is_active: true })),
      { onConflict: 'name_key', ignoreDuplicates: false }
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('catalog_upload_log').insert({
    user_id: user?.id ?? null,
    filename: (file as File).name,
    format: detection.formatLabel,
    row_count: deduped.length,
    vendor_override: vendorOverride || null,
    layer_override: layerOverride || null,
    source: 'upload',
    snapshot: deduped,
  })

  return NextResponse.json({
    data: {
      upserted: data?.length ?? deduped.length,
      skipped_errors: errors.length,
      duplicate_rows: valid.length - deduped.length,
      errors: errors.slice(0, 10),
      format: detection.formatLabel,
      backup_count: backupData?.length ?? 0,
      backup_data: backupData ?? [],
    }
  })
}
