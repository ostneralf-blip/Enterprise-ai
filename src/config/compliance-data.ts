export interface EUAIActClass {
  id: string
  title: string
  badge: string
  color: { bg: string; border: string; badge: string; title: string }
  examples: string[]
  obligations: string[]
}

export const EU_AI_ACT_CLASSES: EUAIActClass[] = [
  {
    id: 'prohibited',
    title: 'Verboten (Art. 5)',
    badge: 'Keine Ausnahmen',
    color: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', title: 'text-red-800' },
    examples: [
      'Social Scoring durch staatliche Stellen',
      'Biometrische Echtzeit-Fernidentifikation in öffentlichen Räumen',
      'Manipulation durch unterschwellige oder täuschende Techniken',
      'Ausnutzung von Schwachstellen (Alter, Behinderung, soziale Lage)',
      'Predictive Policing auf Basis persönlicher Merkmale',
      'Emotionserkennung am Arbeitsplatz und in Bildungseinrichtungen',
    ],
    obligations: ['Deployment absolut unzulässig — keine Ausnahmen, kein Übergangsrecht'],
  },
  {
    id: 'high',
    title: 'Hochrisiko (Art. 6, Anhang III)',
    badge: 'Umfangreiche Pflichten',
    color: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', title: 'text-amber-800' },
    examples: [
      'HR: Einstellungen, Beförderungen, Leistungsbewertung, Entlassung',
      'Kredit- und Bonitätsprüfung, Versicherungseinstufung',
      'Medizinische Diagnose und Behandlungsempfehlung',
      'Kritische Infrastruktur (Energie, Wasser, Verkehr)',
      'Strafverfolgung, Grenzkontrolle, Migration',
      'Bildung: Prüfungsautomatisierung, Zugangsentscheidungen',
    ],
    obligations: [
      'Risikomanagementsystem implementieren (Art. 9)',
      'Technische Dokumentation nach Anhang IV (Art. 11)',
      'Konformitätsbewertung + CE-Kennzeichnung (Art. 43)',
      'Registrierung in EU-AI-Datenbank (Art. 71)',
      'Post-market Monitoring einrichten (Art. 72)',
      'Human Oversight verankern (Art. 14)',
    ],
  },
  {
    id: 'limited',
    title: 'Begrenztes Risiko (Art. 50)',
    badge: 'Transparenzpflichten',
    color: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', title: 'text-blue-800' },
    examples: [
      'Chatbots und virtuelle Assistenten mit Kundenkontakt',
      'KI-generierte Texte, Bilder, Videos (Deepfakes, synthetische Medien)',
      'Emotionserkennung (außer verbotene Kontexte)',
      'Biometrische Kategorisierungssysteme',
    ],
    obligations: [
      'Nutzer über KI-Interaktion informieren (Art. 50 Abs. 1)',
      'KI-generierte Inhalte maschinenlesbar kennzeichnen (Art. 50 Abs. 2)',
    ],
  },
  {
    id: 'minimal',
    title: 'Minimales / kein Risiko',
    badge: 'Freiwillige Maßnahmen',
    color: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-800' },
    examples: [
      'Spam-Filter, Empfehlungssysteme, Suchfunktionen',
      'KI in Spielen und Unterhaltungsanwendungen',
      'Einfache Prozessautomatisierung ohne Personenbezug',
    ],
    obligations: [
      'Keine gesetzlichen Pflichten',
      'Freiwillige Code of Practice empfohlen',
    ],
  },
]

export interface DsgvoCheckItem {
  id: string
  article: string
  label: string
  description: string
}

