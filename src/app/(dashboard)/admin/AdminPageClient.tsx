'use client'
import { useState } from 'react'
import type { ContentLibraryEntry, UserProfile, Tier, CatalogComponent, CatalogSource, CatalogUploadLog } from '@/types'
import { cn } from '@/lib/utils'
import { SOURCE_TYPE_SCHEMAS, KNOWN_SOURCE_TYPES } from '@/config/catalog-source-schemas'

const MODULES = ['assessment', 'usecase', 'governance', 'roadmap', 'canvas', 'compliance', 'architecture']
const TIERS: Tier[] = ['free', 'pro', 'enterprise']
const KNOWN_FLAGS = ['early_access', 'pdf_export', 'sharing', 'api_access']
const ARCH_LAYERS = ['data', 'model', 'serving', 'mlops', 'application', 'governance', 'security']
const CLOUD_PROVIDERS = ['aws', 'azure', 'gcp', 'sap', 'independent']
const PREDEFINED_TAGS = [
  'llm', 'nlp', 'generative-ai', 'predictive', 'vision', 'rag', 'vector-db',
  'fine-tuning', 'automation', 'classification', 'open-source', 'on-prem',
  'serverless', 'kubernetes', 'docker', 'api', 'gdpr-ready', 'iso27001',
  'soc2', 'eu-ai-act', 'beta', 'ga', 'enterprise-only', 'no-code', 'low-code',
  'sap', 'azure', 'aws', 'gcp', 'btp', 'hana', 'embedding', 'multimodal',
]

const KNOWN_VENDORS = [
  'SAP', 'Microsoft', 'Google', 'Amazon Web Services', 'Anthropic', 'OpenAI',
  'Meta', 'Mistral AI', 'Cohere', 'Hugging Face', 'Databricks', 'Snowflake',
  'NVIDIA', 'IBM', 'Oracle', 'Salesforce', 'LangChain', 'Weaviate', 'Pinecone',
  'MongoDB', 'Chroma', 'unabhängig / Open Source',
]

