export interface RawArchitectureResult {
  pattern: string
  description?: string
  layers: Array<{ name: string; role: string; components?: string[] }>
  nextSteps?: Array<string | { de: string; en: string }>
  [key: string]: unknown
}

export interface NormalizedArchitectureResult {
  pattern: string
  description?: string
  layers: Array<{ name: string; role: string; components: string[] }>
  nextSteps: string[]
  [key: string]: unknown
}

// Architektur-Ergebnisse werden sowohl im 'architecture'- als auch im
// 'executive_summary'-PDF-Export gerendert. nextSteps kann pro Eintrag ein
// roher { de, en }-String oder bereits ein aufgelöster String sein (je nach
// Entstehungszeitpunkt des gespeicherten Ergebnisses) — beide Export-Pfade
// müssen dieselbe Auflösung verwenden, sonst crasht react-pdf mit
// "Objects are not valid as a React child" (React error #31), sobald ein
// roh gebliebenes { de, en }-Objekt direkt als Text-Kind landet.
export function normalizeArchitectureResult(
  result: RawArchitectureResult,
  locale: string,
): NormalizedArchitectureResult {
  return {
    ...result,
    layers: (result.layers ?? []).map(l => ({ ...l, components: l.components ?? [] })),
    nextSteps: (result.nextSteps ?? []).map(step =>
      typeof step === 'string' ? step : (locale === 'en' ? step.en : step.de)
    ),
  }
}
