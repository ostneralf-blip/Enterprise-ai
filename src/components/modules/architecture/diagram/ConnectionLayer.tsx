'use client'
import { useId, useLayoutEffect, useState, type RefObject } from 'react'
import { ruleEdges, type BandId } from '@/lib/architecture/diagram-grouping'

interface Props {
  containerRef: RefObject<HTMLElement | null>
  grouping: 'layers' | 'togaf'
}

interface Rect { x: number; y: number; w: number; h: number }
interface Path { key: string; d: string }
interface Overlay { w: number; h: number; paths: Path[] }

// Regelbasierte UML-Schichtflüsse als SVG-Overlay über der Schichten-/TOGAF-Sicht.
// Gebündelt = eine Kante je Band-Paar (kein Baustein-Spaghetti). Die Band-Positionen
// werden per `data-band`-Attribut aus dem DOM gemessen (relativ zum Container) und
// bei Resize/Umbruch via ResizeObserver neu berechnet.
export function ConnectionLayer({ containerRef, grouping }: Props) {
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const uid = useId()

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const cRect = container.getBoundingClientRect()
      const bands = new Map<BandId, Rect>()
      container.querySelectorAll('[data-band]').forEach((el) => {
        const id = el.getAttribute('data-band') as BandId | null
        if (!id) return
        const r = el.getBoundingClientRect()
        bands.set(id, { x: r.left - cRect.left, y: r.top - cRect.top, w: r.width, h: r.height })
      })
      const present = new Set<BandId>(bands.keys())
      const edges = ruleEdges(grouping, present)

      const paths: Path[] = edges.flatMap(([fromId, toId], i) => {
        const from = bands.get(fromId)
        const to = bands.get(toId)
        if (!from || !to) return []
        const fromAbove = from.y < to.y
        const sx = from.x + from.w / 2
        const sy = fromAbove ? from.y + from.h : from.y
        const tx = to.x + to.w / 2
        const ty = fromAbove ? to.y : to.y + to.h
        // Kontrollpunkt seitlich versetzt, je Kante gefächert, damit sich mehrere
        // Kanten nicht überlagern.
        const bow = 40 + i * 34
        const cx = Math.max(sx, tx, from.x + from.w, to.x + to.w) - bow
        const cy = (sy + ty) / 2
        return [{ key: `${fromId}-${toId}`, d: `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}` }]
      })

      setOverlay({ w: cRect.width, h: cRect.height, paths })
    }

    measure()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure)
      ro.observe(container)
    }
    return () => ro?.disconnect()
  }, [containerRef, grouping])

  if (!overlay || overlay.paths.length === 0) return null

  const markerId = `${uid}-arrow`.replace(/:/g, "-")
  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      width={overlay.w}
      height={overlay.h}
      aria-hidden="true"
    >
      <defs>
        <marker id={markerId} viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-line-strong, #94a3b8)" />
        </marker>
      </defs>
      {overlay.paths.map((p) => (
        <path
          key={p.key}
          d={p.d}
          fill="none"
          stroke="var(--color-line-strong, #94a3b8)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          markerEnd={`url(#${markerId})`}
          opacity={0.7}
        />
      ))}
    </svg>
  )
}
