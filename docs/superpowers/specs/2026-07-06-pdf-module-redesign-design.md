# PDF Module Redesign — Design Spec
_Erstellt: 06.07.2026 · Freigegeben von Daniel_

## Ziel

Alle 6 Modul-PDFs (Assessment, Governance, Roadmap, Canvas, Compliance, Architecture) erhalten:
1. Ein einheitliches **Deckblatt** (neue gemeinsame Komponente `PdfCoverPage`)
2. Eine aufgewertete **Empfehlungsseite** mit 3-Ebenen-Karten (`RecCard3`)
3. Konkrete Rechtsartikel-Verweise (EU AI Act, DSGVO) + Branchen-Statistiken in den „Warum"-Texten
4. Eine **Rechtsfußnote** am Ende jeder Empfehlungsseite
5. Layout-Fixes: `wrap={false}` auf allen Cards, `marginRight` statt `gap`, einheitlicher Footer mit Seitennummern

---

## 1. Neue gemeinsame Komponenten

### 1.1 `PdfCoverPage`

Reusable Deckblatt — identische Optik wie Executive Summary Cover.

```tsx
interface PdfCoverPageProps {
  title: string         // Modul-Name, z.B. "AI-Readiness Assessment"
  subtitle?: string     // z.B. Firmenname oder Use-Case-Name
  date?: string         // ISO-Datum, als "DD.MM.YYYY" formatiert
  companyName?: string
}
```

**Layout:**
- Volle Seite, `backgroundColor: C.dark`
- Oben: AI Navigator Logo-Zeile (weißer Text, 8pt)
- Mitte: `title` in 28pt bold weiß; `subtitle` in 12pt `C.brand`-Farbe
- Unten: `companyName` + Datum in grauem Text

### 1.2 `RecCard3`

3-Ebenen-Empfehlungskarte. `wrap={false}` ist Pflicht.

```tsx
interface Rec3 {
  title:  string   // Was — kurz, fett (≤60 Zeichen)
  why:    string   // Warum — 2 Sätze: Rechtsreferenz + Zahl/Kontext
  action: string   // Erste Maßnahme — konkret, Zeitrahmen, Verantwortlicher
}

interface RecCard3Props {
  rec:   Rec3
  index: number    // für Nummer-Badge
  color: string    // linke Randfarbe + Badge-Farbe
}
```

**Layout:**
```
┌─ 3px color-Rand ──────────────────────────────────────────┐
│  [①]  rec.title (10pt bold, C.dark)                       │
│                                                           │
│       rec.why (9pt, C.gray, lineHeight 1.5)               │
│                                                           │
│  ▸    rec.action (9pt, color, lineHeight 1.5)             │
└───────────────────────────────────────────────────────────┘
```

- `borderLeftWidth: 3, borderLeftColor: color`
- Badge: `backgroundColor: color, borderRadius: 9, width: 18, height: 18`
- `marginBottom: 8` zwischen Cards
- `marginRight` statt `gap` zwischen Geschwisterelementen

### 1.3 `PdfLegalNote`

Kleine Disclaimer-Fußnote — erscheint **einmalig am Ende jeder Empfehlungsseite**, kein fixer Footer.

```
¹ Rechtliche und regulatorische Hinweise in diesem Bericht dienen der
  Orientierung und ersetzen keine individuelle Rechts- oder Compliance-Beratung.
```

- `fontSize: 7, color: C.gray, marginTop: 20, lineHeight: 1.4`
- Kein `wrap={false}` — darf mit Seitenende umbrechen

---

## 2. Einheitliche Seitenstruktur (alle 6 Module)

| Seite | Inhalt | Änderung |
|-------|--------|----------|
| 1 | **Deckblatt** `PdfCoverPage` | neu |
| 2 | **Ergebnisseite** — bisheriger Inhalt, Layout-Fixes | aktualisiert |
| 3 | **Empfehlungsseite** — `RecCard3`-Karten + `PdfLegalNote` | neu/ersetzt |

Roadmap und Compliance hatten bereits 2 Seiten → werden durch Deckblatt zu 3 Seiten.

**Layout-Fixes auf allen Seiten gleichzeitig:**
- `gap` → `marginRight` auf alle `flexDirection: 'row'`-Views mit Kinder
- `wrap={false}` auf alle Cards, Banner, Tabellenzeilen
- `PdfFooter` → `PdfFooterEs` (Seitennummern) auf allen Seiten

---

## 3. Empfehlungsinhalt — Assessment

**Datenbasis:** `topDims` = die 3 Dimensionen mit dem niedrigsten Score  
**Farbe:** `scoreColor` (grün/gelb/rot je nach Score)

