'use client'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  useSortable,
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ROADMAPS, PHASE_COLORS, ARCHETYPE_LABELS } from '@/config/roadmap-data'
import { QUADRANT_META } from '@/config/usecase-data'
import { InfoHint } from '@/components/shared/InfoHint'
import { SectionTitle } from '@/components/shared/typography'
import { AlertBox } from '@/components/shared/AlertBox'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { ShareButton } from '@/components/shared/ShareButton'
import { MeridianExportButton } from '@/components/shared/MeridianExportButton'
import type { Archetype, Tier } from '@/types'

type GovernanceVerdict = 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve'
type TopUseCase = { id: string; name: string; domain: string | null; weighted_score: number | null; quadrant: string | null; governance_result: GovernanceVerdict | null }

const GOVERNANCE_BADGE_CLASS: Record<GovernanceVerdict, string> = {
  approve:    'bg-emerald-100 text-emerald-700',
  improve:    'bg-amber-100 text-amber-700',
  stop_risk:  'bg-red-100 text-red-700',
  stop_dsgvo: 'bg-red-100 text-red-700',
}
type MilestoneStatus = 'not_started' | 'in_progress' | 'done'
type SavedRoadmap = { id: string; archetype: string; phases: unknown[] }
type LinkedCanvas = { id: string; title: string; archetype: string | null; data: Record<string, string> }

const MILESTONE_NEXT: Record<MilestoneStatus, MilestoneStatus> = {
  not_started: 'in_progress',
  in_progress: 'done',
  done: 'not_started',
}
const MILESTONE_ICON: Record<MilestoneStatus, string> = {
  not_started: '○',
  in_progress: '◑',
  done: '✓',
}
const MILESTONE_COLOR: Record<MilestoneStatus, string> = {
  not_started: 'text-slate-300 hover:text-slate-400',
  in_progress: 'text-primary hover:text-primary',
  done: 'text-emerald-500 hover:text-emerald-600',
}

function detectCanvasInsights(data: Record<string, string>): string[] {
  const text = Object.values(data).join(' ').toLowerCase()
  const insights: string[] = []
  if (/\bsap\b/.test(text)) insights.push('SAP-Umgebung erkannt')
  if (/\bazure\b/.test(text)) insights.push('Microsoft Azure erkannt')
  if (/\baws\b|amazon web/.test(text)) insights.push('AWS erkannt')
  if (/\bgcp\b|google cloud/.test(text)) insights.push('Google Cloud erkannt')
  if (/dsgvo|datenschutz|personenbezogen/.test(text)) insights.push('DSGVO-Relevanz erkannt')
  if (/eu.?ai.?act|hochrisiko/.test(text)) insights.push('EU AI Act relevant')
  return insights
}

interface Props {
  initialArchetype: Archetype | null
  fromAssessment: boolean
  tier: Tier
  topUseCases: TopUseCase[]
  savedRoadmap: SavedRoadmap | null
  linkedCanvas: LinkedCanvas | null
  archKeyDecisions: { de: string; en: string }[]
}

const ARCHETYPES: Archetype[] = ['starter', 'scaler', 'transformer']
const PHASES = ['phase1', 'phase2', 'phase3'] as const
type PhaseId = typeof PHASES[number]
const PHASE_ORDER_KEY = 'roadmap_phase_order_v1'

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-75')}
    >
      <div
        {...attributes}
        {...listeners}
        className="hidden md:flex absolute -left-5 top-3 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 select-none focus:outline-none"
        aria-label="Abschnitt verschieben"
        role="button"
        tabIndex={0}
      >
        ⠿
      </div>
      {children}
    </div>
  )
}

function milestonesFromPhases(phases: unknown[]): Record<string, MilestoneStatus> {
  const result: Record<string, MilestoneStatus> = {}
  for (const phase of phases) {
    const p = phase as { phase?: string; milestones?: Record<string, string> }
    if (p.phase && p.milestones) {
      for (const [key, val] of Object.entries(p.milestones)) {
        result[`${p.phase}_${key}`] = val as MilestoneStatus
      }
    }
  }
  return result
}

