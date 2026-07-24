'use client'
import { useRef, type ComponentProps } from 'react'
import type { DiagramStyle } from '@/config/diagram-styles'
import { renderableArt } from '@/config/diagram-styles'
import type { CapabilityGroup } from '@/lib/architecture/capability'
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
  return (
    <div className="relative" ref={containerRef}>
      <EamMap {...props.eamProps} grouping={grouping} />
      {showConnections && <ConnectionLayer containerRef={containerRef} grouping={grouping} />}
    </div>
  )
}
