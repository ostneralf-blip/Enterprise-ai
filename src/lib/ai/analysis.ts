import 'server-only'
import type { AnalysisSection } from './schemas'

export interface AnalysisContext {
  components: string[]
  roles: string[]
  compliance?: string
  archetype?: string
  canvas_quadrant?: string
  governance_result?: string
  roadmap_phases?: number
  assessment_score_pct?: number
  locale: 'de' | 'en'
}

export function buildSharedContext(ctx: AnalysisContext): string {
  const langName = ctx.locale === 'de' ? 'German (Deutsch, de-DE)' : 'English (en-US)'
  const scoreLine = ctx.assessment_score_pct != null
    ? `- AI Readiness Score: ${ctx.assessment_score_pct}% (ALWAYS use this exact value — NEVER invent it)`
    : ''

  return `You are an enterprise AI architecture expert. Return ONLY valid JSON — no markdown, no explanation.
CRITICAL: Write single-language text fields (summary, decision_recommendation) exclusively in ${langName}.
BILINGUAL EXCEPTION: key_decisions and next_steps are bilingual — EVERY item MUST include BOTH a "de" key AND an "en" key with real, independently written text in each language, regardless of ${langName} being the primary response language. Never omit "de" or "en" from these items, even though the rest of the response is in ${langName}.
PROTECTED PRODUCT NAMES: ${ctx.components.join(', ')} — appear exactly as listed, NEVER translate or paraphrase.
LIST SIZE: Exactly 3-5 items per list (key_decisions, next_steps).

Architecture context (pre-validated structured data):
- Components: ${ctx.components.join(', ')}
- Roles: ${ctx.roles.join(', ')}
- Compliance level: ${ctx.compliance ?? 'not specified'}
- AI maturity archetype: ${ctx.archetype ?? 'not specified'}
- Canvas use case quadrant: ${ctx.canvas_quadrant ?? 'not specified'}
- Governance result: ${ctx.governance_result ?? 'not specified'}
- Roadmap phases planned: ${ctx.roadmap_phases ?? 0}${scoreLine ? '\n' + scoreLine : ''}`
}

const SECTION_TASK_BLOCKS: Record<AnalysisSection, string> = {
  narrative_exec: `=== SECTION narrative_exec ===
Audience: C-level / CFO. Business language only — no technical jargon.
Summary: 2-3 sentences — what this AI architecture delivers, the key business value, the most critical risk.
decision_recommendation: 2-3 sentences with pilot gate and concrete abort criterion. Flowing prose.
component_suggestions: up to 3 additional real platform names not yet in the list (omit if none). CRITICAL FORMAT: each array item is the bare product/platform name ONLY — no explanation, no rationale, no " — " or "(...)" suffix appended. Wrong: "Databricks (for distributed feature engineering)". Correct: "Databricks".
Return key "narrative_exec": {"summary":"...","key_decisions":[{"de":"...","en":"..."}],"next_steps":[{"de":"...","en":"..."}],"decision_recommendation":"...","component_suggestions":[]}`,

  narrative_architect: `=== SECTION narrative_architect ===
Audience: Enterprise Architect / IT Lead. Full technical depth.
Summary: architecture pattern, key integration decision, primary operational challenge.
decision_recommendation: 2-3 sentences focusing on key integration risk. Flowing prose.
component_suggestions: up to 3 additional real platform names not yet in the list that would strengthen this specific architecture (omit if none). CRITICAL FORMAT: each array item is the bare product/platform name ONLY — no explanation, no rationale, no " — " or "(...)" suffix appended. Any reasoning for why it fits belongs in summary or decision_recommendation instead, never inside this array. Wrong: "SAP Analytics Cloud — for business dashboards". Correct: "SAP Analytics Cloud".
Return key "narrative_architect": {"summary":"...","key_decisions":[{"de":"...","en":"..."}],"next_steps":[{"de":"...","en":"..."}],"decision_recommendation":"...","component_suggestions":[]}`,

  narrative_compliance: `=== SECTION narrative_compliance ===
Audience: Compliance / Audit / DPO. Focus on data flows, EU AI Act, GDPR.
Summary: which obligations apply, which components need attention, immediate compliance action.
decision_recommendation: 2-3 sentences on the most critical regulatory obligation. Flowing prose.
Return key "narrative_compliance": {"summary":"...","key_decisions":[{"de":"...","en":"..."}],"next_steps":[{"de":"...","en":"..."}],"decision_recommendation":"..."}`,

  rasic_suggestion: `=== SECTION rasic_suggestion ===
For each role, assign RASIC codes per phase (Konzeption, Daten, Build, Freigabe, Betrieb).
R=Responsible, A=Accountable (exactly 1 per phase), S=Supportive, I=Informed, C=Consulted. Empty string if not relevant.
Return key "rasic_suggestion": {"entries":[{"role":"...","phases":{"Konzeption":"R","Daten":"A","Build":"S","Freigabe":"I","Betrieb":"C"}}]}`,

  compliance_hints: `=== SECTION compliance_hints ===
List up to 5 most relevant EU AI Act / GDPR obligations for this specific architecture.
Return key "compliance_hints": {"hints":[{"article":"Art. 9 EU AI Act","title":"Risikomanagement-System","relevance":"<1-2 sentences why relevant here>"}]}`,

  decision: `=== SECTION decision ===
Write a 2-3 sentence strategic decision recommendation for this architecture. Include one key risk and one milestone. Flowing prose.
Return key "decision": {"recommendation":"..."}`,
}

export function buildSectionBlocks(sections: AnalysisSection[]): string {
  const blocks = sections.map(s => SECTION_TASK_BLOCKS[s]).join('\n\n')
  return `${blocks}

Return a single JSON object containing ONLY the keys for the sections listed above.`
}
