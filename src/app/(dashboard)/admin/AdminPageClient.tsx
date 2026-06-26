'use client'
import { useState } from 'react'
import type { ContentLibraryEntry, UserProfile, Tier, CatalogComponent, CatalogSource } from '@/types'
import { cn } from '@/lib/utils'
import { SOURCE_TYPE_SCHEMAS, KNOWN_SOURCE_TYPES } from '@/config/catalog-source-schemas'

const MODULES = ['assessment', 'usecase', 'governance', 'roadmap', 'canvas', 'compliance', 'architecture']
const TIERS: Tier[] = ['free', 'pro', 'enterprise']
const KNOWN_FLAGS = ['early_access', 'pdf_export', 'sharing', 'api_access']
const ARCH_LAYERS = ['data', 'model', 'serving', 'mlops', 'application', 'governance', 'security']
const CLOUD_PROVIDERS = ['aws', 'azure', 'gcp', 'sap', 'independent']

interface Props {
  initialEntries: ContentLibraryEntry[]
  initialUsers?: UserProfile[]
  initialComponents?: CatalogComponent[]
  componentCount?: number
  initialSources?: CatalogSource[]
}

type Tab = 'content' | 'users' | 'catalog'

type FormState = {
  module: string
  category: string
  title: string
  content: string
  source: string
  tags: string
}

const EMPTY_FORM: FormState = { module: '', category: '', title: '', content: '', source: '', tags: '' }

