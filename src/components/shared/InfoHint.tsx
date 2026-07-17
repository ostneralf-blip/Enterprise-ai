'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface InfoHintProps {
  title: string
  children: React.ReactNode
  className?: string
  side?: 'top' | 'bottom'
  align?: 'left' | 'right'
}

export function InfoHint({ title, children, className, side = 'top', align = 'left' }: InfoHintProps) {
  const [open, setOpen] = useState(false)
  const [resolvedSide, setResolvedSide] = useState(side)
  const [resolvedAlign, setResolvedAlign] = useState(align)
  const containerRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Auto-flip: Prüft nach dem Öffnen ob das Popover den Viewport verlässt und korrigiert.
  const adjustPosition = useCallback(() => {
    const popover = popoverRef.current
    const container = containerRef.current
    if (!popover || !container) return

    const pop = popover.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 8

    // Vertikale Seite
    if (resolvedSide === 'top' && pop.top < margin) {
      setResolvedSide('bottom')
    } else if (resolvedSide === 'bottom' && pop.bottom > vh - margin) {
      setResolvedSide('top')
    }

    // Horizontale Ausrichtung
    if (resolvedAlign === 'left' && pop.right > vw - margin) {
      setResolvedAlign('right')
    } else if (resolvedAlign === 'right' && pop.left < margin) {
      setResolvedAlign('left')
    }
  }, [resolvedSide, resolvedAlign])

  useEffect(() => {
    if (!open) {
      // Position beim Schließen zurücksetzen
      setResolvedSide(side)
      setResolvedAlign(align)
      return
    }
    // Nach nächstem Paint messen
    requestAnimationFrame(adjustPosition)
  }, [open, side, align, adjustPosition])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className={cn('relative inline-flex', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={`Info: ${title}`}
        aria-expanded={open}
        className="w-4 h-4 rounded-full bg-surface-input text-ink-muted hover:bg-primary-soft hover:text-primary text-[10px] font-bold flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1 flex-shrink-0"
      >
        ?
      </button>
      {open && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={cn(
            'absolute z-50 w-72 bg-surface border border-line rounded-xl shadow-lg p-4',
            resolvedAlign === 'right' ? 'right-0' : 'left-0',
            resolvedSide === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-semibold text-ink">{title}</p>
            <button
              onClick={() => setOpen(false)}
              className="text-ink-subtle hover:text-ink-secondary text-base leading-none flex-shrink-0 focus:outline-none"
              aria-label="Schließen"
            >
              ×
            </button>
          </div>
          <div className="text-xs text-ink-secondary leading-relaxed space-y-1.5">
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
    info:    'bg-primary-soft border-primary-border text-primary',
    tip:     'bg-success-subtle border-success-border text-success-text',
    warning: 'bg-warning-subtle border-warning-border text-warning-text',
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
