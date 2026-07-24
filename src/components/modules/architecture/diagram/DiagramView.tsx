import type { ComponentProps } from 'react'
import type { DiagramStyle } from '@/config/diagram-styles'
import { renderableArt } from '@/config/diagram-styles'
import type { CapabilityGroup } from '@/lib/architecture/capability'
import { CapabilityView } from './CapabilityView'
import { EamMap } from '@/app/[locale]/(dashboard)/architecture/EamMap'

type EamProps = ComponentProps<typeof EamMap>

// Dispatcher: rendert je gewählter „Art" die passende Sicht. Phase 1: nur
// 'capability' (Portfolio) und 'schichten' (bestehende EamMap) haben Renderer —
// renderableArt() mappt 'togaf'/'datenfluss' vorerst auf 'schichten' (Graceful
// Degradation, siehe Plan Phase 2).
export function DiagramView(props: {
  style: DiagramStyle
  capabilityGroups: CapabilityGroup[]
  capabilityEmptyLabel: string
  eamProps: EamProps
}) {
  const art = renderableArt(props.style.art)
  if (art === 'capability') {
    return <CapabilityView groups={props.capabilityGroups} emptyLabel={props.capabilityEmptyLabel} />
  }
  return <EamMap {...props.eamProps} />
}
