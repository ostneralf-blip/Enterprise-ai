'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ROADMAPS, PHASE_COLORS, ARCHETYPE_LABELS } from '@/config/roadmap-data'
import type { Archetype } from '@/types'

interface Props {
  initialArchetype: Archetype | null
  fromAssessment: boolean
}

const ARCHETYPES: Archetype[] = ['starter', 'scaler', 'transformer']
const PHASES = ['phase1', 'phase2', 'phase3'] as const

export function RoadmapPageClient({ initialArchetype, fromAssessment }: Props) {
  const [archetype, setArchetype] = useState<Archetype>(initialArchetype ?? 'starter')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleArchetypeChange = (a: Archetype) => {
    setArchetype(a)
    setSaved(false)
  }

  const handleSave = async () => {
    const roadmap = ROADMAPS[archetype]
    const phases = PHASES.map(phaseId => ({ phase: phaseId, ...roadmap[phaseId] }))
    setSaving(true)
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetype, phases }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const roadmap = ROADMAPS[archetype]

  return (
    <div>
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
              <button
                key={a}
                onClick={() => handleArchetypeChange(a)}
                aria-pressed={active}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  active
                    ? 'bg-blue-600 border-blue-600 text-white font-medium'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span aria-hidden="true">{meta.icon}</span>
                {meta.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2">{ARCHETYPE_LABELS[archetype].desc}</p>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3 mb-5">
        {!saved && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors whitespace-nowrap disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {saving ? 'Wird gespeichert…' : 'Roadmap speichern'}
          </button>
        )}
        {saved && (
          <span className="text-sm text-green-700 font-medium">✓ Gespeichert</span>
        )}
      </div>

      {/* 3-Phasen-Roadmap */}
      <div className="space-y-4">
        {PHASES.map(phaseId => {
          const phase = roadmap[phaseId]
          const colors = PHASE_COLORS[phaseId]
          return (
            <section
              key={phaseId}
              aria-labelledby={`${phaseId}-heading`}
              className={cn('rounded-2xl border p-4 sm:p-6', colors.bg, colors.border)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', colors.badge)}>
                      {phase.duration}
                    </span>
                  </div>
                  <h2 id={`${phaseId}-heading`} className="text-base sm:text-lg font-semibold text-slate-900">
                    {phase.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-0.5">{phase.focus}</p>
                </div>
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Budget: {phase.budget}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Maßnahmen */}
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Maßnahmen</p>
                  <ul className="space-y-2" role="list">
                    {phase.actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span
                          className={cn('mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full', colors.dot)}
                          aria-hidden="true"
                        />
                        <span className={cn('text-sm min-w-0', action.priority === 'high' ? 'text-slate-800' : 'text-slate-600')}>
                          {action.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* KPIs */}
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
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
