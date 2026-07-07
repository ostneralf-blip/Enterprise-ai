'use client'
import { Fragment, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { InfoHint } from '@/components/shared/InfoHint'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { EmptyState } from '@/components/shared/EmptyState'

type Tab = 'assessment' | 'architecture' | 'governance' | 'roadmap' | 'canvas' | 'compliance' | 'usecase'

interface Prefs {
  primary_assessment_id:   string | null
  primary_governance_id:   string | null
  primary_roadmap_id:      string | null
  primary_architecture_id: string | null
  primary_canvas_id:       string | null
  primary_compliance_id:   string | null
  primary_usecase_id:      string | null
}

export interface AssessmentRow    { id: string; archetype: string; total_score: number; dim_scores: Record<string, number>; created_at: string }
export interface ArchitectureRow  { id: string; title: string; wizard_data: Record<string, unknown>; result: Record<string, unknown>; updated_at: string }
export interface GovernanceRow    { id: string; use_case_name: string | null; result: string; protocol: Array<{ question?: string; answer?: string; label?: string; value?: string }> | null; created_at: string }
export interface RoadmapRow       { id: string; title: string; archetype: string; phases: unknown[]; updated_at: string }
export interface CanvasRow        { id: string; title: string; archetype: string | null; data: Record<string, string>; updated_at: string }
export interface ComplianceRow    { id: string; regulation: string; check_type: string; status: string; notes: string | null; updated_at: string }
export interface UseCaseRow       { id: string; name: string; domain: string | null; weighted_score: number | null; quadrant: string | null; governance_result: string | null }

const ARCHETYPES: Record<string, string> = {
  starter: 'AI Starter', scaler: 'AI Scaler', transformer: 'AI Transformer',
}
const VERDICTS: Record<string, { label: string; color: string }> = {
  approve:    { label: 'Freigegeben',  color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  stop_dsgvo: { label: 'DSGVO-Stop',   color: 'text-red-700 bg-red-50 border-red-200' },
  stop_risk:  { label: 'Risiko-Stop',  color: 'text-red-700 bg-red-50 border-red-200' },
  improve:    { label: 'Verbesserung', color: 'text-amber-700 bg-amber-50 border-amber-200' },
}
const DIM_LABELS: Record<string, string> = {
  data: 'Daten', skills: 'Skills', governance: 'Governance',
  tech: 'Technologie', strategy: 'Strategie', culture: 'Kultur',
}
const PREF_KEY: Partial<Record<Tab, keyof Prefs>> = {
  assessment:   'primary_assessment_id',
  architecture: 'primary_architecture_id',
  governance:   'primary_governance_id',
  roadmap:      'primary_roadmap_id',
  canvas:       'primary_canvas_id',
  compliance:   'primary_compliance_id',
  usecase:      'primary_usecase_id',
}
const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

const EMPTY_PREFS: Prefs = {
  primary_assessment_id: null, primary_governance_id: null,
  primary_roadmap_id: null, primary_architecture_id: null,
  primary_canvas_id: null, primary_compliance_id: null, primary_usecase_id: null,
}

interface RowActionsProps {
  isPrimary:       boolean
  isConfirmDelete: boolean
  onSetPrimary:    (e: React.MouseEvent) => void
  onConfirm:       (e: React.MouseEvent) => void
  onCancel:        (e: React.MouseEvent) => void
  onDelete:        (e: React.MouseEvent) => void
}

function RowActions({ isPrimary, isConfirmDelete, onSetPrimary, onConfirm, onCancel, onDelete }: RowActionsProps) {
  return (
    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
      {isPrimary
        ? (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 whitespace-nowrap">
            ★ Primär
            <InfoHint title="Was bedeutet Primär?" side="bottom">
              <p>Das als Primär markierte Ergebnis wird in anderen Modulen als Standard-Kontext verwendet.</p>
              <p className="mt-1.5">Zum Beispiel zieht der Architektur-Generator das primäre Assessment-Ergebnis automatisch als Kontext ein — so müssen Sie Ihren Reifegrad nicht erneut eingeben.</p>
            </InfoHint>
          </span>
        )
        : (
          <span className="flex items-center gap-1">
            <button onClick={onSetPrimary} className="text-xs text-slate-500 hover:text-primary border border-slate-200 hover:border-blue-300 rounded-md px-2 py-0.5 transition-colors whitespace-nowrap">Als Primär</button>
            <InfoHint title="Was bedeutet Primär?" side="bottom">
              <p>Das als Primär markierte Ergebnis wird als Standard-Kontext in anderen Modulen verwendet.</p>
              <p className="mt-1.5">Nur ein Ergebnis pro Modul-Typ kann gleichzeitig Primär sein.</p>
            </InfoHint>
          </span>
        )
      }
      {isConfirmDelete
        ? <div className="flex gap-1">
            <button onClick={onDelete}  className="text-xs text-red-600 border border-red-300 rounded-md px-2 py-0.5 hover:bg-red-50 whitespace-nowrap">Ja, löschen</button>
            <button onClick={onCancel}  className="text-xs text-slate-500 border border-slate-200 rounded-md px-2 py-0.5 hover:bg-slate-50 whitespace-nowrap">Abbrechen</button>
          </div>
        : <button onClick={onConfirm} className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-300 rounded-md px-2 py-0.5 transition-colors">Löschen</button>
      }
    </div>
  )
}

interface Props {
  assessments:        AssessmentRow[]
  architectures:      ArchitectureRow[]
  governanceSessions: GovernanceRow[]
  roadmaps:           RoadmapRow[]
  canvases:           CanvasRow[]
  complianceChecks:   ComplianceRow[]
  useCases:           UseCaseRow[]
  initialPreferences: Prefs | null
  tier:               string
}

export function ErgebnissePageClient({ assessments: initA, architectures: initArch, governanceSessions: initG, roadmaps: initR, canvases: initC, complianceChecks: initCC, useCases: initUC, initialPreferences, tier }: Props) {
  const [tab,           setTab]           = useState<Tab>('assessment')
  const [prefs,         setPrefs]         = useState<Prefs>(initialPreferences ?? EMPTY_PREFS)
  const [expanded,      setExpanded]      = useState<string | null>(null)
  const [confirmId,     setConfirmId]     = useState<string | null>(null)
  const [assessments,   setAssessments]   = useState(initA)
  const [architectures, setArchitectures] = useState(initArch)
  const [governance,    setGovernance]    = useState(initG)
  const [roadmaps,      setRoadmaps]      = useState(initR)
  const [canvases,      setCanvases]      = useState(initC)
  const [complianceChecks, setComplianceChecks] = useState(initCC)
  const [useCases,         setUseCases]         = useState(initUC)
  const [compareMode,   setCompareMode]   = useState(false)
  const [compareIds,    setCompareIds]    = useState<string[]>([])

  const setPrimary = async (category: Tab, id: string) => {
    const key = PREF_KEY[category]
    if (!key) return
    const res = await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: id }),
    })
    if (res.ok) setPrefs(p => ({ ...p, [key]: id }))
  }

  const deleteItem = async (category: Tab, id: string) => {
    const paths: Partial<Record<Tab, string>> = { assessment: `/api/assessment/${id}`, architecture: `/api/architecture/${id}`, governance: `/api/governance/${id}`, roadmap: `/api/roadmap/${id}`, canvas: `/api/canvas/${id}`, compliance: `/api/compliance/${id}`, usecase: `/api/usecase/${id}` }
    const path = paths[category]
    if (!path) return
    const res = await fetch(path, { method: 'DELETE' })
    if (!res.ok) return
    if (category === 'assessment')   setAssessments(xs => xs.filter(x => x.id !== id))
    if (category === 'architecture') setArchitectures(xs => xs.filter(x => x.id !== id))
    if (category === 'governance')   setGovernance(xs => xs.filter(x => x.id !== id))
    if (category === 'roadmap')      setRoadmaps(xs => xs.filter(x => x.id !== id))
    if (category === 'canvas')       setCanvases(xs => xs.filter(x => x.id !== id))
    if (category === 'compliance')   setComplianceChecks(xs => xs.filter(x => x.id !== id))
    if (category === 'usecase')      setUseCases(xs => xs.filter(x => x.id !== id))
    if (expanded === id) setExpanded(null)
    setConfirmId(null)
    const prefKey = PREF_KEY[category]
    if (prefKey && prefs[prefKey] === id) setPrefs(p => ({ ...p, [prefKey]: null }))
  }

  const toggle = (id: string) => setExpanded(e => e === id ? null : id)

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    )
  }

  const exitCompare = () => { setCompareMode(false); setCompareIds([]) }

  const TABS = [
    { key: 'assessment'   as Tab, label: 'Assessment',  count: assessments.length,     comparable: true },
    { key: 'architecture' as Tab, label: 'Architektur', count: architectures.length,   comparable: true },
    { key: 'governance'   as Tab, label: 'Governance',  count: governance.length,       comparable: true },
    { key: 'roadmap'      as Tab, label: 'Roadmap',     count: roadmaps.length,         comparable: true },
    { key: 'canvas'       as Tab, label: 'Canvas',      count: canvases.length,         comparable: true },
    { key: 'compliance'   as Tab, label: 'Compliance',  count: complianceChecks.length, comparable: false },
    { key: 'usecase'      as Tab, label: 'Use Cases',   count: useCases.length,         comparable: false },
  ]

  return (
    <div>
      <div className="flex items-center gap-1 mb-3 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setExpanded(null); setConfirmId(null); exitCompare() }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t.key ? 'border-blue-600 text-primary-hover' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Vergleich-Button — unterhalb der Tabs, immer sichtbar wenn ≥ 2 Einträge */}
      {(TABS.find(t => t.key === tab)?.comparable ?? false) && TABS.find(t => t.key === tab)!.count >= 2 && (
        <div className="flex justify-end mb-3">
          {compareMode ? (
            <button onClick={exitCompare}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
              Vergleich beenden
            </button>
          ) : (
            <button onClick={() => { setCompareMode(true); setCompareIds([]) }}
              className="px-3 py-1.5 text-xs font-medium text-primary border border-primary-border bg-primary-soft rounded-lg hover:bg-primary-soft transition-colors whitespace-nowrap">
              ⇄ Vergleichen
            </button>
          )}
        </div>
      )}

      {/* Vergleich-Auswahlhinweis */}
      {compareMode && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-3">
          <p className="text-xs text-amber-800 flex-1">
            {compareIds.length === 0 && 'Wählen Sie zwei Einträge zum Vergleich aus.'}
            {compareIds.length === 1 && 'Noch einen Eintrag auswählen…'}
            {compareIds.length === 2 && 'Beide Einträge ausgewählt — Vergleich wird unten angezeigt.'}
          </p>
          {compareIds.length > 0 && (
            <button onClick={() => setCompareIds([])} className="text-xs text-amber-700 hover:text-amber-900 font-medium whitespace-nowrap">
              Auswahl zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* ── Assessment ─────────────────────────────────────────── */}
      {tab === 'assessment' && (
        <div className="space-y-2">
          {assessments.length === 0 && <EmptyState variant="folder" title="Noch kein Assessment" description="Starten Sie mit dem AI-Readiness Assessment, um Ihren Reifegrad zu ermitteln." cta={{ href: '/assessment', label: 'Jetzt starten' }} />}
          {assessments.map(a => {
            const isSelected = compareIds.includes(a.id)
            return (
              <div key={a.id} className={cn('bg-white border rounded-xl overflow-hidden', isSelected ? 'border-primary-ring ring-1 ring-primary-ring' : 'border-slate-200')}>
                <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => compareMode ? toggleCompare(a.id) : toggle(a.id)}>
                  {compareMode && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleCompare(a.id)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Assessment vom ${fmt(a.created_at)} zum Vergleich auswählen`}
                      className="shrink-0 w-4 h-4 rounded border-slate-300 text-primary cursor-pointer" />
                  )}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-700 shrink-0">{ARCHETYPES[a.archetype] ?? a.archetype}</span>
                    <span className="text-xs font-bold text-slate-900 shrink-0">{Number(a.total_score).toFixed(1)}/5.0</span>
                    <span className="text-xs text-slate-400 shrink-0">{fmt(a.created_at)}</span>
                  </div>
                  {!compareMode && (
                    <RowActions isPrimary={prefs.primary_assessment_id === a.id} isConfirmDelete={confirmId === a.id}
                      onSetPrimary={e => { e.stopPropagation(); setPrimary('assessment', a.id) }}
                      onConfirm={e => { e.stopPropagation(); setConfirmId(a.id) }}
                      onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                      onDelete={e => { e.stopPropagation(); deleteItem('assessment', a.id) }} />
                  )}
                </div>
                {!compareMode && expanded === a.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mb-3">
                      {Object.entries(a.dim_scores ?? {}).map(([dim, score]) => (
                        <div key={dim} className="text-xs flex justify-between">
                          <span className="text-slate-500">{DIM_LABELS[dim] ?? dim}</span>
                          <span className="font-semibold text-slate-800">{Number(score).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/assessment" className="text-xs text-primary hover:underline">Vollständiges Ergebnis ansehen →</Link>
                  </div>
                )}
              </div>
            )
          })}

          {/* Vergleichs-Panel */}
          {compareMode && compareIds.length === 2 && (() => {
            const a1 = assessments.find(a => a.id === compareIds[0])
            const a2 = assessments.find(a => a.id === compareIds[1])
            if (!a1 || !a2) return null
            const dims = Object.keys(a1.dim_scores ?? {})
            return (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">Vergleich: zwei Assessments</p>
                </div>
                <div className="grid grid-cols-3 text-xs">
                  <div className="px-4 py-2 font-medium text-slate-500 border-b border-slate-100">Dimension</div>
                  <div className="px-4 py-2 font-medium text-primary-hover border-b border-slate-100 border-l">
                    {ARCHETYPES[a1.archetype] ?? a1.archetype} — {Number(a1.total_score).toFixed(1)}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(a1.created_at)}</div>
                  </div>
                  <div className="px-4 py-2 font-medium text-emerald-700 border-b border-slate-100 border-l">
                    {ARCHETYPES[a2.archetype] ?? a2.archetype} — {Number(a2.total_score).toFixed(1)}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(a2.created_at)}</div>
                  </div>
                  {dims.map(dim => {
                    const s1 = Number(a1.dim_scores?.[dim] ?? 0)
                    const s2 = Number(a2.dim_scores?.[dim] ?? 0)
                    const diff = s2 - s1
                    return (
                      <>
                        <div key={`${dim}-label`} className="px-4 py-2 text-slate-500 border-t border-slate-100">{DIM_LABELS[dim] ?? dim}</div>
                        <div key={`${dim}-s1`} className="px-4 py-2 font-semibold text-slate-800 border-t border-slate-100 border-l">{s1.toFixed(1)}</div>
                        <div key={`${dim}-s2`} className={cn('px-4 py-2 font-semibold border-t border-slate-100 border-l flex items-center gap-1',
                          diff > 0 ? 'text-emerald-700' : diff < 0 ? 'text-red-600' : 'text-slate-800')}>
                          {s2.toFixed(1)}
                          {diff !== 0 && <span className="text-[10px]">{diff > 0 ? '▲' : '▼'}{Math.abs(diff).toFixed(1)}</span>}
                        </div>
                      </>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Architektur ────────────────────────────────────────── */}
      {tab === 'architecture' && (
        <div className="space-y-2">
          {architectures.length === 0 && <EmptyState variant="folder" title="Noch keine Architektur" description="Erstellen Sie Ihre erste Enterprise AI Architektur im Architektur-Generator." cta={{ href: '/architecture', label: 'Jetzt erstellen' }} />}
          {architectures.map(a => {
            const isSelected = compareIds.includes(a.id)
            return (
              <div key={a.id} className={cn('bg-white border rounded-xl overflow-hidden', isSelected ? 'border-primary-ring ring-1 ring-primary-ring' : 'border-slate-200')}>
                <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => compareMode ? toggleCompare(a.id) : toggle(a.id)}>
                  {compareMode && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleCompare(a.id)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Architektur „${a.title}" zum Vergleich auswählen`}
                      className="shrink-0 w-4 h-4 rounded border-slate-300 text-primary cursor-pointer" />
                  )}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-700 truncate">{a.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{fmt(a.updated_at)}</span>
                  </div>
                  {!compareMode && (
                    <RowActions isPrimary={prefs.primary_architecture_id === a.id} isConfirmDelete={confirmId === a.id}
                      onSetPrimary={e => { e.stopPropagation(); setPrimary('architecture', a.id) }}
                      onConfirm={e => { e.stopPropagation(); setConfirmId(a.id) }}
                      onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                      onDelete={e => { e.stopPropagation(); deleteItem('architecture', a.id) }} />
                  )}
                </div>
                {!compareMode && expanded === a.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">{Object.keys(a.wizard_data ?? {}).length} Konfigurationsfelder gespeichert</p>
                      <Link href="/architecture" className="text-xs text-primary hover:underline mt-1 inline-block">Im Generator öffnen →</Link>
                    </div>
                    <VersionsPanel
                      module="architecture"
                      entityId={a.id}
                      tier={tier}
                      currentData={a.result as Record<string, unknown>}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {compareMode && compareIds.length === 2 && (() => {
            const a1 = architectures.find(a => a.id === compareIds[0])
            const a2 = architectures.find(a => a.id === compareIds[1])
            if (!a1 || !a2) return null
            type ArchResult = { pattern?: string; description?: string; layers?: Array<{ name: string; components?: string[] }> }
            const res1 = (a1.result ?? {}) as ArchResult
            const res2 = (a2.result ?? {}) as ArchResult
            const allLayerNames = Array.from(new Set([
              ...(res1.layers ?? []).map(l => l.name),
              ...(res2.layers ?? []).map(l => l.name),
            ]))
            return (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">Vergleich: zwei Architekturen</p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="inline-block w-2.5 h-2.5 rounded border bg-primary-soft border-primary-border" />nur in A1</span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="inline-block w-2.5 h-2.5 rounded border bg-emerald-50 border-emerald-200" />nur in A2</span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="inline-block w-2.5 h-2.5 rounded border bg-slate-50 border-slate-200" />in beiden</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 text-xs">
                  <div className="px-4 py-2 font-medium text-slate-500 border-b border-slate-100">Eigenschaft</div>
                  <div className="px-4 py-2 font-medium text-primary-hover border-b border-slate-100 border-l">
                    {a1.title}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(a1.updated_at)}</div>
                  </div>
                  <div className="px-4 py-2 font-medium text-emerald-700 border-b border-slate-100 border-l">
                    {a2.title}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(a2.updated_at)}</div>
                  </div>
                  <div className="px-4 py-2 text-slate-500 border-t border-slate-100">Muster</div>
                  <div className="px-4 py-2 font-semibold text-slate-800 border-t border-slate-100 border-l">{res1.pattern ?? '—'}</div>
                  <div className="px-4 py-2 font-semibold text-slate-800 border-t border-slate-100 border-l">{res2.pattern ?? '—'}</div>
                  {res1.description || res2.description ? (
                    <Fragment key="arch-desc">
                      <div className="px-4 py-2 text-slate-500 border-t border-slate-100">Beschreibung</div>
                      <div className="px-4 py-2 text-slate-700 border-t border-slate-100 border-l leading-relaxed">{res1.description ?? '—'}</div>
                      <div className="px-4 py-2 text-slate-700 border-t border-slate-100 border-l leading-relaxed">{res2.description ?? '—'}</div>
                    </Fragment>
                  ) : null}
                  {allLayerNames.map(layerName => {
                    const l1 = (res1.layers ?? []).find(l => l.name === layerName)
                    const l2 = (res2.layers ?? []).find(l => l.name === layerName)
                    return (
                      <Fragment key={`layer-${layerName}`}>
                        <div className="px-4 py-2 text-slate-500 border-t border-slate-100 truncate">{layerName}</div>
                        <div className="px-4 py-2 border-t border-slate-100 border-l">
                          {l1 ? (
                            <div className="flex flex-wrap gap-1">
                              {(l1.components ?? []).map((c, ci) => (
                                <span key={ci} className={cn('text-[10px] px-1.5 py-0.5 rounded border',
                                  (l2?.components ?? []).includes(c)
                                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                                    : 'bg-primary-soft text-primary-hover border-primary-border'
                                )}>{c}</span>
                              ))}
                              {(l1.components ?? []).length === 0 && <span className="text-slate-300 text-sm">—</span>}
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </div>
                        <div className="px-4 py-2 border-t border-slate-100 border-l">
                          {l2 ? (
                            <div className="flex flex-wrap gap-1">
                              {(l2.components ?? []).map((c, ci) => (
                                <span key={ci} className={cn('text-[10px] px-1.5 py-0.5 rounded border',
                                  (l1?.components ?? []).includes(c)
                                    ? 'bg-slate-50 text-slate-600 border-slate-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                )}>{c}</span>
                              ))}
                              {(l2.components ?? []).length === 0 && <span className="text-slate-300 text-sm">—</span>}
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </div>
                      </Fragment>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Governance ─────────────────────────────────────────── */}
      {tab === 'governance' && (
        <div className="space-y-2">
          {governance.length === 0 && <EmptyState variant="folder" title="Noch kein Governance-Check" description="Prüfen Sie Ihre AI-Use-Cases gegen die 6 Governance-Gates." cta={{ href: '/governance', label: 'Jetzt prüfen' }} />}
          {governance.map(g => {
            const v = VERDICTS[g.result] ?? { label: g.result, color: 'text-slate-700 bg-slate-50 border-slate-200' }
            const isSelected = compareIds.includes(g.id)
            return (
              <div key={g.id} className={cn('bg-white border rounded-xl overflow-hidden', isSelected ? 'border-primary-ring ring-1 ring-primary-ring' : 'border-slate-200')}>
                <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => compareMode ? toggleCompare(g.id) : toggle(g.id)}>
                  {compareMode && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleCompare(g.id)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Governance-Check „${g.use_case_name ?? fmt(g.created_at)}" zum Vergleich auswählen`}
                      className="shrink-0 w-4 h-4 rounded border-slate-300 text-primary cursor-pointer" />
                  )}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${v.color}`}>{v.label}</span>
                    <span className="text-xs text-slate-600 truncate">{g.use_case_name ?? '—'}</span>
                    <span className="text-xs text-slate-400 shrink-0">{fmt(g.created_at)}</span>
                  </div>
                  {!compareMode && (
                    <RowActions isPrimary={prefs.primary_governance_id === g.id} isConfirmDelete={confirmId === g.id}
                      onSetPrimary={e => { e.stopPropagation(); setPrimary('governance', g.id) }}
                      onConfirm={e => { e.stopPropagation(); setConfirmId(g.id) }}
                      onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                      onDelete={e => { e.stopPropagation(); deleteItem('governance', g.id) }} />
                  )}
                </div>
                {!compareMode && expanded === g.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-600">Use Case: <strong>{g.use_case_name ?? '—'}</strong></p>
                      <p className="text-xs text-slate-600">Ergebnis: <span className={`font-semibold ${v.color.split(' ')[0]}`}>{v.label}</span></p>
                    </div>
                    <VersionsPanel module="governance" entityId={g.id} tier={tier} currentData={{ result: g.result, protocol: g.protocol } as Record<string, unknown>} />
                  </div>
                )}
              </div>
            )
          })}

          {compareMode && compareIds.length === 2 && (() => {
            const g1 = governance.find(g => g.id === compareIds[0])
            const g2 = governance.find(g => g.id === compareIds[1])
            if (!g1 || !g2) return null
            const v1 = VERDICTS[g1.result] ?? { label: g1.result, color: 'text-slate-700 bg-slate-50 border-slate-200' }
            const v2 = VERDICTS[g2.result] ?? { label: g2.result, color: 'text-slate-700 bg-slate-50 border-slate-200' }
            const protocolEntries = (g1.protocol ?? []).slice(0, 5)
            return (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">Vergleich: zwei Governance-Checks</p>
                </div>
                <div className="grid grid-cols-3 text-xs">
                  <div className="px-4 py-2 font-medium text-slate-500 border-b border-slate-100">Eigenschaft</div>
                  <div className="px-4 py-2 font-medium text-primary-hover border-b border-slate-100 border-l">
                    {g1.use_case_name ?? '—'}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(g1.created_at)}</div>
                  </div>
                  <div className="px-4 py-2 font-medium text-emerald-700 border-b border-slate-100 border-l">
                    {g2.use_case_name ?? '—'}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(g2.created_at)}</div>
                  </div>
                  {/* Row: Ergebnis */}
                  <div className="px-4 py-2 text-slate-500 border-t border-slate-100">Ergebnis</div>
                  <div className="px-4 py-2 border-t border-slate-100 border-l">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${v1.color}`}>{v1.label}</span>
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 border-l">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${v2.color}`}>{v2.label}</span>
                  </div>
                  {/* Row: Use Case */}
                  <div className="px-4 py-2 text-slate-500 border-t border-slate-100">Use Case</div>
                  <div className="px-4 py-2 text-slate-700 border-t border-slate-100 border-l truncate">{g1.use_case_name ?? '—'}</div>
                  <div className="px-4 py-2 text-slate-700 border-t border-slate-100 border-l truncate">{g2.use_case_name ?? '—'}</div>
                  {/* Rows: Protocol entries (up to 5) */}
                  {protocolEntries.map((entry, i) => {
                    const q = entry.question ?? entry.label ?? `Frage ${i + 1}`
                    const a1 = entry.answer ?? entry.value ?? '—'
                    const g2entry = (g2.protocol ?? [])[i]
                    const a2 = g2entry ? (g2entry.answer ?? g2entry.value ?? '—') : '—'
                    return (
                      <Fragment key={`protocol-${i}`}>
                        <div className="px-4 py-2 text-slate-500 border-t border-slate-100 truncate">{q}</div>
                        <div className="px-4 py-2 text-slate-700 border-t border-slate-100 border-l">{a1}</div>
                        <div className="px-4 py-2 text-slate-700 border-t border-slate-100 border-l">{a2}</div>
                      </Fragment>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Roadmap ────────────────────────────────────────────── */}
      {tab === 'roadmap' && (
        <div className="space-y-2">
          {roadmaps.length === 0 && <EmptyState variant="folder" title="Noch keine Roadmap" description="Planen Sie Ihre AI-Implementierung in drei Phasen." cta={{ href: '/roadmap', label: 'Jetzt erstellen' }} />}
          {roadmaps.map(r => {
            const isSelected = compareIds.includes(r.id)
            return (
              <div key={r.id} className={cn('bg-white border rounded-xl overflow-hidden', isSelected ? 'border-primary-ring ring-1 ring-primary-ring' : 'border-slate-200')}>
                <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => compareMode ? toggleCompare(r.id) : toggle(r.id)}>
                  {compareMode && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleCompare(r.id)}
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 w-4 h-4 rounded border-slate-300 text-primary cursor-pointer" />
                  )}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-700 truncate">{r.title}</span>
                    <span className="text-xs text-slate-500 shrink-0">{ARCHETYPES[r.archetype] ?? r.archetype}</span>
                    <span className="text-xs text-slate-400 shrink-0">{fmt(r.updated_at)}</span>
                  </div>
                  {!compareMode && (
                    <RowActions isPrimary={prefs.primary_roadmap_id === r.id} isConfirmDelete={confirmId === r.id}
                      onSetPrimary={e => { e.stopPropagation(); setPrimary('roadmap', r.id) }}
                      onConfirm={e => { e.stopPropagation(); setConfirmId(r.id) }}
                      onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                      onDelete={e => { e.stopPropagation(); deleteItem('roadmap', r.id) }} />
                  )}
                </div>
                {!compareMode && expanded === r.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500">{Array.isArray(r.phases) ? r.phases.length : 0} Phasen</p>
                      <Link href="/roadmap" className="text-xs text-primary hover:underline mt-1 inline-block">In Roadmap öffnen →</Link>
                    </div>
                    <VersionsPanel module="roadmap" entityId={r.id} tier={tier} currentData={{ title: r.title, archetype: r.archetype, phases: r.phases } as Record<string, unknown>} />
                  </div>
                )}
              </div>
            )
          })}

          {compareMode && compareIds.length === 2 && (() => {
            const r1 = roadmaps.find(r => r.id === compareIds[0])
            const r2 = roadmaps.find(r => r.id === compareIds[1])
            if (!r1 || !r2) return null
            type Phase = { title?: string; duration?: string; focus?: string }
            const phases1 = (Array.isArray(r1.phases) ? r1.phases : []) as Phase[]
            const phases2 = (Array.isArray(r2.phases) ? r2.phases : []) as Phase[]
            const maxPhases = Math.max(phases1.length, phases2.length)
            return (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">Vergleich: zwei Roadmaps</p>
                </div>
                <div className="grid grid-cols-3 text-xs">
                  <div className="px-4 py-2 font-medium text-slate-500 border-b border-slate-100">Eigenschaft</div>
                  <div className="px-4 py-2 font-medium text-primary-hover border-b border-slate-100 border-l">
                    {r1.title}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(r1.updated_at)}</div>
                  </div>
                  <div className="px-4 py-2 font-medium text-emerald-700 border-b border-slate-100 border-l">
                    {r2.title}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(r2.updated_at)}</div>
                  </div>
                  <div className="px-4 py-2 text-slate-500 border-t border-slate-100">Archetyp</div>
                  <div className="px-4 py-2 font-semibold text-slate-800 border-t border-slate-100 border-l">{ARCHETYPES[r1.archetype] ?? r1.archetype}</div>
                  <div className="px-4 py-2 font-semibold text-slate-800 border-t border-slate-100 border-l">{ARCHETYPES[r2.archetype] ?? r2.archetype}</div>
                  {Array.from({ length: maxPhases }, (_, i) => {
                    const p1 = phases1[i]
                    const p2 = phases2[i]
                    return (
                      <Fragment key={`phase-${i}`}>
                        <div className="px-4 py-2 text-slate-500 border-t border-slate-100">Phase {i + 1}</div>
                        <div className="px-4 py-2 border-t border-slate-100 border-l">
                          {p1 ? (
                            <>
                              <p className="font-semibold text-slate-800">{p1.title ?? '—'}</p>
                              {p1.duration && <p className="text-slate-400">{p1.duration}</p>}
                              {p1.focus && <p className="text-slate-500 mt-0.5">{p1.focus}</p>}
                            </>
                          ) : <span className="text-slate-300">—</span>}
                        </div>
                        <div className="px-4 py-2 border-t border-slate-100 border-l">
                          {p2 ? (
                            <>
                              <p className="font-semibold text-slate-800">{p2.title ?? '—'}</p>
                              {p2.duration && <p className="text-slate-400">{p2.duration}</p>}
                              {p2.focus && <p className="text-slate-500 mt-0.5">{p2.focus}</p>}
                            </>
                          ) : <span className="text-slate-300">—</span>}
                        </div>
                      </Fragment>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Canvas ─────────────────────────────────────────────── */}
      {tab === 'canvas' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs text-slate-500">
              Der <strong>AI Strategy Canvas</strong> ist Ihre strategische Grundlage — Use Cases, Architekturen und Roadmaps bauen auf ihm auf.
            </p>
            <InfoHint title="Was ist der Canvas?" side="bottom">
              <p>Der Canvas erfasst in 8 Feldern den strategischen Kontext Ihres AI-Projekts: Vision, Herausforderungen, Stakeholder, Ressourcen, Zeitplan, Risiken, KPIs und Governance-Struktur.</p>
              <p className="mt-1.5">Ein als <strong>Primär</strong> markierter Canvas wird automatisch in den Architektur-Generator und andere Module übernommen, um kontextsensitive Empfehlungen zu liefern.</p>
            </InfoHint>
          </div>

          {canvases.length === 0 && <EmptyState variant="grid" title="Noch kein Canvas" description="Strukturieren Sie Ihren AI Use Case auf dem 8-Felder-Canvas." cta={{ href: '/canvas', label: 'Jetzt erstellen' }} />}

          {canvases.map(c => {
            const isSelected = compareIds.includes(c.id)
            const filledFields = Object.values(c.data ?? {}).filter(v => v?.trim()).length
            return (
              <div key={c.id} className={cn('bg-white border rounded-xl overflow-hidden', isSelected ? 'border-primary-ring ring-1 ring-primary-ring' : 'border-slate-200')}>
                <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => compareMode ? toggleCompare(c.id) : toggle(c.id)}>
                  {compareMode && (
                    <input type="checkbox" checked={isSelected} onChange={() => toggleCompare(c.id)}
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 w-4 h-4 rounded border-slate-300 text-primary cursor-pointer" />
                  )}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-sm font-medium text-slate-700 truncate">{c.title}</span>
                    {c.archetype && (
                      <span className="text-xs text-slate-500 shrink-0">{ARCHETYPES[c.archetype] ?? c.archetype}</span>
                    )}
                    <span className="text-xs text-slate-400 shrink-0">{filledFields}/8 Felder · {fmt(c.updated_at)}</span>
                  </div>
                  {!compareMode && (
                    <RowActions isPrimary={prefs.primary_canvas_id === c.id} isConfirmDelete={confirmId === c.id}
                      onSetPrimary={e => { e.stopPropagation(); setPrimary('canvas', c.id) }}
                      onConfirm={e => { e.stopPropagation(); setConfirmId(c.id) }}
                      onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                      onDelete={e => { e.stopPropagation(); deleteItem('canvas', c.id) }} />
                  )}
                </div>
                {!compareMode && expanded === c.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
                    <div className="space-y-1.5">
                      {Object.entries(c.data ?? {}).filter(([, v]) => v?.trim()).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-medium text-slate-600 capitalize">{key}: </span>
                          <span className="text-slate-500 line-clamp-2">{value}</span>
                        </div>
                      ))}
                      <Link href="/canvas" className="text-xs text-primary hover:underline mt-1 inline-block">In Canvas öffnen →</Link>
                    </div>
                    <VersionsPanel module="canvas" entityId={c.id} tier={tier} currentData={c.data as Record<string, unknown>} />
                  </div>
                )}
              </div>
            )
          })}

          {compareMode && compareIds.length === 2 && (() => {
            const c1 = canvases.find(c => c.id === compareIds[0])
            const c2 = canvases.find(c => c.id === compareIds[1])
            if (!c1 || !c2) return null
            const allKeys = [...new Set([...Object.keys(c1.data ?? {}), ...Object.keys(c2.data ?? {})])]
            return (
              <div className="mt-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-700">Vergleich: zwei Canvas</p>
                </div>
                <div className="grid grid-cols-3 text-xs">
                  <div className="px-4 py-2 font-medium text-slate-500 border-b border-slate-100">Feld</div>
                  <div className="px-4 py-2 font-medium text-primary-hover border-b border-slate-100 border-l">
                    {c1.title}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(c1.updated_at)}</div>
                  </div>
                  <div className="px-4 py-2 font-medium text-emerald-700 border-b border-slate-100 border-l">
                    {c2.title}
                    <div className="text-[10px] text-slate-400 font-normal">{fmt(c2.updated_at)}</div>
                  </div>
                  {allKeys.map(key => (
                    <Fragment key={`canvas-${key}`}>
                      <div className="px-4 py-2 text-slate-500 border-t border-slate-100 capitalize">{key}</div>
                      <div className="px-4 py-2 text-slate-700 border-t border-slate-100 border-l line-clamp-3">{c1.data?.[key] || '—'}</div>
                      <div className="px-4 py-2 text-slate-700 border-t border-slate-100 border-l line-clamp-3">{c2.data?.[key] || '—'}</div>
                    </Fragment>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Compliance ─────────────────────────────────────────── */}
      {tab === 'compliance' && (
        <div className="space-y-2">
          {complianceChecks.length === 0 && <EmptyState variant="folder" title="Noch keine Compliance-Prüfung" description="Prüfen Sie Ihre Compliance mit EU AI Act, DSGVO und NIS-2." cta={{ href: '/compliance', label: 'Jetzt prüfen' }} />}
          {complianceChecks.map(cc => {
            const statusColor =
              cc.status === 'compliant'     ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
              cc.status === 'non_compliant' ? 'text-red-700 bg-red-50 border-red-200' :
              'text-amber-700 bg-amber-50 border-amber-200'
            const statusLabel =
              cc.status === 'compliant'     ? 'Konform' :
              cc.status === 'non_compliant' ? 'Nicht konform' : 'Offen'
            const regulationLabel =
              cc.regulation === 'eu_ai_act' ? 'EU AI Act' :
              cc.regulation === 'dsgvo'     ? 'DSGVO' :
              cc.regulation
            return (
              <div key={cc.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggle(cc.id)}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusColor}`}>{statusLabel}</span>
                    <span className="text-sm font-medium text-slate-700 truncate">{regulationLabel}</span>
                    <span className="text-xs text-slate-500 shrink-0">{cc.check_type}</span>
                    <span className="text-xs text-slate-400 shrink-0">{fmt(cc.updated_at)}</span>
                  </div>
                  <RowActions
                    isPrimary={prefs.primary_compliance_id === cc.id}
                    isConfirmDelete={confirmId === cc.id}
                    onSetPrimary={e => { e.stopPropagation(); setPrimary('compliance', cc.id) }}
                    onDelete={e => { e.stopPropagation(); deleteItem('compliance', cc.id) }}
                    onConfirm={e => { e.stopPropagation(); setConfirmId(cc.id) }}
                    onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                  />
                </div>
                {expanded === cc.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-1">
                    {cc.notes && <p className="text-xs text-slate-600">Notiz: {cc.notes}</p>}
                    <Link href="/compliance" className="text-xs text-primary hover:underline mt-1 inline-block">In Compliance öffnen →</Link>
                    <VersionsPanel module="compliance" entityId={cc.id} tier={tier} currentData={{ regulation: cc.regulation, check_type: cc.check_type, status: cc.status, notes: cc.notes } as Record<string, unknown>} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Use Cases ──────────────────────────────────────────── */}
      {tab === 'usecase' && (
        <div className="space-y-2">
          {useCases.length === 0 && <EmptyState variant="matrix" title="Noch keine Use Cases bewertet" description="Bewerten und priorisieren Sie Ihre AI Use Cases in der Scoring-Matrix." cta={{ href: '/usecase', label: 'Jetzt bewerten' }} />}
          {useCases.map(uc => {
            const quadrantColor =
              uc.quadrant === 'build'        ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
              uc.quadrant === 'pilot'        ? 'text-primary-hover bg-primary-soft border-primary-border' :
              uc.quadrant === 'evaluate'     ? 'text-amber-700 bg-amber-50 border-amber-200' :
              'text-slate-500 bg-slate-50 border-slate-200'
            const quadrantLabel =
              uc.quadrant === 'build'        ? 'Bauen' :
              uc.quadrant === 'pilot'        ? 'Pilot' :
              uc.quadrant === 'evaluate'     ? 'Evaluieren' :
              uc.quadrant === 'deprioritize' ? 'Zurückstellen' :
              uc.quadrant ?? '—'
            const gov = uc.governance_result ? (VERDICTS[uc.governance_result] ?? null) : null
            return (
              <div key={uc.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggle(uc.id)}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {uc.quadrant && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${quadrantColor}`}>{quadrantLabel}</span>
                    )}
                    <span className="text-sm font-medium text-slate-700 truncate min-w-0">{uc.name}</span>
                    {uc.domain && <span className="text-xs text-slate-500 shrink-0">{uc.domain}</span>}
                    {uc.weighted_score != null && (
                      <span className="text-xs text-slate-400 shrink-0">{Math.round(uc.weighted_score)} Pkt.</span>
                    )}
                  </div>
                  <RowActions
                    isPrimary={prefs.primary_usecase_id === uc.id}
                    isConfirmDelete={confirmId === uc.id}
                    onSetPrimary={e => { e.stopPropagation(); setPrimary('usecase', uc.id) }}
                    onDelete={e => { e.stopPropagation(); deleteItem('usecase', uc.id) }}
                    onConfirm={e => { e.stopPropagation(); setConfirmId(uc.id) }}
                    onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                  />
                </div>
                {expanded === uc.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-1">
                    {gov && (
                      <p className="text-xs text-slate-600">Governance: <span className={`font-semibold ${gov.color.split(' ')[0]}`}>{gov.label}</span></p>
                    )}
                    <Link href="/usecase" className="text-xs text-primary hover:underline mt-1 inline-block">In Use Cases öffnen →</Link>
                    <VersionsPanel module="usecase" entityId={uc.id} tier={tier} currentData={{ name: uc.name, domain: uc.domain, weighted_score: uc.weighted_score, quadrant: uc.quadrant } as Record<string, unknown>} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