export const DSGVO_CHECKLIST: DsgvoCheckItem[] = [
  {
    id: 'art6',
    article: 'Art. 6',
    label: 'Rechtsgrundlage für Datenverarbeitung dokumentiert',
    description: 'Einwilligung, Vertrag, rechtliche Verpflichtung oder berechtigtes Interesse — schriftlich festgehalten',
  },
  {
    id: 'art9',
    article: 'Art. 9',
    label: 'Besondere Datenkategorien geprüft',
    description: 'Gesundheit, Biometrie, Ethnizität, politische Meinung — erhöhte Anforderungen dokumentiert',
  },
  {
    id: 'art13',
    article: 'Art. 13/14',
    label: 'Informationspflichten erfüllt (Datenschutzhinweis aktuell)',
    description: 'Zweck, Rechtsgrundlage, Empfänger, Speicherdauer in Datenschutzhinweisen aufgenommen',
  },
  {
    id: 'art15',
    article: 'Art. 15–22',
    label: 'Betroffenenrechte technisch umsetzbar',
    description: 'Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenportabilität möglich',
  },
  {
    id: 'art22',
    article: 'Art. 22',
    label: 'Automatisierte Entscheidungen: menschlicher Review verankert',
    description: 'Bei wesentlichen KI-Entscheidungen ist ein menschlicher Überprüfungsschritt dokumentiert und zugänglich',
  },
  {
    id: 'art25',
    article: 'Art. 25',
    label: 'Privacy by Design & by Default implementiert',
    description: 'Datensparsamkeit und datenschutzfreundliche Voreinstellungen im System verankert',
  },
  {
    id: 'art28',
    article: 'Art. 28',
    label: 'AV-Verträge mit allen Dienstleistern abgeschlossen',
    description: 'Auftragsverarbeitungsverträge mit Cloud-Anbietern, ML-Plattformen und Datenverarbeitern vorhanden',
  },
  {
    id: 'art30',
    article: 'Art. 30',
    label: 'Verarbeitungsverzeichnis (VVT) aktuell',
    description: 'Alle AI-Verarbeitungstätigkeiten im VVT eingetragen und regelmäßig gepflegt',
  },
  {
    id: 'art32',
    article: 'Art. 32',
    label: 'TOMs dokumentiert (Verschlüsselung, Zugriffskontrollen)',
    description: 'Technisch-organisatorische Maßnahmen für das AI-System schriftlich festgehalten',
  },
  {
    id: 'art35',
    article: 'Art. 35',
    label: 'DPIA durchgeführt (wenn erforderlich)',
    description: 'Datenschutz-Folgenabschätzung bei hohem Risiko, systematischer Überwachung oder neuen Technologien',
  },
  {
    id: 'drittland',
    article: 'Art. 44–49',
    label: 'Drittlandstransfers geregelt',
    description: 'EU-Datenspeicherung oder gültige SCCs / Angemessenheitsbeschluss für Nicht-EU-Dienste',
  },
]

export interface RiskQuadrant {
  id: string
  label: string
  action: string
  bg: string
  border: string
  badge: string
  examples: string[]
}

// Reihenfolge: top-left, top-right, bottom-left, bottom-right (Hohe Wahrscheinlichkeit oben, Hohe Auswirkung rechts)
export const RISK_QUADRANTS: RiskQuadrant[] = [
  {
    id: 'moderate',
    label: 'Moderat',
    action: 'Monitoring einrichten',
    bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700',
    examples: ['Kleine Fehler in Empfehlungen', 'Nutzerbeschwerden', 'Performance-Degradation'],
  },
  {
    id: 'critical',
    label: 'Kritisch',
    action: 'Sofortiger Handlungsbedarf',
    bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700',
    examples: ['Bias in Hochrisiko-Entscheidung', 'Datenpanne sensibler Daten', 'DSGVO-Verstoß'],
  },
  {
    id: 'low',
    label: 'Niedrig',
    action: 'Akzeptieren & beobachten',
    bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700',
    examples: ['Unbekannte Edge Cases', 'UI-Inkonsistenzen', 'Dokumentationslücken'],
  },
  {
    id: 'significant',
    label: 'Signifikant',
    action: 'Mitigation planen',
    bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700',
    examples: ['Modell-Drift unbemerkt', 'Drittanbieter-Ausfall', 'Reputationsrisiko'],
  },
]

export interface PolicyTemplate {
  id: string
  title: string
  subtitle: string
  content: string
}

