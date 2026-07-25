'use client'
import { useId, useLayoutEffect, useState, type RefObject } from 'react'
import { ruleEdges, type BandId } from '@/lib/architecture/diagram-grouping'
import type { CompEdge, CompConflict } from '@/lib/architecture/catalog-edges'

interface Props {
  containerRef: RefObject<HTMLElement | null>
  grouping: 'layers' | 'togaf'
  // Phase 3: echte Katalog-Kanten. Sind welche vorhanden, werden component-to-component-
  // Kanten gezeichnet; sonst Fallback auf regelbasierte Band-Flüsse (Phase 2).
  compEdges?: CompEdge[]
  conflicts?: CompConflict[]
}

interface Rect { x: number; y: number; w: number; h: number }
interface DrawPath { key: string; d: string; kind: 'requires' | 'suggests' | 'conflict' | 'rule' }
interface Overlay { w: number; h: number; paths: DrawPath[] }

function collect(container: HTMLElement, selector: string): Map<string, Rect> {
  const cRect = container.getBoundingClientRect()
  const map = new Map<string, Rect>()
  container.querySelectorAll(selector).forEach((el) => {
    const key = el.getAttribute(selector === '[data-band]' ? 'data-band' : 'data-comp')
    if (!key || map.has(key)) return
    const r = el.getBoundingClientRect()
    map.set(key, { x: r.left - cRect.left, y: r.top - cRect.top, w: r.width, h: r.height })
  })
  return map
}

// Ankerpunkte auf den zugewandten Kanten zweier Rechtecke (dominante Achse).
function anchors(from: Rect, to: Rect) {
  const fcx = from.x + from.w / 2, fcy = from.y + from.h / 2
  const tcx = to.x + to.w / 2, tcy = to.y + to.h / 2
  const dx = tcx - fcx, dy = tcy - fcy
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { sx: dx > 0 ? from.x + from.w : from.x, sy: fcy, tx: dx > 0 ? to.x : to.x + to.w, ty: tcy }
  }
  return { sx: fcx, sy: dy > 0 ? from.y + from.h : from.y, tx: tcx, ty: dy > 0 ? to.y : to.y + to.h }
}

function curve(from: Rect, to: Rect, bow: number) {
  const { sx, sy, tx, ty } = anchors(from, to)
  const mx = (sx + tx) / 2, my = (sy + ty) / 2
  const dx = tx - sx, dy = ty - sy
  const len = Math.hypot(dx, dy) || 1
  // Kontrollpunkt senkrecht zur Verbindung versetzt (fächert Mehrfachkanten auf).
  const cx = mx + (-dy / len) * bow
  const cy = my + (dx / len) * bow
  return `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`
}

// Regelbasierte UML-Verknüpfung als SVG-Overlay. Bevorzugt echte Katalog-Kanten
// (requires/suggests/incompatible), fällt sonst auf gebündelte Schicht-Flüsse zurück.
export function ConnectionLayer({ containerRef, grouping, compEdges = [], conflicts = [] }: Props) {
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const uid = useId()

  const hasCatalog = compEdges.length > 0 || conflicts.length > 0
  // Stabiler Effekt-Trigger, ohne Objekt-Referenzen als Dependency.
  const catalogKey = JSON.stringify({ compEdges, conflicts })

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const cRect = container.getBoundingClientRect()
      let paths: DrawPath[] = []

      if (hasCatalog) {
        const comps = collect(container, '[data-comp]')
        const edgePaths: DrawPath[] = compEdges.flatMap((e, i) => {
          const from = comps.get(e.from), to = comps.get(e.to)
          if (!from || !to) return []
          return [{ key: `e-${e.from}-${e.to}-${e.kind}`, d: curve(from, to, 24 + (i % 4) * 16), kind: e.kind }]
        })
        const conflictPaths: DrawPath[] = conflicts.flatMap((c, i) => {
          const a = comps.get(c.a), b = comps.get(c.b)
          if (!a || !b) return []
          return [{ key: `c-${c.a}-${c.b}`, d: curve(a, b, 20 + (i % 3) * 14), kind: 'conflict' }]
        })
        paths = [...edgePaths, ...conflictPaths]
      } else {
        const bands = collect(container, '[data-band]')
        const present = new Set(Array.from(bands.keys()) as BandId[])
        paths = ruleEdges(grouping, present).flatMap(([fromId, toId], i) => {
          const from = bands.get(fromId), to = bands.get(toId)
          if (!from || !to) return []
          const fromAbove = from.y < to.y
          const sx = from.x + from.w / 2
          const sy = fromAbove ? from.y + from.h : from.y
          const tx = to.x + to.w / 2
          const ty = fromAbove ? to.y : to.y + to.h
          const bx = Math.max(sx, tx, from.x + from.w, to.x + to.w) - (40 + i * 34)
          return [{ key: `rule-${fromId}-${toId}`, d: `M ${sx} ${sy} Q ${bx} ${(sy + ty) / 2} ${tx} ${ty}`, kind: 'rule' as const }]
        })
      }

      setOverlay({ w: cRect.width, h: cRect.height, paths })
    }

    measure()
    // Nachmessung nach dem nächsten Layout/Paint: beim Öffnen der Vergrößern-Ansicht
    // (Modal) steht die endgültige Breite/Position der Bausteine erst nach dem Mount
    // fest — die reine useLayoutEffect-Messung liefert sonst evtl. keine Kanten.
    const rafIds: number[] = []
    rafIds.push(requestAnimationFrame(() => {
      rafIds.push(requestAnimationFrame(measure))
    }))
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure)
      ro.observe(container)
    }
    return () => {
      ro?.disconnect()
      rafIds.forEach(id => cancelAnimationFrame(id))
    }
    // catalogKey kodiert compEdges+conflicts inhaltsstabil; die Array-Referenzen
    // selbst NICHT als Deps, sonst läuft der Effekt bei jedem Render neu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, grouping, hasCatalog, catalogKey])

  if (!overlay || overlay.paths.length === 0) return null

  const arrowId = `${uid}-arrow`.replace(/:/g, '-')
  const line = 'var(--color-line-strong, #94a3b8)'
  const danger = 'var(--color-error-text, #dc2626)'

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible" width={overlay.w} height={overlay.h} aria-hidden="true">
      <defs>
        <marker id={arrowId} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 Z" fill={line} />
        </marker>
      </defs>
      {overlay.paths.map((p) => {
        if (p.kind === 'conflict') {
          return <path key={p.key} d={p.d} fill="none" stroke={danger} strokeWidth={1.5} strokeDasharray="2 3" opacity={0.85} />
        }
        return (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            stroke={line}
            strokeWidth={1.5}
            strokeDasharray={p.kind === 'suggests' ? '4 3' : undefined}
            markerEnd={`url(#${arrowId})`}
            opacity={0.7}
          />
        )
      })}
    </svg>
  )
}
