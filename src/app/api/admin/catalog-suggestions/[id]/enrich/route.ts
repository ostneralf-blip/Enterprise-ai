import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'
import { enrichCatalogSuggestion } from '@/lib/ai/catalog-enrichment'

// Manuelles (Neu-)Auslösen der Produktanreicherung — z. B. wenn der erste
// automatische Versuch fehlgeschlagen ist oder ein Admin die Angaben nach
// einer Katalog-Änderung neu ermitteln lassen will. Anders als der
// automatische Trigger in der Analyse-Route (fire-and-forget über after())
// läuft dieser Call SYNCHRON innerhalb des Requests — der Admin klickt den
// Button bewusst und wartet auf das Ergebnis, kein separates "pending"-UI nötig.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: suggestion, error } = await supabase
    .from('catalog_suggestions')
    .select('id, suggested_name, module, section, context')
    .eq('id', id)
    .single()

  if (error || !suggestion) return NextResponse.json({ error: 'Vorschlag nicht gefunden' }, { status: 404 })

  await enrichCatalogSuggestion({
    suggestionId: suggestion.id,
    name: suggestion.suggested_name,
    module: suggestion.module,
    section: suggestion.section,
    context: (suggestion.context as Record<string, unknown>) ?? {},
  })

  const { data: updated } = await supabase
    .from('catalog_suggestions')
    .select('id, suggested_name, module, section, context, occurrence_count, created_at, last_seen_at, enrichment, enrichment_status')
    .eq('id', id)
    .single()

  return NextResponse.json({ data: updated })
}
