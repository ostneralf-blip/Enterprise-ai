'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { CatalogSuggestionsHistory } from './CatalogSuggestionsHistory'

interface Enrichment {
  resolved_name: string
  vendor?: string | null
  category?: string | null
  architecture_layer?: string | null
  cloud_provider?: string | null
  hosting: string[]
  dsgvo_status?: 'compliant' | 'conditional' | 'non_compliant' | null
  eu_ai_act_risk?: 'minimal' | 'limited' | 'high' | 'prohibited' | null
  description?: string | null
  website_url?: string | null
}

interface Suggestion {
  id: string
  suggested_name: string
  module: string
  section: string | null
  context: { architecture_id?: string; archetype?: string | null } | null
  occurrence_count: number
  created_at: string
  last_seen_at: string
  enrichment: Enrichment | null
  enrichment_status: 'none' | 'pending' | 'done' | 'failed'
}

const ARCH_LAYERS = ['data', 'model', 'serving', 'mlops', 'application', 'governance', 'security']
const CLOUD_PROVIDERS = ['aws', 'azure', 'gcp', 'sap', 'independent']

const DSGVO_LABEL: Record<string, string> = {
  compliant: 'DSGVO-konform', conditional: 'DSGVO bedingt', non_compliant: 'DSGVO nicht konform',
}
const DSGVO_COLOR: Record<string, string> = {
  compliant: 'bg-success-subtle text-success-text', conditional: 'bg-warning-subtle text-warning-text', non_compliant: 'bg-error-subtle text-error-text',
}
const RISK_LABEL: Record<string, string> = {
  minimal: 'EU AI Act: minimal', limited: 'EU AI Act: begrenzt', high: 'EU AI Act: hoch', prohibited: 'EU AI Act: verboten',
}

async function fetchSuggestions(): Promise<Suggestion[]> {
  const res = await fetch('/api/admin/catalog-suggestions')
  if (!res.ok) throw new Error()
  const { data } = await res.json()
  return data ?? []
}

