import type { AnalysisSection } from './schemas'

// Persistenz-Key in architectures.ai_narrative UND API-Response-Key teilen sich
// diese Zuordnung — narrative_exec/-architect/-compliance werden unter den
// kurzen Audience-Namen gespeichert (exec/architect/compliance), wie es das
// Frontend seit der ersten ai-narrative-Route erwartet. Nicht-Narrative-
// Sektionen (rasic_suggestion, compliance_hints, decision) behalten ihren
// vollen Namen als Key. Zentral hier definiert (client-sicher, kein
// server-only), damit Route und Client nicht wieder auseinanderdriften —
// siehe den Executive-Summary-PDF-Bug vom 18.07.2026 für ein Beispiel, was
// passiert, wenn dieselbe Umformung an zwei Stellen separat gepflegt wird.
export const SECTION_TO_AUDIENCE: Partial<Record<AnalysisSection, 'exec' | 'architect' | 'compliance'>> = {
  narrative_exec:       'exec',
  narrative_architect:  'architect',
  narrative_compliance: 'compliance',
}
