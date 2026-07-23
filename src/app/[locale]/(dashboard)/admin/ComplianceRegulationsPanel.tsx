'use client'
import { useState, useEffect, useCallback } from 'react'
import { AlertBox } from '@/components/shared/AlertBox'

// Admin-CRUD-UI für Compliance-Regularien (#245). Bearbeitet DE+EN gemeinsam;
// die API (/api/admin/compliance/regulations) kapselt das Locale-per-row-Modell.

interface RegLocale { short_label: string; label: string; description: string | null; applicability: string | null }
interface ItemLocale { label: string; description: string | null; relevance: string | null }
interface Item {
  item_key: string; article: string | null; source_url: string | null; last_verified: string | null
  risk_class: string | null; category: string | null; display_order: number; is_published: boolean
  de: ItemLocale | null; en: ItemLocale | null
}
interface Regulation {
  slug: string; category: string; display_order: number; is_published: boolean
  trigger_keywords: string[]
  de: RegLocale | null; en: RegLocale | null; itemCount: number; items: Item[]
}

const CATEGORIES = ['gesetz', 'standard', 'aufsichtsrecht'] as const
const RISK_CLASSES = ['', 'prohibited', 'high', 'limited', 'minimal'] as const

const emptyRegForm = () => ({
  slug: '', category: 'gesetz' as string, display_order: 0, is_published: true,
  trigger_keywords: '',
  de: { short_label: '', label: '', description: '', applicability: '' },
  en: { short_label: '', label: '', description: '', applicability: '' },
})
const emptyItemForm = (regulation_slug: string) => ({
  regulation_slug, item_key: '', article: '', source_url: '', last_verified: '', risk_class: '', category: '',
  display_order: 0, is_published: true,
  de: { label: '', description: '', relevance: '' },
  en: { label: '', description: '', relevance: '' },
})

const inputCls = 'w-full border border-line-strong rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring'
const labelCls = 'block text-[11px] font-medium text-ink-secondary mb-0.5'

