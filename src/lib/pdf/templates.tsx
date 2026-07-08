import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { ASSESSMENT_DIMENSIONS, getMaturityLevel } from '@/config/assessment-data'
import { EU_AI_ACT_RISK_CLASSES, EU_AI_ACT_OBLIGATIONS, DSGVO_CHECKLIST, RISK_MATRIX, getRiskLevel } from '@/config/compliance-data'
import { formatDate } from '@/lib/utils'

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const C = {
  brand:     '#1d4ed8',
  dark:      '#0f172a',
  dark2:     '#1e293b',
  gray:      '#64748b',
  gray2:     '#94a3b8',
  light:     '#f8fafc',
  border:    '#e2e8f0',
  ok:        '#10b981',
  warn:      '#f59e0b',
  danger:    '#ef4444',
  green:     '#065f46',  greenBg:    '#d1fae5',
  amber:     '#78350f',  amberBg:    '#fef3c7',
  red:       '#7f1d1d',  redBg:      '#fee2e2',
  neutral:   '#374151',  neutralBg:  '#f3f4f6',
}

// ─── SHARED STYLES ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:      { paddingTop: '20mm', paddingBottom: '28mm', paddingHorizontal: '15mm', fontFamily: 'Helvetica', fontSize: 11, color: C.dark, lineHeight: 1.4 },
  hdr:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: C.brand, marginBottom: 18 },
  logo:      { fontSize: 15, fontWeight: 'bold', color: C.brand },
  meta:      { fontSize: 9, color: C.gray, textAlign: 'right' },
  h1:        { fontSize: 20, fontWeight: 'bold', marginBottom: 4, color: C.dark },
  h2:        { fontSize: 12, fontWeight: 'bold', marginTop: 18, marginBottom: 8, color: C.dark2 },
  sub:       { fontSize: 10, color: C.gray, marginBottom: 14 },
  footer:    { position: 'absolute', bottom: '10mm', left: '15mm', right: '15mm', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 5 },
  footerTxt: { fontSize: 8, color: C.gray2, textAlign: 'center' },
  card:      { backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 12, marginBottom: 10 },
  row:       { flexDirection: 'row' },
  th:        { backgroundColor: C.dark2, padding: 7, fontSize: 10, color: 'white', fontWeight: 'bold' },
  td:        { padding: 6, fontSize: 10, borderBottomWidth: 1, borderBottomColor: C.border },
})

// ─── i18n HELPERS FOR PDF ────────────────────────────────────────────────────
type PdfLocale = 'de' | 'en'
function pdfLoc(locale: string): PdfLocale { return locale === 'en' ? 'en' : 'de' }
function pdfDate(locale: string): string {
  return new Date().toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}
const PDF_T: Record<PdfLocale, Record<string, string>> = {
  de: {
    created_on: 'Erstellt am', no_advice: 'Kein Ersatz für individuelle Beratung.',
    legal_note: '¹ Rechtliche und regulatorische Hinweise in diesem Bericht dienen der Orientierung und ersetzen keine individuelle Rechts- oder Compliance-Beratung.',
    recommendations: 'Handlungsempfehlungen',
    assessment_sub: 'Ergebnisbericht · 6 Dimensionen · Enterprise AI Navigator', of_5: 'von 5,0', results_by_dim: 'Ergebnis nach Dimension',
    review_protocol: 'Prüfprotokoll', criterion: 'Prüfkriterium', assessment_col: 'Bewertung',
    phase_overview: 'Phasen-Übersicht', no_phases: 'Noch keine Roadmap-Phasen gespeichert.', budget_guideline: 'Budget-Richtwert:', first_phase_focus: 'Erste Phase — Fokusthemen',
    problem_solution: 'Problem & Lösung', problem_opp: 'PROBLEM / OPPORTUNITÄT', ai_solution: 'KI-LÖSUNG',
    data_stakeholders: 'Daten & Stakeholder', data_sources_cap: 'DATENQUELLEN', stakeholders_cap: 'STAKEHOLDER',
    success_risks: 'Erfolgsindikatoren & Risiken', kpi_success: 'KPIS / ERFOLGSINDIKATOREN', risks_cap: 'RISIKEN',
    implementation: 'Umsetzung', tech_arch: 'TECHNISCHE ARCHITEKTUR', next_steps_cap: 'NÄCHSTE SCHRITTE',
    canvas_sub: 'AI Use-Case Canvas · Enterprise AI Navigator',
    risk_class_label: 'EU AI Act Risikoklasse', eu_obligations: 'EU AI Act Pflichten', gdpr_points: 'DSGVO-Punkte',
    risk_level: 'Risikoniveau', eu_checklist: 'EU AI Act — Pflichten-Checkliste', gdpr_checklist: 'DSGVO-Checkliste',
    next_step: 'Nächster Schritt', impact_label: 'Auswirkung', probability_label: 'Wahrscheinlichkeit',
    arch_layers: 'Architektur-Ebenen', recommended_next: 'Empfohlene Nächste Schritte', arch_recs: 'Architektur-Empfehlungen', arch_sub: 'AI-Architektur · Enterprise AI Navigator',
    enterprise_tagline: 'ENTERPRISE AI. STRUKTURIERT NAVIGIERT.', modules_completed: 'Module abgeschlossen',
    top3_recs: 'Top-3 Handlungsempfehlungen', module_overview: 'Modulübersicht',
    score_kpi: 'Readiness Score\n/5,0', uc_evaluated: 'Use Cases\nbewertet', modules_kpi: 'Module\nabgeschlossen',
    six_dimensions: '6 Dimensionen', strongest_field: 'Stärkstes Feld:', biggest_lever: 'Größter Hebel:',
    dim_strength: 'Stärke — ausbauen und als Vorteil nutzen', dim_solid: 'Solide Basis — gezielt ausbauen', dim_action: 'Handlungsbedarf — mit Priorität adressieren',
    priority_fields: 'Prioritäre Handlungsfelder', canvas_8_fields: 'AI Use-Case Canvas · 8 Felder',
    arch_layers_es: 'Architektur-Schichten', pattern_label: 'Muster', next_steps_es: 'Nächste Schritte',
    compliance_overview: 'Compliance-Überblick', compliance_sub: 'Regulatorischer Rahmen für Enterprise AI · Stand 2026',
    important_note: 'Wichtiger Hinweis', compliance_disc: 'Dieser Überblick basiert auf den im AI Navigator erfassten Daten und dient als erster Orientierungsrahmen. Führen Sie das Compliance Center für die vollständige Checkliste durch. Eine bindende Compliance-Bewertung erfordert individuelle Rechtsberatung.',
    for_board: 'Für den Vorstand / C-Level', for_tech_lead: 'Für den AI-Architekten / Technical Lead',
    quarterly_text: 'Assessment, Use-Case-Scoring und Governance-Check quartalsweise wiederholen. AI-Readiness ist kein einmaliges Projekt — die Markt- und Technologielage ändert sich. Nutzen Sie den AI Navigator als kontinuierliches Steuerungsinstrument.',
    ready_scale: 'Bereit zur Skalierung', build_phase: 'Aufbauphase', critical_action: 'Kritischer Handlungsbedarf',
    strategic_recs: 'Strategische Empfehlungen', strategic_recs_sub: 'Individuell abgeleitet aus Ihrer AI-Navigator-Analyse',
    qm_sofort: 'Sofort pilotieren', qm_budgetieren: 'Budgetieren', qm_evaluieren: 'Evaluieren', qm_zurueck: 'Zurückstellen',
    top_uc_label: 'Top-Use-Case:', top_ucs_score: 'Top Use Cases nach Score',
    more_ucs: 'weitere Use Cases im vollständigen Portfolio',
    uc_bewertet_ready: 'sofort umsetzbar', gov_no_protocol: 'Kein Protokoll verfügbar.',
    phasen_label: 'Phasen',
    uc_overview: 'Use Cases im Überblick', no_uc: 'Keine Use Cases im Portfolio', col_domain: 'Domäne', col_category: 'Kategorie',
  },
  en: {
    created_on: 'Created on', no_advice: 'Not a substitute for individual advice.',
    legal_note: '¹ Regulatory and legal references in this report are for guidance only and do not substitute individual legal or compliance advice.',
    recommendations: 'Recommendations',
    assessment_sub: 'Results Report · 6 Dimensions · Enterprise AI Navigator', of_5: 'of 5.0', results_by_dim: 'Results by Dimension',
    review_protocol: 'Review Protocol', criterion: 'Criterion', assessment_col: 'Assessment',
    phase_overview: 'Phase Overview', no_phases: 'No roadmap phases saved yet.', budget_guideline: 'Budget Guideline:', first_phase_focus: 'First Phase — Focus Topics',
    problem_solution: 'Problem & Solution', problem_opp: 'PROBLEM / OPPORTUNITY', ai_solution: 'AI SOLUTION',
    data_stakeholders: 'Data & Stakeholders', data_sources_cap: 'DATA SOURCES', stakeholders_cap: 'STAKEHOLDERS',
    success_risks: 'Success Indicators & Risks', kpi_success: 'KPIS / SUCCESS INDICATORS', risks_cap: 'RISKS',
    implementation: 'Implementation', tech_arch: 'TECHNICAL ARCHITECTURE', next_steps_cap: 'NEXT STEPS',
    canvas_sub: 'AI Use-Case Canvas · Enterprise AI Navigator',
    risk_class_label: 'EU AI Act Risk Class', eu_obligations: 'EU AI Act Obligations', gdpr_points: 'GDPR Points',
    risk_level: 'Risk Level', eu_checklist: 'EU AI Act — Obligations Checklist', gdpr_checklist: 'GDPR Checklist',
    next_step: 'Next Step', impact_label: 'Impact', probability_label: 'Probability',
    arch_layers: 'Architecture Layers', recommended_next: 'Recommended Next Steps', arch_recs: 'Architecture Recommendations', arch_sub: 'AI Architecture · Enterprise AI Navigator',
    enterprise_tagline: 'ENTERPRISE AI. STRUCTURED NAVIGATION.', modules_completed: 'Modules completed',
    top3_recs: 'Top 3 Recommendations', module_overview: 'Module Overview',
    score_kpi: 'Readiness Score\n/5.0', uc_evaluated: 'Use Cases\nevaluated', modules_kpi: 'Modules\ncompleted',
    six_dimensions: '6 Dimensions', strongest_field: 'Strongest area:', biggest_lever: 'Biggest lever:',
    dim_strength: 'Strength — expand and leverage', dim_solid: 'Solid foundation — develop further', dim_action: 'Action required — address with priority',
    priority_fields: 'Priority Action Areas', canvas_8_fields: 'AI Use-Case Canvas · 8 Fields',
    arch_layers_es: 'Architecture Layers', pattern_label: 'Pattern', next_steps_es: 'Next Steps',
    compliance_overview: 'Compliance Overview', compliance_sub: 'Regulatory Framework for Enterprise AI · As of 2026',
    important_note: 'Important Note', compliance_disc: 'This overview is based on data captured in the AI Navigator and serves as an initial orientation framework. Run the Compliance Center for the full checklist. A binding compliance assessment requires individual legal advice.',
    for_board: 'For the Board / C-Level', for_tech_lead: 'For the AI Architect / Technical Lead',
    quarterly_text: 'Repeat Assessment, Use-Case Scoring, and Governance Check quarterly. AI readiness is not a one-time project — the market and technology landscape changes. Use the AI Navigator as a continuous management instrument.',
    ready_scale: 'Ready to Scale', build_phase: 'Build Phase', critical_action: 'Critical Action Required',
    strategic_recs: 'Strategic Recommendations', strategic_recs_sub: 'Individually derived from your AI Navigator analysis',
    qm_sofort: 'Pilot now', qm_budgetieren: 'Budget for', qm_evaluieren: 'Evaluate', qm_zurueck: 'Defer',
    top_uc_label: 'Top Use Case:', top_ucs_score: 'Top Use Cases by Score',
    more_ucs: 'more use cases in the full portfolio',
    uc_bewertet_ready: 'ready to pilot', gov_no_protocol: 'No protocol available.',
    phasen_label: 'Phases',
    uc_overview: 'Use Cases Overview', no_uc: 'No use cases in portfolio', col_domain: 'Domain', col_category: 'Category',
  },
}
function pt(key: string, locale: string): string {
  return PDF_T[pdfLoc(locale)][key] ?? PDF_T.de[key] ?? key
}

