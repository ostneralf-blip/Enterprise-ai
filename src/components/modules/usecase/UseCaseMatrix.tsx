'use client'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { QUADRANT_META } from '@/config/usecase-data'
import { pick } from '@/lib/utils/locale-data'
import type { UseCase } from '@/types'

interface UseCaseMatrixProps {
  useCases: UseCase[]
}

const S = 400

// Exportiert für Unit-Tests — clampt Score 1–5 auf 8 %–92 % der SVG-Achse
export function scoreToCoord(score: number, size: number): number {
  const clamped = Math.max(1, Math.min(5, score))
  const raw = (clamped - 1) / 4
  return (0.08 + raw * 0.84) * size
}

const DOT_COLOR: Record<string, string> = {
  quick_win:         '#059669',
  strategic_bet:     'var(--color-primary)',
  low_hanging_fruit: '#D97706',
  avoid:             '#94a3b8',
}

const LABEL_COLOR: Record<string, string> = {
  quick_win:         '#059669',
  strategic_bet:     '#1D4ED8',
  low_hanging_fruit: '#D97706',
  avoid:             '#94a3b8',
}

export function UseCaseMatrix({ useCases }: UseCaseMatrixProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const locale = useLocale()
  const t = useTranslations('modules')

  if (useCases.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
        <svg viewBox="0 0 120 120" className="w-[100px] h-[100px]" role="img" aria-label={t('usecase.emptyMatrixAriaLabel')}>
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
          <text x="35" y="85" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontStyle="italic">{t('usecase.vermeiden')}</text>
          <text x="85" y="85" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontStyle="italic">Low Hanging</text>
        </svg>
        <div className="space-y-1.5">
          <h3 className="font-serif text-base text-slate-800">{t('usecase.emptyTitle')}</h3>
          <p className="text-sm text-slate-500">{t('usecase.emptyDesc')}</p>
        </div>
        <Link href="/usecase" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
          {t('usecase.emptyLink')}
        </Link>
      </div>
    )
  }

  const activeUc = useCases.find(u => u.id === activeId)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Value × Feasibility Matrix</h2>
        <p className="text-xs text-slate-400 mt-0.5">{t('usecase.axisLabel')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Linke Spalte: SVG + Achsen-Label als HTML + horizontale Legende */}
        <div className="w-full max-w-[480px] mx-auto lg:mx-0 shrink-0">
          <div className="relative aspect-square">
            <svg
              viewBox={`0 0 ${S} ${S}`}
              className="w-full h-full border border-slate-200 rounded-xl"
              role="img"
              aria-label={`Portfolio-Matrix mit ${useCases.length} Use Cases`}
            >
              {/* Hairlines */}
              <line x1="200" y1="0" x2="200" y2={S} stroke="#E2E8F0" strokeWidth="1" />
              <line x1="0" y1="200" x2={S} y2="200" stroke="#E2E8F0" strokeWidth="1" />

              {/* Quadrant-Labels fest in Ecken — kein Überlapp-Risiko */}
              <text x="8" y="18" fontSize="9" fontWeight="600" letterSpacing="1.2" fill={LABEL_COLOR.strategic_bet}>
                STRATEGIC BET
              </text>
              <text x={S - 8} y="18" textAnchor="end" fontSize="9" fontWeight="600" letterSpacing="1.2" fill={LABEL_COLOR.quick_win}>
                QUICK WIN
              </text>
              <text x="8" y={S - 8} fontSize="9" fontWeight="600" letterSpacing="1.2" fill={LABEL_COLOR.avoid}>
                {t('usecase.vermeiden').toUpperCase()}
              </text>
              <text x={S - 8} y={S - 8} textAnchor="end" fontSize="9" fontWeight="600" letterSpacing="1.2" fill={LABEL_COLOR.low_hanging_fruit}>
                LOW HANGING FRUIT
              </text>

              {/* Punkte — r=7 default, r=9 aktiv, weißer Ring */}
              {useCases.map((uc, i) => {
                const cx = scoreToCoord(uc.scores.feasibility ?? 3, S)
                const cy = S - scoreToCoord(uc.scores.value ?? 3, S)
                const isActive = activeId === uc.id
                return (
                  <g
                    key={uc.id}
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
                      r={isActive ? 9 : 7}
                      fill={DOT_COLOR[uc.quadrant] ?? '#94a3b8'}
                      stroke="#FFFFFF" strokeWidth="2"
                      className="animate-dot-pop transition-all duration-150 cursor-default"
                      style={{ '--dot-i': i } as React.CSSProperties}
                    />
                  </g>
                )
              })}
            </svg>

            {/* Tooltip */}
            {activeUc && (() => {
              const cx = scoreToCoord(activeUc.scores.feasibility ?? 3, S) / S
              const cy = 1 - scoreToCoord(activeUc.scores.value ?? 3, S) / S
              return (
                <div
                  className="absolute z-10 bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg pointer-events-none whitespace-nowrap max-w-[180px] truncate"
                  style={{ left: `calc(${cx * 100}% - 90px)`, top: `calc(${cy * 100}% - 38px)` }}
                >
                  {activeUc.name}
                </div>
              )
            })()}
          </div>

          {/* Achsen-Label außerhalb des SVG als HTML — kein Kollisions-Risiko */}
          <div className="mt-2 text-center">
            <span className="text-[10px] text-slate-400">{t('usecase.axisHintBelow')}</span>
          </div>

          {/* Legende: horizontal, zentriert, unter der Matrix */}
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            {(Object.keys(DOT_COLOR) as Array<keyof typeof DOT_COLOR>).map(key => (
              <div key={key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DOT_COLOR[key] }} />
                <span className="text-xs text-slate-500">{pick(QUADRANT_META[key as keyof typeof QUADRANT_META]?.label ?? { de: '', en: '' }, locale)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rechte Spalte: Use-Case-Liste — hover/click hebt Punkt in Matrix hervor */}
        <div className="w-full lg:flex-1">
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
            {t('usecase.ratedUseCases')}
          </h3>
          <div className="space-y-0.5">
            {useCases.map(uc => (
              <div
                key={uc.id}
                className={`flex gap-3 py-2 px-2 rounded-lg cursor-default transition-colors ${activeId === uc.id ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                onMouseEnter={() => setActiveId(uc.id)}
                onMouseLeave={() => setActiveId(null)}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{ background: DOT_COLOR[uc.quadrant] ?? '#94a3b8' }}
                />
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate transition-colors ${activeId === uc.id ? 'text-slate-900' : 'text-slate-700'}`}>
                    {uc.name}
                  </div>
                  {uc.description && (
                    <div className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                      {uc.description}
                    </div>
                  )}
                  <div className="text-xs font-medium mt-0.5" style={{ color: DOT_COLOR[uc.quadrant] ?? '#94a3b8' }}>
                    {pick(QUADRANT_META[uc.quadrant as keyof typeof QUADRANT_META]?.label ?? { de: '', en: '' }, locale)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
