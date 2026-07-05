# Issue #60 — Dynamisches Architekturdiagramm mit Abhängigkeitsmatrix — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das bestehende CSS-Swimlane-Architekturdiagramm um interaktive Komponentenauswahl (Checkbox + Detail-Click), eine rechte Sidebar mit Auswahl-Zusammenfassung sowie eine bidirektionale Abhängigkeits-Engine (Konflikte + Vorschläge) erweitern.

**Architecture:** Drei unabhängig deploybare Blöcke: (1) Schema-Migration + Admin-Datenpflege, (2) Diagramm-Interaktion mit Sidebar, (3) Abhängigkeits-Engine. Jeder Block ist nach Completion deploybar ohne den nächsten zu benötigen.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS, Supabase (PostgreSQL), Zod, Jest

**Spec:** `docs/superpowers/specs/2026-07-04-dynamic-architecture-diagram-design.md`

---

## Datei-Übersicht

| Datei | Änderung |
|---|---|
| `supabase/migrations/<timestamp>_issue60_component_dependencies.sql` | NEU: 3 neue Spalten |
| `src/types/index.ts` | CatalogComponent + 3 Felder |
| `src/app/api/admin/catalog/components/[id]/route.ts` | PatchSchema erweitern |
| `src/app/api/admin/catalog/upload/route.ts` | RowSchema + normalizeStandardRow |
| `src/app/(dashboard)/admin/AdminPageClient.tsx` | Abhängigkeits-Editor-Sektion |
| `src/components/modules/ArchitectureDiagram.tsx` | State-Refactoring + Layout |
| `src/components/modules/SelectionSidebar.tsx` | NEU |
| `src/lib/utils/catalog-compatibility.ts` | NEU |
| `src/__tests__/unit/catalog-compatibility.test.ts` | NEU |
| `src/__tests__/unit/architecture-scoring.test.ts` | makeComp um neue Felder ergänzen |
| `src/__tests__/security/catalog-dependencies-security.test.ts` | NEU |

---

## Block 1 — Schema + Datenpflege

### Task 1: DB-Migration + TypeScript-Typ

**Files:**
- Create: Migration via `supabase migration new`
- Modify: `src/types/index.ts:41-63`
- Modify: `src/__tests__/unit/architecture-scoring.test.ts:5-30`

- [ ] **Schritt 1: Migration erstellen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
supabase migration new issue60_component_dependencies
```

Expected: Neue Datei in `supabase/migrations/` mit Zeitstempel-Prefix.

- [ ] **Schritt 2: SQL in die generierte Datei schreiben**

Datei öffnen (Pfad aus vorherigem Schritt, z.B. `supabase/migrations/20260704xxxxxx_issue60_component_dependencies.sql`) und folgenden Inhalt einfügen:

```sql
-- Issue #60: Komponentenabhängigkeiten für dynamisches Architekturdiagramm
alter table component_catalog
  add column if not exists incompatible_with text[] not null default '{}',
  add column if not exists requires          text[] not null default '{}',
  add column if not exists suggests          text[] not null default '{}';

comment on column component_catalog.incompatible_with is 'Namen von Komponenten, die nicht kombiniert werden sollten (bidirektional)';
comment on column component_catalog.requires          is 'Namen von Komponenten, die zwingend benötigt werden (unidirektional)';
comment on column component_catalog.suggests          is 'Namen von Komponenten, die als Ergänzung empfohlen werden (unidirektional)';
```

- [ ] **Schritt 3: Migration pushen**

```bash
supabase db push
```

Expected: `Applied 1 migration` ohne Fehler.

- [ ] **Schritt 4: Migration verifizieren**

```bash
supabase migration list
```

Expected: Neue Migration erscheint in beiden Spalten (Local + Remote).

- [ ] **Schritt 5: `CatalogComponent`-Typ in `src/types/index.ts` erweitern**

Datei lesen, dann Zeile 62 (nach `tags: string[]`, vor `source: string`) ergänzen:

```typescript
// vorher (ab Zeile 57):
  tags: string[]
  source: string

// nachher:
  tags: string[]
  incompatible_with: string[]
  requires: string[]
  suggests: string[]
  source: string
