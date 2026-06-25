'use client'
import { useState, useCallback } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { cn } from '@/lib/utils'
import type { CatalogComponent } from '@/types'
import type { CatalogRecommendations, LayerRecommendation } from '@/config/architecture-rules'

const LAYER_ORDER = ['data', 'model', 'mlops', 'serving', 'application', 'governance', 'security']
const LAYER_LABEL: Record<string, string> = {
  data: 'Daten', model: 'Modell', mlops: 'MLOps', serving: 'Serving',
  application: 'Anwendung', governance: 'Governance', security: 'Security',
}
const LAYER_COLOR: Record<string, string> = {
  data:        'bg-blue-50 border-blue-200 text-blue-800',
  model:       'bg-violet-50 border-violet-200 text-violet-800',
  mlops:       'bg-amber-50 border-amber-200 text-amber-800',
  serving:     'bg-emerald-50 border-emerald-200 text-emerald-800',
  application: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  governance:  'bg-orange-50 border-orange-200 text-orange-800',
  security:    'bg-red-50 border-red-200 text-red-800',
}
const DSGVO_BADGE: Record<string, string> = {
  compliant:     'bg-emerald-50 text-emerald-700',
  conditional:   'bg-amber-50 text-amber-700',
  non_compliant: 'bg-red-50 text-red-700',
}
const DSGVO_LABEL: Record<string, string> = {
  compliant: 'DSGVO ✓', conditional: 'DSGVO ~', non_compliant: 'DSGVO ✗',
}

// ── Custom node data types ────────────────────────────────────────────────────
type LayerNodeData = { layer: string; label: string }
type CompNodeData  = { name: string; comp: CatalogComponent | undefined; locked: boolean }
type LayerNodeType = Node<LayerNodeData, 'layerNode'>
type CompNodeType  = Node<CompNodeData,  'componentNode'>

// ── Custom nodes (defined outside component for stable reference) ─────────────
function LayerNode({ data }: NodeProps<LayerNodeType>) {
  const colorClass = LAYER_COLOR[data.layer] ?? 'bg-slate-100 border-slate-300 text-slate-700'
  return (
    <div className={cn('w-28 px-2.5 py-2 rounded-xl border-2 font-semibold text-[11px] text-center select-none', colorClass)}>
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden', width: 0, height: 0 }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden', width: 0, height: 0 }} />
    </div>
  )
}

function ComponentNode({ data, selected }: NodeProps<CompNodeType>) {
  if (data.locked) {
    return (
      <div className="w-40 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 select-none">
        <Handle type="target" position={Position.Left} style={{ visibility: 'hidden', width: 0, height: 0 }} />
        <div className="h-2.5 w-24 bg-slate-200 rounded" />
        <Handle type="source" position={Position.Right} style={{ visibility: 'hidden', width: 0, height: 0 }} />
      </div>
    )
  }
  return (
    <div className={cn(
      'w-40 px-3 py-2.5 rounded-xl border text-xs cursor-pointer transition-all select-none',
      selected
        ? 'border-blue-400 shadow-md bg-blue-50'
        : 'border-slate-200 bg-white hover:border-slate-400 hover:shadow-sm',
    )}>
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden', width: 0, height: 0 }} />
      <p className="font-medium text-slate-800 truncate leading-snug">{data.name}</p>
      {data.comp?.dsgvo_status && (
        <span className={cn('text-[10px] px-1 rounded mt-1 inline-block', DSGVO_BADGE[data.comp.dsgvo_status] ?? 'bg-slate-100 text-slate-600')}>
          {DSGVO_LABEL[data.comp.dsgvo_status] ?? data.comp.dsgvo_status}
        </span>
      )}
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden', width: 0, height: 0 }} />
    </div>
  )
}

const NODE_TYPES: NodeTypes = {
  layerNode:     LayerNode     as NodeTypes[string],
  componentNode: ComponentNode as NodeTypes[string],
}

// ── Graph builder ─────────────────────────────────────────────────────────────
const X_HEADER    = 0
const X_COMP_START = 160
const X_COMP_STEP  = 195
const Y_STEP       = 105

