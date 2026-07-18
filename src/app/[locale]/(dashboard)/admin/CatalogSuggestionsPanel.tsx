'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Suggestion {
  id: string
  suggested_name: string
  module: string
  section: string | null
  context: { architecture_id?: string; archetype?: string | null } | null
  occurrence_count: number
  created_at: string
  last_seen_at: string
}

const ARCH_LAYERS = ['data', 'model', 'serving', 'mlops', 'application', 'governance', 'security']
const CLOUD_PROVIDERS = ['aws', 'azure', 'gcp', 'sap', 'independent']

// Review-UI für catalog_suggestions (#Katalog-Erweiterung, 18.07.2026): KI-Vorschläge
// ohne Katalog-Treffer landen hier statt lautlos zu verschwinden. Bewusst als eigene,
// selbst-fetchende Komponente statt weiterer Verzweigung in AdminPageClient.tsx —
// die Datei ist bereits ein 2800-Zeilen-Monolith, neue Tabs sollten das nicht verschärfen.
export function CatalogSuggestionsPanel() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openFormFor, setOpenFormFor] = useState<string | null>(null)
  const [form, setForm] = useState({ vendor: '', category: 'packaged_app', architecture_layer: 'application', cloud_provider: '' })
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    void fetch('/api/admin/catalog-suggestions')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(({ data }: { data: Suggestion[] }) => {
        setSuggestions(data ?? [])
        setError(null)
      })
      .catch(() => setError('Vorschläge konnten nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [])

  const dismiss = async (id: string) => {
    setBusyId(id)
    await fetch(`/api/admin/catalog-suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss' }),
    })
    setSuggestions(prev => prev.filter(s => s.id !== id))
    setBusyId(null)
  }

  const addToCatalog = async (s: Suggestion) => {
    setBusyId(s.id)
    try {
      const createRes = await fetch('/api/admin/catalog/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: s.suggested_name,
          vendor: form.vendor || undefined,
          category: form.category || undefined,
          architecture_layer: form.architecture_layer || undefined,
          cloud_provider: form.cloud_provider || undefined,
        }),
      })
      if (!createRes.ok) throw new Error()
      const { data: created } = await createRes.json()
      await fetch(`/api/admin/catalog-suggestions/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', catalog_component_id: created.id }),
      })
      setSuggestions(prev => prev.filter(x => x.id !== s.id))
      setOpenFormFor(null)
    } catch {
      setError('Katalog-Eintrag konnte nicht angelegt werden.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="text-sm text-ink-muted py-6">Lädt…</p>

  return (
    <div className="space-y-4 py-2">
      {error && <p className="text-sm text-danger">{error}</p>}
      <p className="text-sm text-ink-muted">
        KI-Vorschläge aus dem Architektur-Generator ohne Katalog-Treffer — {suggestions.length} offen.
      </p>

      {suggestions.length === 0 && (
        <p className="text-sm text-ink-subtle py-6">Aktuell keine offenen Vorschläge.</p>
      )}

      <div className="space-y-3">
        {suggestions.map(s => (
          <div key={s.id} className="bg-white border border-line rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{s.suggested_name}</p>
                <p className="text-xs text-ink-subtle mt-0.5">
                  {s.occurrence_count}× gesehen · {s.module}{s.section ? ` / ${s.section}` : ''} · zuletzt {new Date(s.last_seen_at).toLocaleDateString('de-DE')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setOpenFormFor(openFormFor === s.id ? null : s.id)}
                  disabled={busyId === s.id}
                  className="whitespace-nowrap px-3 py-1.5 bg-primary hover:bg-primary text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Zum Katalog hinzufügen
                </button>
                <button
                  onClick={() => void dismiss(s.id)}
                  disabled={busyId === s.id}
                  className="whitespace-nowrap px-3 py-1.5 border border-line text-ink-secondary text-xs font-semibold rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  Verwerfen
                </button>
              </div>
            </div>

            {openFormFor === s.id && (
              <div className="mt-3 pt-3 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Hersteller</span>
                  <input
                    value={form.vendor}
                    onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                    className="mt-1 w-full border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface"
                    placeholder="z. B. SAP"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Architektur-Layer</span>
                  <select
                    value={form.architecture_layer}
                    onChange={e => setForm(f => ({ ...f, architecture_layer: e.target.value }))}
                    className="mt-1 w-full border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface"
                  >
                    {ARCH_LAYERS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Cloud-Provider</span>
                  <select
                    value={form.cloud_provider}
                    onChange={e => setForm(f => ({ ...f, cloud_provider: e.target.value }))}
                    className="mt-1 w-full border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface"
                  >
                    <option value="">—</option>
                    {CLOUD_PROVIDERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <div className="sm:col-span-3">
                  <button
                    onClick={() => void addToCatalog(s)}
                    disabled={busyId === s.id}
                    className={cn(
                      'whitespace-nowrap px-4 py-2 bg-primary hover:bg-primary text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
                    )}
                  >
                    Katalog-Eintrag &quot;{s.suggested_name}&quot; anlegen
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
