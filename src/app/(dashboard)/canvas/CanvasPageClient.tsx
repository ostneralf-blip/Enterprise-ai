'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CANVAS_FIELDS } from '@/config/canvas-data'
import { InfoHint, HintBox } from '@/components/shared/InfoHint'
import type { Canvas, CanvasData, Archetype, Tier } from '@/types'

function analyzeCanvasData(data: CanvasData) {
  const text = Object.values(data).join(' ').toLowerCase()
  const platform: string[] = []
  if (/\bsap\b/.test(text)) platform.push('SAP')
  if (/\bazure\b/.test(text)) platform.push('Azure')
  if (/\baws\b|amazon web/.test(text)) platform.push('AWS')
  if (/\bgcp\b|google cloud/.test(text)) platform.push('GCP')
  if (/on.?prem|\bserver\b|\blokal\b/.test(text)) platform.push('On-Premises')

  const usecaseType =
    /generativ|llm|sprachmodell|chatbot|gpt/.test(text) ? 'Generative AI' :
    /prognose|vorhersage|forecast|predict/.test(text) ? 'Predictive Analytics' :
    /automatisier|workflow|rpa/.test(text) ? 'Prozessautomatisierung' :
    /vision|bilderkennung|computer.?vision/.test(text) ? 'Computer Vision' : null

  const compliance: string[] = []
  if (/dsgvo|datenschutz|personenbezogen|gdpr|art\.?\s*6|art\.?\s*9|betroffene|auskunftsrecht|lösch|auftragsverarbeitung|\bavv\b|datenschutzbeauftragte|privacy|\bdpo\b|einwilligung|verarbeitungsverzeichnis/.test(text)) compliance.push('DSGVO relevant')
  if (/eu.?ai.?act|ki.?verordnung|hochrisiko|high.?risk|verbotene ki|prohibited|transparenzpflicht|konformitätsbewertung|technische dokumentation|ce.?kennzeichnung/.test(text)) compliance.push('EU AI Act relevant')
  if (/eu.hosting|eu.server|frankfurt|irland|amsterdam|rechenzentrum europa|cloud act|schrems|drittland|standardvertragsklausel|angemessenheitsbeschluss|onshore|datensouveränität/.test(text)) compliance.push('EU-Hosting / Datensouveränität')
  if (/iso.?27001|isms|informationssicherheit|it.?sicherheit|soc.?2|soc2|penetrationstest|pentest|schwachstellen/.test(text)) compliance.push('ISO 27001 / IT-Sicherheit relevant')
  if (/nis.?2|nis2|kritis|kritische infrastruktur|netzwerk.*informationssicherheit|cyber.?sicherheit|meldepflicht.*vorfall/.test(text)) compliance.push('NIS2 / KRITIS relevant')
  if (/gesundheit|patientendaten|medizin|klinik|krankenhaus|hipaa|mdr|medizinprodukt/.test(text)) compliance.push('Gesundheitsdaten / MDR relevant')
  if (/finanz|banking|zahlungs|psd2|mifid|bafin|kreditinstitut|versicherung/.test(text)) compliance.push('Finanzregulierung relevant')

  const filledCount = Object.values(data).filter(v => v?.trim()).length
  return { platform, usecaseType, compliance, filledCount }
}

export function platformToProvider(platform: string): string | null {
  const map: Record<string, string> = { SAP: 'sap', Azure: 'azure', AWS: 'aws', GCP: 'gcp' }
  return map[platform] ?? null
}

export function usecaseToApiType(usecaseType: string | null): string | null {
  if (!usecaseType) return null
  if (usecaseType.includes('Generative')) return 'generative'
  if (usecaseType.includes('Predictive')) return 'predictive'
  if (usecaseType.includes('Vision')) return 'vision'
  if (usecaseType.includes('Prozess')) return 'automation'
  return null
}

const ARCHETYPE_BTNS: { id: Archetype; label: string }[] = [
  { id: 'starter', label: 'AI Starter' },
  { id: 'scaler', label: 'AI Scaler' },
  { id: 'transformer', label: 'AI Transformer' },
]

