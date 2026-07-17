'use client'
import { cn } from '@/lib/utils'

interface AiDraftBannerProps {
  age: string
  onKeep: () => void
  onDiscard: () => void
  className?: string
}

export function AiDraftBanner({ age, onKeep, onDiscard, className }: AiDraftBannerProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl bg-warning-subtle border border-warning-border text-warning-text text-sm', className)}>
      <span className="flex-1 min-w-0">
        Wiederhergestellte KI-Analyse ({age})
      </span>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onKeep}
          className="px-3 py-1 text-xs font-medium rounded-lg bg-warning-border hover:opacity-80 transition-opacity"
        >
          Behalten
        </button>
        <button
          onClick={onDiscard}
          className="px-3 py-1 text-xs font-medium rounded-lg border border-warning-border hover:bg-warning-border transition-colors"
        >
          Verwerfen
        </button>
      </div>
    </div>
  )
}
