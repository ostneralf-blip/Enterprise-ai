import { readFileSync } from 'fs'
import { join } from 'path'
import deMessages from '../../../messages/de.json'
import enMessages from '../../../messages/en.json'

// Kennzeichnung KI-generierter Inhalte nach Art. 50 EU AI Act (verbindlich seit
// 02.08.2026). Diese Tests sichern zwei Richtungen ab:
//   1. Was aus einem Sprachmodell stammt, MUSS gekennzeichnet sein.
//   2. Was regelbasiert entsteht, darf NICHT als KI-generiert markiert werden —
//      eine falsche Kennzeichnung entwertet die echten Marker.

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')
const REPORTS = 'src/lib/pdf/meridian/reports'

describe('PDF-Report: sichtbare Kennzeichnung KI-generierter Abschnitte', () => {
  const report = read(`${REPORTS}/architecture-status.tsx`)

  it('kennzeichnet die KI-Einordnung (bestand bereits)', () => {
    expect(report).toContain('AiCalloutBlock')
    expect(report).toContain("t('badgeGenerated')")
  })

  it('kennzeichnet den Investitionsrahmen — stammt aus derselben KI-Generierung', () => {
    const block = report.split('data.investmentFramework &&')[1].split('data.decisionRecommendation')[0]
    expect(block).toContain('AiSectionEyebrow')
    expect(block).toContain("badgeLabel={t('badgeGenerated')}")
  })

  it('kennzeichnet die Empfehlung — war bis 02.08.2026 die auffälligste Lücke', () => {
    const block = report.split('data.decisionRecommendation &&')[1].split('keyDecisionsLabel')[0]
    expect(block).toContain('AiSectionEyebrow')
    expect(block).toContain("badgeLabel={t('badgeGenerated')}")
  })

  it('zeigt die Offenlegungs-Fußnote nur, wenn der Report KI-Inhalte führt', () => {
    expect(report).toContain('hasAiContent && <AiDisclosureNote')
    expect(report).toMatch(
      /const hasAiContent = Boolean\(data\.aiSummary \|\| data\.decisionRecommendation \|\| data\.investmentFramework\)/
    )
  })
})

describe('PDF-Report: maschinenlesbare Kennzeichnung (Art. 50 Abs. 2)', () => {
  const report = read(`${REPORTS}/architecture-status.tsx`)

  it('schreibt einen Marker in die Dokument-Metadaten', () => {
    expect(report).toContain('ai-generated-content=partial')
    expect(report).toContain('eu-ai-act-article=50')
  })

  it('markiert einen Report OHNE KI-Inhalt ausdrücklich als solchen', () => {
    // Nicht einfach weglassen: Ein fehlender Marker wäre nicht von „noch nicht
    // umgesetzt" zu unterscheiden.
    expect(report).toContain('ai-generated-content=none')
  })

  it('macht den Marker vom tatsächlichen Inhalt abhängig, nicht statisch', () => {
    const docTag = report.split('<Document')[1].split('>')[0]
    expect(docTag).toContain('hasAiContent')
  })
})

describe('Keine Überkennzeichnung: regelbasierte Reports bleiben unmarkiert', () => {
  // Diese Reports entstehen ohne Sprachmodell (Scores, Checklisten, Quadranten).
  const RULE_BASED = ['readiness.tsx', 'usecase-portfolio.tsx', 'compliance-status.tsx', 'roadmap-status.tsx']

  it.each(RULE_BASED)('%s wird nicht als KI-generiert ausgewiesen', (file) => {
    const src = read(`${REPORTS}/${file}`)
    expect(src).not.toContain('ai-generated-content=partial')
    expect(src).not.toContain('AiSectionEyebrow')
  })
})

describe('Datenschutzerklärung: KI-Verarbeitung ist offengelegt (DSGVO Art. 13)', () => {
  const page = read('src/app/[locale]/datenschutz/page.tsx')

  it('hat einen eigenen Abschnitt zu KI-gestützten Auswertungen in beiden Sprachen', () => {
    expect(page).toContain('5. KI-gestützte Auswertungen')
    expect(page).toContain('5. AI-assisted analyses')
  })

  it('nennt Amazon Bedrock als Empfänger in der Verarbeitertabelle', () => {
    const rows = page.match(/Amazon Web Services \(Amazon Bedrock\)/g) ?? []
    expect(rows.length).toBe(2) // DE und EN
  })

  it('nennt die Verarbeitungsregion — muss zu BEDROCK_REGION passen', () => {
    // Produktionswert am 02.08.2026 verifiziert: eu-west-1. Ändert sich die Region,
    // wird dieser Test rot und der Rechtstext muss mitgezogen werden.
    expect(page).toContain('eu-west-1')
    expect(page).toContain('Irland')
    expect(page).toContain('Ireland')
  })

  it('nennt Rechtsgrundlage, Speicherdauer und die Kennzeichnung nach Art. 50', () => {
    expect(page).toContain('Art. 6 Abs. 1')
    expect(page).toContain('Art. 6(1)(b) GDPR')
    expect(page).toContain('24 Stunden')
    expect(page).toContain('Art. 50 EU AI Act')
  })

  it('behauptet die Nicht-Nutzung zum Training nur als Angabe von AWS, nicht als eigene Zusage', () => {
    // Wir können das nicht selbst garantieren — die Formulierung muss die Quelle nennen.
    expect(page).toMatch(/Nach den Angaben von Amazon Web\s+Services/)
    expect(page).toMatch(/According to Amazon Web Services/)
  })
})

describe('Offenlegungstext ist zweisprachig gepflegt', () => {
  const de = deMessages.reports.architectureStatus as Record<string, string>
  const en = enMessages.reports.architectureStatus as Record<string, string>

  it('existiert in beiden Sprachen', () => {
    expect(de.aiDisclosureNote?.trim().length).toBeGreaterThan(0)
    expect(en.aiDisclosureNote?.trim().length).toBeGreaterThan(0)
  })

  it('nennt die Rechtsgrundlage, damit der Hinweis einordbar ist', () => {
    expect(de.aiDisclosureNote).toContain('Art. 50')
    expect(en.aiDisclosureNote).toContain('Article 50')
  })

  it('ist tatsächlich übersetzt und nicht kopiert', () => {
    expect(de.aiDisclosureNote).not.toBe(en.aiDisclosureNote)
  })
})
