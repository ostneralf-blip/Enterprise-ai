'use client'
import { useState } from 'react'

interface MiniUseCase {
  id: string
  name: string
  quadrant: string
  scores: Record<string, number>
}

const S = 100 // viewBox-Einheiten (= Prozent der dargestellten Breite)

function miniCoord(score: number): number {
  const clamped = Math.max(1, Math.min(5, score))
  return (0.08 + ((clamped - 1) / 4) * 0.84) * S
}

const DOT_FILL: Record<string, string> = {
  quick_win:         '#059669',
  strategic_bet:     'var(--color-primary)',
  low_hanging_fruit: '#D97706',
  avoid:             '#94a3b8',
}

const CHIP_LABEL: Record<string, string> = {
  quick_win:         'Quick Win',
  strategic_bet:     'Strategic Bet',
  low_hanging_fruit: 'Low Hanging',
  avoid:             'Vermeiden',
}

const CHIP_ORDER = ['quick_win', 'strategic_bet', 'low_hanging_fruit', 'avoid'] as const

export function MiniPortfolioMatrix({ useCases }: { useCases: MiniUseCase[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const activeUc = useCases.find(u => u.id === activeId)
  const isEmpty = useCases.length === 0

  const quadrantCounts = useCases.reduce((acc, uc) => {
    acc[uc.quadrant] = (acc[uc.quadrant] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="w-full">
      {/* SVG-Wrapper — responsiv, max 280px, quadratisch */}
      <div className="relative w-full max-w-[280px] mx-auto">
        <svg
          viewBox={`0 0 ${S} ${S}`}
          className="w-full aspect-square block"
          role="img"
          aria-label={isEmpty
            ? 'Portfolio-Matrix leer — noch keine Use Cases'
            : `Portfolio-Matrix mit ${useCases.length} Use ${useCases.length === 1 ? 'Case' : 'Cases'}`}
        >
          {/* Rahmen */}
          {isEmpty ? (
            <rect x="0.5" y="0.5" width={S - 1} height={S - 1} rx="2"
              fill="white" stroke="#cbd5e1" strokeWidth="0.8"
              strokeDasharray={S * 4} strokeDashoffset={S * 4}
              className="animate-dash-draw" />
          ) : (
            <rect x="0.5" y="0.5" width={S - 1} height={S - 1} rx="2"
              fill="white" stroke="#e2e8f0" strokeWidth="0.5" />
          )}

          {/* Mittellinien */}
          <line x1={S / 2} y1="0" x2={S / 2} y2={S} stroke="#E2E8F0" strokeWidth="0.5"
            {...(isEmpty
              ? { strokeDasharray: S, strokeDashoffset: S, className: 'animate-dash-draw',
                  style: { animationDelay: '400ms' } }
              : {})} />
          <line x1="0" y1={S / 2} x2={S} y2={S / 2} stroke="#E2E8F0" strokeWidth="0.5"
            {...(isEmpty
              ? { strokeDasharray: S, strokeDashoffset: S, className: 'animate-dash-draw',
                  style: { animationDelay: '600ms' } }
              : {})} />

          {/* Quadrant-Labels in Ecken — fontSize 3.5 entspricht proportional dem 9/400 der Feasibility Matrix */}
          <text x="2.5" y="6" fontSize="3.5" fontWeight="600" letterSpacing="0.4"
                fill={DOT_FILL.strategic_bet} fillOpacity="0.75">BET</text>
          <text x={S - 2.5} y="6" textAnchor="end" fontSize="3.5" fontWeight="600" letterSpacing="0.4"
                fill={DOT_FILL.quick_win} fillOpacity="0.75">QUICK WIN</text>
          <text x="2.5" y={S - 2} fontSize="3.5" fontWeight="600" letterSpacing="0.4"
                fill={DOT_FILL.avoid} fillOpacity="0.75">VERMEIDEN</text>
          <text x={S - 2.5} y={S - 2} textAnchor="end" fontSize="3.5" fontWeight="600" letterSpacing="0.4"
                fill={DOT_FILL.low_hanging_fruit} fillOpacity="0.75">LOW HANGING</text>

          {/* Punkte */}
          {useCases.map((uc, i) => {
            const cx = miniCoord(uc.scores.feasibility ?? 3)
            const cy = S - miniCoord(uc.scores.value ?? 3)
            const isActive = activeId === uc.id
            return (
              <g key={uc.id}>
                {/* Hit-Area: r=8 ≈ 44px Touch-Target bei 280px Darstellung */}
                <circle
                  cx={cx.toFixed(1)} cy={cy.toFixed(1)}
                  r="8"
                  fill="transparent"
                  className="cursor-default"
                  onMouseEnter={() => setActiveId(uc.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(uc.id)}
                  onBlur={() => setActiveId(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={uc.name}
                />
                {/* Sichtbarer Punkt */}
                <circle
                  cx={cx.toFixed(1)} cy={cy.toFixed(1)}
                  r={isActive ? 4.5 : 3.5}
                  fill={DOT_FILL[uc.quadrant] ?? '#94a3b8'}
                  stroke="#FFFFFF" strokeWidth="2"
                  className="animate-dot-pop transition-all duration-150 pointer-events-none"
                  style={{ '--dot-i': i } as React.CSSProperties}
                />
              </g>
            )
          })}
        </svg>

        {/* Tooltip — positioniert relativ zur 100×100 viewBox ≙ 100% der Container-Breite */}
        {activeUc && (() => {
          const cx = miniCoord(activeUc.scores.feasibility ?? 3)
          const cy = S - miniCoord(activeUc.scores.value ?? 3)
          return (
            <div
              className="absolute z-10 bg-slate-800 text-white text-[10px] leading-tight rounded-md px-2 py-1 shadow-lg pointer-events-none whitespace-nowrap max-w-[150px] truncate"
              style={{
                left: `${cx}%`,
                top: `${cy}%`,
                transform: 'translate(-50%, -145%)',
              }}
            >
              {activeUc.name}
            </div>
          )
        })()}
      </div>

      {/* Status-Chips: belegte Quadranten als kompakte Farb-Dot + Text Zeile */}
      {useCases.length > 0 && (
        <div className="mt-2.5 flex flex-wrap justify-center gap-x-3 gap-y-1">
          {CHIP_ORDER.filter(key => (quadrantCounts[key] ?? 0) > 0).map(key => (
            <span key={key} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DOT_FILL[key] }} />
              {quadrantCounts[key]}× {CHIP_LABEL[key]}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
