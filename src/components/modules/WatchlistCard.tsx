'use client'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/utils/locale-data'
import type { WatchlistItem, WatchlistStatus } from '@/config/compliance-data'

const STATUS_CLASSES: Record<WatchlistStatus, string> = {
  in_gesetzgebung: 'bg-amber-100 text-amber-700 border-amber-200',
  angekuendigt:    'bg-slate-100 text-slate-600 border-slate-200',
  final:           'bg-emerald-100 text-emerald-700 border-emerald-200',
}

type CountdownInfo = { months: number; days: number; className: string }

export function computeCountdown(deadline: string, today = new Date()): CountdownInfo {
  const target = new Date(deadline)
  const diffMs = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const months = Math.floor(diffDays / 30)
  const className =
    diffDays < 0 || months < 3 ? 'bg-red-100 text-red-700 border-red-200'
    : months < 12               ? 'bg-amber-100 text-amber-700 border-amber-200'
    :                             'bg-emerald-100 text-emerald-700 border-emerald-200'
  return { months, days: diffDays, className }
}

export function WatchlistCard({ item }: { item: WatchlistItem }) {
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const t = useTranslations('modules')
  const statusClass = STATUS_CLASSES[item.status]

  const statusLabel =
    item.status === 'in_gesetzgebung' ? t('compliance.watchlistStatusLegislation') :
    item.status === 'angekuendigt'    ? t('compliance.watchlistStatusAnnounced') :
    t('compliance.watchlistStatusFinal')

  const countdown = item.deadline ? computeCountdown(item.deadline) : null
  const countdownLabel = countdown
    ? countdown.days < 0
      ? t('compliance.watchlistDeadlinePassed')
      : countdown.months === 0
        ? t('compliance.watchlistDeadlineDays', { days: countdown.days })
        : t('compliance.watchlistDeadlineMonths', { months: countdown.months })
    : null

  return (
    <div className="bg-white border border-amber-100 rounded-lg p-4 sm:p-6 space-y-2">
      <div className="flex flex-wrap items-start gap-2 min-w-0">
        <span className={cn('px-2 py-0.5 text-xs font-medium border rounded-full flex-shrink-0', statusClass)}>
          {statusLabel}
        </span>
        {countdown && countdownLabel && (
          <span className={cn('px-2 py-0.5 text-xs font-medium border rounded-full flex-shrink-0', countdown.className)}>
            {countdownLabel}
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
          {open ? t('compliance.watchlistHideImpact') : t('compliance.watchlistShowImpact')}
        </button>
        {open && (
          <p className="text-xs text-slate-500 mt-1.5 pl-2 border-l-2 border-amber-200">
            {pick(item.potentialImpact, locale)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <span>{t('compliance.watchlistLastChecked')} {item.lastChecked}</span>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          aria-label={t('compliance.watchlistSourceAria')}
        >
          {t('compliance.watchlistSource')}
        </a>
      </div>
    </div>
  )
}
