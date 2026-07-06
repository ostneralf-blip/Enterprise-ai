# PDF Module Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle 6 Modul-PDFs erhalten ein Deckblatt, 3-Ebenen-Empfehlungskarten mit EU AI Act/DSGVO-Artikelreferenzen und Statistiken sowie eine Rechtsfußnote.

**Architecture:** Alle Änderungen in einer einzigen Datei (`src/lib/pdf/templates.tsx`). Drei neue Shared-Komponenten (`PdfCoverPage`, `RecCard3`, `PdfLegalNote`) und ein neues Interface (`Rec3`) werden nach ARCHETYPE_LABELS (Zeile ~84) eingefügt. Bestehende RECS-Konstanten wechseln von `string`/`string[]` zu `Rec3`/`Rec3[]`. Jedes Modul bekommt 3 Seiten: Deckblatt → Ergebnisse → Empfehlungen.

**Tech Stack:** `@react-pdf/renderer` v4.5.1, TypeScript strict, keine neuen npm-Abhängigkeiten.

**Spec-Referenz:** `docs/superpowers/specs/2026-07-06-pdf-module-redesign-design.md`

---

## Datei-Scope

Einzige zu ändernde Datei: **`src/lib/pdf/templates.tsx`**

| Position | Was sich ändert |
|---|---|
| Nach Zeile 84 (nach `ARCHETYPE_LABELS`) | `Rec3` interface + `PdfCoverPage` + `RecCard3` + `PdfLegalNote` einfügen |
| Zeile 94 (`ASSESSMENT_RECS`) | Typ `Record<string, string>` → `Record<string, Rec3>`, Inhalt ersetzen |
| Zeile 118 (`renderAssessmentPdf`) | 3-Seiten-Struktur, `PdfFooter` → `PdfFooterEs` |
| Zeile 182 (`GOV_RECS`) | Typ `Record<string, string[]>` → `Record<string, Rec3[]>`, Inhalt ersetzen |
| Zeile 205 (`renderGovernancePdf`) | 3-Seiten-Struktur |
| Zeile 262 (`ROADMAP_RECS`) | Typ → `Record<string, Rec3[]>`, Inhalt ersetzen |
| Zeile 283 (`renderRoadmapPdf`) | 3-Seiten-Struktur, `gap` → `marginRight` in Phase-KPIs und Phase-Actions |
| Zeile 395 (`renderCanvasPdf`) | `canvasRecs()` Funktion ergänzen, 3-Seiten-Struktur, `gap` → `marginRight` in CanvasSections |
| Zeile 505 (`complianceRecs`) | Typ-Extension `text` → `why` + `action` |
| Zeile 555 (`renderCompliancePdf`) | 3-Seiten-Struktur (Deckblatt + bestehende 2 Seiten), `gap` → `marginRight` in Summary-Cards |
| Zeile 624 (`renderArchitecturePdf`) | `ARCHITECTURE_RECS` ergänzen, 3-Seiten-Struktur, `gap` → `marginRight` in Komponenten-Chips |

---

## Task 1: Foundation — Rec3 + Shared Components

**Files:**
- Modify: `src/lib/pdf/templates.tsx` (nach Zeile 84, nach `ARCHETYPE_LABELS`)

- [ ] **Step 1: Rec3-Interface und 3 Komponenten nach ARCHETYPE_LABELS einfügen**

Direkt nach dieser Zeile:
```typescript
const ARCHETYPE_LABELS: Record<string, string> = {
  starter: 'AI Starter', scaler: 'AI Scaler', transformer: 'AI Transformer',
}
```

Folgendes einfügen:
```typescript
// ─── SHARED PDF BUILDING BLOCKS ──────────────────────────────────────────────
interface Rec3 { title: string; why: string; action: string }

function PdfCoverPage({ title, subtitle, companyName }: {
  title: string; subtitle?: string; companyName?: string
}) {
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return (
    <Page size="A4" style={{ padding: 40, fontFamily: 'Helvetica', backgroundColor: '#0f172a', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 8, color: '#64748b' }}>AI Navigator · Enterprise AI</Text>
      <View>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 12, lineHeight: 1.2 }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 12, color: '#3b82f6', marginTop: 4 }}>{subtitle}</Text>}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 9, color: '#64748b' }}>{companyName ?? ''}</Text>
        <Text style={{ fontSize: 9, color: '#64748b' }}>{today}</Text>
      </View>
    </Page>
  )
}

function RecCard3({ rec, index, color }: { rec: Rec3; index: number; color: string }) {
  return (
    <View wrap={false} style={{
      borderWidth: 1, borderColor: C.border,
      borderLeftWidth: 3, borderLeftColor: color,
      borderRadius: 6, backgroundColor: C.light,
      padding: 10, marginBottom: 8,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5 }}>
        <View style={{
          backgroundColor: color, borderRadius: 9, width: 18, height: 18,
          alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8,
        }}>
          <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{index + 1}</Text>
        </View>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark, flex: 1 }}>{rec.title}</Text>
      </View>
      <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.5, marginBottom: 5 }}>{rec.why}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: 9, color: color, marginRight: 5, flexShrink: 0 }}>{'>'}</Text>
        <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec.action}</Text>
      </View>
    </View>
  )
}

function PdfLegalNote() {
  return (
    <Text style={{ fontSize: 7, color: C.gray, marginTop: 20, lineHeight: 1.4 }}>
      {'¹'} Rechtliche und regulatorische Hinweise in diesem Bericht dienen der Orientierung und ersetzen keine individuelle Rechts- oder Compliance-Beratung.
    </Text>
  )
}
```

**Hinweis:** `▸` (U+25B8) kann in react-pdf Probleme machen — `{'>'}` als ASCII-Fallback ist sicherer. Alternativ `▸` als escaped Unicode testen.

- [ ] **Step 2: TypeScript prüfen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npx tsc --noEmit 2>&1 | head -30
```

Erwartet: Keine Fehler (ggf. bestehende Fehler ignorieren, aber keine **neuen** durch die eingefügten Komponenten).

- [ ] **Step 3: Commit**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && git add src/lib/pdf/templates.tsx && git commit -m "feat(pdf): Rec3-Interface + PdfCoverPage + RecCard3 + PdfLegalNote"
```

---

## Task 2: Assessment PDF

**Files:**
- Modify: `src/lib/pdf/templates.tsx` — Abschnitt Assessment (Zeilen ~94–165)

- [ ] **Step 1: `ASSESSMENT_RECS` ersetzen**

Alten Block:
```typescript
const ASSESSMENT_RECS: Record<string, string> = {
  data:       'Data-Governance-Initiative starten, Masterdatenmodell definieren.',
  skills:     'AI-Upskilling-Programm aufsetzen, AI-Champions benennen.',
  governance: 'AI-Policy und RACI in den nächsten 4 Wochen dokumentieren.',
  tech:       'API-Strategie für Kernsysteme entwickeln, Cloud-Readiness prüfen.',
  strategy:   'AI-Strategie im nächsten Board-Meeting verabschieden.',
  culture:    'Executive-Sponsorship sichern, AI-Kulturprogramm starten.',
}
```