// Review-UI für catalog_suggestions (#Katalog-Erweiterung, 18.07.2026): KI-Vorschläge
// ohne Katalog-Treffer landen hier statt lautlos zu verschwinden. Bewusst als eigene,
// selbst-fetchende Komponente statt weiterer Verzweigung in AdminPageClient.tsx —
// die Datei ist bereits ein 2800-Zeilen-Monolith, neue Tabs sollten das nicht verschärfen.
//
// Jeder neue Vorschlag wird serverseitig asynchron per eigenem Sonnet-Call (nicht dem
// Nutzer-Kontingent zugerechnet, siehe lib/ai/catalog-enrichment.ts) mit Produkt-
// Metadaten angereichert — Hersteller, Kategorie, DSGVO-Status, EU-AI-Act-Risiko,
// Kurzbeschreibung, Hersteller-Link. Das "Zum Katalog hinzufügen"-Formular wird damit
// vorbefüllt, disambiguiert aber auch mehrdeutige Hersteller-Vorschläge wie "Databricks".
export function CatalogSuggestionsPanel() {
  const [view, setView] = useState<'pending' | 'history'>('pending')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openFormFor, setOpenFormFor] = useState<string | null>(null)
  const [form, setForm] = useState({ vendor: '', category: 'packaged_app', architecture_layer: 'application', cloud_provider: '', description: '' })
  const [busyId, setBusyId] = useState<string | null>(null)

  const applyLoaded = (data: Suggestion[]) => { setSuggestions(data); setError(null) }
  const applyError = () => setError('Vorschläge konnten nicht geladen werden.')

  useEffect(() => {
    void fetchSuggestions().then(applyLoaded).catch(applyError).finally(() => setLoading(false))
  }, [])

  const refresh = () => {
    setLoading(true)
    void fetchSuggestions().then(applyLoaded).catch(applyError).finally(() => setLoading(false))
  }

  const populateForm = (e: Enrichment | null) => setForm({
    vendor: e?.vendor ?? '',
    category: e?.category ?? 'packaged_app',
    architecture_layer: e?.architecture_layer ?? 'application',
    cloud_provider: e?.cloud_provider ?? '',
    description: e?.description ?? '',
  })

  const enrichNow = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/catalog-suggestions/${id}/enrich`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setSuggestions(prev => prev.map(s => s.id === id ? data : s))
      // Formular war für diesen Vorschlag bereits offen (Bug-Report Daniel,
      // 18.07.2026): zeigte nach "Erneut anreichern" weiterhin die alten,
      // leeren Werte, weil das Formular nur beim ÖFFNEN neu befüllt wurde.
      if (openFormFor === id) populateForm(data.enrichment ?? null)
    } catch {
      setError('Anreicherung fehlgeschlagen.')
    } finally {
      setBusyId(null)
    }
  }

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

  const openForm = (s: Suggestion) => {
    if (openFormFor === s.id) { setOpenFormFor(null); return }
    populateForm(s.enrichment)
    setOpenFormFor(s.id)
  }

  const addToCatalog = async (s: Suggestion) => {
    setBusyId(s.id)
    try {
      const e = s.enrichment
      const createRes = await fetch('/api/admin/catalog/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: e?.resolved_name || s.suggested_name,
          vendor: form.vendor || undefined,
          category: form.category || undefined,
          architecture_layer: form.architecture_layer || undefined,
          cloud_provider: form.cloud_provider || undefined,
          description: form.description || undefined,
          hosting: e?.hosting?.length ? e.hosting : undefined,
          dsgvo_status: e?.dsgvo_status ?? undefined,
          eu_ai_act_risk: e?.eu_ai_act_risk ?? undefined,
          website_url: e?.website_url ?? undefined,
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

  return (
    <div className="space-y-4 py-2">
      <div className="flex gap-1 border-b border-line">
        {([['pending', 'Offen'], ['history', 'Verlauf']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
              view === id ? 'border-primary text-primary-hover' : 'border-transparent text-ink-muted hover:text-ink-secondary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'history' ? (
        <CatalogSuggestionsHistory />
      ) : loading ? (
        <p className="text-sm text-ink-muted py-6">Lädt…</p>
      ) : (
      <>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          KI-Vorschläge aus dem Architektur-Generator ohne Katalog-Treffer — {suggestions.length} offen.
        </p>
        <button
          onClick={refresh}
          className="whitespace-nowrap px-3 py-1.5 border border-line text-ink-secondary text-xs font-semibold rounded-lg hover:bg-surface-hover transition-colors"
        >
          Aktualisieren
        </button>
      </div>

      {suggestions.length === 0 && (
        <p className="text-sm text-ink-subtle py-6">Aktuell keine offenen Vorschläge.</p>
      )}

      <div className="space-y-3">
        {suggestions.map(s => {
          const e = s.enrichment
          return (
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
                  onClick={() => openForm(s)}
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

            {/* KI-Produktanreicherung */}
            <div className="mt-3 pt-3 border-t border-line-subtle">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {s.enrichment_status === 'none' && (
                    <p className="text-xs text-ink-subtle italic">Anreicherung noch nicht gestartet.</p>
                  )}
                  {s.enrichment_status === 'pending' && (
                    <p className="text-xs text-[color:var(--color-ai)] italic">◆ Produktinformationen werden ermittelt…</p>
                  )}
                  {s.enrichment_status === 'failed' && (
                    <p className="text-xs text-danger italic">Anreicherung fehlgeschlagen — Felder unten manuell prüfen.</p>
                  )}
                  {s.enrichment_status === 'done' && e && (
                    <div className="space-y-1.5">
                      {e.resolved_name !== s.suggested_name && (
                        <p className="text-xs text-ink-secondary"><span className="font-medium">Vermutlich gemeint:</span> {e.resolved_name}</p>
                      )}
                      {e.description && <p className="text-xs text-ink-secondary leading-relaxed">{e.description}</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {e.vendor && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-raised text-ink-secondary">{e.vendor}</span>}
                        {e.dsgvo_status && <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', DSGVO_COLOR[e.dsgvo_status])}>{DSGVO_LABEL[e.dsgvo_status]}</span>}
                        {e.eu_ai_act_risk && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-raised text-ink-secondary">{RISK_LABEL[e.eu_ai_act_risk]}</span>}
                        {e.website_url && (
                          <a href={e.website_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary-soft text-primary hover:underline">
                            Hersteller-Website ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {s.enrichment_status !== 'pending' && (
                  <button
                    onClick={() => void enrichNow(s.id)}
                    disabled={busyId === s.id}
                    className="whitespace-nowrap shrink-0 px-2.5 py-1 text-[10px] font-semibold border border-line text-ink-secondary rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    {busyId === s.id ? 'Läuft…' : s.enrichment_status === 'done' ? 'Erneut anreichern' : 'Anreicherung starten'}
                  </button>
                )}
              </div>
            </div>

            {openFormFor === s.id && (
              <div className="mt-3 pt-3 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block sm:col-span-3">
                  <span className="text-xs font-medium text-ink-secondary">Kurzbeschreibung</span>
                  <input
                    value={form.description}
                    onChange={ev => setForm(f => ({ ...f, description: ev.target.value }))}
                    className="mt-1 w-full border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Hersteller</span>
                  <input
                    value={form.vendor}
                    onChange={ev => setForm(f => ({ ...f, vendor: ev.target.value }))}
                    className="mt-1 w-full border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface"
                    placeholder="z. B. SAP"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Architektur-Layer</span>
                  <select
                    value={form.architecture_layer}
                    onChange={ev => setForm(f => ({ ...f, architecture_layer: ev.target.value }))}
                    className="mt-1 w-full border border-line rounded-lg px-2.5 py-1.5 text-sm text-ink bg-surface"
                  >
                    {ARCH_LAYERS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Cloud-Provider</span>
                  <select
                    value={form.cloud_provider}
                    onChange={ev => setForm(f => ({ ...f, cloud_provider: ev.target.value }))}
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
                    Katalog-Eintrag &quot;{e?.resolved_name || s.suggested_name}&quot; anlegen
                  </button>
                </div>
              </div>
            )}
          </div>
          )
        })}
      </div>
      </>
      )}
    </div>
  )
}
