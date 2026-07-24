# Diagramm-Stil (Phase 1 MVP) + Geteilte Links — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nutzer kann den Architektur-Diagramm-Stil per Persona-Preset wählen (Phase-1: Bebauungsplan, Arten „Schichten" + „Capability", theme-sichere Reifegrad-Pips, persistiert); und alle aktiven Share-Links in einer Übersicht sehen + widerrufen.

**Architecture:** Feature 2 ist unabhängig (Share-Übersicht + DELETE-Endpoint). Feature 1 Phase 1 fügt eine `DiagramStyle`-Präferenz (`user_preferences.diagram_style` JSONB) + einen Dispatcher `DiagramView` hinzu, der je `art` entweder die bestehende `EamMap` (als `LayeredView`) oder eine neue `CapabilityView` (Portfolio, aus `use_cases` abgeleitet) rendert. Reifegrad wird theme-sicher über `MaturityPips` (Füllgrad, max. 1 Akzent) dargestellt.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (RLS), next-intl (DE Sie-Form + EN), Jest + jest-axe, Tailwind + semantische Tokens.

**Konventionen (verbindlich, aus CLAUDE.md):** Jede neue UI bilingual (`t()`, Keys in `messages/de.json` UND `messages/en.json`). Zod für Inputs. Server-seitiges Tier-/Auth-Gating. tsc/eslint (`--max-warnings 0`)/build/`npm run test` grün vor jedem Commit. Baseline-Vergleich der Tests: aktuell **27 failed suites / 10 failed tests** (vorbestehende next-intl-ESM-Ladefehler) — eine Regression liegt vor, wenn sich diese Zahlen erhöhen.

---

## Dateistruktur

**Feature 2 — Geteilte Links**
- Modify: `src/app/api/share/route.ts` — `DELETE`-Handler (Widerruf eigener Link).
- Create: `src/app/[locale]/(dashboard)/geteilte-links/page.tsx` — Server-Seite (lädt Links).
- Create: `src/app/[locale]/(dashboard)/geteilte-links/SharedLinksClient.tsx` — Tabelle + Widerruf.
- Modify: `src/app/[locale]/(dashboard)/settings/SettingsPageClient.tsx` — Karte „Geteilte Links" → Link.
- Create: `src/__tests__/security/share-delete-security.test.ts`.

**Feature 1 — Diagramm-Stil (Phase 1)**
- Create: `supabase/migrations/<ts>_user_preferences_diagram_style.sql` — `diagram_style JSONB`.
- Create: `src/config/diagram-styles.ts` — `DiagramStyle`-Typ, `PERSONA_PRESETS`, `resolvePreset`, `DEFAULT_STYLE`.
- Create: `src/lib/architecture/capability.ts` — `deriveCapabilityMap(useCases)` (Reifegrad-Ableitung).
- Modify: `src/app/api/preferences/route.ts` — `diagram_style` in Schema/Select/Upsert.
- Create: `src/components/modules/architecture/diagram/MaturityPips.tsx`.
- Create: `src/components/modules/architecture/diagram/CapabilityView.tsx`.
- Create: `src/components/modules/architecture/diagram/DiagramView.tsx` (Dispatcher).
- Create: `src/components/modules/architecture/diagram/DiagramStyleSwitcher.tsx`.
- Modify: `src/app/[locale]/(dashboard)/architecture/page.tsx` — `use_cases` (Portfolio) + `diagram_style` laden.
- Modify: `src/app/[locale]/(dashboard)/architecture/ArchitecturePageClient.tsx` — `DiagramView` + Switcher einbinden, Präferenz speichern.
- Modify: `src/app/[locale]/(dashboard)/settings/SettingsPageClient.tsx` — Karte „Architektur-Diagramm" → Preset-Wähler.
- Delete: `src/components/modules/ArchitectureDiagram.tsx` (verwaist).
- Modify: `messages/de.json`, `messages/en.json` — neue Keys.
- Create: `src/__tests__/unit/diagram-styles.test.ts`, `src/__tests__/unit/capability-map.test.ts`.

---

# FEATURE 2 — Geteilte Links

## Task F2-1: DELETE-Endpoint (Widerruf eigener Share-Link)

**Files:**
- Modify: `src/app/api/share/route.ts` (Handler `DELETE` ergänzen)
- Test: `src/__tests__/security/share-delete-security.test.ts`

- [ ] **Step 1: Statischer Security-Test**

