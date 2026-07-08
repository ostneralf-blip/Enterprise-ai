import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { GuidanceDrawer } from './GuidanceDrawer'
import type { GuidanceCategory } from './GuidanceCard'

interface Props {
  module: string
  contextKey: string
}

export async function GuidancePanel({ module, contextKey }: Props) {
  const supabase = await createClient()
  const locale = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()

  const baseQuery = supabase
    .from('content_library')
    .select('id, title, content, category, source, context_key, min_tier, locale')
    .eq('module', module)
    .eq('context_key', contextKey)
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  const [{ data: localeData }, { data: profile }] = await Promise.all([
    baseQuery.eq('locale', locale),
    user
      ? supabase.from('profiles').select('tier').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  // Fallback auf 'de', wenn keine EN-Blöcke vorhanden
  let data = localeData
  let isFallback = false
  if ((!data || data.length === 0) && locale !== 'de') {
    const { data: fallback } = await baseQuery.eq('locale', 'de')
    data = fallback
    isFallback = true
  }

  if (!data || data.length === 0) return null

  const userTier = (profile as { tier?: string } | null)?.tier ?? 'free'

  const entries = data.map(e => ({
    id: e.id,
    title: e.title,
    content: e.content,
    category: e.category as GuidanceCategory,
    source: e.source,
    context_key: e.context_key,
    min_tier: (e.min_tier as string | null) ?? 'free',
  }))

  return (
    <div className="flex justify-end mb-4 -mt-2">
      <GuidanceDrawer entries={entries} module={module} userTier={userTier} isFallback={isFallback} />
    </div>
  )
}
