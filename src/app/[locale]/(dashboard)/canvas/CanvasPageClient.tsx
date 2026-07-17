'use client'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CANVAS_FIELDS } from '@/config/canvas-data'
import { analyzeCanvas } from '@/lib/canvas/detection'
import { detectAiActDomain, classifyAiAct, generateDocumentationText } from '@/lib/eu-ai-act/classifier'
import type { AiActAnswers, AiActAssessment } from '@/lib/eu-ai-act/classifier'
import { InfoHint, HintBox } from '@/components/shared/InfoHint'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { ShareButton } from '@/components/shared/ShareButton'
import { AIAnalysisButton, AIBadge } from '@/components/shared/AIAnalysisButton'
import { saveDraft, loadDraft, clearDraft, formatDraftAge } from '@/lib/ai/draft-store'
import { AiDraftBanner } from '@/components/shared/AiDraftBanner'
import { usePass1Classify } from '@/hooks/usePass1Classify'
import type { Canvas, Archetype, Tier } from '@/types'

type AiActPartialAnswers = {
  affectsPersons: boolean | null
  involvesProfiling: boolean | null
  isNarrowProcedural: boolean | null
  humanReviewsBefore: boolean | null
}
const EMPTY_ACT_ANSWERS: AiActPartialAnswers = { affectsPersons: null, involvesProfiling: null, isNarrowProcedural: null, humanReviewsBefore: null }