### Neues Datenmodell

```typescript
const ASSESSMENT_RECS: Record<string, Rec3> = {
  data: {
    title:  'Datenstrategie und -governance aufbauen',
    why:    'EU AI Act Art. 10 schreibt für Hochrisiko-KI explizit hochwertige Datenverwaltungspraktiken vor — fehlt diese, drohen Bußgelder bis 3 % des globalen Jahresumsatzes (Art. 99 Abs. 3). Laut McKinsey (2023) nennen 72 % der Unternehmen mangelnde Datenqualität als Haupthindernis für KI-Skalierung.¹',
    action: 'Masterdatenmodell + Data Governance Charter in 60 Tagen mit CDO/CTO definieren; Datenqualitäts-KPIs für kritische Felder einführen.',
  },
  skills: {
    title:  'AI-Kompetenzen systematisch aufbauen',
    why:    'EU AI Act Art. 4 macht „ausreichende KI-Kenntnisse" für alle Mitarbeiter zur Pflicht, die KI-Systeme einsetzen oder beaufsichtigen. Laut WEF Future of Jobs Report 2025 sehen 69 % der Unternehmen AI/ML-Kompetenzen als kritischen Engpass bis 2027.¹',
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
    why:    'Forrester Research (2024): In 79 % aller fehlgeschlagenen KI-Transformationen war Cultural Resistance der entscheidende Faktor — nicht Technologie. EU AI Act Art. 4 verlangt zudem „ausreichende KI-Kenntnisse" auf allen Organisationsebenen.¹',
    action: 'AI-Sponsor auf C-Level formalisieren; AI-Literacy-Programm (8 Stunden) für alle Führungskräfte einführen; AI-Champion-Netzwerk über alle Fachbereiche aufbauen.',
  },
}
```

---

## 4. Empfehlungsinhalt — Governance

**Datenbasis:** `data.result` ∈ `approve | stop_dsgvo | stop_risk | improve`  
**Farbe:** `res.color` (grün/rot/amber je nach Ergebnis)

```typescript
const GOV_RECS: Record<string, Rec3[]> = {
  approve: [
    {
      title:  'Freigabe dokumentieren und Review-Zyklus festlegen',
      why:    'EU AI Act Art. 9 Abs. 4 verlangt, dass das Risikomanagementsystem „über den gesamten Lebenszyklus" des Systems aktiv bleibt — einmalige Freigabe ohne Folge-Review genügt nicht. Laut ENISA AI Security Guidelines (2024) werden 43 % der KI-Sicherheitsvorfälle durch fehlende Überwachung nach Go-Live verursacht.¹',
      action: 'Freigabeergebnis in Projektplan als Meilenstein dokumentieren; quartalsliches Compliance-Review (30 Minuten, AI-Owner + DSB) als Termin einrichten.',
    },
    {
      title:  'Transparenzpflichten gegenüber Nutzern umsetzen',
      why:    'EU AI Act Art. 13 schreibt für Hochrisiko-KI-Systeme verständliche Informationen für Nutzer vor — Nichterfüllung ist bußgeldfähig (Art. 99 Abs. 3: bis 3 % des globalen Jahresumsatzes). Transparenz ist zugleich Vertrauensfaktor: 67 % der Endnutzer akzeptieren KI-Entscheidungen eher, wenn sie eine Erklärung erhalten (Eurobarometer 2024).¹',
      action: 'Nutzer-Dokumentation für das KI-System erstellen (Zweck, Grenzen, Kontaktpfad); KI-Kennung in allen Nutzer-Interfaces sichtbar machen.',
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
      why:    'DSGVO Art. 35 schreibt eine DSFA vor, wenn KI-Systeme personenbezogene Daten systematisch und umfangreich verarbeiten — Nichtdurchführung ist bußgeldfähig nach Art. 83 Abs. 4 (bis 10 Mio. € oder 2 % des weltweiten Jahresumsatzes). Die DSFA ist Voraussetzung, nicht Option.¹',
      action: 'Datenschutzbeauftragten einbeziehen; DSFA-Template ausfüllen; Verarbeitungsverzeichnis aktualisieren — vor jedem weiteren Pilotschritt abzuschließen.',
    },
    {
      title:  'Rechtsgrundlage für alle Datenverarbeitungen dokumentieren',
      why:    'DSGVO Art. 6 verlangt für jede Verarbeitung personenbezogener Daten eine explizite Rechtsgrundlage (Einwilligung, Vertrag, berechtigtes Interesse etc.). Fehlt die Dokumentation, gilt die Verarbeitung als unrechtmäßig — Bußgeld nach Art. 83 Abs. 5 bis 20 Mio. € oder 4 % des Jahresumsatzes.¹',
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
      why:    'EU AI Act Art. 73 verpflichtet zu Meldung schwerwiegender Vorfälle durch KI-Systeme innerhalb von 15 Arbeitstagen. Fehlt ein Incident-Response-Plan, können Reaktionszeiten dieses Fenster überschreiten und zusätzliche Sanktionen auslösen.¹',
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
      action: 'Follow-up-Termin für erneuten Governance-Check in AI Navigator als verbindlichen Meilenstein im Projektplan eintragen (Zieldatum: 4–6 Wochen ab heute).',
    },
  ],
}
```