// EN versions of German status/label maps
const GOV_RESULT_EN: Record<string, { label: string; color: string; bg: string }> = {
  approve:    { label: 'Approval recommended', color: C.green,   bg: C.greenBg },
  stop_dsgvo: { label: 'Stop: GDPR Issue',     color: C.red,     bg: C.redBg },
  stop_risk:  { label: 'Stop: High Risk',      color: C.red,     bg: C.redBg },
  improve:    { label: 'Needs Improvement',    color: C.amber,   bg: C.amberBg },
}
const STATUS_CFG_EN: Record<string, { label: string; color: string; bg: string }> = {
  compliant:     { label: 'Compliant',           color: C.green,   bg: C.greenBg },
  non_compliant: { label: 'Non-compliant',        color: C.red,     bg: C.redBg },
  partial:       { label: 'Partially compliant',  color: C.amber,   bg: C.amberBg },
  pending:       { label: 'Pending',              color: C.neutral, bg: C.neutralBg },
}
const QUADRANT_CFG_EN: Record<string, { label: string; color: string; bg: string }> = {
  quick_win:         { label: 'Quick Win',   color: C.green,   bg: C.greenBg },
  strategic_bet:     { label: 'Strategic',   color: '#1e3a8a', bg: '#dbeafe' },
  low_hanging_fruit: { label: 'Low Effort',  color: C.amber,   bg: C.amberBg },
  avoid:             { label: 'Avoid',       color: C.neutral, bg: C.neutralBg },
}
const DIM_LABELS_EN: Record<string, string> = {
  data: 'Data', skills: 'Skills', governance: 'Governance',
  tech: 'Technology', strategy: 'Strategy', culture: 'Culture',
}
const QUADRANT_ES_EN: Record<string, string> = {
  quick_win: 'Quick Win', strategic_bet: 'Strategic', low_hanging_fruit: 'Low Effort', avoid: 'Avoid',
}
const GOV_CFG_ES_EN: Record<string, { label: string; color: string; bg: string }> = {
  approve:    { label: 'Approved',          color: C.green, bg: C.greenBg },
  stop_dsgvo: { label: 'Stop: GDPR',        color: C.red,   bg: C.redBg },
  stop_risk:  { label: 'Stop: Risk',        color: C.red,   bg: C.redBg },
  improve:    { label: 'Needs Improvement', color: C.amber, bg: C.amberBg },
}
const CANVAS_LABELS_EN: Record<string, string> = {
  problem: 'Problem / Opportunity', solution: 'AI Solution',
  data_sources: 'Data Sources', stakeholders: 'Stakeholders',
  kpis: 'KPIs', risks: 'Risks', architecture: 'Technical Architecture', next_steps: 'Next Steps',
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────
function PdfHeader({ company, locale = 'de' }: { company?: string; locale?: string }) {
  return (
    <View style={s.hdr}>
      <Text style={s.logo}>AI Navigator</Text>
      <View style={{ alignItems: 'flex-end' }}>
        {company && <Text style={s.meta}>{company}</Text>}
        <Text style={s.meta}>{pt('created_on', locale)} {pdfDate(locale)}</Text>
      </View>
    </View>
  )
}


function PdfFooterEs({ company, locale = 'de' }: { company?: string; locale?: string }) {
  return (
    <View fixed style={[s.footer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <Text style={[s.footerTxt, { textAlign: 'left', flex: 1 }]}>
        AI Navigator · enterprise-ai.biz{company ? ` · ${company}` : ''} · {pt('no_advice', locale)}
      </Text>
      <Text
        style={[s.footerTxt, { flexShrink: 0, paddingLeft: 12 }]}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          locale === 'en' ? `Page ${pageNumber} / ${totalPages}` : `Seite ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  )
}

const ARCHETYPE_LABELS: Record<string, string> = {
  starter: 'AI Starter', scaler: 'AI Scaler', transformer: 'AI Transformer',
}

// ─── SHARED PDF BUILDING BLOCKS ──────────────────────────────────────────────
interface Rec3 { title: string; why: string; action: string }

function PdfCoverPage({ title, subtitle, companyName, locale = 'de' }: {
  title: string; subtitle?: string; companyName?: string; locale?: string
}) {
  const today = pdfDate(locale)
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

function PdfLegalNote({ locale = 'de' }: { locale?: string }) {
  return (
    <Text style={{ fontSize: 7, color: C.gray, marginTop: 20, lineHeight: 1.4 }}>
      {pt('legal_note', locale)}
    </Text>
  )
}

// ─── ASSESSMENT ──────────────────────────────────────────────────────────────
interface AssessmentPdfData {
  totalScore: number
  dimScores: Record<string, number>
  archetype: 'starter' | 'scaler' | 'transformer'
  companyName?: string
}

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

function DimBar({ label, score }: { label: string; score: number }) {
  const barColor = score >= 4 ? C.ok : score >= 3 ? C.warn : C.danger
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={[s.row, { justifyContent: 'space-between', marginBottom: 3 }]}>
        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{label}</Text>
        <Text style={{ fontSize: 10 }}>{score.toFixed(1)} / 5,0</Text>
      </View>
      <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${(score / 5) * 100}%`, backgroundColor: barColor }} />
      </View>
    </View>
  )
}

export function renderAssessmentPdf(data: AssessmentPdfData, locale = 'de'): ReactElement {
  const l = pdfLoc(locale)
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
        locale={locale}
      />

      {/* Seite 2: Ergebnisse */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>AI-Readiness Assessment</Text>
        <Text style={s.sub}>{pt('assessment_sub', locale)}</Text>

        <View wrap={false} style={{ backgroundColor: C.dark, borderRadius: 10, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ marginRight: 24 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: scoreColor }}>{data.totalScore.toFixed(1)}</Text>
            <Text style={{ fontSize: 9, color: C.gray2 }}>{pt('of_5', locale)}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'white' }}>{maturity.label[l]}</Text>
            <Text style={{ fontSize: 10, color: C.gray2, marginTop: 4 }}>{ARCHETYPE_LABELS[data.archetype] ?? data.archetype}</Text>
          </View>
        </View>

        <Text style={s.h2}>{pt('results_by_dim', locale)}</Text>
        {ASSESSMENT_DIMENSIONS.map(dim => (
          <DimBar key={dim.id} label={dim.label[l]} score={data.dimScores[dim.id] ?? 0} />
        ))}

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('recommendations', locale)}</Text>
        <Text style={s.sub}>AI-Readiness Assessment · Enterprise AI Navigator</Text>

        {topDims.map(([dimId], i) => (
          <RecCard3
            key={dimId}
            rec={ASSESSMENT_RECS[dimId] ?? { title: dimId, why: '', action: '' }}
            index={i}
            color={scoreColor}
          />
        ))}

        <PdfLegalNote locale={locale} />
        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>
    </Document>
  )
}

// ─── GOVERNANCE ──────────────────────────────────────────────────────────────
interface GovernancePdfData {
  useCaseName: string | null
  result: 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve' | null
  protocol: Array<{ question?: string; answer?: string; label?: string; value?: string }> | null
  companyName?: string
}

const GOV_RESULT: Record<string, { label: string; color: string; bg: string }> = {
  approve:    { label: 'Freigabe empfohlen',  color: C.green,   bg: C.greenBg },
  stop_dsgvo: { label: 'Stop: DSGVO-Problem', color: C.red,     bg: C.redBg },
  stop_risk:  { label: 'Stop: Hohes Risiko',  color: C.red,     bg: C.redBg },
  improve:    { label: 'Verbesserungsbedarf', color: C.amber,   bg: C.amberBg },
}

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

