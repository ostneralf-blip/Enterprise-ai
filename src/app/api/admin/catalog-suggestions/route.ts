import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

// Listet offene ("pending") KI-Komponentenvorschläge ohne Katalog-Treffer,
// protokolliert von log_catalog_suggestion() in der Analyse-Route.
// Häufigste zuerst — signalisiert, welche Katalog-Lücke am meisten auffällt.
export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
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
