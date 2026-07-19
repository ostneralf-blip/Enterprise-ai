import { readFileSync } from 'fs'
import { join } from 'path'

// Regressionstest für einen am 19.07.2026 gefundenen Bug: narrative_locale
// (Migration 20260713155101) wurde beim Speichern der KI-Einordnung nie
// geschrieben — die Spalte blieb für JEDE je generierte KI-Einordnung NULL.
// Sichtbar wurde das erst über den MERIDIAN-Architektur-Report (#225), der
// aiSummary/decisionRecommendation/investmentFramework fälschlich als
// Sprach-Mismatch verwarf, obwohl echte, korrekte Daten vorhanden waren.
// Reiner Quelltext-Check (wie die bestehenden Security-Tests) statt eines
// vollen Route-Mocks, da die unified-analysis-Route viele Abhängigkeiten
// (LLM, Sentry, PostHog) hat, die hier nicht das Ziel des Tests sind.
const routeSrc = readFileSync(
  join(process.cwd(), 'src/app/api/analysis/architecture/[id]/route.ts'),
  'utf-8'
)

describe('AI-Narrative-Persistenz — narrative_locale wird geschrieben (Regression, gefunden 19.07.2026)', () => {
  it('das architectures-Update setzt narrative_locale auf die angeforderte Locale', () => {
    // Es gibt mehrere .from('architectures')-Aufrufe in der Route (u. a. der
    // initiale SELECT) — gezielt der UPDATE-Aufruf, erkennbar an
    // ai_narrative: updatedNarrative im .update()-Payload.
    const updateIndex = routeSrc.indexOf('ai_narrative: updatedNarrative')
    expect(updateIndex).toBeGreaterThan(-1)
    const updateCallSlice = routeSrc.slice(updateIndex, updateIndex + 200)
    expect(updateCallSlice).toContain('narrative_locale: locale')
  })
})
