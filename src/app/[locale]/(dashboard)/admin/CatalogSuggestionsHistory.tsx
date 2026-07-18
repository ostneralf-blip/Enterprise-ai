'use client'
import { useEffect, useState } from 'react'

interface HistoryEntry {
  id: string
  suggested_name: string
  module: string
  section: string | null
  occurrence_count: number
  status: 'added' | 'dismissed'
  resolved_at: string | null
  catalog_component: { name: string } | null
}

// Verlauf bereits entschiedener catalog_suggestions (#Katalog-Erweiterung,
// 18.07.2026): zeigt, was hinzugefügt oder verworfen wurde — Nachvollziehbarkeit
// für spätere Rückfragen ("warum ist X im Katalog / warum nicht").
export function CatalogSuggestionsHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/admin/catalog-suggestions?view=history')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(({ data }: { data: HistoryEntry[] }) => {
        setEntries(data ?? [])
        setError(null)
      })
      .catch(() => setError('Verlauf konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-ink-muted py-6">Lädt…</p>
  if (error) return <p className="text-sm text-danger py-2">{error}</p>
  if (entries.length === 0) return <p className="text-sm text-ink-subtle py-6">Noch keine Entscheidungen.</p>

  return (
    <div className="space-y-2 py-2">
      {entries.map(e => (
        <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 bg-white border border-line rounded-xl px-4 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{e.suggested_name}</p>
            <p className="text-xs text-ink-subtle mt-0.5">
              {e.occurrence_count}× gesehen · {e.module}{e.section ? ` / ${e.section}` : ''}
              {e.status === 'added' && e.catalog_component?.name && ` · als "${e.catalog_component.name}" übernommen`}
              {e.resolved_at && ` · ${new Date(e.resolved_at).toLocaleDateString('de-DE')}`}
            </p>
          </div>
          <span className={
            e.status === 'added'
              ? 'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-success-subtle text-success-text'
              : 'shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-surface-raised text-ink-secondary'
          }>
            {e.status === 'added' ? 'Hinzugefügt' : 'Verworfen'}
          </span>
        </div>
      ))}
    </div>
  )
}
