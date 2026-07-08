import type { Archetype } from '@/types'
import type { LocaleString } from '@/lib/utils/locale-data'

export interface RoadmapAction {
  label: LocaleString
  priority: 'high' | 'medium'
}

export interface RoadmapPhase {
  id: 'phase1' | 'phase2' | 'phase3'
  title: LocaleString
  duration: LocaleString
  focus: LocaleString
  actions: RoadmapAction[]
  kpis: LocaleString[]
  budget: string
}

export type ArchetypeRoadmap = Record<'phase1' | 'phase2' | 'phase3', RoadmapPhase>

export const ROADMAPS: Record<Archetype, ArchetypeRoadmap> = {
  starter: {
    phase1: {
      id: 'phase1',
      title: { de: 'Fundament legen', en: 'Build the Foundation' },
      duration: { de: '0–3 Monate', en: '0–3 months' },
      focus: { de: 'Use Cases identifizieren, Governance-Grundlage schaffen, Datenlage verstehen', en: 'Identify use cases, establish governance foundation, understand data landscape' },
      actions: [
        { label: { de: 'AI-Readiness Assessment durchführen (alle 6 Dimensionen)', en: 'Conduct AI Readiness Assessment (all 6 dimensions)' }, priority: 'high' },
        { label: { de: 'Top-3 Use Cases mit Use-Case Scoring priorisieren', en: 'Prioritize top 3 use cases with Use-Case Scoring' }, priority: 'high' },
        { label: { de: 'AI Policy & Governance-Rahmenwerk erstellen', en: 'Create AI Policy & Governance Framework' }, priority: 'high' },
        { label: { de: 'Datengap-Analyse für priorisierte Use Cases', en: 'Data gap analysis for prioritized use cases' }, priority: 'high' },
        { label: { de: 'EU AI Act Risikoklasse für Use Cases prüfen', en: 'Check EU AI Act risk class for use cases' }, priority: 'medium' },
        { label: { de: 'AI-Sponsor auf C-Level benennen', en: 'Appoint AI sponsor at C-level' }, priority: 'medium' },
      ],
      kpis: [
        { de: '3 priorisierte Use Cases dokumentiert', en: '3 prioritized use cases documented' },
        { de: '1 AI Policy verabschiedet', en: '1 AI policy adopted' },
        { de: 'Datengap-Analyse abgeschlossen', en: 'Data gap analysis completed' },
      ],
      budget: '< €30k',
    },
    phase2: {
      id: 'phase2',
      title: { de: 'Ersten Use Case live bringen', en: 'Launch the First Use Case' },
      duration: { de: '3–12 Monate', en: '3–12 months' },
      focus: { de: 'Pilotprojekt deployen, Team upskilling, Feedback-Loops etablieren', en: 'Deploy pilot project, upskill the team, establish feedback loops' },
      actions: [
        { label: { de: 'Pilot-Use-Case entwickeln und in Produktion bringen', en: 'Develop and deploy pilot use case to production' }, priority: 'high' },
        { label: { de: 'Dateninfrastruktur für Pilot ausbauen (Data Pipeline)', en: 'Build out data infrastructure for pilot (data pipeline)' }, priority: 'high' },
        { label: { de: 'AI-Literacy-Schulungen für Kernteam (≥ 10 Personen)', en: 'AI literacy training for core team (≥ 10 people)' }, priority: 'high' },
        { label: { de: 'Monitoring & Alerting für Produktiv-Modell einrichten', en: 'Set up monitoring & alerting for production model' }, priority: 'high' },
        { label: { de: 'Lessons Learned dokumentieren und nächste Use Cases ableiten', en: 'Document lessons learned and derive next use cases' }, priority: 'medium' },
        { label: { de: 'DSGVO-Konformität und Transparenzpflichten umsetzen', en: 'Implement GDPR compliance and transparency obligations' }, priority: 'medium' },
      ],
      kpis: [
        { de: '1 Use Case in Produktion', en: '1 use case in production' },
        { de: 'Time-to-Value < 3 Monate', en: 'Time-to-value < 3 months' },
        { de: 'AI-Literacy-Schulung ≥ 60 % Kernteam', en: 'AI literacy training ≥ 60% of core team' },
      ],
      budget: '€30–100k',
    },
    phase3: {
      id: 'phase3',
      title: { de: 'Skalieren & institutionalisieren', en: 'Scale & Institutionalize' },
      duration: { de: '12+ Monate', en: '12+ months' },
      focus: { de: 'Portfolio erweitern, AI Center of Excellence aufbauen, ROI sichtbar machen', en: 'Expand portfolio, build AI Center of Excellence, make ROI visible' },
      actions: [
        { label: { de: 'Use-Case-Portfolio auf 3+ aktive Projekte ausbauen', en: 'Expand use case portfolio to 3+ active projects' }, priority: 'high' },
        { label: { de: 'AI Center of Excellence (intern oder hybrid) etablieren', en: 'Establish AI Center of Excellence (internal or hybrid)' }, priority: 'high' },
        { label: { de: 'AI-Rolle im Organigramm verankern (AI Lead / CAIO)', en: 'Anchor AI role in org chart (AI Lead / CAIO)' }, priority: 'high' },
        { label: { de: 'ROI-Messung je Use Case einführen', en: 'Introduce ROI measurement per use case' }, priority: 'high' },
        { label: { de: 'Externes AI-Partnernetz aufbauen', en: 'Build external AI partner network' }, priority: 'medium' },
        { label: { de: 'AI-Strategie mit 3-Jahres-Roadmap dokumentieren', en: 'Document AI strategy with 3-year roadmap' }, priority: 'medium' },
      ],
      kpis: [
        { de: '3+ Use Cases produktiv', en: '3+ use cases in production' },
        { de: 'ROI > 150 % des Investments', en: 'ROI > 150% of investment' },
        { de: 'AI-Rolle im Organigramm', en: 'AI role in org chart' },
      ],
      budget: '€100–300k',
    },
  },

  scaler: {
    phase1: {
      id: 'phase1',
      title: { de: 'Portfolio-Lücken schließen', en: 'Close Portfolio Gaps' },
      duration: { de: '0–3 Monate', en: '0–3 months' },
      focus: { de: 'Bestehende Use Cases auditieren, nächste High-ROI-Kandidaten identifizieren', en: 'Audit existing use cases, identify next high-ROI candidates' },
      actions: [
        { label: { de: 'Bestehende Use Cases auditieren (Performance, Governance, ROI)', en: 'Audit existing use cases (performance, governance, ROI)' }, priority: 'high' },
        { label: { de: 'Nächste 2–3 Use Cases mit höchstem ROI priorisieren', en: 'Prioritize next 2–3 use cases with highest ROI' }, priority: 'high' },
        { label: { de: 'MLOps-Pipeline bewerten und Bottlenecks identifizieren', en: 'Assess MLOps pipeline and identify bottlenecks' }, priority: 'high' },
        { label: { de: 'Datenstrategie auf nächste Use Cases ausrichten', en: 'Align data strategy to next use cases' }, priority: 'high' },
        { label: { de: 'AI Governance für produktive Systeme erweitern', en: 'Extend AI governance for production systems' }, priority: 'medium' },
        { label: { de: 'AI-Kompetenzlücken im Team erfassen', en: 'Identify AI skill gaps in the team' }, priority: 'medium' },
      ],
      kpis: [
        { de: 'Use-Case-Audit abgeschlossen', en: 'Use case audit completed' },
        { de: '3 neue Kandidaten priorisiert', en: '3 new candidates prioritized' },
        { de: 'MLOps-Maturity bewertet', en: 'MLOps maturity assessed' },
      ],
      budget: '€20–50k',
    },
    phase2: {
      id: 'phase2',
      title: { de: 'Skalierungsinfrastruktur aufbauen', en: 'Build Scaling Infrastructure' },
      duration: { de: '3–12 Monate', en: '3–12 months' },
      focus: { de: '2–3 neue Use Cases live, AI Platform einführen, AI Product Owner etablieren', en: '2–3 new use cases live, introduce AI Platform, establish AI Product Owner' },
      actions: [
        { label: { de: '2–3 neue Use Cases in Produktion bringen', en: 'Bring 2–3 new use cases to production' }, priority: 'high' },
        { label: { de: 'AI Platform / Feature Store evaluieren und einführen', en: 'Evaluate and introduce AI Platform / Feature Store' }, priority: 'high' },
        { label: { de: 'AI Product Owner-Rolle besetzen', en: 'Fill AI Product Owner role' }, priority: 'high' },
        { label: { de: 'Automatisiertes Model Monitoring & Retraining einrichten', en: 'Set up automated model monitoring & retraining' }, priority: 'high' },
        { label: { de: 'Governance für EU AI Act Hochrisiko-Systeme ausbauen', en: 'Expand governance for EU AI Act high-risk systems' }, priority: 'medium' },
        { label: { de: 'Cross-funktionale AI-Teams bilden (Business + Tech)', en: 'Form cross-functional AI teams (business + tech)' }, priority: 'medium' },
      ],
      kpis: [
        { de: '2+ neue Use Cases live', en: '2+ new use cases live' },
        { de: 'AI Platform eingeführt', en: 'AI Platform introduced' },
        { de: 'AI Product Owner besetzt', en: 'AI Product Owner in place' },
      ],
      budget: '€100–300k',
    },
    phase3: {
      id: 'phase3',
      title: { de: 'AI als Kernkompetenz verankern', en: 'Anchor AI as Core Competency' },
      duration: { de: '12+ Monate', en: '12+ months' },
      focus: { de: 'AI-Strategie mit Unternehmensstrategie verknüpfen, Wertbeitrag transparent machen', en: 'Link AI strategy with business strategy, make value contribution transparent' },
      actions: [
        { label: { de: 'AI-Strategie mit Unternehmensstrategie verzahnen', en: 'Integrate AI strategy with corporate strategy' }, priority: 'high' },
        { label: { de: 'AI Excellence Hub etablieren', en: 'Establish AI Excellence Hub' }, priority: 'high' },
        { label: { de: 'AI ROI-Dashboard für Management einführen', en: 'Introduce AI ROI dashboard for management' }, priority: 'high' },
        { label: { de: 'Portfolio auf 5+ Use Cases erweitern', en: 'Expand portfolio to 5+ use cases' }, priority: 'high' },
        { label: { de: 'AI-Talentprogramm und Hiring-Strategie umsetzen', en: 'Implement AI talent program and hiring strategy' }, priority: 'medium' },
        { label: { de: 'AI im Budgetprozess als Linienkostenposition verankern', en: 'Anchor AI in budget process as a line-item cost' }, priority: 'medium' },
      ],
      kpis: [
        { de: '5+ Use Cases produktiv', en: '5+ use cases in production' },
        { de: 'AI ROI-Dashboard operativ', en: 'AI ROI dashboard operational' },
        { de: 'AI im Strategieprozess verankert', en: 'AI anchored in strategic planning process' },
      ],
      budget: '€300–600k',
    },
  },

  transformer: {
    phase1: {
      id: 'phase1',
      title: { de: 'Advanced AI-Capabilities aktivieren', en: 'Activate Advanced AI Capabilities' },
      duration: { de: '0–3 Monate', en: '0–3 months' },
      focus: { de: 'GenAI evaluieren, EU AI Act-Compliance sicherstellen, AI-TCO transparent machen', en: 'Evaluate GenAI, ensure EU AI Act compliance, make AI TCO transparent' },
      actions: [
        { label: { de: 'GenAI-Use-Cases (LLMs, Copilots) evaluieren und pilotieren', en: 'Evaluate and pilot GenAI use cases (LLMs, Copilots)' }, priority: 'high' },
        { label: { de: 'AI-Architektur auf LLM-Integration vorbereiten', en: 'Prepare AI architecture for LLM integration' }, priority: 'high' },
        { label: { de: 'EU AI Act Compliance-Gap-Analyse durchführen', en: 'Conduct EU AI Act compliance gap analysis' }, priority: 'high' },
        { label: { de: 'Total Cost of AI (TCO) quantifizieren und optimieren', en: 'Quantify and optimize Total Cost of AI (TCO)' }, priority: 'high' },
        { label: { de: 'AI Ethics Review-Prozess etablieren', en: 'Establish AI Ethics Review process' }, priority: 'medium' },
        { label: { de: 'Interne AI-Reifegradmessung formalisieren', en: 'Formalize internal AI maturity measurement' }, priority: 'medium' },
      ],
      kpis: [
        { de: 'GenAI-Pilot gestartet', en: 'GenAI pilot started' },
        { de: 'EU AI Act Gap-Analyse abgeschlossen', en: 'EU AI Act gap analysis completed' },
        { de: 'AI-TCO transparent', en: 'AI TCO transparent' },
      ],
      budget: '€50–150k',
    },
    phase2: {
      id: 'phase2',
      title: { de: 'Intelligente Systeme integrieren', en: 'Integrate Intelligent Systems' },
      duration: { de: '3–12 Monate', en: '3–12 months' },
      focus: { de: 'Agentic AI in kritische Prozesse integrieren, AI-Wertbeitrag im P&L sichtbar machen', en: 'Integrate Agentic AI into critical processes, make AI value contribution visible in P&L' },
      actions: [
        { label: { de: 'Agentic AI / AutoML in 2+ kritische Kernprozesse integrieren', en: 'Integrate Agentic AI / AutoML into 2+ critical core processes' }, priority: 'high' },
        { label: { de: 'AI-Wertbeitrag in P&L quantifizieren und sichtbar machen', en: 'Quantify and make AI value contribution visible in P&L' }, priority: 'high' },
        { label: { de: 'AI Ethics Board formalisieren und institutionalisieren', en: 'Formalize and institutionalize AI Ethics Board' }, priority: 'high' },
        { label: { de: 'AI-Ökosystem-Partnerschaften aufbauen (Startups, Forschung)', en: 'Build AI ecosystem partnerships (startups, research)' }, priority: 'high' },
        { label: { de: 'Real-time AI-Monitoring mit automatisiertem Bias-Tracking', en: 'Real-time AI monitoring with automated bias tracking' }, priority: 'medium' },
        { label: { de: 'AI-getriebenes Produktportfolio-Update initiieren', en: 'Initiate AI-driven product portfolio update' }, priority: 'medium' },
      ],
      kpis: [
        { de: '2+ GenAI-Anwendungen produktiv', en: '2+ GenAI applications in production' },
        { de: 'AI im P&L quantifiziert', en: 'AI quantified in P&L' },
        { de: 'Ethics Board aktiv', en: 'Ethics Board active' },
      ],
      budget: '€300k–1M',
    },
    phase3: {
      id: 'phase3',
      title: { de: 'AI-first Unternehmenskultur', en: 'AI-first Corporate Culture' },
      duration: { de: '12+ Monate', en: '12+ months' },
      focus: { de: 'AI-first Prozessdesign, eigene Modelle entwickeln, Thought Leadership', en: 'AI-first process design, develop own models, thought leadership' },
      actions: [
        { label: { de: 'AI-first Prozessdesign als Unternehmensstandard einführen', en: 'Introduce AI-first process design as corporate standard' }, priority: 'high' },
        { label: { de: 'Eigene Fine-tuned Modelle / proprietäre AI-IP entwickeln', en: 'Develop own fine-tuned models / proprietary AI IP' }, priority: 'high' },
        { label: { de: 'AI-Talentprogramm und gezieltes Senior-Hiring umsetzen', en: 'Implement AI talent program and targeted senior hiring' }, priority: 'high' },
        { label: { de: 'AI in > 50 % der Kernprozesse verankern', en: 'Anchor AI in > 50% of core processes' }, priority: 'high' },
        { label: { de: 'Thought Leadership aufbauen (Publikationen, Konferenzen)', en: 'Build thought leadership (publications, conferences)' }, priority: 'medium' },
        { label: { de: 'AI-Metriken in C-Level-Reporting integrieren', en: 'Integrate AI metrics into C-level reporting' }, priority: 'medium' },
      ],
      kpis: [
        { de: 'AI in > 50 % der Kernprozesse', en: 'AI in > 50% of core processes' },
        { de: 'Eigene Modelle im Einsatz', en: 'Own models in use' },
        { de: 'NPS AI-Team ≥ 70', en: 'NPS AI team ≥ 70' },
      ],
      budget: '> €1M p.a.',
    },
  },
}

export const PHASE_COLORS = {
  phase1: { bg: 'bg-primary-soft', border: 'border-primary-border', badge: 'bg-blue-100 text-primary-hover', dot: 'bg-primary' },
  phase2: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  phase3: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

export const ARCHETYPE_LABELS: Record<Archetype, { label: LocaleString; desc: LocaleString; icon: string }> = {
  starter:     { label: { de: 'AI Starter',     en: 'AI Starter'     }, desc: { de: 'Kein produktiver Use Case live',            en: 'No productive use case live yet'          }, icon: '◎' },
  scaler:      { label: { de: 'AI Scaler',      en: 'AI Scaler'      }, desc: { de: '1–3 Use Cases live, Skalierung ausstehend', en: '1–3 use cases live, scaling pending'       }, icon: '◐' },
  transformer: { label: { de: 'AI Transformer', en: 'AI Transformer' }, desc: { de: 'AI in kritischen Prozessen etabliert',       en: 'AI established in critical processes'      }, icon: '●' },
}
