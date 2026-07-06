'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/posthog/client'

export type GuidanceCategory = 'definition' | 'best_practice' | 'anti_pattern' | 'policy_template' | 'checkliste' | 'hinweis'

export interface GuidanceEntry {
  id: string
  title: string
  content: string
  category: GuidanceCategory
  source: string | null
  context_key: string | null
  min_tier: string
}

interface Props extends GuidanceEntry {
  module: string
}

const CATEGORY_CONFIG: Record<GuidanceCategory, { label: string; icon: string; color: string }> = {
  definition:      { label: 'Definition',      icon: '■', color: 'text-primary-hover bg-primary-soft border-primary-border' },
  best_practice:   { label: 'Best Practice',   icon: '✓', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  anti_pattern:    { label: 'Anti-Pattern',    icon: '⚠', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  policy_template: { label: 'Policy-Template', icon: '📋', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  checkliste:      { label: 'Checkliste',      icon: '☑', color: 'text-teal-700 bg-teal-50 border-teal-200' },
  hinweis:         { label: 'Hinweis',         icon: '▶', color: 'text-slate-700 bg-slate-50 border-slate-200' },
}

export function GuidanceCard({ id, title, content, category, source, context_key, module }: Props) {
  const [open, setOpen] = useState(false)
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.hinweis

  function handleToggle() {
    if (!open) track('guidance_viewed', { id, module, context_key, category })
    setOpen(o => !o)
  }

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors min-h-[44px]"
      >
        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap', cfg.color)}>
          <span aria-hidden="true">{cfg.icon}</span>{' '}{cfg.label}
        </span>
        <span className="text-sm font-medium text-slate-800 min-w-0 truncate flex-1">{title}</span>
        <span
          aria-hidden="true"
          className={cn('text-slate-400 text-xs shrink-0 transition-transform duration-200', open && 'rotate-180')}
        >▾</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</p>
          {source && (
            <p className="text-xs text-slate-400 mt-2 italic">Quelle: {source}</p>
          )}
        </div>
      )}
    </div>
  )
}