export function RoadmapPageClient({ initialArchetype, fromAssessment, tier, topUseCases, savedRoadmap, linkedCanvas, archKeyDecisions }: Props) {
  const t = useTranslations('modules')
  const locale = useLocale()
  const governanceBadgeLabel: Record<GovernanceVerdict, string> = {
    approve:    `✓ ${t('architecture.governanceApprove')}`,
    improve:    `⚠ ${t('architecture.governanceImprove')}`,
    stop_risk:  `✗ ${t('architecture.governanceStopRisk')}`,
    stop_dsgvo: `✗ ${t('architecture.governanceStopDsgvo')}`,
  }
  const [archetype, setArchetype] = useState<Archetype>(
    (savedRoadmap?.archetype as Archetype | undefined) ?? initialArchetype ?? 'starter'
  )
  const [milestones, setMilestones] = useState<Record<string, MilestoneStatus>>(
    savedRoadmap?.phases ? milestonesFromPhases(savedRoadmap.phases) : {}
  )
  const [savedId, setSavedId] = useState<string | null>(savedRoadmap?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!savedRoadmap)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [dismissedDecisions, setDismissedDecisions] = useState<Set<string>>(new Set())

  const [phaseOrder, setPhaseOrder] = useState<PhaseId[]>(() => {
    if (savedRoadmap?.phases) {
      const ids = (savedRoadmap.phases as { phase?: string }[])
        .map(p => p.phase)
        .filter((id): id is PhaseId => (PHASES as readonly string[]).includes(id as string))
      if (ids.length === PHASES.length) return ids
    }
    if (typeof window === 'undefined') return [...PHASES]
    try {
      const stored = localStorage.getItem(PHASE_ORDER_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        const valid = parsed.filter((id): id is PhaseId => (PHASES as readonly string[]).includes(id))
        if (valid.length === PHASES.length) return valid
      }
    } catch {}
    return [...PHASES]
  })

  const dndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleArchetypeChange = (a: Archetype) => { setArchetype(a); setSaved(false) }

  const toggleMilestone = (key: string) => {
    setMilestones(prev => ({ ...prev, [key]: MILESTONE_NEXT[prev[key] ?? 'not_started'] }))
    setSaved(false)
  }

  // Persistiert die Arbeits-Zeile (POST beim ersten Mal, sonst PATCH) und gibt
  // die id der gespeicherten Roadmap zurück (oder null bei Fehler).
  const persistRoadmap = async (): Promise<string | null> => {
    const roadmap = ROADMAPS[archetype]
    const phases = phaseOrder.map(phaseId => {
      const phaseMilestones = Object.fromEntries(
        Object.entries(milestones)
          .filter(([k]) => k.startsWith(`${phaseId}_`))
          .map(([k, v]) => [k.replace(`${phaseId}_`, ''), v])
      )
      return { phase: phaseId, ...roadmap[phaseId], milestones: phaseMilestones }
    })
    const [url, method] = savedId
      ? [`/api/roadmap/${savedId}`, 'PATCH']
      : ['/api/roadmap', 'POST']
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archetype, phases }),
    })
    if (!res.ok) return null
    const { data } = await res.json()
    const id = (data?.id as string | undefined) ?? savedId
    if (data?.id && !savedId) setSavedId(data.id)
    return id ?? null
  }

  // „Aktualisieren": nur die Arbeits-Zeile. „Als neue Version sichern":
  // zusätzlich einen Versions-Snapshot (POST /api/versions) — derselbe
  // Datenschnitt wie im VersionsPanel ({ archetype, milestones }).
  const doSave = async (mode: 'update' | 'version') => {
    setShowSaveDialog(false)
    setSaving(true)
    try {
      const id = await persistRoadmap()
      if (id && mode === 'version') {
        await fetch('/api/versions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: 'roadmap', entity_id: id, data: { archetype, milestones } }),
        }).catch(() => {})
      }
      if (id) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  // Beim ersten Speichern (noch keine gespeicherte Roadmap) direkt sichern —
  // es gibt noch nichts zu versionieren. Ab der zweiten Speicherung fragt der
  // Dialog „Aktualisieren vs. als neue Version sichern" (UX-Review Sprint 36).
  const handleSaveClick = () => {
    if (savedId) setShowSaveDialog(true)
    else void doSave('update')
  }

  const roadmap = ROADMAPS[archetype]

  const canvasInsights = linkedCanvas ? detectCanvasInsights(linkedCanvas.data) : []

  return (
    <div>
      {/* Kontext & Konfiguration — eine gemeinsame Card statt drei getrennter
          Blöcke (#205-Folgeissue „Roadmap-Boxen verschmelzen", UX-Review 22.07.2026):
          Archetyp-Auswahl + Top-Use-Cases im Standard-Kartendesign, Canvas-Kontext
          als eingebettete Teilbox darunter. Semantische Tokens (kein hartes Blau
          mehr wie in den alten primary-soft-Boxen), #201-konform. */}
      <div className="mb-6 bg-surface border border-line rounded-2xl p-4 sm:p-6 space-y-5">
        {/* Archetyp-Auswahl */}
        <div>
          {fromAssessment && initialArchetype && (
            <p className="text-xs text-ink-muted mb-3">{t('roadmap.archetypeFromAssessmentHint')}</p>
          )}
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('roadmap.archetypeAriaLabel')}>
            {ARCHETYPES.map(a => {
              const meta = ARCHETYPE_LABELS[a]
              const active = archetype === a
              return (
                <button key={a} onClick={() => handleArchetypeChange(a)} aria-pressed={active}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2',
                    active ? 'bg-primary border-primary text-white font-medium' : 'bg-surface border-line text-ink-secondary hover:border-line-strong hover:bg-surface-raised'
                  )}>
                  <span aria-hidden="true">{meta.icon}</span>
                  {pick(meta.label, locale)}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <p className="text-xs text-ink-subtle">{pick(ARCHETYPE_LABELS[archetype].desc, locale)}</p>
            <InfoHint title={t('roadmap.hintArchetypeTitle')} side="bottom">
              <p>{t('roadmap.hintArchetype')}</p>
            </InfoHint>
          </div>
        </div>

        {/* Top Use-Cases aus Scoring */}
        {topUseCases.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                {t('roadmap.topUseCasesLabel')}
              </p>
              <InfoHint title={t('roadmap.hintTopUseCasesTitle')} side="bottom">
                <p>{t('roadmap.hintTopUseCases')}</p>
              </InfoHint>
            </div>
            <div className="flex flex-wrap gap-2">
              {topUseCases.map((uc, i) => {
                const qMeta = uc.quadrant ? QUADRANT_META[uc.quadrant as keyof typeof QUADRANT_META] : null
                return (
                  <div key={uc.id} className={cn(
                    'flex items-center gap-2 bg-surface-raised border rounded-xl px-3 py-2 text-sm min-w-0',
                    uc.governance_result === 'stop_dsgvo' || uc.governance_result === 'stop_risk'
                      ? 'border-error-border opacity-75'
                      : 'border-line'
                  )}>
                    <span className="text-ink-subtle text-xs flex-shrink-0">#{i + 1}</span>
                    <span className="font-medium text-ink truncate max-w-[120px]">{uc.name}</span>
                    {uc.weighted_score != null && (
                      <span className="text-xs text-ink-muted flex-shrink-0">{Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number(uc.weighted_score))}</span>
                    )}
                    {qMeta && (
                      <span className="text-xs flex-shrink-0">{qMeta.icon}</span>
                    )}
                    {uc.governance_result && (
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0', GOVERNANCE_BADGE_CLASS[uc.governance_result])}>
                        {governanceBadgeLabel[uc.governance_result]}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Canvas-Kontext — eingebettete Teilbox mit Canvas-Icon (◧, konsistent
            zur Sidebar/AI-Pfad-Iconografie) vor dem Titel. */}
        {linkedCanvas && (
          <div className="bg-surface-raised border border-line rounded-xl p-3.5">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-primary text-sm leading-none mt-0.5" aria-hidden="true">◧</span>
              <span className="text-xs font-semibold text-ink-secondary">{t('roadmap.canvasLinked')}</span>
              <InfoHint title={t('roadmap.canvasHintTitle')} side="bottom">
                <p>{t('roadmap.canvasHintP1')}</p>
                <p className="mt-1.5">{t('roadmap.canvasHintP2')}</p>
              </InfoHint>
            </div>
            <p className="text-xs text-ink font-medium mb-1">{linkedCanvas.title}</p>
            {(linkedCanvas.data.problem || linkedCanvas.data.kpis) && (
              <div className="mt-1 mb-2 space-y-1">
                {linkedCanvas.data.problem && (
                  <p className="text-xs text-ink-secondary">
                    <span className="font-medium">{t('roadmap.problemLabel')} </span>
                    {linkedCanvas.data.problem.length > 120 ? `${linkedCanvas.data.problem.slice(0, 120)}…` : linkedCanvas.data.problem}
                  </p>
                )}
                {linkedCanvas.data.kpis && (
                  <p className="text-xs text-ink-secondary">
                    <span className="font-medium">{t('roadmap.kpisPrefix')} </span>
                    {linkedCanvas.data.kpis.length > 100 ? `${linkedCanvas.data.kpis.slice(0, 100)}…` : linkedCanvas.data.kpis}
                  </p>
                )}
              </div>
            )}
            {canvasInsights.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {canvasInsights.map(insight => (
                  <span key={insight} className="text-[11px] bg-primary-soft text-primary-hover rounded-full px-2 py-0.5 font-medium">
                    {insight}
                  </span>
                ))}
              </div>
            )}
            {canvasInsights.length === 0 && (
              <p className="text-xs text-ink-subtle">{t('roadmap.canvasNoSignals')}</p>
            )}
          </div>
        )}
      </div>

      {/* Key Decisions aus Architektur */}
      {archKeyDecisions.length > 0 && (
        <AlertBox variant="info" title={t('roadmap.archDecisionsTitle')} className="mb-6">
          <ul className="space-y-1.5 mt-1">
            {archKeyDecisions
              .filter(d => !dismissedDecisions.has(d.de))
              .map(d => (
                <li key={d.de} className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5" aria-hidden="true">◆</span>
                  <span className="flex-1 min-w-0">{locale === 'de' ? d.de : d.en}</span>
                  <button
                    type="button"
                    onClick={() => setDismissedDecisions(prev => new Set([...prev, d.de]))}
                    className="shrink-0 opacity-50 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-current rounded"
                    aria-label={t('roadmap.archDecisionDismiss')}
                  >
                    ✕
                  </button>
                </li>
              ))}
          </ul>
          {archKeyDecisions.every(d => dismissedDecisions.has(d.de)) && (
            <p className="opacity-70 italic">{t('roadmap.archDecisionsAllDismissed')}</p>
          )}
        </AlertBox>
      )}

      {/* 3-Phasen-Roadmap */}
      <DndContext
        sensors={dndSensors}
        onDragEnd={(event: DragEndEvent) => {
          const { active, over } = event
          if (over && active.id !== over.id) {
            setPhaseOrder(prev => {
              const oldIndex = prev.indexOf(active.id as PhaseId)
              const newIndex = prev.indexOf(over.id as PhaseId)
              const next = arrayMove(prev, oldIndex, newIndex)
              try { localStorage.setItem(PHASE_ORDER_KEY, JSON.stringify(next)) } catch {}
              return next
            })
            setSaved(false)
          }
        }}
      >
        <SortableContext items={phaseOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {phaseOrder.map(phaseId => {
              const phase = roadmap[phaseId]
              const colors = PHASE_COLORS[phaseId]
              const doneCount = phase.actions.filter((_, i) => milestones[`${phaseId}_${i}`] === 'done').length
              const progressPct = phase.actions.length > 0 ? Math.round((doneCount / phase.actions.length) * 100) : 0
              return (
                <SortableSection key={phaseId} id={phaseId}>
                <section aria-labelledby={`${phaseId}-heading`}
                  className={cn('rounded-2xl border p-4 sm:p-6', colors.bg, colors.border)}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', colors.badge)}>{pick(phase.duration, locale)}</span>
                    {doneCount > 0 && (
                      <span className="text-xs text-slate-500">{doneCount}/{phase.actions.length} erledigt</span>
                    )}
                  </div>
                  <SectionTitle as="h2" id={`${phaseId}-heading`}>{pick(phase.title, locale)}</SectionTitle>
                  <p className="text-sm text-slate-600 mt-0.5">{pick(phase.focus, locale)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Budget: {phase.budget}</span>
                  {doneCount > 0 && (
                    <div className="w-24 h-1 bg-white/60 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('roadmap.measuresLabel')}</p>
                    <InfoHint title={t('roadmap.hintMeasuresTitle')} side="bottom">
                      <p>{t('roadmap.hintMeasures')}</p>
                    </InfoHint>
                  </div>
                  <ul className="space-y-2" role="list">
                    {phase.actions.map((action, i) => {
                      const key = `${phaseId}_${i}`
                      const status = milestones[key] ?? 'not_started'
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => toggleMilestone(key)}
                            className="flex w-full items-start gap-2 rounded-lg px-1 py-0.5 -mx-1 hover:bg-slate-50 cursor-pointer transition-colors text-left"
                          >
                            <span className={cn('mt-0.5 flex-shrink-0 text-base leading-none transition-colors', MILESTONE_COLOR[status])}>
                              {MILESTONE_ICON[status]}
                            </span>
                            <span className={cn('text-sm min-w-0 transition-colors', status === 'done' ? 'line-through text-slate-400' : action.priority === 'high' ? 'text-slate-800' : 'text-slate-600')}>
                              {pick(action.label, locale)}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  {phaseId === 'phase1' && linkedCanvas?.data.next_steps && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">{t('roadmap.fromCanvas')}</p>
                      <p className="text-sm text-slate-600">
                        {linkedCanvas.data.next_steps.length > 250
                          ? `${linkedCanvas.data.next_steps.slice(0, 250)}…`
                          : linkedCanvas.data.next_steps}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('roadmap.kpisLabel')}</p>
                    <InfoHint title={t('roadmap.hintKpisTitle')} side="bottom">
                      <p>{t('roadmap.hintKpis')}</p>
                    </InfoHint>
                  </div>
                  <ul className="space-y-2" role="list">
                    {phase.kpis.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 text-xs text-slate-400" aria-hidden="true">✓</span>
                        <span className="text-sm text-slate-700 min-w-0">{pick(kpi, locale)}</span>
                      </li>
                    ))}
                  </ul>
                  {phaseId === 'phase1' && linkedCanvas?.data.kpis && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">{t('roadmap.canvasKpisLabel')}</p>
                      <p className="text-sm text-slate-600">
                        {linkedCanvas.data.kpis.length > 200
                          ? `${linkedCanvas.data.kpis.slice(0, 200)}…`
                          : linkedCanvas.data.kpis}
                      </p>
                    </div>
                  )}
                </div>
              </div>
                </section>
                </SortableSection>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Aktions-Leiste — unterhalb der Phasen */}
      <div className="flex flex-wrap items-center gap-3 mt-6">
        {!saved && (
          <button onClick={handleSaveClick} disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2">
            {saving ? t('roadmap.saving') : t('roadmap.save')}
          </button>
        )}
        {saved && <span className="text-sm text-green-700 font-medium">{t('roadmap.saved')}</span>}
        <MeridianExportButton
          report="roadmap-status"
          namespace="reports.roadmapStatus"
          locale={locale}
          isPro={tier !== 'free'}
          hasData={!!savedId}
        />
        {savedId && (
          <>
            <VersionsPanel module="roadmap" entityId={savedId} tier={tier} currentData={{ archetype, milestones: milestones as Record<string, unknown> }} />
            <ShareButton module="roadmap" entityId={savedId} tier={tier} />
          </>
        )}
      </div>

      {/* Speichern-Dialog: erscheint ab der zweiten Speicherung (UX-Review Sprint 36) */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" role="dialog" aria-modal="true" aria-label={t('roadmap.saveDialogTitle')}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-ink">{t('roadmap.saveDialogTitle')}</h2>
              <button
                onClick={() => setShowSaveDialog(false)}
                aria-label={t('roadmap.saveDialogCancel')}
                className="text-ink-subtle hover:text-ink-secondary text-xl leading-none focus:outline-none"
              >×</button>
            </div>
            <p className="text-sm text-ink-secondary mb-5">{t('roadmap.saveDialogDesc')}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => void doSave('version')}
                className="w-full py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
              >
                {t('roadmap.saveAsVersion')}
              </button>
              <button
                onClick={() => void doSave('update')}
                className="w-full py-2.5 text-sm font-medium border border-line text-ink-secondary rounded-xl hover:bg-surface-raised transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
              >
                {t('roadmap.saveUpdate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
