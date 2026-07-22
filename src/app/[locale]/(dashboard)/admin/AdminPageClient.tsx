'use client'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { ContentLibraryEntry, UserProfile, Tier, CatalogComponent, CatalogSource, CatalogUploadLog, CanvasSynonym, ComplianceSourceDraft, ScanSourceResult, SourceScanStatus } from '@/types'
import { cn } from '@/lib/utils'
import { AlertBox } from '@/components/shared/AlertBox'
import { SOURCE_TYPE_SCHEMAS, KNOWN_SOURCE_TYPES } from '@/config/catalog-source-schemas'
import { CatalogSuggestionsPanel } from './CatalogSuggestionsPanel'

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

interface PolicyTemplate {
  id: string
  slug: string
  locale: string
  title: string
  subtitle: string
  content: string
  is_published: boolean
  display_order: number
}

interface Props {
  initialEntries: ContentLibraryEntry[]
  initialUsers?: UserProfile[]
  initialComponents?: CatalogComponent[]
  componentCount?: number
  initialSources?: CatalogSource[]
  initialUploadLog?: CatalogUploadLog[]
  initialDrafts?: ComplianceSourceDraft[]
  initialSourceSnapshots?: SourceScanStatus[]
  initialPolicyTemplates?: PolicyTemplate[]
}

type Tab = 'content' | 'users' | 'catalog' | 'suggestions' | 'synonyms' | 'scanner' | 'policy_templates' | 'pricing' | 'app_settings'

interface PromoQueueEntry {
  term: string; synonym: string; synonym_type: string
  client_count: number; avg_confidence: number; total_evidence: number
}

type FormState = {
  module: string
  category: string
  title: string
  content: string
  source: string
  tags: string
  min_tier: string
  context_key: string
  locale: string
  is_published: boolean
}

const EMPTY_FORM: FormState = { module: '', category: '', title: '', content: '', source: '', tags: '', min_tier: 'free', context_key: '', locale: 'de', is_published: true }

