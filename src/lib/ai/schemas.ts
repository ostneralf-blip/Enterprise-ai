import { z } from 'zod'

export const BilingualItemSchema = z.object({
  de: z.string().min(1).max(500),
  en: z.string().min(1).max(500),
})

// Canvas AI-Enrichment: LLM klassifiziert Use-Case-Typ, Branche und Infra-Hinweise
export const CanvasAIEnrichmentSchema = z.object({
  use_case_type: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  suggested_quadrant: z.enum(['quick_win', 'strategic', 'support', 'avoid']).optional(),
  suggested_complexity: z.enum(['low', 'medium', 'high']).optional(),
  infra_hints: z.array(z.string().max(200)).max(5).optional(),
  additional_compliance_flags: z.array(z.string().max(100)).max(3).optional(),
  confidence: z.number().min(0).max(1),
})

export type CanvasAIEnrichment = z.infer<typeof CanvasAIEnrichmentSchema>

// Architektur AI-Narrative: LLM generiert kontextspezifische Begründungs-Prosa + Komponenten-Vorschläge
export const ArchitectureNarrativeSchema = z.object({
  summary: z.string().max(600).optional(),
  key_decisions: z.array(BilingualItemSchema).max(6),
  next_steps: z.array(BilingualItemSchema).max(6),
  component_suggestions: z.array(z.string().max(100)).max(5).optional(),
})

export type ArchitectureNarrative = z.infer<typeof ArchitectureNarrativeSchema>