function buildGraph(
  recs: CatalogRecommendations,
  byName: Record<string, CatalogComponent>,
  locked: boolean,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const orderedLayers = LAYER_ORDER
    .map(lname => recs.layers.find(l => l.layer === lname))
    .filter((l): l is LayerRecommendation => l !== undefined)

  let prevHeaderId: string | null = null

  orderedLayers.forEach((lr, layerIdx) => {
    const y = layerIdx * Y_STEP
    const headerId = `layer-${lr.layer}`

    nodes.push({
      id: headerId,
      type: 'layerNode',
      position: { x: X_HEADER, y: y + 6 },
      data: { layer: lr.layer, label: LAYER_LABEL[lr.layer] ?? lr.layer },
      draggable: false,
    })

    if (prevHeaderId) {
      edges.push({
        id: `e-${prevHeaderId}-${headerId}`,
        source: prevHeaderId,
        target: headerId,
        type: 'smoothstep',
        style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
      })
    }
    prevHeaderId = headerId

    lr.componentNames.forEach((name, compIdx) => {
      const nodeId = `comp-${lr.layer}-${compIdx}`
      nodes.push({
        id: nodeId,
        type: 'componentNode',
        position: { x: X_COMP_START + compIdx * X_COMP_STEP, y },
        data: { name, comp: byName[name], locked },
      })
      if (compIdx === 0) {
        edges.push({
          id: `e-${headerId}-${nodeId}`,
          source: headerId,
          target: nodeId,
          type: 'smoothstep',
          style: { stroke: '#e2e8f0', strokeWidth: 1 },
        })
      } else {
        const prevId = `comp-${lr.layer}-${compIdx - 1}`
        edges.push({
          id: `e-${prevId}-${nodeId}`,
          source: prevId,
          target: nodeId,
          type: 'smoothstep',
          style: { stroke: '#e2e8f0', strokeWidth: 1 },
        })
      }
    })
  })

  return { nodes, edges }
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({
  name,
  comp,
  onClose,
}: {
  name: string
  comp: CatalogComponent | undefined
  onClose: () => void
}) {
  return (
    <div className="border-t border-slate-100 px-4 sm:px-5 py-3.5 bg-slate-50/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-slate-900">{name}</p>
          {comp ? (
            <div className="text-xs text-slate-600 space-y-1">
              {comp.vendor && <p><span className="font-medium text-slate-700">Vendor:</span> {comp.vendor}</p>}
              {comp.hosting.length > 0 && <p><span className="font-medium text-slate-700">Hosting:</span> {comp.hosting.join(', ')}</p>}
              {comp.dsgvo_status && (
                <p>
                  <span className="font-medium text-slate-700">DSGVO: </span>
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', DSGVO_BADGE[comp.dsgvo_status] ?? 'bg-slate-100 text-slate-600')}>
                    {DSGVO_LABEL[comp.dsgvo_status] ?? comp.dsgvo_status}
                  </span>
                </p>
              )}
              {comp.description && <p className="text-slate-500 leading-relaxed mt-1">{comp.description}</p>}
              {comp.website_url && (
                <a
                  href={comp.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-blue-600 hover:underline"
                >
                  Website ↗
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Keine Katalog-Details — Katalog-Seeding im Admin-Panel erforderlich.</p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Details schließen"
          className="text-slate-400 hover:text-slate-600 text-xl leading-none flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// ── Inner diagram (gets remounted via key when recs change) ───────────────────
export interface ArchitectureDiagramProps {
  recs: CatalogRecommendations
  components: CatalogComponent[]
  tier?: string
}

function DiagramInner({ recs, components, tier = 'free' }: ArchitectureDiagramProps) {
  const locked   = tier === 'free'
  const byName   = Object.fromEntries(components.map(c => [c.name, c]))
  const { nodes: initNodes, edges: initEdges } = buildGraph(recs, byName, locked)

  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)
  const [selected, setSelected] = useState<{ name: string; comp: CatalogComponent | undefined } | null>(null)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type !== 'componentNode' || locked) return
    const d = node.data as CompNodeData
    setSelected(prev => prev?.name === d.name ? null : { name: d.name, comp: d.comp })
  }, [locked])

  const totalComponents = recs.layers.reduce((s, l) => s + l.componentNames.length, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">Architekturdiagramm</h3>
        {locked
          ? <span className="text-xs text-slate-400">🔒 Pro-Feature</span>
          : <span className="text-xs text-slate-400">{totalComponents} Komponenten · {recs.layers.length} Layer</span>
        }
      </div>

      {/* Flow canvas */}
      <div className="relative" style={{ height: 460 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.25}
          maxZoom={2}
          deleteKeyCode={null}
        >
          <Controls showInteractive={false} />
          <Background color="#f1f5f9" gap={24} size={1} />
        </ReactFlow>

        {locked && (
          <div className="absolute inset-0 backdrop-blur-[3px] bg-white/55 flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-semibold text-slate-700 text-center">Vollständiges Architekturdiagramm</p>
            <p className="text-xs text-slate-500 text-center max-w-52">
              {totalComponents} Komponenten in {recs.layers.length} Layers — verfügbar ab Pro
            </p>
            <a
              href="/upgrade"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors"
            >
              Jetzt upgraden →
            </a>
          </div>
        )}
      </div>

      {/* Node detail panel */}
      {selected && (
        <DetailPanel
          name={selected.name}
          comp={selected.comp}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

export function ArchitectureDiagram(props: ArchitectureDiagramProps) {
  const key = props.recs.layers.map(l => l.layer + l.componentNames.length).join('-')
  return <DiagramInner key={key} {...props} />
}