---

## 5. Empfehlungsinhalt — Roadmap

**Datenbasis:** `data.archetype` ∈ `starter | scaler | transformer`  
**Farbe:** `C.brand` (Standardblau)

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
      action: 'Daten-Asset-Register anlegen; Monetarisierungspfade (interne Plattform, externe APIs, Lizenzierung) für Top-3-Datensätze bewerten; Data-Governance-Struktur auf strategische Assets ausweiten.',
    },
    {
      title:  'Innovationsgeschwindigkeit durch strukturierte Experimentierkultur sichern',
      why:    'BCG Henderson Institute (2024): KI-Marktführer investieren 3× mehr in Experimentation als Nachzügler. Ohne dediziertes Experiments-Budget und Fail-Fast-Kultur verlangsamt sich die Innovationsrate, während Wettbewerber aufholen.¹',
      action: 'Dediziertes Experiments-Budget (10–15 % des AI-Gesamtbudgets) formalisieren; Fail-Fast-Metriken definieren; monatliches Innovation-Sprint-Format einführen.',
    },
    {
      title:  'AI als Differenzierungsmerkmal aktiv nach außen kommunizieren',
      why:    'Edelman Trust Barometer 2024: 73 % der B2B-Kunden betrachten nachgewiesene AI-Kompetenz als Kaufkriterium — AI-Kompetenz ohne externe Kommunikation bleibt unsichtbarer Wettbewerbsvorteil. EU AI Act Art. 13 fördert zudem proaktive Transparenz als Vertrauensgrundlage.¹',
      action: 'AI-Erfolgsstories für externe Kommunikation aufbereiten (Case Studies, Zertifizierungen, Whitepapers); KI-Kompetenz in Sales-Materialien und auf Unternehmenswebsite integrieren.',
    },
    {
      title:  'AI-Ökosystem aktiv mitgestalten',
      why:    'Open-Source-Beiträge und Standards-Mitarbeit stärken Employer Branding und Technologie-Früherkennung: Unternehmen in AI-Standards-Gremien reduzieren Compliance-Anpassungskosten bei Regulierungsänderungen um bis zu 60 % (OECD AI Policy Observatory, 2024).¹',
      action: 'Beteiligung an 1–2 AI-Standards-Gremien (ISO/IEC JTC 1/SC 42, EU AI Alliance) oder Open-Source-Projekten formalisieren; Partner-Ökosystem für AI-Komponenten aufbauen.',
    },
  ],
}
```

---

## 6. Empfehlungsinhalt — Canvas

**Datenbasis:** Felder `data.data` — dynamisch je nach ausgefüllten Feldern  
**Farbe:** `C.brand`

```typescript
// Funktion statt statisches Array — gibt Rec3[] basierend auf Canvas-Daten zurück
function canvasRecs(d: CanvasData): Rec3[] {
  return [
    d.risks ? {
      title:  'Identifizierte Risiken in Risikoregister überführen',
      why:    'EU AI Act Art. 9 schreibt ein aktives Risikomanagementsystem über den gesamten Systemlebenszyklus vor — eine einmalige Risikodokumentation im Canvas genügt nicht. NIST AI RMF (2024): 58 % der KI-Vorfälle betreffen Risiken, die früh identifiziert, aber nicht aktiv gesteuert wurden.¹',
      action: 'Canvas-Risiken in formales Risikoregister überführen; Verantwortlichen und Mitigationsmaßnahme pro Risiko benennen; Review-Termin in 6 Wochen setzen.',
    } : {
      title:  'Risikobewertung vor Pilotstart ergänzen',
      why:    'EU AI Act Art. 9 verlangt eine Risikoanalyse vor Inbetriebnahme — fehlt sie, ist jeder Pilotstart regulatorisch unvollständig. Projekte ohne dokumentierte Risikobewertung scheitern laut Gartner (2024) 2,3× häufiger in der Skalierungsphase.¹',
      action: 'Technische, rechtliche und betriebliche Risiken systematisch identifizieren (Workshop mit IT, Legal, Fachbereich); Canvas-Feld „Risiken" vor Pilotstart ausfüllen.',
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
      action: 'Governance-Check-Modul im AI Navigator für diesen Use Case durchführen; Ergebnis im Canvas unter „Nächste Schritte" dokumentieren.',
    },
  ]
}
```

---

## 7. Empfehlungsinhalt — Compliance

**Datenbasis:** Dynamisch aus `data.checks` — bestehende Struktur `{ title, text, color }` wird auf `Rec3` erweitert.

```typescript
// Bestehende complianceRecs-Logik bleibt — nur `text` wird in `why` + `action` aufgeteilt:

