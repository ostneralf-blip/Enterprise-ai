import 'server-only'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { callLLM } from './client'
import { createAdminClient } from '@/lib/supabase/server'

// Admin-Vorschlag-Anreicherung (18.07.2026): sobald ein KI-Vorschlag ohne
// Katalog-Treffer zum ERSTEN Mal auftritt, wird hier — asynchron, mit einem
// eigenen Sonnet-Call und OHNE getAIUsageStatus/incrementAIUsage — ermittelt,
// welches konkrete Produkt gemeint ist (nicht nur die Herstellerfirma, z. B.
// "Databricks" → "Databricks Mosaic AI" o. ä. je nach Kontext) und dieselben
// Metadaten geliefert, die ein regulärer component_catalog-Eintrag hätte.
// Läuft komplett unabhängig vom Nutzer-Kontingent des auslösenden Requests.
const ARCH_LAYERS      = ['data', 'model', 'serving', 'mlops', 'application', 'governance', 'security'] as const
const DSGVO_STATUSES   = ['compliant', 'conditional', 'non_compliant'] as const
const EU_AI_ACT_RISKS  = ['minimal', 'limited', 'high', 'prohibited'] as const

// .nullish() statt .nullable(): Sonnet lässt unsichere Felder gelegentlich
// komplett aus der Antwort weg, statt sie explizit auf null zu setzen —
// .nullable() akzeptiert nur null, nicht "Feld fehlt" (undefined), und wies
// die Antwort dann komplett als ZOD_PARSE zurück, obwohl der Call selbst
// erfolgreich war (Sentry, 18.07.2026: 6 von 10 Feldern "received undefined").
// Die drei Enum-Felder werden hier bewusst als loser String geparst statt als
// z.enum(...) — ein einzelner Near-Miss-Wert (z. B. "integration" statt einem
// der 7 erlaubten Layer) hätte sonst wieder die GESAMTE Antwort verworfen.
// coerceEnum() validiert danach gezielt nur diese drei Felder gegen die
// bekannten Werte und setzt bei Nichttreffer null, statt alles zu verlieren.
const EnrichmentSchema = z.object({
  resolved_name:      z.string().min(1).max(200),
  vendor:              z.string().max(100).nullish(),
  category:            z.string().max(50).nullish(),
  architecture_layer:  z.string().max(50).nullish(),
  cloud_provider:      z.string().max(50).nullish(),
  hosting:             z.array(z.string().max(20)).max(10).nullish().default([]),
  dsgvo_status:        z.string().max(50).nullish(),
  eu_ai_act_risk:      z.string().max(50).nullish(),
  description:         z.string().max(500).nullish(),
  website_url:         z.string().max(300).nullish(),
})

// Mapping statt reinem Verwerfen (Idee Daniel, 18.07.2026): Bedrock antwortet
// nicht immer exakt mit einem der erlaubten Enum-Werte, sondern gelegentlich
// mit einem sinngemäß passenden Synonym (z. B. "infrastructure" statt "data",
// "low" statt "minimal"). Normalisierung (klein, getrimmt, Leerzeichen/
// Bindestriche → Unterstrich) + Synonym-Tabelle fangen das ab, bevor auf
// null zurückgefallen wird — flexibler als starre 1:1-Enum-Validierung.
function normalizeToken(s: string): string {
  return s.toLowerCase().trim().replace(/[\s-]+/g, '_')
}

function coerceEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  synonyms: Record<string, T> = {},
): T | null {
  if (!value) return null
  const norm = normalizeToken(value)
  if ((allowed as readonly string[]).includes(norm)) return norm as T
  return synonyms[norm] ?? null
}