```

- [ ] **Schritt 6: `makeComp`-Helper in Tests aktualisieren**

In `src/__tests__/unit/architecture-scoring.test.ts` Zeilen 5–30 die `makeComp`-Funktion erweitern — die drei neuen Felder mit Default `[]` eintragen, damit der TypeScript-Compiler nicht meckert:

```typescript
function makeComp(overrides: Partial<CatalogComponent>): CatalogComponent {
  return {
    id: 'c1',
    name: 'Test Component',
    vendor: null,
    category: null,
    description: null,
    website_url: null,
    icon_name: null,
    architecture_layer: 'data',
    cloud_provider: 'independent',
    hosting: [],
    infra_types: [],
    use_case_types: [],
    sap_compatible: false,
    sap_components: [],
    tags: [],
    incompatible_with: [],
    requires: [],
    suggests: [],
    source: 'manual',
    is_active: true,
    eu_ai_act_risk: null,
    dsgvo_status: 'conditional',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}
```

- [ ] **Schritt 7: TypeScript-Compile prüfen**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

- [ ] **Schritt 8: Tests laufen lassen**

```bash
npm test -- --testPathPattern="architecture-scoring"
```

Expected: Alle Tests grün.

- [ ] **Schritt 9: Committen**

```bash
git add supabase/migrations/ src/types/index.ts src/__tests__/unit/architecture-scoring.test.ts
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): DB-Migration + TypeScript-Typ — incompatible_with, requires, suggests"
```

---

### Task 2: Upload-Route um Abhängigkeitsfelder erweitern

**Files:**
- Modify: `src/app/api/admin/catalog/upload/route.ts:10-27` (RowSchema)
- Modify: `src/app/api/admin/catalog/upload/route.ts:191-210` (normalizeStandardRow)

- [ ] **Schritt 1: `RowSchema` in der Upload-Route erweitern**

In `src/app/api/admin/catalog/upload/route.ts` nach Zeile 26 (nach `icon_name`) drei neue Felder ergänzen:

```typescript
// vorher:
const RowSchema = z.object({
  name:               z.string().min(1).max(200),
  vendor:             z.string().max(100).nullish(),
  category:           z.string().max(100).nullish(),
  architecture_layer: z.enum(VALID_LAYERS).nullish(),
  hosting:            z.array(z.string()).default([]),
  dsgvo_status:       z.enum(VALID_DSGVO).default('compliant'),
  eu_ai_act_risk:     z.enum(VALID_AI_ACT).default('minimal'),
  sap_compatible:     z.boolean().default(false),
  sap_components:     z.array(z.string()).default([]),
  use_case_types:     z.array(z.string()).default([]),
  infra_types:        z.array(z.string()).default([]),
  cloud_provider:     z.string().max(50).nullish(),
  tags:               z.array(z.string()).default([]),
  description:        z.string().max(2000).nullish(),
  website_url:        z.string().url().nullish(),
  icon_name:          z.string().max(50).nullish(),
})

// nachher — drei Felder am Ende ergänzen:
const RowSchema = z.object({
  name:               z.string().min(1).max(200),
  vendor:             z.string().max(100).nullish(),
  category:           z.string().max(100).nullish(),
  architecture_layer: z.enum(VALID_LAYERS).nullish(),
  hosting:            z.array(z.string()).default([]),
  dsgvo_status:       z.enum(VALID_DSGVO).default('compliant'),
  eu_ai_act_risk:     z.enum(VALID_AI_ACT).default('minimal'),
  sap_compatible:     z.boolean().default(false),
  sap_components:     z.array(z.string()).default([]),
  use_case_types:     z.array(z.string()).default([]),
  infra_types:        z.array(z.string()).default([]),
  cloud_provider:     z.string().max(50).nullish(),
  tags:               z.array(z.string()).default([]),
  description:        z.string().max(2000).nullish(),
  website_url:        z.string().url().nullish(),
  icon_name:          z.string().max(50).nullish(),
  incompatible_with:  z.array(z.string()).default([]),
  requires:           z.array(z.string()).default([]),
  suggests:           z.array(z.string()).default([]),
})
```

- [ ] **Schritt 2: `normalizeStandardRow` erweitern**

In `src/app/api/admin/catalog/upload/route.ts` Funktion `normalizeStandardRow` (ab ca. Zeile 191) — drei neue Felder nach `icon_name` eintragen:

```typescript
function normalizeStandardRow(raw: Record<string, unknown>, vendorOverride: string, layerOverride: string) {
  return {
    name:               String(raw.name ?? '').trim(),
    vendor:             vendorOverride || (raw.vendor ? String(raw.vendor).trim() : null),
    category:           raw.category ? String(raw.category).trim() : null,
    architecture_layer: layerOverride || (raw.architecture_layer ? String(raw.architecture_layer).trim() : null),
    hosting:            splitField(raw.hosting),
    dsgvo_status:       String(raw.dsgvo_status ?? 'compliant').trim() || 'compliant',
    eu_ai_act_risk:     String(raw.eu_ai_act_risk ?? 'minimal').trim() || 'minimal',
    sap_compatible:     parseBool(raw.sap_compatible),
    sap_components:     splitField(raw.sap_components),
    use_case_types:     splitField(raw.use_case_types),
    infra_types:        splitField(raw.infra_types),
    cloud_provider:     raw.cloud_provider ? String(raw.cloud_provider).trim() : null,
    tags:               splitField(raw.tags),
    description:        raw.description ? String(raw.description).trim().slice(0, 2000) : null,
    website_url:        raw.website_url ? String(raw.website_url).trim() : null,
    icon_name:          raw.icon_name ? String(raw.icon_name).trim() : null,
    incompatible_with:  splitField(raw.incompatible_with),
    requires:           splitField(raw.requires),
    suggests:           splitField(raw.suggests),
  }
}
```

- [ ] **Schritt 3: TypeScript-Compile prüfen**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

- [ ] **Schritt 4: Committen**

```bash
git add src/app/api/admin/catalog/upload/route.ts
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): Upload-Route um incompatible_with/requires/suggests erweitert"
```

---

### Task 3: Admin PATCH-Route für Abhängigkeitsfelder erweitern

**Files:**
- Modify: `src/app/api/admin/catalog/components/[id]/route.ts`
- Create: `src/__tests__/security/catalog-dependencies-security.test.ts`

- [ ] **Schritt 1: Failing Security-Test schreiben**

Neue Datei `src/__tests__/security/catalog-dependencies-security.test.ts`:

```typescript
import { NextRequest } from 'next/server'

jest.mock('@/lib/utils/admin-check', () => ({
  requireAdmin: jest.fn(),
}))
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { requireAdmin } from '@/lib/utils/admin-check'
import { createClient } from '@/lib/supabase/server'
import { PATCH } from '@/app/api/admin/catalog/components/[id]/route'

