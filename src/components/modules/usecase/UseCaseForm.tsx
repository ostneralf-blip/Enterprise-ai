'use client'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CRITERIA, DOMAINS, calcWeightedScore, deriveQuadrant, QUADRANT_META } from '@/config/usecase-data'
import { pick } from '@/lib/utils/locale-data'
import type { UseCase, UseCaseWeights } from '@/types'

interface UseCaseFormProps {
  weights: UseCaseWeights
  editing?: UseCase | null
  canvases?: { id: string; title: string }[]
  onSave: (data: {
    name: string
    domain: string | null
    description: string | null
    scores: Record<string, number>
    canvas_id: string | null
  }) => Promise<void>
  onCancel: () => void
}

const DEFAULT_SCORES: Record<string, number> = { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 }

export function UseCaseForm({ weights, editing, canvases, onSave, onCancel }: UseCaseFormProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [domain, setDomain] = useState(editing?.domain ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [scores, setScores] = useState<Record<string, number>>(editing?.scores ?? DEFAULT_SCORES)
  const [canvasId, setCanvasId] = useState<string>(editing?.canvas_id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const locale = useLocale()
  const t = useTranslations('modules.usecase')
  const preview = calcWeightedScore(scores, weights)
  const quadrant = deriveQuadrant(scores)
  const qMeta = QUADRANT_META[quadrant]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError(t('nameRequired')); return }
    setSaving(true)
    setError('')
    try {
      await onSave({ name: name.trim(), domain: domain || null, description: description || null, scores, canvas_id: canvasId || null })
    } catch {
      setError(t('saveError'))
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4">
      <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
        {editing ? t('editUseCase') : t('newUseCase')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required placeholder={t('namePlaceholder')}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-primary-ring transition-colors" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="uc-domain" className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{t('domainLabel')}</label>
            <select id="uc-domain" value={domain} onChange={e => setDomain(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-ring transition-colors bg-white">
              <option value="">{t('noDomain')}</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">{t('descriptionLabel')}</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder={t('optional')}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-ring transition-colors" />
          </div>
        </div>

        {canvases && canvases.length > 0 && (
          <div>
            <label htmlFor="uc-canvas" className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              {t('linkCanvas')} <span className="normal-case text-slate-400">{t('optional')}</span>
            </label>
            <select
              id="uc-canvas"
              value={canvasId}
              onChange={e => setCanvasId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-primary-ring transition-colors bg-white"
            >
              <option value="">{t('noCanvasLinked')}</option>
              {canvases.map(c => (
                <option key={c.id} value={c.id}>{c.title || t('unnamedCanvas')}</option>
              ))}
            </select>
            {canvasId && (
              <p className="text-[11px] text-primary mt-1">
                {t('canvasHint')}
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">{t('ratingLabel')}</label>
          <div className="space-y-4" role="group" aria-label="Kriterien bewerten">
            {CRITERIA.map(c => (
              <div key={c.id} className="space-y-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium text-slate-700">{pick(c.label, locale)}</span>
                  <span className="text-xs text-slate-400">— {pick(c.description, locale)}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex gap-1.5 flex-1" role="group" aria-label={pick(c.label, locale)}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <button key={v} type="button" onClick={() => setScores(s => ({ ...s, [c.id]: v }))}
                        aria-pressed={scores[c.id] === v}
                        aria-label={`${pick(c.label, locale)}: ${v}`}
                        className={`flex-1 h-8 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-ring ${
                          scores[c.id] === v ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 leading-tight px-0.5">
                  <span className="max-w-[45%]">{pick(c.lowLabel, locale)}</span>
                  <span className="max-w-[45%] text-right">{pick(c.highLabel, locale)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm ${
          qMeta.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
          qMeta.color === 'blue'    ? 'bg-primary-soft border-primary-border' :
          qMeta.color === 'amber'   ? 'bg-amber-50 border-amber-200' :
          'bg-slate-50 border-slate-200'
        }`}>
          <span>{qMeta.icon}</span>
          <span className="font-medium">{preview.toFixed(2)} / 5</span>
          <span className="text-slate-500">— {pick(qMeta.label, locale)}: {pick(qMeta.desc, locale)}</span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap">
            {t('cancel')}
          </button>
          <button type="submit" disabled={saving}
            className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary disabled:opacity-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2">
            {saving ? t('saving') : editing ? t('update') : t('addUseCase')}
          </button>
        </div>
      </form>
    </div>
  )
}
