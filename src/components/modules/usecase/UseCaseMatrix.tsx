'use client'
import { QUADRANT_META } from '@/config/usecase-data'
import type { UseCase } from '@/types'

interface UseCaseMatrixProps {
  useCases: UseCase[]
}

const QUADRANT_COLORS = {
  quick_win:        { bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  strategic_bet:    { bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
  low_hanging_fruit:{ bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  avoid:            { bg: 'bg-slate-50',   border: 'border-slate-200',   dot: 'bg-slate-400'   },
}

export function UseCaseMatrix({ useCases }: UseCaseMatrixProps) {
  if (useCases.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-slate-500 text-sm">Fügen Sie Use Cases hinzu, um die Matrix zu sehen.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">Value × Feasibility Matrix</h2>
        <p className="text-xs text-slate-400 mt-0.5">X-Achse: Umsetzbarkeit · Y-Achse: Business Value</p>
      </div>

      {/* Matrix Grid */}
      <div className="relative w-full" style={{ paddingBottom: 'min(100%, 420px)' }}>
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1">
          {/* Top-left: Strategic Bet (High Value, Low Feasibility) */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 flex flex-col justify-between">
            <div className="text-xs font-medium text-blue-600">{QUADRANT_META.strategic_bet.icon} Strategic Bet</div>
          </div>
          {/* Top-right: Quick Win (High Value, High Feasibility) */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 flex flex-col justify-between">
            <div className="text-xs font-medium text-emerald-600">{QUADRANT_META.quick_win.icon} Quick Win</div>
          </div>
          {/* Bottom-left: Avoid */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
            <div className="text-xs font-medium text-slate-400">{QUADRANT_META.avoid.icon} Vermeiden</div>
          </div>
          {/* Bottom-right: Low Hanging Fruit */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-2">
            <div className="text-xs font-medium text-amber-600">{QUADRANT_META.low_hanging_fruit.icon} Low Hanging Fruit</div>
          </div>
        </div>

        {/* Dots */}
        {useCases.map(uc => {
          const x = ((uc.scores.feasibility ?? 3) - 1) / 4
          const y = 1 - ((uc.scores.value ?? 3) - 1) / 4
          const colors = QUADRANT_COLORS[uc.quadrant]
          return (
            <div
              key={uc.id}
              className="absolute"
              style={{ left: `calc(${x * 100}% - 10px)`, top: `calc(${y * 100}% - 10px)` }}
            >
              <div className="relative group">
                <div className={`w-5 h-5 rounded-full ${colors.dot} border-2 border-white shadow-sm cursor-default`} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                  <div className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap max-w-[140px] truncate shadow-lg">
                    {uc.name}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {useCases.map(uc => {
          const colors = QUADRANT_COLORS[uc.quadrant]
          return (
            <div key={uc.id} className="flex items-center gap-1.5 min-w-0">
              <div className={`w-3 h-3 rounded-full ${colors.dot} shrink-0`} />
              <span className="text-xs text-slate-600 truncate max-w-[120px]">{uc.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