```ts
// src/__tests__/security/share-delete-security.test.ts
import { readFileSync } from 'fs'
import { join } from 'path'

const route = readFileSync(join(process.cwd(), 'src/app/api/share/route.ts'), 'utf-8')

describe('Security: Share DELETE (#Geteilte Links)', () => {
  it('exportiert einen DELETE-Handler', () => {
    expect(route).toMatch(/export async function DELETE/)
  })
  it('prüft Auth (401) und scoped auf user_id', () => {
    const del = route.slice(route.indexOf('export async function DELETE'))
    expect(del).toContain('auth.getUser()')
    expect(del).toContain("status: 401")
    expect(del).toContain(".eq('user_id', user.id)")
  })
  it('validiert die id als UUID (Zod)', () => {
    const del = route.slice(route.indexOf('export async function DELETE'))
    expect(del).toMatch(/uuid\(\)/)
  })
})
```

- [ ] **Step 2: Test läuft rot**

Run: `npx jest share-delete-security`
Expected: FAIL (kein DELETE-Handler).

- [ ] **Step 3: DELETE-Handler implementieren** (ans Ende von `src/app/api/share/route.ts` anfügen)

```ts
// Widerruf: harte Löschung des eigenen Links (RLS „share_own" + expliziter user_id-Filter).
// Danach greift der Link nicht mehr und verschwindet aus der Übersicht.
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const { error } = await supabase
    .from('share_links')
    .delete()
    .eq('id', parsed.data)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Test grün**

Run: `npx jest share-delete-security`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/share/route.ts src/__tests__/security/share-delete-security.test.ts
git commit -m "feat(share): DELETE-Endpoint zum Widerruf eigener Share-Links"
```

## Task F2-2: Geteilte-Links-Übersichtsseite

**Files:**
- Create: `src/app/[locale]/(dashboard)/geteilte-links/page.tsx`
- Create: `src/app/[locale]/(dashboard)/geteilte-links/SharedLinksClient.tsx`
- Modify: `messages/de.json`, `messages/en.json` (Namespace `sharedLinks`)

- [ ] **Step 1: i18n-Keys** — in `messages/de.json` und `messages/en.json` je einen Top-Level-Namespace `"sharedLinks"` ergänzen (Position: alphabetisch nahe `"settings"`). DE (Sie-Form):

```json
"sharedLinks": {
  "title": "Geteilte Links",
  "subtitle": "Alle aktiven Freigabe-Links mit Ablauf und Zugriffen",
  "empty": "Sie haben noch keine Inhalte geteilt.",
  "colModule": "Modul", "colExpires": "Ablauf", "colViews": "Zugriffe",
  "colCreated": "Erstellt", "colAction": "Aktion",
  "never": "unbegrenzt", "expired": "abgelaufen",
  "revoke": "Widerrufen", "revoking": "Wird widerrufen…",
  "openLink": "Link öffnen", "confirmRevoke": "Diesen Link widerrufen? Er funktioniert danach nicht mehr."
}
```

EN-Werte analog (Shared links / Revoke / expired / unlimited / …).

- [ ] **Step 2: Server-Seite** `src/app/[locale]/(dashboard)/geteilte-links/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/shared/PageHeader'
import { SharedLinksClient, type ShareLinkRow } from './SharedLinksClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Geteilte Links' }

export default async function GeteilteLinksPage() {
  const [supabase, t] = await Promise.all([createClient(), getTranslations('sharedLinks')])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('share_links')
    .select('id, token, module, entity_id, expires_at, view_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader title={t('title')} description={t('subtitle')} />
      <SharedLinksClient initialLinks={(data ?? []) as ShareLinkRow[]} />
    </div>
  )
}
```

