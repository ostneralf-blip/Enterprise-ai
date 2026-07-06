'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { track } from '@/lib/posthog/client'
import type { GuidanceEntry, GuidanceCategory } from './GuidanceCard'

const CAT: Record<GuidanceCategory, { label: string; icon: string; pill: string; bar: string }> = {
  definition:      { label: 'Definition',      icon: '▪',  pill: 'text-blue-700 bg-blue-50 border-blue-200',    bar: 'bg-blue-500' },
  best_practice:   { label: 'Best Practice',   icon: '✓',  pill: 'text-emerald-700 bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' },
  anti_pattern:    { label: 'Anti-Pattern',    icon: '⚠',  pill: 'text-amber-700 bg-amber-50 border-amber-200',  bar: 'bg-amber-500' },
  policy_template: { label: 'Policy-Template', icon: '📋', pill: 'text-indigo-700 bg-indigo-50 border-indigo-200', bar: 'bg-indigo-500' },
  checkliste:      { label: 'Checkliste',      icon: '☑',  pill: 'text-teal-700 bg-teal-50 border-teal-200',    bar: 'bg-teal-500' },
  hinweis:         { label: 'Hinweis',         icon: '▶',  pill: 'text-slate-700 bg-slate-50 border-slate-200',  bar: 'bg-slate-400' },
}

interface Props {
  entries: GuidanceEntry[]
  module: string
}

export function GuidanceDrawer({ entries, module }: Props) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  function handleOpen() {
    setOpen(true)
    track('guidance_viewed', { module, context_key: entries[0]?.context_key ?? null, category: 'panel_open' as GuidanceCategory, id: 'drawer' })
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors whitespace-nowrap"
      >
        <span aria-hidden="true">💡</span>
        <span>Wissensbasis</span>
        <span className="ml-0.5 bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
          {entries.length}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Wissensbasis">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 transition-opacity"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-80 sm:w-96 h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <p className="text-sm font-semibold text-slate-900">Wissensbasis</p>
                <p className="text-xs text-slate-500 mt-0.5">{entries.length} Einträge für dieses Modul</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none p-1 rounded hover:bg-slate-100 transition-colors"
                aria-label="Schließen"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {entries.map(entry => {
                const cfg = CAT[entry.category]
                const isOpen = expanded === entry.id
                return (
                  <div key={entry.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        const opening = expanded !== entry.id
                        setExpanded(opening ? entry.id : null)
                        if (opening) track('guidance_viewed', { id: entry.id, module, context_key: entry.context_key, category: entry.category })
                      }}
                      aria-expanded={isOpen}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 transition-colors min-h-[44px]"
                    >
                      <span className={cn('w-1 self-stretch rounded-full shrink-0', cfg.bar)} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-none mb-0.5">
                          {cfg.label}
                        </p>
                        <p className="text-sm text-slate-800 font-medium leading-snug">{entry.title}</p>
                      </div>
                      <span
                        aria-hidden="true"
                        className={cn('text-slate-400 text-xs shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
                      >▾</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
