interface MiniUseCase {
  id: string
  quadrant: string
  scores: Record<string, number>
}

const DOT_FILL: Record<string, string> = {
  quick_win:         '#059669',
  strategic_bet:     'var(--color-primary)',
  low_hanging_fruit: '#D97706',
  avoid:             '#94a3b8',
}

const S = 88
const PAD = 7
const INNER = S - PAD * 2

export function MiniPortfolioMatrix({ useCases }: { useCases: MiniUseCase[] }) {
  if (useCases.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${S} ${S}`}
        className="w-[70px] h-[70px]"
        role="img"
        aria-label="Noch keine Use Cases — Portfolio-Matrix leer"
      >
        {/* Rahmen — Zeichnen-Animation */}
        <rect
          x={PAD} y={PAD} width={INNER} height={INNER} rx="3"
          fill="none" stroke="#cbd5e1" strokeWidth="1"
          strokeDasharray={INNER * 4} strokeDashoffset={INNER * 4}
          className="animate-dash-draw"
        />
        {/* Horizontale Mittellinie */}
        <line
          x1={PAD} y1={S / 2} x2={S - PAD} y2={S / 2}
          stroke="#e2e8f0" strokeWidth="0.5"
          strokeDasharray={INNER} strokeDashoffset={INNER}
          className="animate-dash-draw"
          style={{ animationDelay: '400ms' }}
        />
        {/* Vertikale Mittellinie */}
        <line
          x1={S / 2} y1={PAD} x2={S / 2} y2={S - PAD}
          stroke="#e2e8f0" strokeWidth="0.5"
          strokeDasharray={INNER} strokeDashoffset={INNER}
          className="animate-dash-draw"
          style={{ animationDelay: '600ms' }}
        />
      </svg>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      className="w-[70px] h-[70px]"
      role="img"
      aria-label={`Portfolio-Matrix mit ${useCases.length} Use ${useCases.length === 1 ? 'Case' : 'Cases'}`}
    >
      <rect x={PAD} y={PAD} width={INNER} height={INNER} rx="3" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
      <line x1={PAD} y1={S / 2} x2={S - PAD} y2={S / 2} stroke="#e2e8f0" strokeWidth="0.5" />
      <line x1={S / 2} y1={PAD} x2={S / 2} y2={S - PAD} stroke="#e2e8f0" strokeWidth="0.5" />

      {useCases.map((uc, i) => {
        const fx = (uc.scores.feasibility ?? 3)
        const vx = (uc.scores.value ?? 3)
        const nx = (fx - 1) / 4
        const ny = 1 - (vx - 1) / 4
        return (
          <circle
            key={uc.id}
            cx={(PAD + nx * INNER).toFixed(1)}
            cy={(PAD + ny * INNER).toFixed(1)}
            r="3.5"
            fill={DOT_FILL[uc.quadrant] ?? '#94a3b8'}
            stroke="#FFFFFF" strokeWidth="1.5"
            className="animate-dot-pop"
            style={{ '--dot-i': i } as React.CSSProperties}
          />
        )
      })}
    </svg>
  )
}
