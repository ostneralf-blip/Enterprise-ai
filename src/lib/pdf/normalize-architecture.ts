export interface RawArchitectureResult {
  pattern: string
  description?: string | { de: string; en: string }
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

// Wiederverwendet von templates.tsx für andere Module (z. B. Governance-Protokoll),
// die denselben Bug-Typ haben können: Alt-Datensätze mit rohem { de, en } statt String.
export function resolveLocaleField(value: string | { de: string; en: string } | undefined, locale: string): string | undefined {
  if (value == null) return undefined
  return typeof value === 'string' ? value : (locale === 'en' ? value.en : value.de)
}

// Architektur-Ergebnisse werden sowohl im 'architecture'- als auch im
// 'executive_summary'-PDF-Export gerendert. Felder wie nextSteps oder description
// können pro Eintrag ein roher { de, en }-String oder bereits ein aufgelöster
// String sein (je nach Entstehungszeitpunkt des gespeicherten Ergebnisses —
// description ist z. B. kein Feld des aktuellen ArchitectureResult-Typs mehr,
// aber ältere DB-Datensätze können es noch als { de, en } enthalten) — beide
// Export-Pfade müssen dieselbe Auflösung verwenden, sonst crasht react-pdf mit
// "Objects are not valid as a React child" (React error #31), sobald ein
// roh gebliebenes { de, en }-Objekt direkt als Text-Kind landet.
export function normalizeArchitectureResult(
  result: RawArchitectureResult,
  locale: string,
): NormalizedArchitectureResult {
  return {
    ...result,
    description: resolveLocaleField(result.description, locale),
    layers: (result.layers ?? []).map(l => ({ ...l, components: l.components ?? [] })),
    nextSteps: (result.nextSteps ?? []).map(step =>
      typeof step === 'string' ? step : (locale === 'en' ? step.en : step.de)
    ),
  }
}
