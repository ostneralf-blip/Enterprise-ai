'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ROADMAPS, PHASE_COLORS, ARCHETYPE_LABELS } from '@/config/roadmap-data'
import { QUADRANT_META } from '@/config/usecase-data'
import { InfoHint } from '@/components/shared/InfoHint'
import type { Archetype, Tier } from '@/types'

type TopUseCase = { id: string; name: string; domain: string | null; weighted_score: number | null; quadrant: string | null }
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
  in_progress: 'text-blue-500 hover:text-blue-600',
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
}

const ARCHETYPES: Archetype[] = ['starter', 'scaler', 'transformer']
const PHASES = ['phase1', 'phase2', 'phase3'] as const

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

export function RoadmapPageClient({ initialArchetype, fromAssessment, tier, topUseCases, savedRoadmap, linkedCanvas }: Props) {
  const [archetype, setArchetype] = useState<Archetype>(
    (savedRoadmap?.archetype as Archetype | undefined) ?? initialArchetype ?? 'starter'
  )
  const [milestones, setMilestones] = useState<Record<string, MilestoneStatus>>(
    savedRoadmap?.phases ? milestonesFromPhases(savedRoadmap.phases) : {}
  )
  const [savedId, setSavedId] = useState<string | null>(savedRoadmap?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(!!savedRoadmap)

  const handleArchetypeChange = (a: Archetype) => { setArchetype(a); setSaved(false) }

  const toggleMilestone = (key: string) => {
    setMilestones(prev => ({ ...prev, [key]: MILESTONE_NEXT[prev[key] ?? 'not_started'] }))
    setSaved(false)
  }

  const handleSave = async () => {
    const roadmap = ROADMAPS[archetype]
    const phases = PHASES.map(phaseId => {
      const phaseMilestones = Object.fromEntries(
        Object.entries(milestones)
          .filter(([k]) => k.startsWith(`${phaseId}_`))
          .map(([k, v]) => [k.replace(`${phaseId}_`, ''), v])
      )
      return { phase: phaseId, ...roadmap[phaseId], milestones: phaseMilestones }
    })
    setSaving(true)
    try {
      const [url, method] = savedId
        ? [`/api/roadmap/${savedId}`, 'PATCH']
        : ['/api/roadmap', 'POST']
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetype, phases }),
      })
      if (res.ok) {
        const { data } = await res.json()
        if (data?.id && !savedId) setSavedId(data.id)
        setSaved(true)
      }
    } finally {
      setSaving(false)
    }
  }

  const roadmap = ROADMAPS[archetype]

  const canvasInsights = linkedCanvas ? detectCanvasInsights(linkedCanvas.data) : []

  return (
    <div>
      {/* Canvas-Kontext-Banner */}
      {linkedCanvas && (
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-800">Canvas verknüpft</span>
            <InfoHint title="Wie beeinflusst der Canvas die Roadmap?" side="bottom">
              <p>Der verknüpfte Canvas stammt von Ihrem am höchsten bewerteten Use Case. Er liefert strategischen Kontext wie Plattform, Compliance-Anforderungen und Stakeholder-Situation.</p>
              <p className="mt-1.5">Die erkannten Signale helfen Ihnen, bei der Phasenplanung gezielt zu priorisieren. Wechseln Sie in der Sidebar zu <strong>Canvas</strong>, um den Inhalt zu bearbeiten.</p>
            </InfoHint>
          </div>
          <p className="text-xs text-blue-700 font-medium mb-1">{linkedCanvas.title}</p>
          {(linkedCanvas.data.problem || linkedCanvas.data.kpis) && (
            <div className="mt-1 mb-2 space-y-1">
              {linkedCanvas.data.problem && (
                <p className="text-xs text-blue-700 opacity-90">
                  <span className="font-medium">Problem: </span>
                  {linkedCanvas.data.problem.length > 120 ? `${linkedCanvas.data.problem.slice(0, 120)}…` : linkedCanvas.data.problem}
                </p>
              )}
              {linkedCanvas.data.kpis && (
                <p className="text-xs text-blue-700 opacity-90">
                  <span className="font-medium">KPIs: </span>
                  {linkedCanvas.data.kpis.length > 100 ? `${linkedCanvas.data.kpis.slice(0, 100)}…` : linkedCanvas.data.kpis}
                </p>
              )}
            </div>
          )}
          {canvasInsights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {canvasInsights.map(insight => (
                <span key={insight} className="text-[11px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-medium">
                  {insight}
                </span>
              ))}
            </div>
          )}
          {canvasInsights.length === 0 && (
            <p className="text-xs text-blue-600 opacity-70">Keine spezifischen Plattform- oder Compliance-Signale erkannt.</p>
          )}
        </div>
      )}

      {/* Archetyp-Auswahl */}
      <div className="mb-6">
        {fromAssessment && initialArchetype && (
          <p className="text-xs text-slate-500 mb-3">
            Archetyp basierend auf deinem letzten Assessment — du kannst ihn unten ändern.
          </p>
        )}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Archetyp auswählen">
          {ARCHETYPES.map(a => {
            const meta = ARCHETYPE_LABELS[a]
            const active = archetype === a
            return (
              <button key={a} onClick={() => handleArchetypeChange(a)} aria-pressed={active}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  active ? 'bg-blue-600 border-blue-600 text-white font-medium' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}>
                <span aria-hidden="true">{meta.icon}</span>
                {meta.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2">{ARCHETYPE_LABELS[archetype].desc}</p>
      </div>

      {/* Top Use-Cases aus Scoring */}
      {topUseCases.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2.5">
            Ihre Top-Use-Cases (aus Use-Case-Scoring)
          </p>
          <div className="flex flex-wrap gap-2">
            {topUseCases.map((uc, i) => {
              const qMeta = uc.quadrant ? QUADRANT_META[uc.quadrant as keyof typeof QUADRANT_META] : null
              return (
                <div key={uc.id} className="flex items-center gap-2 bg-white border border-blue-100 rounded-xl px-3 py-2 text-sm min-w-0">
                  <span className="text-slate-400 text-xs flex-shrink-0">#{i + 1}</span>
                  <span className="font-medium text-slate-900 truncate max-w-[140px]">{uc.name}</span>
                  {uc.weighted_score != null && (
                    <span className="text-xs text-slate-500 flex-shrink-0">{Number(uc.weighted_score).toFixed(1)}</span>
                  )}
                  {qMeta && (
                    <span className="text-xs flex-shrink-0">{qMeta.icon}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3-Phasen-Roadmap */}
      <div className="space-y-4">
        {PHASES.map(phaseId => {
          const phase = roadmap[phaseId]
          const colors = PHASE_COLORS[phaseId]
          const doneCount = phase.actions.filter((_, i) => milestones[`${phaseId}_${i}`] === 'done').length
          const progressPct = phase.actions.length > 0 ? Math.round((doneCount / phase.actions.length) * 100) : 0
          return (
            <section key={phaseId} aria-labelledby={`${phaseId}-heading`}
              className={cn('rounded-2xl border p-4 sm:p-6', colors.bg, colors.border)}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', colors.badge)}>{phase.duration}</span>
                    {doneCount > 0 && (
                      <span className="text-xs text-slate-500">{doneCount}/{phase.actions.length} erledigt</span>
                    )}
                  </div>
                  <h2 id={`${phaseId}-heading`} className="text-base sm:text-lg font-semibold text-slate-900">{phase.title}</h2>
                  <p className="text-sm text-slate-600 mt-0.5">{phase.focus}</p>
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
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Maßnahmen</p>
                  <ul className="space-y-2" role="list">
                    {phase.actions.map((action, i) => {
                      const key = `${phaseId}_${i}`
                      const status = milestones[key] ?? 'not_started'
                      return (
                        <li key={i} className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => toggleMilestone(key)}
                            aria-label={`Status: ${status}`}
                            className={cn('mt-0.5 flex-shrink-0 text-base leading-none transition-colors', MILESTONE_COLOR[status])}
                          >
                            {MILESTONE_ICON[status]}
                          </button>
                          <span className={cn('text-sm min-w-0 transition-colors', status === 'done' ? 'line-through text-slate-400' : action.priority === 'high' ? 'text-slate-800' : 'text-slate-600')}>
                            {action.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  {phaseId === 'phase1' && linkedCanvas?.data.next_steps && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">Aus Ihrem Canvas</p>
                      <p className="text-sm text-slate-600">
                        {linkedCanvas.data.next_steps.length > 250
                          ? `${linkedCanvas.data.next_steps.slice(0, 250)}…`
                          : linkedCanvas.data.next_steps}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Ziel-KPIs</p>
                  <ul className="space-y-2" role="list">
                    {phase.kpis.map((kpi, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 text-xs text-slate-400" aria-hidden="true">✓</span>
                        <span className="text-sm text-slate-700 min-w-0">{kpi}</span>
                      </li>
                    ))}
                  </ul>
                  {phaseId === 'phase1' && linkedCanvas?.data.kpis && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">Ihre KPIs (Canvas)</p>
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
          )
        })}
      </div>

      {/* Aktions-Leiste — unterhalb der Phasen */}
      <div className="flex flex-wrap items-center gap-3 mt-6">
        {!saved && (
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors whitespace-nowrap disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            {saving ? 'Wird gespeichert…' : 'Roadmap speichern'}
          </button>
        )}
        {saved && <span className="text-sm text-green-700 font-medium">✓ Gespeichert</span>}
        <a href={tier !== 'free' ? '/api/export/pdf?module=roadmap' : '/upgrade'}
          {...(tier !== 'free' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-flex items-center gap-1.5">
          PDF exportieren{tier === 'free' && <span className="text-xs opacity-60">· Pro</span>}
        </a>
      </div>
    </div>
  )
}
