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

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────
function PdfHeader({ company }: { company?: string }) {
  return (
    <View style={s.hdr}>
      <Text style={s.logo}>AI Navigator</Text>
      <View style={{ alignItems: 'flex-end' }}>
        {company && <Text style={s.meta}>{company}</Text>}
        <Text style={s.meta}>Erstellt am {formatDate(new Date())}</Text>
      </View>
    </View>
  )
}

function PdfFooter() {
  return (
    <View fixed style={s.footer}>
      <Text style={s.footerTxt}>
        AI Navigator · enterprise-ai.biz · Dieser Bericht ersetzt keine individuelle Rechts- oder Unternehmensberatung.
      </Text>
    </View>
  )
}

const ARCHETYPE_LABELS: Record<string, string> = {
  starter: 'AI Starter', scaler: 'AI Scaler', transformer: 'AI Transformer',
}

// ─── ASSESSMENT ──────────────────────────────────────────────────────────────
interface AssessmentPdfData {
  totalScore: number
  dimScores: Record<string, number>
  archetype: 'starter' | 'scaler' | 'transformer'
  companyName?: string
}

const ASSESSMENT_RECS: Record<string, string> = {
  data:       'Data-Governance-Initiative starten, Masterdatenmodell definieren.',
  skills:     'AI-Upskilling-Programm aufsetzen, AI-Champions benennen.',
  governance: 'AI-Policy und RACI in den nächsten 4 Wochen dokumentieren.',
  tech:       'API-Strategie für Kernsysteme entwickeln, Cloud-Readiness prüfen.',
  strategy:   'AI-Strategie im nächsten Board-Meeting verabschieden.',
  culture:    'Executive-Sponsorship sichern, AI-Kulturprogramm starten.',
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

export function renderAssessmentPdf(data: AssessmentPdfData): ReactElement {
  const maturity = getMaturityLevel(data.totalScore)
  const scoreColor = data.totalScore >= 4 ? C.ok : data.totalScore >= 3 ? C.warn : C.danger
  const topDims = Object.entries(data.dimScores).sort(([, a], [, b]) => a - b).slice(0, 3)

  return (
    <Document title="AI-Readiness Assessment">
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>AI-Readiness Assessment</Text>
        <Text style={s.sub}>Ergebnisbericht · 6 Dimensionen · Enterprise AI Navigator</Text>

        <View style={{ backgroundColor: C.dark, borderRadius: 10, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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

        <Text style={s.h2}>Top Handlungsempfehlungen</Text>
        {topDims.map(([dimId, score]) => {
          const dim = ASSESSMENT_DIMENSIONS.find(d => d.id === dimId)
          return (
            <View key={dimId} style={[s.row, { marginBottom: 6, alignItems: 'flex-start' }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand, marginRight: 8, marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10 }}>
                  <Text style={{ fontWeight: 'bold' }}>{dim?.label ?? dimId}</Text>
                  {` (${score.toFixed(1)}/5): ${ASSESSMENT_RECS[dimId] ?? 'Handlungsfeld analysieren.'}`}
                </Text>
              </View>
            </View>
          )
        })}
        <PdfFooter />
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

export function renderGovernancePdf(data: GovernancePdfData): ReactElement {
  const res = data.result ? (GOV_RESULT[data.result] ?? GOV_RESULT.improve) : GOV_RESULT.improve
  const rows = (data.protocol ?? []).filter(i => (i.question ?? i.label) || (i.answer ?? i.value))

  return (
    <Document title="AI-Governance Check">
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>AI-Governance Check</Text>
        <Text style={s.sub}>{data.useCaseName ?? 'Use Case'} · Enterprise AI Navigator</Text>

        <View style={{ backgroundColor: res.bg, borderRadius: 10, padding: 14, marginBottom: 18, alignSelf: 'flex-start' }}>
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
              <View key={i} style={[s.row, { backgroundColor: i % 2 === 1 ? C.light : 'white' }]}>
                <Text style={[s.td, { flex: 3 }]}>{item.question ?? item.label ?? ''}</Text>
                <Text style={[s.td, { flex: 2 }]}>{item.answer ?? item.value ?? ''}</Text>
              </View>
            ))}
          </>
        )}
        <PdfFooter />
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

export function renderRoadmapPdf(data: RoadmapPdfData): ReactElement {
  return (
    <Document title="AI-Roadmap">
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
          <View key={idx} style={{ borderLeftWidth: 3, borderLeftColor: PHASE_COLORS[idx] ?? C.brand, paddingLeft: 12, marginBottom: 16 }}>
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
              <View style={[s.row, { flexWrap: 'wrap', gap: 4, marginTop: 6 }]}>
                {(phase.kpis ?? []).map((k, ki) => (
                  <View key={ki} style={{ backgroundColor: '#eff6ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
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
        <PdfFooter />
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

function CanvasSection({ label, value }: { label: string; value?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10 }}>
      <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.gray, marginBottom: 4 }}>{label.toUpperCase()}</Text>
      <Text style={{ fontSize: 10, color: C.dark2 }}>{value ?? '–'}</Text>
    </View>
  )
}

export function renderCanvasPdf(data: CanvasPdfData): ReactElement {
  return (
    <Document title="AI Use-Case Canvas">
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.sub}>
          AI Use-Case Canvas{data.archetype ? ` · ${ARCHETYPE_LABELS[data.archetype] ?? data.archetype}` : ''} · Enterprise AI Navigator
        </Text>

        <Text style={s.h2}>Problem &amp; Lösung</Text>
        <View style={[s.row, { gap: 8, marginBottom: 8 }]}>
          <CanvasSection label="Problem / Opportunität" value={data.data?.problem} />
          <CanvasSection label="KI-Lösung" value={data.data?.solution} />
        </View>

        <Text style={s.h2}>Daten &amp; Stakeholder</Text>
        <View style={[s.row, { gap: 8, marginBottom: 8 }]}>
          <CanvasSection label="Datenquellen" value={data.data?.data_sources} />
          <CanvasSection label="Stakeholder" value={data.data?.stakeholders} />
        </View>

        <Text style={s.h2}>Erfolgsindikatoren &amp; Risiken</Text>
        <View style={[s.row, { gap: 8, marginBottom: 8 }]}>
          <CanvasSection label="KPIs / Erfolgsindikatoren" value={data.data?.kpis} />
          <CanvasSection label="Risiken" value={data.data?.risks} />
        </View>

        <Text style={s.h2}>Umsetzung</Text>
        <View style={[s.row, { gap: 8 }]}>
          <CanvasSection label="Technische Architektur" value={data.data?.architecture} />
          <CanvasSection label="Nächste Schritte" value={data.data?.next_steps} />
        </View>
        <PdfFooter />
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
const REG_LABELS: Record<string, string> = { eu_ai_act: 'EU AI Act', dsgvo: 'DSGVO', internal: 'Intern' }

export function renderCompliancePdf(data: CompliancePdfData): ReactElement {
  // Build label lookup from config
  const labelMap = new Map<string, string>()
  for (const items of Object.values(EU_AI_ACT_OBLIGATIONS)) {
    for (const i of items) labelMap.set(i.id, `${i.article}: ${i.label}`)
  }
  for (const i of DSGVO_CHECKLIST) labelMap.set(i.id, `${i.article}: ${i.label}`)

  const byReg = new Map<string, ComplianceCheck[]>()
  for (const c of data.checks) {
    if (!byReg.has(c.regulation)) byReg.set(c.regulation, [])
    byReg.get(c.regulation)!.push(c)
  }

  const riskClassCheck = data.checks.find(c => c.regulation === 'eu_ai_act' && c.check_type === 'risk_class')
  const riskClassName = riskClassCheck?.notes
    ? EU_AI_ACT_RISK_CLASSES.find(r => r.id === riskClassCheck.notes)?.title ?? riskClassCheck.notes
    : null

  const matrixCheck = data.checks.find(c => c.regulation === 'risk_matrix' && c.check_type === 'position')
  let matrixSummary: string | null = null
  if (matrixCheck?.notes) {
    try {
      const pos = JSON.parse(matrixCheck.notes) as { impact: number; probability: number }
      const lvl = getRiskLevel(pos.impact, pos.probability)
      matrixSummary = `${lvl.label} (Auswirkung ${RISK_MATRIX.impactLabels[pos.impact - 1]}, Wahrscheinlichkeit ${RISK_MATRIX.probabilityLabels[pos.probability - 1]})`
    } catch { /* ignore */ }
  }

  const euChecks = byReg.get('eu_ai_act')?.filter(c => c.check_type !== 'risk_class') ?? []
  const dsgvoChecks = byReg.get('dsgvo') ?? []
  const euDone = euChecks.filter(c => c.status === 'compliant').length
  const dsgvoDone = dsgvoChecks.filter(c => c.status === 'compliant').length

  const renderSection = (title: string, items: ComplianceCheck[]) => {
    if (items.length === 0) return null
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={s.h2}>{title}</Text>
        {items.map((c, i) => {
          const st = STATUS_CFG[c.status] ?? STATUS_CFG.pending
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
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Compliance Status Report</Text>
        <Text style={s.sub}>EU AI Act · DSGVO · Risikomatrix · Enterprise AI Navigator</Text>

        {/* Summary cards */}
        <View style={[s.row, { gap: 8, marginBottom: 18 }]}>
          {riskClassName && (
            <View style={[s.card, { flex: 2, padding: 10, marginBottom: 0 }]}>
              <Text style={{ fontSize: 8, color: C.gray, marginBottom: 3 }}>EU AI Act Risikoklasse</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.dark }}>{riskClassName}</Text>
            </View>
          )}
          <View style={[s.card, { flex: 1, alignItems: 'center', padding: 10, marginBottom: 0 }]}>
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

        <PdfFooter />
      </Page>
    </Document>
  )
}

// ─── ARCHITECTURE ────────────────────────────────────────────────────────────
interface ArchitectureLayer { name: string; role: string; components: string[]; examples?: string }
interface ArchitectureResultData { pattern: string; description?: string; layers: ArchitectureLayer[]; nextSteps?: string[] }
interface ArchitecturePdfData { title: string; result: ArchitectureResultData; companyName?: string }

export function renderArchitecturePdf(data: ArchitecturePdfData): ReactElement {
  return (
    <Document title="AI-Architektur">
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
          <View key={i} style={{ marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 10 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark2 }}>{layer.name}</Text>
            <Text style={{ fontSize: 10, color: C.gray, marginTop: 2, marginBottom: 6 }}>{layer.role}</Text>
            <View style={[s.row, { flexWrap: 'wrap', gap: 3 }]}>
              {layer.components.map((comp, ci) => (
                <View key={ci} style={{ backgroundColor: '#eff6ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
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
            {data.result.nextSteps!.map((step, i) => (
              <View key={i} style={[s.row, { marginBottom: 4, alignItems: 'flex-start' }]}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.brand, marginRight: 7, marginTop: 3 }} />
                <Text style={{ flex: 1, fontSize: 10 }}>{step}</Text>
              </View>
            ))}
          </>
        )}
        <PdfFooter />
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

export function renderExecutiveSummaryPdf(data: ExecutiveSummaryPdfData): ReactElement {
  const scoreColor = data.assessment
    ? data.assessment.totalScore >= 4 ? C.ok : data.assessment.totalScore >= 3 ? C.warn : C.danger
    : C.gray

  return (
    <Document title="Executive Summary">

      {/* ── SEITE 1: Überblick / Dashboard ─────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Executive Summary</Text>
        <Text style={s.sub}>Enterprise AI Navigator · {data.completedModules} von {data.totalModules} Modulen abgeschlossen</Text>

        <View style={[s.row, { gap: 8, marginBottom: 18 }]}>
          <View style={[s.card, { flex: 1, alignItems: 'center', padding: 12, marginBottom: 0 }]}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: scoreColor }}>
              {data.assessment ? data.assessment.totalScore.toFixed(1) : '–'}
            </Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>AI-Readiness Score</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', padding: 12, marginBottom: 0 }]}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: C.brand }}>{data.useCaseCount}</Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>Use Cases bewertet</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', padding: 12, marginBottom: 0 }]}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: data.completedModules >= 5 ? C.ok : C.warn }}>
              {data.completedModules}/{data.totalModules}
            </Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>Module abgeschlossen</Text>
          </View>
          {data.governance && (
            <View style={[s.card, { flex: 1, alignItems: 'center', padding: 12, marginBottom: 0 }]}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: GOV_CFG_ES[data.governance.result]?.color ?? C.gray, textAlign: 'center' }}>
                {GOV_CFG_ES[data.governance.result]?.label ?? data.governance.result}
              </Text>
              <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>Governance</Text>
            </View>
          )}
        </View>

        {data.assessment && (
          <>
            <Text style={s.h2}>AI-Archetyp</Text>
            <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }]}>
              <View style={{ backgroundColor: C.dark, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 26, fontWeight: 'bold', color: scoreColor }}>{data.assessment.totalScore.toFixed(1)}</Text>
                <Text style={{ fontSize: 8, color: C.gray2, textAlign: 'center' }}>/ 5,0</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: C.dark, marginBottom: 4 }}>
                  {ARCHETYPE_LABELS[data.assessment.archetype] ?? data.assessment.archetype}
                </Text>
                <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.4 }}>
                  {data.assessment.archetype === 'starter' && 'Am Anfang der AI-Reise — Fokus auf erste Pilotprojekte mit klarem ROI.'}
                  {data.assessment.archetype === 'scaler' && 'Erfolgreiche Piloten vorhanden — systematische Skalierung und AI-Kompetenzaufbau.'}
                  {data.assessment.archetype === 'transformer' && 'AI als Teil der Unternehmens-DNA — Differenzierung durch proprietäre Daten und Modelle.'}
                </Text>
              </View>
            </View>
          </>
        )}

        <Text style={s.h2}>Modulübersicht</Text>
        {data.moduleStatus.map((m, i) => (
          <View key={i} style={[s.row, { alignItems: 'center', gap: 8, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.border }]}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: m.done ? C.ok : C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {m.done && <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>✓</Text>}
            </View>
            <Text style={{ fontSize: 10, color: m.done ? C.dark : C.gray, flex: 1 }}>{m.label}</Text>
            <Text style={{ fontSize: 9, color: m.done ? C.ok : C.gray2, fontWeight: m.done ? 'bold' : 'normal' }}>
              {m.done ? 'Abgeschlossen' : 'Ausstehend'}
            </Text>
          </View>
        ))}

        <PdfFooter />
      </Page>

      {/* ── SEITE 2: Assessment-Details ─────────────────────────────────────── */}
      {data.assessment && (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />
          <Text style={s.h1}>AI-Readiness Assessment</Text>
          <Text style={s.sub}>Detailauswertung der 6 Dimensionen</Text>

          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }]}>
            <View style={{ backgroundColor: C.dark, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 30, fontWeight: 'bold', color: scoreColor }}>{data.assessment.totalScore.toFixed(1)}</Text>
              <Text style={{ fontSize: 8, color: C.gray2, textAlign: 'center' }}>/ 5,0</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: C.dark, marginBottom: 4 }}>
                {ARCHETYPE_LABELS[data.assessment.archetype] ?? data.assessment.archetype}
              </Text>
              <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.4 }}>
                Gesamt-Score basiert auf 6 Dimensionen. Skala: 1 (sehr schwach) bis 5 (sehr stark).
              </Text>
            </View>
          </View>

          <Text style={s.h2}>Dimensionen im Detail</Text>
          {Object.entries(data.assessment.dimScores).map(([dim, score]) => {
            const n = Number(score)
            const col = n >= 4 ? C.ok : n >= 3 ? C.warn : C.danger
            return (
              <View key={dim} style={{ marginBottom: 12 }}>
                <View style={[s.row, { justifyContent: 'space-between', marginBottom: 3 }]}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark }}>{DIM_LABELS_ES[dim] ?? dim}</Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: col }}>{n.toFixed(1)} / 5,0</Text>
                </View>
                <View style={{ backgroundColor: C.border, borderRadius: 4, height: 10 }}>
                  <View style={{ backgroundColor: col, borderRadius: 4, height: 10, width: `${(n / 5) * 100}%` }} />
                </View>
                <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>
                  {n >= 4 ? 'Stärke — weiter ausbauen' : n >= 3 ? 'Solide Basis — gezielt verbessern' : 'Handlungsbedarf — priorisiert adressieren'}
                </Text>
              </View>
            )
          })}

          {(() => {
            const gaps = Object.entries(data.assessment.dimScores)
              .sort(([, a], [, b]) => Number(a) - Number(b))
              .slice(0, 3)
              .filter(([, v]) => Number(v) < 4)
            const gapHints: Record<string, string> = {
              data:       'Datenstrategie, -qualität und -verfügbarkeit für AI-Anwendungen ausbauen.',
              skills:     'AI/ML-Kompetenzen intern aufbauen und Recruiting für Data Scientists schärfen.',
              governance: 'AI-Governance-Richtlinien, Risikoklassifizierung und Freigabeprozesse einführen.',
              tech:       'Technische Infrastruktur und API-Readiness für AI-Workloads modernisieren.',
              strategy:   'AI-Strategie formalisieren: Vision, messbare Ziele und Investitionsrahmen.',
              culture:    'Change-Management und AI-Literacy-Programme etablieren, Führung als Vorbild.',
            }
            return gaps.length > 0 ? (
              <>
                <Text style={s.h2}>Prioritäre Verbesserungsfelder</Text>
                {gaps.map(([dim, score], i) => (
                  <View key={dim} style={[s.card, { marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.danger }]}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark, marginBottom: 3 }}>
                      {i + 1}. {DIM_LABELS_ES[dim] ?? dim} — Score {Number(score).toFixed(1)}/5,0
                    </Text>
                    <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.4 }}>{gapHints[dim] ?? ''}</Text>
                  </View>
                ))}
              </>
            ) : null
          })()}

          <PdfFooter />
        </Page>
      )}

      {/* ── SEITE 3: Use-Case Portfolio ─────────────────────────────────────── */}
      {data.topUseCases.length > 0 && (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />
          <Text style={s.h1}>Use-Case Portfolio</Text>
          <Text style={s.sub}>Top {data.topUseCases.length} Use Cases nach Score · {data.useCaseCount} gesamt bewertet</Text>

          {(() => {
            const counts: Record<string, number> = { quick_win: 0, strategic_bet: 0, low_hanging_fruit: 0, avoid: 0 }
            data.topUseCases.forEach(u => { if (u.quadrant && u.quadrant in counts) counts[u.quadrant]++ })
            const labels: Record<string, string> = { quick_win: 'Quick Win', strategic_bet: 'Strategisch', low_hanging_fruit: 'Geringer Aufwand', avoid: 'Vermeiden' }
            return (
              <View style={[s.row, { gap: 8, marginBottom: 16 }]}>
                {Object.entries(labels).map(([key, label]) => (
                  <View key={key} style={[s.card, { flex: 1, alignItems: 'center', padding: 8, marginBottom: 0 }]}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: C.brand }}>{counts[key] ?? 0}</Text>
                    <Text style={{ fontSize: 8, color: C.gray, textAlign: 'center', marginTop: 2 }}>{label}</Text>
                  </View>
                ))}
              </View>
            )
          })()}

          <View style={s.row}>
            <Text style={[s.th, { flex: 3 }]}>Use Case</Text>
            <Text style={[s.th, { flex: 1.2 }]}>Domäne</Text>
            <Text style={[s.th, { flex: 0.8, textAlign: 'center' }]}>Score</Text>
            <Text style={[s.th, { flex: 1.5 }]}>Kategorie</Text>
          </View>
          {data.topUseCases.map((uc, i) => {
            const qLabel = QUADRANT_ES[uc.quadrant ?? ''] ?? uc.quadrant ?? '–'
            const qColor = uc.quadrant === 'quick_win' ? C.ok : uc.quadrant === 'avoid' ? C.danger : C.warn
            return (
              <View key={i} style={[s.row, { backgroundColor: i % 2 === 1 ? C.light : 'white' }]}>
                <Text style={[s.td, { flex: 3, fontWeight: i === 0 ? 'bold' : 'normal' }]}>{uc.name}</Text>
                <Text style={[s.td, { flex: 1.2 }]}>{uc.domain ?? '–'}</Text>
                <Text style={[s.td, { flex: 0.8, textAlign: 'center', fontWeight: 'bold', color: C.brand }]}>
                  {uc.weightedScore != null ? uc.weightedScore.toFixed(2) : '–'}
                </Text>
                <Text style={[s.td, { flex: 1.5, color: uc.quadrant ? qColor : C.gray }]}>{qLabel}</Text>
              </View>
            )
          })}
          {data.useCaseCount > data.topUseCases.length && (
            <Text style={{ fontSize: 9, color: C.gray, marginTop: 8, textAlign: 'center' }}>
              + {data.useCaseCount - data.topUseCases.length} weitere Use Cases im Portfolio
            </Text>
          )}

          <PdfFooter />
        </Page>
      )}

      {/* ── SEITE 4: Governance ─────────────────────────────────────────────── */}
      {data.governance && (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />
          <Text style={s.h1}>Governance-Check</Text>
          <Text style={s.sub}>Ethische, rechtliche und EU-AI-Act-Prüfung des Use Cases</Text>

          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }]}>
            {data.governance.useCaseName && (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, color: C.gray, marginBottom: 2 }}>Geprüfter Use Case</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: C.dark }}>{data.governance.useCaseName}</Text>
              </View>
            )}
            <View style={{
              backgroundColor: GOV_CFG_ES[data.governance.result]?.bg ?? C.light,
              borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: GOV_CFG_ES[data.governance.result]?.color ?? C.dark }}>
                {GOV_CFG_ES[data.governance.result]?.label ?? data.governance.result}
              </Text>
              <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>Ergebnis</Text>
            </View>
          </View>

          {data.governance.protocol && data.governance.protocol.length > 0 && (
            <>
              <Text style={s.h2}>Prüfprotokoll</Text>
              {data.governance.protocol.slice(0, 14).map((step, i) => {
                const q = step.question ?? step.label ?? ''
                const a = step.answer ?? step.value ?? ''
                if (!q && !a) return null
                return (
                  <View key={i} style={{ marginBottom: 8, borderLeftWidth: 2, borderLeftColor: C.border, paddingLeft: 8 }}>
                    {q ? <Text style={{ fontSize: 9, color: C.gray, marginBottom: 2 }}>{q}</Text> : null}
                    {a ? <Text style={{ fontSize: 10, color: C.dark, fontWeight: 'bold' }}>{a}</Text> : null}
                  </View>
                )
              })}
            </>
          )}

          <PdfFooter />
        </Page>
      )}

      {/* ── SEITE 5: Roadmap ────────────────────────────────────────────────── */}
      {data.roadmap && (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />
          <Text style={s.h1}>AI-Roadmap</Text>
          <Text style={s.sub}>
            {data.roadmap.title}
            {data.roadmap.archetype ? ` · ${ARCHETYPE_LABELS[data.roadmap.archetype] ?? data.roadmap.archetype}` : ''}
            {` · ${data.roadmap.phases.length} Phasen`}
          </Text>

          {data.roadmap.phases.map((phase, i) => (
            <View key={i} style={[s.card, { marginBottom: 10 }]}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }]}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.dark }}>Phase {i + 1}: {phase.title}</Text>
                {phase.duration && <Text style={{ fontSize: 9, color: C.brand, fontWeight: 'bold' }}>{phase.duration}</Text>}
              </View>
              {phase.focus && <Text style={{ fontSize: 9, color: C.gray, marginBottom: 6, lineHeight: 1.4 }}>{phase.focus}</Text>}
              {phase.actions && phase.actions.length > 0 && (
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.dark2, marginBottom: 3 }}>Maßnahmen:</Text>
                  {phase.actions.slice(0, 5).map((a, j) => (
                    <View key={j} style={[s.row, { gap: 4, marginBottom: 2 }]}>
                      <Text style={{ fontSize: 9, color: C.brand }}>▸</Text>
                      <Text style={{ fontSize: 9, color: C.dark, flex: 1 }}>{a.label}</Text>
                    </View>
                  ))}
                </View>
              )}
              {phase.kpis && phase.kpis.length > 0 && (
                <View>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.dark2, marginBottom: 3 }}>KPIs:</Text>
                  <Text style={{ fontSize: 9, color: C.gray }}>{phase.kpis.slice(0, 3).join(' · ')}</Text>
                </View>
              )}
            </View>
          ))}

          <PdfFooter />
        </Page>
      )}

      {/* ── SEITE 6: Canvas ─────────────────────────────────────────────────── */}
      {data.canvas && (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />
          <Text style={s.h1}>AI Use-Case Canvas</Text>
          <Text style={s.sub}>{data.canvas.title} · 8-Felder-Canvas</Text>

          <View style={[s.row, { flexWrap: 'wrap', gap: 10 }]}>
            {CANVAS_FIELD_ORDER.map(key => {
              const value = data.canvas!.data[key] ?? ''
              if (!value.trim()) return null
              return (
                <View key={key} style={[s.card, { width: '47%', marginBottom: 0 }]}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.brand, marginBottom: 4 }}>
                    {CANVAS_LABELS_ES[key] ?? key}
                  </Text>
                  <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.4 }}>
                    {value.length > 220 ? value.slice(0, 220) + '...' : value}
                  </Text>
                </View>
              )
            })}
          </View>

          <PdfFooter />
        </Page>
      )}

      {/* ── SEITE 7: Architektur ────────────────────────────────────────────── */}
      {data.architecture && (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />
          <Text style={s.h1}>Enterprise AI Architektur</Text>
          <Text style={s.sub}>{data.architecture.title} · Muster: {data.architecture.result.pattern}</Text>

          {data.architecture.result.description && (
            <View style={[s.card, { marginBottom: 14 }]}>
              <Text style={{ fontSize: 10, color: C.dark, lineHeight: 1.5 }}>{data.architecture.result.description}</Text>
            </View>
          )}

          <Text style={s.h2}>Architektur-Schichten</Text>
          {data.architecture.result.layers.map((layer, i) => (
            <View key={i} style={[s.card, { marginBottom: 8 }]}>
              <View style={[s.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }]}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark }}>{layer.name}</Text>
                <Text style={{ fontSize: 9, color: C.gray }}>{layer.role}</Text>
              </View>
              {layer.components.length > 0 && (
                <View style={[s.row, { flexWrap: 'wrap', gap: 4 }]}>
                  {layer.components.map((comp, j) => (
                    <View key={j} style={{ backgroundColor: C.light, borderWidth: 1, borderColor: C.border, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 8, color: C.dark }}>{comp}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}

          {data.architecture.result.nextSteps && data.architecture.result.nextSteps.length > 0 && (
            <>
              <Text style={s.h2}>Nächste Schritte</Text>
              {data.architecture.result.nextSteps.slice(0, 5).map((step, i) => (
                <View key={i} style={[s.row, { gap: 6, marginBottom: 5 }]}>
                  <Text style={{ fontSize: 10, color: C.brand, fontWeight: 'bold' }}>{i + 1}.</Text>
                  <Text style={{ fontSize: 10, color: C.dark, flex: 1 }}>{step}</Text>
                </View>
              ))}
            </>
          )}

          <PdfFooter />
        </Page>
      )}

      {/* ── SEITE 8: Strategische Empfehlungen ─────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Strategische Empfehlungen</Text>
        <Text style={s.sub}>Basierend auf Ihrer vollständigen AI-Navigator-Analyse</Text>

        <Text style={s.h2}>Für den Vorstand / C-Level</Text>
        {boardRecs(data).map((rec, i) => (
          <View key={i} style={[s.card, { marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.brand }]}>
            <View style={[s.row, { alignItems: 'flex-start', gap: 8 }]}>
              <View style={{ backgroundColor: C.brand, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Text style={{ fontSize: 9, color: 'white', fontWeight: 'bold' }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec}</Text>
            </View>
          </View>
        ))}

        <Text style={s.h2}>Für den AI-Architekten / Technical Lead</Text>
        {archRecs(data).map((rec, i) => (
          <View key={i} style={[s.card, { marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.ok }]}>
            <View style={[s.row, { alignItems: 'flex-start', gap: 8 }]}>
              <View style={{ backgroundColor: C.ok, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Text style={{ fontSize: 9, color: 'white', fontWeight: 'bold' }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec}</Text>
            </View>
          </View>
        ))}

        <View style={{ marginTop: 16, backgroundColor: C.dark, borderRadius: 8, padding: 14 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white', marginBottom: 6 }}>Quarterly AI Health Review</Text>
          <Text style={{ fontSize: 9, color: C.gray2, lineHeight: 1.5 }}>
            Empfehlung: Assessment, Use-Case-Scoring und Governance-Check quartalsweise wiederholen.
            AI-Readiness ist kein einmaliges Projekt, sondern ein kontinuierlicher Verbesserungsprozess.
          </Text>
        </View>

        <PdfFooter />
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

export function renderUsecasePdf(data: UsecasePdfData): ReactElement {
  const sorted = [...data.useCases].sort((a, b) => (b.weighted_score ?? 0) - (a.weighted_score ?? 0))
  const counts = Object.fromEntries(Object.keys(QUADRANT_CFG).map(q => [q, data.useCases.filter(u => u.quadrant === q).length]))

  return (
    <Document title="Use-Case Portfolio">
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>{data.portfolioName}</Text>
        <Text style={s.sub}>Use-Case Portfolio · {data.useCases.length} Use Cases · Enterprise AI Navigator</Text>

        <View style={[s.row, { gap: 8, marginBottom: 18 }]}>
          {Object.entries(QUADRANT_CFG).map(([key, cfg]) => (
            <View key={key} style={[s.card, { flex: 1, alignItems: 'center', padding: 10, marginBottom: 0 }]}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: cfg.color }}>{counts[key] ?? 0}</Text>
              <Text style={{ fontSize: 9, color: C.gray, marginTop: 2 }}>{cfg.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>Use Cases im Überblick</Text>
        <View style={s.row}>
          <Text style={[s.th, { flex: 3 }]}>Name</Text>
          <Text style={[s.th, { flex: 1 }]}>Domäne</Text>
          <Text style={[s.th, { flex: 1, textAlign: 'center' }]}>Score</Text>
          <Text style={[s.th, { flex: 1 }]}>Kategorie</Text>
        </View>
        {sorted.length === 0 && (
          <View style={s.row}>
            <Text style={[s.td, { flex: 1, color: C.gray, textAlign: 'center' }]}>Keine Use Cases im Portfolio</Text>
          </View>
        )}
        {sorted.map((uc, i) => {
          const q = uc.quadrant ? (QUADRANT_CFG[uc.quadrant] ?? null) : null
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
        <PdfFooter />
      </Page>
    </Document>
  )
}
