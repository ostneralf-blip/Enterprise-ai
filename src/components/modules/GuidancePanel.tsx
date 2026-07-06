import { createClient } from '@/lib/supabase/server'
import { GuidanceCard, type GuidanceCategory } from './GuidanceCard'

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

  return (
    <div className="space-y-2 my-4">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">Wissens-Layer</p>
      {data.map(entry => (
        <GuidanceCard
          key={entry.id}
          id={entry.id}
          title={entry.title}
          content={entry.content}
          category={entry.category as GuidanceCategory}
          source={entry.source}
          context_key={entry.context_key}
          module={module}
        />
      ))}
    </div>
  )
}
