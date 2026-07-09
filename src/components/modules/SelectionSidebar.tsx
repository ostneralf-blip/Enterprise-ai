'use client'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { CatalogComponent } from '@/types'
import type { Conflict, Suggestion } from '@/lib/utils/catalog-compatibility'

interface Props {
  checked: Set<string>
  byName: Record<string, CatalogComponent>
  conflicts: Conflict[]
  suggestions: Suggestion[]
  onAddComponent: (name: string) => void
  onRemoveComponent: (name: string) => void
}

export function SelectionSidebar({
  checked,
  byName,
  conflicts,
  suggestions,
  onAddComponent,
  onRemoveComponent,
}: Props) {
  const t = useTranslations('modules.selectionSidebar')
  const checkedList = Array.from(checked)

  return (
    <aside
      aria-label={t('title')}
      className={cn(
        'flex flex-col gap-3 p-3 bg-slate-50 border-l border-slate-200',
        'min-w-[160px] overflow-y-auto'
      )}
    >
      <p className="text-xs font-bold text-slate-800">{t('title')}</p>
      <p className="text-xs text-primary font-medium">
        {t('selectedCount', { count: checkedList.length })}
      </p>

      {/* Konflikte */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 space-y-2">
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">
            {t('conflicts', { count: conflicts.length })}
          </p>
          {conflicts.map((c, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] text-red-800 font-medium">
                {c.a} ✗ {c.b}
              </p>
              {c.alternatives.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-1.5">
                  <p className="text-[9px] text-emerald-700 font-medium mb-1">{t('alternativeLabel')}</p>
                  {c.alternatives.map(alt => (
                    <button
                      key={alt}
                      onClick={() => onAddComponent(alt)}
                      disabled={checked.has(alt)}
                      className={cn(
                        'block text-[10px] text-emerald-700 hover:underline',
                        checked.has(alt) && 'text-slate-400 no-underline'
                      )}
                    >
                      {checked.has(alt) ? `✓ ${alt}` : `+ ${alt}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vorschläge */}
      {suggestions.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 space-y-1.5">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
            {t('suggestions', { count: suggestions.length })}
          </p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-1">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-emerald-800 truncate">{s.target}</p>
                <p className="text-[9px] text-slate-400 truncate">{t('fromSource', { source: s.source })}</p>
              </div>
              <button
                onClick={() => onAddComponent(s.target)}
                className="flex-shrink-0 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium hover:bg-emerald-500"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Auswahl-Liste */}
      {checkedList.length > 0 && (
        <div className="border-t border-slate-200 pt-2 space-y-1">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
            {t('selectedLabel')}
          </p>
          {checkedList.map(name => {
            const comp = byName[name]
            return (
              <div key={name} className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-800 truncate">{name}</p>
                  {comp?.vendor && (
                    <p className="text-[9px] text-slate-400 truncate">{comp.vendor}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveComponent(name)}
                  aria-label={t('deselectAriaLabel', { name })}
                  className="flex-shrink-0 text-slate-300 hover:text-red-500 text-sm leading-none"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
