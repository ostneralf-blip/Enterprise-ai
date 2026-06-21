'use client'
import { useState } from 'react'
import Link from 'next/link'

type Tab = 'assessment' | 'architecture' | 'governance' | 'roadmap'

interface Prefs {
  primary_assessment_id:   string | null
  primary_governance_id:   string | null
  primary_roadmap_id:      string | null
  primary_architecture_id: string | null
}

export interface AssessmentRow    { id: string; archetype: string; total_score: number; dim_scores: Record<string, number>; created_at: string }
export interface ArchitectureRow  { id: string; title: string; wizard_data: Record<string, unknown>; result: Record<string, unknown>; updated_at: string }
export interface GovernanceRow    { id: string; use_case_name: string | null; result: string; created_at: string }
export interface RoadmapRow       { id: string; title: string; archetype: string; phases: unknown[]; updated_at: string }

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
const PREF_KEY: Record<Tab, keyof Prefs> = {
  assessment:   'primary_assessment_id',
  architecture: 'primary_architecture_id',
  governance:   'primary_governance_id',
  roadmap:      'primary_roadmap_id',
}
const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

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
    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
      {isPrimary
        ? <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5 whitespace-nowrap">★ Primär</span>
        : <button onClick={onSetPrimary} className="text-xs text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-md px-2 py-0.5 transition-colors whitespace-nowrap">Als Primär</button>
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
  initialPreferences: Prefs | null
}

