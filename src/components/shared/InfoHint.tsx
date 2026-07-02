'use client'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InfoHintProps {
  title: string
  children: React.ReactNode
  className?: string
  side?: 'top' | 'bottom'
}

export function InfoHint({ title, children, className, side = 'top' }: InfoHintProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={cn('relative inline-flex', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={`Info: ${title}`}
        aria-expanded={open}
        className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 text-[10px] font-bold flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex-shrink-0"
      >
        ?
      </button>
      {open && (
        <div
          role="tooltip"
          className={cn(
            'absolute left-0 z-30 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-semibold text-slate-900">{title}</p>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-base leading-none flex-shrink-0 focus:outline-none"
              aria-label="Schließen"
            >
              ×
            </button>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-1.5">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface HintBoxProps {
  children: React.ReactNode
  className?: string
  dismissible?: boolean
  variant?: 'info' | 'tip' | 'warning'
}

export function HintBox({ children, className, dismissible = false, variant = 'info' }: HintBoxProps) {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  const colors = {
    info:    'bg-blue-50 border-blue-100 text-blue-800',
    tip:     'bg-emerald-50 border-emerald-100 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
  }

  return (
    <div className={cn('rounded-xl border px-3 py-2.5 text-xs leading-relaxed', colors[variant], className)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex-shrink-0 select-none" aria-hidden="true">
          {variant === 'info' ? 'ℹ' : variant === 'tip' ? '✦' : '⚠'}
        </span>
        <div className="min-w-0 flex-1">{children}</div>
        {dismissible && (
          <button
            onClick={() => setVisible(false)}
            aria-label="Hinweis ausblenden"
            className="text-current opacity-40 hover:opacity-70 text-sm leading-none flex-shrink-0 focus:outline-none"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
