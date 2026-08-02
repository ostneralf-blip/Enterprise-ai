'use client'
import { useState, useEffect, useCallback } from 'react'
import { AlertBox } from '@/components/shared/AlertBox'
import { BLOG_STATUS_LABELS, type BlogStatus } from '@/lib/blog-status'

// Admin-CRUD für Blogbeiträge. Bearbeitet DE+EN gemeinsam; die API
// (/api/admin/blog) kapselt das locale-per-row-Modell der Tabellen.
//
// Der Redaktionsstatus ist der Kern dieses Panels: Ein Beitrag wird angelegt,
// geprüft und erst mit namentlichem Freigabevermerk veröffentlicht. Das ist der
// Nachweis, den die Ausnahme in Art. 50 Abs. 4 EU AI Act für KI-unterstützt
// erstellte Texte verlangt — ohne ihn müsste jeder Beitrag sichtbar als
// KI-generiert gekennzeichnet werden.

interface LocaleText {
  category: string; eyebrow: string; title: string; meta_description: string; lead: string
}
interface SectionText {
  heading: string; paragraphs: string[]; bullets: string[]
  callout_tag: string | null; callout_body: string | null
}
interface TranslationRow extends LocaleText { locale: 'de' | 'en' }
interface SectionRow extends SectionText { locale: 'de' | 'en'; position: number }

interface PostRow {
  slug: string
  status: BlogStatus
  published_at: string | null
  content_updated_at: string | null
  reading_minutes: number
  ai_assisted: boolean
  reviewed_by: string | null
  reviewed_at: string | null
  cta_tool_slug: string | null
  related_guide_slugs: string[] | null
  blog_post_translations: TranslationRow[] | null
  blog_post_sections: SectionRow[] | null
}

const emptyLocale = (): LocaleText => ({ category: '', eyebrow: '', title: '', meta_description: '', lead: '' })
const emptySection = (): { de: SectionText; en: SectionText } => ({
  de: { heading: '', paragraphs: [''], bullets: [], callout_tag: null, callout_body: null },
  en: { heading: '', paragraphs: [''], bullets: [], callout_tag: null, callout_body: null },
})
const emptyForm = () => ({
  slug: '', reading_minutes: 5, ai_assisted: false,
  cta_tool_slug: '', related_guide_slugs: '', content_updated_at: '',
  de: emptyLocale(), en: emptyLocale(),
  sections: [emptySection()],
})

const inputCls = 'w-full border border-line-strong rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-ring'
const labelCls = 'block text-[11px] font-medium text-ink-secondary mb-0.5'

const STATUS_STYLE: Record<BlogStatus, string> = {
  draft:     'bg-surface-input text-ink-secondary',
  in_review: 'bg-warning-subtle text-warning-text border border-warning-border',
  published: 'bg-success-subtle text-success-text border border-success-border',
  archived:  'bg-surface-input text-ink-muted',
}

