'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import type { ArchitectureResult } from '@/config/architecture-data'
import { ARCHETYPE_LABELS } from '@/config/roadmap-data'
import { pick } from '@/lib/utils/locale-data'
import type { Archetype } from '@/types'

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
  const t = useTranslations('modules')
  const locale = useLocale()
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
        {t('versions.panelButtonPro')}
      </a>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium border border-line rounded-xl text-ink-secondary hover:bg-surface-raised transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
      >
        {t('versions.panelButton')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/40 overflow-y-auto" role="dialog" aria-modal="true" aria-label={t('versions.dialogAriaLabel')}>
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink">{t('versions.dialogTitle')}</h2>
              <button onClick={() => { setOpen(false); setCompare(null) }} aria-label={t('versions.closeAriaLabel')} className="text-ink-subtle hover:text-ink-secondary text-xl leading-none">×</button>
            </div>

            {/* Save new version */}
            <div className="flex gap-2 mb-5">
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder={t('versions.labelPlaceholder')}
                aria-label={t('versions.labelAriaLabel')}
                className="flex-1 min-w-0 text-sm border border-line rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-ring"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary disabled:opacity-50 whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
              >
                {saving ? t('versions.saving') : t('versions.save')}
              </button>
            </div>

            {/* Version list */}
            {loading ? (
              <p className="text-sm text-ink-subtle text-center py-4">{t('versions.loading')}</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-ink-subtle text-center py-4">{t('versions.empty')}</p>
            ) : (
              <>
                <ul className="space-y-2 mb-4" role="list">
                  {versions.map(v => (
                    <li key={v.id} className="flex items-center justify-between gap-3 border border-line-subtle rounded-xl px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {t('versions.versionNo', { no: v.version_no })}{v.label ? ` — ${v.label}` : ''}
                        </p>
                        <p className="text-xs text-ink-subtle">{new Date(v.created_at).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => { setSelectingFor('a'); handleSelectForCompare(v) }}
                          className="text-xs px-2 py-1 rounded-lg border border-line text-ink-secondary hover:bg-surface-raised"
                        >
                          A
                        </button>
                        <button
                          onClick={() => { setSelectingFor('b'); handleSelectForCompare(v) }}
                          className="text-xs px-2 py-1 rounded-lg border border-line text-ink-secondary hover:bg-surface-raised"
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

type DiffRow = { label: string; a: string; b: string }

// Zählt erledigte/gesamt Meilensteine einer Phase aus den Version-Daten
// (Keys sind `${phaseId}_${index}`, Status not_started|in_progress|done).
function phaseProgress(milestones: Record<string, string> | undefined, phase: string): string {
  if (!milestones) return '—'
  const entries = Object.entries(milestones).filter(([k]) => k.startsWith(`${phase}_`))
  if (entries.length === 0) return '—'
  return `${entries.filter(([, v]) => v === 'done').length}/${entries.length}`
}

function VersionCompare({ a, b, module }: { a: Version; b: Version; module: string }) {
  const t = useTranslations('modules')
  const locale = useLocale()

  let rows: DiffRow[] | null = null

  if (module === 'architecture') {
    const aResult = (a.data as { result?: ArchitectureResult }).result
    const bResult = (b.data as { result?: ArchitectureResult }).result
    if (aResult && bResult) {
      rows = [
        { label: t('versions.compareArchPattern'), a: aResult.pattern, b: bResult.pattern },
        { label: t('versions.compareArchSummary'), a: aResult.summary, b: bResult.summary },
        ...aResult.layers.map((l, i) => ({
          label: l.name,
          a: l.components.join(', '),
          b: bResult.layers[i]?.components.join(', ') ?? '—',
        })),
      ]
    }
  } else if (module === 'roadmap') {
    // Roadmap-Version: { archetype, milestones } — Diff über Archetyp + je Phase
    // den Meilenstein-Fortschritt (UX-Review Sprint 36).
    const aData = a.data as { archetype?: string; milestones?: Record<string, string> }
    const bData = b.data as { archetype?: string; milestones?: Record<string, string> }
    const archetypeLabel = (arch?: string) =>
      arch && ARCHETYPE_LABELS[arch as Archetype] ? pick(ARCHETYPE_LABELS[arch as Archetype].label, locale) : (arch ?? '—')
    rows = [
      { label: t('versions.compareArchetype'), a: archetypeLabel(aData.archetype), b: archetypeLabel(bData.archetype) },
      ...(['phase1', 'phase2', 'phase3'] as const).map((phase, i) => ({
        label: t('versions.comparePhase', { n: i + 1 }),
        a: phaseProgress(aData.milestones, phase),
        b: phaseProgress(bData.milestones, phase),
      })),
    ]
  }

  if (!rows) {
    return <p className="text-xs text-ink-subtle text-center py-2">{t('versions.compareNotAvailable')}</p>
  }

  return (
    <div className="border border-line rounded-xl overflow-hidden" role="table" aria-label={t('versions.compareAriaLabel')}>
      <div className="grid grid-cols-3 bg-surface-raised px-3 py-2 text-xs font-semibold text-ink-muted border-b border-line">
        <span>{t('versions.compareFieldCol')}</span>
        <span>{t('versions.versionNo', { no: a.version_no })}</span>
        <span>{t('versions.versionNo', { no: b.version_no })}</span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className={`grid grid-cols-3 px-3 py-2 text-xs gap-2 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}>
          <span className="font-medium text-ink-secondary">{row.label}</span>
          <span className={`text-ink-secondary ${row.a !== row.b ? 'text-warning-text font-medium' : ''}`}>{row.a}</span>
          <span className={`text-ink-secondary ${row.a !== row.b ? 'text-warning-text font-medium' : ''}`}>{row.b}</span>
        </div>
      ))}
    </div>
  )
}