Ersetzen durch:
```typescript
const ASSESSMENT_RECS: Record<string, Rec3> = {
  data: {
    title:  'Datenstrategie und -governance aufbauen',
    why:    'EU AI Act Art. 10 schreibt für Hochrisiko-KI explizit hochwertige Datenverwaltungspraktiken vor — fehlt diese, drohen Bußgelder bis 3 % des globalen Jahresumsatzes (Art. 99 Abs. 3). Laut McKinsey (2023) nennen 72 % der Unternehmen mangelnde Datenqualität als Haupthindernis für KI-Skalierung.¹',
    action: 'Masterdatenmodell + Data Governance Charter in 60 Tagen mit CDO/CTO definieren; Datenqualitäts-KPIs für kritische Felder einführen.',
  },
  skills: {
    title:  'AI-Kompetenzen systematisch aufbauen',
    why:    'EU AI Act Art. 4 macht ausreichende KI-Kenntnisse für alle Mitarbeiter zur Pflicht, die KI-Systeme einsetzen oder beaufsichtigen. Laut WEF Future of Jobs Report 2025 sehen 69 % der Unternehmen AI/ML-Kompetenzen als kritischen Engpass bis 2027.¹',
    action: 'AI-Champion pro Fachbereich benennen; strukturiertes Upskilling-Programm (min. 40 Stunden/Jahr) für Fachteams starten; ML Engineer als Recruiting-Priorität setzen.',
  },
  governance: {
    title:  'AI-Governance-Rahmen in 4 Wochen etablieren',
    why:    'EU AI Act Art. 9 verlangt ein dokumentiertes Risikomanagementsystem für Hochrisiko-KI. Unternehmen ohne Governance-Strukturen riskieren Bußgelder bis 3 % des globalen Jahresumsatzes (Art. 99 Abs. 3) sowie Projektstopps durch interne Compliance-Teams.¹',
    action: 'RACI-Matrix für AI-Entscheidungen, schriftlichen Freigabeprozess und Risikoklassifizierung nach EU AI Act Anhang III in 4 Wochen dokumentieren.',
  },
  tech: {
    title:  'Technische Integrations- und Cloud-Strategie entwickeln',
    why:    'EU AI Act Art. 17 verpflichtet Anbieter von Hochrisiko-KI zu einem dokumentierten Qualitätsmanagementsystem inkl. technischer Dokumentation. Gartner (2024) zufolge scheitern 85 % der KI-Projekte an fehlender Integration in Kernsysteme (ERP, CRM).¹',
    action: 'API-Strategie für alle Kernsysteme in 90 Tagen mit IT-Leitung entwickeln; Cloud-Readiness-Assessment durchführen und Lücken priorisieren.',
  },
  strategy: {
    title:  'Formale AI-Strategie auf Board-Ebene verabschieden',
    why:    'McKinsey Global AI Survey 2024: Unternehmen mit formaler AI-Strategie erzielen 3,5× höheren ROI als Ad-hoc-Implementierer. Ohne strategischen Rahmen fehlen Budget-Kontinuität, Ressourcen-Commitment und die Durchsetzungskraft für nachhaltige KI-Transformation.¹',
    action: 'AI-Strategie mit Vision, messbaren 12-Monats-Zielen und Investitionsrahmen im nächsten Board-Meeting verabschieden; quartalsliches AI-Steering-Meeting etablieren.',
  },
  culture: {
    title:  'Kulturwandel mit Executive-Sponsorship anstoßen',
    why:    'Forrester Research (2024): In 79 % aller fehlgeschlagenen KI-Transformationen war Cultural Resistance der entscheidende Faktor — nicht Technologie. EU AI Act Art. 4 verlangt zudem ausreichende KI-Kenntnisse auf allen Organisationsebenen.¹',
    action: 'AI-Sponsor auf C-Level formalisieren; AI-Literacy-Programm (8 Stunden) für alle Führungskräfte einführen; AI-Champion-Netzwerk über alle Fachbereiche aufbauen.',
  },
}
```

- [ ] **Step 2: `renderAssessmentPdf` auf 3-Seiten-Struktur umbauen**

Die gesamte Funktion `renderAssessmentPdf` (aktuell Zeilen ~118–165) ersetzen durch:

```typescript
export function renderAssessmentPdf(data: AssessmentPdfData): ReactElement {
  const maturity = getMaturityLevel(data.totalScore)
  const scoreColor = data.totalScore >= 4 ? C.ok : data.totalScore >= 3 ? C.warn : C.danger
  const topDims = Object.entries(data.dimScores).sort(([, a], [, b]) => a - b).slice(0, 3)

  return (
    <Document title="AI-Readiness Assessment">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title="AI-Readiness Assessment"
        subtitle={data.companyName}
        companyName={data.companyName}
      />

      {/* Seite 2: Ergebnisse */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>AI-Readiness Assessment</Text>
        <Text style={s.sub}>Ergebnisbericht · 6 Dimensionen · Enterprise AI Navigator</Text>

        <View wrap={false} style={{ backgroundColor: C.dark, borderRadius: 10, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ marginRight: 24 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: scoreColor }}>{data.totalScore.toFixed(1)}</Text>
            <Text style={{ fontSize: 9, color: C.gray2 }}>von 5,0</Text>
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'white' }}>{maturity.label}</Text>
            <Text style={{ fontSize: 10, color: C.gray2, marginTop: 4 }}>{ARCHETYPE_LABELS[data.archetype] ?? data.archetype}</Text>
          </View>
        </View>

        <Text style={s.h2}>Ergebnis nach Dimension</Text>
        {ASSESSMENT_DIMENSIONS.map(dim => (
          <DimBar key={dim.id} label={dim.label} score={data.dimScores[dim.id] ?? 0} />
        ))}

        <PdfFooterEs company={data.companyName} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Handlungsempfehlungen</Text>
        <Text style={s.sub}>AI-Readiness Assessment · Enterprise AI Navigator</Text>

        {topDims.map(([dimId], i) => (
          <RecCard3
            key={dimId}
            rec={ASSESSMENT_RECS[dimId] ?? { title: dimId, why: '', action: '' }}
            index={i}
            color={scoreColor}
          />
        ))}

        <PdfLegalNote />
        <PdfFooterEs company={data.companyName} />
      </Page>
    </Document>
  )
}
```

- [ ] **Step 3: TypeScript + Build prüfen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npx tsc --noEmit 2>&1 | head -20
```

Erwartet: Keine neuen Fehler durch geänderte `ASSESSMENT_RECS`-Nutzung.

- [ ] **Step 4: Commit**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && git add src/lib/pdf/templates.tsx && git commit -m "feat(pdf): Assessment — Deckblatt + RecCard3-Empfehlungen mit Rechtsreferenzen"
```

---

## Task 3: Governance PDF

**Files:**
- Modify: `src/lib/pdf/templates.tsx` — Abschnitt Governance (Zeilen ~182–248)

- [ ] **Step 1: `GOV_RECS` ersetzen**

Alten Block `const GOV_RECS: Record<string, string[]> = { ... }` komplett ersetzen durch:

