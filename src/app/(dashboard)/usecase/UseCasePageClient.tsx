'use client'
import { useState } from 'react'
import { UseCaseTable } from '@/components/modules/usecase/UseCaseTable'
import { UseCaseMatrix } from '@/components/modules/usecase/UseCaseMatrix'
import { UseCaseForm } from '@/components/modules/usecase/UseCaseForm'
import { WeightsEditor } from '@/components/modules/usecase/WeightsEditor'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { FREE_LIMIT } from '@/config/usecase-data'
import type { UseCase, UseCasePortfolio, UseCaseWeights, Tier } from '@/types'

interface Props {
  initialPortfolio: UseCasePortfolio
  initialCases: UseCase[]
  tier: Tier
}

type Tab = 'portfolio' | 'matrix'

export function UseCasePageClient({ initialPortfolio, initialCases, tier }: Props) {
  const [useCases, setUseCases] = useState<UseCase[]>(initialCases)
  const [weights, setWeights] = useState<UseCaseWeights>(initialPortfolio.weights)
  const [tab, setTab] = useState<Tab>('portfolio')
  const [showForm, setShowForm] = useState(false)
  const [showWeights, setShowWeights] = useState(false)
  const [editingCase, setEditingCase] = useState<UseCase | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const atFreeLimit = tier === 'free' && useCases.length >= FREE_LIMIT

  const handleAddClick = () => {
    if (atFreeLimit) { setShowUpgrade(true); return }
    setEditingCase(null)
    setShowForm(true)
  }

  const handleSaveCase = async (data: { name: string; domain: string | null; description: string | null; scores: Record<string, number> }) => {
    if (editingCase) {
      const res = await fetch(`/api/usecase/${editingCase.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const json = await res.json()
      if (json.data) setUseCases(prev => prev.map(c => c.id === editingCase.id ? json.data : c).sort((a, b) => b.weighted_score - a.weighted_score))
    } else {
      const res = await fetch('/api/usecase', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.status === 403) { setShowUpgrade(true); setShowForm(false); return }
      const json = await res.json()
      if (json.data) setUseCases(prev => [...prev, json.data].sort((a, b) => b.weighted_score - a.weighted_score))
    }
    setShowForm(false)
    setEditingCase(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Use Case löschen?')) return
    await fetch(`/api/usecase/${id}`, { method: 'DELETE' })
    setUseCases(prev => prev.filter(c => c.id !== id))
  }

  const handleSaveWeights = async (w: UseCaseWeights) => {
    await fetch('/api/usecase/weights', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(w) })
    setWeights(w)
    const res = await fetch('/api/usecase')
    const json = await res.json()
    if (json.use_cases) setUseCases(json.use_cases)
  }

  const tabClass = (t: Tab) => `px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
    tab === t ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'
  }`

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
          <button onClick={() => setTab('portfolio')} className={tabClass('portfolio')}>Portfolio</button>
          <button onClick={() => setTab('matrix')} className={tabClass('matrix')}>Matrix</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowWeights(v => !v); setShowForm(false) }}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            ⚙️ Gewichte
          </button>
          <button onClick={handleAddClick}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            + Use Case
          </button>
        </div>
      </div>

      {tier === 'free' && (
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <span>{useCases.length} / {FREE_LIMIT} Use Cases (Free)</span>
          {atFreeLimit && <span className="text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => setShowUpgrade(true)}>Upgrade für mehr →</span>}
        </div>
      )}

      {showWeights && (
        <WeightsEditor weights={weights} onSave={handleSaveWeights} onClose={() => setShowWeights(false)} />
      )}

      {(showForm || editingCase) && (
        <UseCaseForm weights={weights} editing={editingCase}
          onSave={handleSaveCase}
          onCancel={() => { setShowForm(false); setEditingCase(null) }} />
      )}

      {tab === 'portfolio' && (
        <UseCaseTable useCases={useCases}
          onEdit={uc => { setEditingCase(uc); setShowForm(true); setShowWeights(false) }}
          onDelete={handleDelete} />
      )}
      {tab === 'matrix' && <UseCaseMatrix useCases={useCases} />}

      {showUpgrade && <UpgradeModal feature="Use-Case Scoring (mehr als 3 Use Cases)" onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