const ARCH_LAYER_SYNONYMS: Record<string, typeof ARCH_LAYERS[number]> = {
  infrastructure: 'data', storage: 'data', database: 'data', analytics: 'data', warehouse: 'data', datalake: 'data',
  ml: 'model', ai: 'model', machine_learning: 'model', llm: 'model', foundation_model: 'model',
  compute: 'serving', platform: 'serving', hosting: 'serving', runtime: 'serving', inference: 'serving',
  monitoring: 'mlops', observability: 'mlops', devops: 'mlops', pipeline: 'mlops', cicd: 'mlops', orchestration: 'mlops',
  integration: 'application', frontend: 'application', backend: 'application', ui: 'application',
  api: 'application', presentation: 'application', business: 'application', app: 'application', saas: 'application',
  compliance: 'governance', policy: 'governance', audit: 'governance', risk: 'governance', catalog: 'governance', metadata: 'governance',
  auth: 'security', authentication: 'security', identity: 'security', network: 'security', iam: 'security', encryption: 'security',
}
const DSGVO_SYNONYMS: Record<string, typeof DSGVO_STATUSES[number]> = {
  gdpr_compliant: 'compliant', conform: 'compliant', konform: 'compliant', fully_compliant: 'compliant', yes: 'compliant',
  partially_compliant: 'conditional', partial: 'conditional', unclear: 'conditional', unknown: 'conditional', depends: 'conditional', conditional_on_config: 'conditional',
  not_compliant: 'non_compliant', noncompliant: 'non_compliant', non_conform: 'non_compliant', no: 'non_compliant',
}
const EU_AI_ACT_SYNONYMS: Record<string, typeof EU_AI_ACT_RISKS[number]> = {
  low: 'minimal', none: 'minimal', negligible: 'minimal', minimal_risk: 'minimal',
  medium: 'limited', moderate: 'limited', limited_risk: 'limited',
  significant: 'high', severe: 'high', high_risk: 'high',
  unacceptable: 'prohibited', banned: 'prohibited', forbidden: 'prohibited', unacceptable_risk: 'prohibited',
}

export type CatalogSuggestionEnrichment = z.infer<typeof EnrichmentSchema>

interface EnrichInput {
  suggestionId: string
  name: string
  module: string
  section: string | null
  context: Record<string, unknown>
}

function buildPrompt({ name, module, section, context }: EnrichInput): string {
  return `Ein KI-Assistent in einem Enterprise-AI-Architektur-Tool hat die Komponente "${name}" vorgeschlagen. Sie existiert nicht im bestehenden Komponenten-Katalog.

Kontext des Vorschlags:
- Modul/Sektion: ${module}${section ? ` / ${section}` : ''}
- Weitere Details: ${JSON.stringify(context)}

Aufgabe: Identifiziere das GENAU gemeinte, konkrete Produkt bzw. Angebot — nicht nur die Herstellerfirma. Beispiel: "Databricks" ist mehrdeutig (Data Intelligence Platform, Mosaic AI, Unity Catalog, ...) — wähle anhand des Kontexts das wahrscheinlichste konkrete Produkt und nenne es in resolved_name. Liefere anschließend strukturierte Katalog-Metadaten für dieses Produkt: Hersteller, Kategorie, Architektur-Layer, Cloud-Provider, Hosting-Optionen, DSGVO-Status, EU-AI-Act-Risikoklasse, eine kurze deutsche Beschreibung (max. 2 Sätze) und die offizielle Hersteller-Website-URL. Wenn ein Feld nicht zuverlässig bestimmbar ist, liefere null statt zu raten.`
}

export async function enrichCatalogSuggestion(input: EnrichInput): Promise<void> {
  const admin = await createAdminClient()
  try {
    await admin.from('catalog_suggestions').update({ enrichment_status: 'pending' }).eq('id', input.suggestionId)

    const { data } = await callLLM(buildPrompt(input), EnrichmentSchema, {
      model: 'sonnet',
      maxTokens: 700,
      timeoutMs: 15000,
      module: 'catalog_enrichment',
    })

    if (!data) {
      await admin.from('catalog_suggestions').update({ enrichment_status: 'failed' }).eq('id', input.suggestionId)
      return
    }

    const enrichment = {
      ...data,
      architecture_layer: coerceEnum(data.architecture_layer, ARCH_LAYERS, ARCH_LAYER_SYNONYMS),
      dsgvo_status:       coerceEnum(data.dsgvo_status, DSGVO_STATUSES, DSGVO_SYNONYMS),
      eu_ai_act_risk:     coerceEnum(data.eu_ai_act_risk, EU_AI_ACT_RISKS, EU_AI_ACT_SYNONYMS),
    }

    await admin.from('catalog_suggestions').update({
      enrichment,
      enrichment_status: 'done',
      enriched_at: new Date().toISOString(),
    }).eq('id', input.suggestionId)
  } catch (err) {
    Sentry.captureMessage('Catalog-Suggestion-Anreicherung fehlgeschlagen', {
      level: 'warning',
      tags: { module: 'catalog_enrichment' },
      extra: { name: input.name, error: err instanceof Error ? err.message : String(err) },
    })
    try {
      await admin.from('catalog_suggestions').update({ enrichment_status: 'failed' }).eq('id', input.suggestionId)
    } catch { /* best-effort */ }
  }
}