export function BlogPanel() {
  const [posts, setPosts] = useState<PostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [editing, setEditing] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reviewer, setReviewer] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Laden fehlgeschlagen')
      setPosts(json.posts ?? [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initiales Laden setzt bewusst State im Effect (Ladeindikator) — gleiche
    // Ausnahme wie im ComplianceRegulationsPanel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const resetForm = () => { setForm(emptyForm()); setEditing(null); setShowForm(false) }

  function startEdit(post: PostRow) {
    const tr = (loc: 'de' | 'en'): LocaleText =>
      post.blog_post_translations?.find(t => t.locale === loc) ?? emptyLocale()
    const positions = [...new Set((post.blog_post_sections ?? []).map(s => s.position))].sort((a, b) => a - b)
    const sections = positions.map(pos => {
      const pick = (loc: 'de' | 'en') => {
        const s = post.blog_post_sections?.find(x => x.position === pos && x.locale === loc)
        return s
          ? { heading: s.heading, paragraphs: s.paragraphs ?? [''], bullets: s.bullets ?? [], callout_tag: s.callout_tag, callout_body: s.callout_body }
          : emptySection().de
      }
      return { de: pick('de'), en: pick('en') }
    })
    setForm({
      slug: post.slug,
      reading_minutes: post.reading_minutes,
      ai_assisted: post.ai_assisted,
      cta_tool_slug: post.cta_tool_slug ?? '',
      related_guide_slugs: (post.related_guide_slugs ?? []).join(', '),
      content_updated_at: post.content_updated_at ?? '',
      de: tr('de'), en: tr('en'),
      sections: sections.length ? sections : [emptySection()],
    })
    setEditing(post.slug)
    setShowForm(true)
  }

  async function save() {
    setBusy(true); setError(null); setNotice(null)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: form.slug.trim(),
          reading_minutes: Number(form.reading_minutes) || 5,
          ai_assisted: form.ai_assisted,
          cta_tool_slug: form.cta_tool_slug.trim() || null,
          related_guide_slugs: form.related_guide_slugs.split(',').map(s => s.trim()).filter(Boolean),
          content_updated_at: form.content_updated_at.trim() || null,
          de: form.de, en: form.en,
          sections: form.sections.map(s => ({
            de: { ...s.de, paragraphs: s.de.paragraphs.filter(Boolean), bullets: s.de.bullets.filter(Boolean) },
            en: { ...s.en, paragraphs: s.en.paragraphs.filter(Boolean), bullets: s.en.bullets.filter(Boolean) },
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Speichern fehlgeschlagen')
      setNotice(`Beitrag „${form.slug}" gespeichert. Der Status bleibt unverändert — die Freigabe erfolgt separat.`)
      resetForm()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally { setBusy(false) }
  }

  async function changeStatus(slug: string, status: BlogStatus) {
    if (status === 'published' && !reviewer.trim()) {
      setError('Bitte zuerst den Namen der prüfenden Person eintragen — ohne ihn ist keine Freigabe möglich.')
      return
    }
    setBusy(true); setError(null); setNotice(null)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, status, reviewed_by: status === 'published' ? reviewer.trim() : undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Statuswechsel fehlgeschlagen')
      setNotice(
        status === 'published'
          ? `„${slug}" ist freigegeben und öffentlich sichtbar. Freigabe dokumentiert für ${reviewer.trim()}.`
          : `Status von „${slug}" geändert: ${BLOG_STATUS_LABELS[status].de}.`
      )
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Statuswechsel fehlgeschlagen')
    } finally { setBusy(false) }
  }

  async function remove(slug: string) {
    if (!confirm(`Beitrag „${slug}" endgültig löschen? Zum bloßen Ausblenden genügt „Deaktivieren".`)) return
    setBusy(true); setError(null)
    try {
      const res = await fetch(`/api/admin/blog?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Löschen fehlgeschlagen')
      setNotice(`Beitrag „${slug}" gelöscht.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen')
    } finally { setBusy(false) }
  }

  const updateSection = (i: number, loc: 'de' | 'en', patch: Partial<SectionText>) =>
    setForm(f => ({ ...f, sections: f.sections.map((s, idx) => idx === i ? { ...s, [loc]: { ...s[loc], ...patch } } : s) }))

  return (
    <div className="space-y-5">
      {error && <AlertBox variant="error">{error}</AlertBox>}
      {/* AlertBox kennt nur info/warning/error — Erfolgsmeldungen laufen über info. */}
      {notice && <AlertBox variant="info">{notice}</AlertBox>}

      <AlertBox variant="info">
        Beiträge werden erst öffentlich, wenn sie mit einem Prüfernamen freigegeben sind.
        Der Vermerk belegt die redaktionelle Verantwortung nach Art. 50 Abs. 4 EU AI Act —
        ohne ihn müsste jeder KI-unterstützt erstellte Beitrag sichtbar als KI-generiert
        gekennzeichnet werden.
      </AlertBox>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className={labelCls} htmlFor="blog-reviewer">Prüfende Person (für Freigaben)</label>
          <input
            id="blog-reviewer"
            className={inputCls}
            value={reviewer}
            onChange={e => setReviewer(e.target.value)}
            placeholder="Vor- und Nachname"
          />
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setEditing(null); setShowForm(v => !v) }}
          className="border border-line-strong rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-surface-raised transition-colors whitespace-nowrap"
        >
          {showForm && !editing ? 'Formular schließen' : 'Neuer Beitrag'}
        </button>
      </div>

      {showForm && (
        <div className="border border-line rounded-xl p-4 space-y-4 bg-surface">
          <h3 className="font-semibold text-sm">{editing ? `Beitrag bearbeiten: ${editing}` : 'Neuen Beitrag anlegen'}</h3>

          <div className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className={labelCls} htmlFor="blog-slug">Slug (URL)</label>
              <input id="blog-slug" className={inputCls} value={form.slug} disabled={!!editing}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="ki-governance-modelle" />
            </div>
            <div>
              <label className={labelCls} htmlFor="blog-minutes">Lesedauer (Min.)</label>
              <input id="blog-minutes" type="number" min={1} max={120} className={inputCls} value={form.reading_minutes}
                onChange={e => setForm(f => ({ ...f, reading_minutes: Number(e.target.value) }))} />
            </div>
            <div>
              <label className={labelCls} htmlFor="blog-cta">CTA-Tool (Slug)</label>
              <input id="blog-cta" className={inputCls} value={form.cta_tool_slug}
                onChange={e => setForm(f => ({ ...f, cta_tool_slug: e.target.value }))} placeholder="governance-check" />
            </div>
            <div>
              <label className={labelCls} htmlFor="blog-guides">Passende Leitfäden (Slugs, Komma)</label>
              <input id="blog-guides" className={inputCls} value={form.related_guide_slugs}
                onChange={e => setForm(f => ({ ...f, related_guide_slugs: e.target.value }))} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.ai_assisted}
              onChange={e => setForm(f => ({ ...f, ai_assisted: e.target.checked }))} />
            <span>KI-unterstützt entworfen <span className="text-ink-muted text-xs">(erzeugt den Transparenzhinweis am Beitrag)</span></span>
          </label>

          {(['de', 'en'] as const).map(loc => (
            <fieldset key={loc} className="border border-line rounded-lg p-3">
              <legend className="text-xs font-semibold px-1">{loc === 'de' ? 'Deutsch' : 'Englisch'}</legend>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor={`cat-${loc}`}>Kategorie</label>
                  <input id={`cat-${loc}`} className={inputCls} value={form[loc].category}
                    onChange={e => setForm(f => ({ ...f, [loc]: { ...f[loc], category: e.target.value } }))} />
                </div>
                <div>
                  <label className={labelCls} htmlFor={`eye-${loc}`}>Eyebrow</label>
                  <input id={`eye-${loc}`} className={inputCls} value={form[loc].eyebrow}
                    onChange={e => setForm(f => ({ ...f, [loc]: { ...f[loc], eyebrow: e.target.value } }))} />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelCls} htmlFor={`title-${loc}`}>Titel</label>
                <input id={`title-${loc}`} className={inputCls} value={form[loc].title}
                  onChange={e => setForm(f => ({ ...f, [loc]: { ...f[loc], title: e.target.value } }))} />
              </div>
              <div className="mt-3">
                <label className={labelCls} htmlFor={`meta-${loc}`}>Meta-Beschreibung</label>
                <textarea id={`meta-${loc}`} rows={2} className={inputCls} value={form[loc].meta_description}
                  onChange={e => setForm(f => ({ ...f, [loc]: { ...f[loc], meta_description: e.target.value } }))} />
              </div>
              <div className="mt-3">
                <label className={labelCls} htmlFor={`lead-${loc}`}>Anreißer</label>
                <textarea id={`lead-${loc}`} rows={3} className={inputCls} value={form[loc].lead}
                  onChange={e => setForm(f => ({ ...f, [loc]: { ...f[loc], lead: e.target.value } }))} />
              </div>
            </fieldset>
          ))}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Abschnitte ({form.sections.length})</h4>
              <button onClick={() => setForm(f => ({ ...f, sections: [...f.sections, emptySection()] }))}
                className="text-primary text-xs font-medium hover:underline">+ Abschnitt</button>
            </div>
            {form.sections.map((section, i) => (
              <div key={i} className="border border-line rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-muted">Abschnitt {i + 1}</span>
                  <div className="flex gap-2">
                    {i > 0 && (
                      <button onClick={() => setForm(f => { const s = [...f.sections]; [s[i - 1], s[i]] = [s[i], s[i - 1]]; return { ...f, sections: s } })}
                        className="text-xs text-ink-muted hover:text-ink">↑</button>
                    )}
                    {i < form.sections.length - 1 && (
                      <button onClick={() => setForm(f => { const s = [...f.sections]; [s[i + 1], s[i]] = [s[i], s[i + 1]]; return { ...f, sections: s } })}
                        className="text-xs text-ink-muted hover:text-ink">↓</button>
                    )}
                    {form.sections.length > 1 && (
                      <button onClick={() => setForm(f => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }))}
                        className="text-xs text-error-text hover:underline">entfernen</button>
                    )}
                  </div>
                </div>
                {(['de', 'en'] as const).map(loc => (
                  <div key={loc} className="grid gap-2">
                    <label className={labelCls}>{loc === 'de' ? 'Deutsch' : 'Englisch'} — Überschrift</label>
                    <input className={inputCls} value={section[loc].heading}
                      onChange={e => updateSection(i, loc, { heading: e.target.value })} />
                    <label className={labelCls}>Absätze (eine Leerzeile trennt)</label>
                    <textarea rows={4} className={inputCls} value={section[loc].paragraphs.join('\n\n')}
                      onChange={e => updateSection(i, loc, { paragraphs: e.target.value.split(/\n\s*\n/) })} />
                    <label className={labelCls}>Aufzählung (eine Zeile je Punkt, optional)</label>
                    <textarea rows={2} className={inputCls} value={section[loc].bullets.join('\n')}
                      onChange={e => updateSection(i, loc, { bullets: e.target.value.split('\n').filter(Boolean) })} />
                    <div className="grid sm:grid-cols-3 gap-2">
                      <input className={inputCls} placeholder="Kasten-Label (optional)" value={section[loc].callout_tag ?? ''}
                        onChange={e => updateSection(i, loc, { callout_tag: e.target.value || null })} />
                      <textarea rows={2} className={`${inputCls} sm:col-span-2`} placeholder="Kasten-Text (optional)"
                        value={section[loc].callout_body ?? ''}
                        onChange={e => updateSection(i, loc, { callout_body: e.target.value || null })} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={busy || !form.slug.trim()}
              className="bg-primary hover:bg-primary-hover text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors">
              {busy ? 'Speichern…' : 'Speichern'}
            </button>
            <button onClick={resetForm} className="border border-line-strong rounded-lg px-4 py-2 text-sm hover:bg-surface-raised transition-colors">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-muted">Beiträge werden geladen…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-ink-muted">Noch keine Beiträge angelegt.</p>
      ) : (
        <div className="border border-line rounded-xl overflow-x-auto">
          <table className="w-full text-sm" aria-label="Blogbeiträge">
            <thead className="bg-surface-raised text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 text-left">Beitrag</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Freigabe</th>
                <th className="px-4 py-3 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => {
                const de = post.blog_post_translations?.find(t => t.locale === 'de')
                return (
                  <tr key={post.slug} className="border-t border-line align-top">
                    <td className="px-4 py-3 min-w-0">
                      <p className="font-medium text-ink leading-snug">{de?.title ?? post.slug}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        /{post.slug}
                        {post.ai_assisted && <span className="ml-2 text-ai">KI-unterstützt</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[post.status]}`}>
                        {BLOG_STATUS_LABELS[post.status].de}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted hidden md:table-cell">
                      {post.reviewed_by
                        ? <>{post.reviewed_by}<br />{post.reviewed_at ? new Date(post.reviewed_at).toLocaleDateString('de-DE') : ''}</>
                        : <span className="text-warning-text">noch nicht geprüft</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => startEdit(post)} disabled={busy}
                          className="text-xs border border-line-strong rounded-lg px-2.5 py-1 hover:bg-surface-raised transition-colors disabled:opacity-50">
                          Bearbeiten
                        </button>
                        {post.status !== 'published' && (
                          <button onClick={() => changeStatus(post.slug, 'published')} disabled={busy}
                            className="text-xs bg-primary hover:bg-primary-hover text-white rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50">
                            Freigeben
                          </button>
                        )}
                        {post.status === 'published' && (
                          <button onClick={() => changeStatus(post.slug, 'archived')} disabled={busy}
                            className="text-xs border border-line-strong rounded-lg px-2.5 py-1 hover:bg-surface-raised transition-colors disabled:opacity-50">
                            Deaktivieren
                          </button>
                        )}
                        {post.status !== 'in_review' && post.status !== 'published' && (
                          <button onClick={() => changeStatus(post.slug, 'in_review')} disabled={busy}
                            className="text-xs border border-line-strong rounded-lg px-2.5 py-1 hover:bg-surface-raised transition-colors disabled:opacity-50">
                            Zur Prüfung
                          </button>
                        )}
                        <button onClick={() => remove(post.slug)} disabled={busy}
                          className="text-xs text-error-text hover:underline px-1 disabled:opacity-50">
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
