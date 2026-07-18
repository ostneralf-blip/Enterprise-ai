import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

// Listet KI-Komponentenvorschläge ohne Katalog-Treffer, protokolliert von
// log_catalog_suggestion() in der Analyse-Route.
// ?view=pending (Default): offene Vorschläge, häufigste zuerst.
// ?view=history: bereits entschiedene Vorschläge (hinzugefügt/verworfen),
// neueste Entscheidung zuerst — für Nachvollziehbarkeit, wer wann was
// entschieden hat.
export async function GET(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const view = new URL(request.url).searchParams.get('view') === 'history' ? 'history' : 'pending'
  const supabase = await createClient()

  if (view === 'history') {
    const { data, error } = await supabase
      .from('catalog_suggestions')
      .select('id, suggested_name, module, section, occurrence_count, status, resolved_at, catalog_component:component_catalog(name)')
      .in('status', ['added', 'dismissed'])
      .order('resolved_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  const { data, error } = await supabase
    .from('catalog_suggestions')
    .select('id, suggested_name, module, section, context, occurrence_count, created_at, last_seen_at, enrichment, enrichment_status')
    .eq('status', 'pending')
    .order('occurrence_count', { ascending: false })
    .order('last_seen_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
