import { VENDOR_ALIASES, PLATFORM_CATEGORY_KEYWORDS } from '@/lib/canvas-context'

/**
 * #188 — KI-Erkennungs-Harvesting (Self-Training-Loop):
 * Validiert vom LLM gemeldete Term-Mappings (detected_entities), bevor sie als
 * Synonym-KANDIDATEN (pending, inaktiv) in canvas_synonyms landen. Die
 * deterministische Erkennung liest weiterhin nur is_active=true — Kandidaten
 * wirken erst nach Admin-Freigabe. Kein Auto-Approve (Lehre aus #181).
 *
 * Datenschutz-Leitplanke: Es wird ausschließlich gespeichert, was (a) wörtlich
 * im Canvas-Text des Nutzers steht UND (b) auf ein bekanntes kanonisches Ziel
 * (Vendor/Kategorie/Use-Case-Typ) gemappt ist — nie Freitext, nie Namen.
 */

export interface DetectedEntity {
  term: string
  canonical: string
  type: 'vendor' | 'category' | 'usecase'
}

/** DB-Semantik von canvas_synonyms: term = kanonisches Ziel, synonym = Text-Begriff */
export interface HarvestSuggestion {
  term: string
  synonym: string
  synonym_type: 'vendor' | 'category' | 'usecase'
}

const USECASE_TYPES = new Set(['vision', 'generative', 'predictive', 'automation'])

// Generische Begriffe, die zwar auf Produkte zeigen KÖNNEN (z. B. „Word" →
// Microsoft), als Erkennungs-Term aber massenhaft False-Positives erzeugen
// würden. Solche Fälle gehören — wenn überhaupt — manuell kuratiert.
const GENERIC_DENYLIST = new Set([
  'word', 'excel', 'mail', 'email', 'cloud', 'server', 'portal', 'system',
  'daten', 'data', 'software', 'plattform', 'platform', 'tool', 'tools',
  'app', 'apps', 'online', 'digital', 'service', 'services', 'suite',
  'office', 'projekt', 'project', 'prozess', 'process', 'website', 'web',
])

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

/** Baut die Menge bereits bekannter Terme aus dem hardcodierten Vokabular. */
export function buildKnownTerms(extra: Iterable<string> = []): Set<string> {
  const known = new Set<string>()
  for (const [vendor, aliases] of Object.entries(VENDOR_ALIASES)) {
    known.add(normalize(vendor))
    for (const a of aliases) known.add(normalize(a))
  }
  for (const keywords of Object.values(PLATFORM_CATEGORY_KEYWORDS)) {
    for (const k of keywords) known.add(normalize(k))
  }
  for (const e of extra) known.add(normalize(e))
  return known
}

/** Kanonische Vendor-Schreibweise auflösen (case-insensitiv gegen bekannte Keys). */
function resolveVendorCanonical(canonical: string): string | null {
  const c = normalize(canonical)
  for (const vendor of Object.keys(VENDOR_ALIASES)) {
    if (normalize(vendor) === c) return vendor
  }
  return null
}

export function validateDetectedEntities(
  entities: DetectedEntity[] | undefined,
  canvasText: string,
  knownTerms: Set<string> = buildKnownTerms(),
): HarvestSuggestion[] {
  if (!entities?.length) return []
  const text = canvasText.toLowerCase()
  const out: HarvestSuggestion[] = []
  const seen = new Set<string>()

  for (const e of entities.slice(0, 5)) {
    const term = normalize(e.term ?? '')

    // Grundfilter: Länge, keine reine Zahl, kein Generikum
    if (term.length < 4 || term.length > 60) continue
    if (/^\d+$/.test(term)) continue
    if (GENERIC_DENYLIST.has(term)) continue

    // Halluzinations- & Datenschutz-Guard: Term muss wörtlich im Canvas-Text stehen
    if (!text.includes(term)) continue

    // Bereits bekanntes Vokabular nicht erneut vorschlagen
    if (knownTerms.has(term)) continue

    // Kanonisches Ziel validieren
    let canonical: string | null = null
    if (e.type === 'vendor') {
      canonical = resolveVendorCanonical(e.canonical ?? '')
    } else if (e.type === 'category') {
      const c = normalize(e.canonical ?? '')
      canonical = Object.keys(PLATFORM_CATEGORY_KEYWORDS).includes(c) ? c : null
    } else if (e.type === 'usecase') {
      const c = normalize(e.canonical ?? '')
      canonical = USECASE_TYPES.has(c) ? c : null
    }
    if (!canonical) continue

    const key = `${e.type}|${canonical}|${term}`
    if (seen.has(key)) continue
    seen.add(key)

    out.push({ term: canonical, synonym: term, synonym_type: e.type })
  }
  return out
}
