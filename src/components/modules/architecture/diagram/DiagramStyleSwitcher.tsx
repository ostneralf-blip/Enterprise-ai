'use client'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { PERSONA_PRESETS } from '@/config/diagram-styles'
import { cn } from '@/lib/utils'

export function DiagramStyleSwitcher({ activePreset, onChange }:
  { activePreset: string; onChange: (key: string) => void }) {
  const t = useTranslations('diagram')
  const locale = useLocale()
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('styleLabel')}>
      {Object.values(PERSONA_PRESETS).map(p => (
        <button key={p.key} type="button" onClick={() => onChange(p.key)} aria-pressed={activePreset === p.key}
          className={cn('text-xs font-medium px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap',
            activePreset === p.key ? 'bg-primary text-white border-primary' : 'bg-surface text-ink-secondary border-line hover:border-line-strong')}>
          {pick(p.label, locale)}
        </button>
      ))}
    </div>
  )
}
