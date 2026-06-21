'use client'
import { useState } from 'react'
import type { ContentLibraryEntry, UserProfile, Tier } from '@/types'
import { cn } from '@/lib/utils'

const MODULES = ['assessment', 'usecase', 'governance', 'roadmap', 'canvas', 'compliance', 'architecture']
const TIERS: Tier[] = ['free', 'pro', 'enterprise']
const KNOWN_FLAGS = ['early_access', 'pdf_export', 'sharing', 'api_access']

interface Props {
  initialEntries: ContentLibraryEntry[]
  initialUsers?: UserProfile[]
}

type Tab = 'content' | 'users'

type FormState = {
  module: string
  category: string
  title: string
  content: string
  source: string
  tags: string
}

const EMPTY_FORM: FormState = { module: '', category: '', title: '', content: '', source: '', tags: '' }

export function AdminPageClient({ initialEntries, initialUsers = [] }: Props) {
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
        {([['content', 'Content Library'], ['users', 'Nutzer-Verwaltung']] as [Tab, string][]).map(([id, label]) => (
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
            {id === 'content' && <span className="ml-1.5 text-xs text-slate-400">({entries.length})</span>}
            {id === 'users' && <span className="ml-1.5 text-xs text-slate-400">({users.length})</span>}
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

                    {/* Feature flags panel */}
                    {isExpanded && (
                      <div id={`flags-${u.id}`} className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                        <p className="text-xs font-medium text-slate-500 mb-2">Feature-Flags</p>
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
                        <p className="text-xs text-slate-400 mt-2">
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
