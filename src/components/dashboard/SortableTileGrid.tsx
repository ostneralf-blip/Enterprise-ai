'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ClipboardCheck, Target, LayoutGrid, Shield, Map, Scale, Layers, FileText, GripVertical,
  type LucideIcon,
} from 'lucide-react'
import { track } from '@/lib/posthog/client'

const STORAGE_KEY = 'dashboard_tile_order_v1'

const MODULE_ICONS: Record<string, LucideIcon> = {
  assessment:   ClipboardCheck,
  canvas:       LayoutGrid,
  usecase:      Target,
  governance:   Shield,
  roadmap:      Map,
  compliance:   Scale,
  architecture: Layers,
}

export interface TileData {
  id: string
  title: string
  subtitle: string
  locked: boolean
  done: boolean
  isNext: boolean
  href: string
}

function SortableTile({ tile }: { tile: TileData }) {
  const t = useTranslations('dashboard')
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.id })

  const style = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition: transition ?? undefined,
    zIndex: isDragging ? 10 : undefined,
  }

  const Icon = MODULE_ICONS[tile.id] ?? FileText

  const chipBg   = tile.locked ? 'bg-surface-input'  : tile.done ? 'bg-success-subtle'  : tile.isNext ? 'bg-primary'  : 'bg-primary-soft'
  const chipIcon = tile.locked ? 'text-ink-subtle'   : tile.done ? 'text-success-text'  : tile.isNext ? 'text-white'  : 'text-primary'

  const statusText  = tile.locked ? '🔒 Pro'
    : tile.done   ? t('tileDone')
    : tile.isNext ? t('tileNext')
    : t('tileStart')
  const statusColor = tile.locked ? 'text-ink-subtle' : tile.done ? 'text-success-text' : 'text-primary'

  return (
    <div ref={setNodeRef} style={style} className="group/tile">
      <div className={`relative bg-surface rounded-xl p-4 border transition-[border-color,box-shadow,opacity,transform] duration-150 ${
        isDragging
          ? 'shadow-lg scale-[1.02] border-dashed border-primary-border opacity-70'
          : tile.locked ? 'opacity-60 border-line'
          : tile.done   ? 'border-success-border hover:border-emerald-300 hover:shadow-sm'
          : 'border-line hover:border-primary-border hover:shadow-sm'
      }`}>
        {/* Drag-Handle — 36px Touch-Target, always present, brighten on hover */}
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          className="absolute top-1.5 right-1.5 w-9 h-9 z-10 flex items-center justify-center text-line hover:text-ink-subtle rounded-md touch-none cursor-grab active:cursor-grabbing opacity-40 group-hover/tile:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
          aria-label={t('tileDragAria', { title: tile.title })}
          onClick={e => e.preventDefault()}
        >
          <GripVertical size={13} />
        </button>

        {/* Navigierbarer Kachel-Inhalt — pr-8 gibt dem Handle Platz */}
        <Link
          href={tile.href}
          className="flex items-center gap-3 pr-8"
          tabIndex={isDragging ? -1 : undefined}
          draggable={false}
        >
          <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0 ${chipBg}`}>
            <Icon size={16} className={chipIcon} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-ink truncate leading-snug">{tile.title}</div>
            <div className="text-[9.5px] text-ink-subtle mt-0.5 truncate">{tile.subtitle}</div>
            <div className={`text-[9.5px] font-semibold mt-1 ${statusColor}`}>{statusText}</div>
          </div>
        </Link>
      </div>
    </div>
  )
}

interface SortableTileGridProps {
  tiles: TileData[]
}

export function SortableTileGrid({ tiles: defaultTiles }: SortableTileGridProps) {
  const t = useTranslations('dashboard')
  const [tiles, setTiles] = useState(defaultTiles)
  const trackedRef = useRef(false)

  // Gespeicherte Reihenfolge aus localStorage anwenden
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const savedOrder: string[] = JSON.parse(raw)
      const reordered = [
        ...savedOrder
          .map(id => defaultTiles.find(t => t.id === id))
          .filter(Boolean) as TileData[],
        // neue Module (nicht in localStorage) ans Ende hängen — forward-kompatibel
        ...defaultTiles.filter(t => !savedOrder.includes(t.id)),
      ]
      setTiles(reordered)
    } catch {
      // localStorage nicht verfügbar oder JSON ungültig
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return

    setTiles(prev => {
      const next = arrayMove(
        prev,
        prev.findIndex(t => t.id === active.id),
        prev.findIndex(t => t.id === over.id),
      )
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map(t => t.id)))
      } catch { /* ignore */ }
      // PostHog-Event einmal je Session
      if (!trackedRef.current) {
        trackedRef.current = true
        track('dashboard_tiles_reordered', {})
      }
      return next
    })
  }

  function handleReset() {
    setTiles(defaultTiles)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    trackedRef.current = false
  }

  const isReordered = tiles.some((t, i) => t.id !== defaultTiles[i]?.id)

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tiles.map(t => t.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-stretch">
            {tiles.map(tile => (
              <SortableTile key={tile.id} tile={tile} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isReordered && (
        <div className="mt-3 text-center">
          <button
            onClick={handleReset}
            className="text-[10px] text-ink-subtle hover:text-ink-secondary transition-colors underline underline-offset-2"
          >
            {t('tileResetOrder')}
          </button>
        </div>
      )}
    </div>
  )
}