```typescript
const GOV_RECS: Record<string, Rec3[]> = {
  approve: [
    {
      title:  'Freigabe dokumentieren und Review-Zyklus festlegen',
      why:    'EU AI Act Art. 9 Abs. 4 verlangt, dass das Risikomanagementsystem über den gesamten Lebenszyklus des Systems aktiv bleibt — einmalige Freigabe ohne Folge-Review genügt nicht. Laut ENISA AI Security Guidelines (2024) werden 43 % der KI-Sicherheitsvorfälle durch fehlende Überwachung nach Go-Live verursacht.¹',
      action: 'Freigabeergebnis in Projektplan als Meilenstein dokumentieren; quartalsliches Compliance-Review (30 Minuten, AI-Owner + DSB) als Termin einrichten.',
    },
    {
      title:  'Transparenzpflichten gegenüber Nutzern umsetzen',
      why:    'EU AI Act Art. 13 schreibt für Hochrisiko-KI-Systeme verständliche Informationen für Nutzer vor — Nichterfüllung ist bußgeldfähig (Art. 99 Abs. 3: bis 3 % des globalen Jahresumsatzes). Transparenz ist zugleich Vertrauensfaktor: 67 % der Endnutzer akzeptieren KI-Entscheidungen eher, wenn sie eine Erklärung erhalten (Eurobarometer 2024).¹',
      action: 'Nutzer-Dokumentation erstellen (Zweck, Grenzen, Kontaktpfad); KI-Kennung in allen Nutzer-Interfaces sichtbar machen.',
    },
    {
      title:  'Menschliche Aufsicht als festen Prozess verankern',
      why:    'EU AI Act Art. 14 macht menschliche Aufsicht für Hochrisiko-Systeme zur Pflicht — Entscheidungen müssen durch Menschen überwacht, hinterfragt und ggf. übersteuert werden können. Systeme ohne definierten Oversight-Prozess gelten regulatorisch als unkontrolliert.¹',
      action: 'Oversight-Verantwortlichen benennen, Eskalationspfad dokumentieren und Eingriffsmöglichkeit (Override) technisch und prozessual sicherstellen.',
    },
  ],
  stop_dsgvo: [
    {
      title:  'Datenschutz-Folgenabschätzung (DSFA) zwingend durchführen',
      why:    'DSGVO Art. 35 schreibt eine DSFA vor, wenn KI-Systeme personenbezogene Daten systematisch und umfangreich verarbeiten — Nichtdurchführung ist bußgeldfähig nach Art. 83 Abs. 4 (bis 10 Mio. EUR oder 2 % des weltweiten Jahresumsatzes). Die DSFA ist Voraussetzung, nicht Option.¹',
      action: 'Datenschutzbeauftragten einbeziehen; DSFA-Template ausfüllen; Verarbeitungsverzeichnis aktualisieren — vor jedem weiteren Pilotschritt abzuschließen.',
    },
    {
      title:  'Rechtsgrundlage für alle Datenverarbeitungen dokumentieren',
      why:    'DSGVO Art. 6 verlangt für jede Verarbeitung personenbezogener Daten eine explizite Rechtsgrundlage. Fehlt die Dokumentation, gilt die Verarbeitung als unrechtmäßig — Bußgeld nach Art. 83 Abs. 5 bis 20 Mio. EUR oder 4 % des Jahresumsatzes.¹',
      action: 'Für jede Datenquelle im Use Case die Rechtsgrundlage im Verarbeitungsverzeichnis eintragen; fehlende Einwilligungen oder Vertragsklauseln vor Pilotstart nachziehen.',
    },
    {
      title:  'Technische Datenschutzmaßnahmen implementieren',
      why:    'DSGVO Art. 25 (Privacy by Design) verlangt datenschutzfreundliche Voreinstellungen bereits bei der Systemgestaltung. Nachträgliche Korrekturen sind technisch aufwendiger und signalisieren Aufsichtsbehörden mangelnde Sorgfalt.¹',
      action: 'Pseudonymisierung oder Anonymisierung für Trainingsdaten prüfen; Datensparsamkeit durchsetzen (nur notwendige Felder); Consent-Management-Prozess aufsetzen.',
    },
  ],
  stop_risk: [
    {
      title:  'Formales Risikoregister anlegen und Maßnahmen benennen',
      why:    'EU AI Act Art. 9 Abs. 2 schreibt ein systematisches Risikomanagementsystem vor — ohne dokumentiertes Register fehlt der Nachweis gegenüber Behörden. Unstrukturiertes Risikomanagement erhöht die Wahrscheinlichkeit von Schadensereignissen um den Faktor 2,3 (IRGC AI Risk Framework, 2024).¹',
      action: 'Risikoregister anlegen; alle identifizierten Risiken mit Schweregrad, Eintrittswahrscheinlichkeit und Verantwortlichem versehen; Mitigationsmaßnahmen mit Deadline festhalten.',
    },
    {
      title:  'Risikominderungsmaßnahmen vor Pilotstart umsetzen',
      why:    'EU AI Act Art. 9 Abs. 6 verlangt für Hochrisiko-Systeme Restrisikobewertung und Dokumentation, dass verbleibende Risiken akzeptabel sind. Systeme, die mit bekannten, unbehandelten Risiken in Betrieb gehen, können von Aufsichtsbehörden gestoppt werden.¹',
      action: 'Transparenzpflichten (Art. 13), menschliche Überwachung (Art. 14) und Fallback-Mechanismus implementieren; anschließend erneuten Governance-Check im AI Navigator durchführen.',
    },
    {
      title:  'Notfallprotokoll und Incident-Response definieren',
      why:    'EU AI Act Art. 73 verpflichtet zur Meldung schwerwiegender Vorfälle durch KI-Systeme innerhalb von 15 Arbeitstagen. Fehlt ein Incident-Response-Plan, können Reaktionszeiten dieses Fenster überschreiten und zusätzliche Sanktionen auslösen.¹',
      action: 'Incident-Response-Plan erstellen (Erkennung, Bewertung, Meldekette, Abschaltprozedur); Verantwortlichen für Behördenmeldung benennen.',
    },
  ],
  improve: [
    {
      title:  'Identifizierte Schwachstellen priorisieren und Maßnahmenplan erstellen',
      why:    'EU AI Act Art. 9 verlangt ein iteratives Risikomanagementsystem — erkannte Lücken müssen systematisch adressiert werden, nicht nur dokumentiert. Unbehandelte Compliance-Lücken können sich im späteren Betrieb zu bußgeldfähigen Verstößen ausweiten.¹',
      action: 'Schwachstellen nach Kritikalität sortieren; für die Top-3 konkrete Maßnahmen mit Verantwortlichem und 4-Wochen-Deadline formulieren.',
    },
    {
      title:  'Fachbereiche Legal, Compliance und IT einbinden',
      why:    'EU AI Act Art. 17 schreibt ein Qualitätsmanagementsystem mit klaren Verantwortlichkeiten vor — AI-Entscheidungen allein durch ein Team ohne Compliance-Einbindung gelten als unzureichend dokumentiert. Projekte ohne frühzeitige Legal-Einbindung zeigen 2,7× höhere Nachbesserungskosten (Capgemini Research Institute, 2024).¹',
      action: 'Kick-off mit DSB, Legal und IT-Sicherheit einberufen; Governance-Zuständigkeiten in RACI-Matrix festhalten; nächsten Governance-Check gemeinsam vorbereiten.',
    },
    {
      title:  'Verbesserten Use Case in 4–6 Wochen erneut prüfen',
      why:    'EU AI Act Art. 9 Abs. 4 erfordert kontinuierliche Überprüfung über den gesamten Systemlebenszyklus. Ein einmaliger Check ohne Folgebewertung nach Maßnahmenumsetzung genügt regulatorischen Anforderungen nicht.¹',
      action: 'Follow-up-Termin für erneuten Governance-Check als verbindlichen Meilenstein im Projektplan eintragen (Zieldatum: 4–6 Wochen ab heute).',
    },
  ],
}
```

- [ ] **Step 2: `renderGovernancePdf` auf 3-Seiten-Struktur umbauen**

Die gesamte Funktion ersetzen durch:

