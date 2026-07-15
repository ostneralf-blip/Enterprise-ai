import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ terms: [] })

  const { data } = await supabase
    .from('detection_blocklist')
    .select('term')
    .in('status', ['pending', 'confirmed'])

  const terms = (data ?? []).map(r => r.term.toLowerCase())
  return NextResponse.json({ terms })
}
