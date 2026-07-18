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
// .nullish() statt .nullable(): Sonnet lässt unsichere Felder gelegentlich
// komplett aus der Antwort weg, statt sie explizit auf null zu setzen —
// .nullable() akzeptiert nur null, nicht "Feld fehlt" (undefined), und wies
// die Antwort dann komplett als ZOD_PARSE zurück, obwohl der Call selbst
// erfolgreich war (Sentry, 18.07.2026: 6 von 10 Feldern "received undefined").
const EnrichmentSchema = z.object({
  resolved_name:      z.string().min(1).max(200),
  vendor:              z.string().max(100).nullish(),
  category:            z.string().max(50).nullish(),
  architecture_layer:  z.enum(['data', 'model', 'serving', 'mlops', 'application', 'governance', 'security']).nullish(),
  cloud_provider:      z.string().max(50).nullish(),
  hosting:             z.array(z.string().max(20)).max(10).nullish().default([]),
  dsgvo_status:        z.enum(['compliant', 'conditional', 'non_compliant']).nullish(),
  eu_ai_act_risk:      z.enum(['minimal', 'limited', 'high', 'prohibited']).nullish(),
  description:         z.string().max(500).nullish(),
  website_url:         z.string().max(300).nullish(),
})

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

    await admin.from('catalog_suggestions').update({
      enrichment: data,
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