if (nonCompliantEU > 0)
  complianceRecs.push({
    color: C.danger,
    title: `${nonCompliantEU} EU AI Act-Verstoß${nonCompliantEU > 1 ? 'e' : ''} beheben`,
    why:   'Nicht-Konformitäten mit EU AI Act-Pflichten (Art. 9–15, 17) sind bußgeldfähig — bis 3 % des globalen Jahresumsatzes oder 15 Mio. € (Art. 99 Abs. 3). Aufsichtsbehörden können den Betrieb des Systems bis zur Behebung untersagen.¹',
    action: 'Identifizierte Verstöße nach Kritikalität priorisieren; Verantwortlichen und Deadline (max. 4 Wochen) pro Verstoß benennen; Governance-Check nach Behebung erneut durchführen.',
  })

if (nonCompliantDSGVO > 0)
  complianceRecs.push({
    color: C.danger,
    title: `${nonCompliantDSGVO} DSGVO-Lücke${nonCompliantDSGVO > 1 ? 'n' : ''} schließen`,
    why:   'DSGVO-Verstöße können mit bis zu 20 Mio. € oder 4 % des weltweiten Jahresumsatzes geahndet werden (Art. 83 Abs. 5). Aufsichtsbehörden prüfen KI-Systeme zunehmend aktiv — fehlende Dokumentation gilt als erschwerender Umstand.¹',
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
    action: 'Konformitätsstatus dokumentieren und für externe Kommunikation aufbereiten; quartalsliches Review einrichten; Änderungen in EU AI Act Anhang III (Hochrisiko-Liste) aktiv beobachten.',
  })

if (dsgvoDone === dsgvoChecks.length && dsgvoChecks.length > 0)
  complianceRecs.push({
    color: C.ok,
    title: 'DSGVO: Vollständige Konformität bestätigt',
    why:   'Vollständige DSGVO-Konformität schützt vor Bußgeldern und stärkt das Kundenvertrauen: 81 % der Verbraucher brechen Geschäftsbeziehungen nach Datenschutzvorfällen ab (PwC Consumer Intelligence Series, 2024). Dokumentierte Compliance ist zudem Voraussetzung für Datenpartnerschaften.¹',
    action: 'Verarbeitungsverzeichnis aktuell halten; bei Änderungen (neue Datenquellen, neue Modelle) erneute Prüfung auslösen; DSFA für neue Verarbeitungsvorgänge zeitnah durchführen.',
  })

