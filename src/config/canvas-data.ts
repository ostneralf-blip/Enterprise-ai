import type { CanvasData } from '@/types'
import type { LocaleString } from '@/lib/utils/locale-data'

export const CANVAS_FIELDS: Array<{
  id: keyof CanvasData
  label: LocaleString
  description: LocaleString
  placeholder: LocaleString
}> = [
  {
    id: 'problem',
    label: { de: 'Problem', en: 'Problem' },
    description: { de: 'Welches Geschäftsproblem soll gelöst werden?', en: 'What business problem needs to be solved?' },
    placeholder: {
      de: 'z. B. Manuelle Dokumentenprüfung dauert 3 Tage mit 15% Fehlerquote',
      en: 'e.g. Manual document review takes 3 days with a 15% error rate',
    },
  },
  {
    id: 'solution',
    label: { de: 'AI-Lösung', en: 'AI Solution' },
    description: { de: 'Wie sieht der AI-basierte Lösungsansatz aus?', en: 'What does the AI-based solution approach look like?' },
    placeholder: {
      de: 'z. B. NLP-Modell klassifiziert Dokumente, Ausnahmen gehen zur manuellen Prüfung',
      en: 'e.g. NLP model classifies documents, exceptions go to manual review',
    },
  },
  {
    id: 'data_sources',
    label: { de: 'Datenquellen', en: 'Data Sources' },
    description: { de: 'Welche Daten werden benötigt und sind verfügbar?', en: 'What data is needed and available?' },
    placeholder: {
      de: 'z. B. ERP-Daten (5 Jahre), Kunden-E-Mails, CRM-Historien — alle on-premise',
      en: 'e.g. ERP data (5 years), customer emails, CRM history — all on-premise',
    },
  },
  {
    id: 'stakeholders',
    label: { de: 'Stakeholder', en: 'Stakeholders' },
    description: { de: 'Wer ist betroffen oder verantwortlich?', en: 'Who is affected or responsible?' },
    placeholder: {
      de: 'z. B. Sponsor: CFO, Eigentümer: Ops-Leiterin, Nutzer: 12 Sachbearbeiter',
      en: 'e.g. Sponsor: CFO, Owner: Head of Ops, Users: 12 clerks',
    },
  },
  {
    id: 'kpis',
    label: { de: 'KPIs & Erfolgskriterien', en: 'KPIs & Success Criteria' },
    description: { de: 'Wie messen Sie den Erfolg?', en: 'How do you measure success?' },
    placeholder: {
      de: 'z. B. Bearbeitungszeit < 4h (heute 72h), Fehlerquote < 2%, ROI > 3× in 18 Monaten',
      en: 'e.g. Processing time < 4h (currently 72h), error rate < 2%, ROI > 3× in 18 months',
    },
  },
  {
    id: 'risks',
    label: { de: 'Risiken & Governance', en: 'Risks & Governance' },
    description: { de: 'Welche Risiken bestehen? DSGVO, EU AI Act?', en: 'What risks exist? GDPR, EU AI Act?' },
    placeholder: {
      de: 'z. B. Datenschutz-Check erforderlich, Explainability nötig, Fallback bei Ausfall',
      en: 'e.g. Privacy check required, explainability needed, fallback on failure',
    },
  },
  {
    id: 'architecture',
    label: { de: 'Technische Architektur', en: 'Technical Architecture' },
    description: { de: 'Welche Technologien und Integrationen sind nötig?', en: 'What technologies and integrations are needed?' },
    placeholder: {
      de: 'z. B. Azure ML + FastAPI-Microservice, REST-Integration ins ERP, Monitoring via Grafana',
      en: 'e.g. Azure ML + FastAPI microservice, REST integration into ERP, monitoring via Grafana',
    },
  },
  {
    id: 'next_steps',
    label: { de: 'Nächste Schritte', en: 'Next Steps' },
    description: { de: 'Was sind die konkreten nächsten Aktionen?', en: 'What are the concrete next actions?' },
    placeholder: {
      de: 'z. B. 1. Datenpipeline aufbauen (Woche 1–2), 2. Pilotmodell (Woche 3–6), 3. Stakeholder-Review',
      en: 'e.g. 1. Build data pipeline (weeks 1–2), 2. Pilot model (weeks 3–6), 3. Stakeholder review',
    },
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