const mockRequireAdmin = requireAdmin as jest.Mock
const mockCreateClient = createClient as jest.Mock

describe('PATCH /api/admin/catalog/components/[id] — Sicherheit', () => {
  beforeEach(() => jest.clearAllMocks())

  it('gibt 403 zurück wenn kein Admin', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('Forbidden'))
    const req = new NextRequest('http://localhost/api/admin/catalog/components/abc', {
      method: 'PATCH',
      body: JSON.stringify({ incompatible_with: ['vLLM'] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(403)
  })

  it('akzeptiert incompatible_with, requires, suggests als Arrays', async () => {
    mockRequireAdmin.mockResolvedValue(undefined)
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'abc' }, error: null }),
        }),
      }),
    })
    mockCreateClient.mockResolvedValue({ from: jest.fn().mockReturnValue({ update: mockUpdate }) })

    const req = new NextRequest('http://localhost/api/admin/catalog/components/abc', {
      method: 'PATCH',
      body: JSON.stringify({ incompatible_with: ['vLLM'], requires: ['SAP BTP'], suggests: ['SAP GenAI Hub'] }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(200)
  })

  it('lehnt nicht-Array-Werte für incompatible_with ab', async () => {
    mockRequireAdmin.mockResolvedValue(undefined)
    const req = new NextRequest('http://localhost/api/admin/catalog/components/abc', {
      method: 'PATCH',
      body: JSON.stringify({ incompatible_with: 'vLLM' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Schritt 2: Test laufen lassen — muss fehlschlagen**

```bash
npm test -- --testPathPattern="catalog-dependencies-security"
```

Expected: FAIL (incompatible_with/requires/suggests nicht in PatchSchema).

- [ ] **Schritt 3: `PatchSchema` und Handler in der Route erweitern**

`src/app/api/admin/catalog/components/[id]/route.ts` vollständig ersetzen:

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const PatchSchema = z.object({
  tags:              z.array(z.string().min(1).max(50)).max(30).optional(),
  incompatible_with: z.array(z.string().min(1).max(200)).max(50).optional(),
  requires:          z.array(z.string().min(1).max(200)).max(50).optional(),
  suggests:          z.array(z.string().min(1).max(200)).max(50).optional(),
}).refine(
  data => Object.values(data).some(v => v !== undefined),
  { message: 'Mindestens ein Feld erforderlich' }
)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.tags              !== undefined) patch.tags              = parsed.data.tags
  if (parsed.data.incompatible_with !== undefined) patch.incompatible_with = parsed.data.incompatible_with
  if (parsed.data.requires          !== undefined) patch.requires          = parsed.data.requires
  if (parsed.data.suggests          !== undefined) patch.suggests          = parsed.data.suggests

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('component_catalog')
    .update(patch)
    .eq('id', id)
    .select('id, tags, incompatible_with, requires, suggests')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
```

- [ ] **Schritt 4: Tests laufen lassen — müssen grün sein**

```bash
npm test -- --testPathPattern="catalog-dependencies-security"
```

Expected: 3/3 Tests grün.

- [ ] **Schritt 5: TypeScript-Compile prüfen**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

- [ ] **Schritt 6: Committen**

```bash
git add src/app/api/admin/catalog/components/[id]/route.ts src/__tests__/security/catalog-dependencies-security.test.ts
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): Admin PATCH-Route — incompatible_with/requires/suggests"
```

---

### Task 4: Admin UI — Abhängigkeits-Editor

**Files:**
- Modify: `src/app/(dashboard)/admin/AdminPageClient.tsx`

Der Editor wird als neue Sektion in der Katalog-Tabelle eingebaut — jede Zeile bekommt einen "Abhängigkeiten"-Expand-Button, ähnlich wie User-Feature-Flags.

- [ ] **Schritt 1: State für den Editor in `AdminPageClient.tsx` hinzufügen**

In `AdminPageClient.tsx` nach Zeile 104 (`restoringId`, `restoreMsg`) neue State-Variablen eintragen:

```typescript
  // ── Dependency editor state ─────────────────────────────────────────────────
  const [depEditingId, setDepEditingId] = useState<string | null>(null)
  const [depForm, setDepForm] = useState<{ incompatible_with: string; requires: string; suggests: string }>({
    incompatible_with: '', requires: '', suggests: '',
  })
  const [depSavingId, setDepSavingId] = useState<string | null>(null)
```

- [ ] **Schritt 2: Handler `patchComponentDependencies` hinzufügen**

Nach `addTag`-Funktion (ca. Zeile 238) einfügen:

```typescript
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
```

- [ ] **Schritt 3: Abhängigkeits-Editor-Zeile in der Katalog-Tabelle einbauen**

In `AdminPageClient.tsx` in der Katalog-Tabelle (ab ca. Zeile 1128) jede `<tr>`-Zeile erweitern — nach der Tags-`<td>` eine neue `<td>` mit dem Editor-Button hinzufügen:

Zunächst in `<thead>` nach dem Tags-`<th>` einfügen:
```tsx
<th className="text-left px-4 py-3 font-medium text-slate-600 text-xs hidden xl:table-cell">Abhängigkeiten</th>
```

Dann in `<tbody>` jede `<tr>` erweitern — nach der Tags-`<td>`:
```tsx
{/* Dependency editor */}
<td className="px-4 py-3 hidden xl:table-cell align-top">
  {depEditingId === c.id ? (
    <div className="space-y-1.5 min-w-[220px]">
      {([ 
        { key: 'incompatible_with' as const, label: '✗ Inkompatibel', color: 'border-red-200 focus:ring-red-400' },
        { key: 'requires' as const, label: '⬆ Benötigt', color: 'border-blue-200 focus:ring-blue-400' },
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
    <div className="space-y-0.5">
      {c.incompatible_with.length > 0 && (
        <p className="text-[10px] text-red-600 truncate max-w-[160px]">✗ {c.incompatible_with.join(', ')}</p>
      )}
      {c.requires.length > 0 && (
        <p className="text-[10px] text-blue-600 truncate max-w-[160px]">⬆ {c.requires.join(', ')}</p>
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
```

- [ ] **Schritt 4: TypeScript-Compile prüfen**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler. Wenn Fehler wegen `c.incompatible_with` (altes `CatalogComponent` ohne die neuen Felder), dann Task 1 Schritt 5 prüfen.

- [ ] **Schritt 5: Gesamte Test-Suite laufen lassen**

```bash
npm test
```

Expected: Alle Tests grün.

- [ ] **Schritt 6: Committen**

```bash
git add src/app/(dashboard)/admin/AdminPageClient.tsx
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): Admin-UI Abhängigkeits-Editor für Katalog-Komponenten"
```

---

## Block 2 — Diagramm-Interaktion

### Task 5: ArchitectureDiagram — State-Refactoring + ComponentButton

**Files:**
- Modify: `src/components/modules/ArchitectureDiagram.tsx`

- [ ] **Schritt 1: State in `ArchitectureDiagram` refactoren**

In `ArchitectureDiagram.tsx` Zeile 233–234 (bisherige State-Deklaration):

```typescript
// vorher:
const [selected, setSelected]     = useState<string | null>(null)
const [fullscreen, setFullscreen] = useState(false)

// nachher:
const [checked, setChecked]       = useState<Set<string>>(new Set())
const [focused, setFocused]       = useState<string | null>(null)
const [fullscreen, setFullscreen] = useState(false)
```

- [ ] **Schritt 2: Handler aktualisieren**

```typescript
// vorher:
const handleSelect = (name: string) => {
  setSelected(prev => prev === name ? null : name)
}
const selectedComp = selected ? byName[selected] : undefined

// nachher:
const handleCheck = (name: string) => {
  setChecked(prev => {
    const next = new Set(prev)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    return next
  })
}

const handleFocus = (name: string) => {
  setFocused(prev => prev === name ? null : name)
}

const focusedComp = focused ? byName[focused] : undefined
```

- [ ] **Schritt 3: `ComponentButton` Props und Rendering erweitern**

```typescript
// vorher:
function ComponentButton({
  name,
  comp,
  isSelected,
  locked,
  onSelect,
}: {
  name: string
  comp: CatalogComponent | undefined
  isSelected: boolean
  locked: boolean
  onSelect: () => void
})

// nachher:
function ComponentButton({
  name,
  comp,
  isChecked,
  isFocused,
  locked,
  onCheck,
  onFocus,
}: {
  name: string
  comp: CatalogComponent | undefined
  isChecked: boolean
  isFocused: boolean
  locked: boolean
  onCheck: () => void
  onFocus: () => void
})
```

Rendering des Buttons ersetzen:

```tsx
if (locked) {
  return <div className="h-7 w-28 rounded-lg bg-slate-100 animate-pulse" />
}
return (
  <div className={cn(
    'inline-flex items-center rounded-lg border text-xs font-medium transition-all',
    isChecked
      ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-sm'
      : 'border-slate-200 bg-white text-slate-700',
    isFocused && 'ring-2 ring-blue-400 ring-offset-1',
  )}>
    <label className="flex items-center gap-1 pl-2 pr-1 py-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onCheck}
        aria-label={`${name} auswählen`}
        className="w-3 h-3 rounded accent-blue-500 cursor-pointer flex-shrink-0"
      />
    </label>
    <button
      onClick={onFocus}
      aria-pressed={isFocused}
      className="pr-2.5 py-1.5 min-w-0 truncate max-w-[140px] focus:outline-none"
    >
      {name}
    </button>
    {comp?.dsgvo_status && (
      <span className={cn('px-1 py-0.5 mr-1.5 rounded text-[9px] font-semibold border flex-shrink-0', DSGVO_BADGE[comp.dsgvo_status] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
        {DSGVO_LABEL[comp.dsgvo_status]}
      </span>
    )}
  </div>
)
```

- [ ] **Schritt 4: `SwimlaneTable` Props und Aufrufe anpassen**

```typescript
// Props ändern:
function SwimlaneTable({
  recs,
  byName,
  locked,
  checked,
  focused,
  onCheck,
  onFocus,
}: {
  recs: CatalogRecommendations
  byName: Record<string, CatalogComponent>
  locked: boolean
  checked: Set<string>
  focused: string | null
  onCheck: (name: string) => void
  onFocus: (name: string) => void
})
```

Alle `ComponentButton`-Aufrufe in `SwimlaneTable` aktualisieren:

```tsx
<ComponentButton
  key={name}
  name={name}
  comp={byName[name]}
  isChecked={checked.has(name)}
  isFocused={focused === name}
  locked={false}
  onCheck={() => onCheck(name)}
  onFocus={() => onFocus(name)}
/>
```

- [ ] **Schritt 5: `DetailPanel` auf `focused` umstellen**

```typescript
// vorher:
const detailPanel = selected && (
  <DetailPanel name={selected} comp={selectedComp} onClose={() => setSelected(null)} />
)

// nachher:
const detailPanel = focused && (
  <DetailPanel name={focused} comp={focusedComp} onClose={() => setFocused(null)} />
)
```

- [ ] **Schritt 6: `SwimlaneTable`-Aufruf in `body` aktualisieren**

```tsx
// vorher:
<SwimlaneTable recs={recs} byName={byName} locked={locked} selected={selected} onSelect={handleSelect} />

// nachher:
<SwimlaneTable recs={recs} byName={byName} locked={locked} checked={checked} focused={focused} onCheck={handleCheck} onFocus={handleFocus} />
```

- [ ] **Schritt 7: TypeScript-Compile prüfen**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

- [ ] **Schritt 8: Committen**

```bash
git add src/components/modules/ArchitectureDiagram.tsx
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): ArchitectureDiagram — Checkbox + Focus State (Block 2)"
```

---

### Task 6: SelectionSidebar Komponente

**Files:**
- Create: `src/components/modules/SelectionSidebar.tsx`

- [ ] **Schritt 1: Stub für `catalog-compatibility.ts` anlegen (wird in Task 8 vollständig implementiert)**

```typescript
// src/lib/utils/catalog-compatibility.ts
import type { CatalogComponent } from '@/types'

export interface Conflict {
  a: string
  b: string
  alternatives: string[]
}

export interface Suggestion {
  source: string
  target: string
}

export function findConflicts(_checked: Set<string>, _byName: Record<string, CatalogComponent>): Conflict[] {
  return []
}

export function findSuggestions(_checked: Set<string>, _byName: Record<string, CatalogComponent>): Suggestion[] {
  return []
}
```

- [ ] **Schritt 2: `SelectionSidebar.tsx` anlegen**

```typescript
'use client'
import { cn } from '@/lib/utils'
import type { CatalogComponent } from '@/types'
import type { Conflict, Suggestion } from '@/lib/utils/catalog-compatibility'

interface Props {
  checked: Set<string>
  byName: Record<string, CatalogComponent>
  conflicts: Conflict[]
  suggestions: Suggestion[]
  onAddComponent: (name: string) => void
  onRemoveComponent: (name: string) => void
}

export function SelectionSidebar({
  checked,
  byName,
  conflicts,
  suggestions,
  onAddComponent,
  onRemoveComponent,
}: Props) {
  const checkedList = Array.from(checked)

  return (
    <aside
      aria-label="Meine Architektur"
      className="flex flex-col gap-3 p-3 bg-slate-50 border-l border-slate-200 min-w-[160px] overflow-y-auto"
    >
      <p className="text-xs font-bold text-slate-800">Meine Architektur</p>
      <p className="text-xs text-blue-600 font-medium">{checkedList.length} Komponente{checkedList.length !== 1 ? 'n' : ''} ausgewählt</p>

      {/* Konflikte */}
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 space-y-2">
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">⚠ {conflicts.length} Konflikt{conflicts.length !== 1 ? 'e' : ''}</p>
          {conflicts.map((c, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] text-red-800 font-medium">{c.a} ✗ {c.b}</p>
              {c.alternatives.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-1.5">
                  <p className="text-[9px] text-emerald-700 font-medium mb-1">💡 Alternative:</p>
                  {c.alternatives.map(alt => (
                    <button
                      key={alt}
                      onClick={() => onAddComponent(alt)}
                      disabled={checked.has(alt)}
                      className="block text-[10px] text-emerald-700 hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      {checked.has(alt) ? `✓ ${alt}` : `+ ${alt}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Vorschläge */}
      {suggestions.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 space-y-1.5">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">💡 {suggestions.length} Vorschlag{suggestions.length !== 1 ? '̈e' : ''}</p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-1">
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-emerald-800 truncate">{s.target}</p>
                <p className="text-[9px] text-slate-400 truncate">von {s.source}</p>
              </div>
              <button
                onClick={() => onAddComponent(s.target)}
                className="flex-shrink-0 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium hover:bg-emerald-500"
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Auswahl-Liste */}
      {checkedList.length > 0 && (
        <div className="border-t border-slate-200 pt-2 space-y-1">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Ausgewählt</p>
          {checkedList.map(name => {
            const comp = byName[name]
            return (
              <div key={name} className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-800 truncate">{name}</p>
                  {comp?.vendor && <p className="text-[9px] text-slate-400 truncate">{comp.vendor}</p>}
                </div>
                <button
                  onClick={() => onRemoveComponent(name)}
                  aria-label={`${name} abwählen`}
                  className="flex-shrink-0 text-slate-300 hover:text-red-500 text-sm leading-none"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
```

Hinweis: Der Import von `Conflict` und `Suggestion` aus `catalog-compatibility.ts` wird in Task 8 erstellt. Typescript wird bis dahin einen Fehler zeigen — das ist erwartet. In Task 8 wird die Datei erstellt und der Fehler verschwindet.

- [ ] **Schritt 2: Committen**

```bash
git add src/components/modules/SelectionSidebar.tsx
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): SelectionSidebar Komponente (Block 2)"
```

---

### Task 7: Layout-Integration — Sidebar in ArchitekturDiagramm

**Files:**
- Modify: `src/components/modules/ArchitectureDiagram.tsx`

- [ ] **Schritt 1: `SelectionSidebar` und leere Compatibility-Exports importieren**

In `ArchitectureDiagram.tsx` Imports am Anfang ergänzen:

```typescript
import { SelectionSidebar } from '@/components/modules/SelectionSidebar'
import { findConflicts, findSuggestions, type Conflict, type Suggestion } from '@/lib/utils/catalog-compatibility'
```

Hinweis: `catalog-compatibility.ts` wird in Task 8 erstellt. Bis dahin kann die Datei als Stub existieren (siehe nächster Schritt).

- [ ] **Schritt 2: `ArchitectureDiagram` Layout mit Sidebar erweitern**

Im `ArchitectureDiagram`-Hauptkomponent (Zeile ~230) nach den State-Deklarationen ergänzen:

```typescript
const conflicts   = findConflicts(checked, byName)
const suggestions = findSuggestions(checked, byName)
const showSidebar = checked.size > 0

const handleAddComponent  = (name: string) => setChecked(prev => new Set([...prev, name]))
const handleRemoveComponent = (name: string) => {
  setChecked(prev => { const next = new Set(prev); next.delete(name); return next })
}
```

Im `body`-JSX das Layout auf Flex-Row umstellen wenn Sidebar aktiv:

```tsx
const body = (
  <div className="relative">
    <div className={cn('flex', showSidebar ? 'flex-col md:flex-row' : 'flex-col')}>
      <div className={cn('min-w-0', showSidebar ? 'md:flex-[7]' : 'flex-1')}>
        <SwimlaneTable
          recs={recs}
          byName={byName}
          locked={locked}
          checked={checked}
          focused={focused}
          onCheck={handleCheck}
          onFocus={handleFocus}
        />
      </div>
      {showSidebar && !locked && (
        <div className="md:flex-[3] md:max-w-[260px]">
          <SelectionSidebar
            checked={checked}
            byName={byName}
            conflicts={conflicts}
            suggestions={suggestions}
            onAddComponent={handleAddComponent}
            onRemoveComponent={handleRemoveComponent}
          />
        </div>
      )}
    </div>
    {locked && (
      <div className="absolute inset-0 backdrop-blur-[3px] bg-white/55 flex flex-col items-center justify-center gap-3 rounded-b-2xl">
        <p className="text-sm font-semibold text-slate-700 text-center">Vollständiges Architekturdiagramm</p>
        <p className="text-xs text-slate-500 text-center max-w-52">
          {totalComponents} Komponenten in {mainLayers.length} Schichten — verfügbar ab Pro
        </p>
        <a href="/upgrade"
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors">
          Jetzt upgraden →
        </a>
      </div>
    )}
  </div>
)
```

- [ ] **Schritt 4: TypeScript-Compile prüfen**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

- [ ] **Schritt 5: Tests laufen lassen**

```bash
npm test
```

Expected: Alle Tests grün.

- [ ] **Schritt 6: Committen**

```bash
git add src/components/modules/ArchitectureDiagram.tsx src/lib/utils/catalog-compatibility.ts
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): Sidebar-Layout-Integration in ArchitekturDiagramm (Block 2 vollständig)"
```

---

## Block 3 — Abhängigkeits-Engine

### Task 8: `catalog-compatibility.ts` vollständig implementieren (TDD)

**Files:**
- Create: `src/__tests__/unit/catalog-compatibility.test.ts`
- Modify: `src/lib/utils/catalog-compatibility.ts`

- [ ] **Schritt 1: Failing Unit-Tests schreiben**

Neue Datei `src/__tests__/unit/catalog-compatibility.test.ts`:

```typescript
import { findConflicts, findSuggestions } from '@/lib/utils/catalog-compatibility'
import type { CatalogComponent } from '@/types'

function makeComp(name: string, overrides: Partial<CatalogComponent> = {}): CatalogComponent {
  return {
    id: name,
    name,
    vendor: null,
    category: null,
    description: null,
    website_url: null,
    icon_name: null,
    architecture_layer: 'model',
    cloud_provider: 'independent',
    hosting: [],
    infra_types: [],
    use_case_types: [],
    sap_compatible: false,
    sap_components: [],
    tags: [],
    incompatible_with: [],
    requires: [],
    suggests: [],
    source: 'manual',
    is_active: true,
    eu_ai_act_risk: null,
    dsgvo_status: 'compliant',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('findConflicts', () => {
  it('gibt [] zurück wenn keine Komponenten ausgewählt', () => {
    const byName = { 'SAP AI Core': makeComp('SAP AI Core', { incompatible_with: ['vLLM'] }) }
    expect(findConflicts(new Set(), byName)).toEqual([])
  })

  it('erkennt Konflikt wenn A.incompatible_with B enthält', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', { incompatible_with: ['vLLM'] }),
      'vLLM':        makeComp('vLLM'),
    }
    const result = findConflicts(new Set(['SAP AI Core', 'vLLM']), byName)
    expect(result).toHaveLength(1)
    expect(result[0].a).toBe('SAP AI Core')
    expect(result[0].b).toBe('vLLM')
  })

  it('erkennt Konflikt bidirektional — auch wenn nur B.incompatible_with A', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core'),
      'vLLM':        makeComp('vLLM', { incompatible_with: ['SAP AI Core'] }),
    }
    const result = findConflicts(new Set(['SAP AI Core', 'vLLM']), byName)
    expect(result).toHaveLength(1)
  })

  it('meldet keinen Konflikt wenn inkompatible Komponente nicht ausgewählt', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', { incompatible_with: ['vLLM'] }),
      'vLLM':        makeComp('vLLM'),
    }
    expect(findConflicts(new Set(['SAP AI Core']), byName)).toEqual([])
  })

  it('enthält alternatives aus suggests der beteiligten Komponenten', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', {
        incompatible_with: ['vLLM'],
        suggests: ['SAP GenAI Hub'],
      }),
      'vLLM': makeComp('vLLM'),
    }
    const result = findConflicts(new Set(['SAP AI Core', 'vLLM']), byName)
    expect(result[0].alternatives).toContain('SAP GenAI Hub')
  })

  it('gibt keinen doppelten Konflikt zurück wenn beide Seiten incompatible_with setzen', () => {
    const byName = {
      'A': makeComp('A', { incompatible_with: ['B'] }),
      'B': makeComp('B', { incompatible_with: ['A'] }),
    }
    const result = findConflicts(new Set(['A', 'B']), byName)
    expect(result).toHaveLength(1)
  })
})

describe('findSuggestions', () => {
  it('gibt [] zurück wenn keine Komponenten ausgewählt', () => {
    expect(findSuggestions(new Set(), {})).toEqual([])
  })

  it('gibt Vorschlag zurück für ausgewählte Komponente mit suggests', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', { suggests: ['SAP HANA Cloud'] }),
      'SAP HANA Cloud': makeComp('SAP HANA Cloud'),
    }
    const result = findSuggestions(new Set(['SAP AI Core']), byName)
    expect(result).toHaveLength(1)
    expect(result[0].source).toBe('SAP AI Core')
    expect(result[0].target).toBe('SAP HANA Cloud')
  })

  it('schließt bereits ausgewählte Komponenten aus den Vorschlägen aus', () => {
    const byName = {
      'SAP AI Core': makeComp('SAP AI Core', { suggests: ['SAP HANA Cloud'] }),
      'SAP HANA Cloud': makeComp('SAP HANA Cloud'),
    }
    const result = findSuggestions(new Set(['SAP AI Core', 'SAP HANA Cloud']), byName)
    expect(result).toHaveLength(0)
  })

  it('gibt keine Duplikate zurück wenn mehrere Komponenten dasselbe vorschlagen', () => {
    const byName = {
      'A': makeComp('A', { suggests: ['C'] }),
      'B': makeComp('B', { suggests: ['C'] }),
      'C': makeComp('C'),
    }
    const result = findSuggestions(new Set(['A', 'B']), byName)
    expect(result.filter(s => s.target === 'C')).toHaveLength(1)
  })
})
```

- [ ] **Schritt 2: Tests laufen lassen — müssen fehlschlagen**

```bash
npm test -- --testPathPattern="catalog-compatibility"
```

Expected: FAIL (Stub-Implementierung gibt immer `[]` zurück).

- [ ] **Schritt 3: `catalog-compatibility.ts` vollständig implementieren**

```typescript
import type { CatalogComponent } from '@/types'

export interface Conflict {
  a: string
  b: string
  alternatives: string[]
}

export interface Suggestion {
  source: string
  target: string
}

export function findConflicts(
  checked: Set<string>,
  byName: Record<string, CatalogComponent>
): Conflict[] {
  const checkedList = Array.from(checked)
  const conflicts: Conflict[] = []
  const seen = new Set<string>()

  for (let i = 0; i < checkedList.length; i++) {
    for (let j = i + 1; j < checkedList.length; j++) {
      const a = checkedList[i]
      const b = checkedList[j]
      const compA = byName[a]
      const compB = byName[b]

      const isConflict =
        compA?.incompatible_with.includes(b) ||
        compB?.incompatible_with.includes(a)

      if (!isConflict) continue

      const pairKey = [a, b].sort().join('||')
      if (seen.has(pairKey)) continue
      seen.add(pairKey)

      const alternatives = Array.from(new Set([
        ...(compA?.suggests ?? []),
        ...(compB?.suggests ?? []),
      ])).filter(alt => !checked.has(alt))

      conflicts.push({ a, b, alternatives })
    }
  }

  return conflicts
}

export function findSuggestions(
  checked: Set<string>,
  byName: Record<string, CatalogComponent>
): Suggestion[] {
  const seen = new Set<string>()
  const suggestions: Suggestion[] = []

  for (const name of checked) {
    const comp = byName[name]
    if (!comp) continue
    for (const target of comp.suggests) {
      if (checked.has(target)) continue
      if (seen.has(target)) continue
      seen.add(target)
      suggestions.push({ source: name, target })
    }
  }

  return suggestions
}
```

- [ ] **Schritt 4: Tests laufen lassen — müssen grün sein**

```bash
npm test -- --testPathPattern="catalog-compatibility"
```

Expected: 9/9 Tests grün.

- [ ] **Schritt 5: Gesamte Test-Suite prüfen**

```bash
npm test
```

Expected: Alle Tests grün.

- [ ] **Schritt 6: Committen**

```bash
git add src/lib/utils/catalog-compatibility.ts src/__tests__/unit/catalog-compatibility.test.ts
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): Abhängigkeits-Engine — findConflicts + findSuggestions (TDD)"
```

---

### Task 9: Diagramm-Anreicherung — Konflikt/Vorschlag visuell darstellen

**Files:**
- Modify: `src/components/modules/ArchitectureDiagram.tsx`

- [ ] **Schritt 1: `ComponentButton` um Konflikt/Vorschlag-Props erweitern**

```typescript
// Props ergänzen:
function ComponentButton({
  name,
  comp,
  isChecked,
  isFocused,
  isConflicting,
  isSuggested,
  locked,
  onCheck,
  onFocus,
}: {
  name: string
  comp: CatalogComponent | undefined
  isChecked: boolean
  isFocused: boolean
  isConflicting: boolean  // inkompatibel mit einer ausgewählten Komponente
  isSuggested: boolean    // von einer ausgewählten Komponente vorgeschlagen
  locked: boolean
  onCheck: () => void
  onFocus: () => void
})
```

Styling im Rendering aktualisieren:

```tsx
return (
  <div
    className={cn(
      'inline-flex items-center rounded-lg border text-xs font-medium transition-all',
      isChecked
        ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-sm'
        : isConflicting
        ? 'border-red-400 bg-red-50 text-red-800'
        : isSuggested
        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
        : 'border-slate-200 bg-white text-slate-700',
      isFocused && 'ring-2 ring-blue-400 ring-offset-1',
    )}
    title={
      isConflicting ? `Inkompatibel mit einer ausgewählten Komponente` :
      isSuggested   ? `Empfohlen als Ergänzung` :
      undefined
    }
  >
    {/* Checkbox und Name-Button wie in Task 5 */}
    ...
  </div>
)
```

- [ ] **Schritt 2: `SwimlaneTable` Props um Konflikt/Vorschlag-Sets erweitern**

```typescript
function SwimlaneTable({
  recs,
  byName,
  locked,
  checked,
  focused,
  conflictingNames,
  suggestedNames,
  onCheck,
  onFocus,
}: {
  ...
  conflictingNames: Set<string>  // alle Namen, die mit einer ausgewählten inkompatibel sind
  suggestedNames: Set<string>    // alle vorgeschlagenen Namen
  ...
})
```

- [ ] **Schritt 3: `wouldConflictIfChecked` und `suggestedNames` im Hauptkomponent berechnen**

Rot anzeigen = un-angekreuzte Komponenten, die einen Konflikt verursachen würden wenn sie ausgewählt werden. Dieser Satz wird direkt im Diagramm aus den Katalog-Daten berechnet, unabhängig von `findConflicts` (welches nur bereits ausgewählte Paare prüft):

```typescript
// Welche un-angekreuzten Komponenten würden bei Auswahl einen Konflikt erzeugen?
const wouldConflictIfChecked = new Set<string>()
for (const name of checked) {
  const comp = byName[name]
  if (!comp) continue
  // Vorwärts: checked.comp sagt B ist inkompatibel
  for (const incompat of comp.incompatible_with) {
    if (!checked.has(incompat)) wouldConflictIfChecked.add(incompat)
  }
}
// Rückwärts: andere Komponente sagt checked.comp ist inkompatibel
for (const [otherName, otherComp] of Object.entries(byName)) {
  if (checked.has(otherName)) continue
  for (const incompat of otherComp.incompatible_with) {
    if (checked.has(incompat)) { wouldConflictIfChecked.add(otherName); break }
  }
}

const suggestedNames = new Set(suggestions.map(s => s.target))
```

- [ ] **Schritt 4: `ComponentButton`-Aufrufe in `SwimlaneTable` aktualisieren**

```tsx
<ComponentButton
  key={name}
  name={name}
  comp={byName[name]}
  isChecked={checked.has(name)}
  isFocused={focused === name}
  isConflicting={wouldConflictIfChecked.has(name)}
  isSuggested={suggestedNames.has(name) && !checked.has(name)}
  locked={false}
  onCheck={() => onCheck(name)}
  onFocus={() => onFocus(name)}
/>
```

- [ ] **Schritt 5: TypeScript-Compile prüfen**

```bash
npx tsc --noEmit
```

Expected: Keine Fehler.

- [ ] **Schritt 6: Tests laufen lassen**

```bash
npm test
```

Expected: Alle Tests grün.

- [ ] **Schritt 7: Committen**

```bash
git add src/components/modules/ArchitectureDiagram.tsx
git -c user.email="ostneralf@freenet.de" -c user.name="Daniel_O" commit -m "feat(#60): Diagramm-Anreicherung — Konflikt-rot + Vorschlag-grün (Block 3)"
```

---

### Task 10: GitHub Issue #60 schließen + ESLint + Gesamtprüfung

**Files:**
- Keine neuen Dateien

- [ ] **Schritt 1: ESLint prüfen**

```bash
npx eslint src --max-warnings 0
```

Expected: 0 Errors, 0 Warnings. Alle ESLint-Fehler beheben bevor weiter.

- [ ] **Schritt 2: Gesamte Test-Suite**

```bash
npm test
```

Expected: Alle Tests grün.

- [ ] **Schritt 3: Build-Check**

```bash
npm run build
```

Expected: Kein Build-Fehler.

- [ ] **Schritt 4: GitHub Issue #60 schließen**

```bash
gh issue close 60 --repo ostneralf-blip/Enterprise-ai --comment "Implementiert in Block 1–3: DB-Migration (incompatible_with/requires/suggests), Admin-Editor, Upload-Route, interaktives Swimlane-Diagramm mit Checkbox + Focus, SelectionSidebar, bidirektionale Abhängigkeits-Engine (findConflicts/findSuggestions)."
```

- [ ] **Schritt 5: Push**

```bash
git push
```
