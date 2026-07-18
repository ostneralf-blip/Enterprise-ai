import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Service-role client bypasses RLS so all profiles are visible.
  // Paginiert (Lessons Learned 19.07.2026, component_catalog-Vorfall): profiles
  // wächst mit jeder Registrierung — PostgREST kappt jede Antwort hart bei
  // api.max_rows=1000, ein einfaches .select() würde ab >1000 Nutzern
  // stillschweigend neuere/ältere Profile aus der Admin-Liste weglassen.
  const adminClient = await createAdminClient()
  const PAGE_SIZE = 1000
  const users: Record<string, unknown>[] = []
  for (let page = 0; ; page++) {
    const from = page * PAGE_SIZE
    const { data, error } = await adminClient
      .from('profiles')
      .select('id, email, full_name, company, tier, is_admin, is_banned, feature_flags, created_at')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    users.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
  }
  return NextResponse.json({ users })
}
