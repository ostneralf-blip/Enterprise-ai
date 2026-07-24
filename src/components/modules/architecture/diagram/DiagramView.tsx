'use client'
import { useRef, type ComponentProps } from 'react'
import { useTranslations } from 'next-intl'
import type { DiagramStyle } from '@/config/diagram-styles'
import { renderableArt } from '@/config/diagram-styles'
import type { CapabilityGroup } from '@/lib/architecture/capability'
import { catalogEdges } from '@/lib/architecture/catalog-edges'
import { CapabilityView } from './CapabilityView'
import { DataFlowView } from './DataFlowView'
import { ConnectionLayer } from './ConnectionLayer'
import { EamMap } from '@/app/[locale]/(dashboard)/architecture/EamMap'

type EamProps = ComponentProps<typeof EamMap>

// Dispatcher: rendert je gewählter „Art" die passende Sicht.
// - capability → Portfolio-Heatmap
// - datenfluss → DataFlowView (Daten im Zentrum)
// - togaf      → EamMap mit TOGAF-Gruppierung
// - schichten  → EamMap mit Layers-Gruppierung (Default)
// Bei art ∈ {schichten, togaf} legt DiagramView zusätzlich den ConnectionLayer
// (UML-Kanten) über die Karte, wenn connections === 'uml'. (ConnectionLayer folgt.)
export function DiagramView(props: {
  style: DiagramStyle
  capabilityGroups: CapabilityGroup[]
  capabilityEmptyLabel: string
  eamProps: EamProps
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const t = useTranslations('diagram')
  const art = renderableArt(props.style.art)

  if (art === 'capability') {
    return <CapabilityView groups={props.capabilityGroups} emptyLabel={props.capabilityEmptyLabel} />
  }
  if (art === 'datenfluss') {
    return (
      <DataFlowView
        activeComponents={props.eamProps.activeComponents}
        componentSources={props.eamProps.componentSources}
      />
    )
  }

  const grouping = art === 'togaf' ? 'togaf' : 'layers'
  const showConnections = props.style.connections === 'uml'
  const { edges, conflicts } = showConnections
    ? catalogEdges(props.eamProps.activeComponents)
    : { edges: [], conflicts: [] }
  const hasCatalog = edges.length > 0 || conflicts.length > 0

  return (
    <div className="space-y-2">
      <div className="relative" ref={containerRef}>
        <EamMap {...props.eamProps} grouping={grouping} />
        {showConnections && (
          <ConnectionLayer containerRef={containerRef} grouping={grouping} compEdges={edges} conflicts={conflicts} />
        )}
      </div>
      {showConnections && hasCatalog && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-muted">
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
        </div>
      )}
    </div>
  )
}
