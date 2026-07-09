'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { UseCaseTable } from '@/components/modules/usecase/UseCaseTable'
import { UseCaseMatrix } from '@/components/modules/usecase/UseCaseMatrix'
import { UseCaseForm } from '@/components/modules/usecase/UseCaseForm'
import { WeightsEditor } from '@/components/modules/usecase/WeightsEditor'
import { UpgradeModal } from '@/components/shared/UpgradeModal'
import { InfoHint } from '@/components/shared/InfoHint'
import { ComplianceContextBanner } from '@/components/shared/ComplianceContextBanner'
import { FREE_LIMIT } from '@/config/usecase-data'
import type { UseCase, UseCasePortfolio, UseCaseWeights, Tier } from '@/types'

interface Props {
  initialPortfolio: UseCasePortfolio
  initialCases: UseCase[]
  tier: Tier
  canvases: { id: string; title: string }[]
  complianceRisk?: string | null
}

type Tab = 'portfolio' | 'matrix'

export function UseCasePageClient({ initialPortfolio, initialCases, tier, canvases, complianceRisk }: Props) {
  const locale = useLocale()
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

  const handleSaveCase = async (data: { name: string; domain: string | null; description: string | null; scores: Record<string, number>; canvas_id: string | null }) => {
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
      <ComplianceContextBanner riskClass={complianceRisk} />
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
            <button onClick={() => setTab('portfolio')} className={tabClass('portfolio')}>Portfolio</button>
            <button onClick={() => setTab('matrix')} className={tabClass('matrix')}>Matrix</button>
          </div>
          {tab === 'matrix' && (
            <InfoHint title="Was zeigt die Scoring-Matrix?">
              <p>Die Matrix positioniert Ihre Use Cases in einem Quadranten nach zwei gewichteten Dimensionen:</p>
              <p className="mt-1.5"><strong>X-Achse (Aufwand/Risiko):</strong> Wie hoch ist der Implementierungsaufwand und das Risiko?</p>
              <p className="mt-1"><strong>Y-Achse (Nutzen/Wirkung):</strong> Wie groß ist der erwartete Mehrwert für das Unternehmen?</p>
              <p className="mt-1.5">Use Cases oben links (hoher Nutzen, geringer Aufwand) sind die besten Startprojekte — &bdquo;Quick Wins&ldquo;.</p>
            </InfoHint>
          )}
        </div>
        <div className="flex items-center gap-2">
          <InfoHint title="Was sind Bewertungsgewichte?">
            <p>Jeder Use Case wird nach mehreren Kriterien bewertet (z. B. strategischer Fit, Datenverfügbarkeit, Compliance-Risiko).</p>
            <p className="mt-1.5">Mit den <strong>Gewichten</strong> legen Sie fest, welche Kriterien für Ihr Unternehmen am wichtigsten sind. Das beeinflusst die Reihenfolge im Portfolio.</p>
          </InfoHint>
          <button onClick={() => { setShowWeights(v => !v); setShowForm(false) }}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            ⚙️ Gewichte
          </button>
          <button onClick={handleAddClick}
            className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2">
            + Use Case
          </button>
        </div>
      </div>

      {tier === 'free' && (
        <div className="flex items-center gap-2 mb-4 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <span>{useCases.length} / {FREE_LIMIT} Use Cases (Free)</span>
          {atFreeLimit && <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => setShowUpgrade(true)}>Upgrade für mehr →</span>}
        </div>
      )}

      {showWeights && (
        <WeightsEditor weights={weights} onSave={handleSaveWeights} onClose={() => setShowWeights(false)} />
      )}

      {(showForm || editingCase) && (
        <UseCaseForm weights={weights} editing={editingCase} canvases={canvases}
          onSave={handleSaveCase}
          onCancel={() => { setShowForm(false); setEditingCase(null) }} />
      )}

      {tab === 'portfolio' && (
        <UseCaseTable useCases={useCases}
          onEdit={uc => { setEditingCase(uc); setShowForm(true); setShowWeights(false) }}
          onDelete={handleDelete}
          canvases={canvases} />
      )}
      {tab === 'matrix' && <UseCaseMatrix useCases={useCases} />}

      {/* Aktions-Leiste — konsistent unten wie alle anderen Module */}
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-200">
        <a
          href={tier !== 'free' ? `/api/export/pdf?module=usecase&locale=${locale}` : '/upgrade'}
          {...(tier !== 'free' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 inline-flex items-center gap-1.5"
        >
          PDF exportieren{tier === 'free' && <span className="text-xs opacity-60">· Pro</span>}
        </a>
      </div>

      {showUpgrade && <UpgradeModal feature="Use-Case Scoring (mehr als 3 Use Cases)" onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
