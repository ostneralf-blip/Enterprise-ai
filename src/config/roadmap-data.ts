import type { Archetype } from '@/types'

export interface RoadmapAction {
  label: string
  priority: 'high' | 'medium'
}

export interface RoadmapPhase {
  id: 'phase1' | 'phase2' | 'phase3'
  title: string
  duration: string
  focus: string
  actions: RoadmapAction[]
  kpis: string[]
  budget: string
}

export type ArchetypeRoadmap = Record<'phase1' | 'phase2' | 'phase3', RoadmapPhase>

export const ROADMAPS: Record<Archetype, ArchetypeRoadmap> = {
  starter: {
    phase1: {
      id: 'phase1',
      title: 'Fundament legen',
      duration: '0–3 Monate',
      focus: 'Use Cases identifizieren, Governance-Grundlage schaffen, Datenlage verstehen',
      actions: [
        { label: 'AI-Readiness Assessment durchführen (alle 6 Dimensionen)', priority: 'high' },
        { label: 'Top-3 Use Cases mit Use-Case Scoring priorisieren', priority: 'high' },
        { label: 'AI Policy & Governance-Rahmenwerk erstellen', priority: 'high' },
        { label: 'Datengap-Analyse für priorisierte Use Cases', priority: 'high' },
        { label: 'EU AI Act Risikoklasse für Use Cases prüfen', priority: 'medium' },
        { label: 'AI-Sponsor auf C-Level benennen', priority: 'medium' },
      ],
      kpis: ['3 priorisierte Use Cases dokumentiert', '1 AI Policy verabschiedet', 'Datengap-Analyse abgeschlossen'],
      budget: '< €30k',
    },
    phase2: {
      id: 'phase2',
      title: 'Ersten Use Case live bringen',
      duration: '3–12 Monate',
      focus: 'Pilotprojekt deployen, Team upskilling, Feedback-Loops etablieren',
      actions: [
        { label: 'Pilot-Use-Case entwickeln und in Produktion bringen', priority: 'high' },
        { label: 'Dateninfrastruktur für Pilot ausbauen (Data Pipeline)', priority: 'high' },
        { label: 'AI-Literacy-Schulungen für Kernteam (≥ 10 Personen)', priority: 'high' },
        { label: 'Monitoring & Alerting für Produktiv-Modell einrichten', priority: 'high' },
        { label: 'Lessons Learned dokumentieren und nächste Use Cases ableiten', priority: 'medium' },
        { label: 'DSGVO-Konformität und Transparenzpflichten umsetzen', priority: 'medium' },
      ],
      kpis: ['1 Use Case in Produktion', 'Time-to-Value < 3 Monate', 'AI-Literacy-Schulung ≥ 60 % Kernteam'],
      budget: '€30–100k',
    },
    phase3: {
      id: 'phase3',
      title: 'Skalieren & institutionalisieren',
      duration: '12+ Monate',
      focus: 'Portfolio erweitern, AI Center of Excellence aufbauen, ROI sichtbar machen',
      actions: [
        { label: 'Use-Case-Portfolio auf 3+ aktive Projekte ausbauen', priority: 'high' },
        { label: 'AI Center of Excellence (intern oder hybrid) etablieren', priority: 'high' },
        { label: 'AI-Rolle im Organigramm verankern (AI Lead / CAIO)', priority: 'high' },
        { label: 'ROI-Messung je Use Case einführen', priority: 'high' },
        { label: 'Externes AI-Partnernetz aufbauen', priority: 'medium' },
        { label: 'AI-Strategie mit 3-Jahres-Roadmap dokumentieren', priority: 'medium' },
      ],
      kpis: ['3+ Use Cases produktiv', 'ROI > 150 % des Investments', 'AI-Rolle im Organigramm'],
      budget: '€100–300k',
    },
  },

  scaler: {
    phase1: {
      id: 'phase1',
      title: 'Portfolio-Lücken schließen',
      duration: '0–3 Monate',
      focus: 'Bestehende Use Cases auditieren, nächste High-ROI-Kandidaten identifizieren',
      actions: [
        { label: 'Bestehende Use Cases auditieren (Performance, Governance, ROI)', priority: 'high' },
        { label: 'Nächste 2–3 Use Cases mit höchstem ROI priorisieren', priority: 'high' },
        { label: 'MLOps-Pipeline bewerten und Bottlenecks identifizieren', priority: 'high' },
        { label: 'Datenstrategie auf nächste Use Cases ausrichten', priority: 'high' },
        { label: 'AI Governance für produktive Systeme erweitern', priority: 'medium' },
        { label: 'AI-Kompetenzlücken im Team erfassen', priority: 'medium' },
      ],
      kpis: ['Use-Case-Audit abgeschlossen', '3 neue Kandidaten priorisiert', 'MLOps-Maturity bewertet'],
      budget: '€20–50k',
    },
    phase2: {
      id: 'phase2',
      title: 'Skalierungsinfrastruktur aufbauen',
      duration: '3–12 Monate',
      focus: '2–3 neue Use Cases live, AI Platform einführen, AI Product Owner etablieren',
      actions: [
        { label: '2–3 neue Use Cases in Produktion bringen', priority: 'high' },
        { label: 'AI Platform / Feature Store evaluieren und einführen', priority: 'high' },
        { label: 'AI Product Owner-Rolle besetzen', priority: 'high' },
        { label: 'Automatisiertes Model Monitoring & Retraining einrichten', priority: 'high' },
        { label: 'Governance für EU AI Act Hochrisiko-Systeme ausbauen', priority: 'medium' },
        { label: 'Cross-funktionale AI-Teams bilden (Business + Tech)', priority: 'medium' },
      ],
      kpis: ['2+ neue Use Cases live', 'AI Platform eingeführt', 'AI Product Owner besetzt'],
      budget: '€100–300k',
    },
    phase3: {
      id: 'phase3',
      title: 'AI als Kernkompetenz verankern',
      duration: '12+ Monate',
      focus: 'AI-Strategie mit Unternehmensstrategie verknüpfen, Wertbeitrag transparent machen',
      actions: [
        { label: 'AI-Strategie mit Unternehmensstrategie verzahnen', priority: 'high' },
        { label: 'AI Excellence Hub etablieren', priority: 'high' },
        { label: 'AI ROI-Dashboard für Management einführen', priority: 'high' },
        { label: 'Portfolio auf 5+ Use Cases erweitern', priority: 'high' },
        { label: 'AI-Talentprogramm und Hiring-Strategie umsetzen', priority: 'medium' },
        { label: 'AI im Budgetprozess als Linienkostenposition verankern', priority: 'medium' },
      ],
      kpis: ['5+ Use Cases produktiv', 'AI ROI-Dashboard operativ', 'AI im Strategieprozess verankert'],
      budget: '€300–600k',
    },
  },

  transformer: {
    phase1: {
      id: 'phase1',
      title: 'Advanced AI-Capabilities aktivieren',
      duration: '0–3 Monate',
      focus: 'GenAI evaluieren, EU AI Act-Compliance sicherstellen, AI-TCO transparent machen',
      actions: [
        { label: 'GenAI-Use-Cases (LLMs, Copilots) evaluieren und pilotieren', priority: 'high' },
        { label: 'AI-Architektur auf LLM-Integration vorbereiten', priority: 'high' },
        { label: 'EU AI Act Compliance-Gap-Analyse durchführen', priority: 'high' },
        { label: 'Total Cost of AI (TCO) quantifizieren und optimieren', priority: 'high' },
        { label: 'AI Ethics Review-Prozess etablieren', priority: 'medium' },
        { label: 'Interne AI-Reifegradmessung formalisieren', priority: 'medium' },
      ],
      kpis: ['GenAI-Pilot gestartet', 'EU AI Act Gap-Analyse abgeschlossen', 'AI-TCO transparent'],
      budget: '€50–150k',
    },
    phase2: {
      id: 'phase2',
      title: 'Intelligente Systeme integrieren',
      duration: '3–12 Monate',
      focus: 'Agentic AI in kritische Prozesse integrieren, AI-Wertbeitrag im P&L sichtbar machen',
      actions: [
        { label: 'Agentic AI / AutoML in 2+ kritische Kernprozesse integrieren', priority: 'high' },
        { label: 'AI-Wertbeitrag in P&L quantifizieren und sichtbar machen', priority: 'high' },
        { label: 'AI Ethics Board formalisieren und institutionalisieren', priority: 'high' },
        { label: 'AI-Ökosystem-Partnerschaften aufbauen (Startups, Forschung)', priority: 'high' },
        { label: 'Real-time AI-Monitoring mit automatisiertem Bias-Tracking', priority: 'medium' },
        { label: 'AI-getriebenes Produktportfolio-Update initiieren', priority: 'medium' },
      ],
      kpis: ['2+ GenAI-Anwendungen produktiv', 'AI im P&L quantifiziert', 'Ethics Board aktiv'],
      budget: '€300k–1M',
    },
    phase3: {
      id: 'phase3',
      title: 'AI-first Unternehmenskultur',
      duration: '12+ Monate',
      focus: 'AI-first Prozessdesign, eigene Modelle entwickeln, Thought Leadership',
      actions: [
        { label: 'AI-first Prozessdesign als Unternehmensstandard einführen', priority: 'high' },
        { label: 'Eigene Fine-tuned Modelle / proprietäre AI-IP entwickeln', priority: 'high' },
        { label: 'AI-Talentprogramm und gezieltes Senior-Hiring umsetzen', priority: 'high' },
        { label: 'AI in > 50 % der Kernprozesse verankern', priority: 'high' },
        { label: 'Thought Leadership aufbauen (Publikationen, Konferenzen)', priority: 'medium' },
        { label: 'AI-Metriken in C-Level-Reporting integrieren', priority: 'medium' },
      ],
      kpis: ['AI in > 50 % der Kernprozesse', 'Eigene Modelle im Einsatz', 'NPS AI-Team ≥ 70'],
      budget: '> €1M p.a.',
    },
  },
}

export const PHASE_COLORS = {
  phase1: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  phase2: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  phase3: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
}

export const ARCHETYPE_LABELS: Record<Archetype, { label: string; desc: string; icon: string }> = {
  starter:     { label: 'AI Starter',     desc: 'Kein produktiver Use Case live',             icon: '◎' },
  scaler:      { label: 'AI Scaler',      desc: '1–3 Use Cases live, Skalierung ausstehend',  icon: '◐' },
  transformer: { label: 'AI Transformer', desc: 'AI in kritischen Prozessen etabliert',        icon: '●' },
}
