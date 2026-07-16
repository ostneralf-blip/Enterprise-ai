import { cn } from '@/lib/utils'

type AlertVariant = 'info' | 'warning' | 'error'

const STYLES: Record<AlertVariant, { wrapper: string; icon: string }> = {
  info:    { wrapper: 'bg-blue-50 border-blue-200 text-blue-800',   icon: 'ℹ' },
  warning: { wrapper: 'bg-amber-50 border-amber-300 text-amber-800', icon: '⚠' },
  error:   { wrapper: 'bg-red-50 border-red-300 text-red-800',       icon: '✕' },
}

interface AlertBoxProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}

export function AlertBox({ variant = 'info', title, children, className }: AlertBoxProps) {
  const { wrapper, icon } = STYLES[variant]
  return (
    <div role="alert" className={cn('border rounded-2xl p-4 sm:p-5 flex items-start gap-3', wrapper, className)}>
      <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
