// GET /api/canvas/active-synonyms
// Liefert globale aktive + client-eigene aktive Synonyme als Record<vendor, string[]>
// für die Detection-Merge im Client (extraAliases-Parameter von analyzeCanvas).
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ aliases: {} })

  // Globale aktive + eigene client-aktive Einträge — RLS stellt sicher, dass nur diese sichtbar sind
  const { data } = await supabase
    .from('canvas_synonyms')
    .select('term, synonym')
    .eq('synonym_type', 'vendor')
    .eq('is_active', true)

  if (!data) return NextResponse.json({ aliases: {} })

  // Format: { 'SAP': ['successfactor', 'unser_hrsys'], 'Microsoft': [...] }
  const aliases: Record<string, string[]> = {}
  for (const row of data) {
    if (!aliases[row.term]) aliases[row.term] = []
    aliases[row.term].push(row.synonym.toLowerCase())
  }

  return NextResponse.json({ aliases })
}