interface Props {
  initialEntries: ContentLibraryEntry[]
  initialUsers?: UserProfile[]
  initialComponents?: CatalogComponent[]
  componentCount?: number
  initialSources?: CatalogSource[]
  initialUploadLog?: CatalogUploadLog[]
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

export function AdminPageClient({ initialEntries, initialUsers = [], initialComponents = [], componentCount = 0, initialSources = [], initialUploadLog = [] }: Props) {
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
  const [seedBackup, setSeedBackup] = useState<CatalogComponent[] | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [uploadBackup, setUploadBackup] = useState<CatalogComponent[] | null>(null)
  const [uploadPreview, setUploadPreview] = useState<{
    format: string; formatLabel: string; detected_vendor: string; detected_layer: string;
    layer_confidence: 'high' | 'medium' | 'low'; row_count: number; sample_names: string[]; ambiguous: boolean;
  } | null>(null)
  const [uploadVendor, setUploadVendor] = useState('')
  const [uploadLayer, setUploadLayer] = useState('')
  const [previewing, setPreviewing] = useState(false)

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

  // ── Upload log + tag editing state ─────────────────────────────────────────
  const [uploadLog, setUploadLog] = useState<CatalogUploadLog[]>(initialUploadLog)
  const [tagEditingId, setTagEditingId] = useState<string | null>(null)
  const [tagSavingId, setTagSavingId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null)

  // ── Dependency editor state ─────────────────────────────────────────────────
  const [depEditingId, setDepEditingId] = useState<string | null>(null)
  const [depForm, setDepForm] = useState<{ incompatible_with: string; requires: string; suggests: string }>({
    incompatible_with: '', requires: '', suggests: '',
  })
  const [depSavingId, setDepSavingId] = useState<string | null>(null)

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

  // ── Tag editing handlers ────────────────────────────────────────────────────
  async function patchComponentTags(id: string, tags: string[]) {
    setTagSavingId(id)
    setComponents(prev => prev.map(c => c.id === id ? { ...c, tags } : c))
    try {
      const res = await fetch(`/api/admin/catalog/components/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      })
      if (!res.ok) {
        const { error } = await res.json() as { error?: string }
        throw new Error(error ?? 'Fehler beim Speichern')
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setTagSavingId(null)
    }
  }

  function removeTag(id: string, currentTags: string[], tag: string) {
    patchComponentTags(id, currentTags.filter(t => t !== tag))
  }

  function addTag(id: string, currentTags: string[], tag: string) {
    if (currentTags.includes(tag)) return
    patchComponentTags(id, [...currentTags, tag])
  }

  // ── Dependency editor handlers ──────────────────────────────────────────────
  async function patchComponentDependencies(id: string, patch: {
    incompatible_with?: string[]
    requires?: string[]
    suggests?: string[]
  }) {
    setDepSavingId(id)
    try {
      const res = await fetch(`/api/admin/catalog/components/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'Fehler')
      const { data } = await res.json() as { data: { incompatible_with: string[]; requires: string[]; suggests: string[] } }
      setComponents(prev => prev.map(c => c.id === id ? {
        ...c,
        incompatible_with: data.incompatible_with,
        requires: data.requires,
        suggests: data.suggests,
      } : c))
      setDepEditingId(null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setDepSavingId(null)
    }
  }

  function openDepEditor(c: CatalogComponent) {
    setDepEditingId(c.id)
    setDepForm({
      incompatible_with: c.incompatible_with.join(', '),
      requires: c.requires.join(', '),
      suggests: c.suggests.join(', '),
    })
  }

  function saveDepEditor(id: string) {
    patchComponentDependencies(id, {
      incompatible_with: depForm.incompatible_with.split(',').map(s => s.trim()).filter(Boolean),
      requires:          depForm.requires.split(',').map(s => s.trim()).filter(Boolean),
      suggests:          depForm.suggests.split(',').map(s => s.trim()).filter(Boolean),
    })
  }

  // ── Catalog restore handler ─────────────────────────────────────────────────
  async function handleRestore(logId: string, filename: string) {
    if (!confirm(`Katalog auf Stand von "${filename}" zurücksetzen? Bestehende Einträge werden überschrieben.`)) return
    setRestoringId(logId)
    setRestoreMsg(null)
    try {
      const res = await fetch('/api/admin/catalog/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fehler beim Wiederherstellen')
      setRestoreMsg(`✓ ${json.restored} Komponenten wiederhergestellt`)
      const listRes = await fetch('/api/catalog/components')
      if (listRes.ok) { const { data } = await listRes.json(); setComponents(data ?? []) }
    } catch (e) {
      setRestoreMsg(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setRestoringId(null)
    }
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

  // ── Catalog helpers ─────────────────────────────────────────────────────────
  function downloadBackupJson(data: CatalogComponent[], prefix: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prefix}-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ── Catalog handlers ────────────────────────────────────────────────────────
  async function handleSeed() {
    if (!confirm('Alle Seed-Daten (Komponenten + Rollen) in die DB schreiben? Bestehende Einträge werden aktualisiert.')) return
    setSeeding(true)
    setSeedResult(null)
    setSeedBackup(null)
    try {
      const res = await fetch('/api/admin/catalog/seed', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fehler beim Seeden')
      const d = json.data
      if (d.backup_data?.length) setSeedBackup(d.backup_data)
      const backupHint = d.backup_count > 0 ? ` · ${d.backup_count} Einträge gesichert` : ''
      setSeedResult(`✓ ${d.components_upserted} Komponenten, ${d.roles_upserted} Rollen eingetragen.${backupHint}`)
      const [listRes, logRes] = await Promise.all([
        fetch('/api/catalog/components'),
        fetch('/api/admin/catalog/log'),
      ])
      if (listRes.ok) { const { data } = await listRes.json(); setComponents(data ?? []) }
      if (logRes.ok) { const { data } = await logRes.json(); setUploadLog(data ?? []) }
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

  async function handlePreview(file: File) {
    setPreviewing(true)
    setUploadPreview(null)
    setUploadVendor('')
    setUploadLayer('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/catalog/upload?mode=preview', { method: 'POST', body: fd })
      if (!res.ok) return
      const { detection } = await res.json()
      setUploadPreview(detection)
      setUploadVendor(detection.detected_vendor ?? '')
      setUploadLayer(detection.detected_layer ?? '')
    } catch {
      // preview failure ist nicht kritisch
    } finally {
      setPreviewing(false)
    }
  }

  async function handleUpload() {
    if (!uploadFile) return
    setUploading(true)
    setUploadResult(null)
    setUploadBackup(null)
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      if (uploadVendor) fd.append('vendor_override', uploadVendor)
      if (uploadLayer) fd.append('layer_override', uploadLayer)
      const res = await fetch('/api/admin/catalog/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload fehlgeschlagen')
      const { upserted, skipped_errors, duplicate_rows, format, backup_data, backup_count } = json.data
      if (backup_data?.length) setUploadBackup(backup_data)
      const dupHint = duplicate_rows > 0 ? `, ${duplicate_rows} Duplikate bereinigt` : ''
      const backupHint = backup_count > 0 ? ` · ${backup_count} Einträge gesichert` : ''
      setUploadResult(`✓ ${upserted} Komponenten importiert (${format})${skipped_errors > 0 ? `, ${skipped_errors} Zeilen übersprungen` : ''}${dupHint}${backupHint}`)
      setUploadFile(null)
      setUploadPreview(null)
      setUploadVendor('')
      setUploadLayer('')
      const [listRes, logRes] = await Promise.all([
        fetch('/api/catalog/components'),
        fetch('/api/admin/catalog/log'),
      ])
      if (listRes.ok) { const { data } = await listRes.json(); setComponents(data ?? []) }
      if (logRes.ok) { const { data } = await logRes.json(); setUploadLog(data ?? []) }
    } catch (e) {
      setUploadResult(`✗ ${e instanceof Error ? e.message : 'Unbekannter Fehler'}`)
    } finally {
      setUploading(false)
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
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1',
              tab === id
                ? 'border-blue-600 text-primary-hover'
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
              className="whitespace-nowrap px-4 py-2 bg-primary hover:bg-primary text-white text-sm font-semibold rounded-lg transition-colors"
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
                    ? 'bg-primary text-white'
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring">
                    <option value="">— wählen —</option>
                    {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-category" className="block text-xs font-medium text-slate-700 mb-1">Kategorie</label>
                  <input id="admin-category" type="text" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="z. B. gesetz, beispiel, quelle"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </div>
              </div>
              <div>
                <label htmlFor="admin-title" className="block text-xs font-medium text-slate-700 mb-1">Titel</label>
                <input id="admin-title" type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
              </div>
              <div>
                <label htmlFor="admin-content" className="block text-xs font-medium text-slate-700 mb-1">Inhalt</label>
                <textarea id="admin-content" value={form.content} rows={5}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring resize-y" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-source" className="block text-xs font-medium text-slate-700 mb-1">Quelle (optional)</label>
                  <input id="admin-source" type="text" value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    placeholder="z. B. EU AI Act Art. 6"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </div>
                <div>
                  <label htmlFor="admin-tags" className="block text-xs font-medium text-slate-700 mb-1">Tags (kommagetrennt)</label>
                  <input id="admin-tags" type="text" value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="tag1, tag2"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="whitespace-nowrap px-4 py-2 bg-primary hover:bg-primary disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
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
                          className="text-xs text-primary hover:text-primary font-medium mr-3">
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
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Typ</label>
                    <select
                      value={newSourceForm.type}
                      onChange={e => changeNewSourceType(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring bg-white"
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
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-white"
                  />
                </div>
                {(SOURCE_TYPE_SCHEMAS[newSourceForm.type]?.fields ?? []).map(field => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      {field.helpUrl && (
                        <a href={field.helpUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">↗</a>
                      )}
                    </label>
                    <input
                      type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                      value={newSourceForm.config[field.key] ?? ''}
                      onChange={e => setNewSourceForm(f => ({ ...f, config: { ...f.config, [field.key]: e.target.value } }))}
                      placeholder={field.placeholder}
                      autoComplete="off"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-white"
                    />
                    {field.helpText && <p className="text-[10px] text-slate-400 mt-0.5">{field.helpText}</p>}
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleAddSource}
                    disabled={addingSource}
                    className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary disabled:opacity-50 text-white rounded-lg transition-colors"
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
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-soft text-primary font-medium whitespace-nowrap">{schema.technology}</span>
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
                            className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary disabled:opacity-40 text-white rounded-lg transition-colors"
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
                              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-white"
                            />
                          </div>
                          {/* Schema-gesteuerte Config-Felder */}
                          {(schema?.fields ?? []).map(field => (
                            <div key={field.key}>
                              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                {field.helpUrl && (
                                  <a href={field.helpUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">↗</a>
                                )}
                              </label>
                              <input
                                type={field.type === 'password' ? 'password' : field.type === 'url' ? 'url' : 'text'}
                                value={editingSourceConfig[field.key] ?? ''}
                                onChange={e => setEditingSourceConfig(c => ({ ...c, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                autoComplete="off"
                                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-white"
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
                            className="whitespace-nowrap text-xs text-primary hover:text-primary font-medium flex-shrink-0"
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
            <div className="flex items-center gap-3 flex-wrap">
              {seedResult && (
                <span className={cn(
                  'text-xs font-medium',
                  seedResult.startsWith('✓') ? 'text-emerald-700' : 'text-red-700'
                )}>{seedResult}</span>
              )}
              {seedBackup && seedBackup.length > 0 && (
                <button
                  onClick={() => downloadBackupJson(seedBackup, 'katalog-seed')}
                  className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  ↓ Backup ({seedBackup.length})
                </button>
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

          {/* CSV / JSON Upload */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 space-y-3">
            <p className="text-xs font-medium text-slate-700">CSV / JSON Import</p>

            {/* File picker */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="file"
                accept=".csv,.json"
                key={uploadResult ?? 'idle'}
                onChange={e => {
                  const f = e.target.files?.[0] ?? null
                  setUploadFile(f)
                  setUploadResult(null)
                  if (f) handlePreview(f)
                }}
                className="flex-1 block text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-soft file:text-primary-hover hover:file:bg-blue-100 cursor-pointer"
              />
              {previewing && <span className="text-[10px] text-slate-400 animate-pulse whitespace-nowrap">Analysiere Datei…</span>}
            </div>
            <p className="text-[10px] text-slate-400">Standard-Spalten: name, vendor, architecture_layer, … | SAP Discovery Center CSV wird automatisch erkannt</p>

            {/* Preview / Bestätigung */}
            {uploadPreview && (
              <div className="border border-primary-border bg-primary-soft rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-blue-800">{uploadPreview.formatLabel}</span>
                    <span className="text-xs text-primary">· {uploadPreview.row_count} Einträge</span>
                    {uploadPreview.ambiguous && (
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                        Layer unklar — bitte prüfen
                      </span>
                    )}
                  </div>
                  <span className={cn('text-[10px] font-medium', {
                    'text-emerald-700': uploadPreview.layer_confidence === 'high',
                    'text-amber-700':   uploadPreview.layer_confidence === 'medium',
                    'text-red-700':     uploadPreview.layer_confidence === 'low',
                  })}>
                    {uploadPreview.layer_confidence === 'high'   && '● Hohe Erkennungssicherheit'}
                    {uploadPreview.layer_confidence === 'medium' && '● Mittlere Erkennungssicherheit'}
                    {uploadPreview.layer_confidence === 'low'    && '● Layer manuell wählen'}
                  </span>
                </div>

                {uploadPreview.sample_names.length > 0 && (
                  <p className="text-[10px] text-primary truncate">
                    Beispiele: {uploadPreview.sample_names.join(' · ')}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">Vendor (Override für alle)</label>
                    <select
                      value={uploadVendor}
                      onChange={e => setUploadVendor(e.target.value)}
                      className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-ring"
                    >
                      <option value="">— Aus Datei übernehmen —</option>
                      {KNOWN_VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-600 mb-1">Architecture Layer (Override für alle)</label>
                    <select
                      value={uploadLayer}
                      onChange={e => setUploadLayer(e.target.value)}
                      className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-ring"
                    >
                      <option value="">— Aus Datei übernehmen —</option>
                      {ARCH_LAYERS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Result + Button */}
            <div className="flex items-center gap-3 flex-wrap">
              {uploadResult && (
                <span className={cn('text-xs font-medium', uploadResult.startsWith('✓') ? 'text-emerald-700' : 'text-red-700')}>
                  {uploadResult}
                </span>
              )}
              {uploadBackup && uploadBackup.length > 0 && (
                <button
                  onClick={() => downloadBackupJson(uploadBackup, 'katalog-upload')}
                  className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  ↓ Backup ({uploadBackup.length})
                </button>
              )}
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary disabled:opacity-40 text-white rounded-lg transition-colors"
              >
                {uploading ? 'Importiert…' : uploadPreview ? `↑ Importieren (${uploadPreview.row_count} Einträge)` : '↑ Importieren'}
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
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-ring w-full sm:w-64"
            />
            <select
              value={catalogLayer}
              onChange={e => setCatalogLayer(e.target.value)}
              aria-label="Nach Layer filtern"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-ring"
            >
              <option value="all">Alle Layer</option>
              {ARCH_LAYERS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={catalogCloud}
              onChange={e => setCatalogCloud(e.target.value)}
              aria-label="Nach Cloud-Provider filtern"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-ring"
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
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs">Tags</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 text-xs hidden xl:table-cell">Abhängigkeiten</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCatalog.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors align-top">
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
                        {/* Tags — inline editable */}
                        <td className="px-4 py-3 max-w-[260px]">
                          <div className="flex gap-1 flex-wrap">
                            {c.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                {tag}
                                <button
                                  onClick={() => removeTag(c.id, c.tags, tag)}
                                  disabled={tagSavingId === c.id}
                                  aria-label={`Tag "${tag}" entfernen`}
                                  className="text-slate-400 hover:text-red-500 leading-none disabled:opacity-40 ml-0.5"
                                >×</button>
                              </span>
                            ))}
                            <button
                              onClick={() => setTagEditingId(tagEditingId === c.id ? null : c.id)}
                              aria-label="Tag hinzufügen"
                              aria-expanded={tagEditingId === c.id}
                              className="px-1.5 py-0.5 text-xs text-primary hover:text-blue-800 hover:bg-primary-soft rounded border border-primary-border leading-none"
                            >+</button>
                            {tagSavingId === c.id && (
                              <span className="text-[10px] text-slate-400 self-center">…</span>
                            )}
                          </div>
                          {tagEditingId === c.id && (
                            <div className="mt-1.5 flex gap-1 flex-wrap max-w-[240px]">
                              {PREDEFINED_TAGS.filter(t => !c.tags.includes(t)).map(t => (
                                <button
                                  key={t}
                                  onClick={() => { addTag(c.id, c.tags, t); setTagEditingId(null) }}
                                  className="px-1.5 py-0.5 bg-primary-soft text-primary text-[11px] rounded border border-primary-border hover:bg-blue-100 transition-colors"
                                >+{t}</button>
                              ))}
                            </div>
                          )}
                        </td>
                        {/* Dependency editor */}
                        <td className="px-4 py-3 hidden xl:table-cell align-top">
                          {depEditingId === c.id ? (
                            <div className="space-y-1.5 min-w-[220px]">
                              {([
                                { key: 'incompatible_with' as const, label: '✗ Inkompatibel', color: 'border-red-200 focus:ring-red-400' },
                                { key: 'requires' as const, label: '⬆ Benötigt', color: 'border-primary-border focus:ring-blue-400' },
                                { key: 'suggests' as const, label: '💡 Schlägt vor', color: 'border-emerald-200 focus:ring-emerald-400' },
                              ] as const).map(({ key, label, color }) => (
                                <div key={key}>
                                  <label className="block text-[10px] font-medium text-slate-500 mb-0.5">{label}</label>
                                  <input
                                    type="text"
                                    value={depForm[key]}
                                    onChange={e => setDepForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder="Name1, Name2"
                                    className={cn('w-full border rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1', color)}
                                  />
                                </div>
                              ))}
                              <div className="flex gap-1.5 pt-0.5">
                                <button
                                  onClick={() => saveDepEditor(c.id)}
                                  disabled={depSavingId === c.id}
                                  className="px-2 py-1 text-[10px] font-medium bg-slate-800 text-white rounded disabled:opacity-50"
                                >
                                  {depSavingId === c.id ? '…' : 'Speichern'}
                                </button>
                                <button
                                  onClick={() => setDepEditingId(null)}
                                  className="px-2 py-1 text-[10px] font-medium border border-slate-200 text-slate-600 rounded"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5 min-w-0">
                              {c.incompatible_with.length > 0 && (
                                <p className="text-[10px] text-red-600 truncate max-w-[160px]">✗ {c.incompatible_with.join(', ')}</p>
                              )}
                              {c.requires.length > 0 && (
                                <p className="text-[10px] text-primary truncate max-w-[160px]">⬆ {c.requires.join(', ')}</p>
                              )}
                              {c.suggests.length > 0 && (
                                <p className="text-[10px] text-emerald-600 truncate max-w-[160px]">💡 {c.suggests.join(', ')}</p>
                              )}
                              <button
                                onClick={() => openDepEditor(c)}
                                className="text-[10px] text-slate-400 hover:text-slate-700 font-medium"
                              >
                                {(c.incompatible_with.length + c.requires.length + c.suggests.length) > 0 ? '✎ Bearbeiten' : '+ Abhängigkeiten'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload-Verlauf */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-800">Upload-Verlauf</h3>
              <span className="text-xs text-slate-400">{uploadLog.length} Einträge</span>
            </div>
            {restoreMsg && (
              <div className={cn(
                'px-4 py-2 text-xs font-medium border-b',
                restoreMsg.startsWith('✓')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-red-50 text-red-700 border-red-100'
              )}>
                {restoreMsg}
              </div>
            )}
            {uploadLog.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">Noch keine Uploads oder Seed-Aktionen</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" aria-label="Upload-Verlauf">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">Datei / Quelle</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500 hidden sm:table-cell">Format</th>
                      <th className="text-right px-4 py-2 font-medium text-slate-500 hidden sm:table-cell">Einträge</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500 hidden md:table-cell">Vendor-Override</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500 hidden md:table-cell">Layer-Override</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500">Datum</th>
                      <th className="text-left px-4 py-2 font-medium text-slate-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {uploadLog.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-700 max-w-[180px] truncate">
                          <span className={cn(
                            'mr-1.5 px-1 py-0.5 rounded text-[10px] font-semibold',
                            log.source === 'seed' ? 'bg-purple-50 text-purple-700' : 'bg-primary-soft text-primary-hover'
                          )}>
                            {log.source === 'seed' ? 'SEED' : 'CSV/JSON'}
                          </span>
                          {log.filename}
                        </td>
                        <td className="px-4 py-2 text-slate-500 hidden sm:table-cell">{log.format}</td>
                        <td className="px-4 py-2 text-slate-700 text-right hidden sm:table-cell">{log.row_count}</td>
                        <td className="px-4 py-2 text-slate-400 hidden md:table-cell">{log.vendor_override ?? '—'}</td>
                        <td className="px-4 py-2 text-slate-400 hidden md:table-cell">{log.layer_override ?? '—'}</td>
                        <td className="px-4 py-2 text-slate-400 whitespace-nowrap">
                          {new Date(log.uploaded_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {log.snapshot ? (
                            <button
                              onClick={() => handleRestore(log.id, log.filename)}
                              disabled={restoringId === log.id}
                              className="px-2 py-1 text-[10px] font-medium rounded border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                            >
                              {restoringId === log.id ? '…' : '↩ Wiederherstellen'}
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[10px]">kein Snapshot</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring"
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
                          className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-ring disabled:opacity-50"
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
                                      ? 'bg-primary border-blue-600 text-white'
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
