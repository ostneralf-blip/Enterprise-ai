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

function PdfFooterEs({ company }: { company?: string }) {
  return (
    <View fixed style={[s.footer, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <Text style={[s.footerTxt, { textAlign: 'left', flex: 1 }]}>
        AI Navigator · enterprise-ai.biz{company ? ` · ${company}` : ''} · Kein Ersatz für individuelle Beratung.
      </Text>
      <Text
        style={[s.footerTxt, { flexShrink: 0, paddingLeft: 12 }]}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Seite ${pageNumber} / ${totalPages}`
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

const GOV_RECS: Record<string, string[]> = {
  approve:    [
    'Ergebnis dokumentieren und im nächsten Sprint-Review präsentieren.',
    'Governance-Freigabe als Meilenstein im Projektplan festhalten.',
    'Regelmäßigen Review-Zyklus (quartalsweise) für laufende Compliance sicherstellen.',
  ],
  stop_dsgvo: [
    'Datenschutzbeauftragten einbeziehen und DSGVO-Analyse formalisieren.',
    'Technische Maßnahmen prüfen: Pseudonymisierung, Datensparsamkeit, Einwilligungsmanagement.',
    'Use Case erst nach erfolgreicher DSGVO-Klärung erneut dem Governance-Check unterziehen.',
  ],
  stop_risk:  [
    'Risikoregister anlegen und alle identifizierten Risiken mit Verantwortlichen versehen.',
    'Risikominderungsmaßnahmen definieren: Transparenzpflichten, menschliche Überwachung, Fallback-Mechanismen.',
    'Erneute Governance-Prüfung nach Umsetzung der Risikominderung einplanen.',
  ],
  improve:    [
    'Identifizierte Schwachstellen priorisieren und Maßnahmenplan erstellen.',
    'Zuständige Fachbereiche (Legal, Compliance, IT) in Verbesserungsmaßnahmen einbinden.',
    'Verbesserten Use Case innerhalb von 4–6 Wochen erneut prüfen.',
  ],
}

export function renderGovernancePdf(data: GovernancePdfData): ReactElement {
  const res = data.result ? (GOV_RESULT[data.result] ?? GOV_RESULT.improve) : GOV_RESULT.improve
  const recs = data.result ? (GOV_RECS[data.result] ?? GOV_RECS.improve) : GOV_RECS.improve
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

        <Text style={s.h2}>Handlungsempfehlungen</Text>
        {recs.map((rec, i) => (
          <View key={i} style={[s.row, { marginBottom: 6, alignItems: 'flex-start' }]}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: res.color, marginRight: 8, marginTop: 3, flexShrink: 0 }} />
            <Text style={{ flex: 1, fontSize: 10, color: C.dark, lineHeight: 1.4 }}>{rec}</Text>
          </View>
        ))}

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

const ROADMAP_RECS: Record<string, string[]> = {
  starter: [
    'Fokus auf 1–2 Pilotprojekte mit messbarem ROI — Tiefe vor Breite, schnelle Lernzyklen priorisieren.',
    'Daten-Fundament sicherstellen: Datenverfügbarkeit und -qualität als KI-Voraussetzung prüfen und ggf. aufbauen.',
    'Quick-Win-Use-Cases für erste Phase wählen — frühe Erfolge schaffen internes Vertrauen und Budget-Argumente.',
    'Executive-Sponsorship auf C-Level frühzeitig sichern — AI-Projekte ohne Management-Commitment scheitern in der Skalierungsphase.',
  ],
  scaler: [
    'Erfolgreiche Piloten dokumentieren und als Playbook auf weitere Bereiche übertragen — systematisches Ausrollen statt Einzelprojekte.',
    'AI-Center-of-Excellence etablieren: Zentrale Kompetenzplattform für Methoden, Tools und Best Practices aufbauen.',
    'KPI-Tracking professionalisieren: Roadmap-KPIs quartalsweise messen und in Management-Reviews berichten.',
    'MLOps-Reife steigern: Automatisiertes Retraining, Drift-Monitoring und A/B-Testing für produktive Modelle implementieren.',
  ],
  transformer: [
    'AI als strategischen Wettbewerbsvorteil aktiv kommunizieren — intern als Kulturmerkmal, extern als Differenzierungsmerkmal.',
    'Proprietäre Daten als strategischen Asset behandeln: Datenmonetarisierung und domänenspezifische Modelle vorantreiben.',
    'Innovationsgeschwindigkeit aufrechterhalten: Dediziertes Experiments-Budget und Fail-Fast-Kultur etablieren.',
    'AI-Ökosystem mitgestalten: Partnerschaften, Standards und Open-Source-Beiträge als strategische Hebel nutzen.',
  ],
}

export function renderRoadmapPdf(data: RoadmapPdfData): ReactElement {
  const archetypeRecs = ROADMAP_RECS[data.archetype ?? ''] ?? ROADMAP_RECS.starter
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

      {/* ── Seite 2: Handlungsempfehlungen ────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Handlungsempfehlungen</Text>
        <Text style={s.sub}>
          {data.archetype ? `${ARCHETYPE_LABELS[data.archetype] ?? data.archetype} · ` : ''}AI-Roadmap · Enterprise AI Navigator
        </Text>

        {archetypeRecs.map((rec, i) => (
          <View key={i} style={[s.card, { marginBottom: 10, borderLeftWidth: 3, borderLeftColor: C.brand }]}>
            <View style={[s.row, { alignItems: 'flex-start', gap: 8 }]}>
              <View style={{ backgroundColor: C.brand, borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Text style={{ fontSize: 9, color: 'white', fontWeight: 'bold' }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 10, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec}</Text>
            </View>
          </View>
        ))}

        {data.phases.length > 0 && (
          <>
            <Text style={s.h2}>Erste Phase — Fokusthemen</Text>
            <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: PHASE_COLORS[0] }]}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.dark, marginBottom: 4 }}>{data.phases[0].title}</Text>
              {data.phases[0].focus && <Text style={{ fontSize: 10, color: C.gray, marginBottom: 6, lineHeight: 1.4 }}>{data.phases[0].focus}</Text>}
              {(data.phases[0].actions ?? []).slice(0, 4).map((a, i) => (
                <View key={i} style={[s.row, { gap: 4, marginBottom: 3 }]}>
                  <Text style={{ fontSize: 9, color: C.brand }}>▸</Text>
                  <Text style={{ flex: 1, fontSize: 10 }}>{a.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ marginTop: 16, backgroundColor: C.dark, borderRadius: 8, padding: 14 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white', marginBottom: 6 }}>Quarterly AI Health Review</Text>
          <Text style={{ fontSize: 9, color: C.gray2, lineHeight: 1.5 }}>
            Empfehlung: Roadmap-KPIs und AI-Readiness-Score quartalsweise überprüfen. Phasen-Ziele anpassen wenn sich Marktbedingungen, Ressourcen oder Prioritäten ändern.
          </Text>
        </View>

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
        <View style={[s.row, { gap: 8, marginBottom: 8 }]}>
          <CanvasSection label="Technische Architektur" value={data.data?.architecture} />
          <CanvasSection label="Nächste Schritte" value={data.data?.next_steps} />
        </View>

        <Text style={s.h2}>Handlungsempfehlungen</Text>
        {([
          data.data?.risks
            ? 'Identifizierte Risiken in Risikoregister übernehmen und Mitigationsmaßnahmen mit Verantwortlichen versehen.'
            : 'Risikobewertung ergänzen: Technische, rechtliche und betriebliche Risiken systematisch identifizieren vor Pilotstart.',
          data.data?.kpis
            ? 'KPIs als Messgrundlage nutzen: Vor Pilotstart Baseline erfassen und nach 30, 60, 90 Tagen auswerten.'
            : 'KPIs definieren: Messbare Erfolgsindikatoren (Zeit, Kosten, Qualität, Nutzerzufriedenheit) festlegen.',
          data.data?.stakeholders
            ? 'Stakeholder-Kommunikationsplan erstellen: Regelmäßige Updates einplanen, Change-Management-Bedarf adressieren.'
            : 'Stakeholder-Analyse vertiefen: Betroffene Nutzer, Entscheider und Systemabhängigkeiten vollständig erfassen.',
          'AI-Governance-Check durchführen: Use Case vor Pilotstart auf EU AI Act-Konformität und DSGVO-Anforderungen prüfen.',
        ] as string[]).map((rec, i) => (
          <View key={i} style={[s.row, { marginBottom: 6, alignItems: 'flex-start' }]}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.brand, marginRight: 8, marginTop: 3, flexShrink: 0 }} />
            <Text style={{ flex: 1, fontSize: 10, color: C.dark, lineHeight: 1.4 }}>{rec}</Text>
          </View>
        ))}
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

  const nonCompliantEU   = euChecks.filter(c => c.status === 'non_compliant').length
  const nonCompliantDSGVO = dsgvoChecks.filter(c => c.status === 'non_compliant').length
  const pendingTotal     = data.checks.filter(c => c.status === 'pending').length
  const complianceRecs: Array<{ title: string; text: string; color: string }> = []
  if (nonCompliantEU > 0)
    complianceRecs.push({ color: C.danger,
      title: `${nonCompliantEU} EU AI Act-Verstoß${nonCompliantEU > 1 ? 'e' : ''} beheben`,
      text: 'Identifizierte Nicht-Konformitäten haben höchste Priorität vor Pilotstart. Transparenzpflichten (Art. 13–15), Dokumentationsanforderungen und Risikoklassifizierung adressieren.' })
  if (nonCompliantDSGVO > 0)
    complianceRecs.push({ color: C.danger,
      title: `${nonCompliantDSGVO} DSGVO-Lücke${nonCompliantDSGVO > 1 ? 'n' : ''} schließen`,
      text: 'Datenschutzbeauftragten einbeziehen. Technische Maßnahmen prüfen: Pseudonymisierung, Datensparsamkeit, Privacy-by-Design. Rechtsgrundlagen für alle AI-Datenverarbeitungen dokumentieren.' })
  if (pendingTotal > 0)
    complianceRecs.push({ color: C.warn,
      title: `${pendingTotal} ausstehende Prüfpunkte abschließen`,
      text: 'Noch offene Compliance-Checks zeitnah bearbeiten — vollständiges Bild vor Pilotstart erforderlich. Verantwortliche benennen und verbindliche Termine setzen.' })
  if (euDone === euChecks.length && euChecks.length > 0)
    complianceRecs.push({ color: C.ok,
      title: 'EU AI Act: Vollständige Konformität bestätigt',
      text: 'Alle EU AI Act-Pflichten erfüllt. Status dokumentieren, Review-Zyklus (quartalsweise) einrichten. Compliance als Vertrauensmerkmal gegenüber Kunden und Aufsichtsbehörden kommunizieren.' })
  if (dsgvoDone === dsgvoChecks.length && dsgvoChecks.length > 0)
    complianceRecs.push({ color: C.ok,
      title: 'DSGVO: Vollständige Konformität bestätigt',
      text: 'DSGVO-Compliance vollständig nachgewiesen. Verarbeitungsverzeichnis aktuell halten und bei Änderungen (neue Datenquellen, neue Modelle) erneut prüfen.' })
  complianceRecs.push({ color: C.dark2,
    title: 'Compliance-Monitoring etablieren',
    text: 'EU AI Act und DSGVO-Anforderungen entwickeln sich laufend. Quartalsweiser Compliance-Check als festen Termin einplanen. Änderungen im EU AI Act-Annex III (Hochrisiko-Liste) aktiv beobachten.' })

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

      {/* ── Seite 2: Handlungsempfehlungen ────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Handlungsempfehlungen</Text>
        <Text style={s.sub}>Compliance Status Report · Enterprise AI Navigator</Text>

        {complianceRecs.map((rec, i) => (
          <View key={i} style={[s.card, { marginBottom: 10, borderLeftWidth: 3, borderLeftColor: rec.color }]}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: rec.color, marginBottom: 4 }}>{i + 1}. {rec.title}</Text>
            <Text style={{ fontSize: 10, color: C.dark, lineHeight: 1.5 }}>{rec.text}</Text>
          </View>
        ))}

        <View style={{ marginTop: 16, backgroundColor: C.dark, borderRadius: 8, padding: 14 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'white', marginBottom: 6 }}>Nächster Schritt</Text>
          <Text style={{ fontSize: 9, color: C.gray2, lineHeight: 1.5 }}>
            Governance-Check im AI Navigator für jeden High-Score-Use-Case durchführen — Pflicht nach EU AI Act für Hochrisiko-Anwendungen (Art. 6, Annex III).
          </Text>
        </View>

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
  const score      = data.assessment?.totalScore ?? 0
  const govResult  = data.governance?.result ?? ''
  const completionPct = data.completedModules / Math.max(data.totalModules, 1)
  const scoreColor = score >= 4 ? C.ok : score >= 3 ? C.warn : score > 0 ? C.danger : C.gray

  const ampelKey: 'gruen' | 'gelb' | 'rot' =
    (score > 0 && score < 2.5) || govResult.startsWith('stop') ? 'rot' :
    score >= 4 && completionPct >= 0.7 ? 'gruen' : 'gelb'

  const AMPEL: Record<string, { label: string; color: string; bg: string; text: string; desc: string }> = {
    gruen: { label: 'Bereit zur Skalierung',      color: C.ok,     bg: C.greenBg, text: C.green,
      desc: `Mit einem Score von ${score > 0 ? score.toFixed(1) : '–'}/5,0 und ${data.completedModules}/${data.totalModules} abgeschlossenen Modulen ist Ihr Unternehmen solide aufgestellt. Jetzt kommt es auf konsequente Skalierung an.` },
    gelb:  { label: 'Aufbauphase',                color: C.warn,   bg: C.amberBg, text: C.amber,
      desc: `Score ${score > 0 ? score.toFixed(1) : '–'}/5,0 — die Grundlagen sind vorhanden. Gezielte Investitionen in die identifizierten Lücken sind der Schlüssel zu erfolgreichen KI-Projekten.` },
    rot:   { label: 'Kritischer Handlungsbedarf', color: C.danger, bg: C.redBg,   text: C.red,
      desc: `Score ${score > 0 ? score.toFixed(1) : '–'}/5,0 — bevor KI-Projekte starten, müssen die kritischen Grundlagenfelder adressiert werden. Strukturiertes Aufbauprogramm spart langfristig erhebliche Kosten.` },
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
          <Text style={{ fontSize: 10, color: C.gray2, letterSpacing: 2, marginBottom: 50 }}>ENTERPRISE AI. STRUKTURIERT NAVIGIERT.</Text>
          <View style={{ width: 200, height: 1, backgroundColor: C.brand, marginBottom: 50 }} />
          <Text style={{ fontSize: 9, color: C.gray, letterSpacing: 3, marginBottom: 14 }}>EXECUTIVE SUMMARY</Text>
          {data.companyName ? (
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 6 }}>
              {data.companyName}
            </Text>
          ) : null}
          <Text style={{ fontSize: 9, color: C.gray, marginTop: 20 }}>Erstellt am {formatDate(new Date())}</Text>
        </View>
        <View style={{ paddingHorizontal: 60, paddingBottom: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.dark2, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 9, color: C.gray }}>enterprise-ai.biz</Text>
          <Text style={{ fontSize: 9, color: C.gray }}>{data.completedModules}/{data.totalModules} Module abgeschlossen</Text>
        </View>
      </Page>

      {/* ── SEITE 2: EXECUTIVE SUMMARY ─────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
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
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2, textAlign: 'center' }}>Readiness Score{'\n'}/5,0</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 10, marginBottom: 0, marginRight: 6 }]}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: C.brand }}>{data.useCaseCount}</Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2, textAlign: 'center' }}>Use Cases{'\n'}bewertet</Text>
          </View>
          <View style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 10, marginBottom: 0, marginRight: data.governance ? 6 : 0 }]}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: completionPct >= 0.8 ? C.ok : C.warn }}>
              {data.completedModules}/{data.totalModules}
            </Text>
            <Text style={{ fontSize: 8, color: C.gray, marginTop: 2, textAlign: 'center' }}>Module{'\n'}abgeschlossen</Text>
          </View>
          {data.governance ? (
            <View style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 10, marginBottom: 0 }]}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: GOV_CFG_ES[data.governance.result]?.color ?? C.gray, textAlign: 'center' }}>
                {GOV_CFG_ES[data.governance.result]?.label ?? '–'}
              </Text>
              <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>Governance</Text>
            </View>
          ) : null}
        </View>

        {/* Top-3 Empfehlungen */}
        <Text style={s.h2}>Top-3 Handlungsempfehlungen</Text>
        {top3.map((rec, i) => (
          <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.brand, borderRadius: 6, backgroundColor: C.light, padding: 10, marginBottom: 7 }}>
            <View style={{ backgroundColor: C.brand, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 1 }}>
              <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{i + 1}</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec}</Text>
          </View>
        ))}

        {/* Modulübersicht — explizite Rows à 3, kein flexWrap+% */}
        <Text style={s.h2}>Modulübersicht</Text>
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

        <PdfFooterEs company={data.companyName} />
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
            <PdfHeader company={data.companyName} />

            {/* Score-Banner mit Stärken/Schwächen-Fazit */}
            <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: scoreColor, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ alignItems: 'center', marginRight: 14, minWidth: 56 }}>
                <Text style={{ fontSize: 34, fontWeight: 'bold', color: scoreColor, lineHeight: 1 }}>{data.assessment!.totalScore.toFixed(1)}</Text>
                <Text style={{ fontSize: 8, color: C.gray, marginTop: 2 }}>/ 5,0</Text>
              </View>
              <View style={{ width: 1, height: 48, backgroundColor: C.border, marginRight: 14 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 4 }}>
                  {ARCHETYPE_LABELS[data.assessment!.archetype] ?? data.assessment!.archetype}
                </Text>
                {strongest && weakest ? (
                  <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.4 }}>
                    Stärkstes Feld: {DIM_LABELS_ES[strongest[0]] ?? strongest[0]} ({Number(strongest[1]).toFixed(1)}/5,0).
                    {' '}Größter Hebel: {DIM_LABELS_ES[weakest[0]] ?? weakest[0]} ({Number(weakest[1]).toFixed(1)}/5,0).
                  </Text>
                ) : null}
              </View>
            </View>

            <Text style={s.h2}>6 Dimensionen</Text>
            {sorted.map(([dim, dimScore]) => {
              const n   = Number(dimScore)
              const col = n >= 4 ? C.ok : n >= 3 ? C.warn : C.danger
              return (
                <View key={dim} wrap={false} style={{ marginBottom: 9 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark }}>{DIM_LABELS_ES[dim] ?? dim}</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: col }}>{n.toFixed(1)} / 5,0</Text>
                  </View>
                  <View style={{ backgroundColor: C.border, borderRadius: 3, height: 8, marginBottom: 2 }}>
                    <View style={{ backgroundColor: col, borderRadius: 3, height: 8, width: `${Math.round((n / 5) * 100)}%` }} />
                  </View>
                  <Text style={{ fontSize: 8, color: C.gray }}>
                    {n >= 4 ? 'Stärke — ausbauen und als Vorteil nutzen' : n >= 3 ? 'Solide Basis — gezielt ausbauen' : 'Handlungsbedarf — mit Priorität adressieren'}
                  </Text>
                </View>
              )
            })}

            {(() => {
              const gaps = sorted.slice(-2).filter(([, v]) => Number(v) < 4).reverse()
              return gaps.length > 0 ? (
                <>
                  <Text style={s.h2}>Prioritäre Handlungsfelder</Text>
                  {gaps.map(([dim, gs], i) => (
                    <View key={dim} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.danger, borderRadius: 6, backgroundColor: C.light, padding: 10, marginBottom: 7 }}>
                      <Text style={{ fontSize: 9, color: C.danger, fontWeight: 'bold', marginRight: 8 }}>{i + 1}.</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.dark, marginBottom: 2 }}>
                          {DIM_LABELS_ES[dim] ?? dim} — Score {Number(gs).toFixed(1)}/5,0
                        </Text>
                        <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.5 }}>{gapActions[dim] ?? ''}</Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : null
            })()}

            <PdfFooterEs company={data.companyName} />
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
          { key: 'quick_win',         label: 'Quick Win',    color: C.ok,     bg: C.greenBg,  note: 'Sofort pilotieren' },
          { key: 'strategic_bet',     label: 'Strategisch',  color: C.brand,  bg: '#dbeafe',  note: 'Budgetieren' },
          { key: 'low_hanging_fruit', label: 'Niedr. Aufw.', color: C.warn,   bg: C.amberBg,  note: 'Evaluieren' },
          { key: 'avoid',             label: 'Vermeiden',    color: C.danger, bg: C.redBg,    note: 'Zurückstellen' },
        ]
        return (
          <Page size="A4" style={s.page}>
            <PdfHeader company={data.companyName} />

            {/* Insight-Banner */}
            <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: C.brand, backgroundColor: C.light, padding: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 4 }}>
                {data.useCaseCount} Use Cases bewertet{qwCount > 0 ? ` · ${qwCount} sofort umsetzbar` : ''}
              </Text>
              {topUC ? (
                <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.5 }}>
                  {'Top-Use-Case: '}
                  <Text style={{ fontWeight: 'bold', color: C.dark }}>{topUC.name}</Text>
                  {topUC.weightedScore != null ? ` (Score ${topUC.weightedScore.toFixed(2)})` : ''}
                  {topUC.quadrant === 'quick_win' ? ' — Quick Win: hoher Wert bei geringem Aufwand. Sofort pilotieren.' : topUC.quadrant === 'strategic_bet' ? ' — Strategisch: langfristiger Wert, Budgetplanung empfohlen.' : ''}
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

            <Text style={s.h2}>Top Use Cases nach Score</Text>
            <View style={{ flexDirection: 'row', backgroundColor: C.dark2, borderRadius: 4 }}>
              <Text style={[s.th, { flex: 3 }]}>Use Case</Text>
              <Text style={[s.th, { flex: 1.2 }]}>Domäne</Text>
              <Text style={[s.th, { flex: 0.8, textAlign: 'center' }]}>Score</Text>
              <Text style={[s.th, { flex: 1.5 }]}>Kategorie</Text>
            </View>
            {data.topUseCases.map((uc, i) => {
              const qLabel = QUADRANT_ES[uc.quadrant ?? ''] ?? '–'
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
                + {data.useCaseCount - data.topUseCases.length} weitere Use Cases im vollständigen Portfolio
              </Text>
            ) : null}

            <PdfFooterEs company={data.companyName} />
          </Page>
        )
      })() : null}

      {/* ── SEITE 5: GOVERNANCE ────────────────────────────────────────────── */}
      {data.governance ? (() => {
        const cfg = GOV_CFG_ES[data.governance!.result]
        const resultDesc = data.governance!.result === 'approve'
          ? 'Der Use Case hat die ethische, rechtliche und EU AI Act-Prüfung bestanden. Umsetzung kann beginnen.'
          : data.governance!.result === 'conditional'
          ? 'Umsetzung möglich unter Auflagen — die identifizierten Bedingungen müssen vor Go-Live erfüllt sein.'
          : 'Umsetzung gestoppt — kritische Compliance-Blocker müssen behoben werden, bevor das Projekt fortgeführt wird.'
        return (
          <Page size="A4" style={s.page}>
            <PdfHeader company={data.companyName} />

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

            <Text style={s.h2}>Prüfprotokoll</Text>
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
              <Text style={{ fontSize: 9, color: C.gray }}>Kein Protokoll verfügbar.</Text>
            )}

            <PdfFooterEs company={data.companyName} />
          </Page>
        )
      })() : null}

      {/* ── SEITE 6: ROADMAP ───────────────────────────────────────────────── */}
      {data.roadmap ? (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />

          <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: C.brand, backgroundColor: C.light, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: C.brand, borderRadius: 5, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', marginRight: 14, minWidth: 56 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>{data.roadmap.phases.length}</Text>
              <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.8)' }}>Phasen</Text>
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

          <PdfFooterEs company={data.companyName} />
        </Page>
      ) : null}

      {/* ── SEITE 7: CANVAS ────────────────────────────────────────────────── */}
      {data.canvas ? (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />

          <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: C.brand, backgroundColor: C.light, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: C.dark, marginBottom: 2 }}>{data.canvas.title}</Text>
            <Text style={{ fontSize: 9, color: C.gray }}>AI Use-Case Canvas · 8 Felder</Text>
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
                      {CANVAS_LABELS_ES[key] ?? key}
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

          <PdfFooterEs company={data.companyName} />
        </Page>
      ) : null}

      {/* ── SEITE 8: ARCHITEKTUR ───────────────────────────────────────────── */}
      {data.architecture ? (
        <Page size="A4" style={s.page}>
          <PdfHeader company={data.companyName} />

          <View wrap={false} style={{ borderRadius: 6, borderWidth: 1, borderColor: C.brand, backgroundColor: C.light, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: C.dark, borderRadius: 5, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', marginRight: 14, minWidth: 70 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: C.brand }}>{data.architecture.result.pattern}</Text>
              <Text style={{ fontSize: 7, color: C.gray2, marginTop: 2 }}>Muster</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: C.dark, marginBottom: 3 }}>{data.architecture.title}</Text>
              {data.architecture.result.description ? (
                <Text style={{ fontSize: 9, color: C.gray, lineHeight: 1.3 }}>{data.architecture.result.description}</Text>
              ) : null}
            </View>
          </View>

          <Text style={s.h2}>Architektur-Schichten</Text>
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
              <Text style={s.h2}>Nächste Schritte</Text>
              {data.architecture.result.nextSteps.slice(0, 4).map((step, i) => (
                <View key={i} wrap={false} style={{ flexDirection: 'row', marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: C.brand, marginRight: 5 }}>{i + 1}.</Text>
                  <Text style={{ fontSize: 9, color: C.dark, flex: 1 }}>{step}</Text>
                </View>
              ))}
            </>
          ) : null}

          <PdfFooterEs company={data.companyName} />
        </Page>
      ) : null}

      {/* ── SEITE 9: COMPLIANCE ────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Compliance-Überblick</Text>
        <Text style={s.sub}>Regulatorischer Rahmen für Enterprise AI · Stand 2026</Text>

        {[
          {
            name: 'EU AI Act', articles: 'Art. 6–10, 13–17, 69',
            scope: 'Risikoklassifizierung von KI-Systemen, Hochrisiko-Pflichten (Dokumentation, Audit-Log, menschliche Aufsicht), Transparenz gegenüber Nutzern.',
            status: govResult.startsWith('stop') ? 'Stopp — Sofortmaßnahme'
              : govResult === 'approve' ? 'Geprüft — Freigegeben'
              : govResult === 'conditional' ? 'Geprüft — Auflagen'
              : 'Ausstehend',
            color: govResult.startsWith('stop') ? C.danger : govResult === 'approve' ? C.ok : govResult === 'conditional' ? C.warn : C.gray,
          },
          {
            name: 'DSGVO / GDPR', articles: 'Art. 5, 22, 25, 35',
            scope: 'Datenminimierung, Zweckbindung, automatisierte Entscheidungen (Art. 22), Datenschutz-Folgenabschätzung (DSFA) bei Hochrisiko-AI (Art. 35).',
            status: govResult === 'stop_dsgvo' ? 'Prüfung erforderlich' : govResult === 'approve' ? 'Geprüft' : 'Ausstehend',
            color: govResult === 'stop_dsgvo' ? C.warn : govResult === 'approve' ? C.ok : C.gray,
          },
          {
            name: 'ISO 27001', articles: 'Annex A.8, A.12',
            scope: 'Informationssicherheits-Management, Zugriffssteuerung für AI-Modelle und Trainingsdaten, Incident-Response für AI-Systeme.',
            status: 'Eigenverantwortlich prüfen', color: C.gray,
          },
          {
            name: 'NIS2-Richtlinie', articles: 'Art. 21, 23',
            scope: 'Kritische Infrastrukturen: Sicherheitsmaßnahmen für KI-basierte Systeme, Meldepflichten bei AI-Sicherheitsvorfällen (24-Stunden-Frist).',
            status: 'Eigenverantwortlich prüfen', color: C.gray,
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
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: C.amber, marginBottom: 3 }}>Wichtiger Hinweis</Text>
          <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5 }}>
            Dieser Überblick basiert auf den im AI Navigator erfassten Daten und dient als erster Orientierungsrahmen.
            Führen Sie das Compliance Center für die vollständige Checkliste durch.
            Eine bindende Compliance-Bewertung erfordert individuelle Rechtsberatung.
          </Text>
        </View>

        <PdfFooterEs company={data.companyName} />
      </Page>

      {/* ── SEITE 10: STRATEGISCHE EMPFEHLUNGEN ─────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Strategische Empfehlungen</Text>
        <Text style={s.sub}>Individuell abgeleitet aus Ihrer AI-Navigator-Analyse</Text>

        <Text style={s.h2}>Für den Vorstand / C-Level</Text>
        {boardRecs(data).map((rec, i) => (
          <View key={i} wrap={false} style={{ flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.brand, borderRadius: 6, backgroundColor: C.light, padding: 10, marginBottom: 7 }}>
            <View style={{ backgroundColor: C.brand, borderRadius: 9, width: 18, height: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 8, marginTop: 1 }}>
              <Text style={{ fontSize: 8, color: 'white', fontWeight: 'bold' }}>{i + 1}</Text>
            </View>
            <Text style={{ fontSize: 9, color: C.dark, lineHeight: 1.5, flex: 1 }}>{rec}</Text>
          </View>
        ))}

        <Text style={s.h2}>Für den AI-Architekten / Technical Lead</Text>
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
          <Text style={{ fontSize: 9, color: C.gray2, lineHeight: 1.5 }}>
            Assessment, Use-Case-Scoring und Governance-Check quartalsweise wiederholen.
            AI-Readiness ist kein einmaliges Projekt — die Markt- und Technologielage ändert sich.
            Nutzen Sie den AI Navigator als kontinuierliches Steuerungsinstrument.
          </Text>
        </View>

        <PdfFooterEs company={data.companyName} />
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

      {/* ── Seite 2: Handlungsempfehlungen ────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <PdfHeader company={data.companyName} />
        <Text style={s.h1}>Handlungsempfehlungen</Text>
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

        <PdfFooter />
      </Page>
    </Document>
  )
}
