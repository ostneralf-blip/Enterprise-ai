import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const now = new Date().toISOString()

  const [
    { count: activeCount },
    { count: expiredCount },
    { data: oldest },
    { data: newest },
    { data: sizeRow },
    { data: statsToday },
    { data: stats7d },
  ] = await Promise.all([
    admin.from('ai_prompt_cache').select('*', { count: 'exact', head: true }).gt('expires_at', now),
    admin.from('ai_prompt_cache').select('*', { count: 'exact', head: true }).lte('expires_at', now),
    admin.from('ai_prompt_cache').select('created_at').order('created_at', { ascending: true }).limit(1).maybeSingle(),
    admin.from('ai_prompt_cache').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.rpc('cache_estimated_size_bytes') as unknown as Promise<{ data: number | null; error: unknown }>,
    admin.from('ai_cache_stats')
      .select('module, hits, misses')
      .eq('day', new Date().toISOString().slice(0, 10)),
    admin.from('ai_cache_stats')
      .select('module, hits, misses')
      .gte('day', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
  ])

  // Aggregate hit/miss per module for 7d
  const moduleMap: Record<string, { hits: number; misses: number }> = {}
  for (const row of (stats7d ?? [])) {
    const m = row.module as string
    if (!moduleMap[m]) moduleMap[m] = { hits: 0, misses: 0 }
    moduleMap[m].hits   += (row.hits as number)
    moduleMap[m].misses += (row.misses as number)
  }
  const topModules = Object.entries(moduleMap)
    .map(([module, s]) => ({ module, hits: s.hits, misses: s.misses, total: s.hits + s.misses }))
    .sort((a, b) => b.total - a.total)

  // Today aggregate
  const todayHits   = (statsToday ?? []).reduce((s, r) => s + (r.hits as number), 0)
  const todayMisses = (statsToday ?? []).reduce((s, r) => s + (r.misses as number), 0)
  const todayTotal  = todayHits + todayMisses

  // 7d aggregate
  const d7Hits   = Object.values(moduleMap).reduce((s, m) => s + m.hits, 0)
  const d7Misses = Object.values(moduleMap).reduce((s, m) => s + m.misses, 0)
  const d7Total  = d7Hits + d7Misses

  return NextResponse.json({
    active:   activeCount ?? 0,
    expired:  expiredCount ?? 0,
    oldest:   oldest?.created_at ?? null,
    newest:   newest?.created_at ?? null,
    estimatedBytes: sizeRow ?? null,
    hitRateToday: todayTotal > 0 ? Math.round((todayHits / todayTotal) * 100) : null,
    hitRate7d:    d7Total   > 0 ? Math.round((d7Hits   / d7Total)   * 100) : null,
    topModules,
  })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = await createAdminClient()
  const { count, error } = await admin
    .from('ai_prompt_cache')
    .delete({ count: 'exact' })
    .lte('expires_at', new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: count ?? 0 })
}
