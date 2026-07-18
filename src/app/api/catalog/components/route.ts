import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PostgREST kappt jede Antwort hart bei api.max_rows (1000, supabase/config.toml) —
// unabhängig vom angeforderten Range. Der Katalog liegt inzwischen bei >1400 aktiven
// Einträgen (CNCF-/HuggingFace-Sync), und die Sortierung nach architecture_layer
// absteigend liefert den Layer 'application' als letzten zurück — bei >1000 Zeilen
// fiel dieser komplette Layer (inkl. aller packaged_app-Einträge) aus der Antwort.
// Fix: serverseitig in 1000er-Seiten paginieren, bis eine Seite < PAGE_SIZE liefert.
const PAGE_SIZE = 1000

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const vendor        = searchParams.get('vendor')
  const layer         = searchParams.get('layer')
  const cloudProvider = searchParams.get('cloud_provider')
  const hosting       = searchParams.get('hosting')
  const sapCompatible = searchParams.get('sap_compatible')
  const search         = searchParams.get('q')

  const buildQuery = (from: number, to: number) => {
    let query = supabase
      .from('component_catalog')
      .select('*')
      .eq('is_active', true)
      .order('architecture_layer', { ascending: false, nullsFirst: false })
      .order('name', { ascending: true })
      .range(from, to)

    if (vendor)        query = query.eq('vendor', vendor)
    if (layer)         query = query.eq('architecture_layer', layer)
    if (cloudProvider) query = query.eq('cloud_provider', cloudProvider)
    if (hosting)       query = query.contains('hosting', [hosting])
    if (sapCompatible) query = query.eq('sap_compatible', sapCompatible === 'true')
    if (search)        query = query.ilike('name', `%${search}%`)
    return query
  }

  const rows: Record<string, unknown>[] = []
  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }

  return NextResponse.json({ data: rows })
}
