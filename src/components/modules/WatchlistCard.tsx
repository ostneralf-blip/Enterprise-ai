'use client'
import { useState } from 'react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/utils/locale-data'
import type { WatchlistItem, WatchlistStatus } from '@/config/compliance-data'

const STATUS_CONFIG: Record<WatchlistStatus, { label: string; className: string }> = {
  in_gesetzgebung: { label: 'In Gesetzgebung',             className: 'bg-amber-100 text-amber-700 border-amber-200' },
  angekuendigt:    { label: 'Angekündigt',                  className: 'bg-slate-100 text-slate-600 border-slate-200' },
  final:           { label: 'Final — Übernahme ausstehend', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export function computeCountdown(deadline: string, today = new Date()): { label: string; className: string } {
  const target = new Date(deadline)
  const diffMs = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: '⏱ Stichtag überschritten', className: 'bg-red-100 text-red-700 border-red-200' }
  }
  const months = Math.floor(diffDays / 30)
  if (months === 0) {
    return { label: `⏱ noch ${diffDays} Tag${diffDays === 1 ? '' : 'e'}`, className: 'bg-red-100 text-red-700 border-red-200' }
  }
  if (months < 3) {
    return { label: `⏱ noch ${months} Monat${months === 1 ? '' : 'e'}`, className: 'bg-red-100 text-red-700 border-red-200' }
  }
  if (months < 12) {
    return { label: `⏱ noch ${months} Monate`, className: 'bg-amber-100 text-amber-700 border-amber-200' }
  }
  return { label: `⏱ noch ${months} Monate`, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
}

export function WatchlistCard({ item }: { item: WatchlistItem }) {
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const status = STATUS_CONFIG[item.status]
  const countdown = item.deadline ? computeCountdown(item.deadline) : null

  return (
    <div className="bg-white border border-amber-100 rounded-lg p-4 sm:p-6 space-y-2">
      <div className="flex flex-wrap items-start gap-2 min-w-0">
        <span className={cn('px-2 py-0.5 text-xs font-medium border rounded-full flex-shrink-0', status.className)}>
          {status.label}
        </span>
        {countdown && (
          <span className={cn('px-2 py-0.5 text-xs font-medium border rounded-full flex-shrink-0', countdown.className)}>
            {countdown.label}
          </span>
        )}
        <p className="text-sm font-medium text-slate-800 min-w-0">{pick(item.title, locale)}</p>
      </div>
      <p className="text-xs text-slate-600">{pick(item.summary, locale)}</p>
      <div>
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="text-xs text-amber-700 cursor-pointer hover:text-amber-900 text-left"
        >
          {open ? '▲ Auswirkungen verbergen' : '▼ Mögliche Auswirkungen anzeigen'}
        </button>
        {open && (
          <p className="text-xs text-slate-500 mt-1.5 pl-2 border-l-2 border-amber-200">
            {pick(item.potentialImpact, locale)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <span>Zuletzt geprüft: {item.lastChecked}</span>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          aria-label="Quelle öffnen"
        >
          Quelle ↗
        </a>
      </div>
    </div>
  )
}
