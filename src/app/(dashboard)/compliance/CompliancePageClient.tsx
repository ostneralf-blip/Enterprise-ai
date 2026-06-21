'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  EU_AI_ACT_CLASSES,
  DSGVO_CHECKLIST,
  RISK_QUADRANTS,
  POLICY_TEMPLATES,
} from '@/config/compliance-data'

type Tab = 'euaiact' | 'dsgvo' | 'matrix' | 'templates'

const TABS: { id: Tab; label: string }[] = [
  { id: 'euaiact', label: 'EU AI Act' },
  { id: 'dsgvo', label: 'DSGVO-Checkliste' },
  { id: 'matrix', label: 'Risikomatrix' },
  { id: 'templates', label: 'Policy-Templates' },
]

function loadChecked(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem('compliance_dsgvo')
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch { return new Set() }
}

export function CompliancePageClient() {
  const [tab, setTab] = useState<Tab>('euaiact')
  const [checked, setChecked] = useState<Set<string>>(() => loadChecked())
  const [copied, setCopied] = useState<string | null>(null)

  const toggleChecked = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      try { localStorage.setItem('compliance_dsgvo', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const checkedCount = checked.size
  const total = DSGVO_CHECKLIST.length

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <a
          href="/api/export/pdf?module=compliance"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          PDF exportieren
        </a>
      </div>
      <div role="tablist" aria-label="Compliance-Bereiche" className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'euaiact' && (
        <div role="tabpanel" id="panel-euaiact" aria-labelledby="tab-euaiact" className="space-y-4">
          {EU_AI_ACT_CLASSES.map(cls => (
            <section
              key={cls.id}
              aria-labelledby={`cls-${cls.id}`}
              className={cn('rounded-2xl border p-4 sm:p-5', cls.color.bg, cls.color.border)}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h2 id={`cls-${cls.id}`} className={cn('text-sm font-semibold', cls.color.title)}>{cls.title}</h2>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cls.color.badge)}>{cls.badge}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Beispiele</p>
                  <ul className="space-y-1" role="list">
                    {cls.examples.map((ex, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-1.5 min-w-0">
                        <span aria-hidden="true" className="flex-shrink-0">·</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Pflichten</p>
                  <ul className="space-y-1" role="list">
                    {cls.obligations.map((ob, i) => (
                      <li key={i} className="text-xs text-slate-600 flex gap-1.5 min-w-0">
                        <span aria-hidden="true" className="flex-shrink-0">→</span>
                        <span>{ob}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === 'dsgvo' && (
        <div role="tabpanel" id="panel-dsgvo" aria-labelledby="tab-dsgvo">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">{checkedCount} von {total} erledigt</p>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(checkedCount / total) * 100}%` }}
                role="progressbar"
                aria-valuenow={checkedCount}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label="DSGVO-Checkliste Fortschritt"
              />
            </div>
          </div>
          <ul className="space-y-2" role="list">
            {DSGVO_CHECKLIST.map(item => {
              const isDone = checked.has(item.id)
              return (
                <li key={item.id}>
                  <label className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors',
                    isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'
                  )}>
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleChecked(item.id)}
                      className="mt-0.5 flex-shrink-0 accent-emerald-600"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-600 mb-0.5">{item.article}</p>
                      <p className={cn('text-sm font-medium', isDone ? 'text-emerald-800 line-through' : 'text-slate-800')}>
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {tab === 'matrix' && (
        <div role="tabpanel" id="panel-matrix" aria-labelledby="tab-matrix">
          <p className="text-sm text-slate-500 mb-4">Bewertung nach Auswirkung × Eintrittswahrscheinlichkeit</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {RISK_QUADRANTS.map(q => (
              <section
                key={q.id}
                aria-labelledby={`quadrant-${q.id}`}
                className={cn('rounded-2xl border p-4', q.bg, q.border)}
              >
                <span id={`quadrant-${q.id}`} className={cn('inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2', q.badge)}>
                  {q.label}
                </span>
                <p className="text-xs font-medium text-slate-700 mb-2">{q.action}</p>
                <ul className="space-y-1" role="list">
                  {q.examples.map((ex, i) => (
                    <li key={i} className="text-xs text-slate-500">· {ex}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center">
            Oben = Hohe Wahrscheinlichkeit · Rechts = Hohe Auswirkung
          </p>
        </div>
      )}

      {tab === 'templates' && (
        <div role="tabpanel" id="panel-templates" aria-labelledby="tab-templates" className="space-y-4">
          {POLICY_TEMPLATES.map(tpl => (
            <section
              key={tpl.id}
              aria-labelledby={`tpl-${tpl.id}`}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h2 id={`tpl-${tpl.id}`} className="text-sm font-semibold text-slate-900">{tpl.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{tpl.subtitle}</p>
                </div>
                <button
                  onClick={() => handleCopy(tpl.id, tpl.content)}
                  aria-label={`${tpl.title} in Zwischenablage kopieren`}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  {copied === tpl.id ? '✓ Kopiert' : 'Kopieren'}
                </button>
              </div>
              <pre className="text-xs text-slate-500 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50">
                {tpl.content}
              </pre>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
