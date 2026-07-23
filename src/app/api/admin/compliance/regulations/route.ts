import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

// Admin-CRUD für Compliance-Regularien (#245). Arbeitet auf compliance_regulations
// + compliance_checklist_items (locale-per-row). Ein logisches Objekt (Regularie
// bzw. Checklistenpunkt) besteht aus DE- und EN-Zeile — die API kapselt das:
// Upserts schreiben immer beide Locale-Zeilen, Deletes entfernen beide.
// RLS wird bewusst über den Admin-Client umgangen (Schreibzugriff nur nach
// requireAdmin, das Nicht-Admins hart abweist).

const EMPTY_TO_NULL = (v: unknown) => (v === '' ? null : v)

const LocaleReg = z.object({
  short_label: z.string().min(1).max(200),
  label:       z.string().min(1).max(300),
  description: z.preprocess(EMPTY_TO_NULL, z.string().max(4000).nullable().optional()),
  applicability: z.preprocess(EMPTY_TO_NULL, z.string().max(4000).nullable().optional()),
})
const RegulationSchema = z.object({
  kind: z.literal('regulation'),
  slug: z.string().regex(/^[a-z0-9_]+$/, 'nur a-z, 0-9, _').max(50),
  category: z.enum(['gesetz', 'standard', 'aufsichtsrecht']),
  display_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(true),
  de: LocaleReg,
  en: LocaleReg,
})