// Immer:
complianceRecs.push({
  color: C.dark2,
  title: 'Kontinuierliches Compliance-Monitoring etablieren',
  why:   'EU AI Act und DSGVO entwickeln sich aktiv weiter — der AI Act Annex III (Hochrisiko-Klassifikation) wird regelmäßig durch die EU-Kommission aktualisiert. Unternehmen ohne laufendes Monitoring verpassen Änderungen und riskieren nachträgliche Nicht-Konformität.¹',
  action: 'Quartalsweiser Compliance-Check im AI Navigator als festen Termin einrichten; Newsletter EU AI Office und EDPB für Gesetzesänderungen abonnieren; internen Compliance-Kalender führen.',
})
```

---

## 8. Empfehlungsinhalt — Architecture

**Datenbasis:** Kein bestehendes Empfehlungs-Array — neue statische Karten basierend auf Best Practices  
**Farbe:** `C.brand`

Architecture-PDF hat bisher NUR `nextSteps` aus den Daten (dynamisch vom KI-Generator).  
Die neue Empfehlungsseite zeigt **3 feste Architektur-Best-Practice-Karten** nach den `nextSteps`.

```typescript
const ARCHITECTURE_RECS: Rec3[] = [
  {
    title:  'Technische Dokumentation nach EU AI Act Art. 17 sicherstellen',
    why:    'EU AI Act Art. 17 verpflichtet Anbieter von Hochrisiko-KI zu einem vollständigen Qualitätsmanagementsystem mit technischer Dokumentation (Architektur, Daten, Performance-Metriken). Fehlt diese, ist das System nicht genehmigungsfähig — unabhängig von seiner technischen Qualität.¹',
    action: 'Architektur-Dokument (Layer-Übersicht, Schnittstellen, Datenflüsse) nach EU AI Act Anhang IV strukturieren; als lebendes Dokument im Confluence/Notion führen und bei Änderungen aktualisieren.',
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

---

## 9. Technische Umsetzungsregeln

1. **`RecCard3`-Komponente** einmalig definieren; alle 6 Module nutzen sie — kein Copy-Paste
2. **`Rec3`-Interface** in der `templates.tsx`-Datei-Kopfzeile definieren (vor den RECS-Konstanten)
3. **`PdfCoverPage`** bekommt als `date`-Prop den `new Date().toLocaleDateString('de-DE')` des Export-Zeitpunkts — kein gespeichertes Datum nötig
4. **`wrap={false}`** auf jede `RecCard3`-Instance, jeden `CanvasSection`-View, jede Tabellenzeile
5. **`gap` → `marginRight`**: Alle `gap: N`-Properties auf `flexDirection: 'row'`-Views durch `marginRight: N` auf alle Kinder-Views außer dem letzten ersetzen
6. **`PdfFooter` → `PdfFooterEs`** auf allen Seiten aller 6 Module
7. **`PdfLegalNote`** am Ende jeder Empfehlungsseite (Seite 3), **nicht** auf Deckblatt oder Ergebnisseite
8. **Canvas**: `canvasRecs()` als Funktion (nicht statisches Array) — damit die Kondition auf Canvas-Daten zur Laufzeit ausgewertet wird
9. **Compliance**: Bestehende `complianceRecs`-Logik bleibt; nur die Objekt-Properties werden von `{ title, text, color }` auf `{ title, why, action, color }` erweitert; `RecCard3` rendert dann `why` + `action` statt `text`
10. **Architecture**: `ARCHITECTURE_RECS` als neue feste Konstante; Empfehlungsseite zeigt zuerst `nextSteps` (falls vorhanden), dann die 3 `ARCHITECTURE_RECS`

---

## 10. Datei-Scope

Alle Änderungen in einer einzigen Datei: **`src/lib/pdf/templates.tsx`**

| Änderung | Art |
|----------|-----|
| `Rec3` Interface | neu hinzufügen |
| `PdfCoverPage` Komponente | neu hinzufügen |
| `RecCard3` Komponente | neu hinzufügen |
| `PdfLegalNote` Komponente | neu hinzufügen |
| `ASSESSMENT_RECS` | `Record<string, string>` → `Record<string, Rec3>` |
| `GOV_RECS` | `Record<string, string[]>` → `Record<string, Rec3[]>` |
| `ROADMAP_RECS` | `Record<string, string[]>` → `Record<string, Rec3[]>` |
| `canvasRecs()` | neue Hilfsfunktion (ersetzt inline-Array) |
| Compliance `complianceRecs` | `{ title, text, color }[]` → `{ title, why, action, color }[]` |
| `ARCHITECTURE_RECS` | neue Konstante |
| `renderAssessmentPdf` | + PdfCoverPage, + RecCard3, + PdfLegalNote, `gap`→`marginRight`, `PdfFooter`→`PdfFooterEs` |
| `renderGovernancePdf` | identisch wie Assessment |
| `renderRoadmapPdf` | identisch wie Assessment |
| `renderCanvasPdf` | identisch + `canvasRecs()` statt inline-Array, `gap`→`marginRight` |
| `renderCompliancePdf` | identisch + Rec3-Split auf Seite 2 |
| `renderArchitecturePdf` | + PdfCoverPage, + RecCard3 (aus `ARCHITECTURE_RECS`), + PdfLegalNote |

---

## 11. Test-Gate

Vor Merge:
```bash
npx tsc --noEmit      # Kein TypeScript-Fehler
npm run build         # Build grün
```

Manuell:
- PDF-Export für jedes Modul auslösen (Dev-Server), Seitenanzahl prüfen (je 3)
- Kein Seitenumbruch innerhalb einer RecCard3
- Fußnote `¹ Rechtliche…` auf jeder Empfehlungsseite sichtbar
- Deckblatt zeigt Firmenname und Datum

---

_¹ Rechtliche und regulatorische Hinweise in diesem Bericht dienen der Orientierung und ersetzen keine individuelle Rechts- oder Compliance-Beratung._