export function AdminPageClient({ initialEntries, initialUsers = [], initialComponents = [], componentCount = 0, initialSources = [] }: Props) {
  const [tab, setTab] = useState<Tab>('content')

  // ── Content Library state ───────────────────────────────────────────────────
  const [entries, setEntries] = useState<ContentLibraryEntry[]>(initialEntries)
  const [editing, setEditing] = useState<ContentLibraryEntry | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterModule, setFilterModule] = useState<string>('all')

  // ── User management state ───────────────────────────────────────────────────
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  const [userSearch, setUserSearch] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  // ── Catalog state ───────────────────────────────────────────────────────────
  const [components, setComponents] = useState<CatalogComponent[]>(initialComponents)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogLayer, setCatalogLayer] = useState('all')
  const [catalogCloud, setCatalogCloud] = useState('all')
  const [seeding, setSeeding] = useState(false)
  const [seedResult, setSeedResult] = useState<string | null>(null)

  // ── Catalog sources state ───────────────────────────────────────────────────
  const [sources, setSources] = useState<CatalogSource[]>(initialSources)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncMessages, setSyncMessages] = useState<Record<string, string>>({})
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)
  const [editingSourceUrl, setEditingSourceUrl] = useState('')
  const [editingSourceConfig, setEditingSourceConfig] = useState<Record<string, string>>({})
  const [savingSourceUrl, setSavingSourceUrl] = useState(false)
  const [showAddSource, setShowAddSource] = useState(false)
  const [newSourceForm, setNewSourceForm] = useState({ name: '', type: 'huggingface', url: '', config: {} as Record<string, string> })
  const [addingSource, setAddingSource] = useState(false)
  const [addSourceError, setAddSourceError] = useState<string | null>(null)

  // ── Content Library handlers ────────────────────────────────────────────────
  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  function openEdit(entry: ContentLibraryEntry) {
    setEditing(entry)
    setForm({
      module: entry.module,
      category: entry.category,
      title: entry.title,
      content: entry.content,
      source: entry.source ?? '',
      tags: entry.tags.join(', '),
    })
    setError(null)
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const payload = {
      module: form.module.trim(),
      category: form.category.trim(),
      title: form.title.trim(),
      content: form.content.trim(),
      source: form.source.trim() || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    try {
      if (editing) {
        const res = await fetch(`/api/admin/content/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler beim Speichern')
        const { data } = await res.json()
        setEntries(prev => prev.map(e => e.id === editing.id ? data : e))
      } else {
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler beim Erstellen')
        const { data } = await res.json()
        setEntries(prev => [data, ...prev])
      }
      cancel()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(entry: ContentLibraryEntry) {
    if (!confirm(`"${entry.title}" wirklich löschen?`)) return
    try {
      const res = await fetch(`/api/admin/content/${entry.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Fehler beim Löschen')
      setEntries(prev => prev.filter(e => e.id !== entry.id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unbekannter Fehler')
    }
  }

  // ── User management handlers ────────────────────────────────────────────────
  async function patchUser(id: string, patch: Partial<Pick<UserProfile, 'tier' | 'is_banned' | 'feature_flags'>>) {
    setUpdatingUserId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const { data } = await res.json()
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setUpdatingUserId(null)
    }
  }

  function toggleFlag(user: UserProfile, flag: string) {
    const current = user.feature_flags ?? {}
    patchUser(user.id, { feature_flags: { ...current, [flag]: !current[flag] } })
  }

  // ── Source add/delete handlers ──────────────────────────────────────────────
  function openAddSource() {
    const schema = SOURCE_TYPE_SCHEMAS['huggingface']
    setNewSourceForm({ name: '', type: 'huggingface', url: schema?.defaultUrl ?? '', config: {} })
    setAddSourceError(null)
    setShowAddSource(true)
  }

  function changeNewSourceType(type: string) {
    const schema = SOURCE_TYPE_SCHEMAS[type]
    setNewSourceForm(f => ({ ...f, type, url: schema?.defaultUrl ?? '', config: {} }))
  }

  async function handleAddSource() {
    if (!newSourceForm.name.trim()) { setAddSourceError('Name ist erforderlich.'); return }
    setAddingSource(true)
    setAddSourceError(null)
    try {
      const res = await fetch('/api/admin/catalog/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSourceForm.name.trim(),
          type: newSourceForm.type,
          url: newSourceForm.url.trim() || null,
          config: newSourceForm.config,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fehler beim Erstellen')
      setSources(prev => [...prev, json.data])
      setShowAddSource(false)
      setNewSourceForm({ name: '', type: 'huggingface', url: '', config: {} })
    } catch (e) {
      setAddSourceError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setAddingSource(false)
    }
  }

  async function handleDeleteSource(sourceId: string, sourceName: string) {
    if (!confirm(`Quelle "${sourceName}" wirklich löschen?`)) return
    try {
      const res = await fetch(`/api/admin/catalog/sources?id=${sourceId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      setSources(prev => prev.filter(s => s.id !== sourceId))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unbekannter Fehler')
    }
  }

  // ── Catalog handlers ────────────────────────────────────────────────────────
  async function handleSeed() {
    if (!confirm('Alle Seed-Daten (Komponenten + Rollen) in die DB schreiben? Bestehende Einträge werden aktualisiert.')) return
    setSeeding(true)
    setSeedResult(null)
    try {
      const res = await fetch('/api/admin/catalog/seed', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fehler beim Seeden')
      setSeedResult(`✓ ${json.data.components_upserted} Komponenten, ${json.data.roles_upserted} Rollen eingetragen.`)
      // Refresh component list
      const listRes = await fetch('/api/catalog/components')
      if (listRes.ok) {
        const { data } = await listRes.json()
        setComponents(data ?? [])
      }
    } catch (e) {
      setSeedResult(`✗ ${e instanceof Error ? e.message : 'Unbekannter Fehler'}`)
    } finally {
      setSeeding(false)
    }
  }

  function startEditUrl(src: CatalogSource) {
    setEditingSourceId(src.id)
    setEditingSourceUrl(src.url ?? '')
    setEditingSourceConfig({ ...(src.config ?? {}) })
  }

  function cancelEditUrl() {
    setEditingSourceId(null)
    setEditingSourceUrl('')
    setEditingSourceConfig({})
  }

  async function handleSaveUrl(sourceId: string) {
    setSavingSourceUrl(true)
    try {
      const res = await fetch(`/api/admin/catalog/sources/${sourceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: editingSourceUrl.trim() || null,
          config: editingSourceConfig,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Fehler')
      const { data } = await res.json()
      setSources(prev => prev.map(s => s.id === sourceId ? { ...s, url: data.url, config: data.config ?? {} } : s))
      cancelEditUrl()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setSavingSourceUrl(false)
    }
  }

  async function handleSync(sourceId: string) {
    setSyncingId(sourceId)
    setSyncMessages(prev => ({ ...prev, [sourceId]: '' }))
    try {
      const res = await fetch('/api/admin/catalog/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      })
      const json = await res.json()
      const d = json.data
      if (!res.ok) throw new Error(json.error ?? 'Fehler beim Sync')
      const newStatus: CatalogSource['sync_status'] = d.skipped_source ? 'skipped' : d.error ? 'error' : 'success'
      const msg = d.skipped_source
        ? `— Quelle übersprungen (kein API-Key konfiguriert)`
        : d.error
          ? `⚠ ${d.error}`
          : `✓ ${d.added} eingetragen${d.skipped ? `, ${d.skipped} übersprungen` : ''}`
      setSyncMessages(prev => ({ ...prev, [sourceId]: msg }))
      setSources(prev => prev.map(s =>
        s.id === sourceId
          ? { ...s, sync_status: newStatus, last_synced_at: new Date().toISOString(), last_sync_added: d.added ?? 0, last_sync_error: d.error ?? null }
          : s
      ))
      // Refresh component list after successful sync
      if (!d.error && d.added > 0) {
        const listRes = await fetch('/api/catalog/components')
        if (listRes.ok) {
          const { data } = await listRes.json()
          setComponents(data ?? [])
        }
      }
    } catch (e) {
      const msg = `✗ ${e instanceof Error ? e.message : 'Unbekannter Fehler'}`
      setSyncMessages(prev => ({ ...prev, [sourceId]: msg }))
    } finally {
      setSyncingId(null)
    }
  }

  const filteredCatalog = components.filter(c => {
    const q = catalogSearch.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.vendor ?? '').toLowerCase().includes(q)
    const matchLayer = catalogLayer === 'all' || c.architecture_layer === catalogLayer
    const matchCloud = catalogCloud === 'all' || c.cloud_provider === catalogCloud
    return matchSearch && matchLayer && matchCloud
  })

  const filtered = filterModule === 'all' ? entries : entries.filter(e => e.module === filterModule)
  const filteredUsers = userSearch.trim()
    ? users.filter(u =>
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.full_name ?? '').toLowerCase().includes(userSearch.toLowerCase())
      )
    : users

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Admin-Panel</h1>
        <p className="text-sm text-slate-500 mt-0.5">Interne Verwaltung</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200" role="tablist">
        {([
          ['content', 'Content Library', entries.length],
          ['users', 'Nutzer-Verwaltung', users.length],
          ['catalog', 'Komponenten-Katalog', componentCount],
        ] as [Tab, string, number][]).map(([id, label, count]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              tab === id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {label}
            <span className="ml-1.5 text-xs text-slate-400">({count})</span>
          </button>
        ))}
      </div>

      {/* ─── Content Library tab ─────────────────────────────────────────────── */}
      {tab === 'content' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-500">{entries.length} Einträge</p>
            <button
              onClick={openCreate}
              className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + Neuer Eintrag
            </button>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Modul-Filter">
            {['all', ...MODULES].map(m => (
              <button
                key={m}
                onClick={() => setFilterModule(m)}
                aria-pressed={filterModule === m}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filterModule === m
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {m === 'all' ? 'Alle' : m}
              </button>
            ))}
          </div>

          {/* Form */}
          {showForm && (
            <div role="dialog" aria-modal="true" aria-label={editing ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                {editing ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h2>
              {error && (
                <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-module" className="block text-xs font-medium text-slate-700 mb-1">Modul</label>
                  <select id="admin-module" value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— wählen —</option>
                    {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-category" className="block text-xs font-medium text-slate-700 mb-1">Kategorie</label>
                  <input id="admin-category" type="text" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="z. B. gesetz, beispiel, quelle"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label htmlFor="admin-title" className="block text-xs font-medium text-slate-700 mb-1">Titel</label>
                <input id="admin-title" type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="admin-content" className="block text-xs font-medium text-slate-700 mb-1">Inhalt</label>
                <textarea id="admin-content" value={form.content} rows={5}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-source" className="block text-xs font-medium text-slate-700 mb-1">Quelle (optional)</label>
                  <input id="admin-source" type="text" value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    placeholder="z. B. EU AI Act Art. 6"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="admin-tags" className="block text-xs font-medium text-slate-700 mb-1">Tags (kommagetrennt)</label>
                  <input id="admin-tags" type="text" value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="tag1, tag2"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                  {saving ? 'Speichert…' : 'Speichern'}
                </button>
                <button onClick={cancel} disabled={saving}
                  className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Noch keine Einträge {filterModule !== 'all' ? `für "${filterModule}"` : ''}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm" aria-label="Content Library Einträge">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Modul</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Kategorie</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs min-w-0">Titel</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs hidden sm:table-cell">Tags</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 text-xs"><span className="sr-only">Aktionen</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{entry.module}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{entry.category}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 min-w-0">
                        <div className="truncate max-w-xs">{entry.title}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {entry.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(entry)}
                          aria-label={`${entry.title} bearbeiten`}
                          className="text-xs text-blue-600 hover:text-blue-500 font-medium mr-3">
                          Bearbeiten
                        </button>
                        <button onClick={() => handleDelete(entry)}
                          aria-label={`${entry.title} löschen`}
                          className="text-xs text-red-600 hover:text-red-500 font-medium">
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Catalog tab ─────────────────────────────────────────────────────── */}
      {tab === 'catalog' && (
        <div className="space-y-5">

          {/* Katalog-Quellen */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">Katalog-Quellen ({sources.length})</h3>
              <button
                onClick={openAddSource}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                + Neue Quelle
              </button>
            </div>

            {/* "Neue Quelle" Formular */}
            {showAddSource && (
              <div className="px-4 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700">Neue Datenquelle hinzufügen</h4>
                {addSourceError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{addSourceError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Name (eindeutig)</label>
                    <input
                      type="text"
                      value={newSourceForm.name}
                      onChange={e => setNewSourceForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="z. B. Meine OpenAI Integration"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Typ</label>
                    <select
                      value={newSourceForm.type}
                      onChange={e => changeNewSourceType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {KNOWN_SOURCE_TYPES.map(t => (
                        <option key={t} value={t}>
                          {SOURCE_TYPE_SCHEMAS[t]?.label ?? t} ({SOURCE_TYPE_SCHEMAS[t]?.technology ?? '?'})
                        </option>
                      ))}
                    </select>
                    {SOURCE_TYPE_SCHEMAS[newSourceForm.type]?.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{SOURCE_TYPE_SCHEMAS[newSourceForm.type].description}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Endpunkt-URL</label>
                  <input
                    type="url"
                    value={newSourceForm.url}
                    onChange={e => setNewSourceForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="https://…"
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                {(SOURCE_TYPE_SCHEMAS[newSourceForm.type]?.fields ?? []).map(field => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      {field.helpUrl && (
                        <a href={field.helpUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">↗</a>
                      )}
                    </label>
                    <input
                      type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                      value={newSourceForm.config[field.key] ?? ''}
                      onChange={e => setNewSourceForm(f => ({ ...f, config: { ...f.config, [field.key]: e.target.value } }))}
                      placeholder={field.placeholder}
                      autoComplete="off"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    {field.helpText && <p className="text-[10px] text-slate-400 mt-0.5">{field.helpText}</p>}
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddSource}
                    disabled={addingSource}
                    className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {addingSource ? 'Speichert…' : 'Quelle hinzufügen'}
                  </button>
                  <button
                    onClick={() => { setShowAddSource(false); setAddSourceError(null) }}
                    className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {sources.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Noch keine Quellen — Neue Quelle hinzufügen.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sources.map(src => {
                  const schema = SOURCE_TYPE_SCHEMAS[src.type]
                  const isSyncing = syncingId === src.id
                  const msg = syncMessages[src.id]
                  const lastSync = src.last_synced_at
                    ? new Date(src.last_synced_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Noch nie'
                  const requiredFields = (schema?.fields ?? []).filter(f => f.required)
                  const missingRequired = requiredFields.filter(f => !src.config?.[f.key])
                  return (
                    <li key={src.id} className="px-4 py-3 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-slate-800 min-w-0 truncate">{src.name}</span>
                            {schema && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium whitespace-nowrap">{schema.technology}</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{src.type}</span>
                            {src.sync_status === 'success'  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">✓ OK</span>}
                            {src.sync_status === 'error'    && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">✗ Fehler</span>}
                            {src.sync_status === 'skipped'  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">⚠ Key fehlt</span>}
                          </div>
                          {schema?.description && (
                            <p className="text-[10px] text-slate-400">{schema.description}</p>
                          )}
                          <p className="text-xs text-slate-400">
                            Letzter Sync: {lastSync}
                            {src.last_sync_added != null && src.last_sync_added > 0 && ` · ${src.last_sync_added} eingetragen`}
                          </p>
                          {src.last_sync_error && src.sync_status === 'error' && (
                            <p className="text-xs text-red-600 truncate max-w-sm">{src.last_sync_error}</p>
                          )}
                          {msg && (
                            <p className={cn(
                              'text-xs font-medium',
                              msg.startsWith('✓') ? 'text-emerald-700'
                              : msg.startsWith('⚠') ? 'text-amber-700'
                              : msg.startsWith('—') ? 'text-slate-500'
                              : 'text-red-700'
                            )}>
                              {msg}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleSync(src.id)}
                            disabled={isSyncing || syncingId !== null || missingRequired.length > 0}
                            title={missingRequired.length > 0 ? `Konfigurieren: ${missingRequired.map(f => f.label).join(', ')}` : undefined}
                            className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg transition-colors"
                          >
                            {isSyncing ? 'Synct…' : '↻ Sync'}
                          </button>
                          <button
                            onClick={() => handleDeleteSource(src.id, src.name)}
                            className="whitespace-nowrap px-2 py-1.5 text-xs font-medium border border-slate-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Quelle löschen"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* URL + Konfiguration */}
                      {editingSourceId === src.id ? (
                        <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                          <div>
                            <label className="block text-[10px] font-medium text-slate-500 mb-1">Endpunkt-URL</label>
                            <input
                              type="url"
                              value={editingSourceUrl}
                              onChange={e => setEditingSourceUrl(e.target.value)}
                              placeholder="https://…"
                              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                          {/* Schema-gesteuerte Config-Felder */}
                          {(schema?.fields ?? []).map(field => (
                            <div key={field.key}>
                              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                {field.helpUrl && (
                                  <a href={field.helpUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline">↗</a>
                                )}
                              </label>
                              <input
                                type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                                value={editingSourceConfig[field.key] ?? ''}
                                onChange={e => setEditingSourceConfig(c => ({ ...c, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                autoComplete="off"
                                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                              {field.helpText && <p className="text-[10px] text-slate-400 mt-0.5">{field.helpText}</p>}
                            </div>
                          ))}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleSaveUrl(src.id)}
                              disabled={savingSourceUrl}
                              className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                            >
                              {savingSourceUrl ? 'Speichert…' : 'Speichern'}
                            </button>
                            <button
                              onClick={cancelEditUrl}
                              className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-mono text-slate-400 truncate block">
                              {src.url || <em className="not-italic text-amber-600">Keine URL konfiguriert</em>}
                            </span>
                            {/* Config-Status für alle Quellen mit pflichtigen Feldern */}
                            {(schema?.fields ?? []).length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-0.5">
                                {(schema?.fields ?? []).map(f => (
                                  <span key={f.key} className={cn(
                                    'text-[10px]',
                                    src.config?.[f.key] ? 'text-emerald-600' : f.required ? 'text-amber-600 font-medium' : 'text-slate-400'
                                  )}>
                                    {f.required ? '●' : '○'} {f.label}: {src.config?.[f.key] ? '✓' : f.required ? 'fehlt' : 'nicht gesetzt'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => startEditUrl(src)}
                            className="whitespace-nowrap text-xs text-blue-600 hover:text-blue-500 font-medium flex-shrink-0"
                          >
                            ✎ Konfigurieren
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Actions row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-slate-500">
              {filteredCatalog.length} von {components.length} Komponenten
              {components.length === 0 && componentCount > 0 && ` (${componentCount} in DB — Seite neu laden)`}
            </p>
            <div className="flex items-center gap-3">
              {seedResult && (
                <span className={cn(
                  'text-xs font-medium',
                  seedResult.startsWith('✓') ? 'text-emerald-700' : 'text-red-700'
                )}>{seedResult}</span>
              )}
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="whitespace-nowrap px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {seeding ? 'Lädt…' : '↑ Seed-Daten einspielen'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Name oder Vendor suchen…"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
            <select
              value={catalogLayer}
              onChange={e => setCatalogLayer(e.target.value)}
              aria-label="Nach Layer filtern"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Layer</option>
              {ARCH_LAYERS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={catalogCloud}
              onChange={e => setCatalogCloud(e.target.value)}
              aria-label="Nach Cloud-Provider filtern"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Provider</option>
              {CLOUD_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Table */}
          {filteredCatalog.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              {components.length === 0
                ? 'Noch keine Komponenten in der DB — Seed-Daten einspielen, um zu starten.'
                : 'Keine Komponenten für diese Filter.'}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Komponenten-Katalog">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs hidden sm:table-cell">Vendor</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs hidden md:table-cell">Layer</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs hidden md:table-cell">Cloud</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs hidden lg:table-cell">DSGVO</th>
                      <th className="text-center px-4 py-3 font-medium text-slate-600 text-xs hidden lg:table-cell">SAP</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs hidden xl:table-cell">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCatalog.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 min-w-0">
                          <div className="font-medium text-slate-900 truncate max-w-[180px]">{c.name}</div>
                          {c.description && (
                            <div className="text-xs text-slate-400 truncate max-w-[180px]">{c.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap hidden sm:table-cell">{c.vendor ?? '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{c.architecture_layer ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap hidden md:table-cell">{c.cloud_provider ?? '—'}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            c.dsgvo_status === 'compliant'     ? 'bg-emerald-50 text-emerald-700' :
                            c.dsgvo_status === 'conditional'   ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          )}>
                            {c.dsgvo_status ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          {c.sap_compatible ? '✓' : '—'}
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <div className="flex gap-1 flex-wrap max-w-[200px]">
                            {c.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{tag}</span>
                            ))}
                            {c.tags.length > 3 && (
                              <span className="text-xs text-slate-400">+{c.tags.length - 3}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── User management tab ─────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-5">
          {/* Search */}
          <div className="max-w-sm">
            <label htmlFor="user-search" className="sr-only">Nutzer suchen</label>
            <input
              id="user-search"
              type="search"
              placeholder="E-Mail oder Name suchen…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">Keine Nutzer gefunden</div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(u => {
                const isExpanded = expandedUserId === u.id
                const isUpdating = updatingUserId === u.id
                const flags = u.feature_flags ?? {}
                return (
                  <div key={u.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {/* Row */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      {/* Identity */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{u.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>

                      {/* Tier selector */}
                      <div className="flex-shrink-0">
                        <label htmlFor={`tier-${u.id}`} className="sr-only">Tier für {u.email}</label>
                        <select
                          id={`tier-${u.id}`}
                          value={u.tier}
                          disabled={isUpdating}
                          onChange={e => patchUser(u.id, { tier: e.target.value as Tier })}
                          className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      {/* Ban toggle */}
                      <button
                        onClick={() => patchUser(u.id, { is_banned: !u.is_banned })}
                        disabled={isUpdating || u.is_admin}
                        aria-label={u.is_banned ? `${u.email} entsperren` : `${u.email} sperren`}
                        className={cn(
                          'px-3 py-1 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap disabled:opacity-40',
                          u.is_banned
                            ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {u.is_banned ? 'Gesperrt — entsperren' : 'Sperren'}
                      </button>

                      {/* Expand features */}
                      <button
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`flags-${u.id}`}
                        className="px-3 py-1 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap"
                      >
                        Features {isExpanded ? '▲' : '▼'}
                      </button>

                      {u.is_admin && (
                        <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 whitespace-nowrap">
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Feature flags + subscription panel */}
                    {isExpanded && (
                      <div id={`flags-${u.id}`} className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
                        {/* Subscription info */}
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1.5">Abo & Zahlung</p>
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <p>
                              <span className="text-slate-400">Status:</span>{' '}
                              <span className={cn('font-medium', {
                                'text-emerald-700': u.subscription_status === 'active',
                                'text-amber-700': u.subscription_status === 'past_due' || u.subscription_status === 'trialing',
                                'text-red-700': u.subscription_status === 'canceled' || u.subscription_status === 'unpaid',
                                'text-slate-500': !u.subscription_status,
                              })}>
                                {u.subscription_status ?? 'Kein Abo'}
                              </span>
                            </p>
                            {u.subscription_period_end && (
                              <p>
                                <span className="text-slate-400">Läuft bis:</span>{' '}
                                {new Date(u.subscription_period_end).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </p>
                            )}
                            {u.stripe_customer_id && (
                              <p className="font-mono text-[10px] text-slate-400 truncate">
                                Stripe: {u.stripe_customer_id}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Feature flags */}
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1.5">Feature-Flags</p>
                          <div className="flex flex-wrap gap-2">
                            {KNOWN_FLAGS.map(flag => {
                              const active = !!flags[flag]
                              return (
                                <button
                                  key={flag}
                                  onClick={() => toggleFlag(u, flag)}
                                  disabled={isUpdating}
                                  aria-pressed={active}
                                  className={cn(
                                    'px-3 py-1 text-xs font-medium rounded-full border transition-colors disabled:opacity-50',
                                    active
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  )}
                                >
                                  {flag}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400">
                          Registriert: {new Date(u.created_at).toLocaleDateString('de-DE')}
                          {u.company && ` · ${u.company}`}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
