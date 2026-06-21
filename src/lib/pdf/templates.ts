import { ASSESSMENT_DIMENSIONS, getMaturityLevel } from '@/config/assessment-data'
import { ARCHETYPES } from '@/types'
import { formatDate } from '@/lib/utils'

const BASE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica', Arial, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.6; }
  .page { padding: 0; }
  .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 2px solid #1d4ed8; margin-bottom: 24px; }
  .logo { font-size: 16px; font-weight: 700; color: #1d4ed8; }
  .meta { text-align: right; font-size: 9px; color: #64748b; }
  h1 { font-size: 22px; font-weight: 600; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: 600; margin: 20px 0 10px 0; color: #1e293b; }
  h3 { font-size: 12px; font-weight: 600; margin: 14px 0 6px 0; color: #1e293b; }
  .subtitle { color: #64748b; font-size: 11px; margin-bottom: 20px; }
  .score-box { background: #0f172a; color: white; border-radius: 12px; padding: 24px; display: flex; align-items: center; gap: 24px; margin-bottom: 20px; }
  .score-big { font-size: 42px; font-weight: 700; }
  .score-label { font-size: 9px; color: #94a3b8; }
  .archetype-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; margin-top: 6px; }
  .dim-row { margin-bottom: 14px; }
  .dim-header { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
  .dim-name { font-weight: 600; }
  .bar-bg { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; }
  .footer { position: fixed; bottom: 10mm; left: 15mm; right: 15mm; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
  .recommendation { display: flex; gap: 8px; margin-bottom: 8px; font-size: 11px; }
  .rec-arrow { color: #1d4ed8; font-weight: 700; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 10px; font-weight: 600; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
  .card-title { font-weight: 600; font-size: 12px; margin-bottom: 6px; color: #1e293b; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 600; margin-right: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
  th { background: #1e293b; color: white; padding: 8px 10px; text-align: left; font-size: 10px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .canvas-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
  .canvas-label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .canvas-text { font-size: 10px; color: #1e293b; min-height: 40px; }
  .phase-card { border-left: 3px solid #1d4ed8; padding-left: 12px; margin-bottom: 16px; }
  .phase-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
  .phase-title { font-size: 13px; font-weight: 600; }
  .phase-duration { font-size: 9px; color: #64748b; }
  .phase-focus { font-size: 10px; color: #475569; margin-bottom: 8px; }
  .action-row { display: flex; gap: 6px; margin-bottom: 4px; font-size: 10px; }
  .action-dot { color: #1d4ed8; font-weight: 700; flex-shrink: 0; }
  .layer-row { margin-bottom: 14px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
  .layer-name { font-size: 12px; font-weight: 600; color: #1e293b; }
  .layer-role { font-size: 10px; color: #64748b; margin: 3px 0 6px 0; }
  .component-tag { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 7px; border-radius: 4px; font-size: 9px; margin: 2px; }
  .layer-examples { font-size: 9px; color: #94a3b8; margin-top: 5px; }
`

function pdfHeader(company?: string): string {
  return `
    <div class="header">
      <div class="logo">AI Navigator</div>
      <div class="meta">
        ${company ? escapeHtml(company) + '<br/>' : ''}
        Erstellt am ${formatDate(new Date())}
      </div>
    </div>`
}

function pdfFooter(): string {
  return `<div class="footer">AI Navigator · enterprise-ai.biz · Dieser Bericht ersetzt keine individuelle Rechts- oder Unternehmensberatung.</div>`
}

function pdfWrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><style>${BASE_STYLES}</style></head>
<body><div class="page">${content}${pdfFooter()}</div></body>
</html>`
}

// ─── ASSESSMENT ──────────────────────────────────────────────────────────────

interface AssessmentPdfData {
  totalScore: number
  dimScores: Record<string, number>
  archetype: 'starter' | 'scaler' | 'transformer'
  companyName?: string
}

export function renderAssessmentPdf(data: AssessmentPdfData): string {
  const maturity = getMaturityLevel(data.totalScore)
  const archetypeConfig = ARCHETYPES[data.archetype]
  const scoreColor = data.totalScore >= 4 ? '#10b981' : data.totalScore >= 3 ? '#f59e0b' : '#ef4444'

  const dimRows = ASSESSMENT_DIMENSIONS.map(dim => {
    const score = data.dimScores[dim.id] ?? 0
    const barColor = score >= 4 ? '#10b981' : score >= 3 ? '#f59e0b' : '#ef4444'
    return `
      <div class="dim-row">
        <div class="dim-header">
          <span class="dim-name">${escapeHtml(dim.label)}</span>
          <span>${score.toFixed(1)} / 5,0</span>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${(score / 5) * 100}%; background:${barColor}"></div></div>
      </div>`
  }).join('')

  const recommendations = Object.entries(data.dimScores)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 3)
    .map(([dimId, score]) => {
      const dim = ASSESSMENT_DIMENSIONS.find(d => d.id === dimId)
      return `<div class="recommendation"><span class="rec-arrow">→</span><span><strong>${escapeHtml(dim?.label ?? '')}</strong> (${score.toFixed(1)}/5): ${getAssessmentRecommendationText(dimId)}</span></div>`
    }).join('')

  return pdfWrap(`
    ${pdfHeader(data.companyName)}
    <h1>AI-Readiness Assessment</h1>
    <p class="subtitle">Ergebnisbericht · 6 Dimensionen · Enterprise AI Navigator</p>
    <div class="score-box">
      <div>
        <div class="score-big" style="color:${scoreColor}">${data.totalScore.toFixed(1)}</div>
        <div class="score-label">von 5,0</div>
      </div>
      <div>
        <div style="font-size:16px;font-weight:600;">${escapeHtml(maturity.label)}</div>
        <div class="archetype-badge" style="background:rgba(255,255,255,0.15)">
          ${archetypeConfig.icon} ${escapeHtml(archetypeConfig.label)}
        </div>
      </div>
    </div>
    <h2>Ergebnis nach Dimension</h2>
    ${dimRows}
    <h2>Top Handlungsempfehlungen</h2>
    ${recommendations}
  `)
}

function getAssessmentRecommendationText(dimId: string): string {
  const map: Record<string, string> = {
    data: 'Data-Governance-Initiative starten, Masterdatenmodell definieren.',
    skills: 'AI-Upskilling-Programm aufsetzen, AI-Champions benennen.',
    governance: 'AI-Policy und RACI in den nächsten 4 Wochen dokumentieren.',
    tech: 'API-Strategie für Kernsysteme entwickeln, Cloud-Readiness prüfen.',
    strategy: 'AI-Strategie im nächsten Board-Meeting verabschieden.',
    culture: 'Executive-Sponsorship sichern, AI-Kulturprogramm starten.',
  }
  return map[dimId] ?? 'Handlungsfeld analysieren und Maßnahmen definieren.'
}

// ─── GOVERNANCE ──────────────────────────────────────────────────────────────

interface GovernancePdfData {
  useCaseName: string | null
  result: 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve' | null
  protocol: Array<{ question?: string; answer?: string; label?: string; value?: string }> | null
  companyName?: string
}

export function renderGovernancePdf(data: GovernancePdfData): string {
  const resultConfig: Record<string, { label: string; color: string; bg: string }> = {
    approve:      { label: '✓ Freigabe empfohlen', color: '#065f46', bg: '#d1fae5' },
    stop_dsgvo:   { label: '✗ Stop: DSGVO-Problem', color: '#7f1d1d', bg: '#fee2e2' },
    stop_risk:    { label: '✗ Stop: Hohes Risiko', color: '#7f1d1d', bg: '#fee2e2' },
    improve:      { label: '⚠ Verbesserungsbedarf', color: '#78350f', bg: '#fef3c7' },
  }
  const res = data.result ? (resultConfig[data.result] ?? resultConfig.improve) : resultConfig.improve
  const protocolRows = (data.protocol ?? [])
    .map(item => {
      const q = item.question ?? item.label ?? ''
      const a = item.answer ?? item.value ?? ''
      if (!q && !a) return ''
      return `<tr><td style="width:55%">${escapeHtml(q)}</td><td>${escapeHtml(a)}</td></tr>`
    }).join('')

  return pdfWrap(`
    ${pdfHeader(data.companyName)}
    <h1>AI-Governance Check</h1>
    <p class="subtitle">${escapeHtml(data.useCaseName ?? 'Use Case')} · Enterprise AI Navigator</p>
    <div style="background:${res.bg};border-radius:10px;padding:18px 22px;margin-bottom:20px;display:inline-block;">
      <span style="font-size:15px;font-weight:700;color:${res.color}">${res.label}</span>
    </div>
    ${protocolRows ? `
    <h2>Prüfprotokoll</h2>
    <table>
      <thead><tr><th>Prüfkriterium</th><th>Bewertung</th></tr></thead>
      <tbody>${protocolRows}</tbody>
    </table>` : ''}
  `)
}

// ─── ROADMAP ─────────────────────────────────────────────────────────────────

interface RoadmapPhaseData {
  id?: string
  title: string
  duration?: string
  focus?: string
  actions?: Array<{ label: string; priority?: string }>
  kpis?: string[]
  budget?: string
}

interface RoadmapPdfData {
  title: string
  archetype: string | null
  phases: RoadmapPhaseData[]
  companyName?: string
}

export function renderRoadmapPdf(data: RoadmapPdfData): string {
  const archetypeLabel: Record<string, string> = {
    starter: '🌱 AI Starter',
    scaler: '🚀 AI Scaler',
    transformer: '⚡ AI Transformer',
  }
  const phaseCards = (data.phases ?? []).map((phase, idx) => {
    const actions = (phase.actions ?? [])
      .map(a => `<div class="action-row"><span class="action-dot">→</span><span>${escapeHtml(a.label)}</span></div>`)
      .join('')
    const kpis = (phase.kpis ?? [])
      .map(k => `<span class="tag" style="background:#eff6ff;color:#1d4ed8">${escapeHtml(k)}</span>`)
      .join('')
    return `
      <div class="phase-card" style="border-color:${idx === 0 ? '#1d4ed8' : idx === 1 ? '#0891b2' : '#7c3aed'}">
        <div class="phase-header">
          <span class="phase-title">${escapeHtml(phase.title)}</span>
          ${phase.duration ? `<span class="phase-duration">${escapeHtml(phase.duration)}</span>` : ''}
        </div>
        ${phase.focus ? `<div class="phase-focus">${escapeHtml(phase.focus)}</div>` : ''}
        ${actions}
        ${kpis ? `<div style="margin-top:8px">${kpis}</div>` : ''}
        ${phase.budget ? `<div style="font-size:9px;color:#94a3b8;margin-top:6px">Budget-Richtwert: ${escapeHtml(phase.budget)}</div>` : ''}
      </div>`
  }).join('')

  return pdfWrap(`
    ${pdfHeader(data.companyName)}
    <h1>${escapeHtml(data.title)}</h1>
    <p class="subtitle">
      AI-Roadmap${data.archetype ? ' · ' + (archetypeLabel[data.archetype] ?? data.archetype) : ''} · Enterprise AI Navigator
    </p>
    <h2>Phasen-Übersicht</h2>
    ${phaseCards || '<p style="color:#64748b;font-size:11px">Noch keine Roadmap-Phasen gespeichert.</p>'}
  `)
}

// ─── CANVAS ──────────────────────────────────────────────────────────────────

interface CanvasData {
  problem?: string
  solution?: string
  data_sources?: string
  stakeholders?: string
  kpis?: string
  risks?: string
  architecture?: string
  next_steps?: string
}

interface CanvasPdfData {
  title: string
  archetype: string | null
  data: CanvasData
  companyName?: string
}

export function renderCanvasPdf(data: CanvasPdfData): string {
  const archetypeLabel: Record<string, string> = {
    starter: '🌱 AI Starter',
    scaler: '🚀 AI Scaler',
    transformer: '⚡ AI Transformer',
  }

  function section(label: string, value?: string): string {
    return `
      <div class="canvas-section">
        <div class="canvas-label">${label}</div>
        <div class="canvas-text">${escapeHtml(value ?? '–')}</div>
      </div>`
  }

  return pdfWrap(`
    ${pdfHeader(data.companyName)}
    <h1>${escapeHtml(data.title)}</h1>
    <p class="subtitle">
      AI Use-Case Canvas${data.archetype ? ' · ' + (archetypeLabel[data.archetype] ?? data.archetype) : ''} · Enterprise AI Navigator
    </p>
    <h2>Problem &amp; Lösung</h2>
    <div class="grid-2">
      ${section('Problem / Opportunität', data.data?.problem)}
      ${section('KI-Lösung', data.data?.solution)}
    </div>
    <h2>Daten &amp; Stakeholder</h2>
    <div class="grid-2">
      ${section('Datenquellen', data.data?.data_sources)}
      ${section('Stakeholder', data.data?.stakeholders)}
    </div>
    <h2>Erfolgsindikatoren &amp; Risiken</h2>
    <div class="grid-2">
      ${section('KPIs / Erfolgsindikatoren', data.data?.kpis)}
      ${section('Risiken', data.data?.risks)}
    </div>
    <h2>Umsetzung</h2>
    <div class="grid-2">
      ${section('Technische Architektur', data.data?.architecture)}
      ${section('Nächste Schritte', data.data?.next_steps)}
    </div>
  `)
}

// ─── COMPLIANCE ──────────────────────────────────────────────────────────────

interface ComplianceCheck {
  regulation: string
  check_type: string
  status: string
  notes: string | null
  completed_at: string | null
}

interface CompliancePdfData {
  checks: ComplianceCheck[]
  companyName?: string
}

export function renderCompliancePdf(data: CompliancePdfData): string {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    compliant:     { label: 'Konform',           color: '#065f46', bg: '#d1fae5' },
    non_compliant: { label: 'Nicht konform',     color: '#7f1d1d', bg: '#fee2e2' },
    partial:       { label: 'Teilw. konform',    color: '#78350f', bg: '#fef3c7' },
    pending:       { label: 'Ausstehend',        color: '#374151', bg: '#f3f4f6' },
  }
  const regulationLabel: Record<string, string> = {
    eu_ai_act: 'EU AI Act',
    dsgvo:     'DSGVO',
    internal:  'Intern',
  }

  const stats = { compliant: 0, non_compliant: 0, partial: 0, pending: 0 }
  data.checks.forEach(c => { stats[c.status as keyof typeof stats] = (stats[c.status as keyof typeof stats] ?? 0) + 1 })

  const rows = data.checks.map(c => {
    const st = statusConfig[c.status] ?? statusConfig.pending
    return `<tr>
      <td><strong>${escapeHtml(regulationLabel[c.regulation] ?? c.regulation)}</strong></td>
      <td>${escapeHtml(c.check_type)}</td>
      <td><span class="status-badge" style="color:${st.color};background:${st.bg}">${st.label}</span></td>
      <td>${c.notes ? escapeHtml(c.notes) : '–'}</td>
    </tr>`
  }).join('')

  return pdfWrap(`
    ${pdfHeader(data.companyName)}
    <h1>Compliance Status Report</h1>
    <p class="subtitle">Regulatorische Prüfübersicht · Enterprise AI Navigator</p>
    <div style="display:flex;gap:12px;margin-bottom:20px">
      <div class="card" style="flex:1;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#065f46">${stats.compliant}</div>
        <div style="font-size:9px;color:#64748b">Konform</div>
      </div>
      <div class="card" style="flex:1;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#78350f">${stats.partial}</div>
        <div style="font-size:9px;color:#64748b">Teilweise</div>
      </div>
      <div class="card" style="flex:1;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#7f1d1d">${stats.non_compliant}</div>
        <div style="font-size:9px;color:#64748b">Nicht konform</div>
      </div>
      <div class="card" style="flex:1;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#374151">${stats.pending}</div>
        <div style="font-size:9px;color:#64748b">Ausstehend</div>
      </div>
    </div>
    <h2>Alle Prüfpunkte</h2>
    <table>
      <thead><tr><th>Regulierung</th><th>Prüfbereich</th><th>Status</th><th>Anmerkungen</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `)
}

// ─── ARCHITECTURE ────────────────────────────────────────────────────────────

interface ArchitectureLayer {
  name: string
  role: string
  components: string[]
  examples?: string
}

interface ArchitectureResultData {
  pattern: string
  description?: string
  layers: ArchitectureLayer[]
  nextSteps?: string[]
}

interface ArchitecturePdfData {
  title: string
  result: ArchitectureResultData
  companyName?: string
}

export function renderArchitecturePdf(data: ArchitecturePdfData): string {
  const layers = (data.result?.layers ?? []).map(layer => `
    <div class="layer-row">
      <div class="layer-name">${escapeHtml(layer.name)}</div>
      <div class="layer-role">${escapeHtml(layer.role)}</div>
      <div>
        ${(layer.components ?? []).map(c => `<span class="component-tag">${escapeHtml(c)}</span>`).join('')}
      </div>
      ${layer.examples ? `<div class="layer-examples">${escapeHtml(layer.examples)}</div>` : ''}
    </div>`).join('')

  const nextSteps = (data.result?.nextSteps ?? []).map(step =>
    `<div class="action-row"><span class="action-dot">→</span><span>${escapeHtml(step)}</span></div>`
  ).join('')

  return pdfWrap(`
    ${pdfHeader(data.companyName)}
    <h1>${escapeHtml(data.title)}</h1>
    <p class="subtitle">AI-Architektur · ${escapeHtml(data.result?.pattern ?? '')} · Enterprise AI Navigator</p>
    ${data.result?.description ? `
    <div class="card" style="margin-bottom:20px">
      <div style="font-size:11px;color:#475569">${escapeHtml(data.result.description)}</div>
    </div>` : ''}
    <h2>Architektur-Ebenen</h2>
    ${layers}
    ${nextSteps ? `<h2>Empfohlene Nächste Schritte</h2>${nextSteps}` : ''}
  `)
}

// ─── USE CASE PORTFOLIO ──────────────────────────────────────────────────────

interface UseCaseEntry {
  name: string
  domain: string | null
  description: string | null
  weighted_score: number | null
  quadrant: string | null
}

interface UsecasePdfData {
  portfolioName: string
  useCases: UseCaseEntry[]
  companyName?: string
}

export function renderUsecasePdf(data: UsecasePdfData): string {
  const quadrantConfig: Record<string, { label: string; color: string; bg: string }> = {
    quick_win:         { label: 'Quick Win',        color: '#065f46', bg: '#d1fae5' },
    strategic_bet:     { label: 'Strategisch',      color: '#1e3a8a', bg: '#dbeafe' },
    low_hanging_fruit: { label: 'Niedr. Aufwand',   color: '#78350f', bg: '#fef3c7' },
    avoid:             { label: 'Vermeiden',        color: '#6b7280', bg: '#f3f4f6' },
  }

  const sorted = [...data.useCases].sort((a, b) => (b.weighted_score ?? 0) - (a.weighted_score ?? 0))
  const rows = sorted.map(uc => {
    const q = uc.quadrant ? (quadrantConfig[uc.quadrant] ?? quadrantConfig.avoid) : null
    const score = uc.weighted_score != null ? uc.weighted_score.toFixed(2) : '–'
    return `<tr>
      <td><strong>${escapeHtml(uc.name)}</strong>${uc.description ? `<br/><span style="color:#64748b;font-size:9px">${escapeHtml(uc.description.slice(0, 80))}${uc.description.length > 80 ? '…' : ''}</span>` : ''}</td>
      <td>${uc.domain ? escapeHtml(uc.domain) : '–'}</td>
      <td style="text-align:center;font-weight:600">${score}</td>
      <td>${q ? `<span class="status-badge" style="color:${q.color};background:${q.bg}">${q.label}</span>` : '–'}</td>
    </tr>`
  }).join('')

  const countByQuadrant = Object.fromEntries(
    Object.keys(quadrantConfig).map(q => [q, data.useCases.filter(uc => uc.quadrant === q).length])
  )

  return pdfWrap(`
    ${pdfHeader(data.companyName)}
    <h1>${escapeHtml(data.portfolioName)}</h1>
    <p class="subtitle">Use-Case Portfolio · ${data.useCases.length} Use Cases · Enterprise AI Navigator</p>
    <div style="display:flex;gap:10px;margin-bottom:20px">
      ${Object.entries(quadrantConfig).map(([key, cfg]) => `
        <div class="card" style="flex:1;text-align:center">
          <div style="font-size:18px;font-weight:700;color:${cfg.color}">${countByQuadrant[key] ?? 0}</div>
          <div style="font-size:9px;color:#64748b">${cfg.label}</div>
        </div>`).join('')}
    </div>
    <h2>Use Cases im Überblick</h2>
    <table>
      <thead><tr><th>Name</th><th>Domäne</th><th style="text-align:center">Score</th><th>Kategorie</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="color:#94a3b8;text-align:center">Keine Use Cases im Portfolio</td></tr>'}</tbody>
    </table>
  `)
}

// ─── SHARED UTIL ─────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