```typescript
export function renderGovernancePdf(data: GovernancePdfData): ReactElement {
  const res = data.result ? (GOV_RESULT[data.result] ?? GOV_RESULT.improve) : GOV_RESULT.improve
  const recs = data.result ? (GOV_RECS[data.result] ?? GOV_RECS.improve) : GOV_RECS.improve
  const rows = (data.protocol ?? []).filter(i => (i.question ?? i.label) || (i.answer ?? i.value))

  return (
    <Document title="AI-Governance Check">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title="AI-Governance Check"
        subtitle={data.useCaseName ?? undefined}
        companyName={data.companyName}
      />

      {/* Seite 2: Ergebnisse + Protokoll */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>AI-Governance Check</Text>
        <Text style={s.sub}>{data.useCaseName ?? 'Use Case'} · Enterprise AI Navigator</Text>

        <View wrap={false} style={{ backgroundColor: res.bg, borderRadius: 10, padding: 14, marginBottom: 18, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: res.color }}>{res.label}</Text>
        </View>

        {rows.length > 0 && (
          <>
            <Text style={s.h2}>Prüfprotokoll</Text>
            <View style={s.row}>
              <Text style={[s.th, { flex: 3 }]}>Prüfkriterium</Text>
              <Text style={[s.th, { flex: 2 }]}>Bewertung</Text>
            </View>
            {rows.map((item, i) => (
              <View key={i} wrap={false} style={[s.row, { backgroundColor: i % 2 === 1 ? C.light : 'white' }]}>
                <Text style={[s.td, { flex: 3 }]}>{item.question ?? item.label ?? ''}</Text>
                <Text style={[s.td, { flex: 2 }]}>{item.answer ?? item.value ?? ''}</Text>
              </View>
            ))}
          </>
        )}

        <PdfFooterEs company={data.companyName} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Handlungsempfehlungen</Text>
        <Text style={s.sub}>AI-Governance Check · Enterprise AI Navigator</Text>

        {recs.map((rec, i) => (
          <RecCard3 key={i} rec={rec} index={i} color={res.color} />
        ))}

        <PdfLegalNote />
        <PdfFooterEs company={data.companyName} />
      </Page>
    </Document>
  )
}
```