export function AdminPageClient({ initialEntries, initialUsers = [], initialComponents = [], componentCount = 0, initialSources = [], initialUploadLog = [], initialDrafts = [], initialSourceSnapshots = [], initialPolicyTemplates = [] }: Props) {
  const t = useTranslations('admin')
  const [tab, setTab] = useState<Tab>('content')

  // ── Preise & Aktionen state ─────────────────────────────────────────────────
  const [priceCfg, setPriceCfg] = useState<{ monthly_price: number; yearly_price: number | null; currency: string; stripe_price_id: string | null; stripe_price_id_yearly: string | null } | null>(null)
  const [priceSaving, setPriceSaving] = useState(false)
  const [promotions, setPromotions] = useState<{ id: string; name: string; badge_text: string; description: string | null; promo_price: number; promo_price_yearly: number | null; valid_from: string | null; valid_until: string | null; stripe_price_id: string | null; stripe_price_id_yearly: string | null; is_active: boolean }[]>([])
  const [promoEditing, setPromoEditing] = useState<string | null>(null)
  const [promoForm, setPromoForm] = useState({ name: '', badge_text: '', description: '', promo_price: '', promo_price_yearly: '', valid_from: '', valid_until: '', stripe_price_id: '', stripe_price_id_yearly: '', is_active: false })
  const [promoSaving, setPromoSaving] = useState(false)
  const [pricingLoaded, setPricingLoaded] = useState(false)

  // ─── App-Settings State ──────────────────────────────────────────────────
  const [appSettings, setAppSettings] = useState<{ ai_limit_free: number; ai_limit_pro: number; ai_limit_enterprise: number; stripe_grace_period_days: number; ai_direct_fallback: 0 | 1; ai_model_bedrock_haiku: string; ai_model_bedrock_sonnet: string; ai_model_direct_fallback: string } | null>(null)
  const [appSettingsSaving, setAppSettingsSaving] = useState(false)
  const [appSettingsLoaded, setAppSettingsLoaded] = useState(false)
  const [aiConfig, setAiConfig] = useState<{ hasAnthropicKey: boolean; hasBedrockKeys: boolean; bedrockRegion: string } | null>(null)
  const [cacheStats, setCacheStats] = useState<{ active: number; expired: number; oldest: string | null; newest: string | null; estimatedBytes: number | null; hitRateToday: number | null; hitRate7d: number | null; topModules: { module: string; hits: number; misses: number; total: number }[] } | null>(null)
  const [cachePurgeMsg, setCachePurgeMsg] = useState<string | null>(null)

  async function loadAppSettings() {
    if (appSettingsLoaded) return
    const [data, cfg, cache] = await Promise.all([
      fetch('/api/admin/settings').then(r => r.json()),
      fetch('/api/admin/ai-config').then(r => r.json()),
      fetch('/api/admin/cache').then(r => r.json()),
    ])
    setAppSettings(data)
    setAiConfig(cfg)
    setCacheStats(cache)
    setAppSettingsLoaded(true)
  }

  async function handleCachePurge() {
    if (!window.confirm(t('cachePurgeConfirm'))) return
    setCachePurgeMsg(null)
    const res = await fetch('/api/admin/cache', { method: 'DELETE' }).then(r => r.json())
    if (typeof res.deleted === 'number') {
      setCachePurgeMsg(res.deleted > 0 ? t('cachePurgeSuccess', { count: res.deleted }) : t('cachePurgeNone'))
      fetch('/api/admin/cache').then(r => r.json()).then(setCacheStats).catch(() => {})
    }
  }

  async function saveAppSettings() {
    if (!appSettings) return
    setAppSettingsSaving(true)
    await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(appSettings) })
    setAppSettingsSaving(false)
  }

  async function loadPricing() {
    if (pricingLoaded) return
    const [cfgRes, promoRes] = await Promise.all([
      fetch('/api/admin/pricing').then(r => r.json()),
      fetch('/api/admin/promotions').then(r => r.json()),
    ])
    setPriceCfg(cfgRes)
    setPromotions(Array.isArray(promoRes) ? promoRes : [])
    setPricingLoaded(true)
  }

  async function savePriceConfig() {
    if (!priceCfg) return
    setPriceSaving(true)
    await fetch('/api/admin/pricing', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...priceCfg, monthly_price: Number(priceCfg.monthly_price), yearly_price: priceCfg.yearly_price ? Number(priceCfg.yearly_price) : null }) })
    setPriceSaving(false)
  }

  async function savePromo() {
    setPromoSaving(true)
    const body = { name: promoForm.name, badge_text: promoForm.badge_text, description: promoForm.description || null, promo_price: Number(promoForm.promo_price), promo_price_yearly: promoForm.promo_price_yearly ? Number(promoForm.promo_price_yearly) : null, valid_from: promoForm.valid_from || null, valid_until: promoForm.valid_until || null, stripe_price_id: promoForm.stripe_price_id || null, stripe_price_id_yearly: promoForm.stripe_price_id_yearly || null, is_active: promoForm.is_active }
    if (promoEditing) {
      await fetch(`/api/admin/promotions?id=${promoEditing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setPromotions(ps => ps.map(p => p.id === promoEditing ? { ...p, ...body } : p))
    } else {
      const res = await fetch('/api/admin/promotions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const created = await res.json()
      setPromotions(ps => [created, ...ps])
    }
    setPromoEditing(null)
    setPromoForm({ name: '', badge_text: '', description: '', promo_price: '', promo_price_yearly: '', valid_from: '', valid_until: '', stripe_price_id: '', stripe_price_id_yearly: '', is_active: false })
    setPromoSaving(false)
  }

  async function togglePromoActive(id: string, active: boolean) {
    await fetch(`/api/admin/promotions?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: active }) })
    setPromotions(ps => ps.map(p => p.id === id ? { ...p, is_active: active } : p))
  }

  async function deletePromo(id: string) {
    await fetch(`/api/admin/promotions?id=${id}`, { method: 'DELETE' })
    setPromotions(ps => ps.filter(p => p.id !== id))
  }

  function editPromo(p: typeof promotions[number]) {
    setPromoEditing(p.id)
    setPromoForm({ name: p.name, badge_text: p.badge_text, description: p.description ?? '', promo_price: String(p.promo_price), promo_price_yearly: p.promo_price_yearly ? String(p.promo_price_yearly) : '', valid_from: p.valid_from ? p.valid_from.slice(0, 10) : '', valid_until: p.valid_until ? p.valid_until.slice(0, 10) : '', stripe_price_id: p.stripe_price_id ?? '', stripe_price_id_yearly: p.stripe_price_id_yearly ?? '', is_active: p.is_active })
  }

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
  const [depForm, setDepForm] = useState<{ incompatible_with: string; requires: string; suggests: string; aliases: string }>({
    incompatible_with: '', requires: '', suggests: '', aliases: '',
  })

  // ── Synonyms state ──────────────────────────────────────────────────────────
  const [synonyms, setSynonyms] = useState<CanvasSynonym[]>([])
  const [synLoaded, setSynLoaded] = useState(false)
  const [synLoading, setSynLoading] = useState(false)
  const [synForm, setSynForm] = useState({ term: '', synonym: '', synonym_type: 'vendor' as CanvasSynonym['synonym_type'] })
  const [synSaving, setSynSaving] = useState(false)
  const [synError, setSynError] = useState<string | null>(null)
  const [promoQueue, setPromoQueue] = useState<PromoQueueEntry[]>([])
  const [promoLoaded, setPromoLoaded] = useState(false)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoAction, setPromoAction] = useState<string | null>(null)
  const [promoThresholds, setPromoThresholds] = useState({ minClients: 3, minConfidence: 0.80 })

  // ── Scanner state ────────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState<ComplianceSourceDraft[]>(initialDrafts ?? [])
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ scanned: number; changed: number; drafts_created: number; sources: ScanSourceResult[] } | null>(null)
  const [showArchive, setShowArchive] = useState(false)
  const [sourceSnapshots, setSourceSnapshots] = useState<SourceScanStatus[]>(initialSourceSnapshots)

  // ── Policy Templates state ───────────────────────────────────────────────────
  const [policyTemplates, setPolicyTemplates] = useState<PolicyTemplate[]>(initialPolicyTemplates)
  const [ptEditing, setPtEditing] = useState<PolicyTemplate | null>(null)
  const [ptSaving, setPtSaving] = useState(false)
  const [ptError, setPtError] = useState<string | null>(null)

  async function savePolicyTemplate(patch: Partial<PolicyTemplate>) {
    if (!ptEditing) return
    setPtSaving(true)
    setPtError(null)
    try {
      const res = await fetch(`/api/admin/policy-templates?id=${ptEditing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) { setPtError(json.error ?? 'Fehler'); return }
      setPolicyTemplates(prev => prev.map(t => t.id === json.data.id ? json.data : t))
      setPtEditing(null)
    } finally {
      setPtSaving(false)
    }
  }

  async function togglePtPublished(tpl: PolicyTemplate) {
    const res = await fetch(`/api/admin/policy-templates?id=${tpl.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !tpl.is_published }),
    })
    const json = await res.json()
    if (res.ok) setPolicyTemplates(prev => prev.map(t => t.id === json.data.id ? json.data : t))
  }

  // ── Learn suggestions state ──────────────────────────────────────────────────
  type LearnSuggestion = { word: string; count: number; fields: string[]; suggested_type: CanvasSynonym['synonym_type'] }
  const [suggestions, setSuggestions] = useState<LearnSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionInputs, setSuggestionInputs] = useState<Record<string, { term: string; synonym_type: CanvasSynonym['synonym_type'] }>>({})
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
      min_tier: entry.min_tier ?? 'free',
      context_key: entry.context_key ?? '',
      locale: entry.locale ?? 'de',
      is_published: entry.is_published ?? true,
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
      min_tier: form.min_tier || 'free',
      context_key: form.context_key.trim() || null,
      locale: form.locale || 'de',
      is_published: form.is_published,
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
    aliases?: string[]
  }) {
    setDepSavingId(id)
    try {
      const res = await fetch(`/api/admin/catalog/components/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error((await res.json() as { error?: string }).error ?? 'Fehler')
      const { data } = await res.json() as { data: { incompatible_with: string[]; requires: string[]; suggests: string[]; aliases: string[] } }
      setComponents(prev => prev.map(c => c.id === id ? {
        ...c,
        incompatible_with: data.incompatible_with,
        requires: data.requires,
        suggests: data.suggests,
        aliases: data.aliases,
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
      aliases: c.aliases.join(', '),
    })
  }

  function saveDepEditor(id: string) {
    patchComponentDependencies(id, {
      incompatible_with: depForm.incompatible_with.split(',').map(s => s.trim()).filter(Boolean),
      requires:          depForm.requires.split(',').map(s => s.trim()).filter(Boolean),
      suggests:          depForm.suggests.split(',').map(s => s.trim()).filter(Boolean),
      aliases:           depForm.aliases.split(',').map(s => s.trim()).filter(Boolean),
    })
  }

  async function loadSynonyms() {
    if (synLoaded) return
    setSynLoading(true)
    try {
      const res = await fetch('/api/admin/synonyms')
      const { data } = await res.json() as { data: CanvasSynonym[] }
      setSynonyms(data ?? [])
      setSynLoaded(true)
    } finally {
      setSynLoading(false)
    }
  }

  async function addSynonym() {
    if (!synForm.term.trim() || !synForm.synonym.trim()) return
    setSynSaving(true)
    setSynError(null)
    try {
      const res = await fetch('/api/admin/synonyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(synForm),
      })
      if (!res.ok) {
        const { error } = await res.json() as { error?: string }
        throw new Error(error ?? 'Fehler')
      }
      const { data } = await res.json() as { data: CanvasSynonym }
      setSynonyms(prev => [...prev, data])
      setSynForm({ term: '', synonym: '', synonym_type: 'vendor' })
    } catch (e) {
      setSynError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setSynSaving(false)
    }
  }

  async function toggleSynonymActive(s: CanvasSynonym) {
    const res = await fetch('/api/admin/synonyms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    })
    if (res.ok) {
      setSynonyms(prev => prev.map(x => x.id === s.id ? { ...x, is_active: !x.is_active } : x))
    }
  }

  async function deleteSynonym(id: string) {
    if (!confirm('Synonym löschen?')) return
    const res = await fetch(`/api/admin/synonyms?id=${id}`, { method: 'DELETE' })
    if (res.ok) setSynonyms(prev => prev.filter(x => x.id !== id))
  }

  async function loadPromoQueue() {
    if (promoLoaded) return
    setPromoLoading(true)
    try {
      const res = await fetch('/api/admin/synonyms/promote')
      const { queue, minClients, minConfidence } = await res.json() as { queue: PromoQueueEntry[]; minClients: number; minConfidence: number }
      setPromoQueue(queue ?? [])
      setPromoThresholds({ minClients: minClients ?? 3, minConfidence: minConfidence ?? 0.80 })
      setPromoLoaded(true)
    } finally {
      setPromoLoading(false)
    }
  }

  async function handlePromoAction(entry: PromoQueueEntry, action: 'approve' | 'reject' | 'block') {
    const key = `${entry.term}::${entry.synonym}`
    setPromoAction(key)
    try {
      await fetch('/api/admin/synonyms/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, term: entry.synonym, vendor: entry.term, synonym_type: entry.synonym_type }),
      })
      setPromoQueue(prev => prev.filter(e => !(e.term === entry.term && e.synonym === entry.synonym)))
    } finally {
      setPromoAction(null)
    }
  }

  async function loadSuggestions() {
    setSuggestionsLoading(true)
    setShowSuggestions(true)
    try {
      const res = await fetch('/api/admin/synonyms/learn?threshold=2')
      const { data } = await res.json() as { data: LearnSuggestion[] }
      const results = data ?? []
      setSuggestions(results)
      // Pre-fill inputs from suggestions
      const inputs: Record<string, { term: string; synonym_type: CanvasSynonym['synonym_type'] }> = {}
      for (const s of results) {
        inputs[s.word] = { term: '', synonym_type: s.suggested_type }
      }
      setSuggestionInputs(inputs)
    } finally {
      setSuggestionsLoading(false)
    }
  }

  async function addFromSuggestion(word: string) {
    const input = suggestionInputs[word]
    if (!input?.term.trim()) return
    setSynSaving(true)
    setSynError(null)
    try {
      const res = await fetch('/api/admin/synonyms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: input.term.trim(), synonym: word, synonym_type: input.synonym_type }),
      })
      if (!res.ok) {
        const { error } = await res.json() as { error?: string }
        throw new Error(error ?? 'Fehler')
      }
      const { data: newSyn } = await res.json() as { data: CanvasSynonym }
      setSynonyms(prev => [...prev, newSyn])
      setSuggestions(prev => prev.filter(s => s.word !== word))
    } catch (e) {
      setSynError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setSynSaving(false)
    }
  }

  async function runScan() {
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch('/api/admin/compliance/scan', { method: 'POST' })
      if (!res.ok) throw new Error('Scan fehlgeschlagen')
      const result = await res.json() as { scanned: number; changed: number; drafts_created: number; sources: ScanSourceResult[] }
      setScanResult(result)
      // Scan-Zeitstempel für alle erfolgreich gescannten Quellen aktualisieren
      const now = new Date().toISOString()
      setSourceSnapshots(prev => prev.map(s => {
        const scanned = result.sources.find(r => r.url === s.url)
        return scanned && scanned.status !== 'error' ? { ...s, fetched_at: now } : s
      }))
      if (result.drafts_created > 0) {
        const draftsRes = await fetch('/api/admin/compliance/drafts')
        if (draftsRes.ok) {
          const { data } = await draftsRes.json() as { data: ComplianceSourceDraft[] }
          setDrafts(data ?? [])
        }
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setScanning(false)
    }
  }

  async function reviewDraft(id: string, status: 'beruecksichtigt' | 'ignoriert') {
    const res = await fetch('/api/admin/compliance/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, review_status: status }),
    })
    if (res.ok) {
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, review_status: status } : d))
    }
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
        <h1 className="text-xl sm:text-2xl font-bold text-ink">Admin-Panel</h1>
        <p className="text-sm text-ink-muted mt-0.5">Interne Verwaltung</p>
      </div>

      {/* Tab bar — Mobile: select, Desktop: button row */}
      {(() => {
        const ADMIN_TABS: [Tab, string, number][] = [
          ['content', 'Content Library', entries.length],
          ['users', 'Nutzer-Verwaltung', users.length],
          ['catalog', 'Komponenten-Katalog', componentCount],
          ['suggestions', 'KI-Vorschläge', 0],
          ['synonyms', 'Canvas-Synonyme', synonyms.length],
          ['scanner', 'Quellen-Monitor', drafts.filter(d => d.review_status === 'pending_review').length],
          ['policy_templates', 'Policy Templates', policyTemplates.length],
          ['pricing', 'Preise & Aktionen', promotions.filter(p => p.is_active).length],
          ['app_settings', 'Einstellungen', 0],
        ]
        const handleTabClick = (id: Tab) => {
          setTab(id)
          if (id === 'synonyms') { void loadSynonyms(); void loadPromoQueue() }
          if (id === 'pricing') loadPricing()
          if (id === 'app_settings') loadAppSettings()
        }
        return (
          <div className="mb-6">
            {/* Mobile select (< md) */}
            <select
              className="md:hidden w-full border border-line rounded-xl px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-primary-ring"
              value={tab}
              onChange={e => handleTabClick(e.target.value as Tab)}
            >
              {ADMIN_TABS.map(([id, label, count]) => (
                <option key={id} value={id}>{label}{count > 0 ? ` (${count})` : ''}</option>
              ))}
            </select>
            {/* Desktop tab list (≥ md) */}
            <div className="hidden md:flex gap-1 border-b border-line" role="tablist">
              {ADMIN_TABS.map(([id, label, count]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => handleTabClick(id)}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1',
                    tab === id
                      ? 'border-primary text-primary-hover'
                      : 'border-transparent text-ink-muted hover:text-ink-secondary hover:border-line-strong'
                  )}
                >
                  {label}
                  <span className="ml-1.5 text-xs text-ink-subtle">({count})</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ─── Content Library tab ─────────────────────────────────────────────── */}
      {tab === 'content' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-ink-muted">{entries.length} Einträge</p>
            <button
              onClick={openCreate}
              className="whitespace-nowrap px-4 py-2 bg-primary hover:bg-primary text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + Neuer Eintrag
            </button>
          </div>

          {/* Filter */}
          <div className="flex gap-2 flex-wrap" role="group" aria-label={t('modulFilterAriaLabel')}>
            {['all', ...MODULES].map(m => (
              <button
                key={m}
                onClick={() => setFilterModule(m)}
                aria-pressed={filterModule === m}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filterModule === m
                    ? 'bg-primary text-white'
                    : 'bg-surface-raised text-ink-secondary hover:bg-line'
                )}
              >
                {m === 'all' ? 'Alle' : m}
              </button>
            ))}
          </div>

          {/* Form */}
          {showForm && (
            <div role="dialog" aria-modal="true" aria-label={editing ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              className="bg-surface border border-line rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base sm:text-lg font-semibold text-ink">
                {editing ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h2>
              {error && <AlertBox variant="error">{error}</AlertBox>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-module" className="block text-xs font-medium text-ink-secondary mb-1">Modul</label>
                  <select id="admin-module" value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))}
                    className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring">
                    <option value="">— wählen —</option>
                    {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-category" className="block text-xs font-medium text-ink-secondary mb-1">Kategorie</label>
                  <input id="admin-category" type="text" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder={t('contentTagsPlaceholder')}
                    className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </div>
              </div>
              <div>
                <label htmlFor="admin-title" className="block text-xs font-medium text-ink-secondary mb-1">Titel</label>
                <input id="admin-title" type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
              </div>
              <div>
                <label htmlFor="admin-content" className="block text-xs font-medium text-ink-secondary mb-1">Inhalt</label>
                <textarea id="admin-content" value={form.content} rows={5}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring resize-y" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-source" className="block text-xs font-medium text-ink-secondary mb-1">Quelle (optional)</label>
                  <input id="admin-source" type="text" value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    placeholder={t('contentSourcePlaceholder')}
                    className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </div>
                <div>
                  <label htmlFor="admin-tags" className="block text-xs font-medium text-ink-secondary mb-1">Tags (kommagetrennt)</label>
                  <input id="admin-tags" type="text" value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder={t('contentTagsListPlaceholder')}
                    className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </div>
                <div>
                  <label htmlFor="admin-min-tier" className="block text-xs font-medium text-ink-secondary mb-1">Sichtbar ab Tier</label>
                  <select id="admin-min-tier" value={form.min_tier}
                    onChange={e => setForm(f => ({ ...f, min_tier: e.target.value }))}
                    className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring">
                    {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-context-key" className="block text-xs font-medium text-ink-secondary mb-1">Context-Key (optional)</label>
                  <input id="admin-context-key" type="text" value={form.context_key}
                    onChange={e => setForm(f => ({ ...f, context_key: e.target.value }))}
                    placeholder="z. B. summary.dim.weak.starter.data"
                    className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </div>
                <div>
                  <label htmlFor="admin-locale" className="block text-xs font-medium text-ink-secondary mb-1">Sprache</label>
                  <select id="admin-locale" value={form.locale}
                    onChange={e => setForm(f => ({ ...f, locale: e.target.value }))}
                    className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring">
                    <option value="de">de</option>
                    <option value="en">en</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input id="admin-is-published" type="checkbox" checked={form.is_published}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="h-4 w-4 rounded border-line-strong text-primary focus:ring-2 focus:ring-primary-ring" />
                <label htmlFor="admin-is-published" className="text-xs font-medium text-ink-secondary">Veröffentlicht (für Nutzer sichtbar)</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="whitespace-nowrap px-4 py-2 bg-primary hover:bg-primary disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
                  {saving ? 'Speichert…' : 'Speichern'}
                </button>
                <button onClick={cancel} disabled={saving}
                  className="whitespace-nowrap px-4 py-2 bg-surface-raised hover:bg-line text-ink-secondary text-sm font-semibold rounded-lg transition-colors">
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-ink-subtle text-sm">
              Noch keine Einträge {filterModule !== 'all' ? `für "${filterModule}"` : ''}
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-xl overflow-hidden">
              <table className="w-full text-sm" aria-label={t('contentLibraryAriaLabel')}>
                <thead className="bg-surface-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Modul</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Kategorie</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs min-w-0">Titel</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs hidden sm:table-cell">Tags</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs hidden md:table-cell">Tier</th>
                    <th className="text-right px-4 py-3 font-medium text-ink-secondary text-xs"><span className="sr-only">Aktionen</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {filtered.map(entry => (
                    <tr key={entry.id} className="hover:bg-surface-raised transition-colors">
                      <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">{entry.module}</td>
                      <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">{entry.category}</td>
                      <td className="px-4 py-3 font-medium text-ink min-w-0">
                        <div className="truncate max-w-xs">{entry.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {entry.context_key && (
                            <span className="text-[10px] font-mono text-ink-subtle truncate max-w-[16rem]">{entry.context_key}</span>
                          )}
                          <span className="text-[10px] uppercase text-ink-subtle">{entry.locale ?? 'de'}</span>
                          {entry.is_published === false && (
                            <span className="text-[10px] font-semibold text-warning-text bg-warning-subtle border border-warning-border rounded px-1">Entwurf</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {entry.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-surface-raised text-ink-secondary text-xs rounded">{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {(entry.min_tier ?? 'free') !== 'free' ? (
                          <span className="text-xs font-semibold text-warning-text bg-warning-subtle border border-warning-border rounded-full px-2 py-0.5">
                            {entry.min_tier}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-subtle">free</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(entry)}
                          aria-label={`${entry.title} bearbeiten`}
                          className="text-xs text-primary hover:text-primary font-medium mr-3">
                          Bearbeiten
                        </button>
                        <button onClick={() => handleDelete(entry)}
                          aria-label={`${entry.title} löschen`}
                          className="text-xs text-error-text hover:text-error-text font-medium">
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
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-line-subtle flex items-center justify-between gap-3 gap-3">
              <h3 className="text-sm font-semibold text-ink">Katalog-Quellen ({sources.length})</h3>
              <button
                onClick={openAddSource}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                + Neue Quelle
              </button>
            </div>

            {/* "Neue Quelle" Formular */}
            {showAddSource && (
              <div className="px-4 py-4 border-b border-line-subtle bg-surface-raised space-y-3">
                <h4 className="text-xs font-semibold text-ink-secondary">Neue Datenquelle hinzufügen</h4>
                {addSourceError && (
                  <p className="text-xs text-error-text bg-error-subtle border border-error-border rounded px-2 py-1">{addSourceError}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-ink-muted mb-1">Name (eindeutig)</label>
                    <input
                      type="text"
                      value={newSourceForm.name}
                      onChange={e => setNewSourceForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={t('sourceNamePlaceholder')}
                      className="w-full border border-line-strong rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-ink-muted mb-1">Typ</label>
                    <select
                      value={newSourceForm.type}
                      onChange={e => changeNewSourceType(e.target.value)}
                      className="w-full border border-line-strong rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface"
                    >
                      {KNOWN_SOURCE_TYPES.map(t => (
                        <option key={t} value={t}>
                          {SOURCE_TYPE_SCHEMAS[t]?.label ?? t} ({SOURCE_TYPE_SCHEMAS[t]?.technology ?? '?'})
                        </option>
                      ))}
                    </select>
                    {SOURCE_TYPE_SCHEMAS[newSourceForm.type]?.description && (
                      <p className="text-[10px] text-ink-subtle mt-0.5">{SOURCE_TYPE_SCHEMAS[newSourceForm.type].description}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-ink-muted mb-1">Endpunkt-URL</label>
                  <input
                    type="url"
                    value={newSourceForm.url}
                    onChange={e => setNewSourceForm(f => ({ ...f, url: e.target.value }))}
                    placeholder={t('urlPlaceholder')}
                    className="w-full border border-line-strong rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface"
                  />
                </div>
                {(SOURCE_TYPE_SCHEMAS[newSourceForm.type]?.fields ?? []).map(field => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-medium text-ink-muted mb-1">
                      {field.label}
                      {field.required && <span className="text-error-text ml-0.5">*</span>}
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
                      className="w-full border border-line-strong rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface"
                    />
                    {field.helpText && <p className="text-[10px] text-ink-subtle mt-0.5">{field.helpText}</p>}
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
                    className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-line text-ink-secondary hover:bg-surface-raised rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {sources.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-subtle">Noch keine Quellen — Neue Quelle hinzufügen.</p>
            ) : (
              <ul className="divide-y divide-line-subtle">
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
                            <span className="text-sm font-medium text-ink min-w-0 truncate">{src.name}</span>
                            {schema && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-soft text-primary font-medium whitespace-nowrap">{schema.technology}</span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised text-ink-muted font-mono">{src.type}</span>
                            {src.sync_status === 'success'  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-success-subtle text-success-text">✓ OK</span>}
                            {src.sync_status === 'error'    && <span className="text-[10px] px-1.5 py-0.5 rounded bg-error-subtle text-error-text">✗ Fehler</span>}
                            {src.sync_status === 'skipped'  && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-subtle text-warning-text">⚠ Key fehlt</span>}
                          </div>
                          {schema?.description && (
                            <p className="text-[10px] text-ink-muted">{schema.description}</p>
                          )}
                          <p className="text-xs text-ink-subtle">
                            Letzter Sync: {lastSync}
                            {src.last_sync_added != null && src.last_sync_added > 0 && ` · ${src.last_sync_added} eingetragen`}
                          </p>
                          {src.last_sync_error && src.sync_status === 'error' && (
                            <p className="text-xs text-error-text truncate max-w-sm">{src.last_sync_error}</p>
                          )}
                          {msg && (
                            <p className={cn(
                              'text-xs font-medium',
                              msg.startsWith('✓') ? 'text-success-text'
                              : msg.startsWith('⚠') ? 'text-warning-text'
                              : msg.startsWith('—') ? 'text-ink-muted'
                              : 'text-error-text'
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
                            className="whitespace-nowrap px-2 py-1.5 text-xs font-medium border border-error-border text-error-text hover:bg-error-subtle rounded-lg transition-colors"
                            title="Quelle löschen"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* URL + Konfiguration */}
                      {editingSourceId === src.id ? (
                        <div className="space-y-2 border border-line rounded-lg p-3 bg-surface-raised">
                          <div>
                            <label className="block text-[10px] font-medium text-ink-muted mb-1">Endpunkt-URL</label>
                            <input
                              type="url"
                              value={editingSourceUrl}
                              onChange={e => setEditingSourceUrl(e.target.value)}
                              placeholder={t('urlPlaceholder')}
                              className="w-full border border-line-strong rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface"
                            />
                          </div>
                          {/* Schema-gesteuerte Config-Felder */}
                          {(schema?.fields ?? []).map(field => (
                            <div key={field.key}>
                              <label className="block text-[10px] font-medium text-ink-muted mb-1">
                                {field.label}
                                {field.required && <span className="text-error-text ml-0.5">*</span>}
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
                                className="w-full border border-line-strong rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface"
                              />
                              {field.helpText && <p className="text-[10px] text-ink-subtle mt-0.5">{field.helpText}</p>}
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
                              className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-line text-ink-secondary hover:bg-surface-raised rounded-lg transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-mono text-ink-muted truncate block">
                              {src.url || <em className="not-italic text-warning-text">Keine URL konfiguriert</em>}
                            </span>
                            {/* Config-Status für alle Quellen mit pflichtigen Feldern */}
                            {(schema?.fields ?? []).length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-0.5">
                                {(schema?.fields ?? []).map(f => (
                                  <span key={f.key} className={cn(
                                    'text-[10px]',
                                    src.config?.[f.key] ? 'text-success-text' : f.required ? 'text-warning-text font-medium' : 'text-ink-muted'
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
            <p className="text-sm text-ink-muted">
              {filteredCatalog.length} von {components.length} Komponenten
              {components.length === 0 && componentCount > 0 && ` (${componentCount} in DB — Seite neu laden)`}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {seedResult && (
                <span className={cn(
                  'text-xs font-medium',
                  seedResult.startsWith('✓') ? 'text-success-text' : 'text-error-text'
                )}>{seedResult}</span>
              )}
              {seedBackup && seedBackup.length > 0 && (
                <button
                  onClick={() => downloadBackupJson(seedBackup, 'katalog-seed')}
                  className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-warning-border text-warning-text bg-warning-subtle hover:bg-warning-border/30 rounded-lg transition-colors"
                >
                  ↓ Backup ({seedBackup.length})
                </button>
              )}
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="whitespace-nowrap px-4 py-2 bg-success-text hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {seeding ? 'Lädt…' : '↑ Seed-Daten einspielen'}
              </button>
            </div>
          </div>

          {/* CSV / JSON Upload */}
          <div className="bg-surface-raised border border-line rounded-xl px-4 py-3 space-y-3">
            <p className="text-xs font-medium text-ink-secondary">CSV / JSON Import</p>

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
                className="flex-1 block text-xs text-ink-secondary file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary-soft file:text-primary-hover hover:file:bg-primary-soft cursor-pointer"
              />
              {previewing && <span className="text-[10px] text-ink-muted animate-pulse whitespace-nowrap">Analysiere Datei…</span>}
            </div>
            <p className="text-[10px] text-ink-muted">Standard-Spalten: name, vendor, architecture_layer, … | SAP Discovery Center CSV wird automatisch erkannt</p>

            {/* Preview / Bestätigung */}
            {uploadPreview && (
              <div className="border border-primary-border bg-primary-soft rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-primary">{uploadPreview.formatLabel}</span>
                    <span className="text-xs text-primary">· {uploadPreview.row_count} Einträge</span>
                    {uploadPreview.ambiguous && (
                      <span className="text-[10px] font-medium text-warning-text bg-warning-subtle border border-warning-border px-1.5 py-0.5 rounded">
                        Layer unklar — bitte prüfen
                      </span>
                    )}
                  </div>
                  <span className={cn('text-[10px] font-medium', {
                    'text-success-text': uploadPreview.layer_confidence === 'high',
                    'text-warning-text': uploadPreview.layer_confidence === 'medium',
                    'text-error-text':   uploadPreview.layer_confidence === 'low',
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
                    <label className="block text-[10px] font-medium text-ink-secondary mb-1">Vendor (Override für alle)</label>
                    <select
                      value={uploadVendor}
                      onChange={e => setUploadVendor(e.target.value)}
                      className="w-full border border-line rounded-md px-2 py-1.5 text-xs text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-primary-ring"
                    >
                      <option value="">— Aus Datei übernehmen —</option>
                      {KNOWN_VENDORS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-ink-secondary mb-1">Architecture Layer (Override für alle)</label>
                    <select
                      value={uploadLayer}
                      onChange={e => setUploadLayer(e.target.value)}
                      className="w-full border border-line rounded-md px-2 py-1.5 text-xs text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-primary-ring"
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
                <span className={cn('text-xs font-medium', uploadResult.startsWith('✓') ? 'text-success-text' : 'text-error-text')}>
                  {uploadResult}
                </span>
              )}
              {uploadBackup && uploadBackup.length > 0 && (
                <button
                  onClick={() => downloadBackupJson(uploadBackup, 'katalog-upload')}
                  className="whitespace-nowrap px-3 py-1.5 text-xs font-medium border border-warning-border text-warning-text bg-warning-subtle hover:bg-warning-border/30 rounded-lg transition-colors"
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
              placeholder={t('catalogSearchPlaceholder')}
              className="border border-line rounded-lg px-3 py-1.5 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-2 focus:ring-primary-ring w-full sm:w-64"
            />
            <select
              value={catalogLayer}
              onChange={e => setCatalogLayer(e.target.value)}
              aria-label={t('filterLayerAriaLabel')}
              className="border border-line rounded-lg px-3 py-1.5 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-primary-ring"
            >
              <option value="all">Alle Layer</option>
              {ARCH_LAYERS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={catalogCloud}
              onChange={e => setCatalogCloud(e.target.value)}
              aria-label={t('filterCloudAriaLabel')}
              className="border border-line rounded-lg px-3 py-1.5 text-sm text-ink-secondary focus:outline-none focus:ring-2 focus:ring-primary-ring"
            >
              <option value="all">Alle Provider</option>
              {CLOUD_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Table */}
          {filteredCatalog.length === 0 ? (
            <div className="text-center py-16 text-ink-subtle text-sm">
              {components.length === 0
                ? 'Noch keine Komponenten in der DB — Seed-Daten einspielen, um zu starten.'
                : 'Keine Komponenten für diese Filter.'}
            </div>
          ) : (
            <div className="bg-surface border border-line rounded-xl overflow-hidden">
              <div className="overflow-x-auto scrollbar-hidden">
                <table className="w-full text-sm" aria-label={t('catalogTableAriaLabel')}>
                  <thead className="bg-surface-raised border-b border-line">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs hidden sm:table-cell">Vendor</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs hidden md:table-cell">Layer</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs hidden md:table-cell">Cloud</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs hidden lg:table-cell">DSGVO</th>
                      <th className="text-center px-4 py-3 font-medium text-ink-secondary text-xs hidden lg:table-cell">SAP</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Tags</th>
                      <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs hidden xl:table-cell">Abhängigkeiten</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {filteredCatalog.map(c => (
                      <tr key={c.id} className="hover:bg-surface-raised transition-colors align-top">
                        <td className="px-4 py-3 min-w-0">
                          <div className="font-medium text-ink truncate max-w-[180px]">{c.name}</div>
                          {c.description && (
                            <div className="text-xs text-ink-subtle truncate max-w-[180px]">{c.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap hidden sm:table-cell">{c.vendor ?? '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 bg-surface-raised text-ink-secondary rounded-full">{c.architecture_layer ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap hidden md:table-cell">{c.cloud_provider ?? '—'}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            c.dsgvo_status === 'compliant'     ? 'bg-success-subtle text-success-text' :
                            c.dsgvo_status === 'conditional'   ? 'bg-warning-subtle text-warning-text' :
                            'bg-error-subtle text-error-text'
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
                              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-raised text-ink-secondary text-xs rounded">
                                {tag}
                                <button
                                  onClick={() => removeTag(c.id, c.tags, tag)}
                                  disabled={tagSavingId === c.id}
                                  aria-label={`Tag "${tag}" entfernen`}
                                  className="text-ink-muted hover:text-error-text leading-none disabled:opacity-40 ml-0.5"
                                >×</button>
                              </span>
                            ))}
                            <button
                              onClick={() => setTagEditingId(tagEditingId === c.id ? null : c.id)}
                              aria-label={t('addTagAriaLabel')}
                              aria-expanded={tagEditingId === c.id}
                              className="px-1.5 py-0.5 text-xs text-primary hover:text-primary hover:bg-primary-soft rounded border border-primary-border leading-none"
                            >+</button>
                            {tagSavingId === c.id && (
                              <span className="text-[10px] text-ink-muted self-center">…</span>
                            )}
                          </div>
                          {tagEditingId === c.id && (
                            <div className="mt-1.5 flex gap-1 flex-wrap max-w-[240px]">
                              {PREDEFINED_TAGS.filter(t => !c.tags.includes(t)).map(t => (
                                <button
                                  key={t}
                                  onClick={() => { addTag(c.id, c.tags, t); setTagEditingId(null) }}
                                  className="px-1.5 py-0.5 bg-primary-soft text-primary text-[11px] rounded border border-primary-border hover:bg-primary-soft transition-colors"
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
                                { key: 'incompatible_with' as const, label: '✗ Inkompatibel', color: 'border-error-border focus:ring-error-border' },
                                { key: 'requires' as const, label: '⬆ Benötigt', color: 'border-primary-border focus:ring-primary-ring' },
                                { key: 'suggests' as const, label: '💡 Schlägt vor', color: 'border-success-border focus:ring-success-border' },
                                { key: 'aliases' as const, label: '🏷 Aliases', color: 'border-warning-border focus:ring-warning-border' },
                              ] as const).map(({ key, label, color }) => (
                                <div key={key}>
                                  <label className="block text-[10px] font-medium text-ink-muted mb-0.5">{label}</label>
                                  <input
                                    type="text"
                                    value={depForm[key]}
                                    onChange={e => setDepForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder={t('incompatiblePlaceholder')}
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
                                  className="px-2 py-1 text-[10px] font-medium border border-line text-ink-secondary rounded"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5 min-w-0">
                              {c.incompatible_with.length > 0 && (
                                <p className="text-[10px] text-error-text truncate max-w-[160px]">✗ {c.incompatible_with.join(', ')}</p>
                              )}
                              {c.requires.length > 0 && (
                                <p className="text-[10px] text-primary truncate max-w-[160px]">⬆ {c.requires.join(', ')}</p>
                              )}
                              {c.suggests.length > 0 && (
                                <p className="text-[10px] text-success-text truncate max-w-[160px]">💡 {c.suggests.join(', ')}</p>
                              )}
                              <button
                                onClick={() => openDepEditor(c)}
                                className="text-[10px] text-ink-muted hover:text-ink-secondary font-medium"
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
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-line-subtle flex items-center justify-between gap-3 gap-3">
              <h3 className="text-sm font-semibold text-ink">Upload-Verlauf</h3>
              <span className="text-xs text-ink-subtle">{uploadLog.length} Einträge</span>
            </div>
            {restoreMsg && (
              <div className={cn(
                'px-4 py-2 text-xs font-medium border-b',
                restoreMsg.startsWith('✓')
                  ? 'bg-success-subtle text-success-text border-success-border'
                  : 'bg-error-subtle text-error-text border-error-border'
              )}>
                {restoreMsg}
              </div>
            )}
            {uploadLog.length === 0 ? (
              <div className="text-center py-8 text-ink-muted text-xs">Noch keine Uploads oder Seed-Aktionen</div>
            ) : (
              <div className="overflow-x-auto scrollbar-hidden">
                <table className="w-full text-xs" aria-label={t('uploadLogAriaLabel')}>
                  <thead className="bg-surface-raised border-b border-line-subtle">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-ink-muted">Datei / Quelle</th>
                      <th className="text-left px-4 py-2 font-medium text-ink-muted hidden sm:table-cell">Format</th>
                      <th className="text-right px-4 py-2 font-medium text-ink-muted hidden sm:table-cell">Einträge</th>
                      <th className="text-left px-4 py-2 font-medium text-ink-muted hidden md:table-cell">Vendor-Override</th>
                      <th className="text-left px-4 py-2 font-medium text-ink-muted hidden md:table-cell">Layer-Override</th>
                      <th className="text-left px-4 py-2 font-medium text-ink-muted">Datum</th>
                      <th className="text-left px-4 py-2 font-medium text-ink-muted"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {uploadLog.map(log => (
                      <tr key={log.id} className="hover:bg-surface-raised">
                        <td className="px-4 py-2 font-medium text-ink-secondary max-w-[180px] truncate">
                          <span className={cn(
                            'mr-1.5 px-1 py-0.5 rounded text-[10px] font-semibold',
                            log.source === 'seed' ? 'bg-purple-50 text-purple-700' : 'bg-primary-soft text-primary-hover'
                          )}>
                            {log.source === 'seed' ? 'SEED' : 'CSV/JSON'}
                          </span>
                          {log.filename}
                        </td>
                        <td className="px-4 py-2 text-ink-muted hidden sm:table-cell">{log.format}</td>
                        <td className="px-4 py-2 text-ink-secondary text-right hidden sm:table-cell">{log.row_count}</td>
                        <td className="px-4 py-2 text-ink-muted hidden md:table-cell">{log.vendor_override ?? '—'}</td>
                        <td className="px-4 py-2 text-ink-muted hidden md:table-cell">{log.layer_override ?? '—'}</td>
                        <td className="px-4 py-2 text-ink-muted whitespace-nowrap">
                          {new Date(log.uploaded_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {log.snapshot ? (
                            <button
                              onClick={() => handleRestore(log.id, log.filename)}
                              disabled={restoringId === log.id}
                              className="px-2 py-1 text-[10px] font-medium rounded border border-warning-border bg-warning-subtle text-warning-text hover:opacity-80 disabled:opacity-50 transition-colors"
                            >
                              {restoringId === log.id ? '…' : '↩ Wiederherstellen'}
                            </button>
                          ) : (
                            <span className="text-line text-[10px]">kein Snapshot</span>
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

      {/* ─── KI-Vorschläge tab (catalog_suggestions) ─────────────────────────── */}
      {tab === 'suggestions' && <CatalogSuggestionsPanel />}

      {/* ─── User management tab ─────────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-5">
          {/* Search */}
          <div className="max-w-sm">
            <label htmlFor="user-search" className="sr-only">Nutzer suchen</label>
            <input
              id="user-search"
              type="search"
              placeholder={t('userSearchPlaceholder')}
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full border border-line-strong rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-ink-subtle text-sm">Keine Nutzer gefunden</div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(u => {
                const isExpanded = expandedUserId === u.id
                const isUpdating = updatingUserId === u.id
                const flags = u.feature_flags ?? {}
                return (
                  <div key={u.id} className="bg-surface border border-line rounded-xl overflow-hidden">
                    {/* Row */}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      {/* Identity */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink truncate">{u.full_name ?? '—'}</p>
                        <p className="text-xs text-ink-muted truncate">{u.email}</p>
                      </div>

                      {/* Tier selector */}
                      <div className="flex-shrink-0">
                        <label htmlFor={`tier-${u.id}`} className="sr-only">Tier für {u.email}</label>
                        <select
                          id={`tier-${u.id}`}
                          value={u.tier}
                          disabled={isUpdating}
                          onChange={e => patchUser(u.id, { tier: e.target.value as Tier })}
                          className="border border-line rounded-lg px-2 py-1 text-xs text-ink-secondary focus:outline-none focus:ring-2 focus:ring-primary-ring disabled:opacity-50"
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
                            ? 'border-error-border bg-error-subtle text-error-text hover:opacity-80'
                            : 'border-line text-ink-secondary hover:bg-surface-raised'
                        )}
                      >
                        {u.is_banned ? 'Gesperrt — entsperren' : 'Sperren'}
                      </button>

                      {/* Expand features */}
                      <button
                        onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`flags-${u.id}`}
                        className="px-3 py-1 text-xs font-medium border border-line rounded-lg text-ink-secondary hover:bg-surface-raised transition-colors whitespace-nowrap"
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
                      <div id={`flags-${u.id}`} className="border-t border-line-subtle px-4 py-3 bg-surface-raised space-y-3">
                        {/* Subscription info */}
                        <div>
                          <p className="text-xs font-medium text-ink-muted mb-1.5">Abo & Zahlung</p>
                          <div className="text-xs text-ink-secondary space-y-0.5">
                            <p>
                              <span className="text-ink-muted">Status:</span>{' '}
                              <span className={cn('font-medium', {
                                'text-success-text': u.subscription_status === 'active',
                                'text-warning-text': u.subscription_status === 'past_due' || u.subscription_status === 'trialing',
                                'text-error-text': u.subscription_status === 'canceled' || u.subscription_status === 'unpaid',
                                'text-ink-muted': !u.subscription_status,
                              })}>
                                {u.subscription_status ?? 'Kein Abo'}
                              </span>
                            </p>
                            {u.subscription_period_end && (
                              <p>
                                <span className="text-ink-muted">Läuft bis:</span>{' '}
                                {new Date(u.subscription_period_end).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </p>
                            )}
                            {u.stripe_customer_id && (
                              <p className="font-mono text-[10px] text-ink-muted truncate">
                                Stripe: {u.stripe_customer_id}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Feature flags */}
                        <div>
                          <p className="text-xs font-medium text-ink-muted mb-1.5">Feature-Flags</p>
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
                                      ? 'bg-primary border-primary text-white'
                                      : 'bg-surface border-line text-ink-secondary hover:border-line-strong'
                                  )}
                                >
                                  {flag}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <p className="text-xs text-ink-subtle">
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

      {/* ─── Synonyms tab ─────────────────────────────────────────────────────── */}
      {tab === 'synonyms' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-ink-muted">
              Admin-konfigurierbare Erkennungsbegriffe für die Canvas-Texterkennung
            </p>
            <button
              onClick={loadSuggestions}
              disabled={suggestionsLoading}
              className="px-4 py-2 text-sm font-medium border border-line text-ink-secondary rounded-lg hover:bg-surface-raised transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {suggestionsLoading ? 'Analysiere…' : '🔍 Canvas analysieren'}
            </button>
          </div>

          {/* Learn suggestions */}
          {showSuggestions && (
            <div className="bg-warning-subtle border border-warning-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-warning-text">
                  Lern-Vorschläge aus Canvas-Daten
                </p>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-warning-text hover:opacity-80"
                >
                  Schließen
                </button>
              </div>
              {suggestionsLoading ? (
                <p className="text-xs text-warning-text">Scanne Canvas-Einträge…</p>
              ) : suggestions.length === 0 ? (
                <p className="text-xs text-warning-text">
                  Keine neuen unbekannten Begriffe gefunden (mind. 2 Canvases Threshold).
                </p>
              ) : (
                <>
                  <p className="text-xs text-warning-text">
                    {suggestions.length} unbekannte Begriffe gefunden. Term ausfüllen und anlegen:
                  </p>
                  {synError && <p className="text-xs text-error-text">{synError}</p>}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {suggestions.map(s => {
                      const input = suggestionInputs[s.word] ?? { term: '', synonym_type: s.suggested_type }
                      return (
                        <div key={s.word} className="bg-surface border border-warning-border/30 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-medium text-ink">{s.word}</span>
                              <span className="text-xs text-ink-subtle">{s.count}× in</span>
                              {s.fields.map(f => (
                                <span key={f} className="px-1.5 py-0.5 bg-surface-raised text-ink-muted text-[10px] rounded">{f}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <input
                              type="text"
                              placeholder={t('synonymTermPlaceholder')}
                              value={input.term}
                              onChange={e => setSuggestionInputs(prev => ({
                                ...prev,
                                [s.word]: { ...prev[s.word]!, term: e.target.value },
                              }))}
                              className="border border-line rounded px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-primary-ring"
                            />
                            <select
                              value={input.synonym_type}
                              onChange={e => setSuggestionInputs(prev => ({
                                ...prev,
                                [s.word]: { ...prev[s.word]!, synonym_type: e.target.value as CanvasSynonym['synonym_type'] },
                              }))}
                              className="border border-line rounded px-2 py-1 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary-ring"
                            >
                              <option value="vendor">vendor</option>
                              <option value="category">category</option>
                              <option value="usecase">usecase</option>
                            </select>
                            <button
                              onClick={() => addFromSuggestion(s.word)}
                              disabled={synSaving || !input.term.trim()}
                              className="px-2 py-1 text-xs font-medium bg-slate-800 text-white rounded disabled:opacity-50 hover:bg-slate-700 transition-colors whitespace-nowrap"
                            >
                              Anlegen
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Add form */}
          <div className="bg-white border border-line rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-ink-secondary">Neues Synonym</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">Term (z.B. "Microsoft")</label>
                <input
                  type="text"
                  value={synForm.term}
                  onChange={e => setSynForm(f => ({ ...f, term: e.target.value }))}
                  placeholder={t('synonymSourcePlaceholder')}
                  className="w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">Synonym (z.B. "navision")</label>
                <input
                  type="text"
                  value={synForm.synonym}
                  onChange={e => setSynForm(f => ({ ...f, synonym: e.target.value }))}
                  placeholder={t('synonymCanonicalPlaceholder')}
                  className="w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">Typ</label>
                <select
                  value={synForm.synonym_type}
                  onChange={e => setSynForm(f => ({ ...f, synonym_type: e.target.value as CanvasSynonym['synonym_type'] }))}
                  className="w-full border border-line rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring bg-white"
                >
                  <option value="vendor">vendor (Hersteller-Alias)</option>
                  <option value="category">category (ERP/CRM/etc.)</option>
                  <option value="usecase">usecase (Use-Case-Begriff)</option>
                </select>
              </div>
            </div>
            {synError && <p className="text-xs text-error-text">{synError}</p>}
            <button
              onClick={addSynonym}
              disabled={synSaving || !synForm.term.trim() || !synForm.synonym.trim()}
              className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {synSaving ? 'Speichern…' : '+ Hinzufügen'}
            </button>
          </div>

          {/* List */}
          {/* ── Promotion-Queue ─────────────────────────────────────────────── */}
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line-subtle">
              <div>
                <p className="text-sm font-medium text-ink-secondary">Promotion-Queue</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Client-Synonyme mit ≥ {promoThresholds.minClients} Clients und Konfidenz ≥ {(promoThresholds.minConfidence * 100).toFixed(0)} %
                </p>
              </div>
              <button
                onClick={() => { setPromoLoaded(false); void loadPromoQueue() }}
                disabled={promoLoading}
                className="px-3 py-1.5 text-xs font-medium border border-line text-ink-secondary rounded-lg hover:bg-surface-raised transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {promoLoading ? 'Lade…' : 'Aktualisieren'}
              </button>
            </div>
            {promoLoading ? (
              <p className="text-sm text-ink-muted py-6 text-center">Lade Queue…</p>
            ) : promoQueue.length === 0 ? (
              <p className="text-sm text-ink-muted py-6 text-center">Keine Kandidaten — Schwellen noch nicht erreicht.</p>
            ) : (
              <div className="divide-y divide-line-subtle">
                {promoQueue.map(entry => {
                  const key = `${entry.term}::${entry.synonym}`
                  const busy = promoAction === key
                  return (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-medium text-ink">{entry.synonym}</span>
                          <span className="text-xs text-ink-subtle">→</span>
                          <span className="px-2 py-0.5 bg-primary-soft text-primary text-xs rounded-full font-medium">{entry.term}</span>
                          <span className="px-1.5 py-0.5 bg-surface-raised text-ink-muted text-[10px] rounded">{entry.synonym_type}</span>
                        </div>
                        <p className="text-xs text-ink-subtle mt-0.5">
                          {entry.client_count} Clients · Ø {(entry.avg_confidence * 100).toFixed(0)} % Konfidenz · {entry.total_evidence}× gesehen
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => void handlePromoAction(entry, 'approve')}
                          disabled={busy}
                          className="px-3 py-1.5 text-xs font-medium bg-success-text text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {busy ? '…' : 'Übernehmen'}
                        </button>
                        <button
                          onClick={() => void handlePromoAction(entry, 'reject')}
                          disabled={busy}
                          className="px-3 py-1.5 text-xs font-medium bg-surface-raised text-ink-secondary rounded-lg hover:bg-line transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          Ablehnen
                        </button>
                        <button
                          onClick={() => void handlePromoAction(entry, 'block')}
                          disabled={busy}
                          className="px-3 py-1.5 text-xs font-medium bg-error-subtle text-error-text border border-error-border rounded-lg hover:opacity-80 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          Blocken
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {synLoading ? (
            <p className="text-sm text-ink-muted py-4 text-center">Lade…</p>
          ) : synonyms.length === 0 ? (
            <p className="text-sm text-ink-muted py-8 text-center">Noch keine Synonyme angelegt.</p>
          ) : (
            <div className="bg-surface border border-line rounded-xl overflow-hidden">
              <table className="w-full text-sm" aria-label={t('synonymTableAriaLabel')}>
                <thead className="bg-surface-raised border-b border-line">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Term</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Synonym</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Typ</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Scope</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Belege</th>
                    <th className="text-left px-4 py-3 font-medium text-ink-secondary text-xs">Aktiv</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {synonyms.map(s => (
                    <tr key={s.id} className={cn('hover:bg-surface-raised transition-colors', !s.is_active && 'opacity-50')}>
                      <td className="px-4 py-3 font-medium text-ink">{s.term}</td>
                      <td className="px-4 py-3 text-ink-secondary">{s.synonym}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          s.synonym_type === 'vendor'   && 'bg-primary-soft text-primary',
                          s.synonym_type === 'category' && 'bg-success-subtle text-success-text',
                          s.synonym_type === 'usecase'  && 'bg-purple-50 text-purple-700',
                        )}>
                          {s.synonym_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          s.client_id ? 'bg-warning-subtle text-warning-text' : 'bg-surface-raised text-ink-muted',
                        )}>
                          {s.client_id ? 'Client' : 'Global'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-subtle">
                        {s.evidence_count ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSynonymActive(s)}
                          aria-pressed={s.is_active}
                          className={cn(
                            'px-2 py-0.5 text-xs rounded border transition-colors',
                            s.is_active
                              ? 'bg-success-subtle border-success-border text-success-text'
                              : 'bg-surface-raised border-line text-ink-muted'
                          )}
                        >
                          {s.is_active ? 'aktiv' : 'inaktiv'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteSynonym(s.id)}
                          aria-label={`${s.term}/${s.synonym} löschen`}
                          className="text-error-border hover:text-error-text text-xs transition-colors"
                        >
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

      {/* ─── Scanner tab ──────────────────────────────────────────────────────── */}
      {tab === 'scanner' && (
        <div className="space-y-5">
          {/* Quellen-Status-Panel */}
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-line-subtle">
              <div>
                <p className="text-sm font-medium text-ink-secondary">Regulatorische Quellenüberwachung</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  5 Primärquellen · Änderungserkennung per SHA-256-Hash · Nie automatisch publiziert.
                </p>
              </div>
              <button
                onClick={runScan}
                disabled={scanning}
                className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {scanning ? 'Scanne…' : 'Quellen jetzt scannen'}
              </button>
            </div>
            <div className="divide-y divide-line-subtle">
              {sourceSnapshots.map(src => (
                <div key={src.url} className="flex items-center gap-3 px-4 py-2.5 min-w-0">
                  <span className="text-sm text-ink-secondary min-w-0 truncate flex-1">{src.label}</span>
                  <span className="text-xs text-ink-subtle flex-shrink-0">
                    {src.fetched_at
                      ? new Date(src.fetched_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : 'Noch nie gescannt'}
                  </span>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex-shrink-0"
                    aria-label={`${src.label} öffnen`}
                  >
                    ↗
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Scan-Ergebnis + Log */}
          {scanResult && (
            <div className="bg-success-subtle border border-success-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 text-sm text-success-text font-medium">
                {scanResult.scanned} Quellen geprüft · {scanResult.changed} Änderungen gefunden · {scanResult.drafts_created} neue Entwürfe
              </div>
              <div className="divide-y divide-success-border/30">
                {scanResult.sources.map(src => (
                  <div key={src.url} className="flex items-center gap-2 px-4 py-2 min-w-0">
                    <span className={cn(
                      'flex-shrink-0 text-sm',
                      src.status === 'changed'   && 'text-warning-text',
                      src.status === 'unchanged' && 'text-success-text',
                      src.status === 'error'     && 'text-error-text',
                    )}>
                      {src.status === 'changed' ? '⚠' : src.status === 'unchanged' ? '✓' : '✗'}
                    </span>
                    <span className="text-xs text-ink-secondary min-w-0 truncate flex-1">{src.label}</span>
                    <span className="text-xs text-ink-subtle flex-shrink-0">
                      {src.status === 'changed' ? 'Geändert — Entwurf erstellt' : src.status === 'unchanged' ? 'Unverändert' : 'Fehler beim Abrufen'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const pending = drafts.filter(d => d.review_status === 'pending_review')
            const archived = drafts.filter(d => d.review_status !== 'pending_review')
            return (
              <>
                {pending.length === 0 ? (
                  <p className="text-sm text-ink-muted py-6 text-center">Keine offenen Entwürfe.</p>
                ) : (
                  <div className="space-y-3">
                    {pending.map(draft => (
                      <div key={draft.id} className="bg-white border border-line rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-start gap-2 min-w-0">
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium border rounded-full flex-shrink-0',
                            draft.status_estimate === 'final'   && 'bg-error-subtle border-error-border text-error-text',
                            draft.status_estimate === 'entwurf' && 'bg-warning-subtle border-warning-border text-warning-text',
                            draft.status_estimate === 'unklar'  && 'bg-surface-raised border-line text-ink-secondary',
                          )}>
                            {draft.status_estimate}
                          </span>
                          <span className="text-sm font-medium text-ink min-w-0">{draft.source_label}</span>
                          <span className="text-xs text-ink-subtle ml-auto flex-shrink-0">
                            {new Date(draft.scanned_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        <p className="text-sm text-ink-secondary">{draft.summary}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => reviewDraft(draft.id, 'beruecksichtigt')}
                            className="px-3 py-1.5 text-xs font-medium bg-success-text text-white rounded-lg hover:opacity-90 transition-colors whitespace-nowrap"
                          >
                            Berücksichtigt
                          </button>
                          <button
                            onClick={() => reviewDraft(draft.id, 'ignoriert')}
                            className="px-3 py-1.5 text-xs font-medium border border-line text-ink-secondary rounded-lg hover:bg-surface-raised transition-colors whitespace-nowrap"
                          >
                            Ignorieren
                          </button>
                          <a
                            href={draft.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs text-primary hover:underline"
                          >
                            Quelle ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {archived.length > 0 && (
                  <div>
                    <button
                      onClick={() => setShowArchive(v => !v)}
                      className="text-xs text-ink-subtle hover:text-ink-secondary"
                    >
                      {showArchive ? '▲ Archiv verbergen' : `▼ Archiv anzeigen (${archived.length})`}
                    </button>
                    {showArchive && (
                      <div className="mt-2 space-y-2 opacity-60">
                        {archived.map(draft => (
                          <div key={draft.id} className="bg-surface-raised border border-line-subtle rounded-lg px-4 py-3 text-xs text-ink-muted">
                            <span className="font-medium">{draft.source_label}</span>
                            {' · '}
                            <span className="italic">{draft.review_status}</span>
                            {' · '}
                            {draft.summary.slice(0, 100)}…
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )
          })()}
        </div>
      )}

      {/* ─── Policy Templates tab ────────────────────────────────────────────── */}
      {tab === 'policy_templates' && (
        <div className="space-y-4">
          <p className="text-xs text-ink-subtle">
            {policyTemplates.length} Templates (DE + EN) · Klicken Sie auf &bdquo;Bearbeiten&ldquo;, um Inhalt zu ändern. Veröffentlichungsstatus toggelbar.
          </p>
          {ptError && (
            <p className="text-xs text-error-text bg-error-subtle border border-error-border rounded-lg px-3 py-2">{ptError}</p>
          )}

          {['de', 'en'].map(loc => (
            <div key={loc}>
              <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                {loc === 'de' ? 'Deutsch (DE)' : 'English (EN)'}
              </h3>
              <div className="space-y-2">
                {policyTemplates.filter(t => t.locale === loc).sort((a, b) => a.display_order - b.display_order).map(tpl => (
                  <div key={tpl.id} className="bg-white border border-line rounded-xl p-4">
                    {ptEditing?.id === tpl.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">Titel</label>
                          <input
                            value={ptEditing.title}
                            onChange={e => setPtEditing({ ...ptEditing, title: e.target.value })}
                            className="w-full text-sm border border-line rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">Untertitel</label>
                          <input
                            value={ptEditing.subtitle}
                            onChange={e => setPtEditing({ ...ptEditing, subtitle: e.target.value })}
                            className="w-full text-sm border border-line rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-ring"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink-secondary mb-1">Inhalt (Markdown)</label>
                          <textarea
                            value={ptEditing.content}
                            onChange={e => setPtEditing({ ...ptEditing, content: e.target.value })}
                            rows={12}
                            className="w-full text-xs font-mono border border-line rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-ring"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => savePolicyTemplate({ title: ptEditing.title, subtitle: ptEditing.subtitle, content: ptEditing.content })}
                            disabled={ptSaving}
                            className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
                          >
                            {ptSaving ? 'Speichern…' : 'Speichern'}
                          </button>
                          <button
                            onClick={() => setPtEditing(null)}
                            className="px-3 py-1.5 text-xs font-medium border border-line rounded-lg text-ink-secondary hover:bg-surface-raised"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-mono text-ink-muted">{tpl.slug}</span>
                            <span className={cn(
                              'text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                              tpl.is_published
                                ? 'bg-success-subtle text-success-text border-success-border'
                                : 'bg-surface-raised text-ink-muted border-line'
                            )}>
                              {tpl.is_published ? '✓ Veröffentlicht' : '○ Entwurf'}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-ink">{tpl.title}</p>
                          <p className="text-xs text-ink-subtle">{tpl.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => togglePtPublished(tpl)}
                            className="px-2.5 py-1 text-[10px] font-medium border border-line rounded-lg text-ink-muted hover:bg-surface-raised"
                          >
                            {tpl.is_published ? 'Verbergen' : 'Veröffentlichen'}
                          </button>
                          <button
                            onClick={() => setPtEditing(tpl)}
                            className="px-2.5 py-1 text-[10px] font-medium bg-primary text-white rounded-lg hover:bg-primary-hover"
                          >
                            Bearbeiten
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Preise & Aktionen tab ────────────────────────────────────────────── */}
      {tab === 'pricing' && (
        <div className="space-y-8 py-6">

          {/* Preiskonfiguration */}
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="text-base font-semibold text-ink mb-1">Preiskonfiguration (Pro)</h2>
            <p className="text-xs text-ink-muted mb-5">Änderungen hier steuern die Anzeige im UpgradeModal. Stripe-Preise manuell synchron halten.</p>
            {priceCfg && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Monatspreis (€)</span>
                  <input type="number" min="1" step="0.01" value={priceCfg.monthly_price}
                    onChange={e => setPriceCfg(c => c ? { ...c, monthly_price: Number(e.target.value) } : c)}
                    className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Jahrespreis (€)</span>
                  <input type="number" min="1" step="0.01" value={priceCfg.yearly_price ?? ''}
                    onChange={e => setPriceCfg(c => c ? { ...c, yearly_price: e.target.value ? Number(e.target.value) : null } : c)}
                    className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Stripe Price-ID (monatlich)</span>
                  <input type="text" value={priceCfg.stripe_price_id ?? ''}
                    onChange={e => setPriceCfg(c => c ? { ...c, stripe_price_id: e.target.value || null } : c)}
                    placeholder="price_..."
                    className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-ink-secondary">Stripe Price-ID (jährlich)</span>
                  <input type="text" value={priceCfg.stripe_price_id_yearly ?? ''}
                    onChange={e => setPriceCfg(c => c ? { ...c, stripe_price_id_yearly: e.target.value || null } : c)}
                    placeholder="price_..."
                    className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring" />
                </label>
              </div>
            )}
            <button onClick={savePriceConfig} disabled={priceSaving || !priceCfg}
              className="mt-4 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50">
              {priceSaving ? 'Wird gespeichert…' : 'Preise speichern'}
            </button>
          </div>

          {/* Aktionen */}
          <div className="bg-white border border-line rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-ink">Aktionen</h2>
                <p className="text-xs text-ink-muted mt-0.5">Aktive Aktion zeigt Badge + Aktionspreis im UpgradeModal.</p>
              </div>
              {promoEditing === null && (
                <button onClick={() => setPromoEditing('')}
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover">
                  + Neue Aktion
                </button>
              )}
            </div>

            {/* Formular */}
            {promoEditing !== null && (
              <div className="border border-line rounded-xl p-4 mb-6 bg-surface-raised space-y-3">
                <p className="text-xs font-semibold text-ink-secondary">{promoEditing ? 'Aktion bearbeiten' : 'Neue Aktion anlegen'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-ink-secondary">Name (intern)</span>
                    <input value={promoForm.name} onChange={e => setPromoForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Launch-Aktion Juli"
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-secondary">Badge-Text (sichtbar)</span>
                    <input value={promoForm.badge_text} onChange={e => setPromoForm(f => ({ ...f, badge_text: e.target.value }))} placeholder="z.B. Launch-Angebot"
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface" />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs text-ink-secondary">Beschreibung (optional, 1 Zeile im Modal)</span>
                    <input value={promoForm.description} onChange={e => setPromoForm(f => ({ ...f, description: e.target.value }))} placeholder="z.B. Nur diese Woche: 40% günstiger"
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-secondary">Aktionspreis monatlich (€)</span>
                    <input type="number" min="0" step="0.01" value={promoForm.promo_price} onChange={e => setPromoForm(f => ({ ...f, promo_price: e.target.value }))}
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-secondary">Aktionspreis jährlich (€, optional)</span>
                    <input type="number" min="0" step="0.01" value={promoForm.promo_price_yearly} onChange={e => setPromoForm(f => ({ ...f, promo_price_yearly: e.target.value }))}
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-secondary">Gültig ab (optional)</span>
                    <input type="date" value={promoForm.valid_from} onChange={e => setPromoForm(f => ({ ...f, valid_from: e.target.value }))}
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-secondary">Gültig bis (optional)</span>
                    <input type="date" value={promoForm.valid_until} onChange={e => setPromoForm(f => ({ ...f, valid_until: e.target.value }))}
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-secondary">Stripe Price-ID monatlich (optional)</span>
                    <input value={promoForm.stripe_price_id} onChange={e => setPromoForm(f => ({ ...f, stripe_price_id: e.target.value }))} placeholder="price_..."
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface bg-surface" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-ink-secondary">Stripe Price-ID jährlich (optional)</span>
                    <input value={promoForm.stripe_price_id_yearly} onChange={e => setPromoForm(f => ({ ...f, stripe_price_id_yearly: e.target.value }))} placeholder="price_..."
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-ring bg-surface bg-surface" />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-xs text-ink-secondary cursor-pointer">
                  <input type="checkbox" checked={promoForm.is_active} onChange={e => setPromoForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="rounded border-line-strong" />
                  Sofort aktiv schalten
                </label>
                <div className="flex gap-2 pt-1">
                  <button onClick={savePromo} disabled={promoSaving || !promoForm.name || !promoForm.badge_text || !promoForm.promo_price}
                    className="px-4 py-2 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50">
                    {promoSaving ? 'Wird gespeichert…' : 'Speichern'}
                  </button>
                  <button onClick={() => { setPromoEditing(null); setPromoForm({ name: '', badge_text: '', description: '', promo_price: '', promo_price_yearly: '', valid_from: '', valid_until: '', stripe_price_id: '', stripe_price_id_yearly: '', is_active: false }) }}
                    className="px-4 py-2 text-xs font-medium border border-line rounded-lg text-ink-secondary hover:bg-surface-raised">
                    Abbrechen
                  </button>
                </div>
              </div>
            )}

            {/* Aktionsliste */}
            <div className="space-y-3">
              {promotions.length === 0 && <p className="text-sm text-ink-muted">Noch keine Aktionen angelegt.</p>}
              {promotions.map(p => (
                <div key={p.id} className={cn('border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3', p.is_active ? 'border-warning-border bg-warning-subtle' : 'border-line')}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">{p.name}</span>
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border', p.is_active ? 'bg-warning-border/20 text-warning-text border-warning-border' : 'bg-surface-raised text-ink-muted border-line')}>
                        {p.is_active ? '✦ Aktiv' : '○ Inaktiv'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">Badge: &ldquo;{p.badge_text}&rdquo; · Aktionspreis: €{p.promo_price}/Monat{p.promo_price_yearly ? ` · €${p.promo_price_yearly}/Jahr` : ''}</p>
                    {(p.valid_from || p.valid_until) && (
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {p.valid_from ? `ab ${new Date(p.valid_from).toLocaleDateString('de-DE')}` : ''}
                        {p.valid_from && p.valid_until ? ' · ' : ''}
                        {p.valid_until ? `bis ${new Date(p.valid_until).toLocaleDateString('de-DE')}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => togglePromoActive(p.id, !p.is_active)}
                      className={cn('px-2.5 py-1 text-[10px] font-medium border rounded-lg', p.is_active ? 'border-warning-border text-warning-text hover:opacity-80' : 'border-line text-ink-muted hover:bg-surface-raised')}>
                      {p.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <button onClick={() => editPromo(p)}
                      className="px-2.5 py-1 text-[10px] font-medium bg-primary text-white rounded-lg hover:bg-primary-hover">
                      Bearbeiten
                    </button>
                    <button onClick={() => deletePromo(p.id)}
                      className="px-2.5 py-1 text-[10px] font-medium border border-error-border text-error-text rounded-lg hover:bg-error-subtle">
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ─── App-Settings Tab ─────────────────────────────────────────────────── */}
      {tab === 'app_settings' && (
        <div className="space-y-8 py-6">
          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="text-base font-semibold text-ink mb-1">AI-Nutzungslimits</h2>
            <p className="text-xs text-ink-muted mb-5">Max. AI-Calls pro Tag je Tier. Wirksam nach nächstem Cold Start der Serverinstanz.</p>
            {appSettings && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                  ['ai_limit_free', 'Free (Explorer)'] as const,
                  ['ai_limit_pro', 'Pro (Professional)'] as const,
                  ['ai_limit_enterprise', 'Enterprise'] as const,
                ]).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-xs font-medium text-ink-secondary">{label}</span>
                    <input
                      type="number" min="0" max="1000" step="1"
                      value={appSettings[key]}
                      onChange={e => setAppSettings(s => s ? { ...s, [key]: Number(e.target.value) } : s)}
                      className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-line rounded-xl p-6">
            <h2 className="text-base font-semibold text-ink mb-1">Stripe Grace-Period</h2>
            <p className="text-xs text-ink-muted mb-5">Tage bis Downgrade nach fehlgeschlagener Zahlung. 0 = sofortiger Downgrade.</p>
            {appSettings && (
              <label className="block max-w-xs">
                <span className="text-xs font-medium text-ink-secondary">Grace-Period (Tage)</span>
                <input
                  type="number" min="0" max="90" step="1"
                  value={appSettings.stripe_grace_period_days}
                  onChange={e => setAppSettings(s => s ? { ...s, stripe_grace_period_days: Number(e.target.value) } : s)}
                  className="mt-1 w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring"
                />
              </label>
            )}
          </div>

          <div className="border border-warning-border bg-warning-subtle rounded-xl p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-warning-text">KI Direct-API Fallback</h2>
                  {appSettings?.ai_direct_fallback === 1 && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-400 text-white whitespace-nowrap">Aktiv (Nicht-EU)</span>
                  )}
                </div>
                <p className="text-xs text-warning-text">Direct API = keine vertragliche EU-Datenresidenz. Nur als temporärer Fallback aktivieren, solange Bedrock nicht verfügbar ist.</p>
              </div>
              {appSettings && (
                <button
                  type="button"
                  onClick={() => setAppSettings(s => s ? { ...s, ai_direct_fallback: s.ai_direct_fallback === 1 ? 0 : 1 } : s)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap',
                    appSettings.ai_direct_fallback === 1
                      ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                      : 'bg-surface text-ink-secondary border-line hover:bg-surface-raised'
                  )}
                >
                  {appSettings.ai_direct_fallback === 1 ? 'Deaktivieren' : 'Aktivieren'}
                </button>
              )}
            </div>
            {/* Key-Status — nur nach dem Laden anzeigen */}
            {aiConfig && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium', aiConfig.hasAnthropicKey ? 'bg-success-subtle text-success-text' : 'bg-error-subtle text-error-text border border-error-border')}>
                  <span>{aiConfig.hasAnthropicKey ? '✓' : '✗'}</span>
                  <span>ANTHROPIC_API_KEY {aiConfig.hasAnthropicKey ? 'gesetzt' : 'fehlt'}</span>
                </div>
                <div className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium', aiConfig.hasBedrockKeys ? 'bg-success-subtle text-success-text' : 'bg-error-subtle text-error-text border border-error-border')}>
                  <span>{aiConfig.hasBedrockKeys ? '✓' : '✗'}</span>
                  <span>AWS Bedrock Keys {aiConfig.hasBedrockKeys ? 'gesetzt' : 'fehlen'}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium bg-surface-raised text-ink-secondary">
                  <span>Region: {aiConfig.bedrockRegion}</span>
                </div>
              </div>
            )}
            {appSettings?.ai_direct_fallback === 1 && aiConfig && !aiConfig.hasAnthropicKey && (
              <p className="text-xs font-semibold text-error-text bg-error-subtle border border-error-border rounded-lg px-3 py-2">
                ⚠ Fallback aktiv, aber ANTHROPIC_API_KEY ist nicht konfiguriert — KI-Analyse schlägt trotz aktivem Toggle fehl (FALLBACK_NO_KEY).
              </p>
            )}
            {/* Modell-IDs konfigurieren */}
            {appSettings && (
              <div className="border-t border-warning-border pt-3 space-y-2">
                <p className="text-[11px] font-semibold text-warning-text uppercase tracking-wide">Modell-IDs (Priorität: Env-Var &gt; DB &gt; Code-Default)</p>
                <div className="space-y-2">
                  {([
                    { key: 'ai_model_bedrock_haiku',   label: 'Bedrock Haiku (EU Inference Profile ID)' },
                    { key: 'ai_model_bedrock_sonnet',  label: 'Bedrock Sonnet (EU Inference Profile ID)' },
                    { key: 'ai_model_direct_fallback', label: 'Direct Fallback (Anthropic API Modell-ID)' },
                  ] as const).map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-[10px] text-warning-text mb-0.5">{label}</label>
                      <input
                        type="text"
                        value={appSettings[key]}
                        onChange={e => setAppSettings(s => s ? { ...s, [key]: e.target.value } : s)}
                        className="w-full text-xs font-mono border border-warning-border rounded-lg px-2 py-1.5 bg-surface focus:outline-none focus:ring-2 focus:ring-warning-border"
                        placeholder="z.B. eu.anthropic.claude-haiku-4-5-20251001-v1:0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-line rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-ink mb-1">{t('cacheCardTitle')}</h2>
                <p className="text-xs text-ink-muted">{t('cacheCardDesc')}</p>
              </div>
              <button
                type="button"
                onClick={handleCachePurge}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border border-line bg-surface text-ink-secondary hover:bg-surface-raised transition-colors whitespace-nowrap"
              >
                {t('cachePurgeBtn')}
              </button>
            </div>
            {cachePurgeMsg && (
              <p className="mb-3 text-xs font-medium text-success-text bg-success-subtle border border-success-border rounded-lg px-3 py-2">{cachePurgeMsg}</p>
            )}
            {!cacheStats ? (
              <p className="text-xs text-ink-subtle">{t('cacheNoData')}</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    ['cacheHitRateToday', cacheStats.hitRateToday !== null ? `${cacheStats.hitRateToday}%` : '—'],
                    ['cacheHitRate7d',    cacheStats.hitRate7d    !== null ? `${cacheStats.hitRate7d}%`    : '—'],
                    ['cacheActiveEntries',  String(cacheStats.active)],
                    ['cacheExpiredEntries', String(cacheStats.expired)],
                  ] as const).map(([key, val]) => (
                    <div key={key} className="bg-surface-raised rounded-lg p-3 text-center">
                      <p className="text-[10px] text-ink-muted uppercase tracking-wide mb-1">{t(key)}</p>
                      <p className="text-xl font-bold text-ink">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-ink-secondary">
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">{t('cacheEstimatedSize')}:</span>
                    <span className="font-medium">{cacheStats.estimatedBytes !== null ? `${(cacheStats.estimatedBytes / 1024).toFixed(1)} KB` : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">{t('cacheOldestEntry')}:</span>
                    <span className="font-medium">{cacheStats.oldest ? new Date(cacheStats.oldest).toLocaleDateString('de-DE') : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted">{t('cacheNewestEntry')}:</span>
                    <span className="font-medium">{cacheStats.newest ? new Date(cacheStats.newest).toLocaleDateString('de-DE') : '—'}</span>
                  </div>
                </div>
                {cacheStats.topModules.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wide mb-2">{t('cacheTopModules')}</p>
                    <div className="space-y-1">
                      {cacheStats.topModules.map(m => (
                        <div key={m.module} className="flex items-center gap-2 text-xs">
                          <span className="w-24 font-medium text-ink-secondary capitalize">{m.module}</span>
                          <div className="flex-1 bg-surface-raised rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-success-border rounded-full"
                              style={{ width: `${m.total > 0 ? Math.round((m.hits / m.total) * 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-ink-muted w-16 text-right">{m.hits}H / {m.misses}M</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={saveAppSettings}
            disabled={appSettingsSaving || !appSettings}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
          >
            {appSettingsSaving ? 'Wird gespeichert…' : 'Einstellungen speichern'}
          </button>
        </div>
      )}
    </div>
  )
}