- [ ] **Step 3: Client** `src/app/[locale]/(dashboard)/geteilte-links/SharedLinksClient.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { AlertBox } from '@/components/shared/AlertBox'

export interface ShareLinkRow {
  id: string; token: string; module: string; entity_id: string
  expires_at: string | null; view_count: number; created_at: string
}

export function SharedLinksClient({ initialLinks }: { initialLinks: ShareLinkRow[] }) {
  const t = useTranslations('sharedLinks')
  const locale = useLocale()
  const [links, setLinks] = useState(initialLinks)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fmt = (d: string) => new Date(d).toLocaleDateString(locale === 'en' ? 'en-GB' : 'de-DE',
    { day: '2-digit', month: '2-digit', year: 'numeric' })
  const isExpired = (l: ShareLinkRow) => l.expires_at !== null && new Date(l.expires_at) < new Date()

  const revoke = async (id: string) => {
    if (!confirm(t('confirmRevoke'))) return
    setBusy(id); setError(null)
    const prev = links
    setLinks(ls => ls.filter(l => l.id !== id)) // optimistisch
    try {
      const res = await fetch(`/api/share?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      setLinks(prev); setError('Fehler')
    } finally { setBusy(null) }
  }

  if (links.length === 0) return <p className="text-sm text-ink-muted py-8 text-center">{t('empty')}</p>

  return (
    <div className="space-y-3">
      {error && <AlertBox variant="error">{error}</AlertBox>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs text-ink-muted uppercase">
            <th className="py-2 pr-3">{t('colModule')}</th>
            <th className="py-2 pr-3">{t('colExpires')}</th>
            <th className="py-2 pr-3">{t('colViews')}</th>
            <th className="py-2 pr-3">{t('colCreated')}</th>
            <th className="py-2">{t('colAction')}</th>
          </tr></thead>
          <tbody className="divide-y divide-line-subtle">
            {links.map(l => (
              <tr key={l.id} className={isExpired(l) ? 'opacity-50' : ''}>
                <td className="py-2.5 pr-3 font-medium text-ink capitalize">{l.module}</td>
                <td className="py-2.5 pr-3 text-ink-secondary">
                  {l.expires_at ? fmt(l.expires_at) : t('never')}
                  {isExpired(l) && <span className="ml-1.5 text-xs">({t('expired')})</span>}
                </td>
                <td className="py-2.5 pr-3 text-ink-secondary">{l.view_count}</td>
                <td className="py-2.5 pr-3 text-ink-muted">{fmt(l.created_at)}</td>
                <td className="py-2.5">
                  <a href={`/share/${l.token}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mr-3">{t('openLink')} ↗</a>
                  <button onClick={() => revoke(l.id)} disabled={busy === l.id}
                    className="text-xs font-medium text-error-text hover:underline disabled:opacity-50">
                    {busy === l.id ? t('revoking') : t('revoke')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: tsc + Build**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -iE "Compiled successfully|error TS"`
Expected: „Compiled successfully".

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(dashboard)/geteilte-links" messages/de.json messages/en.json
git commit -m "feat(share): Geteilte-Links-Übersicht mit Widerruf"
```

## Task F2-3: Settings-Karte „Geteilte Links" verlinken

**Files:** Modify: `src/app/[locale]/(dashboard)/settings/SettingsPageClient.tsx`

- [ ] **Step 1: Karte in Link umbauen** — den bestehenden `<section aria-labelledby="shared-heading" … opacity-60>`-Block ersetzen durch einen anklickbaren Link ohne „Demnächst":

```tsx
<Link href="/geteilte-links" aria-labelledby="shared-heading"
  className="block bg-surface border border-line rounded-2xl p-4 sm:p-6 hover:border-line-strong transition-colors">
  <h2 id="shared-heading" className="text-base sm:text-lg font-semibold text-ink mb-1">{t('sharedLinksSection')}</h2>
  <p className="text-sm text-ink-subtle">{t('sharedLinksDesc')}</p>
</Link>
```

(`Link` ist in SettingsPageClient bereits importiert.)

- [ ] **Step 2: tsc**

Run: `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(dashboard)/settings/SettingsPageClient.tsx"
git commit -m "feat(share): Settings-Karte auf Geteilte-Links-Seite verlinken"
```

---

# FEATURE 1 — Diagramm-Stil (Phase 1 MVP)

## Task 1: Migration — diagram_style auf user_preferences

**Files:** Create: `supabase/migrations/<timestamp>_user_preferences_diagram_style.sql`

- [ ] **Step 1: Migration erstellen**

Run: `supabase migration new user_preferences_diagram_style`
(Falls die CLI hängt: Datei manuell unter `supabase/migrations/` mit Zeitstempel-Präfix anlegen.)

- [ ] **Step 2: SQL schreiben**

```sql
-- Persistierter Diagramm-Stil je Nutzer (Feature „Architektur-Diagramm").
-- JSONB: { art, connections, maturity, density } bzw. { preset: "<name>" }.
alter table public.user_preferences
  add column if not exists diagram_style jsonb;
```

- [ ] **Step 3: Anwenden + verifizieren**

Run: `supabase db push` und danach `supabase migration list`
Expected: Local + Remote zeigen die neue Migration.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(architecture): user_preferences.diagram_style Spalte"
```

## Task 2: diagram-styles.ts (Typ, Presets, Auflösung)

**Files:**
- Create: `src/config/diagram-styles.ts`
- Test: `src/__tests__/unit/diagram-styles.test.ts`

- [ ] **Step 1: Failing Test**

```ts
// src/__tests__/unit/diagram-styles.test.ts
import { PERSONA_PRESETS, resolvePreset, DEFAULT_STYLE, type DiagramStyle } from '@/config/diagram-styles'

describe('diagram-styles', () => {
  it('Executive-Preset = Capability + Bebauungsplan + sparsam', () => {
    const s = PERSONA_PRESETS.executive.style
    expect(s.art).toBe('capability')
    expect(s.connections).toBe('bebauungsplan')
    expect(s.density).toBe('sparsam')
  })
  it('resolvePreset gibt bei unbekanntem Namen DEFAULT_STYLE zurück', () => {
    expect(resolvePreset('gibtsnicht')).toEqual(DEFAULT_STYLE)
  })
  it('resolvePreset kennt alle vier Persona-Namen', () => {
    for (const key of ['executive','architect','compliance','data'] as const) {
      const r: DiagramStyle = resolvePreset(key)
      expect(r.art).toBeDefined()
    }
  })
})
```

- [ ] **Step 2: Rot** — Run: `npx jest diagram-styles` → FAIL.

- [ ] **Step 3: Implementieren**

```ts
// src/config/diagram-styles.ts
import type { LocaleString } from '@/lib/utils/locale-data'

export type DiagramArt = 'schichten' | 'togaf' | 'datenfluss' | 'capability'
export type DiagramConnections = 'bebauungsplan' | 'uml'
export type DiagramDensity = 'sparsam' | 'detailliert'

export interface DiagramStyle {
  art: DiagramArt
  connections: DiagramConnections
  density: DiagramDensity
}

export interface PersonaPreset {
  key: string
  label: LocaleString
  description: LocaleString
  style: DiagramStyle
}

export const DEFAULT_STYLE: DiagramStyle = { art: 'schichten', connections: 'bebauungsplan', density: 'sparsam' }

export const PERSONA_PRESETS: Record<string, PersonaPreset> = {
  executive: {
    key: 'executive',
    label: { de: 'Executive (CIO/CEO)', en: 'Executive (CIO/CEO)' },
    description: { de: 'Geschäftsfähigkeiten & Reifegrad, neutral', en: 'Business capabilities & maturity, neutral' },
    style: { art: 'capability', connections: 'bebauungsplan', density: 'sparsam' },
  },
  architect: {
    key: 'architect',
    label: { de: 'Enterprise-Architekt', en: 'Enterprise Architect' },
    description: { de: 'Schichten, detailliert', en: 'Layers, detailed' },
    style: { art: 'schichten', connections: 'bebauungsplan', density: 'detailliert' },
  },
  compliance: {
    key: 'compliance',
    label: { de: 'Compliance / Risk', en: 'Compliance / Risk' },
    description: { de: 'Schichten, Konformität je Baustein', en: 'Layers, compliance per block' },
    style: { art: 'schichten', connections: 'bebauungsplan', density: 'sparsam' },
  },
  data: {
    key: 'data',
    label: { de: 'Daten- / ML-Lead', en: 'Data / ML Lead' },
    description: { de: 'Datenfluss (ab Phase 2), detailliert', en: 'Data flow (from phase 2), detailed' },
    style: { art: 'datenfluss', connections: 'bebauungsplan', density: 'detailliert' },
  },
}

// Phase 1: nur 'schichten' + 'capability' haben eigene Renderer; 'togaf'/'datenfluss' fallen auf 'schichten' zurück.
export function renderableArt(art: DiagramArt): DiagramArt {
  return art === 'capability' ? 'capability' : 'schichten'
}

export function resolvePreset(name: string | null | undefined): DiagramStyle {
  if (name && PERSONA_PRESETS[name]) return PERSONA_PRESETS[name].style
  return DEFAULT_STYLE
}
```

- [ ] **Step 4: Grün** — Run: `npx jest diagram-styles` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/diagram-styles.ts src/__tests__/unit/diagram-styles.test.ts
git commit -m "feat(architecture): DiagramStyle-Presets + Auflösung"
```

## Task 3: Capability-Ableitung (deriveCapabilityMap)

**Files:**
- Create: `src/lib/architecture/capability.ts`
- Test: `src/__tests__/unit/capability-map.test.ts`

Reifegrad-Regeln (aus Use-Case-Feldern, ohne neue Daten):
`produktiv` = `governance_result === 'approve'` · `pilot` = `canvas_id !== null` (nicht approved) · `evaluiert` = `governance_result` gesetzt (nicht approve) · sonst `geplant`.

- [ ] **Step 1: Failing Test**

```ts
// src/__tests__/unit/capability-map.test.ts
import { deriveCapabilityMap, maturityLevel } from '@/lib/architecture/capability'
import type { UseCase } from '@/types'

const uc = (o: Partial<UseCase>): UseCase => ({
  id: 'x', portfolio_id: 'p', name: 'n', domain: null, description: null,
  scores: {}, weighted_score: 0, quadrant: 'quick_win', canvas_id: null,
  governance_result: null, created_at: '', updated_at: '', ...o,
})

describe('capability maturity', () => {
  it('approve → produktiv (Stufe 4)', () => expect(maturityLevel(uc({ governance_result: 'approve' }))).toBe(4))
  it('canvas ohne approve → pilot (3)', () => expect(maturityLevel(uc({ canvas_id: 'c' }))).toBe(3))
  it('governance improve → evaluiert (2)', () => expect(maturityLevel(uc({ governance_result: 'improve' }))).toBe(2))
  it('nur gescored → geplant (1)', () => expect(maturityLevel(uc({}))).toBe(1))
  it('gruppiert nach domain, null → "—"', () => {
    const map = deriveCapabilityMap([uc({ domain: 'Vertrieb' }), uc({ domain: null })])
    expect(map.find(g => g.domain === 'Vertrieb')).toBeTruthy()
    expect(map.find(g => g.domain === '—')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Rot** — Run: `npx jest capability-map` → FAIL.

- [ ] **Step 3: Implementieren**

```ts
// src/lib/architecture/capability.ts
import type { UseCase } from '@/types'

// 1..4 (geplant → evaluiert → pilot → produktiv). Rein aus Use-Case-Feldern ableitbar.
export function maturityLevel(uc: UseCase): 1 | 2 | 3 | 4 {
  if (uc.governance_result === 'approve') return 4
  if (uc.canvas_id) return 3
  if (uc.governance_result) return 2
  return 1
}

export interface CapabilityTile { id: string; name: string; level: 1 | 2 | 3 | 4 }
export interface CapabilityGroup { domain: string; tiles: CapabilityTile[] }

export function deriveCapabilityMap(useCases: UseCase[]): CapabilityGroup[] {
  const byDomain = new Map<string, CapabilityTile[]>()
  for (const uc of useCases) {
    const domain = uc.domain?.trim() || '—'
    const arr = byDomain.get(domain) ?? []
    arr.push({ id: uc.id, name: uc.name, level: maturityLevel(uc) })
    byDomain.set(domain, arr)
  }
  return [...byDomain.entries()].map(([domain, tiles]) => ({ domain, tiles }))
}
```

- [ ] **Step 4: Grün** — Run: `npx jest capability-map` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/architecture/capability.ts src/__tests__/unit/capability-map.test.ts
git commit -m "feat(architecture): Capability-Reifegrad-Ableitung aus Use-Cases"
```

## Task 4: Preferences-API um diagram_style erweitern

**Files:** Modify: `src/app/api/preferences/route.ts`

- [ ] **Step 1:** `PreferencesSchema` um `diagram_style` erweitern (nach den `primary_*`-Feldern):

```ts
  diagram_style: z.object({
    art: z.enum(['schichten','togaf','datenfluss','capability']),
    connections: z.enum(['bebauungsplan','uml']),
    density: z.enum(['sparsam','detailliert']),
  }).nullable().optional(),
```

- [ ] **Step 2:** In **beiden** `.select(...)`-Aufrufen (GET + PUT) `diagram_style` an die Spaltenliste anhängen (`…, primary_usecase_id, diagram_style`).

- [ ] **Step 3: tsc**

Run: `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/preferences/route.ts
git commit -m "feat(architecture): diagram_style in Preferences-API"
```

## Task 5: MaturityPips (theme-sicher)

**Files:** Create: `src/components/modules/architecture/diagram/MaturityPips.tsx`

- [ ] **Step 1: Komponente** (kein eigener Test nötig — visuell; wird in CapabilityView getestet)

```tsx
// Reifegrad theme-sicher: 4 Pips, Füllzahl = level (1..4). Neutrale Tinte;
// Primary-Akzent NUR bei level 4 („produktiv"). Kein Farbton-Mehrfachcode.
const LABELS = ['geplant', 'evaluiert', 'pilot', 'produktiv'] as const

export function MaturityPips({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Reifegrad: ${LABELS[level - 1]}`}>
      {[1, 2, 3, 4].map(i => (
        <span key={i} className={
          i > level ? 'w-2 h-2 rounded-sm bg-line'
          : level === 4 ? 'w-2 h-2 rounded-sm bg-primary'
          : 'w-2 h-2 rounded-sm bg-ink-secondary'
        } />
      ))}
    </span>
  )
}
```

- [ ] **Step 2: tsc** — Run: `npx tsc --noEmit` → keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/components/modules/architecture/diagram/MaturityPips.tsx
git commit -m "feat(architecture): theme-sichere MaturityPips"
```

## Task 6: CapabilityView

**Files:**
- Create: `src/components/modules/architecture/diagram/CapabilityView.tsx`
- Test: `src/__tests__/accessibility/capability-view-a11y.test.tsx`

- [ ] **Step 1: Failing a11y-Test**

```tsx
// src/__tests__/accessibility/capability-view-a11y.test.tsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { CapabilityView } from '@/components/modules/architecture/diagram/CapabilityView'

it('CapabilityView ist barrierefrei', async () => {
  const groups = [{ domain: 'Vertrieb', tiles: [{ id: '1', name: 'Lead-Scoring', level: 4 as const }] }]
  const { container } = render(<CapabilityView groups={groups} emptyLabel="leer" />)
  expect(await axe(container)).toHaveNoViolations()
})
```

- [ ] **Step 2: Rot** — Run: `npx jest capability-view-a11y` → FAIL (Komponente fehlt).

- [ ] **Step 3: Implementieren**

```tsx
import type { CapabilityGroup } from '@/lib/architecture/capability'
import { MaturityPips } from './MaturityPips'

export function CapabilityView({ groups, emptyLabel }: { groups: CapabilityGroup[]; emptyLabel: string }) {
  if (groups.length === 0) return <p className="text-sm text-ink-muted py-6 text-center">{emptyLabel}</p>
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map(g => (
        <div key={g.domain} className="border border-line rounded-2xl bg-surface-raised p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-secondary">{g.domain}</span>
            <span className="text-[10px] text-ink-muted">{g.tiles.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {g.tiles.map(t => (
              <div key={t.id} className="border border-line rounded-lg bg-surface px-2.5 py-2 flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-ink leading-tight">{t.name}</span>
                <MaturityPips level={t.level} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Grün** — Run: `npx jest capability-view-a11y` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/modules/architecture/diagram/CapabilityView.tsx src/__tests__/accessibility/capability-view-a11y.test.tsx
git commit -m "feat(architecture): CapabilityView (Portfolio-Heatmap)"
```

## Task 7: DiagramView-Dispatcher

**Files:** Create: `src/components/modules/architecture/diagram/DiagramView.tsx`

Phase 1: `art === 'capability'` → `CapabilityView`; sonst → bestehende `EamMap` (Schichten). `renderableArt()` mappt `togaf`/`datenfluss` auf `schichten`.

- [ ] **Step 1: Implementieren**

```tsx
import type { DiagramStyle } from '@/config/diagram-styles'
import { renderableArt } from '@/config/diagram-styles'
import type { CapabilityGroup } from '@/lib/architecture/capability'
import { CapabilityView } from './CapabilityView'
import { EamMap } from '@/app/[locale]/(dashboard)/architecture/EamMap'
// Hinweis: EamMap-Props unverändert übernehmen (siehe EamMap-Signatur).

type EamProps = React.ComponentProps<typeof EamMap>

export function DiagramView(props: {
  style: DiagramStyle
  capabilityGroups: CapabilityGroup[]
  capabilityEmptyLabel: string
  eamProps: EamProps
}) {
  const art = renderableArt(props.style.art)
  if (art === 'capability') {
    return <CapabilityView groups={props.capabilityGroups} emptyLabel={props.capabilityEmptyLabel} />
  }
  return <EamMap {...props.eamProps} />
}
```

- [ ] **Step 2: tsc** — Run: `npx tsc --noEmit` → keine Fehler (ggf. EamMap-Import-Pfad/Props anpassen).

- [ ] **Step 3: Commit**

```bash
git add src/components/modules/architecture/diagram/DiagramView.tsx
git commit -m "feat(architecture): DiagramView-Dispatcher (Capability | Schichten)"
```

## Task 8: DiagramStyleSwitcher

**Files:**
- Create: `src/components/modules/architecture/diagram/DiagramStyleSwitcher.tsx`
- Modify: `messages/de.json`, `messages/en.json` (Namespace `diagram`)

- [ ] **Step 1: i18n** — Namespace `"diagram"` in beiden messages-Dateien:

```json
"diagram": {
  "styleLabel": "Diagramm-Stil",
  "artSchichten": "Schichten", "artCapability": "Capability",
  "artTogaf": "TOGAF (demnächst)", "artDatenfluss": "Datenfluss (demnächst)",
  "presetHint": "Als Standard in den Einstellungen speicherbar",
  "capabilityEmpty": "Noch keine Use-Cases im Portfolio — legen Sie im Use-Case-Modul welche an."
}
```

EN analog.

- [ ] **Step 2: Komponente** (Preset-Auswahl als Buttons; `onChange(presetKey)`)

```tsx
'use client'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { PERSONA_PRESETS } from '@/config/diagram-styles'
import { cn } from '@/lib/utils'

export function DiagramStyleSwitcher({ activePreset, onChange }:
  { activePreset: string; onChange: (key: string) => void }) {
  const t = useTranslations('diagram')
  const locale = useLocale()
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('styleLabel')}>
      {Object.values(PERSONA_PRESETS).map(p => (
        <button key={p.key} type="button" onClick={() => onChange(p.key)} aria-pressed={activePreset === p.key}
          className={cn('text-xs font-medium px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap',
            activePreset === p.key ? 'bg-primary text-white border-primary' : 'bg-surface text-ink-secondary border-line hover:border-line-strong')}>
          {pick(locale, p.label)}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: tsc** — keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add src/components/modules/architecture/diagram/DiagramStyleSwitcher.tsx messages/de.json messages/en.json
git commit -m "feat(architecture): DiagramStyleSwitcher (Persona-Presets)"
```

## Task 9: Portfolio-Daten in architecture/page.tsx laden

**Files:** Modify: `src/app/[locale]/(dashboard)/architecture/page.tsx`

Ziel: die Use-Cases des Nutzers (für Capability) + gespeicherten `diagram_style` laden und an den Client geben.

- [ ] **Step 1:** In der bestehenden Datenladung (Server-Component) ergänzen:

```ts
// Portfolio des Nutzers → Use-Cases (für Capability-Sicht). Muster analog usecase/page.tsx.
const { data: portfolio } = await supabase.from('uc_portfolios').select('id').eq('user_id', user.id).limit(1).maybeSingle()
const { data: portfolioUseCases } = portfolio
  ? await supabase.from('use_cases').select('*').eq('portfolio_id', portfolio.id)
  : { data: [] as unknown[] }

const { data: prefs } = await supabase.from('user_preferences').select('diagram_style').eq('user_id', user.id).maybeSingle()
```

- [ ] **Step 2:** An den Client übergeben: `portfolioUseCases={(portfolioUseCases ?? []) as UseCase[]}` und `initialDiagramStyle={prefs?.diagram_style ?? null}` (Props in Task 10 ergänzt). `UseCase` aus `@/types` importieren.

- [ ] **Step 3: tsc** — keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(dashboard)/architecture/page.tsx"
git commit -m "feat(architecture): Portfolio-Use-Cases + diagram_style laden"
```

## Task 10: DiagramView + Switcher in ArchitecturePageClient

**Files:** Modify: `src/app/[locale]/(dashboard)/architecture/ArchitecturePageClient.tsx`

- [ ] **Step 1:** Props ergänzen: `portfolioUseCases?: UseCase[]` und `initialDiagramStyle?: DiagramStyle | null`. Imports: `DiagramView`, `DiagramStyleSwitcher`, `deriveCapabilityMap`, `resolvePreset`, `PERSONA_PRESETS`, `DiagramStyle`.

- [ ] **Step 2:** State + Persistenz:

```tsx
const [activePreset, setActivePreset] = useState<string>(() => {
  const s = initialDiagramStyle
  const match = s ? Object.values(PERSONA_PRESETS).find(p =>
    p.style.art === s.art && p.style.connections === s.connections && p.style.density === s.density) : undefined
  return match?.key ?? 'architect'
})
const diagramStyle: DiagramStyle = resolvePreset(activePreset)

const changePreset = (key: string) => {
  setActivePreset(key)
  void fetch('/api/preferences', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ diagram_style: resolvePreset(key) }),
  }).catch(() => {})
}
```

- [ ] **Step 3:** In der `eam`-Sektion des Ergebnisses (wo heute `<EamMap … />` steht, ~Zeile 1236) ersetzen durch Switcher + Dispatcher:

```tsx
<div className="mb-3"><DiagramStyleSwitcher activePreset={activePreset} onChange={changePreset} /></div>
<DiagramView
  style={diagramStyle}
  capabilityGroups={deriveCapabilityMap(portfolioUseCases ?? [])}
  capabilityEmptyLabel={t('diagram.capabilityEmpty')}
  eamProps={{ /* dieselben Props wie bisher an <EamMap /> */ }}
/>
```

(Die bisherigen EamMap-Props 1:1 in `eamProps` übernehmen.)

- [ ] **Step 4: tsc + eslint + build**

Run: `npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build 2>&1 | grep -iE "Compiled|error TS"`
Expected: sauber + „Compiled successfully".

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(dashboard)/architecture/ArchitecturePageClient.tsx"
git commit -m "feat(architecture): Diagramm-Stil-Umschalter in Ergebnisansicht + Persistenz"
```

## Task 11: Settings-Karte „Architektur-Diagramm" → Preset-Wähler

**Files:** Modify: `src/app/[locale]/(dashboard)/settings/SettingsPageClient.tsx`, `messages/*.json`

- [ ] **Step 1:** Die `diagram-heading`-Section (opacity-60, „Demnächst") ersetzen durch einen kleinen Client-Preset-Wähler, der beim Klick `PUT /api/preferences { diagram_style }` sendet und das gewählte Preset als Default speichert. Wiederverwendung von `DiagramStyleSwitcher` + einer lokalen `activePreset`-State (Initialwert aus einem neuen Prop `initialDiagramPreset`, das `settings/page.tsx` aus `user_preferences.diagram_style` ableitet — analog Task 9/10).

- [ ] **Step 2:** `settings/page.tsx`: `diagram_style` laden und als `initialDiagramPreset` übergeben (Preset-Key via Reverse-Match wie in Task 10).

- [ ] **Step 3: tsc + build** — sauber.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(dashboard)/settings" messages/de.json messages/en.json
git commit -m "feat(architecture): Default-Diagramm-Stil in den Einstellungen wählbar"
```

## Task 12: Verwaisten ArchitectureDiagram entfernen

**Files:** Delete: `src/components/modules/ArchitectureDiagram.tsx`

- [ ] **Step 1:** Sicherstellen, dass nichts importiert: `grep -rn "modules/ArchitectureDiagram" src/` → nur Definition. Falls Treffer: erst entfernen.

- [ ] **Step 2:** Datei löschen: `git rm src/components/modules/ArchitectureDiagram.tsx`

- [ ] **Step 3: tsc + build** — sauber.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(architecture): verwaisten ArchitectureDiagram entfernen"
```

## Task 13: Abschluss-Gate

- [ ] **Step 1:** Voller Gate

Run: `npm run test 2>&1 | tail -3 && npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build 2>&1 | grep -iE "Compiled|error TS" && npm audit --omit=dev 2>&1 | tail -2`
Expected: Testbaseline unverändert (nicht schlechter als 27 failed suites / 10 failed tests), tsc/eslint leer, „Compiled successfully".

- [ ] **Step 2:** Obsidian-Vault aktualisieren (Sprint-Log + Datenbankstruktur `user_preferences.diagram_style`) — CLAUDE.md-Pflicht nach finalem Push.

- [ ] **Step 3:** Push + Deploy-Status prüfen (`gh api …/commits/<sha>/status`).

---

## Self-Review-Ergebnis (vom Autor)
- **Spec-Abdeckung:** Feature 2 (Übersicht + DELETE) ✓ · Persistenz ✓ · Capability (Portfolio, Ableitung) ✓ · LayeredView = EamMap-Reuse ✓ · MaturityPips theme-sicher ✓ · Switcher (Settings + Ergebnis) ✓ · Cleanup ✓. **Bewusst verschoben (Phase 2/3, nicht in diesem Plan):** UML/ConnectionLayer, DataFlowView, TOGAF-Renderer, echte Katalog-Kanten, PDF-Export je Stil, Baustein-Zahl auf Capability-Kacheln.
- **Typkonsistenz:** `DiagramStyle {art,connections,density}` durchgängig; `maturityLevel`→1..4 ↔ `MaturityPips level`; `CapabilityGroup/Tile` einheitlich.
- **Platzhalter:** keine offenen TODOs in Code-Schritten (Wiring-Details in Task 10/11 verweisen auf konkrete bestehende Props).
