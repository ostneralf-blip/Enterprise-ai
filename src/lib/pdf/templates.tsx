import React from 'react'
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { ASSESSMENT_DIMENSIONS, getMaturityLevel } from '@/config/assessment-data'
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
  const stats = { compliant: 0, non_compliant: 0, partial: 0, pending: 0 }
  data.checks.forEach(c => { if (c.status in stats) stats[c.status as keyof typeof stats]++ })

  return (
    <Document title="Compliance Status Report">
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Compliance Status Report</Text>
        <Text style={s.sub}>Regulatorische Prüfübersicht · Enterprise AI Navigator</Text>

        <View style={[s.row, { gap: 8, marginBottom: 18 }]}>
          {([
            { n: stats.compliant,     label: 'Konform',       color: C.green },
            { n: stats.partial,       label: 'Teilweise',     color: C.amber },
            { n: stats.non_compliant, label: 'Nicht konform', color: C.red },
            { n: stats.pending,       label: 'Ausstehend',    color: C.neutral },
          ] as const).map(({ n, label, color }) => (
            <View key={label} style={[s.card, { flex: 1, alignItems: 'center', padding: 10, marginBottom: 0 }]}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color }}>{n}</Text>
              <Text style={{ fontSize: 9, color: C.gray, marginTop: 2 }}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>Alle Prüfpunkte</Text>
        <View style={s.row}>
          <Text style={[s.th, { flex: 1 }]}>Regulierung</Text>
          <Text style={[s.th, { flex: 2 }]}>Prüfbereich</Text>
          <Text style={[s.th, { flex: 1 }]}>Status</Text>
          <Text style={[s.th, { flex: 2 }]}>Anmerkungen</Text>
        </View>
        {data.checks.map((c, i) => {
          const st = STATUS_CFG[c.status] ?? STATUS_CFG.pending
          return (
            <View key={i} style={[s.row, { backgroundColor: i % 2 === 1 ? C.light : 'white' }]}>
              <Text style={[s.td, { flex: 1, fontWeight: 'bold' }]}>{REG_LABELS[c.regulation] ?? c.regulation}</Text>
              <Text style={[s.td, { flex: 2 }]}>{c.check_type}</Text>
              <View style={[s.td, { flex: 1 }]}>
                <View style={{ backgroundColor: st.bg, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start' }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: st.color }}>{st.label}</Text>
                </View>
              </View>
              <Text style={[s.td, { flex: 2 }]}>{c.notes ?? '–'}</Text>
            </View>
          )
        })}
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