export function renderGovernancePdf(data: GovernancePdfData, locale = 'de'): ReactElement {
  const govCfg = locale === 'en' ? GOV_RESULT_EN : GOV_RESULT
  const res = data.result ? (govCfg[data.result] ?? govCfg.improve) : govCfg.improve
  const recs = data.result ? (GOV_RECS[data.result] ?? GOV_RECS.improve) : GOV_RECS.improve
  const rows = (data.protocol ?? []).filter(i => (i.question ?? i.label) || (i.answer ?? i.value))

  return (
    <Document title="AI-Governance Check">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title="AI-Governance Check"
        subtitle={data.useCaseName ?? undefined}
        companyName={data.companyName}
        locale={locale}
      />

      {/* Seite 2: Ergebnisse + Protokoll */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>AI-Governance Check</Text>
        <Text style={s.sub}>{data.useCaseName ?? 'Use Case'} · Enterprise AI Navigator</Text>

        <View wrap={false} style={{ backgroundColor: res.bg, borderRadius: 10, padding: 14, marginBottom: 18, alignSelf: 'flex-start' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: res.color }}>{res.label}</Text>
        </View>

        {rows.length > 0 && (
          <>
            <Text style={s.h2}>{pt('review_protocol', locale)}</Text>
            <View style={s.row}>
              <Text style={[s.th, { flex: 3 }]}>{pt('criterion', locale)}</Text>
              <Text style={[s.th, { flex: 2 }]}>{pt('assessment_col', locale)}</Text>
            </View>
            {rows.map((item, i) => (
              <View key={i} wrap={false} style={[s.row, { backgroundColor: i % 2 === 1 ? C.light : 'white' }]}>
                <Text style={[s.td, { flex: 3 }]}>{item.question ?? item.label ?? ''}</Text>
                <Text style={[s.td, { flex: 2 }]}>{item.answer ?? item.value ?? ''}</Text>
              </View>
            ))}
          </>
        )}

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('recommendations', locale)}</Text>
        <Text style={s.sub}>AI-Governance Check · Enterprise AI Navigator</Text>

        {recs.map((rec, i) => (
          <RecCard3 key={i} rec={rec} index={i} color={res.color} />
        ))}

        <PdfLegalNote locale={locale} />
        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>
    </Document>
  )
}

// ─── ROADMAP ─────────────────────────────────────────────────────────────────
interface RoadmapPhaseData {
  title: string; duration?: string; focus?: string
  actions?: Array<{ label: string; priority?: string }>; kpis?: string[]; budget?: string
}

interface RoadmapPdfData {
  title: string; archetype: string | null; phases: RoadmapPhaseData[]; companyName?: string
}

const PHASE_COLORS = ['#1d4ed8', '#0891b2', '#7c3aed']

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

