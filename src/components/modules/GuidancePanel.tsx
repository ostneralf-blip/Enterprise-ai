import { createClient } from '@/lib/supabase/server'
import { GuidanceDrawer } from './GuidanceDrawer'
import type { GuidanceCategory } from './GuidanceCard'

interface Props {
  module: string
  contextKey: string
}

export async function GuidancePanel({ module, contextKey }: Props) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_library')
    .select('id, title, content, category, source, context_key')
    .eq('module', module)
    .eq('context_key', contextKey)
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (!data || data.length === 0) return null

  const entries = data.map(e => ({
    id: e.id,
    title: e.title,
    content: e.content,
    category: e.category as GuidanceCategory,
    source: e.source,
    context_key: e.context_key,
  }))

  return (
    <div className="flex justify-end mb-4 -mt-2">
      <GuidanceDrawer entries={entries} module={module} />
    </div>
  )
}