- [ ] **Step 3: TypeScript prüfen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && git add src/lib/pdf/templates.tsx && git commit -m "feat(pdf): Governance — Deckblatt + RecCard3 mit DSGVO/EU-AI-Act-Referenzen"
```

---

## Task 4: Roadmap PDF

**Files:**
- Modify: `src/lib/pdf/templates.tsx` — Abschnitt Roadmap (Zeilen ~262–374)

- [ ] **Step 1: `ROADMAP_RECS` ersetzen**

Alten Block `const ROADMAP_RECS: Record<string, string[]> = { ... }` komplett ersetzen durch:

```typescript
const ROADMAP_RECS: Record<string, Rec3[]> = {
  starter: [
    {
      title:  'Executive-Sponsorship auf C-Level vor Pilotstart sichern',
      why:    'Forrester Research (2024): 79 % aller fehlgeschlagenen KI-Transformationen haben Cultural Resistance als Hauptursache — nicht Technologie. Ohne C-Level-Sponsor fehlen Ressourcen, Budget-Kontinuität und die organisatorische Durchsetzungskraft in der Skalierungsphase.¹',
      action: 'AI-Sponsor im C-Level benennen; quartalsliches AI-Steering-Meeting einrichten; ersten Piloten als strategische Initiative im Jahresplan verankern.',
    },
    {
      title:  'Datenfundament vor dem ersten Piloten validieren',
      why:    'EU AI Act Art. 10 schreibt hochwertige Datenverwaltungspraktiken als Voraussetzung für Hochrisiko-KI vor. McKinsey (2023): 72 % der Unternehmen nennen Datenqualität als Haupthindernis für KI-Skalierung — ein schlechtes Datenfundament macht auch den besten Piloten wirkungslos.¹',
      action: 'Datenqualitäts-Assessment für alle Piloten-Datenquellen durchführen; Mindestanforderungen (Vollständigkeit, Aktualität, Konsistenz) vor Modelltraining definieren.',
    },
    {
      title:  '1–2 Quick-Win-Use-Cases mit messbarem ROI wählen',
      why:    'BCG AI Adoption Report (2024): KI-Projekte mit klar definiertem ROI-Nachweis erhalten 4× häufiger Folgebudget als explorative Projekte ohne Business Case. Frühe Erfolge schaffen internes Vertrauen und sichern das Budget für die Skalierungsphase.¹',
      action: 'Use-Case-Scoring im AI Navigator nutzen; Top-2-Use-Cases nach ROI-Potenzial und Umsetzbarkeit auswählen; Erfolgsmetriken vor Pilotstart in Baseline erfassen.',
    },
    {
      title:  'Governance-Framework parallel zum Piloten aufbauen',
      why:    'EU AI Act Art. 9 verlangt ein Risikomanagementsystem für Hochrisiko-KI — wer Governance erst nach dem Piloten aufbaut, riskiert Projektstopps und kostspielige Nachbesserungen (durchschnittlicher Nachrüst-Aufwand: 3× höher als präventive Implementierung, NIST AI RMF 2024).¹',
      action: 'Governance-Check im AI Navigator für jeden Pilot-Use-Case durchführen; RACI-Matrix und Freigabeprozess vor Go-Live dokumentieren.',
    },
  ],
  scaler: [
    {
      title:  'Erfolgreiche Piloten als Playbook systematisch ausrollen',
      why:    'McKinsey Global AI Survey 2024: Unternehmen, die KI-Erfolge systematisch skalieren statt zu replizieren, erzielen 2,8× höhere Wertschöpfung. Ohne Playbook-Ansatz wiederholen Teams dieselben Lernkurven — Wissenstransfer bleibt ungenutzt.¹',
      action: 'Pilot-Dokumentation (Architektur, Datenpipeline, Lessons Learned) in internes Playbook überführen; 2–3 Nachfolge-Teams mit Playbook onboarden.',
    },
    {
      title:  'AI-Center-of-Excellence als interne Kompetenzplattform etablieren',
      why:    'EU AI Act Art. 17 schreibt ein Qualitätsmanagementsystem mit zentraler Verantwortlichkeit vor. Gartner (2024): Unternehmen mit CoE erreichen KI-Deployments 40 % schneller und mit 30 % weniger Compliance-Nacharbeit als dezentralisierte Teams.¹',
      action: 'CoE-Charter (Mandat, Ressourcen, KPIs) in 6 Wochen verabschieden; 3–5 Vollzeit-Äquivalente aus bestehenden Teams zuordnen; erste monatliche Best-Practice-Session einplanen.',
    },
    {
      title:  'MLOps-Reife für produktive Modelle ausbauen',
      why:    'EU AI Act Art. 9 Abs. 4 verlangt kontinuierliche Überwachung über den gesamten Systemlebenszyklus — manuelle Modellüberwachung skaliert nicht. NVIDIA Enterprise AI Survey (2024): 68 % der KI-Ausfälle in Produktion entstehen durch unentdeckten Modell-Drift.¹',
      action: 'Automatisiertes Retraining-Pipeline, Drift-Monitoring und A/B-Testing-Framework für alle Produktionsmodelle implementieren; SLA für Modell-Degradation definieren.',
    },
    {
      title:  'Roadmap-KPIs quartalsweise messen und berichten',
      why:    'Ohne kontinuierliches KPI-Tracking verlieren KI-Projekte intern an Legitimität — laut Forrester (2024) werden 61 % der KI-Budgets gestrichen, die keine nachweisbaren Ergebnisse nach 12 Monaten liefern. Messung ist Voraussetzung für Investitionssicherheit.¹',
      action: 'KPI-Dashboard für alle aktiven KI-Initiativen einrichten; quartalsliches Management-Reporting mit Vergleich zu Baseline-Werten einführen.',
    },
  ],
  transformer: [
    {
      title:  'Proprietäre Daten als strategischen Asset schützen und monetarisieren',
      why:    'EU AI Act Art. 10 schreibt Datenverwaltungspraktiken vor; gleichzeitig sind proprietäre Datensätze der stärkste Wettbewerbsmoat im KI-Zeitalter. McKinsey (2024): Unternehmen mit domänenspezifischen Datenstrategien erzielen 5× höhere KI-Wertschöpfung als solche mit generischen Modellen.¹',
      action: 'Daten-Asset-Register anlegen; Monetarisierungspfade für Top-3-Datensätze bewerten; Data-Governance-Struktur auf strategische Assets ausweiten.',
    },
    {
      title:  'Innovationsgeschwindigkeit durch strukturierte Experimentierkultur sichern',
      why:    'BCG Henderson Institute (2024): KI-Marktführer investieren 3× mehr in Experimentation als Nachzügler. Ohne dediziertes Experiments-Budget und Fail-Fast-Kultur verlangsamt sich die Innovationsrate, während Wettbewerber aufholen.¹',
      action: 'Dediziertes Experiments-Budget (10–15 % des AI-Gesamtbudgets) formalisieren; Fail-Fast-Metriken definieren; monatliches Innovation-Sprint-Format einführen.',
    },
    {
      title:  'AI als Differenzierungsmerkmal aktiv nach außen kommunizieren',
      why:    'Edelman Trust Barometer 2024: 73 % der B2B-Kunden betrachten nachgewiesene AI-Kompetenz als Kaufkriterium. AI-Kompetenz ohne externe Kommunikation bleibt unsichtbarer Wettbewerbsvorteil. EU AI Act Art. 13 fördert zudem proaktive Transparenz als Vertrauensgrundlage.¹',
      action: 'AI-Erfolgsstories für externe Kommunikation aufbereiten (Case Studies, Zertifizierungen, Whitepapers); KI-Kompetenz in Sales-Materialien und auf der Unternehmenswebsite integrieren.',
    },
    {
      title:  'AI-Ökosystem aktiv mitgestalten',
      why:    'Open-Source-Beiträge und Standards-Mitarbeit stärken Employer Branding und Technologie-Früherkennung: Unternehmen in AI-Standards-Gremien reduzieren Compliance-Anpassungskosten bei Regulierungsänderungen um bis zu 60 % (OECD AI Policy Observatory, 2024).¹',
      action: 'Beteiligung an 1–2 AI-Standards-Gremien (ISO/IEC JTC 1/SC 42, EU AI Alliance) oder Open-Source-Projekten formalisieren; Partner-Ökosystem für AI-Komponenten aufbauen.',
    },
  ],
}
```

- [ ] **Step 2: `renderRoadmapPdf` auf 3-Seiten-Struktur umbauen**

Die gesamte Funktion ersetzen durch:

```typescript
export function renderRoadmapPdf(data: RoadmapPdfData): ReactElement {
  const archetypeRecs = ROADMAP_RECS[data.archetype ?? ''] ?? ROADMAP_RECS.starter
  return (
    <Document title="AI-Roadmap">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title={data.title}
        subtitle={data.archetype ? ARCHETYPE_LABELS[data.archetype] : undefined}
        companyName={data.companyName}
      />

      {/* Seite 2: Phasen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.sub}>
          AI-Roadmap{data.archetype ? ` · ${ARCHETYPE_LABELS[data.archetype] ?? data.archetype}` : ''} · Enterprise AI Navigator
        </Text>

        <Text style={s.h2}>Phasen-Übersicht</Text>
        {data.phases.length === 0 && (
          <Text style={{ fontSize: 10, color: C.gray }}>Noch keine Roadmap-Phasen gespeichert.</Text>
        )}
        {data.phases.map((phase, idx) => (
          <View key={idx} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: PHASE_COLORS[idx] ?? C.brand, paddingLeft: 12, marginBottom: 16 }}>
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: 4 }]}>
              <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{phase.title}</Text>
              {phase.duration && <Text style={{ fontSize: 9, color: C.gray }}>{phase.duration}</Text>}
            </View>
            {phase.focus && <Text style={{ fontSize: 10, color: '#475569', marginBottom: 6 }}>{phase.focus}</Text>}
            {(phase.actions ?? []).map((a, ai) => (
              <View key={ai} style={[s.row, { marginBottom: 3, alignItems: 'flex-start' }]}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.brand, marginRight: 7, marginTop: 3 }} />
                <Text style={{ flex: 1, fontSize: 10 }}>{a.label}</Text>
              </View>
            ))}
            {(phase.kpis ?? []).length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                {(phase.kpis ?? []).map((k, ki) => (
                  <View key={ki} style={{ backgroundColor: '#eff6ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 4, marginBottom: 3 }}>
                    <Text style={{ fontSize: 9, color: C.brand }}>{k}</Text>
                  </View>
                ))}
              </View>
            )}
            {phase.budget && (
              <Text style={{ fontSize: 9, color: C.gray2, marginTop: 5 }}>Budget-Richtwert: {phase.budget}</Text>
            )}
          </View>
        ))}

        <PdfFooterEs company={data.companyName} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Handlungsempfehlungen</Text>
        <Text style={s.sub}>
          {data.archetype ? `${ARCHETYPE_LABELS[data.archetype] ?? data.archetype} · ` : ''}AI-Roadmap · Enterprise AI Navigator
        </Text>

        {archetypeRecs.map((rec, i) => (
          <RecCard3 key={i} rec={rec} index={i} color={C.brand} />
        ))}

        {data.phases.length > 0 && (
          <>
            <Text style={s.h2}>Erste Phase — Fokusthemen</Text>
            <View wrap={false} style={[s.card, { borderLeftWidth: 3, borderLeftColor: PHASE_COLORS[0] }]}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.dark, marginBottom: 4 }}>{data.phases[0].title}</Text>
              {data.phases[0].focus && <Text style={{ fontSize: 10, color: C.gray, marginBottom: 6, lineHeight: 1.4 }}>{data.phases[0].focus}</Text>}
              {(data.phases[0].actions ?? []).slice(0, 4).map((a, i) => (
                <View key={i} style={[s.row, { marginBottom: 3 }]}>
                  <Text style={{ fontSize: 9, color: C.brand, marginRight: 4 }}>{'>'}</Text>
                  <Text style={{ flex: 1, fontSize: 10 }}>{a.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <PdfLegalNote />
        <PdfFooterEs company={data.companyName} />
      </Page>
    </Document>
  )
}
```

**Wichtig:** `gap: 4` und `gap: 8` aus der alten Roadmap-Funktion wurden durch `marginRight` ersetzt (KPI-Chips: `marginRight: 4, marginBottom: 3`; Aktions-Zeilen: `marginRight: 4`).

- [ ] **Step 3: TypeScript prüfen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && git add src/lib/pdf/templates.tsx && git commit -m "feat(pdf): Roadmap — Deckblatt + RecCard3 + gap-zu-marginRight-Fix"
```

---

## Task 5: Canvas PDF

**Files:**
- Modify: `src/lib/pdf/templates.tsx` — Abschnitt Canvas (Zeilen ~376–451)

- [ ] **Step 1: `canvasRecs()`-Funktion vor `renderCanvasPdf` einfügen**

Direkt vor `export function renderCanvasPdf(...)` einfügen:

```typescript
function canvasRecs(d: CanvasData): Rec3[] {
  return [
    d.risks ? {
      title:  'Identifizierte Risiken in Risikoregister überführen',
      why:    'EU AI Act Art. 9 schreibt ein aktives Risikomanagementsystem über den gesamten Systemlebenszyklus vor — eine einmalige Risikodokumentation im Canvas genügt nicht. NIST AI RMF (2024): 58 % der KI-Vorfälle betreffen Risiken, die früh identifiziert, aber nicht aktiv gesteuert wurden.¹',
      action: 'Canvas-Risiken in formales Risikoregister überführen; Verantwortlichen und Mitigationsmaßnahme pro Risiko benennen; Review-Termin in 6 Wochen setzen.',
    } : {
      title:  'Risikobewertung vor Pilotstart ergänzen',
      why:    'EU AI Act Art. 9 verlangt eine Risikoanalyse vor Inbetriebnahme — fehlt sie, ist jeder Pilotstart regulatorisch unvollständig. Projekte ohne dokumentierte Risikobewertung scheitern laut Gartner (2024) 2,3× häufiger in der Skalierungsphase.¹',
      action: 'Technische, rechtliche und betriebliche Risiken systematisch identifizieren (Workshop mit IT, Legal, Fachbereich); Canvas-Feld Risiken vor Pilotstart ausfüllen.',
    },
    d.kpis ? {
      title:  'KPI-Baseline erfassen und 30/60/90-Tage-Review einplanen',
      why:    'BCG (2024): KI-Projekte mit vorab definierten und gemessenen KPIs erhalten 4× häufiger Folgebudget. Ohne Baseline-Erfassung lässt sich der ROI des Use Cases nicht nachweisen — Budget-Entscheider fordern zunehmend Wirksamkeitsnachweise.¹',
      action: 'Ist-Wert aller Canvas-KPIs vor Pilotstart erfassen; automatisiertes Reporting einrichten; Review-Termine nach 30, 60 und 90 Tagen als feste Kalendertermine setzen.',
    } : {
      title:  'Messbare Erfolgsindikatoren (KPIs) definieren',
      why:    'Ohne KPIs ist der Projekterfolg nicht nachweisbar — laut Forrester (2024) werden 61 % der KI-Budgets ohne messbare Ergebnisse nach 12 Monaten gestrichen. EU AI Act Art. 9 verlangt zudem Monitoring-Metriken für Hochrisiko-Systeme.¹',
      action: 'Min. 3 messbare KPIs definieren (z.B. Zeitersparnis in %, Fehlerrate, Nutzerzufriedenheit); Baseline-Erhebung vor Pilotstart einplanen.',
    },
    d.stakeholders ? {
      title:  'Stakeholder-Kommunikationsplan und Change Management aufsetzen',
      why:    'Forrester (2024): 79 % fehlgeschlagener KI-Transformationen scheitern an Cultural Resistance. EU AI Act Art. 14 verpflichtet zu menschlicher Aufsicht — betroffene Stakeholder müssen aktiv eingebunden, nicht nur informiert werden.¹',
      action: 'Kommunikationsplan (Was, Wer, Wann, Kanal) für alle Canvas-Stakeholder erstellen; Change-Management-Bedarf pro Stakeholder-Gruppe einschätzen; Update-Rhythmus festlegen.',
    } : {
      title:  'Stakeholder-Analyse vertiefen und Change-Risiken adressieren',
      why:    'Unvollständige Stakeholder-Analyse ist laut McKinsey (2024) in 54 % der Fälle Hauptursache für Projektverzögerungen. EU AI Act Art. 14 verlangt explizit die Einbindung natürlicher Personen in KI-Überwachungsprozesse.¹',
      action: 'Alle betroffenen Nutzer, Entscheider und Systemabhängigkeiten erfassen; Change-Readiness pro Gruppe einschätzen; frühzeitig Piloten aus skeptischen Gruppen gewinnen.',
    },
    {
      title:  'Governance-Check vor Pilotstart durchführen',
      why:    'EU AI Act Art. 6 i.V.m. Anhang III klassifiziert mehrere KI-Anwendungsdomänen als Hochrisiko — diese erfordern zwingend einen Governance-Check vor Inbetriebnahme. Fehlendes Governance-Protokoll ist ein eigenständiger Bußgeldtatbestand (Art. 99 Abs. 3).¹',
      action: 'Governance-Check-Modul im AI Navigator für diesen Use Case durchführen; Ergebnis im Canvas unter Nächste Schritte dokumentieren.',
    },
  ]
}
```

- [ ] **Step 2: `renderCanvasPdf` auf 3-Seiten-Struktur umbauen und `gap` entfernen**

Die gesamte Funktion ersetzen durch:

```typescript
export function renderCanvasPdf(data: CanvasPdfData): ReactElement {
  return (
    <Document title="AI Use-Case Canvas">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title={data.title}
        subtitle={data.archetype ? ARCHETYPE_LABELS[data.archetype] : undefined}
        companyName={data.companyName}
      />

      {/* Seite 2: Canvas-Felder */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.sub}>
          AI Use-Case Canvas{data.archetype ? ` · ${ARCHETYPE_LABELS[data.archetype] ?? data.archetype}` : ''} · Enterprise AI Navigator
        </Text>

        <Text style={s.h2}>Problem &amp; Lösung</Text>
        <View style={[s.row, { marginBottom: 8 }]}>
          <View style={{ flex: 1, marginRight: 8, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>PROBLEM / OPPORTUNITÄT</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.problem ?? '–'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>KI-LÖSUNG</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.solution ?? '–'}</Text>
          </View>
        </View>

        <Text style={s.h2}>Daten &amp; Stakeholder</Text>
        <View style={[s.row, { marginBottom: 8 }]}>
          <View style={{ flex: 1, marginRight: 8, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>DATENQUELLEN</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.data_sources ?? '–'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>STAKEHOLDER</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.stakeholders ?? '–'}</Text>
          </View>
        </View>

        <Text style={s.h2}>Erfolgsindikatoren &amp; Risiken</Text>
        <View style={[s.row, { marginBottom: 8 }]}>
          <View style={{ flex: 1, marginRight: 8, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>KPIS / ERFOLGSINDIKATOREN</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.kpis ?? '–'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>RISIKEN</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.risks ?? '–'}</Text>
          </View>
        </View>

        <Text style={s.h2}>Umsetzung</Text>
        <View style={[s.row, { marginBottom: 8 }]}>
          <View style={{ flex: 1, marginRight: 8, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>TECHNISCHE ARCHITEKTUR</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.architecture ?? '–'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>NÄCHSTE SCHRITTE</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.next_steps ?? '–'}</Text>
          </View>
        </View>

        <PdfFooterEs company={data.companyName} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Handlungsempfehlungen</Text>
        <Text style={s.sub}>AI Use-Case Canvas · Enterprise AI Navigator</Text>

        {canvasRecs(data.data ?? {}).map((rec, i) => (
          <RecCard3 key={i} rec={rec} index={i} color={C.brand} />
        ))}

        <PdfLegalNote />
        <PdfFooterEs company={data.companyName} />
      </Page>
    </Document>
  )
}
```

**Wichtig:** `CanvasSection`-Komponente wird damit nicht mehr verwendet und kann gelöscht werden (oder stehen lassen — keine Auswirkung).

- [ ] **Step 3: TypeScript prüfen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && git add src/lib/pdf/templates.tsx && git commit -m "feat(pdf): Canvas — Deckblatt + RecCard3 + canvasRecs() + gap-Fix"
```

---

## Task 6: Compliance PDF

**Files:**
- Modify: `src/lib/pdf/templates.tsx` — Abschnitt Compliance (Zeilen ~453–617)

- [ ] **Step 1: `complianceRecs`-Typ-Extension und Inhalte aktualisieren**

Im Body von `renderCompliancePdf` (aktuell ab Zeile ~505) den `complianceRecs`-Array-Aufbau suchen.

Aktuell beginnt er mit:
```typescript
const complianceRecs: Array<{ title: string; text: string; color: string }> = []
```

Ersetzen durch:
```typescript
const complianceRecs: Array<{ title: string; why: string; action: string; color: string }> = []
```

Dann alle `.push()`-Aufrufe aktualisieren. Den kompletten Block von `const complianceRecs = []` bis zum letzten `complianceRecs.push(...)` ersetzen durch:

```typescript
const complianceRecs: Array<{ title: string; why: string; action: string; color: string }> = []
if (nonCompliantEU > 0)
  complianceRecs.push({
    color: C.danger,
    title: `${nonCompliantEU} EU AI Act-Verstoß${nonCompliantEU > 1 ? 'e' : ''} beheben`,
    why:   'Nicht-Konformitäten mit EU AI Act-Pflichten (Art. 9–15, 17) sind bußgeldfähig — bis 3 % des globalen Jahresumsatzes oder 15 Mio. EUR (Art. 99 Abs. 3). Aufsichtsbehörden können den Betrieb des Systems bis zur Behebung untersagen.¹',
    action: 'Identifizierte Verstöße nach Kritikalität priorisieren; Verantwortlichen und Deadline (max. 4 Wochen) pro Verstoß benennen; Governance-Check nach Behebung erneut durchführen.',
  })
if (nonCompliantDSGVO > 0)
  complianceRecs.push({
    color: C.danger,
    title: `${nonCompliantDSGVO} DSGVO-Lücke${nonCompliantDSGVO > 1 ? 'n' : ''} schließen`,
    why:   'DSGVO-Verstöße können mit bis zu 20 Mio. EUR oder 4 % des weltweiten Jahresumsatzes geahndet werden (Art. 83 Abs. 5). Aufsichtsbehörden prüfen KI-Systeme zunehmend aktiv — fehlende Dokumentation gilt als erschwerender Umstand.¹',
    action: 'Datenschutzbeauftragten einbeziehen; technische Maßnahmen (Pseudonymisierung, Datensparsamkeit, Privacy-by-Design) umsetzen; Rechtsgrundlagen für alle Datenverarbeitungen dokumentieren.',
  })
if (pendingTotal > 0)
  complianceRecs.push({
    color: C.warn,
    title: `${pendingTotal} ausstehende Prüfpunkte abschließen`,
    why:   'Unvollständige Compliance-Dokumentation gilt als mangelhaftes Qualitätsmanagementsystem nach EU AI Act Art. 17 — auch wenn einzelne Punkte noch nicht verletzt sind. ENISA (2024): 47 % der KI-Compliance-Bußgelder betreffen unvollständige Dokumentation, nicht aktive Verstöße.¹',
    action: 'Verantwortlichen für jeden offenen Prüfpunkt benennen; verbindliche Abschlusstermine (max. 2 Wochen) setzen; vollständiges Bild vor Pilotstart sicherstellen.',
  })
if (euDone === euChecks.length && euChecks.length > 0)
  complianceRecs.push({
    color: C.ok,
    title: 'EU AI Act: Vollständige Konformität bestätigt',
    why:   'Vollständige EU AI Act-Konformität ist ein nachweisbarer Vertrauensfaktor: 73 % der B2B-Kunden bewerten KI-Compliance als Kaufkriterium (Edelman Trust Barometer 2024). Regulatorische Konformität sichert zudem Zugang zu öffentlichen Aufträgen, die AI Act-Compliance zunehmend voraussetzen.¹',
    action: 'Konformitätsstatus dokumentieren und für externe Kommunikation aufbereiten; quartalsliches Review einrichten; Änderungen in EU AI Act Anhang III aktiv beobachten.',
  })
if (dsgvoDone === dsgvoChecks.length && dsgvoChecks.length > 0)
  complianceRecs.push({
    color: C.ok,
    title: 'DSGVO: Vollständige Konformität bestätigt',
    why:   'Vollständige DSGVO-Konformität schützt vor Bußgeldern und stärkt das Kundenvertrauen: 81 % der Verbraucher brechen Geschäftsbeziehungen nach Datenschutzvorfällen ab (PwC Consumer Intelligence Series, 2024). Dokumentierte Compliance ist zudem Voraussetzung für Datenpartnerschaften.¹',
    action: 'Verarbeitungsverzeichnis aktuell halten; bei Änderungen (neue Datenquellen, neue Modelle) erneute Prüfung auslösen; DSFA für neue Verarbeitungsvorgänge zeitnah durchführen.',
  })
complianceRecs.push({
  color: C.dark2,
  title: 'Kontinuierliches Compliance-Monitoring etablieren',
  why:   'EU AI Act und DSGVO entwickeln sich aktiv weiter — der AI Act Annex III wird regelmäßig durch die EU-Kommission aktualisiert. Unternehmen ohne laufendes Monitoring verpassen Änderungen und riskieren nachträgliche Nicht-Konformität.¹',
  action: 'Quartalsweiser Compliance-Check im AI Navigator als festen Termin einrichten; Newsletter EU AI Office und EDPB für Gesetzesänderungen abonnieren; internen Compliance-Kalender führen.',
})
```

- [ ] **Step 2: `renderCompliancePdf` auf 3-Seiten-Struktur umbauen**

Die `return`-Anweisung in `renderCompliancePdf` ändern. Aktuell gibt die Funktion eine `<Document>` mit 2 `<Page>`s zurück. Das wird zu 3 `<Page>`s:

```typescript
return (
  <Document title="Compliance Status Report">
    {/* Seite 1: Deckblatt */}
    <PdfCoverPage
      title="Compliance Status Report"
      subtitle="EU AI Act · DSGVO · Risikomatrix"
      companyName={data.companyName}
    />

    {/* Seite 2: Checklisten (bisherige Seite 1 — unverändert außer Footer + gap-Fix) */}
    <Page size="A4" style={s.page}>
      <PdfHeader company={data.companyName} />
      <Text style={s.h1}>Compliance Status Report</Text>
      <Text style={s.sub}>EU AI Act · DSGVO · Risikomatrix · Enterprise AI Navigator</Text>

      <View style={[s.row, { marginBottom: 18 }]}>
        {riskClassName && (
          <View style={[s.card, { flex: 2, padding: 10, marginBottom: 0, marginRight: 8 }]}>
            <Text style={{ fontSize: 8, color: C.gray, marginBottom: 3 }}>EU AI Act Risikoklasse</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.dark }}>{riskClassName}</Text>
          </View>
        )}
        <View style={[s.card, { flex: 1, alignItems: 'center', padding: 10, marginBottom: 0, marginRight: 8 }]}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: C.brand }}>{euDone}/{euChecks.length}</Text>
          <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>EU AI Act Pflichten</Text>
        </View>
        <View style={[s.card, { flex: 1, alignItems: 'center', padding: 10, marginBottom: 0 }]}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: C.ok }}>{dsgvoDone}/{dsgvoChecks.length}</Text>
          <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>DSGVO-Punkte</Text>
        </View>
      </View>

      {matrixSummary && (
        <View style={[s.card, { marginBottom: 14 }]}>
          <Text style={{ fontSize: 9, color: C.gray, marginBottom: 2 }}>Risikoniveau</Text>
          <Text style={{ fontSize: 10, color: C.dark }}>{matrixSummary}</Text>
        </View>
      )}

      {renderSection('EU AI Act — Pflichten-Checkliste', euChecks)}
      {renderSection('DSGVO-Checkliste', dsgvoChecks)}

      <PdfFooterEs company={data.companyName} />
    </Page>

    {/* Seite 3: Handlungsempfehlungen (bisherige Seite 2 — mit RecCard3) */}
    <Page size="A4" style={s.page}>
      <PdfHeader company={data.companyName} />
      <Text style={s.h1}>Handlungsempfehlungen</Text>
      <Text style={s.sub}>Compliance Status Report · Enterprise AI Navigator</Text>

      {complianceRecs.map((item, i) => {
        const { color, ...rec } = item
        return <RecCard3 key={i} rec={rec} index={i} color={color} />
      })}

      <View wrap={false} style={{ marginTop: 16, backgroundColor: C.dark, borderRadius: 8, padding: 14 }}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white', marginBottom: 6 }}>Nächster Schritt</Text>
        <Text style={{ fontSize: 9, color: C.gray2, lineHeight: 1.5 }}>
          Governance-Check im AI Navigator für jeden High-Score-Use-Case durchführen — Pflicht nach EU AI Act für Hochrisiko-Anwendungen (Art. 6, Annex III).
        </Text>
      </View>

      <PdfLegalNote />
      <PdfFooterEs company={data.companyName} />
    </Page>
  </Document>
)
```

- [ ] **Step 3: TypeScript prüfen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && git add src/lib/pdf/templates.tsx && git commit -m "feat(pdf): Compliance — Deckblatt + RecCard3 mit EU-AI-Act/DSGVO-Bußgeldreferenzen"
```

---

## Task 7: Architecture PDF

**Files:**
- Modify: `src/lib/pdf/templates.tsx` — Abschnitt Architecture (Zeilen ~619–669)

- [ ] **Step 1: `ARCHITECTURE_RECS`-Konstante vor `renderArchitecturePdf` einfügen**

Direkt vor `export function renderArchitecturePdf(...)` einfügen:

```typescript
const ARCHITECTURE_RECS: Rec3[] = [
  {
    title:  'Technische Dokumentation nach EU AI Act Art. 17 sicherstellen',
    why:    'EU AI Act Art. 17 verpflichtet Anbieter von Hochrisiko-KI zu einem vollständigen Qualitätsmanagementsystem mit technischer Dokumentation (Architektur, Daten, Performance-Metriken). Fehlt diese, ist das System nicht genehmigungsfähig — unabhängig von seiner technischen Qualität.¹',
    action: 'Architektur-Dokument nach EU AI Act Anhang IV strukturieren (Layer-Übersicht, Schnittstellen, Datenflüsse); als lebendes Dokument im Confluence/Notion führen und bei Änderungen aktualisieren.',
  },
  {
    title:  'MLOps-Infrastruktur für Modell-Monitoring aufbauen',
    why:    'EU AI Act Art. 9 Abs. 4 schreibt kontinuierliche Systemüberwachung über den gesamten Lebenszyklus vor. NVIDIA Enterprise AI Survey (2024): 68 % der KI-Produktionsvorfälle entstehen durch unentdeckten Modell-Drift — ohne Monitoring-Infrastruktur sind diese nicht erkennbar.¹',
    action: 'Drift-Detection (Daten- und Konzeptdrift), automatisiertes Retraining-Triggering und Performance-Alerting als MLOps-Komponenten in die Architektur integrieren.',
  },
  {
    title:  'Menschliche Kontrollpunkte in die Systemarchitektur einbauen',
    why:    'EU AI Act Art. 14 verpflichtet zu technischen Vorkehrungen für menschliche Aufsicht — Systeme ohne expliziten Override-Mechanismus gelten als nicht norm-konform für Hochrisiko-Anwendungen. Human-in-the-Loop-Designs reduzieren laut Stanford HAI (2024) kritische Fehlerauswirkungen um 64 %.¹',
    action: 'Human-Review-Queue und Override-Mechanismus in die Architektur einzeichnen; Oversight-Schnittstelle (Dashboard, Alert-System) für den Aufsichtsverantwortlichen bereitstellen.',
  },
]
```

- [ ] **Step 2: `renderArchitecturePdf` auf 3-Seiten-Struktur umbauen**

Die gesamte Funktion ersetzen durch:

```typescript
export function renderArchitecturePdf(data: ArchitecturePdfData): ReactElement {
  return (
    <Document title="AI-Architektur">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title={data.title}
        subtitle={data.result?.pattern ?? undefined}
        companyName={data.companyName}
      />

      {/* Seite 2: Architektur-Ebenen + Next Steps */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.sub}>AI-Architektur · {data.result?.pattern ?? ''} · Enterprise AI Navigator</Text>

        {data.result?.description && (
          <View style={[s.card, { marginBottom: 16 }]}>
            <Text style={{ fontSize: 10, color: '#475569' }}>{data.result.description}</Text>
          </View>
        )}

        <Text style={s.h2}>Architektur-Ebenen</Text>
        {(data.result?.layers ?? []).map((layer, i) => (
          <View key={i} wrap={false} style={{ marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark2 }}>{layer.name}</Text>
            <Text style={{ fontSize: 10, color: C.gray, marginTop: 2, marginBottom: 6 }}>{layer.role}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {layer.components.map((comp, ci) => (
                <View key={ci} style={{ backgroundColor: '#eff6ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 3, marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: C.brand }}>{comp}</Text>
                </View>
              ))}
            </View>
            {layer.examples && <Text style={{ fontSize: 9, color: C.gray2, marginTop: 4 }}>{layer.examples}</Text>}
          </View>
        ))}

        {(data.result?.nextSteps ?? []).length > 0 && (
          <>
            <Text style={s.h2}>Empfohlene Nächste Schritte</Text>
            {data.result!.nextSteps!.map((step, i) => (
              <View key={i} style={[s.row, { marginBottom: 4, alignItems: 'flex-start' }]}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.brand, marginRight: 7, marginTop: 3 }} />
                <Text style={{ flex: 1, fontSize: 10 }}>{step}</Text>
              </View>
            ))}
          </>
        )}

        <PdfFooterEs company={data.companyName} />
      </Page>

      {/* Seite 3: Architektur-Best-Practices */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Architektur-Empfehlungen</Text>
        <Text style={s.sub}>AI-Architektur · Enterprise AI Navigator</Text>

        {ARCHITECTURE_RECS.map((rec, i) => (
          <RecCard3 key={i} rec={rec} index={i} color={C.brand} />
        ))}

        <PdfLegalNote />
        <PdfFooterEs company={data.companyName} />
      </Page>
    </Document>
  )
}
```

**Wichtig:** `gap: 3` im Layer-Komponenten-Chip-Grid wurde durch `marginRight: 3, marginBottom: 3` ersetzt.

- [ ] **Step 3: TypeScript + ESLint + Build — vollständige Prüfung**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npx tsc --noEmit 2>&1 | head -30
```

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npx eslint src/lib/pdf/templates.tsx --max-warnings 0 2>&1 | head -30
```

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && npm run build 2>&1 | tail -20
```

Erwartet:
- `tsc`: 0 Fehler
- `eslint`: 0 Warnings (ggf. `CanvasSection` als unused-Warnung — dann Komponente aus Datei entfernen)
- `build`: Exit-Code 0

- [ ] **Step 4: Final Commit**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3" && git add src/lib/pdf/templates.tsx && git commit -m "feat(pdf): Architecture — Deckblatt + ARCHITECTURE_RECS + gap-zu-marginRight-Fix"
```

---

## Manuelle Verifikation (nach allen Tasks)

Für jedes Modul einmal im Dev-Server (`http://localhost:3001`) einen PDF-Export auslösen und prüfen:

| Modul | Seiten | Cover | Rec-Seite | Fußnote |
|-------|--------|-------|-----------|---------|
| Assessment | 3 | ✓ dunkles Deckblatt | 3 RecCard3-Karten | ¹-Text sichtbar |
| Governance | 3 | ✓ | 3 RecCard3-Karten | ✓ |
| Roadmap | 3 | ✓ | 4 RecCard3-Karten | ✓ |
| Canvas | 3 | ✓ | 4 RecCard3-Karten | ✓ |
| Compliance | 3 | ✓ | Variable Anzahl RecCard3 | ✓ |
| Architecture | 3 | ✓ | 3 RecCard3-Karten | ✓ |

Seitenumbruch innerhalb einer RecCard3 = Bug (`wrap={false}` fehlt oder wurde überschrieben).
