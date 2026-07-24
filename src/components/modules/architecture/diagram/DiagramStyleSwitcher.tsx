'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { PERSONA_PRESETS, type DiagramStyle, type DiagramArt, type DiagramConnections } from '@/config/diagram-styles'
import { cn } from '@/lib/utils'

// Leitet den aktiven Persona-Preset-Key aus dem aktuellen Style ab (Reverse-Match).
// Passt keine Kombination, ist kein Preset aktiv.
function matchPreset(style: DiagramStyle): string | null {
  const found = Object.values(PERSONA_PRESETS).find(
    p => p.style.art === style.art && p.style.connections === style.connections && p.style.density === style.density,
  )
  return found?.key ?? null
}

const ARTS: DiagramArt[] = ['schichten', 'togaf', 'datenfluss', 'capability']
const ART_LABEL_KEY: Record<DiagramArt, string> = {
  schichten: 'artSchichten', togaf: 'artTogaf', datenfluss: 'artDatenfluss', capability: 'artCapability',
}
const CONNECTIONS: DiagramConnections[] = ['bebauungsplan', 'uml']
const CONN_LABEL_KEY: Record<DiagramConnections, string> = {
  bebauungsplan: 'connBebauungsplan', uml: 'connUml',
}

const segBtn = (active: boolean) =>
  cn('text-xs font-medium px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap',
    active ? 'bg-primary text-white border-primary' : 'bg-surface text-ink-secondary border-line hover:border-line-strong')

export function DiagramStyleSwitcher({ style, onPreset, onStyleChange }: {
  style: DiagramStyle
  onPreset: (key: string) => void
  onStyleChange: (patch: Partial<DiagramStyle>) => void
}) {
  const t = useTranslations('diagram')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const activePreset = matchPreset(style)
  const showConnections = style.art === 'schichten' || style.art === 'togaf'

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('styleLabel')}>
        {Object.values(PERSONA_PRESETS).map(p => (
          <button key={p.key} type="button" onClick={() => onPreset(p.key)} aria-pressed={activePreset === p.key}
            className={segBtn(activePreset === p.key)}>
            {pick(p.label, locale)}
          </button>
        ))}
      </div>

      <div>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="text-xs text-ink-muted hover:text-ink-secondary inline-flex items-center gap-1">
          {t('customizeView')} <span aria-hidden="true">{open ? '▴' : '▾'}</span>
        </button>

        {open && (
          <div className="mt-2 space-y-2 rounded-lg border border-line bg-surface-raised/40 p-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5">{t('artLabel')}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('artLabel')}>
                {ARTS.map(a => (
                  <button key={a} type="button" onClick={() => onStyleChange({ art: a })} aria-pressed={style.art === a}
                    className={segBtn(style.art === a)}>
                    {t(ART_LABEL_KEY[a])}
                  </button>
                ))}
              </div>
            </div>

            {showConnections && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1.5">{t('connectionsLabel')}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t('connectionsLabel')}>
                  {CONNECTIONS.map(c => (
                    <button key={c} type="button" onClick={() => onStyleChange({ connections: c })} aria-pressed={style.connections === c}
                      className={segBtn(style.connections === c)}>
                      {t(CONN_LABEL_KEY[c])}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
