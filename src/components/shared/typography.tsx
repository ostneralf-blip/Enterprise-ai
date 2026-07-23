import { cn } from '@/lib/utils'

// Kanonisches Textelement-Set (#205 Element 3). EIN Ort für die Typo-Hierarchie,
// damit Eyebrow/Titel/Body/Hinweis/Meta/Badge über alle Module gleich aussehen.
// Klassen folgen der festen Typo-Skala aus CLAUDE.md / design-system-handoff.md.
// Opt-in: Komponenten sind additiv, verändern bestehende Screens erst bei Adoption.

type Div = React.HTMLAttributes<HTMLParagraphElement>
type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4'

/** Seiten-/Sektions-Eyebrow: kleine, versale Primärfarb-Zeile über einem Titel. */
export function Eyebrow({ className, children, ...props }: Div) {
  return (
    <p className={cn('text-xs text-primary tracking-widest uppercase font-medium', className)} {...props}>
      {children}
    </p>
  )
}

/** Sektions-Titel (Standard h2 der Dashboard-Skala: text-base sm:text-lg). */
export function SectionTitle({ as: As = 'h2', className, children, ...props }: Div & { as?: HeadingLevel }) {
  return (
    <As className={cn('text-base sm:text-lg font-semibold text-ink', className)} {...props}>
      {children}
    </As>
  )
}

/** Karten-Titel (kleiner als Sektions-Titel). */
export function CardTitle({ as: As = 'h3', className, children, ...props }: Div & { as?: HeadingLevel }) {
  return (
    <As className={cn('text-sm font-semibold text-ink', className)} {...props}>
      {children}
    </As>
  )
}

/** Beschreibungs-/Fließtext. */
export function BodyText({ className, children, ...props }: Div) {
  return (
    <p className={cn('text-sm text-ink-secondary leading-relaxed', className)} {...props}>
      {children}
    </p>
  )
}

type HintTone = 'info' | 'warning' | 'error' | 'muted'
const HINT_TONE: Record<HintTone, string> = {
  info:    'text-info-text',
  warning: 'text-warning-text',
  error:   'text-error-text',
  muted:   'text-ink-muted',
}

/** Inline-Hinweistext (KEINE Box) — für kurze Hinweise unter Feldern/Werten. */
export function HintText({ tone = 'muted', className, children, ...props }: Div & { tone?: HintTone }) {
  return (
    <p className={cn('text-xs leading-relaxed', HINT_TONE[tone], className)} {...props}>
      {children}
    </p>
  )
}

/** Meta-/Provenienz-Zeile (mono) — z. B. „KI-generiert · Modell · Zeit". */
export function MetaText({ className, children, ...props }: Div) {
  return (
    <p className={cn('text-xs text-ink-muted font-mono', className)} {...props}>
      {children}
    </p>
  )
}

type BadgeTone = 'neutral' | 'info' | 'warning' | 'error' | 'success'
const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-raised border-line text-ink-secondary',
  info:    'bg-info-subtle border-info-border text-info-text',
  warning: 'bg-warning-subtle border-warning-border text-warning-text',
  error:   'bg-error-subtle border-error-border text-error-text',
  success: 'bg-success-subtle border-success-border text-success-text',
}

/** Badge/Pill mit einheitlicher Optik und semantischem Ton. */
export function Badge({ tone = 'neutral', className, children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span className={cn('inline-flex items-center text-xs font-medium border rounded-full px-2 py-0.5 whitespace-nowrap', BADGE_TONE[tone], className)} {...props}>
      {children}
    </span>
  )
}
