// §3 Feld-Prior-Matrix — fix im Code, nicht admin-konfigurierbar (Leitentscheidung 5)
// Änderungen erfordern Rücksprache mit Daniel (Issue-Kommentar, Warten auf Freigabe).

export type EntityPrior = 'product' | 'capability' | 'none'
export type SignalPrior = 'industry' | 'usecase' | 'compliance' | 'annex_iii'
export type HarvestMode = 'primary' | 'conservative' | 'pass1_only' | true | false

export interface FieldPrior {
  key: string
  label: string
  /** true / 'primary' / 'conservative': sofort erntbar; 'pass1_only': nur nach Pass 1 */
  harvest: HarvestMode
  /** Welche Entitätsklasse erwartet diese Feld-Position? */
  entityPrior: EntityPrior
  /** Welche Signaltypen liefert dieses Feld für nachgelagerte Verarbeitung? */
  signalPrior: SignalPrior[]
  /** Multiplikator für Scoring-Konfidenz (0 = feld liefert keine Term-Kandidaten) */
  scoreWeight: number
  /** Compliance-Treffer aus diesem Feld zählen stärker als aus Fließtext */
  complianceBoost: boolean
}

export const FIELD_PRIORS: FieldPrior[] = [
  {
    key: 'title',
    label: 'Titel',
    harvest: 'pass1_only', // hohe Mehrdeutigkeit: Produkt vs. Projektname
    entityPrior: 'none',
    signalPrior: [],
    scoreWeight: 0.5,
    complianceBoost: false,
  },
  {
    key: 'problem',
    label: 'Problem',
    harvest: 'conservative',
    entityPrior: 'none',
    signalPrior: ['industry', 'usecase'],
    scoreWeight: 0.7,
    complianceBoost: false,
  },
  {
    key: 'solution',
    label: 'AI-Lösung',
    harvest: true,
    entityPrior: 'capability',
    signalPrior: ['usecase'],
    scoreWeight: 0.8,
    complianceBoost: false,
  },
  {
    key: 'data_sources',
    label: 'Datenquellen',
    harvest: 'primary', // höchste Konfidenz: typisch kurze Produktaufzählungen
    entityPrior: 'product',
    signalPrior: [],
    scoreWeight: 1.5,
    complianceBoost: false,
  },
  {
    key: 'stakeholders',
    label: 'Stakeholder',
    harvest: false, // keine Term-Kandidaten; liefert Branche + Anhang-III-Signal
    entityPrior: 'none',
    signalPrior: ['industry', 'annex_iii'],
    scoreWeight: 0,
    complianceBoost: false,
  },
  {
    key: 'kpis',
    label: 'KPIs',
    harvest: false, // Füllwort-Quelle (Metriken/Zahlen, keine Produkte)
    entityPrior: 'none',
    signalPrior: [],
    scoreWeight: 0,
    complianceBoost: false,
  },
  {
    key: 'risks',
    label: 'Risiken & Governance',
    harvest: false, // Compliance-Signale, keine Term-Kandidaten
    entityPrior: 'none',
    signalPrior: ['compliance'],
    scoreWeight: 0,
    complianceBoost: true,
  },
  {
    key: 'architecture',
    label: 'Technische Architektur',
    harvest: 'primary', // primäre Produktquelle neben Datenquellen
    entityPrior: 'product',
    signalPrior: ['usecase'],
    scoreWeight: 1.5,
    complianceBoost: false,
  },
  {
    key: 'next_steps',
    label: 'Nächste Schritte',
    harvest: false, // Aktionen, keine Produkte/Capabilities
    entityPrior: 'none',
    signalPrior: [],
    scoreWeight: 0,
    complianceBoost: false,
  },
]

export const FIELD_PRIOR_MAP: Record<string, FieldPrior> = Object.fromEntries(
  FIELD_PRIORS.map(f => [f.key, f]),
)

export function isHarvestField(prior: FieldPrior): boolean {
  return prior.harvest !== false
}
