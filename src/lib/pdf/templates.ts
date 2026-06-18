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
`

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
      return `<div class="recommendation"><span class="rec-arrow">→</span><span><strong>${escapeHtml(dim?.label ?? '')}</strong> (${score.toFixed(1)}/5): ${getRecommendationText(dimId)}</span></div>`
    }).join('')

  return `
    <!DOCTYPE html>
    <html lang="de">
    <head><meta charset="utf-8"><style>${BASE_STYLES}</style></head>
    <body>
      <div class="page">
        <div class="header">
          <div class="logo">AI Navigator</div>
          <div class="meta">
            ${data.companyName ? escapeHtml(data.companyName) + '<br/>' : ''}
            Erstellt am ${formatDate(new Date())}
          </div>
        </div>

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

        <div class="footer">
          AI Navigator · enterprise-ai.biz · Dieser Bericht ersetzt keine individuelle Rechts- oder Unternehmensberatung.
        </div>
      </div>
    </body>
    </html>`
}

function getRecommendationText(dimId: string): string {
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