export const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: 'ai_usage',
    title: 'AI Usage Policy',
    subtitle: 'Unternehmensweite Richtlinie für den Einsatz von KI-Systemen',
    content: `# AI Usage Policy — [Unternehmen]
Version: 1.0 | Stand: [Datum] | Verantwortlich: [Name/Rolle]

## 1. Geltungsbereich
Gilt für alle Mitarbeitenden und Dienstleister, die KI-Systeme im Unternehmenskontext nutzen.

## 2. Genehmigte KI-Systeme
Nur durch die IT freigegebene KI-Tools dürfen für Geschäftsdaten genutzt werden.
Aktuelle Freigabeliste: [Link zum internen Verzeichnis]

## 3. Verbotene Anwendungen
- Eingabe von Kundendaten in nicht-genehmigte KI-Dienste
- Autonome Entscheidungen mit wesentlichen Personenauswirkungen ohne Human Review
- Einsatz für Täuschung, Diskriminierung oder Datenschutzverletzungen

## 4. Pflichten der Nutzenden
- KI-Ergebnisse kritisch prüfen — keine blinde Übernahme
- Transparenz gegenüber Kunden bei KI-Einsatz
- Fehler und Auffälligkeiten dem AI-Verantwortlichen melden

## 5. Verantwortlichkeit
KI-Outputs bleiben Verantwortung der nutzenden Person oder des Teams.

## 6. Überprüfung: Jährlich durch [Rolle/Team]`,
  },
  {
    id: 'model_card',
    title: 'Model Card Template',
    subtitle: 'Technische Steckbriefvorlage (EU AI Act Anhang IV)',
    content: `# Model Card — [Modellname]
Stand: [Datum] | Eigentümer: [Team/Person]

## Modell-Übersicht
- Aufgabe: [z. B. Dokumentenklassifikation, Prognose]
- Typ: [z. B. Supervised, LLM, Regelbasiert]
- Framework: [z. B. PyTorch, Azure ML]

## Anwendungsfall & Grenzen
- Vorgesehen für: [Konkrete Beschreibung]
- Nicht vorgesehen für: [Ausschlüsse]
- Bekannte Limitierungen: [Schwächen]

## Trainingsdaten
- Quellen: [Beschreibung] | Zeitraum: [von–bis]
- Vorverarbeitung: [Schritte] | Bekannte Biases: [Dokumentation]

## Performance-Metriken
| Metrik | Trainingsdaten | Testdaten |
|--------|----------------|-----------|
| [z. B. F1] | [Wert] | [Wert] |

## Risikoklasse (EU AI Act)
[ ] Verboten  [ ] Hochrisiko  [ ] Begrenztes Risiko  [ ] Minimal

## Monitoring: Intervall [wöchentlich/monatlich] | Verantwortlich: [Name]`,
  },
  {
    id: 'incident_response',
    title: 'AI Incident Response Plan',
    subtitle: 'Eskalationsprozess für KI-Fehler und -Vorfälle',
    content: `# AI Incident Response Plan — [Unternehmen]

## Stufe 1 — Geringfügig (keine Personenbeeinträchtigung)
Beispiele: Performance-Degradation, Empfehlungsfehler, UI-Fehler
Reaktionszeit: 5 Werktage | Verantwortlich: Produktteam

## Stufe 2 — Erheblich (Beeinträchtigung von Entscheidungen)
Beispiele: Falschklassifikation mit Konsequenzen, Datenpanne
Reaktionszeit: 24 Stunden | Verantwortlich: AI-Verantwortlicher + IT-Security

## Stufe 3 — Kritisch (DSGVO-Verletzung, Grundrechte betroffen)
Beispiele: Datenschutzvorfall, diskriminierende Entscheidungen
Reaktionszeit: < 2 Stunden | Verantwortlich: Geschäftsführung + DSB
DSGVO: Meldepflicht an Aufsichtsbehörde binnen 72h (Art. 33 DSGVO)

## Incident-Dokumentation
Für jeden Vorfall: Datum, Beschreibung, betroffene Systeme, Ursache, Maßnahmen, Lessons Learned.

## Kontakte
- AI-Verantwortlicher: [Name, E-Mail]
- Datenschutzbeauftragter: [Name, E-Mail]`,
  },
  {
    id: 'supplier_checklist',
    title: 'AI-Lieferanten Due Diligence',
    subtitle: 'Checkliste für die Bewertung externer AI-Anbieter',
    content: `# AI Supplier Due Diligence — [Anbieter] | [Datum]

## Datenschutz & DSGVO
[ ] AVV vorhanden
[ ] Datenspeicherort: EU/EWR oder gültige SCCs
[ ] Daten werden NICHT für Modelltraining genutzt
[ ] Löschfristen definiert

## Sicherheit
[ ] ISO 27001 oder SOC 2 vorhanden
[ ] Penetrationstests < 12 Monate
[ ] SLA mit Verfügbarkeitsgarantie

## EU AI Act
[ ] AI Act Compliance-Roadmap vorhanden
[ ] Risikoklasse des Systems dokumentiert
[ ] Technische Dokumentation auf Anfrage verfügbar

## Vertragsrecht
[ ] Haftungsregelungen für AI-Fehler geklärt
[ ] Exit-Strategie und Datenrückgabe vereinbart
[ ] Audit-Rechte vertraglich gesichert

Bewertung: [ ] Freigegeben  [ ] Bedingt  [ ] Abgelehnt`,
  },
]