export function ErgebnissePageClient({ assessments: initA, architectures: initArch, governanceSessions: initG, roadmaps: initR, initialPreferences }: Props) {
  const emptyPrefs: Prefs = { primary_assessment_id: null, primary_governance_id: null, primary_roadmap_id: null, primary_architecture_id: null }
  const [tab,           setTab]           = useState<Tab>('assessment')
  const [prefs,         setPrefs]         = useState<Prefs>(initialPreferences ?? emptyPrefs)
  const [expanded,      setExpanded]      = useState<string | null>(null)
  const [confirmId,     setConfirmId]     = useState<string | null>(null)
  const [assessments,   setAssessments]   = useState(initA)
  const [architectures, setArchitectures] = useState(initArch)
  const [governance,    setGovernance]    = useState(initG)
  const [roadmaps,      setRoadmaps]      = useState(initR)

  const setPrimary = async (category: Tab, id: string) => {
    const key = PREF_KEY[category]
    const res = await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: id }),
    })
    if (res.ok) setPrefs(p => ({ ...p, [key]: id }))
  }

  const deleteItem = async (category: Tab, id: string) => {
    const path = { assessment: `/api/assessment/${id}`, architecture: `/api/architecture/${id}`, governance: `/api/governance/${id}`, roadmap: `/api/roadmap/${id}` }[category]
    const res = await fetch(path, { method: 'DELETE' })
    if (!res.ok) return
    if (category === 'assessment')   setAssessments(xs => xs.filter(x => x.id !== id))
    if (category === 'architecture') setArchitectures(xs => xs.filter(x => x.id !== id))
    if (category === 'governance')   setGovernance(xs => xs.filter(x => x.id !== id))
    if (category === 'roadmap')      setRoadmaps(xs => xs.filter(x => x.id !== id))
    if (expanded === id) setExpanded(null)
    setConfirmId(null)
    if (prefs[PREF_KEY[category]] === id) setPrefs(p => ({ ...p, [PREF_KEY[category]]: null }))
  }

  const toggle = (id: string) => setExpanded(e => e === id ? null : id)

  const TABS = [
    { key: 'assessment'   as Tab, label: 'Assessment',  count: assessments.length },
    { key: 'architecture' as Tab, label: 'Architektur', count: architectures.length },
    { key: 'governance'   as Tab, label: 'Governance',  count: governance.length },
    { key: 'roadmap'      as Tab, label: 'Roadmap',     count: roadmaps.length },
  ]

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setExpanded(null); setConfirmId(null) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Assessment ─────────────────────────────────────────── */}
      {tab === 'assessment' && (
        <div className="space-y-2">
          {assessments.length === 0 && <p className="text-sm text-slate-400 py-12 text-center">Noch kein Assessment abgeschlossen. <Link href="/assessment" className="text-blue-600 hover:underline">Jetzt starten →</Link></p>}
          {assessments.map(a => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggle(a.id)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-700 shrink-0">{ARCHETYPES[a.archetype] ?? a.archetype}</span>
                  <span className="text-xs font-bold text-slate-900 shrink-0">{Number(a.total_score).toFixed(1)}/5.0</span>
                  <span className="text-xs text-slate-400 shrink-0">{fmt(a.created_at)}</span>
                </div>
                <RowActions isPrimary={prefs.primary_assessment_id === a.id} isConfirmDelete={confirmId === a.id}
                  onSetPrimary={e => { e.stopPropagation(); setPrimary('assessment', a.id) }}
                  onConfirm={e => { e.stopPropagation(); setConfirmId(a.id) }}
                  onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                  onDelete={e => { e.stopPropagation(); deleteItem('assessment', a.id) }} />
              </div>
              {expanded === a.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 mb-3">
                    {Object.entries(a.dim_scores ?? {}).map(([dim, score]) => (
                      <div key={dim} className="text-xs flex justify-between">
                        <span className="text-slate-500">{DIM_LABELS[dim] ?? dim}</span>
                        <span className="font-semibold text-slate-800">{Number(score).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/assessment" className="text-xs text-blue-600 hover:underline">Vollständiges Ergebnis ansehen →</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Architektur ────────────────────────────────────────── */}
      {tab === 'architecture' && (
        <div className="space-y-2">
          {architectures.length === 0 && <p className="text-sm text-slate-400 py-12 text-center">Noch keine Architektur gespeichert. <Link href="/architecture" className="text-blue-600 hover:underline">Jetzt erstellen →</Link></p>}
          {architectures.map(a => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggle(a.id)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-700 truncate">{a.title}</span>
                  <span className="text-xs text-slate-400 shrink-0">{fmt(a.updated_at)}</span>
                </div>
                <RowActions isPrimary={prefs.primary_architecture_id === a.id} isConfirmDelete={confirmId === a.id}
                  onSetPrimary={e => { e.stopPropagation(); setPrimary('architecture', a.id) }}
                  onConfirm={e => { e.stopPropagation(); setConfirmId(a.id) }}
                  onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                  onDelete={e => { e.stopPropagation(); deleteItem('architecture', a.id) }} />
              </div>
              {expanded === a.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <p className="text-xs text-slate-500">{Object.keys(a.wizard_data ?? {}).length} Konfigurationsfelder gespeichert</p>
                  <Link href="/architecture" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Im Generator öffnen →</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Governance ─────────────────────────────────────────── */}
      {tab === 'governance' && (
        <div className="space-y-2">
          {governance.length === 0 && <p className="text-sm text-slate-400 py-12 text-center">Noch kein Governance-Check gespeichert. <Link href="/governance" className="text-blue-600 hover:underline">Jetzt prüfen →</Link></p>}
          {governance.map(g => {
            const v = VERDICTS[g.result] ?? { label: g.result, color: 'text-slate-700 bg-slate-50 border-slate-200' }
            return (
              <div key={g.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggle(g.id)}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${v.color}`}>{v.label}</span>
                    <span className="text-xs text-slate-600 truncate">{g.use_case_name ?? '—'}</span>
                    <span className="text-xs text-slate-400 shrink-0">{fmt(g.created_at)}</span>
                  </div>
                  <RowActions isPrimary={prefs.primary_governance_id === g.id} isConfirmDelete={confirmId === g.id}
                    onSetPrimary={e => { e.stopPropagation(); setPrimary('governance', g.id) }}
                    onConfirm={e => { e.stopPropagation(); setConfirmId(g.id) }}
                    onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                    onDelete={e => { e.stopPropagation(); deleteItem('governance', g.id) }} />
                </div>
                {expanded === g.id && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-1">
                    <p className="text-xs text-slate-600">Use Case: <strong>{g.use_case_name ?? '—'}</strong></p>
                    <p className="text-xs text-slate-600">Ergebnis: <span className={`font-semibold ${v.color.split(' ')[0]}`}>{v.label}</span></p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Roadmap ────────────────────────────────────────────── */}
      {tab === 'roadmap' && (
        <div className="space-y-2">
          {roadmaps.length === 0 && <p className="text-sm text-slate-400 py-12 text-center">Noch keine Roadmap gespeichert. <Link href="/roadmap" className="text-blue-600 hover:underline">Jetzt erstellen →</Link></p>}
          {roadmaps.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggle(r.id)}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm font-medium text-slate-700 truncate">{r.title}</span>
                  <span className="text-xs text-slate-500 shrink-0">{ARCHETYPES[r.archetype] ?? r.archetype}</span>
                  <span className="text-xs text-slate-400 shrink-0">{fmt(r.updated_at)}</span>
                </div>
                <RowActions isPrimary={prefs.primary_roadmap_id === r.id} isConfirmDelete={confirmId === r.id}
                  onSetPrimary={e => { e.stopPropagation(); setPrimary('roadmap', r.id) }}
                  onConfirm={e => { e.stopPropagation(); setConfirmId(r.id) }}
                  onCancel={e => { e.stopPropagation(); setConfirmId(null) }}
                  onDelete={e => { e.stopPropagation(); deleteItem('roadmap', r.id) }} />
              </div>
              {expanded === r.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <p className="text-xs text-slate-500">{Array.isArray(r.phases) ? r.phases.length : 0} Phasen</p>
                  <Link href="/roadmap" className="text-xs text-blue-600 hover:underline mt-1 inline-block">In Roadmap öffnen →</Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs text-blue-700">
          <strong>★ Primär</strong> — Das als primär markierte Ergebnis wird im Architektur-Generator als Kontext verwendet.
          So lassen sich mit verschiedenen Assessments oder Governance-Prüfungen unterschiedliche Architekturen entwickeln.
        </p>
      </div>
    </div>
  )
}
