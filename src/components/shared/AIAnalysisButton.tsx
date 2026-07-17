'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface UsageStatus {
  remaining: number
  used: number
  limit: number
  exceeded: boolean
}

interface AIAnalysisButtonProps {
  tier: string
  onAnalyze: () => Promise<void>
  usage?: UsageStatus | null
  className?: string
  size?: 'sm' | 'md'
}

const SPARKLE = (
  <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
    <path d="M8 0l1.5 5.5L15 7l-5.5 1.5L8 14l-1.5-5.5L1 7l5.5-1.5z"/>
  </svg>
)

export function AIAnalysisButton({ tier, onAnalyze, usage, className, size = 'md' }: AIAnalysisButtonProps) {
  const t = useTranslations('ai')
  const [loading, setLoading] = useState(false)

  const isPro = tier === 'pro' || tier === 'enterprise'
  const exceeded = usage?.exceeded ?? false

  if (!isPro) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-ink-subtle', className)}>
        {SPARKLE}
        <span>{t('proRequired')}</span>
      </div>
    )
  }

  const handleClick = async () => {
    if (loading || exceeded) return
    setLoading(true)
    try {
      await onAnalyze()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('space-y-1', className)}>
      <button
        onClick={handleClick}
        disabled={loading || exceeded}
        className={cn(
          'flex items-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1',
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs sm:text-sm',
          exceeded || loading
            ? 'bg-surface-input text-ink-subtle cursor-not-allowed'
            : 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100',
        )}
      >
        {SPARKLE}
        {loading ? t('analyzing') : t('analyzeButton')}
      </button>
      {usage && (
        <p className={cn('text-[11px]', exceeded ? 'text-warning-text' : 'text-ink-subtle')}>
          {exceeded
            ? t('usageExceeded', { used: usage.used, limit: usage.limit })
            : t('usageRemaining', { remaining: usage.remaining, limit: usage.limit })}
        </p>
      )}
    </div>
  )
}

interface AIBadgeProps {
  generatedAt?: string | null
  className?: string
}

export function AIBadge({ generatedAt, className }: AIBadgeProps) {
  const t = useTranslations('ai')
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-200', className)}>
      {SPARKLE}
      {generatedAt ? t('badgeGenerated') : t('badge')}
    </span>
  )
}
