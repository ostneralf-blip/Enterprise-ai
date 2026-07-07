import Link from 'next/link'
import { cn } from '@/lib/utils'

export type EmptyStateVariant = 'folder' | 'grid' | 'matrix'

interface EmptyStateProps {
  variant: EmptyStateVariant
  title: string
  description: string
  cta: { href: string; label: string }
  className?: string
}

const DASH = 1000 // Wert sicher größer als jeder Pfad — Zeichenanimation startet von hier

function FolderIllustration() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-primary" aria-hidden="true">
      <path
        d="M10 62V28a4 4 0 014-4h16l4-6h28a4 4 0 014 4v40a4 4 0 01-4 4H14a4 4 0 01-4-4z"
        className="animate-dash-draw"
        strokeDasharray={DASH} strokeDashoffset={DASH}
      />
      <line x1="22" y1="40" x2="58" y2="40"
        className="animate-dash-draw" style={{ animationDelay: '400ms' }}
        strokeDasharray={DASH} strokeDashoffset={DASH}
      />
      <line x1="22" y1="50" x2="58" y2="50"
        className="animate-dash-draw" style={{ animationDelay: '550ms' }}
        strokeDasharray={DASH} strokeDashoffset={DASH}
      />
      <line x1="22" y1="60" x2="46" y2="60"
        className="animate-dash-draw" style={{ animationDelay: '700ms' }}
        strokeDasharray={DASH} strokeDashoffset={DASH}
      />
    </svg>
  )
}

function GridIllustration() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-primary" aria-hidden="true">
      <rect x="8" y="8" width="64" height="64" rx="3"
        className="animate-dash-draw"
        strokeDasharray={DASH} strokeDashoffset={DASH}
      />
      {[26, 44, 62].map((y, i) => (
        <line key={y} x1="8" y1={y} x2="72" y2={y}
          className="animate-dash-draw" style={{ animationDelay: `${300 + i * 120}ms` }}
          strokeDasharray={DASH} strokeDashoffset={DASH}
        />
      ))}
      <line x1="40" y1="8" x2="40" y2="72"
        className="animate-dash-draw" style={{ animationDelay: '700ms' }}
        strokeDasharray={DASH} strokeDashoffset={DASH}
      />
    </svg>
  )
}

function MatrixIllustration() {
  const dots: [number, number][] = [[35, 35], [53, 35], [35, 53], [53, 53], [35, 17], [53, 17]]
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="text-primary" aria-hidden="true">
      <rect x="8" y="8" width="64" height="64" rx="2"
        className="animate-dash-draw"
        strokeDasharray={DASH} strokeDashoffset={DASH}
      />
      {[26, 44, 62].map((y, i) => (
        <line key={`h${y}`} x1="8" y1={y} x2="72" y2={y}
          className="animate-dash-draw" style={{ animationDelay: `${250 + i * 100}ms` }}
          strokeDasharray={DASH} strokeDashoffset={DASH}
        />
      ))}
      {[26, 44, 62].map((x, i) => (
        <line key={`v${x}`} x1={x} y1="8" x2={x} y2="72"
          className="animate-dash-draw" style={{ animationDelay: `${550 + i * 100}ms` }}
          strokeDasharray={DASH} strokeDashoffset={DASH}
        />
      ))}
      {dots.map(([cx, cy], i) => (
        <circle key={`${cx},${cy}`} cx={cx} cy={cy} r="2.5" fill="currentColor" stroke="none"
          className="animate-dash-draw" style={{ animationDelay: `${850 + i * 80}ms`, opacity: 0 }}
        />
      ))}
    </svg>
  )
}

const ILLUSTRATIONS: Record<EmptyStateVariant, () => React.JSX.Element> = {
  folder: FolderIllustration,
  grid:   GridIllustration,
  matrix: MatrixIllustration,
}

export function EmptyState({ variant, title, description, cta, className }: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant]
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 gap-5 text-center', className)}>
      <Illustration />
      <div className="space-y-1.5 max-w-xs">
        <h3 className="font-serif text-lg text-slate-800">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <Link href={cta.href}
        className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
        {cta.label} →
      </Link>
    </div>
  )
}
