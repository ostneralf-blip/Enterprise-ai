'use client'
import { useState } from 'react'
import { QUADRANT_META } from '@/config/usecase-data'
import type { UseCase } from '@/types'

interface UseCaseTableProps {
  useCases: UseCase[]
  onEdit: (uc: UseCase) => void
  onDelete: (id: string) => void
}

const quadrantBadge = (q: UseCase['quadrant']) => {
  const m = QUADRANT_META[q]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
      m.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
      m.color === 'blue'    ? 'bg-blue-50 text-blue-700 border border-blue-200' :
      m.color === 'amber'   ? 'bg-amber-50 text-amber-700 border border-amber-200' :
      'bg-slate-100 text-slate-600 border border-slate-200'
    }`}>
      {m.icon} {m.label}
    </span>
  )
}

export function UseCaseTable({ useCases, onEdit, onDelete }: UseCaseTableProps) {
  const [search, setSearch] = useState('')

  if (useCases.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="text-4xl mb-3">🎯</div>
        <p className="text-slate-500 text-sm">Noch kein Use Case im Portfolio.</p>
      </div>
    )
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? useCases.filter(uc =>
        uc.name.toLowerCase().includes(q) ||
        (uc.domain ?? '').toLowerCase().includes(q) ||
        (uc.description ?? '').toLowerCase().includes(q)
      )
    : useCases

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {useCases.length > 3 && (
        <div className="px-4 pt-3 pb-2 border-b border-slate-100">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Use Cases suchen…"
            aria-label="Use Cases suchen"
            className="w-full sm:w-64 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden sm:table-cell">Bereich</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">V</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">U</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">D</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">R</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">S</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Score</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Quadrant</th>
              <th className="px-4 py-3 w-16"><span className="sr-only">Aktionen</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-400">
                  Keine Use Cases für „{search}" gefunden.
                </td>
              </tr>
            )}
            {filtered.map(uc => (
              <tr key={uc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900 min-w-0 max-w-[200px] truncate">{uc.name}</div>
                  {uc.description && <div className="text-xs text-slate-400 truncate max-w-[200px]">{uc.description}</div>}
                </td>
                <td className="px-4 py-3 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                  {uc.domain ?? '—'}
                </td>
                {(['value','feasibility','data_readiness','risk','speed'] as const).map(k => (
                  <td key={k} className="px-3 py-3 text-center text-slate-700 hidden md:table-cell">
                    {uc.scores[k] ?? '—'}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                  {uc.weighted_score?.toFixed(2)}
                </td>
                <td className="px-4 py-3">{quadrantBadge(uc.quadrant)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(uc)} aria-label="Bearbeiten"
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">✏️</button>
                    <button onClick={() => onDelete(uc.id)} aria-label="Löschen"
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
