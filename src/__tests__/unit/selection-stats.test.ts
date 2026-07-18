import { getSelectionStats } from '@/lib/architecture/selection'
import { runEamValidation, validateComponentOwners } from '@/config/architecture-rules'
import type { CatalogComponent, RasicMatrix } from '@/types'

const mkComp = (overrides: Partial<CatalogComponent>): CatalogComponent => ({
  id: 'test-id',
  name: 'Test Component',
  vendor: null,
  category: null,
  architecture_layer: 'model',
  hosting: ['eu'],
  dsgvo_status: 'compliant',
  eu_ai_act_risk: 'minimal',
  sap_compatible: false,
  sap_components: [],
  use_case_types: [],
  infra_types: ['cloud'],
  cloud_provider: 'independent',
  icon_name: null,
  website_url: null,
  description: null,
  tags: [],
  incompatible_with: [],
  requires: [],
  suggests: [], aliases: [],
  source: 'seed',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const catalog = [
  mkComp({ id: 'a', name: 'MLflow' }),
  mkComp({ id: 'b', name: 'Apache Kafka' }),
  mkComp({ id: 'c', name: 'Grafana' }),
  mkComp({ id: 'd', name: 'HashiCorp Vault' }),
]

describe('getSelectionStats — Gate D „Eine Zahl, eine Quelle" (#182)', () => {
  it('zählt die Nutzer-Auswahl, wenn vorhanden', () => {
    const stats = getSelectionStats({
      activeComponentNames: new Set(['MLflow', 'Grafana']),
      fallbackNames: ['Apache Kafka'],
      components: catalog,
    })
    expect(stats.activeCount).toBe(2)
    expect(stats.activeComponents.map(c => c.name).sort()).toEqual(['Grafana', 'MLflow'])
  })

  it('fällt bei leerer Auswahl auf die Empfehlungen zurück', () => {
    const stats = getSelectionStats({
      activeComponentNames: new Set(),
      fallbackNames: ['Apache Kafka', 'Grafana'],
      components: catalog,
    })
    expect(stats.activeCount).toBe(2)
    expect(stats.effectiveNames.has('Apache Kafka')).toBe(true)
  })

  it('filtert Vorschläge gegen aktive Auswahl (case-insensitiv), Ablehnungen und unbekannte Namen', () => {
    const stats = getSelectionStats({
      activeComponentNames: new Set(['MLflow']),
      components: catalog,
      aiSuggestions: ['mlflow', 'MLflow', 'Apache Kafka', 'Grafana', 'Unbekannt'],
      rejectedSuggestions: ['Grafana'],
    })
    // 'mlflow'/'MLflow' aktiv, 'Grafana' abgelehnt, 'Unbekannt' nicht im Katalog
    expect(stats.openSuggestions).toEqual(['Apache Kafka'])
    expect(stats.openSuggestionCount).toBe(1)
  })

  it('nach Accept sinkt openSuggestions überall gleich — eine Quelle für Panel UND Workbench', () => {
    const input = {
      activeComponentNames: new Set<string>(['MLflow']),
      components: catalog,
      aiSuggestions: ['Apache Kafka', 'Grafana'],
      rejectedSuggestions: [] as string[],
    }
    const before = getSelectionStats({ ...input, acceptedSuggestions: [] })
    expect(before.openSuggestionCount).toBe(2)

    const after = getSelectionStats({ ...input, acceptedSuggestions: ['Apache Kafka'] })
    // Panel-Sicht und Workbench-Sicht sind Aufrufe DERSELBEN Funktion mit denselben
    // Inputs — der Zähler kann nicht mehr divergieren (Vorfall: „3 Vorschläge" vs. „1 offen").
    expect(after.openSuggestionCount).toBe(1)
    expect(after.openSuggestions).toEqual(['Grafana'])
    expect(after.visibleSuggestions).toEqual(['Apache Kafka', 'Grafana'])
  })

  // Regression 18.07.2026: Vercel-Log bestätigte, dass die KI trotz Prompt-Vorgabe
  // ("nur der bloße Name") gelegentlich eine Begründung anhängt, z.B.
  // "SAP Analytics Cloud — for business stakeholder dashboards...". Ein reiner
  // Exact-Match verwarf solche Vorschläge komplett lautlos ("No further
  // suggestions", obwohl die KI etwas Sinnvolles vorgeschlagen hatte).
  it('erkennt KI-Vorschläge mit angehängter Begründung trotz fehlendem Exact-Match', () => {
    const stats = getSelectionStats({
      activeComponentNames: new Set(['MLflow']),
      components: catalog,
      aiSuggestions: [
        'Grafana — for observability across the ML pipeline',
        'HashiCorp Vault (for secrets management)',
        'Apache Kafka - for event streaming',
      ],
    })
    expect(stats.visibleSuggestions.sort()).toEqual(['Apache Kafka', 'Grafana', 'HashiCorp Vault'])
  })

  it('lässt bereits saubere KI-Vorschläge (ohne Begründung) unverändert', () => {
    const stats = getSelectionStats({
      activeComponentNames: new Set(['MLflow']),
      components: catalog,
      aiSuggestions: ['Grafana', 'Apache Kafka'],
    })
    expect(stats.visibleSuggestions.sort()).toEqual(['Apache Kafka', 'Grafana'])
  })

  it('verwirft Vorschläge, die auch nach Bereinigung nicht im Katalog stehen', () => {
    const stats = getSelectionStats({
      activeComponentNames: new Set(['MLflow']),
      components: catalog,
      aiSuggestions: ['Völlig unbekanntes Tool — with a long explanation'],
    })
    expect(stats.visibleSuggestions).toEqual([])
  })

  it('meldet Konflikte aus incompatible_with', () => {
    const conflicting = [
      mkComp({ id: 'x', name: 'A', incompatible_with: ['B'] }),
      mkComp({ id: 'y', name: 'B' }),
    ]
    const stats = getSelectionStats({
      activeComponentNames: new Set(['A', 'B']),
      components: conflicting,
    })
    expect(stats.conflictCount).toBe(1)
  })
})

describe('validateComponentOwners — 0-Komponenten-Fall ist ROT (#182)', () => {
  const rasic: RasicMatrix = {
    entries: [
      { role: 'AI Lead', assignments: { konzeption: 'R', daten: 'C', build: 'R', freigabe: 'A', betrieb: 'A' } },
    ],
    phases: ['konzeption', 'daten', 'build', 'freigabe', 'betrieb'],
  } as unknown as RasicMatrix

  it('failt mit eigenem Text bei 0 aktiven Komponenten', () => {
    const res = validateComponentOwners(rasic, [], 0)
    expect(res.passed).toBe(false)
    expect(res.message.de).toContain('unvollständig')
  })

  it('failt, wenn die RASIC-Matrix fehlt, aber Komponenten aktiv sind', () => {
    const res = validateComponentOwners(undefined, [mkComp({})], 1)
    expect(res.passed).toBe(false)
  })

  it('nutzt activeCount aus dem Selektor — nicht die Katalog-Matches (Vorfall: „✓ Keine Komponenten aktiv" neben „12 aktiv")', () => {
    // 12 Namen aktiv, aber 0 Katalog-Matches (Alt-Datensatz mit abweichenden Namen):
    // Regel darf NICHT grün „Keine Komponenten aktiv" melden.
    const res = validateComponentOwners(rasic, [], 12)
    expect(res.message.de).not.toContain('Keine Komponenten aktiv')
    expect(res.passed).toBe(true)
  })

  it('runEamValidation reicht activeCount an die Owner-Regel durch', () => {
    const results = runEamValidation(rasic, [], undefined, 0)
    const owners = results.find(r => r.ruleId === 'r2')
    expect(owners?.passed).toBe(false)
  })
})