type CanvasAIEnrichment = {
  use_case_type?: string
  industry?: string
  suggested_quadrant?: string
  suggested_complexity?: string
  infra_hints?: string[]
  additional_compliance_flags?: string[]
  confidence?: number
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
  const [canvasDraftBanner, setCanvasDraftBanner] = useState<{ age: string; result: Record<string, unknown> } | null>(null)
  const [extraAliases, setExtraAliases] = useState<Record<string, string[]>>({})

  // Einmalig: client-eigene + globale aktive Synonyme für Detection-Merge laden
  useEffect(() => {
    void fetch('/api/canvas/active-synonyms')
      .then(r => r.ok ? r.json() : null)
      .then((data: { aliases: Record<string, string[]> } | null) => {
        if (data?.aliases) setExtraAliases(data.aliases)
      })
  }, [])

  const insights = useMemo(
    () => active ? analyzeCanvas(active, Object.keys(extraAliases).length ? extraAliases : undefined) : null,
    [active, extraAliases],
  )
  const [catalogSuggestions, setCatalogSuggestions] = useState<Array<{ name: string; architecture_layer: string | null }> | null>(null)
  const [aiUsage, setAiUsage] = useState<{ remaining: number; used: number; limit: number; exceeded: boolean } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiActOpen, setAiActOpen] = useState(false)
  const [aiActAnswers, setAiActAnswers] = useState<AiActPartialAnswers>(EMPTY_ACT_ANSWERS)
  const [aiActCopied, setAiActCopied] = useState(false)
  const activeIdRef = useRef<string | null>(null)

  // Reset EU AI Act answers when switching to a different canvas; restore from saved if available
  useEffect(() => {
    if (!active || activeIdRef.current === active.id) return
    activeIdRef.current = active.id
    const saved = active.ai_act_assessment as AiActAssessment | null
    if (saved?.answers) {
      setAiActAnswers(saved.answers)
      setAiActOpen(true)
    } else {
      setAiActAnswers(EMPTY_ACT_ANSWERS)
      setAiActOpen(false)
    }
  }, [active])

  // Draft-Prüfung: falls Canvas kein ai_enrichment hat, aber Draft vorhanden ist
  useEffect(() => {
    if (!active) { setCanvasDraftBanner(null); return }
    if (active.ai_enrichment) {
      clearDraft('canvas', active.id)
      setCanvasDraftBanner(null)
      return
    }
    const draft = loadDraft('canvas', active.id)
    if (draft) {
      setCanvasDraftBanner({ age: formatDraftAge(draft.savedAt), result: draft.result as Record<string, unknown> })
    } else {
      setCanvasDraftBanner(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id, active?.ai_enrichment])

  const aiActResult = useMemo<AiActAssessment | null>(() => {
    const { affectsPersons, involvesProfiling, isNarrowProcedural, humanReviewsBefore } = aiActAnswers
    if (affectsPersons === null || involvesProfiling === null || isNarrowProcedural === null || humanReviewsBefore === null) return null
    if (!active) return null
    const canvasText = `${active.title} ${Object.values(active.data).join(' ')}`
    const domain = detectAiActDomain(canvasText)
    const answers: AiActAnswers = { affectsPersons, involvesProfiling, isNarrowProcedural, humanReviewsBefore }
    const classification = classifyAiAct(domain, answers)
    const documentationText = generateDocumentationText(domain, classification, answers, active.title)
    return { domain, answers, classification, documentationText, assessedAt: new Date().toISOString() }
  }, [aiActAnswers, active])

  const getCanvas = useCallback(() => active, [active])
  const { handleBlur } = usePass1Classify(active?.id ?? null, getCanvas)

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
      body: JSON.stringify({ title: active.title, archetype: active.archetype, data: active.data, ...(aiActResult ? { ai_act_assessment: aiActResult } : {}) }),
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
      saveDraft('canvas', active.id, json.result)
      setActive(prev => prev ? { ...prev, ai_enrichment: json.result, ai_generated_at: new Date().toISOString() } : prev)
      setCanvasDraftBanner(null)
    }
  }

  if (active) {
    return (
      <div className="max-w-5xl">
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

        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start">
        <div className="min-w-0">
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
                onBlur={e => handleBlur(field.id, e.target.value)}
                placeholder={pick(field.placeholder, locale)}
                rows={4}
                className="w-full text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none"
              />
            </section>
          ))}
        </div>
        </div>{/* end left column */}

        {/* Kontextanalyse-Panel — sticky rechts (#195) */}
        <div className="mt-6 lg:mt-0 lg:sticky lg:top-[74px]">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{t('canvas.contextAnalysisTitle')}</h2>
              <InfoHint title={t('canvas.contextAnalysisHintTitle')} side="top" align="right">
                <p>{t('canvas.contextAnalysisHintP1')}</p>
                <p className="mt-1.5">{t('canvas.contextAnalysisHintP2')}</p>
                <p className="mt-1.5">{t('canvas.contextAnalysisHintP3', { count: insights?.filledCount ?? 0 })}</p>
              </InfoHint>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{t('canvas.contextFillHint', { count: insights?.filledCount ?? 0 })}</span>
                <span className="text-xs font-semibold text-slate-700">{insights?.filledCount ?? 0}/8 {t('canvas.ctxFields')}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${((insights?.filledCount ?? 0) / 8) * 100}%` }} />
              </div>
            </div>

            {(insights?.filledCount ?? 0) === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic">{t('canvas.ctxEmptyState')}</p>
            ) : (<>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
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

            {/* EU AI Act Art. 6 Inline-Bewertung — erscheint wenn HR/Beschäftigungs-Kontext erkannt */}
            {displayCompliance.some(c => /eu ai act/i.test(c)) && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setAiActOpen(o => !o)}
                  className="flex items-center justify-between w-full text-left"
                  aria-expanded={aiActOpen}
                >
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('canvas.euAiActTitle')}</p>
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-medium">{t('canvas.euAiActHrDetected')}</span>
                </button>
                {aiActOpen && (
                  <div className="mt-2 space-y-2">
                    {([
                      { key: 'affectsPersons',    label: t('canvas.euAiActQ1') },
                      { key: 'involvesProfiling',  label: t('canvas.euAiActQ2') },
                      { key: 'isNarrowProcedural', label: t('canvas.euAiActQ3') },
                      { key: 'humanReviewsBefore', label: t('canvas.euAiActQ4') },
                    ] as const).map(({ key, label }) => (
                      <div key={key} className="space-y-1">
                        <p className="text-[11px] text-slate-600 leading-tight">{label}</p>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setAiActAnswers(a => ({ ...a, [key]: true }))}
                            className={cn('flex-1 text-[11px] py-0.5 rounded border transition-colors', aiActAnswers[key] === true ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300')}
                          >{t('canvas.euAiActYes')}</button>
                          <button
                            onClick={() => setAiActAnswers(a => ({ ...a, [key]: false }))}
                            className={cn('flex-1 text-[11px] py-0.5 rounded border transition-colors', aiActAnswers[key] === false ? 'bg-slate-600 text-white border-slate-600' : 'border-slate-200 text-slate-600 hover:border-slate-300')}
                          >{t('canvas.euAiActNo')}</button>
                        </div>
                      </div>
                    ))}
                    {aiActResult && (
                      <div className="pt-1.5 space-y-1.5">
                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block',
                          aiActResult.classification.result === 'hochrisiko' ? 'bg-red-100 text-red-700' :
                          aiActResult.classification.result === 'anhang_iii_ausgenommen' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {aiActResult.classification.result === 'hochrisiko' ? t('canvas.euAiActResultHoch') :
                           aiActResult.classification.result === 'anhang_iii_ausgenommen' ? t('canvas.euAiActResultAusgenommen') :
                           t('canvas.euAiActResultNicht')}
                        </span>
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(locale === 'de' ? aiActResult.documentationText.de : aiActResult.documentationText.en)
                            setAiActCopied(true)
                            setTimeout(() => setAiActCopied(false), 2000)
                          }}
                          className="block text-[11px] text-primary hover:underline"
                        >
                          {aiActCopied ? t('canvas.euAiActCopied') : t('canvas.euAiActCopyDoc')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
              {canvasDraftBanner && (
                <AiDraftBanner
                  age={canvasDraftBanner.age}
                  onKeep={() => {
                    setActive(prev => prev ? { ...prev, ai_enrichment: canvasDraftBanner.result } : prev)
                    setCanvasDraftBanner(null)
                  }}
                  onDiscard={() => {
                    if (active) clearDraft('canvas', active.id)
                    setCanvasDraftBanner(null)
                  }}
                />
              )}
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
            </>)}
          </div>
        </div>{/* end right column */}
        </div>{/* end two-column grid */}
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
