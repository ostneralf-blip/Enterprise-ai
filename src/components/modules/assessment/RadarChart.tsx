'use client'

import { useLocale } from 'next-intl'
import { ASSESSMENT_DIMENSIONS } from '@/config/assessment-data'

interface RadarChartProps {
  dimScores: Record<string, number>
}

const SIZE = 220
const CENTER = SIZE / 2
const MAX_R = 76
const VPAD = 32  // extra viewBox-Rand damit Achsen-Labels nicht abgeschnitten werden

const SHORT: Record<string, string> = {
  data:       'Daten',
  skills:     'Skills',
  governance: 'Governance',
  tech:       'Technik',
  strategy:   'Strategie',
  culture:    'Kultur',
}

function polar(score: number, idx: number, total: number) {
  const angle = (idx * 2 * Math.PI) / total - Math.PI / 2
  const r = (Math.min(score, 5) / 5) * MAX_R
  return { x: CENTER + r * Math.cos(angle), y: CENTER + r * Math.sin(angle) }
}

function tip(idx: number, total: number, scale = 1) {
  const angle = (idx * 2 * Math.PI) / total - Math.PI / 2
  return {
    x: CENTER + MAX_R * scale * Math.cos(angle),
    y: CENTER + MAX_R * scale * Math.sin(angle),
  }
}

export function RadarChart({ dimScores }: RadarChartProps) {
  const locale = useLocale()
  const dims = ASSESSMENT_DIMENSIONS
  const n = dims.length

  const dataPoints = dims.map((d, i) => polar(dimScores[d.id] ?? 0, i, n))
  const polyPath = dataPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ') + ' Z'

  const ariaLabel = dims
    .map(d => `${SHORT[d.id] ?? d.id} ${Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(dimScores[d.id] ?? 0)} / 5`)
    .join(', ')

  return (
    <svg
      viewBox={`-${VPAD} -${VPAD} ${SIZE + VPAD * 2} ${SIZE + VPAD * 2}`}
      role="img"
      aria-label={`Radar-Chart AI-Readiness: ${ariaLabel}`}
      className="w-full max-w-[300px] mx-auto block"
    >
      {/* Ringe (1–5) */}
      {[1, 2, 3, 4, 5].map(ring => {
        const rp = dims.map((_, i) => tip(i, n, ring / 5))
        const rPath = rp.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
        return (
          <path
            key={ring}
            d={rPath}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={ring === 5 ? 1 : 0.5}
          />
        )
      })}

      {/* Achslinien */}
      {dims.map((_, i) => {
        const end = tip(i, n)
        return (
          <line
            key={i}
            x1={CENTER} y1={CENTER}
            x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
            stroke="#e2e8f0"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Fläche (Polygon) — wächst aus der Mitte */}
      <path
        d={polyPath}
        fill="var(--color-primary)"
        fillOpacity="0.14"
        stroke="var(--color-primary)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="animate-radar-grow"
      />

      {/* Datenpunkte — gestaffeltes Pop-In */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x.toFixed(1)}
          cy={p.y.toFixed(1)}
          r="4"
          fill="var(--color-primary)"
          className="animate-radar-dot"
          style={{ '--dot-radar-i': i } as React.CSSProperties}
        />
      ))}

      {/* Achsen-Labels */}
      {dims.map((d, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2
        const labelR = MAX_R + 17
        const lx = CENTER + labelR * Math.cos(angle)
        const ly = CENTER + labelR * Math.sin(angle)
        const anchor = lx < CENTER - 4 ? 'end' : lx > CENTER + 4 ? 'start' : 'middle'
        return (
          <text
            key={d.id}
            x={lx.toFixed(1)}
            y={ly.toFixed(1)}
            textAnchor={anchor}
            dominantBaseline="central"
            fontSize="9"
            fill="#64748b"
            fontFamily="var(--font-geist-sans, sans-serif)"
          >
            {SHORT[d.id] ?? d.id}
          </text>
        )
      })}
    </svg>
  )
}