const LocaleItem = z.object({
  label:       z.string().min(1).max(500),
  description: z.preprocess(EMPTY_TO_NULL, z.string().max(4000).nullable().optional()),
  relevance:   z.preprocess(EMPTY_TO_NULL, z.string().max(4000).nullable().optional()),
})
const ItemSchema = z.object({
  kind: z.literal('item'),
  regulation_slug: z.string().max(50),
  item_key: z.string().regex(/^[a-z0-9_]+$/i, 'nur Buchstaben, Ziffern, _').max(100),
  article:       z.preprocess(EMPTY_TO_NULL, z.string().max(200).nullable().optional()),
  source_url:    z.preprocess(EMPTY_TO_NULL, z.string().url('gültige URL erforderlich').max(500).nullable().optional()),
  last_verified: z.preprocess(EMPTY_TO_NULL, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum als JJJJ-MM-TT').nullable().optional()),
  risk_class:    z.preprocess(EMPTY_TO_NULL, z.enum(['prohibited', 'high', 'limited', 'minimal']).nullable().optional()),
  category:      z.preprocess(EMPTY_TO_NULL, z.string().max(100).nullable().optional()),
  display_order: z.number().int().min(0).default(0),
  is_published: z.boolean().default(true),
  de: LocaleItem,
  en: LocaleItem,
})

const PostSchema = z.discriminatedUnion('kind', [RegulationSchema, ItemSchema])

const LOCALES = ['de', 'en'] as const

async function guard(): Promise<NextResponse | null> {
  try { await requireAdmin() } catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return null
}

// ─── GET: gruppierte Liste (beide Locales, inkl. unveröffentlichter) ─────────
export async function GET() {
  const g = await guard(); if (g) return g
  const supabase = await createAdminClient()
  const [{ data: regs }, { data: items }] = await Promise.all([
    supabase.from('compliance_regulations').select('*').order('display_order'),
    supabase.from('compliance_checklist_items').select('*').order('display_order'),
  ])

  type Row = Record<string, unknown>
  const regList = (regs ?? []) as Row[]
  const itemList = (items ?? []) as Row[]

  const regIdToSlug = new Map<string, string>()
  for (const r of regList) regIdToSlug.set(r.id as string, r.slug as string)

  // Items je (slug, item_key) → { de, en }
  const itemsBySlug = new Map<string, Map<string, { de?: Row; en?: Row }>>()
  for (const it of itemList) {
    const slug = regIdToSlug.get(it.regulation_id as string)
    if (!slug) continue
    let m = itemsBySlug.get(slug); if (!m) { m = new Map(); itemsBySlug.set(slug, m) }
    let e = m.get(it.item_key as string); if (!e) { e = {}; m.set(it.item_key as string, e) }
    e[(it.locale as 'de' | 'en')] = it
  }

  // Regularien je slug → { de, en }
  const regsBySlug = new Map<string, { de?: Row; en?: Row }>()
  const order: string[] = []
  for (const r of regList) {
    const slug = r.slug as string
    let e = regsBySlug.get(slug); if (!e) { e = {}; regsBySlug.set(slug, e); order.push(slug) }
    e[(r.locale as 'de' | 'en')] = r
  }

  const regulations = order.map(slug => {
    const { de, en } = regsBySlug.get(slug)!
    const base = de ?? en!
    const itemMap = itemsBySlug.get(slug) ?? new Map()
    const itemsOut = [...itemMap.entries()]
      .map(([item_key, pair]) => {
        const ib = (pair.de ?? pair.en)!
        return {
          item_key,
          article: ib.article ?? null,
          source_url: ib.source_url ?? null,
          last_verified: ib.last_verified ?? null,
          risk_class: ib.risk_class ?? null,
          category: ib.category ?? null,
          display_order: ib.display_order ?? 0,
          is_published: ib.is_published ?? true,
          de: pair.de ? { label: pair.de.label, description: pair.de.description ?? null, relevance: pair.de.relevance ?? null } : null,
          en: pair.en ? { label: pair.en.label, description: pair.en.description ?? null, relevance: pair.en.relevance ?? null } : null,
        }
      })
      .sort((a, b) => (a.display_order as number) - (b.display_order as number))
    return {
      slug,
      category: base.category,
      display_order: base.display_order ?? 0,
      is_published: base.is_published ?? true,
      de: de ? { short_label: de.short_label, label: de.label, description: de.description ?? null, applicability: de.applicability ?? null } : null,
      en: en ? { short_label: en.short_label, label: en.label, description: en.description ?? null, applicability: en.applicability ?? null } : null,
      itemCount: itemsOut.length,
      items: itemsOut,
    }
  })

  return NextResponse.json({ regulations })
}

// ─── POST: Upsert einer Regularie ODER eines Items (beide Locale-Zeilen) ─────
export async function POST(req: Request) {
  const g = await guard(); if (g) return g
  const body = await req.json().catch(() => null)
  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 })

  const supabase = await createAdminClient()
  const d = parsed.data

  if (d.kind === 'regulation') {
    const rows = LOCALES.map(loc => ({
      slug: d.slug, locale: loc, category: d.category,
      short_label: d[loc].short_label, label: d[loc].label,
      description: d[loc].description ?? null, applicability: d[loc].applicability ?? null,
      display_order: d.display_order, is_published: d.is_published,
    }))
    const { error } = await supabase.from('compliance_regulations').upsert(rows, { onConflict: 'slug,locale' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // kind === 'item' — Regularie-Zeilen-IDs je Locale ermitteln
  const { data: regRows } = await supabase.from('compliance_regulations').select('id, locale').eq('slug', d.regulation_slug)
  const regIdByLocale = new Map<string, string>((regRows ?? []).map((r: { id: string; locale: string }) => [r.locale, r.id]))
  if (!regIdByLocale.get('de') || !regIdByLocale.get('en')) {
    return NextResponse.json({ error: `Regularie ${d.regulation_slug} existiert nicht (beide Locales erforderlich)` }, { status: 422 })
  }
  const rows = LOCALES.map(loc => ({
    regulation_id: regIdByLocale.get(loc)!, item_key: d.item_key, locale: loc,
    risk_class: d.risk_class ?? null, article: d.article ?? null, source_url: d.source_url ?? null,
    last_verified: d.last_verified ?? null, category: d.category ?? null,
    label: d[loc].label, description: d[loc].description ?? null, relevance: d[loc].relevance ?? null,
    display_order: d.display_order, is_published: d.is_published,
  }))
  const { error } = await supabase.from('compliance_checklist_items').upsert(rows, { onConflict: 'regulation_id,item_key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// ─── DELETE: Regularie (?slug=) oder Item (?slug=&item_key=), beide Locales ──
export async function DELETE(req: Request) {
  const g = await guard(); if (g) return g
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const itemKey = searchParams.get('item_key')
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

  const supabase = await createAdminClient()
  if (itemKey) {
    const { data: regRows } = await supabase.from('compliance_regulations').select('id').eq('slug', slug)
    const ids = (regRows ?? []).map((r: { id: string }) => r.id)
    const { error } = await supabase.from('compliance_checklist_items').delete().in('regulation_id', ids).eq('item_key', itemKey)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // Cascade löscht die Items automatisch (FK ON DELETE CASCADE).
    const { error } = await supabase.from('compliance_regulations').delete().eq('slug', slug)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
