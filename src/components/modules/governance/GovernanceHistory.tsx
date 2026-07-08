'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/utils/locale-data'
import { GOVERNANCE_GATES } from '@/config/governance-data'

export type GovernanceSession = {
  id: string
  use_case_name: string | null
  answers: Record<string, string>
  result: 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve'
  created_at: string
}

const RESULT_META = {
  approve:    { label: 'Freigegeben',   color: 'bg-emerald-100 text-emerald-700' },
  improve:    { label: 'Auflagen',      color: 'bg-amber-100 text-amber-700'    },
  stop_risk:  { label: 'Stop (Risiko)', color: 'bg-red-100 text-red-700'        },
  stop_dsgvo: { label: 'Stop (DSGVO)', color: 'bg-red-100 text-red-700'         },
} as const

const WEIGHT_DOT: Record<string, string> = {
  red: 'bg-red-500', yellow: 'bg-amber-400', green: 'bg-emerald-500',
}

function resolveGate(gateId: string, optionId: string, locale: string) {
  const gate = GOVERNANCE_GATES.find(g => g.id === gateId)
  const option = gate?.options.find(o => o.id === optionId)
  return {
    shortQuestion: gate ? pick(gate.question, locale).split('?')[0] : gateId,
    optionLabel: option ? pick(option.label, locale) : optionId,
    weight: option?.weight ?? 'yellow' as const,
  }
}

function ScenarioCompare({ a, b, onBack }: { a: GovernanceSession; b: GovernanceSession; onBack: () => void }) {
  const locale = useLocale()
  return (
    <div>
      <button onClick={onBack} className="text-xs text-primary mb-4 hover:underline">← Zurück zum Verlauf</button>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Scenario-Vergleich</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[a, b].map(s => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-3">
            <p className="text-xs font-medium text-slate-900 truncate">{s.use_case_name ?? 'Ohne Name'}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(s.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-md mt-1 inline-block', RESULT_META[s.result].color)}>
              {RESULT_META[s.result].label}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-slate-50 border-b border-slate-100">
          <div className="p-2.5 text-xs font-medium text-slate-500">Gate</div>
          <div className="p-2.5 text-xs font-medium text-slate-500 truncate border-l border-slate-100">{a.use_case_name ?? 'Session 1'}</div>
          <div className="p-2.5 text-xs font-medium text-slate-500 truncate border-l border-slate-100">{b.use_case_name ?? 'Session 2'}</div>
        </div>
        {GOVERNANCE_GATES.map(gate => {
          const aR = resolveGate(gate.id, a.answers[gate.id] ?? '', locale)
          const bR = resolveGate(gate.id, b.answers[gate.id] ?? '', locale)
          const differs = a.answers[gate.id] !== b.answers[gate.id]
          return (
            <div key={gate.id} className={cn('grid grid-cols-[1.2fr_1fr_1fr] border-t border-slate-100', differs && 'bg-amber-50')}>
              <div className="p-2.5 text-xs text-slate-500">{aR.shortQuestion}</div>
              <div className="p-2.5 border-l border-slate-100 flex items-start gap-1.5">
                <span className={cn('mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full', WEIGHT_DOT[aR.weight])} />
                <span className="text-xs text-slate-700">{aR.optionLabel || '—'}</span>
              </div>
              <div className="p-2.5 border-l border-slate-100 flex items-start gap-1.5">
                <span className={cn('mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full', WEIGHT_DOT[bR.weight])} />
                <span className="text-xs text-slate-700">{bR.optionLabel || '—'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GovernanceHistory({ sessions }: { sessions: GovernanceSession[] }) {
  const locale = useLocale()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)

  if (sessions.length === 0) return null

  const toggleSelect = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev
    )
    setComparing(false)
  }

  const compareSessions = sessions.filter(s => compareIds.includes(s.id))

  if (comparing && compareSessions.length === 2) {
    return (
      <div className="mt-8">
        <ScenarioCompare a={compareSessions[0]} b={compareSessions[1]} onBack={() => setComparing(false)} />
      </div>
    )
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Letzte Prüfungen</h3>
        {compareIds.length === 2 ? (
          <button onClick={() => setComparing(true)}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary transition-colors">
            Vergleichen
          </button>
        ) : compareIds.length === 1 ? (
          <p className="text-xs text-slate-400">Noch 1 für Vergleich auswählen</p>
        ) : (
          <p className="text-xs text-slate-400">2 Prüfungen auswählen zum Vergleichen</p>
        )}
      </div>
      <div className="space-y-2">
        {sessions.map(s => {
          const isExpanded = expanded === s.id
          const isSelected = compareIds.includes(s.id)
          const meta = RESULT_META[s.result]
          return (
            <div key={s.id} className={cn('bg-white border rounded-xl transition-colors', isSelected ? 'border-primary-border' : 'border-slate-200')}>
              <div className="flex items-center gap-3 p-3">
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.id)}
                  disabled={!isSelected && compareIds.length >= 2}
                  className="accent-blue-600 flex-shrink-0"
                  aria-label={`${s.use_case_name ?? 'Prüfung'} für Vergleich auswählen`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{s.use_case_name ?? 'Ohne Use-Case-Name'}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(s.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full flex-shrink-0', meta.color)}>{meta.label}</span>
                <button onClick={() => setExpanded(isExpanded ? null : s.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex-shrink-0 px-1 focus:outline-none"
                  aria-expanded={isExpanded} aria-label={isExpanded ? 'Einklappen' : 'Details anzeigen'}>
                  {isExpanded ? '▲' : '▼'}
                </button>
              </div>
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-slate-100 pt-3">
                  <ul className="space-y-2" role="list">
                    {GOVERNANCE_GATES.map(gate => {
                      const optionId = s.answers[gate.id]
                      if (!optionId) return null
                      const { shortQuestion, optionLabel, weight } = resolveGate(gate.id, optionId, locale)
                      return (
                        <li key={gate.id} className="flex items-start gap-2">
                          <span className={cn('mt-1.5 flex-shrink-0 w-2 h-2 rounded-full', WEIGHT_DOT[weight])} aria-hidden="true" />
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500">{shortQuestion}</p>
                            <p className="text-sm text-slate-800">{optionLabel}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
