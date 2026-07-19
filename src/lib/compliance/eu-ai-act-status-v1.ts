// EU-AI-Act-Status — V1-Datenschicht (Issue #224). Nutzt den Governance-Check
// als Proxy für die Risikoeinstufung eines Use Cases: jedes Ergebnis eines
// Governance-Checks (use_cases.governance_result, siehe Issue #65) wird 1:1
// auf eine der drei anzeigbaren EU-AI-Act-Risikoklassen abgebildet.
//
// Das ist bewusst eine Vereinfachung, die nur greift, wenn kein Canvas mit
// echter Art.-6-Klassifikation verlinkt ist — siehe computeEuAiActStatusV2 in
// lib/compliance/eu-ai-act-use-case-scoring.ts (19.07.2026, mit Daniel
// abgestimmt), die für Use-Cases mit Canvas die tatsächliche EU-AI-Act-
// Einstufung nutzt und hierauf nur als Fallback zurückfällt.
//
// Eigene Datei statt Teil von data/executive-summary.ts, damit
// eu-ai-act-use-case-scoring.ts (V2) diese Funktion importieren kann, ohne
// einen Zirkelbezug zu executive-summary.ts zu erzeugen (das umgekehrt V2
// aufruft).
export interface EuAiActStatusSummary {
  highCount: number
  limitedCount: number
  minimalCount: number
  classifiedCount: number
  gapCount: number
}

type GovernanceVerdict = 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve'

export function computeEuAiActStatusV1(
  useCases: Array<{ governance_result: GovernanceVerdict | null }>
): EuAiActStatusSummary | null {
  if (useCases.length === 0) return null

  let highCount = 0
  let limitedCount = 0
  let minimalCount = 0
  let gapCount = 0

  for (const uc of useCases) {
    switch (uc.governance_result) {
      case 'stop_dsgvo':
      case 'stop_risk':
        highCount++
        break
      case 'improve':
        limitedCount++
        break
      case 'approve':
        minimalCount++
        break
      default:
        gapCount++
    }
  }

  return {
    highCount,
    limitedCount,
    minimalCount,
    classifiedCount: useCases.length - gapCount,
    gapCount,
  }
}
