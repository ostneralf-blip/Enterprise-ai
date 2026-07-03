'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ArchitectureResult } from '@/config/architecture-data'

interface Version {
  id: string
  version_no: number
  label: string | null
  created_at: string
  data: Record<string, unknown>
}

interface Props {
  module: string
  entityId: string
  tier: string
  currentData: Record<string, unknown>
}

type CompareMode = null | { a: Version; b: Version }

export function VersionsPanel({ module, entityId, tier, currentData }: Props) {
  const [open, setOpen] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [label, setLabel] = useState('')
  const [compare, setCompare] = useState<CompareMode>(null)
  const [selectingFor, setSelectingFor] = useState<'a' | 'b' | null>(null)

  const isPro = tier === 'pro' || tier === 'enterprise'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/versions?module=${module}&entity_id=${entityId}`)
      if (res.ok) {
        const { data } = await res.json()
        setVersions(data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [module, entityId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) load()
  }, [open, load])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, entity_id: entityId, data: currentData, label: label.trim() || undefined }),
      })
      if (res.ok) {
        setLabel('')
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSelectForCompare = (v: Version) => {
    if (!selectingFor) return
    setCompare(prev => {
      if (selectingFor === 'a') return { a: v, b: prev?.b ?? v }
      return { a: prev?.a ?? v, b: v }
    })
    setSelectingFor(null)
  }

  if (!isPro) {
    return (
      <a
        href="/upgrade"
        className="px-4 py-2 text-sm font-medium border border-violet-200 text-violet-700 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        Versionen (Pro)
      </a>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Versionen
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/40 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Versionen verwalten">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Versionen</h2>
              <button onClick={() => { setOpen(false); setCompare(null) }} aria-label="Dialog schließen" className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            {/* Save new version */}
            <div className="flex gap-2 mb-5">
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Bezeichnung (optional)"
                aria-label="Version-Bezeichnung"
                className="flex-1 min-w-0 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {saving ? '…' : 'Speichern'}
              </button>
            </div>

            {/* Version list */}
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-4">Lädt…</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Noch keine Versionen gespeichert.</p>
            ) : (
              <>
                <ul className="space-y-2 mb-4" role="list">
                  {versions.map(v => (
                    <li key={v.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          Version #{v.version_no}{v.label ? ` — ${v.label}` : ''}
                        </p>
                        <p className="text-xs text-slate-400">{new Date(v.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => { setSelectingFor('a'); handleSelectForCompare(v) }}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          A
                        </button>
                        <button
                          onClick={() => { setSelectingFor('b'); handleSelectForCompare(v) }}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          B
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {compare && compare.a.id !== compare.b.id && (
                  <VersionCompare a={compare.a} b={compare.b} module={module} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function VersionCompare({ a, b, module }: { a: Version; b: Version; module: string }) {
  if (module === 'architecture') {
    const aResult = (a.data as { result?: ArchitectureResult }).result
    const bResult = (b.data as { result?: ArchitectureResult }).result
    if (!aResult || !bResult) return null

    const rows: Array<{ label: string; a: string; b: string }> = [
      { label: 'Muster', a: aResult.pattern, b: bResult.pattern },
      { label: 'Zusammenfassung', a: aResult.summary, b: bResult.summary },
      ...aResult.layers.map((l, i) => ({
        label: l.name,
        a: l.components.join(', '),
        b: bResult.layers[i]?.components.join(', ') ?? '—',
      })),
    ]

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden" role="table" aria-label="Versions-Vergleich">
        <div className="grid grid-cols-3 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500 border-b border-slate-200">
          <span>Feld</span>
          <span>Version #{a.version_no}</span>
          <span>Version #{b.version_no}</span>
        </div>
        {rows.map((row, i) => (
          <div key={i} className={`grid grid-cols-3 px-3 py-2 text-xs gap-2 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
            <span className="font-medium text-slate-700">{row.label}</span>
            <span className={`text-slate-600 ${row.a !== row.b ? 'text-amber-700 font-medium' : ''}`}>{row.a}</span>
            <span className={`text-slate-600 ${row.a !== row.b ? 'text-amber-700 font-medium' : ''}`}>{row.b}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <p className="text-xs text-slate-400 text-center py-2">Vergleich für dieses Modul noch nicht verfügbar.</p>
  )
}
