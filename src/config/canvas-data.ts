import type { CanvasData } from '@/types'

export const CANVAS_FIELDS: Array<{
  id: keyof CanvasData
  label: string
  description: string
  placeholder: string
}> = [
  {
    id: 'problem',
    label: 'Problem',
    description: 'Welches Geschäftsproblem soll gelöst werden?',
    placeholder: 'z. B. Manuelle Dokumentenprüfung dauert 3 Tage mit 15% Fehlerquote',
  },
  {
    id: 'solution',
    label: 'AI-Lösung',
    description: 'Wie sieht der AI-basierte Lösungsansatz aus?',
    placeholder: 'z. B. NLP-Modell klassifiziert Dokumente, Ausnahmen gehen zur manuellen Prüfung',
  },
  {
    id: 'data_sources',
    label: 'Datenquellen',
    description: 'Welche Daten werden benötigt und sind verfügbar?',
    placeholder: 'z. B. ERP-Daten (5 Jahre), Kunden-E-Mails, CRM-Historien — alle on-premise',
  },
  {
    id: 'stakeholders',
    label: 'Stakeholder',
    description: 'Wer ist betroffen oder verantwortlich?',
    placeholder: 'z. B. Sponsor: CFO, Eigentümer: Ops-Leiterin, Nutzer: 12 Sachbearbeiter',
  },
  {
    id: 'kpis',
    label: 'KPIs & Erfolgskriterien',
    description: 'Wie messen Sie den Erfolg?',
    placeholder: 'z. B. Bearbeitungszeit < 4h (heute 72h), Fehlerquote < 2%, ROI > 3× in 18 Monaten',
  },
  {
    id: 'risks',
    label: 'Risiken & Governance',
    description: 'Welche Risiken bestehen? DSGVO, EU AI Act?',
    placeholder: 'z. B. Datenschutz-Check erforderlich, Explainability nötig, Fallback bei Ausfall',
  },
  {
    id: 'architecture',
    label: 'Technische Architektur',
    description: 'Welche Technologien und Integrationen sind nötig?',
    placeholder: 'z. B. Azure ML + FastAPI-Microservice, REST-Integration ins ERP, Monitoring via Grafana',
  },
  {
    id: 'next_steps',
    label: 'Nächste Schritte',
    description: 'Was sind die konkreten nächsten Aktionen?',
    placeholder: 'z. B. 1. Datenpipeline aufbauen (Woche 1–2), 2. Pilotmodell (Woche 3–6), 3. Stakeholder-Review',
  },
]

export const EMPTY_CANVAS_DATA: CanvasData = {
  problem: '',
  solution: '',
  data_sources: '',
  stakeholders: '',
  kpis: '',
  risks: '',
  architecture: '',
  next_steps: '',
}
