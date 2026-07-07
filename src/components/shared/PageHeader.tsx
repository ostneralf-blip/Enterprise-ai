import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  className?: string
}

export function PageHeader({ title, description, eyebrow, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {eyebrow && (
        <p className="text-xs text-primary tracking-widest uppercase font-medium mb-1">{eyebrow}</p>
      )}
      <h1 className="text-xl sm:text-2xl font-semibold font-serif text-slate-900">{title}</h1>
      {description && (
        <p className="text-slate-500 text-sm mt-1">{description}</p>
      )}
    </div>
  )
}
