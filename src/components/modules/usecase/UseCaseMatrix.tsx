'use client'
import { useState } from 'react'
import Link from 'next/link'
import { QUADRANT_META } from '@/config/usecase-data'
import type { UseCase } from '@/types'

interface UseCaseMatrixProps {
  useCases: UseCase[]
}

const S = 400

const QUADRANT_STYLE = {
  quick_win:         { fill: '#ECFDF5', label: '#059669', dot: '#10b981' },
  strategic_bet:     { fill: '#EFF6FF', label: '#1D4ED8', dot: 'var(--color-primary)' },
  low_hanging_fruit: { fill: '#FFFBEB', label: '#D97706', dot: '#f59e0b' },
  avoid:             { fill: '#F8FAFC', label: '#94a3b8', dot: '#94a3b8' },
}

export function UseCaseMatrix({ useCases }: UseCaseMatrixProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  if (useCases.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
        <svg viewBox="0 0 120 120" className="w-[100px] h-[100px]" role="img" aria-label="Leere Portfolio-Matrix">
          <rect x="10" y="10" width="100" height="100" rx="6" fill="none" stroke="#cbd5e1" strokeWidth="1"
                strokeDasharray="400" strokeDashoffset="400" className="animate-dash-draw" />
          <line x1="10" y1="60" x2="110" y2="60" stroke="#e2e8f0" strokeWidth="0.75"
                strokeDasharray="100" strokeDashoffset="100" className="animate-dash-draw"
                style={{ animationDelay: '400ms' }} />
          <line x1="60" y1="10" x2="60" y2="110" stroke="#e2e8f0" strokeWidth="0.75"
                strokeDasharray="100" strokeDashoffset="100" className="animate-dash-draw"
                style={{ animationDelay: '600ms' }} />
          <text x="35" y="38" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontStyle="italic">Strategic</text>
          <text x="85" y="38" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontStyle="italic">Quick Win</text>
          <text x="35" y="85" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontStyle="italic">Vermeiden</text>
          <text x="85" y="85" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontStyle="italic">Low Hanging</text>
        </svg>
        <div className="space-y-1.5">
          <h3 className="font-serif text-base text-slate-800">Noch keine Use Cases</h3>
          <p className="text-sm text-slate-500">Legen Sie Ihren ersten Use Case an, um die Matrix zu befüllen.</p>
        </div>
        <Link href="/usecase" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
          Ersten Use Case anlegen →
        </Link>
      </div>
    )
  }

  const activeUc = useCases.find(u => u.id === activeId)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Value × Feasibility Matrix</h2>
        <p className="text-xs text-slate-400 mt-0.5">X-Achse: Umsetzbarkeit · Y-Achse: Business Value</p>
      </div>

      {/* SVG Matrix */}
      <div className="relative aspect-square max-w-[480px] mx-auto">
        <svg
          viewBox={`0 0 ${S} ${S}`}
          className="w-full h-full"
          role="img"
          aria-label={`Portfolio-Matrix mit ${useCases.length} Use Cases`}
        >
          {/* Quadrant-Hintergründe */}
          <rect x="0"   y="0"   width="200" height="200" fill={QUADRANT_STYLE.strategic_bet.fill} />
          <rect x="200" y="0"   width="200" height="200" fill={QUADRANT_STYLE.quick_win.fill} />
          <rect x="0"   y="200" width="200" height="200" fill={QUADRANT_STYLE.avoid.fill} />
          <rect x="200" y="200" width="200" height="200" fill={QUADRANT_STYLE.low_hanging_fruit.fill} />

          {/* Trennlinien */}
          <line x1="200" y1="0" x2="200" y2={S} stroke="#e2e8f0" strokeWidth="1" />
          <line x1="0" y1="200" x2={S} y2="200" stroke="#e2e8f0" strokeWidth="1" />

          {/* Quadrant-Labels */}
          <text x="8" y="16" fontSize="10" fill={QUADRANT_STYLE.strategic_bet.label} fontWeight="600">
            {QUADRANT_META.strategic_bet.icon} Strategic Bet
          </text>
          <text x="208" y="16" fontSize="10" fill={QUADRANT_STYLE.quick_win.label} fontWeight="600">
            {QUADRANT_META.quick_win.icon} Quick Win
          </text>
          <text x="8" y={S - 6} fontSize="10" fill={QUADRANT_STYLE.avoid.label} fontWeight="600">
            {QUADRANT_META.avoid.icon} Vermeiden
          </text>
          <text x="208" y={S - 6} fontSize="10" fill={QUADRANT_STYLE.low_hanging_fruit.label} fontWeight="600">
            {QUADRANT_META.low_hanging_fruit.icon} Low Hanging
          </text>

          {/* Punkte */}
          {useCases.map((uc, i) => {
            const cx = ((uc.scores.feasibility ?? 3) - 1) / 4 * S
            const cy = (1 - ((uc.scores.value ?? 3) - 1) / 4) * S
            const style = QUADRANT_STYLE[uc.quadrant]
            const isActive = activeId === uc.id
            return (
              <g key={uc.id}
                 onMouseEnter={() => setActiveId(uc.id)}
                 onMouseLeave={() => setActiveId(null)}
                 onFocus={() => setActiveId(uc.id)}
                 onBlur={() => setActiveId(null)}
                 role="button"
                 tabIndex={0}
                 aria-label={uc.name}
              >
                <circle
                  cx={cx.toFixed(1)} cy={cy.toFixed(1)}
                  r={isActive ? 11 : 9}
                  fill={style.dot}
                  stroke="white" strokeWidth="2"
                  className="animate-dot-pop transition-all duration-150"
                  style={{ '--dot-i': i } as React.CSSProperties}
                />
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {activeUc && (() => {
          const cx = ((activeUc.scores.feasibility ?? 3) - 1) / 4
          const cy = 1 - ((activeUc.scores.value ?? 3) - 1) / 4
          return (
            <div
              className="absolute z-10 bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none whitespace-nowrap max-w-[180px] truncate"
              style={{
                left: `calc(${cx * 100}% - 90px)`,
                top: `calc(${cy * 100}% - 38px)`,
              }}
            >
              {activeUc.name}
            </div>
          )
        })()}
      </div>

      {/* Achsen-Labels */}
      <div className="mt-2 flex items-center justify-center gap-1">
        <span className="text-[10px] text-slate-400">← weniger umsetzbar</span>
        <span className="text-[10px] text-slate-300 mx-2">·</span>
        <span className="text-[10px] text-slate-400">gut umsetzbar →</span>
      </div>

      {/* Legende */}
      <div className="mt-4 flex flex-wrap gap-3">
        {useCases.map(uc => {
          const style = QUADRANT_STYLE[uc.quadrant]
          return (
            <div key={uc.id}
                 className="flex items-center gap-1.5 min-w-0 cursor-default"
                 onMouseEnter={() => setActiveId(uc.id)}
                 onMouseLeave={() => setActiveId(null)}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: style.dot }} />
              <span className={`text-xs truncate max-w-[120px] transition-colors ${activeId === uc.id ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                {uc.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
