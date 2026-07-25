'use client'
import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { DiagramStyle } from '@/config/diagram-styles'
import { renderableArt } from '@/config/diagram-styles'
import type { CapabilityGroup } from '@/lib/architecture/capability'
import { catalogEdges } from '@/lib/architecture/catalog-edges'
import { InfoHint } from '@/components/shared/InfoHint'
import { CapabilityView } from './CapabilityView'
import { DataFlowView } from './DataFlowView'
import { ConnectionLayer } from './ConnectionLayer'
import { EamMap } from '@/app/[locale]/(dashboard)/architecture/EamMap'

type EamProps = ComponentProps<typeof EamMap>

interface DiagramProps {
  style: DiagramStyle
  capabilityGroups: CapabilityGroup[]
  capabilityEmptyLabel: string
  eamProps: EamProps
}

// Der eigentliche Diagramm-Inhalt. Bewusst als eigene Komponente, damit die
// Vergrößern-Ansicht (Modal) eine ZWEITE, unabhängige Instanz mit eigenem
// containerRef/ConnectionLayer rendern kann (Anker werden pro Instanz gemessen).
function DiagramBody({ style, capabilityGroups, capabilityEmptyLabel, eamProps }: DiagramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const t = useTranslations('diagram')
  const art = renderableArt(style.art)

  if (art === 'capability') {
    return <CapabilityView groups={capabilityGroups} emptyLabel={capabilityEmptyLabel} />
  }
  if (art === 'datenfluss') {
    return <DataFlowView activeComponents={eamProps.activeComponents} componentSources={eamProps.componentSources} />
  }

  const grouping = art === 'togaf' ? 'togaf' : 'layers'
  const showConnections = style.connections === 'uml'
  const { edges, conflicts } = showConnections ? catalogEdges(eamProps.activeComponents) : { edges: [], conflicts: [] }
  const hasCatalog = edges.length > 0 || conflicts.length > 0

  return (
    <div className="space-y-2">
      <div className="relative" ref={containerRef}>
        <EamMap {...eamProps} grouping={grouping} />
        {showConnections && (
          <ConnectionLayer containerRef={containerRef} grouping={grouping} compEdges={edges} conflicts={conflicts} />
        )}
      </div>
      {showConnections && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-muted">
          {hasCatalog ? (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="w-4 border-t border-line-strong" aria-hidden="true" />{t('legendRequires')}
              </span>
              {edges.some(e => e.kind === 'suggests') && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-4 border-t border-dashed border-line-strong" aria-hidden="true" />{t('legendSuggests')}
                </span>
              )}
              {conflicts.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="w-4 border-t border-dashed border-error-border" aria-hidden="true" />
                  <span className="text-error-text">{t('legendConflict')}</span>
                </span>
              )}
            </>
          ) : null}
          <InfoHint title={t('connectionsHintTitle')} align="right">{t('connectionsHint')}</InfoHint>
        </div>
      )}
    </div>
  )
}

// Wrapper: rendert das Diagramm plus einen Vergrößern-Knopf. Die Vergrößern-Ansicht
// ist ein adaptives Vollbild-Overlay — der Diagramm-Inhalt bekommt darin deutlich mehr
// Breite und passt sich (Flex-Wrap + ResizeObserver im ConnectionLayer) automatisch an.
export function DiagramView(props: DiagramProps) {
  const t = useTranslations('diagram')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  // EINE Instanz: der Vergrößern-Knopf schaltet denselben Container per CSS auf
  // Vollbild. Nur die Größe ändert sich → der bestehende ResizeObserver im
  // ConnectionLayer misst neu und zeichnet die Kanten (kein zweites Mount, keine
  // fragile Zweitmessung wie beim früheren Modal-Ansatz).
  return (
    <>
      {expanded && (
        <div className="fixed inset-0 z-40 bg-ink/70" aria-hidden="true" onClick={() => setExpanded(false)} />
      )}
      <div
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded ? true : undefined}
        aria-label={expanded ? t('enlarge') : undefined}
        className={cn('space-y-1', expanded && 'fixed inset-2 sm:inset-6 z-50 bg-surface rounded-2xl shadow-xl overflow-auto p-4 sm:p-6')}
      >
        <div className="flex items-center justify-end">
          <button type="button" onClick={() => setExpanded(e => !e)}
            className="text-xs text-ink-muted hover:text-ink-secondary inline-flex items-center gap-1">
            {expanded
              ? <><span aria-hidden="true">✕</span> {t('close')}</>
              : <>{t('enlarge')} <span aria-hidden="true">⤢</span></>}
          </button>
        </div>
        <DiagramBody {...props} />
      </div>
    </>
  )
}