export function ComplianceRegulationsPanel() {
  const [regs, setRegs] = useState<Regulation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [regForm, setRegForm] = useState<ReturnType<typeof emptyRegForm> | null>(null)
  const [regFormMode, setRegFormMode] = useState<'new' | 'edit'>('new')
  const [itemForm, setItemForm] = useState<ReturnType<typeof emptyItemForm> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/compliance/regulations')
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const { regulations } = await res.json()
      setRegs(regulations ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Fehler') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  async function post(body: unknown) {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/compliance/regulations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Speichern fehlgeschlagen') }
      await load()
      return true
    } catch (e) { setError(e instanceof Error ? e.message : 'Fehler'); return false }
    finally { setSaving(false) }
  }
  async function del(slug: string, itemKey?: string) {
    if (!confirm(itemKey ? `Punkt "${itemKey}" löschen?` : `Regularie "${slug}" inkl. aller Punkte löschen?`)) return
    setSaving(true); setError(null)
    try {
      const q = itemKey ? `?slug=${encodeURIComponent(slug)}&item_key=${encodeURIComponent(itemKey)}` : `?slug=${encodeURIComponent(slug)}`
      const res = await fetch(`/api/admin/compliance/regulations${q}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Fehler') }
    finally { setSaving(false) }
  }

  function openEditReg(reg: Regulation) {
    setRegFormMode('edit')
    setRegForm({
      slug: reg.slug, category: reg.category, display_order: reg.display_order, is_published: reg.is_published,
      trigger_keywords: (reg.trigger_keywords ?? []).join(', '),
      de: { short_label: reg.de?.short_label ?? '', label: reg.de?.label ?? '', description: reg.de?.description ?? '', applicability: reg.de?.applicability ?? '' },
      en: { short_label: reg.en?.short_label ?? '', label: reg.en?.label ?? '', description: reg.en?.description ?? '', applicability: reg.en?.applicability ?? '' },
    })
  }
  function openEditItem(slug: string, item: Item) {
    setItemForm({
      regulation_slug: slug, item_key: item.item_key, article: item.article ?? '', source_url: item.source_url ?? '',
      last_verified: item.last_verified ?? '', risk_class: item.risk_class ?? '', category: item.category ?? '',
      display_order: item.display_order, is_published: item.is_published,
      de: { label: item.de?.label ?? '', description: item.de?.description ?? '', relevance: item.de?.relevance ?? '' },
      en: { label: item.en?.label ?? '', description: item.en?.description ?? '', relevance: item.en?.relevance ?? '' },
    })
  }

  async function toggleRegPublish(reg: Regulation) {
    await post({
      kind: 'regulation', slug: reg.slug, category: reg.category, display_order: reg.display_order,
      is_published: !reg.is_published, trigger_keywords: reg.trigger_keywords ?? [],
      de: reg.de ?? { short_label: reg.slug, label: reg.slug, description: null, applicability: null },
      en: reg.en ?? { short_label: reg.slug, label: reg.slug, description: null, applicability: null },
    })
  }
  async function toggleItemPublish(slug: string, item: Item) {
    await post({
      kind: 'item', regulation_slug: slug, item_key: item.item_key, article: item.article, source_url: item.source_url,
      last_verified: item.last_verified, risk_class: item.risk_class, category: item.category,
      display_order: item.display_order, is_published: !item.is_published,
      de: item.de ?? { label: item.item_key, description: null, relevance: null },
      en: item.en ?? { label: item.item_key, description: null, relevance: null },
    })
  }

  if (loading) return <p className="text-sm text-ink-subtle py-8 text-center">Lade Regularien…</p>

  return (
    <div className="space-y-4">
      {error && <AlertBox variant="error">{error}</AlertBox>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">{regs.length} Regularien · Inhalte für das Compliance-Modul (DE+EN, ohne Deploy)</p>
        <button onClick={() => { setRegFormMode('new'); setRegForm(emptyRegForm()) }} disabled={saving}
          className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50">
          + Neue Regularie
        </button>
      </div>

      {/* Regularie-Formular */}
      {regForm && (
        <div role="dialog" aria-modal="true" aria-label="Regularie bearbeiten" className="bg-surface border border-line rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label><span className={labelCls}>Slug</span>
              <input className={inputCls} value={regForm.slug} disabled={regFormMode === 'edit'}
                onChange={e => setRegForm(f => f && { ...f, slug: e.target.value })} placeholder="z. B. bdsg" /></label>
            <label><span className={labelCls}>Kategorie</span>
              <select className={inputCls} value={regForm.category} onChange={e => setRegForm(f => f && { ...f, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select></label>
            <label><span className={labelCls}>Reihenfolge</span>
              <input type="number" className={inputCls} value={regForm.display_order} onChange={e => setRegForm(f => f && { ...f, display_order: Number(e.target.value) })} /></label>
          </div>
          {(['de', 'en'] as const).map(loc => (
            <div key={loc} className="border border-line-subtle rounded-lg p-2.5">
              <p className="text-[11px] font-semibold text-ink-secondary uppercase mb-1.5">{loc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label><span className={labelCls}>Kurzlabel</span><input className={inputCls} value={regForm[loc].short_label} onChange={e => setRegForm(f => f && { ...f, [loc]: { ...f[loc], short_label: e.target.value } })} /></label>
                <label><span className={labelCls}>Label</span><input className={inputCls} value={regForm[loc].label} onChange={e => setRegForm(f => f && { ...f, [loc]: { ...f[loc], label: e.target.value } })} /></label>
                <label className="sm:col-span-2"><span className={labelCls}>Beschreibung</span><textarea rows={2} className={inputCls} value={regForm[loc].description} onChange={e => setRegForm(f => f && { ...f, [loc]: { ...f[loc], description: e.target.value } })} /></label>
                <label className="sm:col-span-2"><span className={labelCls}>Anwendbarkeit</span><textarea rows={2} className={inputCls} value={regForm[loc].applicability} onChange={e => setRegForm(f => f && { ...f, [loc]: { ...f[loc], applicability: e.target.value } })} /></label>
              </div>
            </div>
          ))}
          <label className="block"><span className={labelCls}>Trigger-Keywords (komma-getrennt)</span>
            <input className={inputCls} value={regForm.trigger_keywords}
              onChange={e => setRegForm(f => f && { ...f, trigger_keywords: e.target.value })}
              placeholder="z. B. beschäftigt, mitarbeiter, scoring, bonität" />
            <span className="text-[10px] text-ink-muted">Erkennt diese Regularie automatisch in AI Use-Case Canvas + Architektur-Generator, wenn der Text ein Keyword enthält. Leer = keine Auto-Erkennung.</span></label>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={regForm.is_published} onChange={e => setRegForm(f => f && { ...f, is_published: e.target.checked })} /> Veröffentlicht</label>
          <div className="flex gap-2">
            <button disabled={saving} onClick={async () => { if (await post({ kind: 'regulation', ...regForm, trigger_keywords: regForm.trigger_keywords.split(',').map(s => s.trim()).filter(Boolean) })) setRegForm(null) }}
              className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50">Speichern</button>
            <button disabled={saving} onClick={() => setRegForm(null)} className="px-3 py-1.5 text-xs font-medium bg-surface-raised text-ink-secondary rounded-lg hover:bg-line">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Regularie-Liste */}
      <div className="space-y-2">
        {regs.map(reg => (
          <div key={reg.slug} className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <button onClick={() => setExpanded(expanded === reg.slug ? null : reg.slug)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
                <span className="text-ink-subtle text-xs">{expanded === reg.slug ? '▾' : '▸'}</span>
                <span className="text-sm font-semibold text-ink truncate">{reg.de?.label ?? reg.slug}</span>
                <span className="text-[10px] font-mono text-ink-subtle">{reg.slug}</span>
                <span className="text-[10px] text-ink-muted uppercase">{reg.category}</span>
                <span className="text-[10px] text-ink-subtle">{reg.itemCount} Punkte</span>
                {!reg.is_published && <span className="text-[10px] font-semibold text-warning-text bg-warning-subtle border border-warning-border rounded px-1">Entwurf</span>}
              </button>
              <button onClick={() => toggleRegPublish(reg)} disabled={saving} title="Veröffentlichung umschalten" className="text-xs text-ink-secondary hover:text-primary">{reg.is_published ? '● live' : '○ entwurf'}</button>
              <button onClick={() => openEditReg(reg)} className="text-xs text-primary hover:underline">Bearbeiten</button>
              <button onClick={() => del(reg.slug)} className="text-xs text-error-text hover:underline">Löschen</button>
            </div>

            {expanded === reg.slug && (
              <div className="border-t border-line-subtle bg-surface-raised px-3 py-2.5 space-y-1.5">
                {reg.items.map(item => (
                  <div key={item.item_key} className="flex items-center gap-2 text-xs bg-surface border border-line-subtle rounded-lg px-2.5 py-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-ink">{item.de?.label ?? item.item_key}</span>
                      <span className="ml-2 text-[10px] font-mono text-ink-subtle">{item.item_key}</span>
                      {item.article && <span className="ml-2 text-[10px] text-primary">{item.article}</span>}
                      {item.risk_class && <span className="ml-2 text-[10px] text-warning-text">{item.risk_class}</span>}
                      {!item.source_url && <span className="ml-2 text-[10px] text-error-text">ohne Quelle</span>}
                      {!item.last_verified && <span className="ml-1 text-[10px] text-error-text">ohne Datum</span>}
                      {!item.is_published && <span className="ml-2 text-[10px] font-semibold text-warning-text">Entwurf</span>}
                    </div>
                    <button onClick={() => toggleItemPublish(reg.slug, item)} disabled={saving} className="text-[11px] text-ink-secondary hover:text-primary">{item.is_published ? '●' : '○'}</button>
                    <button onClick={() => openEditItem(reg.slug, item)} className="text-[11px] text-primary hover:underline">Bearb.</button>
                    <button onClick={() => del(reg.slug, item.item_key)} className="text-[11px] text-error-text hover:underline">Löschen</button>
                  </div>
                ))}
                <button onClick={() => setItemForm(emptyItemForm(reg.slug))} className="text-xs text-primary hover:underline mt-1">+ Checklistenpunkt</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Item-Formular */}
      {itemForm && (
        <div role="dialog" aria-modal="true" aria-label="Checklistenpunkt bearbeiten" className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/40 overflow-y-auto">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl p-4 space-y-3 mb-8">
            <h3 className="text-sm font-semibold text-ink">Checklistenpunkt · {itemForm.regulation_slug}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label><span className={labelCls}>Item-Key</span><input className={inputCls} value={itemForm.item_key} onChange={e => setItemForm(f => f && { ...f, item_key: e.target.value })} placeholder="z. B. bdsg_art26" /></label>
              <label><span className={labelCls}>Artikel</span><input className={inputCls} value={itemForm.article} onChange={e => setItemForm(f => f && { ...f, article: e.target.value })} placeholder="§ 26 BDSG" /></label>
              <label><span className={labelCls}>Reihenfolge</span><input type="number" className={inputCls} value={itemForm.display_order} onChange={e => setItemForm(f => f && { ...f, display_order: Number(e.target.value) })} /></label>
              <label><span className={labelCls}>Risikoklasse</span><select className={inputCls} value={itemForm.risk_class} onChange={e => setItemForm(f => f && { ...f, risk_class: e.target.value })}>{RISK_CLASSES.map(r => <option key={r} value={r}>{r || '—'}</option>)}</select></label>
              <label className="col-span-2"><span className={labelCls}>Quelle (URL)</span><input className={inputCls} value={itemForm.source_url} onChange={e => setItemForm(f => f && { ...f, source_url: e.target.value })} placeholder="https://…" /></label>
              <label><span className={labelCls}>Zuletzt geprüft</span><input className={inputCls} value={itemForm.last_verified} onChange={e => setItemForm(f => f && { ...f, last_verified: e.target.value })} placeholder="JJJJ-MM-TT" /></label>
              <label><span className={labelCls}>Kategorie</span><input className={inputCls} value={itemForm.category} onChange={e => setItemForm(f => f && { ...f, category: e.target.value })} /></label>
            </div>
            {(['de', 'en'] as const).map(loc => (
              <div key={loc} className="border border-line-subtle rounded-lg p-2.5">
                <p className="text-[11px] font-semibold text-ink-secondary uppercase mb-1.5">{loc}</p>
                <div className="grid grid-cols-1 gap-2">
                  <label><span className={labelCls}>Label</span><input className={inputCls} value={itemForm[loc].label} onChange={e => setItemForm(f => f && { ...f, [loc]: { ...f[loc], label: e.target.value } })} /></label>
                  <label><span className={labelCls}>Beschreibung</span><textarea rows={2} className={inputCls} value={itemForm[loc].description} onChange={e => setItemForm(f => f && { ...f, [loc]: { ...f[loc], description: e.target.value } })} /></label>
                  <label><span className={labelCls}>Relevanz</span><textarea rows={2} className={inputCls} value={itemForm[loc].relevance} onChange={e => setItemForm(f => f && { ...f, [loc]: { ...f[loc], relevance: e.target.value } })} /></label>
                </div>
              </div>
            ))}
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={itemForm.is_published} onChange={e => setItemForm(f => f && { ...f, is_published: e.target.checked })} /> Veröffentlicht</label>
            <div className="flex gap-2">
              <button disabled={saving} onClick={async () => { if (await post({ kind: 'item', ...itemForm })) setItemForm(null) }}
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50">Speichern</button>
              <button disabled={saving} onClick={() => setItemForm(null)} className="px-3 py-1.5 text-xs font-medium bg-surface-raised text-ink-secondary rounded-lg hover:bg-line">Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
