import type { LocaleString } from '@/lib/utils/locale-data'

export type DiagramArt = 'schichten' | 'togaf' | 'datenfluss' | 'capability'
export type DiagramConnections = 'bebauungsplan' | 'uml'
export type DiagramDensity = 'sparsam' | 'detailliert'

export interface DiagramStyle {
  art: DiagramArt
  connections: DiagramConnections
  density: DiagramDensity
}

export interface PersonaPreset {
  key: string
  label: LocaleString
  description: LocaleString
  style: DiagramStyle
}

export const DEFAULT_STYLE: DiagramStyle = { art: 'schichten', connections: 'bebauungsplan', density: 'sparsam' }

export const PERSONA_PRESETS: Record<string, PersonaPreset> = {
  executive: {
    key: 'executive',
    label: { de: 'Executive (CIO/CEO)', en: 'Executive (CIO/CEO)' },
    description: { de: 'Geschäftsfähigkeiten & Reifegrad, neutral', en: 'Business capabilities & maturity, neutral' },
    style: { art: 'capability', connections: 'bebauungsplan', density: 'sparsam' },
  },
  architect: {
    key: 'architect',
    label: { de: 'Enterprise-Architekt', en: 'Enterprise Architect' },
    description: { de: 'Schichten, detailliert', en: 'Layers, detailed' },
    style: { art: 'schichten', connections: 'bebauungsplan', density: 'detailliert' },
  },
  compliance: {
    key: 'compliance',
    label: { de: 'Compliance / Risk', en: 'Compliance / Risk' },
    description: { de: 'Schichten, Konformität je Baustein', en: 'Layers, compliance per block' },
    style: { art: 'schichten', connections: 'bebauungsplan', density: 'sparsam' },
  },
  data: {
    key: 'data',
    label: { de: 'Daten- / ML-Lead', en: 'Data / ML Lead' },
    description: { de: 'Datenfluss (ab Phase 2), detailliert', en: 'Data flow (from phase 2), detailed' },
    style: { art: 'datenfluss', connections: 'bebauungsplan', density: 'detailliert' },
  },
}

// Phase 1: nur 'schichten' + 'capability' haben eigene Renderer; 'togaf'/'datenfluss' fallen auf 'schichten' zurück.
export function renderableArt(art: DiagramArt): DiagramArt {
  return art === 'capability' ? 'capability' : 'schichten'
}

export function resolvePreset(name: string | null | undefined): DiagramStyle {
  if (name && PERSONA_PRESETS[name]) return PERSONA_PRESETS[name].style
  return DEFAULT_STYLE
}
