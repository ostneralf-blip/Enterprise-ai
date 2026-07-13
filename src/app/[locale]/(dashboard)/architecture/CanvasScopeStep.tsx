'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { Canvas } from '@/types'

const QUADRANT_BADGE: Record<string, { de: string; en: string; cls: string }> = {
  quick_win:      { de: 'Quick Win',     en: 'Quick Win',     cls: 'bg-green-100 text-green-700' },
  strategic_bet:  { de: 'Strategisch',   en: 'Strategic',     cls: 'bg-blue-100 text-blue-700'   },
  low_hanging_fruit: { de: 'Niedrig',    en: 'Low Effort',    cls: 'bg-amber-100 text-amber-700' },
  avoid:          { de: 'Vermeiden',     en: 'Avoid',         cls: 'bg-red-100 text-red-700'     },
}

interface Props {
  initialCanvasId?: string | null
  locale: string
  onConfirm: (canvasIds: string[], canvases: Canvas[]) => void
  onSkip: () => void
}

export function CanvasScopeStep({ initialCanvasId, locale, onConfirm, onSkip }: Props) {
  const t = useTranslations('architecture')
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/canvas')
      .then(r => r.json())
      .then(({ data }: { data: Canvas[] }) => {
        const list = data ?? []
        setCanvases(list)
        // Deep-link: only that canvas pre-selected; otherwise all
        if (initialCanvasId && list.some(c => c.id === initialCanvasId)) {
          setSelected(new Set([initialCanvasId]))
        } else {
          setSelected(new Set(list.map(c => c.id)))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialCanvasId])

  // 0 Canvases → skip straight to wizard
  useEffect(() => {
    if (!loading && canvases.length === 0) onSkip()
  }, [loading, canvases.length, onSkip])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    const chosen = canvases.filter(c => selected.has(c.id))
    onConfirm(Array.from(selected), chosen)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-slate-500">
        {t('canvasScopeLoading')}
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{t('canvasScopeTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('canvasScopeSubtitle')}</p>
      </div>

      {/* Quick-select chips */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelected(new Set(canvases.map(c => c.id)))}
          className="text-xs rounded border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
        >
          {t('canvasScopeSelectAll')}
        </button>
        <button
          onClick={() => setSelected(new Set())}
          className="text-xs rounded border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50"
        >
          {t('canvasScopeNone')}
        </button>
      </div>

      {/* Canvas list */}
      <ul className="space-y-2">
        {canvases.map(c => {
          const isSelected = selected.has(c.id)
          const enrichment = c.ai_enrichment as Record<string, unknown> | null
          const quadrant = enrichment?.suggested_quadrant as string | undefined
          const badge = quadrant ? QUADRANT_BADGE[quadrant] : null
          return (
            <li key={c.id}>
              <button
                onClick={() => toggle(c.id)}
                className={cn(
                  'w-full text-left rounded-lg border p-3 transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                    isSelected ? 'border-primary bg-primary text-white' : 'border-slate-300'
                  )}>
                    {isSelected && <span className="text-[10px] leading-none">✓</span>}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-800 min-w-0">{c.title}</span>
                  {badge && (
                    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-xs font-medium', badge.cls)}>
                      {locale === 'de' ? badge.de : badge.en}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-xs text-slate-400">
                    {new Date(c.updated_at).toLocaleDateString(locale)}
                  </span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-primary-hover whitespace-nowrap"
        >
          {t('canvasScopeContinue')}
          {selected.size > 0 && ` (${selected.size})`}
        </button>
        <button
          onClick={onSkip}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 whitespace-nowrap"
        >
          {t('canvasScopeNone')}
        </button>
      </div>
    </div>
  )
}
