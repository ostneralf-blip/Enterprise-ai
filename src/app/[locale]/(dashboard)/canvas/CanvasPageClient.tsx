'use client'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CANVAS_FIELDS } from '@/config/canvas-data'
import { InfoHint, HintBox } from '@/components/shared/InfoHint'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { ShareButton } from '@/components/shared/ShareButton'
import { AIAnalysisButton, AIBadge } from '@/components/shared/AIAnalysisButton'
import type { Canvas, CanvasData, Archetype, Tier } from '@/types'

type CanvasAIEnrichment = {
  use_case_type?: string
  industry?: string
  suggested_quadrant?: string
  suggested_complexity?: string
  infra_hints?: string[]
  additional_compliance_flags?: string[]
  confidence?: number
}

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

// Rohe KI-Compliance-Flags sind Freitext ohne festes Vokabular (der Prompt in
// ai-enrich/route.ts gibt nur Beispiele vor, kein Enum) — bildet sie auf
// dieselben kanonischen Kategorien ab wie die deterministische Erkennung
// oben, statt technische Bezeichner (z.B. "gdpr_sensitive",
// "data_residency_consideration") roh als eigene Badges anzuzeigen.
export function normalizeComplianceFlag(raw: string): string {
  const v = raw.toLowerCase()
  if (/dsgvo|gdpr|personenbezogen|personal.?data|\bpii\b|datenschutz|privacy|consent|einwilligung/.test(v)) return 'DSGVO relevant'
  if (/eu.?ai.?act|ai.?act|hochrisiko|high.?risk.?ai|ki.?verordnung/.test(v)) return 'EU AI Act relevant'
  if (/iso.?27001|isms|informationssicherheit|it.?sicherheit|soc.?2|pentest|schwachstellen|data.?residency|\bresidency\b/.test(v)) return 'ISO 27001 / IT-Sicherheit relevant'
  if (/nis.?2|kritis|critical.?infrastructure/.test(v)) return 'NIS2 / KRITIS relevant'
  if (/health|patient|medical|gesundheit|hipaa|\bmdr\b/.test(v)) return 'Gesundheitsdaten / MDR relevant'
  if (/financ|payment|psd2|bafin|\bbank/.test(v)) return 'Finanzregulierung relevant'
  if (/eu.?host|sovereignt|cross.?border|drittland|schrems/.test(v)) return 'EU-Hosting / Datensouveränität'
  // Fallback: unbekannter Flag — technischen Bezeichner lesbar machen statt roh anzuzeigen
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// Rohe KI-Infra-Hinweise sind ebenfalls Freitext ohne festes Vokabular — bildet
// erkennbare Vendor-/System-Namen und generische Infra-Kategorien auf kurze,
// kanonische Tags ab statt lange technische Sätze (z.B. "RF Scanner
// integration layer", "Warehouse management system bridge") roh als eigene
// Badges in der Platform-Spalte anzuzeigen.
export function normalizeInfraHint(raw: string): string {
  const v = raw.toLowerCase()
  if (/\bsap\b/.test(v)) return 'SAP'
  if (/\bazure\b/.test(v)) return 'Azure'
  if (/\baws\b|amazon web/.test(v)) return 'AWS'
  if (/\bgcp\b|google cloud/.test(v)) return 'GCP'
  if (/navision|dynamics.?nav|dynamics.?365.?business.?central/.test(v)) return 'Microsoft Dynamics (Navision)'
  if (/salesforce/.test(v)) return 'Salesforce'
  if (/snowflake/.test(v)) return 'Snowflake'
  if (/databricks/.test(v)) return 'Databricks'
  if (/\boracle\b/.test(v)) return 'Oracle'
  if (/rf.?scanner|barcode|qr.?code|\bscanner\b/.test(v)) return 'Hardware-/Scanner-Integration'
  if (/warehouse.?management|\bwms\b|lagerverwaltung/.test(v)) return 'WMS-Integration'
  if (/real.?time|echtzeit|\bsync\b/.test(v)) return 'Echtzeit-Datenintegration'
  if (/on.?prem|\bserver\b|\blokal\b/.test(v)) return 'On-Premises'
  if (/\bapi\b/.test(v)) return 'API-Integration'
  // Fallback: unbekannter Hinweis — kürzen statt als vollen Satz anzuzeigen
  const words = raw.split(/\s+/)
  return words.length > 3 ? words.slice(0, 3).join(' ') + '…' : raw
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

// KI-Enrichment liefert use_case_type als Freitext (kein festes Enum) —
// dieselbe Normalisierung wie usecaseToApiType, aber robuster gegenüber
// Englisch/Deutsch-Mischformen aus dem LLM-Ergebnis.
export function aiUseCaseToApiType(useCaseType: string | null | undefined): string | null {
  if (!useCaseType) return null
  const v = useCaseType.toLowerCase()
  if (/generativ|llm|gpt|chatbot|sprachmodell/.test(v)) return 'generative'
  if (/predict|prognose|forecast|vorhersage/.test(v)) return 'predictive'
  if (/vision|bild/.test(v)) return 'vision'
  if (/automat|rpa|workflow|prozess/.test(v)) return 'automation'
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
  const t = useTranslations('modules')
  const tAi = useTranslations('ai')
  const locale = useLocale()
  const [canvases, setCanvases] = useState<Canvas[]>(initialCanvases)
  const [active, setActive] = useState<Canvas | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const insights = useMemo(() => active ? analyzeCanvasData(active.data) : null, [active])
  const [catalogSuggestions, setCatalogSuggestions] = useState<Array<{ name: string; architecture_layer: string | null }> | null>(null)
  const [aiUsage, setAiUsage] = useState<{ remaining: number; used: number; limit: number; exceeded: boolean } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const aiEnrichment = active?.ai_enrichment as CanvasAIEnrichment | undefined

  // Zusammengeführter Kontext: KI-Signale ergänzen/überschreiben die
  // deterministische Keyword-Erkennung, statt in einer separaten Box
  // isoliert angezeigt zu werden.
  const displayUsecaseType = aiEnrichment?.use_case_type ?? insights?.usecaseType ?? null
  const usecaseFromAi = Boolean(aiEnrichment?.use_case_type)
  const displayPlatform = useMemo(() => {
    const base = insights?.platform ?? []
    const extra = (aiEnrichment?.infra_hints ?? []).map(normalizeInfraHint)
    return Array.from(new Set([...base, ...extra]))
  }, [insights, aiEnrichment])
  const displayCompliance = useMemo(() => {
    const base = insights?.compliance ?? []
    const extra = (aiEnrichment?.additional_compliance_flags ?? []).map(normalizeComplianceFlag)
    return Array.from(new Set([...base, ...extra]))
  }, [insights, aiEnrichment])

  const detectedProvider = insights && insights.platform.length > 0
    ? platformToProvider(insights.platform[0])
    : null
  // KI-Use-Case-Typ hat Vorrang: verbessert die Grundlage, gegen die die
  // Matching Components im Katalog gefiltert werden.
  const detectedUsecase = aiUseCaseToApiType(aiEnrichment?.use_case_type)
    ?? (insights ? usecaseToApiType(insights.usecaseType) : null)

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

  const handleAIEnrich = async () => {
    if (!active) return
    setAiError(null)
    const res = await fetch(`/api/canvas/${active.id}/ai-enrich`, { method: 'POST' })
    const json = await res.json() as {
      result?: Record<string, unknown>
      usage?: { remaining: number; used: number; limit: number; exceeded: boolean }
      error?: string
      code?: string
    }
    if (json.usage) setAiUsage(json.usage)
    if (!res.ok) {
      setAiError(json.error ?? 'KI-Analyse fehlgeschlagen')
      return
    }
    if (json.result) {
      setActive(prev => prev ? { ...prev, ai_enrichment: json.result, ai_generated_at: new Date().toISOString() } : prev)
    }
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
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <input
              value={active.title}
              onChange={e => setActive(prev => prev ? { ...prev, title: e.target.value } : prev)}
              placeholder={t('canvas.titlePlaceholder')}
              className="flex-1 min-w-0 text-xl font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-slate-300 focus:border-primary-ring focus:bg-white focus:outline-none transition-colors"
              aria-label={t('canvas.titleAriaLabel')}
            />
            {active.ai_generated_at && <AIBadge generatedAt={active.ai_generated_at} />}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary disabled:opacity-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            {saved ? '✓ Gespeichert' : saving ? 'Speichern…' : 'Speichern'}
          </button>
          <a
            href={tier !== 'free' ? `/api/export/pdf?module=canvas&locale=${locale}` : '/upgrade'}
            {...(tier !== 'free' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 inline-flex items-center gap-1.5"
          >
            PDF{tier === 'free' && <span className="text-xs opacity-60">· Pro</span>}
          </a>
          <VersionsPanel module="canvas" entityId={active.id} tier={tier} currentData={active.data as unknown as Record<string, unknown>} />
          <ShareButton module="canvas" entityId={active.id} tier={tier} />
        </div>

        <div className="flex gap-2 mb-5" role="group" aria-label={t('canvas.archetypeAriaLabel')}>
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
                {pick(field.label, locale)}
              </label>
              <p className="text-xs text-slate-400 mb-2">{pick(field.description, locale)}</p>
              <textarea
                id={`canvas-input-${field.id}`}
                value={active.data[field.id]}
                onChange={e => setActive(prev => {
                  if (!prev) return prev
                  return { ...prev, data: { ...prev.data, [field.id]: e.target.value } }
                })}
                placeholder={pick(field.placeholder, locale)}
                rows={4}
                className="w-full text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none"
              />
            </section>
          ))}
        </div>

        {/* Kontextanalyse-Panel — deterministische Erkennung + KI-Enrichment gemergt */}
        {insights && insights.filledCount >= 2 && (
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('canvas.contextAnalysisTitle')}</h2>
              <InfoHint title={t('canvas.contextAnalysisHintTitle')} side="top">
                <p>{t('canvas.contextAnalysisHintP1')}</p>
                <p className="mt-1.5">{t('canvas.contextAnalysisHintP2')}</p>
                <p className="mt-1.5">{t('canvas.contextAnalysisHintP3', { count: insights.filledCount })}</p>
              </InfoHint>
            </div>

            {insights.filledCount < 4 && (
              <HintBox variant="tip" className="text-xs">
                {t('canvas.contextFillHint', { count: insights.filledCount })}
              </HintBox>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t('canvas.ctxPlatform')}</p>
                {displayPlatform.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {displayPlatform.map(p => (
                      <span key={p} className="text-xs bg-primary-soft text-primary-hover rounded-full px-2 py-0.5 font-medium">{p}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{t('canvas.ctxNotDetected')}</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t('canvas.ctxAiType')}</p>
                {displayUsecaseType ? (
                  <div className="space-y-1">
                    <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5 font-medium inline-flex items-center gap-1">
                      {displayUsecaseType}
                      {usecaseFromAi && <span className="text-[9px] font-semibold text-violet-500">{tAi('badge')}</span>}
                    </span>
                    {aiEnrichment?.industry && (
                      <p className="text-[11px] text-slate-400">{t('canvas.ctxIndustry')}: {aiEnrichment.industry}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{t('canvas.ctxNotDetected')}</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t('canvas.ctxCompliance')}</p>
                {displayCompliance.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {displayCompliance.map(c => (
                      <span key={c} className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">{c}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{t('canvas.ctxNoFlags')}</p>
                )}
              </div>
            </div>

            {detectedProvider && catalogSuggestions && catalogSuggestions.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{t('canvas.ctxComponents')}</p>
                <div className="flex flex-wrap gap-1">
                  {catalogSuggestions.map(c => (
                    <span key={c.name} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">{c.name}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <AIAnalysisButton
                  tier={tier}
                  onAnalyze={handleAIEnrich}
                  usage={aiUsage}
                />
                {aiError && (
                  <p className="text-xs text-red-500">{aiError}</p>
                )}
              </div>
              {(aiEnrichment?.suggested_quadrant || aiEnrichment?.suggested_complexity) && (
                <p className="text-xs text-slate-500">
                  {aiEnrichment.suggested_quadrant && (
                    <>{t('canvas.ctxQuadrant')}: <span className="font-medium text-slate-600">{aiEnrichment.suggested_quadrant}</span></>
                  )}
                  {aiEnrichment.suggested_quadrant && aiEnrichment.suggested_complexity && ' · '}
                  {aiEnrichment.suggested_complexity && (
                    <>{t('canvas.ctxComplexity')}: <span className="font-medium text-slate-600">{aiEnrichment.suggested_complexity}</span></>
                  )}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1 border-t border-slate-200">
              <p className="text-xs text-slate-500 flex-1">{t('canvas.ctxUseSignals')}</p>
              <Link href="/architecture" className="text-xs text-primary hover:underline whitespace-nowrap font-medium">
                {t('canvas.ctxLinkArch')}
              </Link>
              <Link href="/compliance" className="text-xs text-primary hover:underline whitespace-nowrap font-medium">
                {t('canvas.ctxLinkCompliance')}
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
          {canvases.length === 0 ? t('canvas.noCanvasYet') : t('canvas.canvasCount', { count: canvases.length })}
        </p>
        <button
          onClick={handleCreate}
          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          {t('canvas.newCanvas')}
        </button>
      </div>

      {canvases.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <div className="text-3xl mb-3 text-slate-300" aria-hidden="true">□</div>
          <p className="text-slate-500 text-sm mb-4">
            {t('canvas.canvasTemplateDesc')}
          </p>
          <button
            onClick={handleCreate}
            className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            {t('canvas.createCanvas')}
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
                  {canvas.ai_generated_at && <AIBadge className="flex-shrink-0" />}
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