interface Props {
  initialCanvases: Canvas[]
  tier: Tier
}

export function CanvasPageClient({ initialCanvases, tier }: Props) {
  const [canvases, setCanvases] = useState<Canvas[]>(initialCanvases)
  const [active, setActive] = useState<Canvas | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const insights = useMemo(() => active ? analyzeCanvasData(active.data) : null, [active])
  const [catalogSuggestions, setCatalogSuggestions] = useState<Array<{ name: string; architecture_layer: string | null }> | null>(null)

  const detectedProvider = insights && insights.platform.length > 0
    ? platformToProvider(insights.platform[0])
    : null
  const detectedUsecase = insights ? usecaseToApiType(insights.usecaseType) : null

  useEffect(() => {
    if (!detectedProvider) return
    const controller = new AbortController()
    fetch(`/api/catalog/components?cloud_provider=${detectedProvider}`, { signal: controller.signal })
      .then(async r => {
        if (!r.ok) return
        const json = await r.json() as { data: Array<{ name: string; architecture_layer: string | null; use_case_types: string[] }> }
        const suggestions = json.data
          .filter(c => !detectedUsecase || c.use_case_types.includes(detectedUsecase))
          .slice(0, 5)
          .map(c => ({ name: c.name, architecture_layer: c.architecture_layer }))
        setCatalogSuggestions(suggestions)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [detectedProvider, detectedUsecase])

  const handleCreate = async () => {
    const res = await fetch('/api/canvas', { method: 'POST' })
    if (!res.ok) return
    const { data } = await res.json() as { data: Canvas }
    setCanvases(prev => [data, ...prev])
    setActive(data)
  }

  const handleSave = async () => {
    if (!active) return
    setSaving(true)
    const res = await fetch(`/api/canvas/${active.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: active.title, archetype: active.archetype, data: active.data }),
    })
    setSaving(false)
    if (res.ok) {
      const { data: updated } = await res.json() as { data: Canvas }
      setCanvases(prev => prev.map(c => c.id === updated.id ? updated : c))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/canvas/${id}`, { method: 'DELETE' })
    setCanvases(prev => prev.filter(c => c.id !== id))
    if (active?.id === id) setActive(null)
  }

  if (active) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setActive(null)}
            className="text-sm text-slate-500 hover:text-slate-700 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1 rounded"
          >
            ← Zurück
          </button>
          <input
            value={active.title}
            onChange={e => setActive(prev => prev ? { ...prev, title: e.target.value } : prev)}
            placeholder="Canvas-Titel eingeben…"
            className="flex-1 min-w-0 text-xl font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-slate-300 focus:border-primary-ring focus:bg-white focus:outline-none transition-colors"
            aria-label="Canvas-Titel"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary disabled:opacity-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            {saved ? '✓ Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
          </button>
          <a
            href={tier !== 'free' ? '/api/export/pdf?module=canvas' : '/upgrade'}
            {...(tier !== 'free' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 inline-flex items-center gap-1.5"
          >
            PDF{tier === 'free' && <span className="text-xs opacity-60">· Pro</span>}
          </a>
        </div>

        <div className="flex gap-2 mb-5" role="group" aria-label="Unternehmensarchetyp">
          {ARCHETYPE_BTNS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(prev => prev ? { ...prev, archetype: id } : prev)}
              aria-pressed={active.archetype === id}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1',
                active.archetype === id
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CANVAS_FIELDS.map(field => (
            <section
              key={field.id}
              aria-labelledby={`canvas-field-${field.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-4"
            >
              <label
                id={`canvas-field-${field.id}`}
                htmlFor={`canvas-input-${field.id}`}
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1"
              >
                {field.label}
              </label>
              <p className="text-xs text-slate-400 mb-2">{field.description}</p>
              <textarea
                id={`canvas-input-${field.id}`}
                value={active.data[field.id]}
                onChange={e => setActive(prev => {
                  if (!prev) return prev
                  return { ...prev, data: { ...prev.data, [field.id]: e.target.value } }
                })}
                placeholder={field.placeholder}
                rows={4}
                className="w-full text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none"
              />
            </section>
          ))}
        </div>

        {/* Kontextanalyse-Panel */}
        {insights && insights.filledCount >= 2 && (
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Kontextanalyse</h2>
              <InfoHint title="Was ist die Kontextanalyse?" side="top">
                <p>Während Sie Ihren Canvas ausfüllen, analysiert das Tool automatisch Schlüsselbegriffe und erkennt Plattformen, Use-Case-Typen und Compliance-Anforderungen.</p>
                <p className="mt-1.5">Diese Erkenntnisse werden in anderen Modulen verwendet — z. B. schlägt der Architektur-Generator passende Komponenten vor, wenn SAP oder Azure erkannt wurde.</p>
                <p className="mt-1.5">Die Analyse verbessert sich, je vollständiger der Canvas ist ({insights.filledCount}/8 Felder ausgefüllt).</p>
              </InfoHint>
            </div>

            {insights.filledCount < 4 && (
              <HintBox variant="tip" className="text-xs">
                Füllen Sie mehr Felder aus, um präzisere Empfehlungen zu erhalten ({insights.filledCount}/8 ausgefüllt).
              </HintBox>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Plattform</p>
                {insights.platform.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {insights.platform.map(p => (
                      <span key={p} className="text-xs bg-primary-soft text-primary-hover rounded-full px-2 py-0.5 font-medium">{p}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Nicht erkannt</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">AI-Typ</p>
                {insights.usecaseType ? (
                  <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium">{insights.usecaseType}</span>
                ) : (
                  <p className="text-xs text-slate-400">Nicht erkannt</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Compliance</p>
                {insights.compliance.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {insights.compliance.map(c => (
                      <span key={c} className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">{c}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Keine Flags</p>
                )}
              </div>
            </div>

            {detectedProvider && catalogSuggestions && catalogSuggestions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Passende Komponenten</p>
                <div className="flex flex-wrap gap-1">
                  {catalogSuggestions.map(c => (
                    <span key={c.name} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">{c.name}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1 border-t border-slate-200">
              <p className="text-xs text-slate-500 flex-1">Erkannte Signale automatisch in anderen Modulen verwenden:</p>
              <Link href="/architecture" className="text-xs text-primary hover:underline whitespace-nowrap font-medium">
                → Architektur
              </Link>
              <Link href="/compliance" className="text-xs text-primary hover:underline whitespace-nowrap font-medium">
                → Compliance
              </Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500">
          {canvases.length === 0 ? 'Noch kein Canvas erstellt' : `${canvases.length} Canvas${canvases.length !== 1 ? 'se' : ''}`}
        </p>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          + Neues Canvas
        </button>
      </div>

      {canvases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="text-3xl mb-3 text-slate-300" aria-hidden="true">□</div>
          <p className="text-slate-500 text-sm mb-4">
            Strukturiertes Template für neue AI-Initiativen — 8 Felder, vom Problem bis zu den nächsten Schritten.
          </p>
          <button
            onClick={handleCreate}
            className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            Canvas erstellen
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
          {canvases.map(canvas => (
            <li key={canvas.id}>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-1.5 mb-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate min-w-0">{canvas.title}</p>
                  <span className="text-slate-300 text-xs flex-shrink-0" title="Titel im Editor bearbeitbar">✎</span>
                </div>
                {canvas.archetype && (
                  <p className="text-xs text-slate-400 mb-1 capitalize">{canvas.archetype}</p>
                )}
                <p className="text-xs text-slate-300 mb-3">
                  {new Date(canvas.updated_at).toLocaleDateString('de-DE')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActive(canvas)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1"
                  >
                    Öffnen
                  </button>
                  <button
                    onClick={() => handleDelete(canvas.id)}
                    aria-label={`${canvas.title} löschen`}
                    className="px-3 py-1.5 text-xs border border-red-100 rounded-lg text-red-400 hover:bg-red-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
