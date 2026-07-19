import { z } from 'zod'

export const BilingualItemSchema = z.object({
  de: z.string().min(1).max(2000),
  en: z.string().min(1).max(2000),
})

// Canvas AI-Enrichment: LLM klassifiziert Use-Case-Typ, Branche und Infra-Hinweise
export const CanvasAIEnrichmentSchema = z.object({
  use_case_type: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  suggested_quadrant: z.enum(['quick_win', 'strategic', 'support', 'avoid']).optional(),
  suggested_complexity: z.enum(['low', 'medium', 'high']).optional(),
  infra_hints: z.array(z.string().max(200)).max(5).optional(),
  additional_compliance_flags: z.array(z.string().max(100)).max(3).optional(),
  // #188: Term-Mappings für das Erkennungs-Harvesting — Begriffe, die wörtlich
  // im Canvas-Text stehen, mit kanonischem Vendor/Kategorie/Use-Case-Ziel
  detected_entities: z.array(z.object({
    term: z.string().max(60),
    canonical: z.string().max(60),
    type: z.enum(['vendor', 'category', 'usecase']),
  })).max(5).optional(),
  confidence: z.number().min(0).max(1),
})

export type CanvasAIEnrichment = z.infer<typeof CanvasAIEnrichmentSchema>

// Architektur AI-Narrative: LLM generiert kontextspezifische Begründungs-Prosa + Komponenten-Vorschläge
// Limits großzügig gesetzt — strikte max() führen zu Zod-Fehlern wenn LLM leicht überschießt
export const ArchitectureNarrativeSchema = z.object({
  summary: z.string().max(2000).optional(),
  key_decisions: z.array(BilingualItemSchema).max(10),
  next_steps: z.array(BilingualItemSchema).max(10),
  component_suggestions: z.array(z.string().max(200)).max(8).optional(),
  decision_recommendation: z.string().max(1500).optional(),
})

export type ArchitectureNarrative = z.infer<typeof ArchitectureNarrativeSchema>

// ─── Unified Analysis: Sektions-Schemas (#210) ────────────────────────────
export const SectionEnum = z.enum([
  'narrative_exec', 'narrative_architect', 'narrative_compliance',
  'rasic_suggestion', 'compliance_hints', 'decision',
])
export type AnalysisSection = z.infer<typeof SectionEnum>

// Investitionsrahmen (#225 MERIDIAN Architektur-Report) — nur für narrative_exec
// sinnvoll befüllt (C-Level/CFO-Audience), bei narrative_architect/-compliance
// bleibt das Feld einfach leer. Ausdrücklich eine grobe Schätzung des Modells
// auf Basis der gewählten Komponenten/Muster, keine belastbare Kalkulation —
// im Report entsprechend als Schätzung gekennzeichnet.
export const InvestmentFrameworkSchema = z.object({
  year1_estimate: z.string().max(60),
  year1_caption: z.string().max(80).optional(),
  ongoing_estimate: z.string().max(60),
  timeframe_estimate: z.string().max(30),
  risk_label: z.string().max(40),
  risk_note: z.string().max(120),
})

export const NarrativeSectionSchema = z.object({
  summary: z.string().max(2000).optional(),
  key_decisions: z.array(BilingualItemSchema).max(10),
  next_steps: z.array(BilingualItemSchema).max(10),
  component_suggestions: z.array(z.string().max(200)).max(8).optional(),
  decision_recommendation: z.string().max(1500).optional(),
  investment_framework: InvestmentFrameworkSchema.optional(),
})

export const RasicSuggestionSectionSchema = z.object({
  entries: z.array(z.object({
    role: z.string().max(100),
    phases: z.record(z.string(), z.string().max(1)),
  })).max(20),
})

export const ComplianceHintsSectionSchema = z.object({
  hints: z.array(z.object({
    article: z.string().max(100),
    title: z.string().max(200),
    relevance: z.string().max(500),
  })).max(5),
})

export const DecisionSectionSchema = z.object({
  recommendation: z.string().max(1500),
})

export const AnalysisRawSchema = z.object({
  narrative_exec:       NarrativeSectionSchema.optional(),
  narrative_architect:  NarrativeSectionSchema.optional(),
  narrative_compliance: NarrativeSectionSchema.optional(),
  rasic_suggestion:     RasicSuggestionSectionSchema.optional(),
  compliance_hints:     ComplianceHintsSectionSchema.optional(),
  decision:             DecisionSectionSchema.optional(),
}).passthrough()
export type AnalysisRaw = z.infer<typeof AnalysisRawSchema>

// ─── Pass-1-Vorklassifikation: Term-Klassifikation via Haiku (#191) ────────
export const TermClassEnum = z.enum(['produkt', 'projekt_eigenname', 'capability', 'fuellwort', 'mehrdeutig'])
export type TermClass = z.infer<typeof TermClassEnum>

export const Pass1TermResultSchema = z.object({
  term:       z.string().max(200),
  class:      TermClassEnum,
  vendor:     z.string().max(100).nullable().optional(),
  confidence: z.number().min(0).max(1),
})
export type Pass1TermResult = z.infer<typeof Pass1TermResultSchema>

export const Pass1ClassificationSchema = z.array(Pass1TermResultSchema).max(20)