export function renderRoadmapPdf(data: RoadmapPdfData, locale = 'de'): ReactElement {
  const archetypeRecs = ROADMAP_RECS[data.archetype ?? ''] ?? ROADMAP_RECS.starter
  return (
    <Document title="AI-Roadmap">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title={data.title}
        subtitle={data.archetype ? ARCHETYPE_LABELS[data.archetype] : undefined}
        companyName={data.companyName}
        locale={locale}
      />

      {/* Seite 2: Phasen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.sub}>
          AI-Roadmap{data.archetype ? ` · ${ARCHETYPE_LABELS[data.archetype] ?? data.archetype}` : ''} · Enterprise AI Navigator
        </Text>

        <Text style={s.h2}>{pt('phase_overview', locale)}</Text>
        {data.phases.length === 0 && (
          <Text style={{ fontSize: 10, color: C.gray }}>{pt('no_phases', locale)}</Text>
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
              <Text style={{ fontSize: 9, color: C.gray2, marginTop: 5 }}>{pt('budget_guideline', locale)} {phase.budget}</Text>
            )}
          </View>
        ))}

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('recommendations', locale)}</Text>
        <Text style={s.sub}>
          {data.archetype ? `${ARCHETYPE_LABELS[data.archetype] ?? data.archetype} · ` : ''}AI-Roadmap · Enterprise AI Navigator
        </Text>

        {archetypeRecs.map((rec, i) => (
          <RecCard3 key={i} rec={rec} index={i} color={C.brand} />
        ))}

        {data.phases.length > 0 && (
          <>
            <Text style={s.h2}>{pt('first_phase_focus', locale)}</Text>
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

        <PdfLegalNote locale={locale} />
        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>
    </Document>
  )
}

// ─── CANVAS ──────────────────────────────────────────────────────────────────
interface CanvasData {
  problem?: string; solution?: string; data_sources?: string; stakeholders?: string
  kpis?: string; risks?: string; architecture?: string; next_steps?: string
}

interface CanvasPdfData {
  title: string; archetype: string | null; data: CanvasData; companyName?: string
}

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

export function renderCanvasPdf(data: CanvasPdfData, locale = 'de'): ReactElement {
  return (
    <Document title="AI Use-Case Canvas">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title={data.title}
        subtitle={data.archetype ? ARCHETYPE_LABELS[data.archetype] : undefined}
        companyName={data.companyName}
        locale={locale}
      />

      {/* Seite 2: Canvas-Felder */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.sub}>
          AI Use-Case Canvas{data.archetype ? ` · ${ARCHETYPE_LABELS[data.archetype] ?? data.archetype}` : ''} · Enterprise AI Navigator
        </Text>

        <Text style={s.h2}>{pt('problem_solution', locale)}</Text>
        <View style={[s.row, { marginBottom: 8 }]}>
          <View style={{ flex: 1, marginRight: 8, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{pt('problem_opp', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.problem ?? '–'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{pt('ai_solution', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.solution ?? '–'}</Text>
          </View>
        </View>

        <Text style={s.h2}>{pt('data_stakeholders', locale)}</Text>
        <View style={[s.row, { marginBottom: 8 }]}>
          <View style={{ flex: 1, marginRight: 8, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{pt('data_sources_cap', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.data_sources ?? '–'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{pt('stakeholders_cap', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.stakeholders ?? '–'}</Text>
          </View>
        </View>

        <Text style={s.h2}>{pt('success_risks', locale)}</Text>
        <View style={[s.row, { marginBottom: 8 }]}>
          <View style={{ flex: 1, marginRight: 8, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{pt('kpi_success', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.kpis ?? '–'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{pt('risks_cap', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.risks ?? '–'}</Text>
          </View>
        </View>

        <Text style={s.h2}>{pt('implementation', locale)}</Text>
        <View style={[s.row, { marginBottom: 8 }]}>
          <View style={{ flex: 1, marginRight: 8, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{pt('tech_arch', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.architecture ?? '–'}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{pt('next_steps_cap', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark2 }}>{data.data?.next_steps ?? '–'}</Text>
          </View>
        </View>

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('recommendations', locale)}</Text>
        <Text style={s.sub}>{pt('canvas_sub', locale)}</Text>

        {canvasRecs(data.data ?? {}).map((rec, i) => (
          <RecCard3 key={i} rec={rec} index={i} color={C.brand} />
        ))}

        <PdfLegalNote locale={locale} />
        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>
    </Document>
  )
}

// ─── COMPLIANCE ──────────────────────────────────────────────────────────────
interface ComplianceCheck {
  regulation: string; check_type: string; status: string
  notes: string | null; completed_at: string | null
}

interface CompliancePdfData { checks: ComplianceCheck[]; companyName?: string }

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  compliant:     { label: 'Konform',         color: C.green,   bg: C.greenBg },
  non_compliant: { label: 'Nicht konform',   color: C.red,     bg: C.redBg },
  partial:       { label: 'Teilw. konform',  color: C.amber,   bg: C.amberBg },
  pending:       { label: 'Ausstehend',      color: C.neutral, bg: C.neutralBg },
}

export function renderCompliancePdf(data: CompliancePdfData, locale = 'de'): ReactElement {
  const l = pdfLoc(locale)
  const statusCfg = locale === 'en' ? STATUS_CFG_EN : STATUS_CFG
  // Build label lookup from config
  const labelMap = new Map<string, string>()
  for (const items of Object.values(EU_AI_ACT_OBLIGATIONS)) {
    for (const i of items) labelMap.set(i.id, `${i.article}: ${i.label[l]}`)
  }
  for (const i of DSGVO_CHECKLIST) labelMap.set(i.id, `${i.article}: ${i.label[l]}`)

  const byReg = new Map<string, ComplianceCheck[]>()
  for (const c of data.checks) {
    if (!byReg.has(c.regulation)) byReg.set(c.regulation, [])
    byReg.get(c.regulation)!.push(c)
  }

  const riskClassCheck = data.checks.find(c => c.regulation === 'eu_ai_act' && c.check_type === 'risk_class')
  const riskClassName = riskClassCheck?.notes
    ? EU_AI_ACT_RISK_CLASSES.find(r => r.id === riskClassCheck.notes)?.title[l] ?? riskClassCheck.notes
    : null

  const matrixCheck = data.checks.find(c => c.regulation === 'risk_matrix' && c.check_type === 'position')
  let matrixSummary: string | null = null
  if (matrixCheck?.notes) {
    try {
      const pos = JSON.parse(matrixCheck.notes) as { impact: number; probability: number }
      const lvl = getRiskLevel(pos.impact, pos.probability)
      matrixSummary = `${lvl.label[l]} (${pt('impact_label', locale)} ${RISK_MATRIX.impactLabels[pos.impact - 1][l]}, ${pt('probability_label', locale)} ${RISK_MATRIX.probabilityLabels[pos.probability - 1][l]})`
    } catch { /* ignore */ }
  }

  const euChecks = byReg.get('eu_ai_act')?.filter(c => c.check_type !== 'risk_class') ?? []
  const dsgvoChecks = byReg.get('dsgvo') ?? []
  const euDone = euChecks.filter(c => c.status === 'compliant').length
  const dsgvoDone = dsgvoChecks.filter(c => c.status === 'compliant').length

  const nonCompliantEU   = euChecks.filter(c => c.status === 'non_compliant').length
  const nonCompliantDSGVO = dsgvoChecks.filter(c => c.status === 'non_compliant').length
  const pendingTotal     = data.checks.filter(c => c.status === 'pending').length
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

  const renderSection = (title: string, items: ComplianceCheck[]) => {
    if (items.length === 0) return null
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={s.h2}>{title}</Text>
        {items.map((c, i) => {
          const st = statusCfg[c.status] ?? statusCfg.pending
          const label = labelMap.get(c.check_type) ?? c.check_type
          return (
            <View key={i} style={[s.row, { backgroundColor: i % 2 === 1 ? C.light : 'white', alignItems: 'flex-start' }]}>
              <View style={[s.td, { flex: 3 }]}>
                <Text style={{ fontSize: 9 }}>{label}</Text>
              </View>
              <View style={[s.td, { flex: 1 }]}>
                <View style={{ backgroundColor: st.bg, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: st.color }}>{st.label}</Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <Document title="Compliance Status Report">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title="Compliance Status Report"
        subtitle="EU AI Act · DSGVO · Risikomatrix"
        companyName={data.companyName}
      />

      {/* Seite 2: Checklisten (bisherige Seite 1 — gap-Fix in Summary-Cards) */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>Compliance Status Report</Text>
        <Text style={s.sub}>EU AI Act · DSGVO · Risikomatrix · Enterprise AI Navigator</Text>

        <View style={[s.row, { marginBottom: 18 }]}>
          {riskClassName && (
            <View style={[s.card, { flex: 2, padding: 10, marginBottom: 0, marginRight: 8 }]}>
              <Text style={{ fontSize: 8, color: C.gray, marginBottom: 3 }}>{pt('risk_class_label', locale)}</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.dark }}>{riskClassName}</Text>
            </View>
          )}
          <View style={[s.card, { flex: 1, alignItems: 'center', padding: 10, marginBottom: 0, marginRight: 8 }]}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: C.brand }}>{euDone}/{euChecks.length}</Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>{pt('eu_obligations', locale)}</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', padding: 10, marginBottom: 0 }]}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: C.ok }}>{dsgvoDone}/{dsgvoChecks.length}</Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>{pt('gdpr_points', locale)}</Text>
          </View>
        </View>

        {matrixSummary && (
          <View style={[s.card, { marginBottom: 14 }]}>
            <Text style={{ fontSize: 9, color: C.gray, marginBottom: 2 }}>{pt('risk_level', locale)}</Text>
            <Text style={{ fontSize: 10, color: C.dark }}>{matrixSummary}</Text>
          </View>
        )}

        {renderSection(pt('eu_checklist', locale), euChecks)}
        {renderSection(pt('gdpr_checklist', locale), dsgvoChecks)}

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* Seite 3: Handlungsempfehlungen (bisherige Seite 2 — mit RecCard3) */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('recommendations', locale)}</Text>
        <Text style={s.sub}>Compliance Status Report · Enterprise AI Navigator</Text>

        {complianceRecs.map((item, i) => {
          const { color, ...rec } = item
          return <RecCard3 key={i} rec={rec} index={i} color={color} />
        })}

        <View wrap={false} style={{ marginTop: 16, backgroundColor: C.dark, borderRadius: 8, padding: 14 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white', marginBottom: 6 }}>{pt('next_step', locale)}</Text>
          <Text style={{ fontSize: 9, color: C.gray2, lineHeight: 1.5 }}>
            Governance-Check im AI Navigator für jeden High-Score-Use-Case durchführen — Pflicht nach EU AI Act für Hochrisiko-Anwendungen (Art. 6, Annex III).
          </Text>
        </View>

        <PdfLegalNote locale={locale} />
        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>
    </Document>
  )
}

// ─── ARCHITECTURE ────────────────────────────────────────────────────────────
interface ArchitectureLayer { name: string; role: string; components: string[]; examples?: string }
interface ArchitectureResultData { pattern: string; description?: string; layers: ArchitectureLayer[]; nextSteps?: string[] }
interface ArchitecturePdfData { title: string; result: ArchitectureResultData; companyName?: string }

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

export function renderArchitecturePdf(data: ArchitecturePdfData, locale = 'de'): ReactElement {
  return (
    <Document title="AI-Architektur">
      {/* Seite 1: Deckblatt */}
      <PdfCoverPage
        title={data.title}
        subtitle={data.result?.pattern ?? undefined}
        companyName={data.companyName}
        locale={locale}
      />

      {/* Seite 2: Architektur-Ebenen + Next Steps */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.sub}>{locale === 'en' ? 'AI Architecture' : 'AI-Architektur'} · {data.result?.pattern ?? ''} · Enterprise AI Navigator</Text>

        {data.result?.description && (
          <View style={[s.card, { marginBottom: 16 }]}>
            <Text style={{ fontSize: 10, color: '#475569' }}>{data.result.description}</Text>
          </View>
        )}

        <Text style={s.h2}>{pt('arch_layers', locale)}</Text>
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
            <Text style={s.h2}>{pt('recommended_next', locale)}</Text>
            {data.result!.nextSteps!.map((step, i) => (
              <View key={i} style={[s.row, { marginBottom: 4, alignItems: 'flex-start' }]}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.brand, marginRight: 7, marginTop: 3 }} />
                <Text style={{ flex: 1, fontSize: 10 }}>{step}</Text>
              </View>
            ))}
          </>
        )}

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* Seite 3: Architektur-Best-Practices */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('arch_recs', locale)}</Text>
        <Text style={s.sub}>{pt('arch_sub', locale)}</Text>

        {ARCHITECTURE_RECS.map((rec, i) => (
          <RecCard3 key={i} rec={rec} index={i} color={C.brand} />
        ))}

        <PdfLegalNote locale={locale} />
        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>
    </Document>
  )
}

// ─── EXECUTIVE SUMMARY ───────────────────────────────────────────────────────
const DIM_LABELS_ES: Record<string, string> = {
  data: 'Daten', skills: 'Skills', governance: 'Governance',
  tech: 'Technologie', strategy: 'Strategie', culture: 'Kultur',
}
const GOV_CFG_ES: Record<string, { label: string; color: string; bg: string }> = {
  approve:    { label: 'Freigegeben',         color: C.green, bg: C.greenBg },
  stop_dsgvo: { label: 'Stop: DSGVO',         color: C.red,   bg: C.redBg },
  stop_risk:  { label: 'Stop: Risiko',        color: C.red,   bg: C.redBg },
  improve:    { label: 'Verbesserungsbedarf', color: C.amber, bg: C.amberBg },
}
const QUADRANT_ES: Record<string, string> = {
  quick_win: 'Quick Win', strategic_bet: 'Strategisch',
  low_hanging_fruit: 'Geringer Aufwand', avoid: 'Vermeiden',
}
const CANVAS_LABELS_ES: Record<string, string> = {
  problem: 'Problem / Opportunität', solution: 'KI-Lösung',
  data_sources: 'Datenquellen', stakeholders: 'Stakeholder',
  kpis: 'KPIs', risks: 'Risiken',
  architecture: 'Technische Architektur', next_steps: 'Nächste Schritte',
}
const CANVAS_FIELD_ORDER = ['problem', 'solution', 'data_sources', 'stakeholders', 'kpis', 'risks', 'architecture', 'next_steps']

interface ESPhaseData {
  title: string; duration?: string; focus?: string
  actions?: Array<{ label: string }>; kpis?: string[]
}

interface ExecutiveSummaryPdfData {
  companyName?: string
  completedModules: number
  totalModules: number
  moduleStatus: Array<{ label: string; done: boolean }>
  assessment?: { archetype: string; totalScore: number; dimScores: Record<string, number> }
  useCaseCount: number
  topUseCases: Array<{ name: string; weightedScore: number | null; quadrant: string | null; domain?: string | null }>
  governance?: { useCaseName: string | null; result: string; protocol?: Array<{ question?: string; answer?: string; label?: string; value?: string }> }
  roadmap?: { title: string; archetype: string | null; phases: ESPhaseData[] }
  canvas?: { title: string; data: Record<string, string> }
  architecture?: { title: string; result: { pattern: string; description?: string; layers: Array<{ name: string; role: string; components: string[] }>; nextSteps?: string[] } }
}

function boardRecs(data: ExecutiveSummaryPdfData): string[] {
  const recs: string[] = []
  const score = data.assessment?.totalScore ?? 0
  const arch = data.assessment?.archetype
  const dims = data.assessment?.dimScores ?? {}

  if (arch === 'starter')
    recs.push('Pilotprojekt-Strategie: Fokus auf 1–2 Use Cases mit klarem ROI-Nachweis. Ressourcen bündeln statt verteilen — Tiefe vor Breite.')
  else if (arch === 'scaler')
    recs.push('Skalierungs-Agenda: Erfolgreiche Piloten systematisch ausrollen. AI-Center-of-Excellence als interne Kompetenzplattform aufbauen und Investment verdreifachen.')
  else if (arch === 'transformer')
    recs.push('Marktführer-Position: AI als strategischen Wettbewerbsvorteil aktiv kommunizieren. Differenzierung durch proprietäre Daten und domänenspezifische Modelle sichern.')

  const sorted = Object.entries(dims).sort(([, a], [, b]) => a - b)
  const weakest = sorted[0]
  if (weakest && weakest[1] < 3) {
    const actions: Record<string, string> = {
      data:       'Daten-Qualitätsprogramm sofort starten — ohne belastbare Daten kein skalierbares AI.',
      skills:     'AI-Talentprogramm: internes Upskilling + gezielte externe Rekrutierung von ML-Engineers.',
      governance: 'AI-Governance-Framework verabschieden — RACI, Genehmigungsprozesse, Risikoschwellwerte.',
      tech:       'Technologie-Modernisierung: API-Strategie und Cloud-Readiness als AI-Voraussetzung beschleunigen.',
      strategy:   'AI-Strategie formal im nächsten Board-Meeting verabschieden — Vision, Ziele, messbare KPIs.',
      culture:    'Change-Management-Programm: AI-Akzeptanz aktiv aufbauen, Executive-Sponsorship sichern.',
    }
    if (actions[weakest[0]])
      recs.push(`Handlungsprioritär (${DIM_LABELS_ES[weakest[0]] ?? weakest[0]}, Score ${weakest[1].toFixed(1)}/5): ${actions[weakest[0]]}`)
  }

  if (data.governance?.result?.startsWith('stop'))
    recs.push('Compliance-Stopp auflösen: Vor jeder Skalierung Governance-Blocker beheben — AI-Deployment ohne Rechtskonformität ist unkalkulierbares Haftungsrisiko.')
  else if (data.governance?.result === 'approve')
    recs.push('Governance-Freigabe genutzt: Use Case ethisch und rechtlich geprüft. Skalierung auf Basis dieses Frameworks strukturieren und dokumentieren.')

  const quickWins = data.topUseCases.filter(u => u.quadrant === 'quick_win').length
  if (quickWins > 0)
    recs.push(`${quickWins} Quick-Win-Use-Case${quickWins > 1 ? 's' : ''} priorisieren: Schnelle Umsetzung schafft Momentum und Budget-Rechtfertigung für weitere AI-Investitionen.`)

  const pct = Math.round((data.completedModules / data.totalModules) * 100)
  recs.push(pct >= 70
    ? `Vollständige Analyse (${pct}%): Ergebnisse als Basis für Quartals-Review und Budgetplanung nutzen. Quarterly AI Health Review als festen Termin etablieren.`
    : `Analyse vervollständigen (${pct}%): Compliance-Center und Architektur-Generator abschließen für fundierte Gesamtbewertung.`)

  if (score > 0 && score < 2.5)
    recs.push('Kritischer Handlungsbedarf: AI-Readiness-Score unter 2,5 — Fundamentprogramm mit externem AI-Sparring starten, bevor Projekte beginnen.')
  else if (score >= 4)
    recs.push('Starkes Fundament: Score ≥ 4,0 — AI-Kompetenz als Brand-Differenzierung einsetzen und Industrieführerschaft in AI-Anwendung aktiv anstreben.')

  return recs.slice(0, 6)
}

function archRecs(data: ExecutiveSummaryPdfData): string[] {
  const recs: string[] = []
  const dims = data.assessment?.dimScores ?? {}
  const dataScore = dims.data ?? 3
  const skillsScore = dims.skills ?? 3
  const techScore = dims.tech ?? 3
  const pattern = data.architecture?.result?.pattern

  if (pattern)
    recs.push(`Muster "${pattern}" konsequent durchhalten: Datenschicht, Modellschicht und Serving-Schicht getrennt deployen — unabhängige Skalierung und klare Wartungsgrenzen.`)

  if (dataScore < 3)
    recs.push('Daten-Fundament zuerst: Feature Store und Data Catalog einführen (Datahub, OpenMetadata). Ohne dokumentierte, reproduzierbare Daten-Assets ist kein valides ML-Training möglich.')
  else
    recs.push('Daten-Pipeline optimieren: Lakehouse-Pattern evaluieren (Delta Lake / Apache Iceberg). Real-time Feature Engineering für niedrige Inferenz-Latenz vorbereiten.')

  if (skillsScore < 3 || techScore < 3)
    recs.push('MLOps von Anfang an: Model Registry (MLflow) + CI/CD für Modelle einrichten. Automatisiertes Retraining, A/B-Tests und Drift-Monitoring einplanen — nicht nachrüsten.')
  else
    recs.push('LLMOps-Reife: Prompt-Versionierung, Evaluation-Pipelines und A/B-Testing aufsetzen. RAG-Architektur für domänenspezifisches Unternehmenswissen evaluieren.')

  const canvasArch = data.canvas?.data?.architecture ?? ''
  if (/sap|btp/i.test(canvasArch))
    recs.push('SAP-Integration: SAP AI Core + BTP als Plattform-Rückgrat. Side-by-Side-Extension-Pattern — kein SAP-Kern-Eingriff. ABAP-to-API-Adapter für Legacy-Datenzugriff.')
  else
    recs.push('API-First-Architektur: AI-Services als RESTful Microservices bereitstellen. Event-Driven-Patterns (Kafka/Pub-Sub) für asynchrone Inference — Backend-Systeme entkoppeln.')

  if (data.governance?.result === 'stop_dsgvo')
    recs.push('Privacy-by-Design: Datenlokalisierung EU, Pseudonymisierung in der Pipeline, DSGVO-konforme Audit-Logs für jede AI-Entscheidung implementieren.')
  else
    recs.push('EU AI Act Compliance: Explainability-Layer einbauen (SHAP/LIME für Hochrisiko-Modelle). Audit-Trail nach Art. 13–17 EU AI Act implementieren.')

  recs.push('Iterativer Navigator-Zyklus: Canvas → Scoring → Governance → Architektur quartalsweise wiederholen. KPI-Benchmarks aus dem Assessment als Messlatte für Fortschritt nutzen.')

  return recs.slice(0, 6)
}

export function renderExecutiveSummaryPdf(data: ExecutiveSummaryPdfData, locale = 'de'): ReactElement {
  const l = pdfLoc(locale)
  const dimLabels = locale === 'en' ? DIM_LABELS_EN : DIM_LABELS_ES
  const govCfgEs  = locale === 'en' ? GOV_CFG_ES_EN : GOV_CFG_ES
  const quadrantEs = locale === 'en' ? QUADRANT_ES_EN : QUADRANT_ES
  const canvasLabels = locale === 'en' ? CANVAS_LABELS_EN : CANVAS_LABELS_ES

  const score      = data.assessment?.totalScore ?? 0
  const govResult  = data.governance?.result ?? ''
  const completionPct = data.completedModules / Math.max(data.totalModules, 1)
  const scoreColor = score >= 4 ? C.ok : score >= 3 ? C.warn : score > 0 ? C.danger : C.gray

  const ampelKey: 'gruen' | 'gelb' | 'rot' =
    (score > 0 && score < 2.5) || govResult.startsWith('stop') ? 'rot' :
    score >= 4 && completionPct >= 0.7 ? 'gruen' : 'gelb'

  const scoreStr = score > 0 ? score.toFixed(1) : '–'
  const modStr = `${data.completedModules}/${data.totalModules}`
  const AMPEL: Record<string, { label: string; color: string; bg: string; text: string; desc: string }> = {
    gruen: { label: pt('ready_scale', locale), color: C.ok,     bg: C.greenBg, text: C.green,
      desc: locale === 'en'
        ? `With a score of ${scoreStr}/5.0 and ${modStr} completed modules, your organisation is well positioned. Now it's time to scale consistently.`
        : `Mit einem Score von ${scoreStr}/5,0 und ${modStr} abgeschlossenen Modulen ist Ihr Unternehmen solide aufgestellt. Jetzt kommt es auf konsequente Skalierung an.` },
    gelb:  { label: pt('build_phase', locale),  color: C.warn,   bg: C.amberBg, text: C.amber,
      desc: locale === 'en'
        ? `Score ${scoreStr}/5.0 — the foundations are in place. Targeted investments in identified gaps are the key to successful AI projects.`
        : `Score ${scoreStr}/5,0 — die Grundlagen sind vorhanden. Gezielte Investitionen in die identifizierten Lücken sind der Schlüssel zu erfolgreichen KI-Projekten.` },
    rot:   { label: pt('critical_action', locale), color: C.danger, bg: C.redBg,   text: C.red,
      desc: locale === 'en'
        ? `Score ${scoreStr}/5.0 — before starting AI projects, the critical foundational areas must be addressed. A structured build-up programme saves considerable costs in the long run.`
        : `Score ${scoreStr}/5,0 — bevor KI-Projekte starten, müssen die kritischen Grundlagenfelder adressiert werden. Strukturiertes Aufbauprogramm spart langfristig erhebliche Kosten.` },
  }
  const ampel = AMPEL[ampelKey]
  const top3  = boardRecs(data).slice(0, 3)

  // Modul-Übersicht in expliziten Dreier-Reihen (kein flexWrap + %)
  const moduleRows: Array<typeof data.moduleStatus> = []
  for (let i = 0; i < data.moduleStatus.length; i += 3) moduleRows.push(data.moduleStatus.slice(i, i + 3))

  return (
    <Document title="Executive Summary">

      {/* ── SEITE 1: DECKBLATT ─────────────────────────────────────────────── */}
      <Page size="A4" style={{ fontFamily: 'Helvetica', flexDirection: 'column', backgroundColor: C.dark }}>
        <View style={{ backgroundColor: C.brand, height: 5 }} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 60 }}>
          <Text style={{ fontSize: 36, fontWeight: 'bold', color: C.brand, marginBottom: 6 }}>AI Navigator</Text>
          <Text style={{ fontSize: 10, color: C.gray2, letterSpacing: 2, marginBottom: 50 }}>{pt('enterprise_tagline', locale)}</Text>
          <View style={{ width: 200, height: 1, backgroundColor: C.brand, marginBottom: 50 }} />
          <Text style={{ fontSize: 9, color: C.gray, letterSpacing: 3, marginBottom: 14 }}>EXECUTIVE SUMMARY</Text>
          {data.companyName ? (
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 6 }}>
              {data.companyName}
            </Text>
          ) : null}
          <Text style={{ fontSize: 9, color: C.gray, marginTop: 20 }}>{pt('created_on', locale)} {pdfDate(locale)}</Text>
        </View>
        <View style={{ paddingHorizontal: 60, paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.dark2, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 9, color: C.gray }}>enterprise-ai.biz</Text>
          <Text style={{ fontSize: 9, color: C.gray }}>{data.completedModules}/{data.totalModules} {pt('modules_completed', locale)}</Text>
        </View>
      </Page>

      {/* ── SEITE 2: EXECUTIVE SUMMARY ─────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>Executive Summary</Text>

        {/* Gesamtstatus — volle Breite, kein split */}
        <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: ampel.color, backgroundColor: ampel.bg, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
            <View style={{ backgroundColor: ampel.color, width: 6, borderRadius: 6 }} />
            <View style={{ flex: 1, padding: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ampel.color, marginRight: 7 }} />
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: ampel.text }}>{ampel.label}</Text>
              </View>
              <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5 }}>{ampel.desc}</Text>
            </View>
          </View>
        </View>

        {/* KPI-Zeile — marginRight statt gap */}
        <View wrap={false} style={{ flexDirection: 'row', marginBottom: 14 }}>
          <View style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 10, marginBottom: 0, marginRight: 6 }]}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: scoreColor }}>{score > 0 ? score.toFixed(1) : '–'}</Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2, textAlign: 'center' }}>{pt('score_kpi', locale)}</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 10, marginBottom: 0, marginRight: 6 }]}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: C.brand }}>{data.useCaseCount}</Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2, textAlign: 'center' }}>{pt('uc_evaluated', locale)}</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 10, marginBottom: 0, marginRight: data.governance ? 6 : 0 }]}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: completionPct >= 0.8 ? C.ok : C.warn }}>
              {data.completedModules}/{data.totalModules}
            </Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2, textAlign: 'center' }}>{pt('modules_kpi', locale)}</Text>
          </View>
          {data.governance ? (
            <View style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 10, marginBottom: 0 }]}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: govCfgEs[data.governance.result]?.color ?? C.gray, textAlign: 'center' }}>
                {govCfgEs[data.governance.result]?.label ?? '–'}
              </Text>
              <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>Governance</Text>
            </View>
          ) : null}
        </View>

        {/* Top-3 Empfehlungen */}
        <Text style={s.h2}>{pt('top3_recs', locale)}</Text>
        {top3.map((rec, i) => (
          <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.brand, borderRadius: 6, backgroundColor: C.light, padding: 10, marginBottom: 7 }}>
            <View style={{ backgroundColor: C.brand, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 1 }}>
              <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{i + 1}</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec}</Text>
          </View>
        ))}

        {/* Modulübersicht — explizite Rows à 3, kein flexWrap+% */}
        <Text style={s.h2}>{pt('module_overview', locale)}</Text>
        {moduleRows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', marginBottom: 5 }}>
            {row.map((m, ci) => (
              <View key={ci} style={{
                flex: 1, marginRight: ci < row.length - 1 ? 5 : 0,
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: m.done ? C.greenBg : C.light,
                borderWidth: 1, borderColor: m.done ? C.ok : C.border,
                borderRadius: 5, paddingHorizontal: 7, paddingVertical: 5,
              }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: m.done ? C.ok : C.border, marginRight: 5, flexShrink: 0 }} />
                <Text style={{ fontSize: 8, color: m.done ? C.green : C.gray, flex: 1 }}>{m.label}</Text>
              </View>
            ))}
          </View>
        ))}

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* ── SEITE 3: ASSESSMENT ────────────────────────────────────────────── */}
      {data.assessment ? (() => {
        const dims     = data.assessment!.dimScores
        const sorted   = Object.entries(dims).sort(([, a], [, b]) => Number(b) - Number(a))
        const strongest = sorted[0]
        const weakest   = sorted[sorted.length - 1]
        const gapActions: Record<string, string> = {
          data:       'Datenstrategie aufsetzen: Masterdatenmodell, Data Governance und Feature Store definieren — ohne Datenfundament kein skalierbares AI.',
          skills:     'AI-Talentprogramm: Internes Upskilling für Fachteams + gezielte Rekrutierung von ML-Engineers und Data Scientists.',
          governance: 'AI-Governance in 4 Wochen: RACI-Matrix, Risikoklassifizierung nach EU AI Act und Freigabeprozess dokumentieren.',
          tech:       'Tech-Readiness: API-Strategie für Kernsysteme (ERP, CRM) entwickeln und Cloud-Infrastruktur für AI-Workloads vorbereiten.',
          strategy:   'AI-Strategie verabschieden: Vision, messbare 12-Monats-Ziele und Investitionsrahmen im nächsten Board-Meeting beschließen.',
          culture:    'Change-Management: AI-Literacy-Programm für Fachteams + Executive-Sponsorship sichern und erste sichtbare Quick Wins kommunizieren.',
        }
        return (
          <Page size="A4" style={s.page}>
            <PdfHeader company={data.companyName} locale={locale} />

            {/* Score-Banner mit Stärken/Schwächen-Fazit */}
            <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: scoreColor, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginRight: 14, minWidth: 56 }}>
                <Text style={{ fontSize: 34, fontWeight: 'bold', color: scoreColor, lineHeight: 1 }}>{data.assessment!.totalScore.toFixed(1)}</Text>
                <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>{locale === 'en' ? '/ 5.0' : '/ 5,0'}</Text>
              </View>
              <View style={{ width: 1, height: 48, backgroundColor: C.border, marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 4 }}>
                  {ARCHETYPE_LABELS[data.assessment!.archetype] ?? data.assessment!.archetype}
                </Text>
                {strongest && weakest ? (
                  <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.4 }}>
                    {pt('strongest_field', locale)} {dimLabels[strongest[0]] ?? strongest[0]} ({Number(strongest[1]).toFixed(1)}{locale === 'en' ? '/5.0' : '/5,0'}).
                    {' '}{pt('biggest_lever', locale)} {dimLabels[weakest[0]] ?? weakest[0]} ({Number(weakest[1]).toFixed(1)}{locale === 'en' ? '/5.0' : '/5,0'}).
                  </Text>
                ) : null}
              </View>
            </View>

            <Text style={s.h2}>{pt('six_dimensions', locale)}</Text>
            {sorted.map(([dim, dimScore]) => {
              const n   = Number(dimScore)
              const col = n >= 4 ? C.ok : n >= 3 ? C.warn : C.danger
              return (
                <View key={dim} wrap={false} style={{ marginBottom: 9 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark }}>{dimLabels[dim] ?? dim}</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: col }}>{n.toFixed(1)} {locale === 'en' ? '/ 5.0' : '/ 5,0'}</Text>
                  </View>
                  <View style={{ backgroundColor: C.border, borderRadius: 3, height: 8, marginBottom: 2 }}>
                    <View style={{ backgroundColor: col, borderRadius: 3, height: 8, width: `${Math.round((n / 5) * 100)}%` }} />
                  </View>
                  <Text style={{ fontSize: 8, color: C.gray }}>
                    {n >= 4 ? pt('dim_strength', locale) : n >= 3 ? pt('dim_solid', locale) : pt('dim_action', locale)}
                  </Text>
                </View>
              )
            })}

            {(() => {
              const gaps = sorted.slice(-2).filter(([, v]) => Number(v) < 4).reverse()
              return gaps.length > 0 ? (
                <>
                  <Text style={s.h2}>{pt('priority_fields', locale)}</Text>
                  {gaps.map(([dim, gs], i) => (
                    <View key={dim} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.danger, borderRadius: 6, backgroundColor: C.light, padding: 10, marginBottom: 7 }}>
                      <Text style={{ fontSize: 9, color: C.danger, fontWeight: 'bold', marginRight: 8 }}>{i + 1}.</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark, marginBottom: 2 }}>
                          {dimLabels[dim] ?? dim} — Score {Number(gs).toFixed(1)}{locale === 'en' ? '/5.0' : '/5,0'}
                        </Text>
                        <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.5 }}>{gapActions[dim] ?? ''}</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : null
            })()}

            <PdfFooterEs company={data.companyName} locale={locale} />
          </Page>
        )
      })() : null}

      {/* ── SEITE 4: USE-CASE PORTFOLIO ─────────────────────────────────────── */}
      {data.topUseCases.length > 0 ? (() => {
        const counts: Record<string, number> = { quick_win: 0, strategic_bet: 0, low_hanging_fruit: 0, avoid: 0 }
        data.topUseCases.forEach(u => { if (u.quadrant && u.quadrant in counts) counts[u.quadrant]++ })
        const topUC   = data.topUseCases[0]
        const qwCount = counts.quick_win
        const quadrantMeta = [
          { key: 'quick_win',         label: quadrantEs['quick_win'],         color: C.ok,     bg: C.greenBg,  note: pt('qm_sofort', locale) },
          { key: 'strategic_bet',     label: quadrantEs['strategic_bet'],     color: C.brand,  bg: '#dbeafe',  note: pt('qm_budgetieren', locale) },
          { key: 'low_hanging_fruit', label: quadrantEs['low_hanging_fruit'], color: C.warn,   bg: C.amberBg,  note: pt('qm_evaluieren', locale) },
          { key: 'avoid',             label: quadrantEs['avoid'],             color: C.danger, bg: C.redBg,    note: pt('qm_zurueck', locale) },
        ]
        return (
          <Page size="A4" style={s.page}>
            <PdfHeader company={data.companyName} locale={locale} />

            {/* Insight-Banner */}
            <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: C.brand, backgroundColor: C.light, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 4 }}>
                {data.useCaseCount} {locale === 'en' ? 'use cases evaluated' : 'Use Cases bewertet'}{qwCount > 0 ? ` · ${qwCount} ${pt('uc_bewertet_ready', locale)}` : ''}
              </Text>
              {topUC ? (
                <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.5 }}>
                  {pt('top_uc_label', locale)}{' '}
                  <Text style={{ fontWeight: 'bold', color: C.dark }}>{topUC.name}</Text>
                  {topUC.weightedScore != null ? ` (Score ${topUC.weightedScore.toFixed(2)})` : ''}
                  {topUC.quadrant === 'quick_win'
                    ? (locale === 'en' ? ' — Quick Win: high value, low effort. Pilot now.' : ' — Quick Win: hoher Wert bei geringem Aufwand. Sofort pilotieren.')
                    : topUC.quadrant === 'strategic_bet'
                    ? (locale === 'en' ? ' — Strategic: long-term value, budget planning recommended.' : ' — Strategisch: langfristiger Wert, Budgetplanung empfohlen.')
                    : ''}
                </Text>
              ) : null}
            </View>

            {/* Quadrant-Tiles — marginRight statt gap */}
            <View wrap={false} style={{ flexDirection: 'row', marginBottom: 14 }}>
              {quadrantMeta.map((q, i) => (
                <View key={q.key} style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 10, marginBottom: 0, marginRight: i < 3 ? 6 : 0, backgroundColor: q.bg, borderColor: q.color }]}>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: q.color }}>{counts[q.key] ?? 0}</Text>
                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: q.color, marginTop: 2 }}>{q.label}</Text>
                  <Text style={{ fontSize: 7, color: C.gray, marginTop: 1 }}>{q.note}</Text>
                </View>
              ))}
            </View>

            <Text style={s.h2}>{pt('top_ucs_score', locale)}</Text>
            <View style={{ flexDirection: 'row', backgroundColor: C.dark2, borderRadius: 4 }}>
              <Text style={[s.th, { flex: 3 }]}>Use Case</Text>
              <Text style={[s.th, { flex: 1.2 }]}>{pt('col_domain', locale)}</Text>
              <Text style={[s.th, { flex: 0.8, textAlign: 'center' }]}>Score</Text>
              <Text style={[s.th, { flex: 1.5 }]}>{pt('col_category', locale)}</Text>
            </View>
            {data.topUseCases.map((uc, i) => {
              const qLabel = quadrantEs[uc.quadrant ?? ''] ?? '–'
              const qColor = uc.quadrant === 'quick_win' ? C.ok : uc.quadrant === 'avoid' ? C.danger : uc.quadrant === 'strategic_bet' ? C.brand : C.warn
              return (
                <View key={i} wrap={false} style={{ flexDirection: 'row', backgroundColor: i % 2 === 1 ? C.light : 'white' }}>
                  <Text style={[s.td, { flex: 3, fontWeight: i === 0 ? 'bold' : 'normal' }]}>{uc.name}</Text>
                  <Text style={[s.td, { flex: 1.2 }]}>{uc.domain ?? '–'}</Text>
                  <Text style={[s.td, { flex: 0.8, textAlign: 'center', fontWeight: 'bold', color: C.brand }]}>
                    {uc.weightedScore != null ? uc.weightedScore.toFixed(2) : '–'}
                  </Text>
                  <Text style={[s.td, { flex: 1.5, color: qColor, fontWeight: 'bold' }]}>{qLabel}</Text>
                </View>
              )
            })}
            {data.useCaseCount > data.topUseCases.length ? (
              <Text style={{ fontSize: 8, color: C.gray, marginTop: 6, textAlign: 'center' }}>
                + {data.useCaseCount - data.topUseCases.length} {pt('more_ucs', locale)}
              </Text>
            ) : null}

            <PdfFooterEs company={data.companyName} locale={locale} />
          </Page>
        )
      })() : null}

      {/* ── SEITE 5: GOVERNANCE ────────────────────────────────────────────── */}
      {data.governance ? (() => {
        const cfg = govCfgEs[data.governance!.result]
        const resultDesc = data.governance!.result === 'approve'
          ? (locale === 'en'
            ? 'The use case has passed ethical, legal, and EU AI Act review. Implementation can begin.'
            : 'Der Use Case hat die ethische, rechtliche und EU AI Act-Prüfung bestanden. Umsetzung kann beginnen.')
          : data.governance!.result === 'conditional'
          ? (locale === 'en'
            ? 'Implementation possible with conditions — the identified requirements must be met before go-live.'
            : 'Umsetzung möglich unter Auflagen — die identifizierten Bedingungen müssen vor Go-Live erfüllt sein.')
          : (locale === 'en'
            ? 'Implementation stopped — critical compliance blockers must be resolved before the project can continue.'
            : 'Umsetzung gestoppt — kritische Compliance-Blocker müssen behoben werden, bevor das Projekt fortgeführt wird.')
        return (
          <Page size="A4" style={s.page}>
            <PdfHeader company={data.companyName} locale={locale} />

            <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: cfg?.color ?? C.border, backgroundColor: cfg?.bg ?? C.light, padding: 14, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: cfg?.color ?? C.gray, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 6, marginRight: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: 'white' }}>
                    {cfg?.label ?? data.governance!.result}
                  </Text>
                </View>
                {data.governance!.useCaseName ? (
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.dark, flex: 1 }}>
                    {data.governance!.useCaseName}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.5 }}>{resultDesc}</Text>
            </View>

            <Text style={s.h2}>{pt('review_protocol', locale)}</Text>
            {data.governance!.protocol && data.governance!.protocol.length > 0 ? (
              data.governance!.protocol.slice(0, 14).map((step, i) => {
                const q = step.question ?? step.label ?? ''
                const a = step.answer ?? step.value ?? ''
                if (!q && !a) return null
                return (
                  <View key={i} wrap={false} style={{ borderLeftWidth: 2, borderLeftColor: C.border, paddingLeft: 9, marginBottom: 7 }}>
                    {q ? <Text style={{ fontSize: 8, color: C.gray, marginBottom: 2 }}>{q}</Text> : null}
                    {a ? <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark }}>{a}</Text> : null}
                  </View>
                )
              })
            ) : (
              <Text style={{ fontSize: 9, color: C.gray }}>{pt('gov_no_protocol', locale)}</Text>
            )}

            <PdfFooterEs company={data.companyName} locale={locale} />
          </Page>
        )
      })() : null}

      {/* ── SEITE 6: ROADMAP ───────────────────────────────────────────────── */}
      {data.roadmap ? (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} locale={locale} />

          <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: C.brand, backgroundColor: C.light, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: C.brand, borderRadius: 5, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', marginRight: 14, minWidth: 56 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{data.roadmap.phases.length}</Text>
              <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)' }}>{pt('phasen_label', locale)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 3 }}>{data.roadmap.title}</Text>
              <Text style={{ fontSize: 9, color: C.gray }}>
                {data.roadmap.archetype ? (ARCHETYPE_LABELS[data.roadmap.archetype] ?? data.roadmap.archetype) : ''}
                {data.roadmap.phases[0]?.duration ? ` · Startphase: ${data.roadmap.phases[0].duration}` : ''}
              </Text>
            </View>
          </View>

          {data.roadmap.phases.map((phase, i) => (
            <View key={i} wrap={false} style={{ borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.brand, borderRadius: 6, backgroundColor: C.light, padding: 10, marginBottom: 7 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark, flex: 1 }}>Phase {i + 1}: {phase.title}</Text>
                {phase.duration ? <Text style={{ fontSize: 9, color: C.brand, fontWeight: 'bold', marginLeft: 8 }}>{phase.duration}</Text> : null}
              </View>
              {phase.focus ? <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.4, marginBottom: 4 }}>{phase.focus}</Text> : null}
              {phase.actions && phase.actions.length > 0 ?
                phase.actions.slice(0, 4).map((a, j) => (
                  <View key={j} style={{ flexDirection: 'row', marginBottom: 2 }}>
                    <Text style={{ fontSize: 9, color: C.brand, marginRight: 4 }}>▸</Text>
                    <Text style={{ fontSize: 9, color: C.dark, flex: 1 }}>{a.label}</Text>
                  </View>
                )) : null}
              {phase.kpis && phase.kpis.length > 0 ? (
                <Text style={{ fontSize: 8, color: C.gray, marginTop: 3 }}>KPIs: {phase.kpis.slice(0, 3).join(' · ')}</Text>
              ) : null}
            </View>
          ))}

          <PdfFooterEs company={data.companyName} locale={locale} />
        </Page>
      ) : null}

      {/* ── SEITE 7: CANVAS ────────────────────────────────────────────────── */}
      {data.canvas ? (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} locale={locale} />

          <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: C.brand, backgroundColor: C.light, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: C.dark, marginBottom: 2 }}>{data.canvas.title}</Text>
            <Text style={{ fontSize: 9, color: C.gray }}>{pt('canvas_8_fields', locale)}</Text>
          </View>

          {/* 2-Spalten-Grid als explizite Rows — kein flexWrap+% */}
          {(() => {
            const filled = CANVAS_FIELD_ORDER.filter(k => (data.canvas!.data[k] ?? '').trim())
            const rows: string[][] = []
            for (let i = 0; i < filled.length; i += 2) rows.push(filled.slice(i, i + 2))
            return rows.map((row, ri) => (
              <View key={ri} wrap={false} style={{ flexDirection: 'row', marginBottom: 8 }}>
                {row.map((key, ci) => (
                  <View key={key} style={[s.card, { flex: 1, marginRight: ci === 0 ? 8 : 0, marginBottom: 0 }]}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.brand, marginBottom: 3 }}>
                      {canvasLabels[key] ?? key}
                    </Text>
                    <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.4 }}>
                      {(data.canvas!.data[key] ?? '').length > 180
                        ? (data.canvas!.data[key] ?? '').slice(0, 180) + '…'
                        : (data.canvas!.data[key] ?? '')}
                    </Text>
                  </View>
                ))}
              </View>
            ))
          })()}

          <PdfFooterEs company={data.companyName} locale={locale} />
        </Page>
      ) : null}

      {/* ── SEITE 8: ARCHITEKTUR ───────────────────────────────────────────── */}
      {data.architecture ? (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} locale={locale} />

          <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: C.brand, backgroundColor: C.light, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: C.dark, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', marginRight: 14, minWidth: 70 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.brand }}>{data.architecture.result.pattern}</Text>
              <Text style={{ fontSize: 7, color: C.gray2, marginTop: 2 }}>{pt('pattern_label', locale)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 3 }}>{data.architecture.title}</Text>
              {data.architecture.result.description ? (
                <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.3 }}>{data.architecture.result.description}</Text>
              ) : null}
            </View>
          </View>

          <Text style={s.h2}>{pt('arch_layers_es', locale)}</Text>
          {data.architecture.result.layers.map((layer, i) => (
            <View key={i} wrap={false} style={[s.card, { marginBottom: 7 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark }}>{layer.name}</Text>
                <Text style={{ fontSize: 9, color: C.gray }}>{layer.role}</Text>
              </View>
              {layer.components.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {layer.components.map((comp, j) => (
                    <View key={j} style={{ backgroundColor: C.border, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginRight: 4, marginBottom: 3 }}>
                      <Text style={{ fontSize: 8, color: C.dark }}>{comp}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ))}

          {data.architecture.result.nextSteps && data.architecture.result.nextSteps.length > 0 ? (
            <>
              <Text style={s.h2}>{pt('next_steps_es', locale)}</Text>
              {data.architecture.result.nextSteps.slice(0, 4).map((step, i) => (
                <View key={i} wrap={false} style={{ flexDirection: 'row', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.brand, marginRight: 5 }}>{i + 1}.</Text>
                  <Text style={{ fontSize: 9, color: C.dark, flex: 1 }}>{step}</Text>
                </View>
              ))}
            </>
          ) : null}

          <PdfFooterEs company={data.companyName} locale={locale} />
        </Page>
      ) : null}

      {/* ── SEITE 9: COMPLIANCE ────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('compliance_overview', locale)}</Text>
        <Text style={s.sub}>{pt('compliance_sub', locale)}</Text>

        {[
          {
            name: 'EU AI Act', articles: 'Art. 6–10, 13–17, 69',
            scope: locale === 'en'
              ? 'Risk classification of AI systems, high-risk obligations (documentation, audit log, human oversight), transparency towards users.'
              : 'Risikoklassifizierung von KI-Systemen, Hochrisiko-Pflichten (Dokumentation, Audit-Log, menschliche Aufsicht), Transparenz gegenüber Nutzern.',
            status: govResult.startsWith('stop')
              ? (locale === 'en' ? 'Stop — Immediate Action' : 'Stopp — Sofortmaßnahme')
              : govResult === 'approve'
              ? (locale === 'en' ? 'Reviewed — Approved' : 'Geprüft — Freigegeben')
              : govResult === 'conditional'
              ? (locale === 'en' ? 'Reviewed — Conditions' : 'Geprüft — Auflagen')
              : (locale === 'en' ? 'Pending' : 'Ausstehend'),
            color: govResult.startsWith('stop') ? C.danger : govResult === 'approve' ? C.ok : govResult === 'conditional' ? C.warn : C.gray,
          },
          {
            name: 'DSGVO / GDPR', articles: 'Art. 5, 22, 25, 35',
            scope: locale === 'en'
              ? 'Data minimisation, purpose limitation, automated decisions (Art. 22), Data Protection Impact Assessment (DPIA) for high-risk AI (Art. 35).'
              : 'Datenminimierung, Zweckbindung, automatisierte Entscheidungen (Art. 22), Datenschutz-Folgenabschätzung (DSFA) bei Hochrisiko-AI (Art. 35).',
            status: govResult === 'stop_dsgvo'
              ? (locale === 'en' ? 'Review required' : 'Prüfung erforderlich')
              : govResult === 'approve'
              ? (locale === 'en' ? 'Reviewed' : 'Geprüft')
              : (locale === 'en' ? 'Pending' : 'Ausstehend'),
            color: govResult === 'stop_dsgvo' ? C.warn : govResult === 'approve' ? C.ok : C.gray,
          },
          {
            name: 'ISO 27001', articles: 'Annex A.8, A.12',
            scope: locale === 'en'
              ? 'Information security management, access control for AI models and training data, incident response for AI systems.'
              : 'Informationssicherheits-Management, Zugriffssteuerung für AI-Modelle und Trainingsdaten, Incident-Response für AI-Systeme.',
            status: locale === 'en' ? 'Self-assess' : 'Eigenverantwortlich prüfen', color: C.gray,
          },
          {
            name: 'NIS2-Richtlinie', articles: 'Art. 21, 23',
            scope: locale === 'en'
              ? 'Critical infrastructure: security measures for AI-based systems, reporting obligations for AI security incidents (24-hour deadline).'
              : 'Kritische Infrastrukturen: Sicherheitsmaßnahmen für KI-basierte Systeme, Meldepflichten bei AI-Sicherheitsvorfällen (24-Stunden-Frist).',
            status: locale === 'en' ? 'Self-assess' : 'Eigenverantwortlich prüfen', color: C.gray,
          },
        ].map((reg, i) => (
          <View key={i} wrap={false} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 6, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.dark2, borderRadius: 5, paddingHorizontal: 10, paddingVertical: 7 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white', flex: 1 }}>{reg.name}</Text>
              <Text style={{ fontSize: 8, color: C.gray2, marginRight: 10 }}>{reg.articles}</Text>
              <View style={{ backgroundColor: reg.color, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: 'white' }}>{reg.status}</Text>
              </View>
            </View>
            <View style={{ padding: 10 }}>
              <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.5 }}>{reg.scope}</Text>
            </View>
          </View>
        ))}

        <View wrap={false} style={{ borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.warn, borderRadius: 6, backgroundColor: C.amberBg, padding: 10, marginTop: 4 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.amber, marginBottom: 3 }}>{pt('important_note', locale)}</Text>
          <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5 }}>
            {locale === 'en'
              ? 'This overview is based on data captured in the AI Navigator and serves as an initial orientation. Run the Compliance Centre for the full checklist. A binding compliance assessment requires individual legal advice.'
              : 'Dieser Überblick basiert auf den im AI Navigator erfassten Daten und dient als erster Orientierungsrahmen. Führen Sie das Compliance Center für die vollständige Checkliste durch. Eine bindende Compliance-Bewertung erfordert individuelle Rechtsberatung.'}
          </Text>
        </View>

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* ── SEITE 10: STRATEGISCHE EMPFEHLUNGEN ─────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('strategic_recs', locale)}</Text>
        <Text style={s.sub}>{pt('strategic_recs_sub', locale)}</Text>

        <Text style={s.h2}>{pt('for_board', locale)}</Text>
        {boardRecs(data).map((rec, i) => (
          <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.brand, borderRadius: 6, backgroundColor: C.light, padding: 10, marginBottom: 7 }}>
            <View style={{ backgroundColor: C.brand, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 1 }}>
              <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{i + 1}</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec}</Text>
          </View>
        ))}

        <Text style={s.h2}>{pt('for_tech_lead', locale)}</Text>
        {archRecs(data).map((rec, i) => (
          <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.ok, borderRadius: 6, backgroundColor: C.light, padding: 10, marginBottom: 7 }}>
            <View style={{ backgroundColor: C.ok, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 1 }}>
              <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{i + 1}</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec}</Text>
          </View>
        ))}

        <View wrap={false} style={{ marginTop: 12, backgroundColor: C.dark, borderRadius: 8, padding: 14 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white', marginBottom: 5 }}>Quarterly AI Health Review</Text>
          <Text style={{ fontSize: 9, color: C.gray2, lineHeight: 1.5 }}>{pt('quarterly_text', locale)}</Text>
        </View>

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

    </Document>
  )
}

// ─── USE CASE PORTFOLIO ──────────────────────────────────────────────────────
interface UseCaseEntry { name: string; domain: string | null; description: string | null; weighted_score: number | null; quadrant: string | null }
interface UsecasePdfData { portfolioName: string; useCases: UseCaseEntry[]; companyName?: string }

const QUADRANT_CFG: Record<string, { label: string; color: string; bg: string }> = {
  quick_win:         { label: 'Quick Win',      color: C.green,   bg: C.greenBg },
  strategic_bet:     { label: 'Strategisch',    color: '#1e3a8a', bg: '#dbeafe' },
  low_hanging_fruit: { label: 'Niedr. Aufwand', color: C.amber,   bg: C.amberBg },
  avoid:             { label: 'Vermeiden',      color: C.neutral, bg: C.neutralBg },
}

export function renderUsecasePdf(data: UsecasePdfData, locale = 'de'): ReactElement {
  const sorted = [...data.useCases].sort((a, b) => (b.weighted_score ?? 0) - (a.weighted_score ?? 0))
  const quadrantCfg = locale === 'en' ? QUADRANT_CFG_EN : QUADRANT_CFG
  const counts = Object.fromEntries(Object.keys(quadrantCfg).map(q => [q, data.useCases.filter(u => u.quadrant === q).length]))

  return (
    <Document title="Use-Case Portfolio">
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{data.portfolioName}</Text>
        <Text style={s.sub}>Use-Case Portfolio · {data.useCases.length} Use Cases · Enterprise AI Navigator</Text>

        <View style={[s.row, { marginBottom: 18 }]}>
          {Object.entries(quadrantCfg).map(([key, cfg], i, arr) => (
            <View key={key} style={[s.card, { flex: 1, alignItems: 'center', padding: 10, marginBottom: 0, ...(i < arr.length - 1 ? { marginRight: 8 } : {}) }]}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: cfg.color }}>{counts[key] ?? 0}</Text>
              <Text style={{ fontSize: 9, color: C.gray, marginTop: 2 }}>{cfg.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>{pt('uc_overview', locale)}</Text>
        <View style={s.row}>
          <Text style={[s.th, { flex: 3 }]}>Name</Text>
          <Text style={[s.th, { flex: 1 }]}>{pt('col_domain', locale)}</Text>
          <Text style={[s.th, { flex: 1, textAlign: 'center' }]}>Score</Text>
          <Text style={[s.th, { flex: 1 }]}>{pt('col_category', locale)}</Text>
        </View>
        {sorted.length === 0 && (
          <View style={s.row}>
            <Text style={[s.td, { flex: 1, color: C.gray, textAlign: 'center' }]}>{pt('no_uc', locale)}</Text>
          </View>
        )}
        {sorted.map((uc, i) => {
          const q = uc.quadrant ? (quadrantCfg[uc.quadrant] ?? null) : null
          return (
            <View key={i} style={[s.row, { backgroundColor: i % 2 === 1 ? C.light : 'white' }]}>
              <View style={[s.td, { flex: 3 }]}>
                <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{uc.name}</Text>
                {uc.description && (
                  <Text style={{ fontSize: 9, color: C.gray }}>
                    {uc.description.length > 80 ? uc.description.slice(0, 80) + '...' : uc.description}
                  </Text>
                )}
              </View>
              <Text style={[s.td, { flex: 1 }]}>{uc.domain ?? '–'}</Text>
              <Text style={[s.td, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>
                {uc.weighted_score != null ? uc.weighted_score.toFixed(2) : '–'}
              </Text>
              <View style={[s.td, { flex: 1 }]}>
                {q && (
                  <View style={{ backgroundColor: q.bg, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: q.color }}>{q.label}</Text>
                  </View>
                )}
              </View>
            </View>
          )
        })}
        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>

      {/* ── Seite 2: Handlungsempfehlungen ────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} locale={locale} />
        <Text style={s.h1}>{pt('recommendations', locale)}</Text>
        <Text style={s.sub}>Use-Case Portfolio · Enterprise AI Navigator</Text>

        {(() => {
          const quickWins = data.useCases.filter(u => u.quadrant === 'quick_win')
          const strategic = data.useCases.filter(u => u.quadrant === 'strategic_bet')
          const avoid     = data.useCases.filter(u => u.quadrant === 'avoid')
          const topUc     = sorted[0]
          const recs: Array<{ title: string; text: string; color: string }> = []

          if (quickWins.length > 0)
            recs.push({ color: C.ok,
              title: `${quickWins.length} Quick Win${quickWins.length > 1 ? 's' : ''} sofort starten`,
              text: `${quickWins.map(u => u.name).join(', ')} — Hoher Wert bei geringem Umsetzungsaufwand. In die Umsetzungsplanung aufnehmen und innerhalb von 60 Tagen pilotieren.` })

          if (topUc && topUc.quadrant !== 'quick_win')
            recs.push({ color: C.brand,
              title: `Top-Use-Case "${topUc.name}" priorisieren`,
              text: `Höchster Score im Portfolio (${topUc.weighted_score?.toFixed(2) ?? '–'}). Governance-Check durchführen, Canvas detaillieren und Pilotplanung starten.` })

          if (strategic.length > 0)
            recs.push({ color: '#1e3a8a',
              title: `${strategic.length} strategische${strategic.length > 1 ? ' Use Cases' : 'n Use Case'} budgetieren`,
              text: `${strategic.map(u => u.name).join(', ')} — Langfristiger strategischer Wert. In Jahresbudget und Roadmap verankern, dediziertes Team einplanen.` })

          recs.push({ color: C.warn,
            title: 'Scoring quartalsweise aktualisieren',
            text: 'Use-Case-Bewertungen regelmäßig überprüfen — Marktbedingungen, Datenlage und Ressourcenverfügbarkeit ändern sich. Gewichtungen bei Bedarf anpassen.' })

          if (avoid.length > 0)
            recs.push({ color: C.danger,
              title: `${avoid.length} Use Case${avoid.length > 1 ? 's' : ''} deprioritisieren`,
              text: `${avoid.map(u => u.name).join(', ')} — Derzeit nicht empfohlen. Ressourcen auf Quick Wins und strategische Use Cases fokussieren.` })

          recs.push({ color: C.dark2,
            title: 'Governance-Check für Top-Use-Cases durchführen',
            text: 'Vor Pilotstart jeden High-Score-Use-Case durch den AI-Governance-Check führen — Pflicht nach EU AI Act für Hochrisiko-Anwendungen.' })

          return recs.map((rec, i) => (
            <View key={i} style={[s.card, { marginBottom: 10, borderLeftWidth: 3, borderLeftColor: rec.color }]}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: rec.color, marginBottom: 4 }}>{i + 1}. {rec.title}</Text>
              <Text style={{ fontSize: 10, color: C.dark, lineHeight: 1.5 }}>{rec.text}</Text>
            </View>
          ))
        })()}

        <PdfFooterEs company={data.companyName} locale={locale} />
      </Page>
    </Document>
  )
}
