'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Tier } from '@/types'

export interface PathStep {
  step: number
  icon: string
  title: string
  desc: string
  href: string
  done: boolean
  proOnly?: boolean
}

interface Props {
  steps: PathStep[]
  tier: Tier
}

export function GuidedPathHero({ steps, tier }: Props) {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const [animatedDone, setAnimatedDone] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!mounted) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnimatedDone(new Set())
    const doneSteps = steps.filter(s => s.done).map(s => s.step)
    const timers: ReturnType<typeof setTimeout>[] = []
    doneSteps.forEach((step, i) => {
      timers.push(setTimeout(() => {
        setAnimatedDone(prev => new Set([...prev, step]))
      }, i * 80))
    })
    return () => timers.forEach(clearTimeout)
  }, [mounted, steps])

  const completedCount = steps.filter(s => s.done).length
  const nextStep = steps.find(s => !s.done)
  const progressPct = Math.round((completedCount / steps.length) * 100)
  const allDone = completedCount === steps.length

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Ihr geführter AI-Pfad</h2>
        <span className="text-xs text-slate-400">{completedCount}/{steps.length} abgeschlossen</span>
      </div>

      {/* Fortschrittsbalken */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: mounted ? `${progressPct}%` : '0%' }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Fortschritt: ${completedCount} von ${steps.length} Schritten abgeschlossen`}
        />
      </div>

      {/* Schritt-Kacheln */}
      <ul
        className="grid gap-1 mb-4 list-none p-0 m-0"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        aria-label="Geführter AI-Pfad Schritte"
      >
        {steps.map((s) => {
          const isCurrent = s === nextStep
          const isLocked = s.proOnly && tier === 'free'
          return (
            <li key={s.step}>
              <Link
                href={isLocked ? '/upgrade' : s.href}
                aria-label={`Schritt ${s.step}: ${s.title}${s.done ? ' (abgeschlossen)' : isCurrent ? ' (aktuell empfohlen)' : ''}`}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-[transform,box-shadow] duration-150 text-center',
                  'hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none',
                  s.done
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : isCurrent
                      ? 'bg-primary-soft border-primary-border text-primary ring-1 ring-primary-ring'
                      : 'bg-slate-50 border-slate-200 text-slate-400',
                )}
              >
                <span
                  className={`text-sm leading-none transition-[transform] duration-300 motion-reduce:transition-none ${
                    s.done
                      ? `motion-reduce:scale-100 ${animatedDone.has(s.step) ? 'scale-100' : 'scale-0'}`
                      : ''
                  }`}
                >
                  {s.done ? '✓' : s.icon}
                </span>
                <span className="text-[9px] font-medium leading-tight line-clamp-2 text-center w-full">{s.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* CTA */}
      {nextStep && !allDone && (
        <Link
          href={nextStep.proOnly && tier === 'free' ? '/upgrade' : nextStep.href}
          className="group flex items-center gap-3 bg-primary hover:bg-primary-hover text-white rounded-lg px-4 py-3 transition-colors"
          aria-label={`Nächster Schritt: ${nextStep.title}`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-white/70 mb-0.5">
              Nächster Schritt · {nextStep.step} von {steps.length}
            </div>
            <div className="text-sm font-semibold">{nextStep.title}</div>
          </div>
          <span
            className="text-white/70 group-hover:text-white text-sm shrink-0 group-hover:translate-x-1 transition-transform duration-150 motion-reduce:transition-none motion-reduce:transform-none"
            aria-hidden="true"
          >→</span>
        </Link>
      )}

      {allDone && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <span className="text-xl" aria-hidden="true">✓</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-emerald-800">AI-Navigator Pfad vollständig!</div>
            <div className="text-xs text-emerald-600">Alle Module abgeschlossen — Ergebnisse in PDF zusammenfassen.</div>
          </div>
        </div>
      )}
    </div>
  )
}
