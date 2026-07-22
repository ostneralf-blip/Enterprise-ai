import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  className?: string
  /** Optionaler Info-Marker (z. B. <InfoHint>) neben dem Titel — Hilfetext als „?"-Popup. */
  hint?: React.ReactNode
}

export function PageHeader({ title, description, eyebrow, className, hint }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {eyebrow && (
        <p className="text-xs text-primary tracking-widest uppercase font-medium mb-1">{eyebrow}</p>
      )}
      {hint ? (
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold font-serif text-ink">{title}</h1>
          {hint}
        </div>
      ) : (
        <h1 className="text-xl sm:text-2xl font-semibold font-serif text-ink">{title}</h1>
      )}
      {description && (
        <p className="text-ink-muted text-sm mt-1">{description}</p>
      )}
    </div>
  )
}
