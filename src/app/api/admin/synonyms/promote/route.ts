// GET  /api/admin/synonyms/promote  — Promotion-Queue (Kandidaten ≥ Schwellen)
// POST /api/admin/synonyms/promote  — Aktion: approve | reject | block
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import { trackServer } from '@/lib/posthog/server'

const ActionSchema = z.object({
  action:   z.enum(['approve', 'reject', 'block']),
  term:     z.string().min(1).max(100),   // synonym (was der User getippt hat)
  vendor:   z.string().min(1).max(100),   // canonical vendor (canvas_synonyms.term)
  synonym_type: z.enum(['vendor', 'category', 'usecase']).default('vendor'),
})

export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()

  // Schwellen aus app_settings laden
  const { data: settings } = await supabase
    .from('app_settings')
    .select('key, value')
    .in('key', ['promotion_min_clients', 'promotion_min_confidence'])

  const minClients    = Number((settings?.find(s => s.key === 'promotion_min_clients')?.value as { value?: number } | null)?.value ?? 3)
  const minConfidence = Number((settings?.find(s => s.key === 'promotion_min_confidence')?.value as { value?: number } | null)?.value ?? 0.80)

  // Queue-Abfrage: client-eigene AI-Einträge, nicht rejected/promoted, nicht global vorhanden
  const { data: rows } = await supabase
    .from('canvas_synonyms')
    .select('term, synonym, synonym_type, evidence_count, avg_confidence, client_id, review_status')
    .not('client_id', 'is', null)
    .eq('source', 'ai')
    .not('review_status', 'in', '(rejected,promoted)')

  if (!rows) return NextResponse.json({ queue: [], minClients, minConfidence })

  // Aggregation: pro (term, synonym, synonym_type) — client_count + avg
  const map = new Map<string, {
    term: string; synonym: string; synonym_type: string
    client_count: number; avg_confidence: number; total_evidence: number
  }>()

  for (const r of rows) {
    const key = `${r.term}::${r.synonym}::${r.synonym_type}`
    const existing = map.get(key)
    const conf = Number(r.avg_confidence ?? 0)
    if (existing) {
      existing.client_count++
      existing.avg_confidence = (existing.avg_confidence * (existing.client_count - 1) + conf) / existing.client_count
      existing.total_evidence += r.evidence_count ?? 1
    } else {
      map.set(key, {
        term: r.term, synonym: r.synonym, synonym_type: r.synonym_type,
        client_count: 1, avg_confidence: conf, total_evidence: r.evidence_count ?? 1,
      })
    }
  }

  const queue = [...map.values()]
    .filter(e => e.client_count >= minClients && e.avg_confidence >= minConfidence)
    .sort((a, b) => b.client_count - a.client_count || b.avg_confidence - a.avg_confidence)

  return NextResponse.json({ queue, minClients, minConfidence })
}

export async function POST(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabaseForUser = await createClient()
  const { data: { user: adminUser } } = await supabaseForUser.auth.getUser()
  const adminUserId = adminUser?.id

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }
  const parsed = ActionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { action, term, vendor, synonym_type } = parsed.data
  const supabase = supabaseForUser

  if (action === 'approve') {
    // Globalen Eintrag anlegen (client_id IS NULL, is_active=true)
    const { error } = await supabase.from('canvas_synonyms').upsert({
      term: vendor, synonym: term.toLowerCase(), synonym_type,
      is_active: true, review_status: 'approved', source: 'admin',
      client_id: null,
    }, { onConflict: 'term,synonym', ignoreDuplicates: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Alle Client-Einträge als promoted markieren
    await supabase.from('canvas_synonyms')
      .update({ review_status: 'promoted' })
      .eq('term', vendor).eq('synonym', term.toLowerCase())
      .not('client_id', 'is', null)

    void trackServer(adminUserId ?? 'admin', 'harvest_promoted', { term, vendor, action: 'approved' })
    return NextResponse.json({ ok: true, action: 'approved', globalCreated: true })
  }

  if (action === 'reject') {
    await supabase.from('canvas_synonyms')
      .update({ review_status: 'rejected' })
      .eq('term', vendor).eq('synonym', term.toLowerCase())
      .not('client_id', 'is', null)

    void trackServer(adminUserId ?? 'admin', 'harvest_promoted', { term, vendor, action: 'rejected' })
    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  if (action === 'block') {
    // Global blocken → detection_blocklist confirmed
    await supabase.from('detection_blocklist').upsert({
      term: term.toLowerCase(), status: 'confirmed', source: 'admin',
    }, { onConflict: 'term', ignoreDuplicates: false })

    // Client-Einträge ablehnen
    await supabase.from('canvas_synonyms')
      .update({ review_status: 'rejected' })
      .eq('term', vendor).eq('synonym', term.toLowerCase())
      .not('client_id', 'is', null)

    void trackServer(adminUserId ?? 'admin', 'harvest_promoted', { term, vendor, action: 'blocked' })
    return NextResponse.json({ ok: true, action: 'blocked' })
  }

  return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 })
}
