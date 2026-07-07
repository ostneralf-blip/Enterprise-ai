# Compliance-Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Regulatorische Änderungen (DSGVO, EU AI Act, BDSG) verfolgen — Quellenangaben pro Check, Beobachtungsliste für laufende Gesetzgebung im Compliance-Modul, manuell auslösbarer Scanner im Admin-Panel der 5 Primärquellen auf Änderungen prüft und Entwürfe zur Admin-Freigabe anlegt.

**Architecture:** Drei Schichten — (1) Daten: `compliance-data.ts` erhält Quellenfelder + `REGULATORY_WATCHLIST`, (2) UI: `CompliancePageClient` zeigt die Watchlist als gelb markierten Bereich, (3) Scanner: 2 neue DB-Tabellen + API-Route + Admin-Tab mit manuellem Trigger-Button und Draft-Review. Kein Auto-Publish, kein Cron — alle Änderungen landen als `pending_review`-Entwurf zur manuellen Freigabe.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase PostgreSQL + RLS, Anthropic Messages API (direkt via fetch, kein SDK), Tailwind + shadcn/ui, Jest + Testing Library

---

## Datei-Übersicht

| Datei | Aktion | Verantwortung |
|---|---|---|
| `src/config/compliance-data.ts` | Modify | `ChecklistItem` + `sourceUrl`/`lastVerified`, neuer DSGVO-Check, `REGULATORY_WATCHLIST` |
| `src/__tests__/unit/compliance-data.test.ts` | Modify | Tests für REGULATORY_WATCHLIST + neuen DSGVO-Check |
| `src/components/modules/WatchlistCard.tsx` | Create | Presentational-Komponente für einen Watchlist-Eintrag |
| `src/__tests__/accessibility/compliance-a11y.test.tsx` | Modify | A11y-Test für WatchlistCard |
| `src/app/(dashboard)/compliance/CompliancePageClient.tsx` | Modify | Watchlist-Sektion am Seitenende |
| `supabase/migrations/*_create_source_snapshots.sql` | Create | Tabelle für URL-Hash-Snapshots |
| `supabase/migrations/*_create_compliance_source_drafts.sql` | Create | Tabelle für Scanner-Entwürfe |
| `src/types/index.ts` | Modify | `ComplianceSourceDraft`-Typ |
| `src/app/api/admin/compliance/scan/route.ts` | Create | POST-Route: fetch + hash + Claude + draft |
| `src/__tests__/security/compliance-scan-security.test.ts` | Create | 403 für non-Admin, RLS-Guard |
| `src/app/(dashboard)/admin/AdminPageClient.tsx` | Modify | Tab `'scanner'`, State, UI |
| `src/app/(dashboard)/admin/page.tsx` | Modify | Initiale Drafts server-seitig laden |

---

## Task 1: Daten-Layer — compliance-data.ts erweitern

**Files:**
- Modify: `src/config/compliance-data.ts:7-14` (ChecklistItem interface)
- Modify: `src/config/compliance-data.ts:282-288` (nach dsgvo_art44 einfügen)
- Modify: `src/config/compliance-data.ts:104-205` (sourceUrl/lastVerified auf EU AI Act Items)
- Modify: `src/config/compliance-data.ts` (ans Dateiende: WatchlistStatus + WatchlistItem + REGULATORY_WATCHLIST)
- Test: `src/__tests__/unit/compliance-data.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

Ergänze `src/__tests__/unit/compliance-data.test.ts` am Ende des bestehenden `describe`-Blocks:

```typescript
import {
  EU_AI_ACT_RISK_CLASSES,
  EU_AI_ACT_OBLIGATIONS,
  DSGVO_CHECKLIST,
  RISK_MATRIX,
  getRiskLevel,
  POLICY_TEMPLATES,
  REGULATORY_WATCHLIST,   // neu — wird noch fehlen → Test schlägt fehl
} from '@/config/compliance-data'
```

Füge ganz unten in der Datei einen neuen `describe`-Block an:

```typescript
describe('REGULATORY_WATCHLIST', () => {
  it('mindestens 3 Einträge sind definiert', () => {
    expect(REGULATORY_WATCHLIST.length).toBeGreaterThanOrEqual(3)
  })

  it('jeder Eintrag hat id, title, status, summary, potentialImpact, sourceUrl, lastChecked', () => {
    REGULATORY_WATCHLIST.forEach(item => {
      expect(item.id).toBeTruthy()
      expect(item.title).toBeTruthy()
      expect(item.status).toBeTruthy()
      expect(item.summary).toBeTruthy()
      expect(item.potentialImpact).toBeTruthy()
      expect(item.sourceUrl).toBeTruthy()
      expect(item.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it('IDs sind eindeutig', () => {
    const ids = REGULATORY_WATCHLIST.map(i => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('status ist immer ein gültiger WatchlistStatus-Wert', () => {
    const valid = ['in_gesetzgebung', 'angekuendigt', 'final']
    REGULATORY_WATCHLIST.forEach(item => {
      expect(valid).toContain(item.status)
    })
  })

  it('digital_omnibus_hrais_delay-Eintrag ist vorhanden', () => {
    const entry = REGULATORY_WATCHLIST.find(i => i.id === 'digital_omnibus_hrais_delay')
    expect(entry).toBeDefined()
    expect(entry?.status).toBe('in_gesetzgebung')
  })

  it('neuer DSGVO-Check dsgvo_edpb_cef2026 ist in DSGVO_CHECKLIST', () => {
    const check = DSGVO_CHECKLIST.find(i => i.id === 'dsgvo_edpb_cef2026')
    expect(check).toBeDefined()
    expect(check?.sourceUrl).toBe('https://www.edpb.europa.eu/news_de')
    expect(check?.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('EU AI Act Hochrisiko-Pflichten haben sourceUrl', () => {
    EU_AI_ACT_OBLIGATIONS.high.forEach(item => {
      expect(item.sourceUrl).toContain('eur-lex.europa.eu')
    })
  })
})
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

```bash
npm test -- src/__tests__/unit/compliance-data.test.ts --no-coverage
```

Erwartetes Ergebnis: `FAIL` — `REGULATORY_WATCHLIST` nicht gefunden, `dsgvo_edpb_cef2026` nicht gefunden.

- [ ] **Step 3: ChecklistItem-Interface erweitern**

In `src/config/compliance-data.ts`, Zeile 7–14, ersetze das Interface:

```typescript
export interface ChecklistItem {
  id: string          // wird als check_type in DB gespeichert
  article?: string
  label: string
  description?: string
  relevance?: string  // warum relevant für AI
  category?: string   // für Regelwerke ohne Artikel-Referenz (ISO, NIS-2 etc.)
  sourceUrl?: string  // Beleg-Link zur Primärquelle
  lastVerified?: string // ISO-Datum (YYYY-MM-DD) der letzten Prüfung
}
```

- [ ] **Step 4: Neuen DSGVO-Check nach dsgvo_art44 einfügen**

In `src/config/compliance-data.ts`, nach dem Block mit `id: 'dsgvo_art44'` (Zeile ~287, direkt vor `]`), einfügen:

```typescript
  {
    id: 'dsgvo_edpb_cef2026',
    article: 'Art. 12–14 DSGVO',
    label: 'Transparenz- und Informationspflichten EDPB-prüfsicher (Schwerpunkt 2026)',
    description:
      'Der EDPB hat die Einhaltung der Transparenz- und Informationspflichten zum ' +
      'EU-weiten Prüfschwerpunkt 2026 erklärt (Coordinated Enforcement Framework). ' +
      'Datenschutzhinweise werden 2026 verstärkt auf Klarheit, Vollständigkeit und ' +
      'korrekte KI-Kennzeichnung geprüft.',
    relevance:
      'KI-Systeme (Chatbots, Scoring, Profiling) müssen im Datenschutzhinweis ' +
      'explizit benannt werden — inkl. Angabe, ob Trainingsdaten oder Profiling ' +
      'betroffen sind. Copy-Paste-Datenschutzerklärungen ohne KI-Bezug sind das ' +
      'häufigste Prüfrisiko.',
    sourceUrl: 'https://www.edpb.europa.eu/news_de',
    lastVerified: '2026-07-07',
  },
```

- [ ] **Step 5: sourceUrl + lastVerified auf alle EU AI Act Items setzen**

Füge `sourceUrl` und `lastVerified` zu jedem Item in `EU_AI_ACT_OBLIGATIONS.limited` und `EU_AI_ACT_OBLIGATIONS.high` hinzu. Die URL ist für alle identisch. Beispiel für `euaiact_art50_1` — dasselbe Schema für alle 14 Items:

```typescript
// limited — alle 3 Items:
{
  id: 'euaiact_art50_1',
  // ... bestehende Felder unverändert ...
  sourceUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689',
  lastVerified: '2026-07-07',
},
```

IDs die aktualisiert werden (alle 11 `high` + alle 3 `limited`):
`euaiact_art9`, `euaiact_art10`, `euaiact_art11`, `euaiact_art12`, `euaiact_art13`, `euaiact_art14`, `euaiact_art15`, `euaiact_art43`, `euaiact_art46`, `euaiact_art71`, `euaiact_art72`, `euaiact_art50_1`, `euaiact_art50_2`, `euaiact_art50_3`

- [ ] **Step 6: REGULATORY_WATCHLIST ans Dateiende anhängen**

Direkt hinter dem letzten `export const ADDITIONAL_REGULATIONS` Block, am Ende von `src/config/compliance-data.ts`:

```typescript
// ─── BEOBACHTUNGSLISTE — LAUFENDE GESETZGEBUNG (NICHT VERBINDLICH) ──────────
// Diese Einträge sind KEINE Compliance-Pflichten. Sie zeigen an, was sich
// ändern könnte. Erst nach Veröffentlichung im EU-Amtsblatt (EUR-Lex) in
// DSGVO_CHECKLIST / EU_AI_ACT_OBLIGATIONS verschieben.

export type WatchlistStatus = 'in_gesetzgebung' | 'angekuendigt' | 'final'

export interface WatchlistItem {
  id: string
  title: string
  status: WatchlistStatus
  summary: string
  potentialImpact: string
  sourceUrl: string
  lastChecked: string // ISO-Datum YYYY-MM-DD
}

export const REGULATORY_WATCHLIST: WatchlistItem[] = [
  {
    id: 'digital_omnibus_hrais_delay',
    title: 'EU AI Act: Verschiebung der Hochrisiko-Pflichten (Annex III)',
    status: 'in_gesetzgebung',
    summary:
      'Vorläufige Einigung vom 7. Mai 2026 (Digital Omnibus on AI) verschiebt die ' +
      'Annex-III-Hochrisiko-Pflichten von August 2026 auf Dezember 2027. Noch nicht ' +
      'final im Amtsblatt veröffentlicht.',
    potentialImpact:
      'Betrifft Fristangaben im Roadmap-Generator und Governance-Entscheidungsbaum ' +
      'für Hochrisiko-Use-Cases. Bei finaler Verabschiedung: Fristen dort anpassen.',
    sourceUrl: 'https://www.insideglobaltech.com/2026/05/28/eu-ai-act-update-timeline-relief-targeted-simplification-and-new-prohibitions/',
    lastChecked: '2026-07-07',
  },
  {
    id: 'bdsg_dsb_threshold',
    title: 'BDSG: Mögliche Lockerung der DSB-Bestellpflicht',
    status: 'angekuendigt',
    summary:
      'Koalitionsausschuss kündigte am 2. Juli 2026 ein Reformpaket an, das die ' +
      'deutsche 20-Personen-Sonderschwelle für die DSB-Bestellpflicht auf ' +
      'DSGVO-Niveau (Art. 37) zurückführen könnte. Bislang nur Ankündigung, kein ' +
      'Gesetzentwurf.',
    potentialImpact:
      'Falls verabschiedet: DSB-Pflicht-Check in der DSGVO-Checkliste für kleinere ' +
      'Kunden anpassen — Schwellenwert-Logik im Compliance Center betroffen.',
    sourceUrl: 'https://www.datenschutz-nordost.de/reformpaket-der-bundesregierung/',
    lastChecked: '2026-07-07',
  },
  {
    id: 'breach_96h_single_entry',
    title: 'Meldefrist für Datenschutzverletzungen: 96h + zentraler Meldepunkt',
    status: 'in_gesetzgebung',
    summary:
      'Digital-Omnibus-Vorschlag verlängert die Meldefrist von 72 auf 96 Stunden ' +
      'und plant einen zentralen „Single Entry Point" für Meldungen aus NIS-2, ' +
      'DSGVO, DORA, eIDAS und CRA.',
    potentialImpact:
      'Betrifft die Eskalationspfade und Fristangaben im Governance-Modul ' +
      '(Auslöser „Datenpanne" — aktuell 72h/DSGVO hinterlegt).',
    sourceUrl: 'https://caralegal.eu/blog/datenschutz-2026-trends/',
    lastChecked: '2026-07-07',
  },
]
```

- [ ] **Step 7: Tests laufen lassen — müssen grün sein**

```bash
npm test -- src/__tests__/unit/compliance-data.test.ts --no-coverage
```

Erwartetes Ergebnis: alle Tests grün, inklusive der neuen `REGULATORY_WATCHLIST`-Beschreibung.

- [ ] **Step 8: TypeScript prüfen**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Step 9: Commit**

```bash
git add src/config/compliance-data.ts src/__tests__/unit/compliance-data.test.ts
git commit -m "feat: compliance-data Quellenfelder + REGULATORY_WATCHLIST + EDPB-2026-Check"
```

---

## Task 2: Watchlist-UI — WatchlistCard + CompliancePageClient

**Files:**
- Create: `src/components/modules/WatchlistCard.tsx`
- Modify: `src/app/(dashboard)/compliance/CompliancePageClient.tsx`
- Modify: `src/__tests__/accessibility/compliance-a11y.test.tsx`

- [ ] **Step 1: A11y-Test für WatchlistCard schreiben (failing)**

Öffne `src/__tests__/accessibility/compliance-a11y.test.tsx` und füge am Ende einen neuen `describe`-Block hinzu. Du musst zuerst `WatchlistItem` und `WatchlistCard` importieren:

```typescript
import { WatchlistCard } from '@/components/modules/WatchlistCard'
import type { WatchlistItem } from '@/config/compliance-data'

const MOCK_WATCHLIST_ITEM: WatchlistItem = {
  id: 'test_item',
  title: 'Test Regulierungsänderung',
  status: 'in_gesetzgebung',
  summary: 'Zusammenfassung der Änderung.',
  potentialImpact: 'Betrifft Compliance-Checkliste.',
  sourceUrl: 'https://example.com',
  lastChecked: '2026-07-07',
}

describe('Accessibility: WatchlistCard', () => {
  it('hat keine WCAG-Verstöße', async () => {
    const { container } = render(<WatchlistCard item={MOCK_WATCHLIST_ITEM} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('zeigt Titel und Status-Badge', () => {
    render(<WatchlistCard item={MOCK_WATCHLIST_ITEM} />)
    expect(screen.getByText('Test Regulierungsänderung')).toBeInTheDocument()
    expect(screen.getByText('In Gesetzgebung')).toBeInTheDocument()
  })

  it('zeigt angekuendigt-Badge bei status=angekuendigt', () => {
    render(<WatchlistCard item={{ ...MOCK_WATCHLIST_ITEM, status: 'angekuendigt' }} />)
    expect(screen.getByText('Angekündigt')).toBeInTheDocument()
  })

  it('zeigt final-Badge bei status=final', () => {
    render(<WatchlistCard item={{ ...MOCK_WATCHLIST_ITEM, status: 'final' }} />)
    expect(screen.getByText('Final — Übernahme ausstehend')).toBeInTheDocument()
  })

  it('enthält Quellen-Link mit korrekter href', () => {
    render(<WatchlistCard item={MOCK_WATCHLIST_ITEM} />)
    const link = screen.getByRole('link', { name: /quelle/i })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

```bash
npm test -- src/__tests__/accessibility/compliance-a11y.test.tsx --no-coverage
```

Erwartetes Ergebnis: `FAIL` — `WatchlistCard` nicht gefunden.

- [ ] **Step 3: WatchlistCard Komponente erstellen**

Erstelle `src/components/modules/WatchlistCard.tsx`:

```typescript
'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { WatchlistItem, WatchlistStatus } from '@/config/compliance-data'

const STATUS_CONFIG: Record<WatchlistStatus, { label: string; className: string }> = {
  in_gesetzgebung: { label: 'In Gesetzgebung',             className: 'bg-amber-100 text-amber-700 border-amber-200' },
  angekuendigt:    { label: 'Angekündigt',                  className: 'bg-slate-100 text-slate-600 border-slate-200' },
  final:           { label: 'Final — Übernahme ausstehend', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export function WatchlistCard({ item }: { item: WatchlistItem }) {
  const [open, setOpen] = useState(false)
  const status = STATUS_CONFIG[item.status]

  return (
    <div className="bg-white border border-amber-100 rounded-lg p-4 space-y-2">
      <div className="flex flex-wrap items-start gap-2 min-w-0">
        <span className={cn('px-2 py-0.5 text-xs font-medium border rounded-full flex-shrink-0', status.className)}>
          {status.label}
        </span>
        <p className="text-sm font-medium text-slate-800 min-w-0">{item.title}</p>
      </div>
      <p className="text-xs text-slate-600">{item.summary}</p>
      <details open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="text-xs text-amber-700 cursor-pointer hover:text-amber-900 list-none">
          {open ? '▲ Auswirkungen verbergen' : '▼ Mögliche Auswirkungen anzeigen'}
        </summary>
        <p className="text-xs text-slate-500 mt-1.5 pl-2 border-l-2 border-amber-200">{item.potentialImpact}</p>
      </details>
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <span>Zuletzt geprüft: {item.lastChecked}</span>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          aria-label="Quelle öffnen"
        >
          Quelle ↗
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: REGULATORY_WATCHLIST-Sektion in CompliancePageClient einbauen**

Öffne `src/app/(dashboard)/compliance/CompliancePageClient.tsx`.

Ergänze den Import oben:

```typescript
import { REGULATORY_WATCHLIST } from '@/config/compliance-data'
import { WatchlistCard } from '@/components/modules/WatchlistCard'
```

Füge direkt vor dem letzten `</div>` des Haupt-Return (nach den bestehenden Checklisten-Sektionen) ein:

```tsx
{/* Regulatorische Beobachtungsliste */}
<div className="border border-amber-200 rounded-xl bg-amber-50 p-4 sm:p-6 space-y-3 mt-6">
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-sm font-semibold text-amber-700">Regulatorische Beobachtungsliste</span>
    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full">
      In Gesetzgebung — noch nicht verbindlich
    </span>
    <span className="text-xs text-amber-600 ml-auto">({REGULATORY_WATCHLIST.length})</span>
  </div>
  <p className="text-xs text-amber-600">
    Diese Einträge sind keine Compliance-Pflichten. Sie zeigen an, was sich ändern könnte.
    Erst nach Veröffentlichung im EU-Amtsblatt (EUR-Lex) werden sie in die Checklisten übernommen.
  </p>
  <div className="space-y-2">
    {REGULATORY_WATCHLIST.map(item => (
      <WatchlistCard key={item.id} item={item} />
    ))}
  </div>
</div>
```

- [ ] **Step 5: Tests laufen lassen — müssen grün sein**

```bash
npm test -- src/__tests__/accessibility/compliance-a11y.test.tsx --no-coverage
```

Erwartetes Ergebnis: alle Tests grün.

- [ ] **Step 6: Vollständige Test-Suite + TypeScript**

```bash
npx tsc --noEmit && npm test -- --passWithNoTests
```

Erwartetes Ergebnis: TypeScript clean, alle Tests grün.

- [ ] **Step 7: Commit**

```bash
git add src/components/modules/WatchlistCard.tsx \
        src/app/\(dashboard\)/compliance/CompliancePageClient.tsx \
        src/__tests__/accessibility/compliance-a11y.test.tsx
git commit -m "feat: Regulatory Watchlist UI — WatchlistCard + CompliancePageClient-Sektion"
```

---

## Task 3: DB-Migrationen + Typen

**Files:**
- Create: `supabase/migrations/*_create_source_snapshots.sql` (via CLI)
- Create: `supabase/migrations/*_create_compliance_source_drafts.sql` (via CLI)
- Modify: `src/types/index.ts`

- [ ] **Step 1: Migration für source_snapshots erstellen**

```bash
supabase migration new create_source_snapshots
```

Schreibe in die generierte Datei (`supabase/migrations/YYYYMMDDHHMMSS_create_source_snapshots.sql`):

```sql
CREATE TABLE IF NOT EXISTS public.source_snapshots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT        NOT NULL,
  label         TEXT        NOT NULL,
  content_hash  TEXT        NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_snapshots_url_fetched
  ON public.source_snapshots (url, fetched_at DESC);

ALTER TABLE public.source_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON public.source_snapshots
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

- [ ] **Step 2: Migration für compliance_source_drafts erstellen**

```bash
supabase migration new create_compliance_source_drafts
```

Schreibe in die generierte Datei:

```sql
CREATE TABLE IF NOT EXISTS public.compliance_source_drafts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url       TEXT        NOT NULL,
  source_label     TEXT        NOT NULL,
  summary          TEXT        NOT NULL,
  status_estimate  TEXT        NOT NULL
    CONSTRAINT compliance_source_drafts_estimate_check
    CHECK (status_estimate IN ('final', 'entwurf', 'unklar')),
  review_status    TEXT        NOT NULL DEFAULT 'pending_review'
    CONSTRAINT compliance_source_drafts_review_check
    CHECK (review_status IN ('pending_review', 'beruecksichtigt', 'ignoriert')),
  scanned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID        REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_drafts_review_status
  ON public.compliance_source_drafts (review_status, scanned_at DESC);

ALTER TABLE public.compliance_source_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON public.compliance_source_drafts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
```

- [ ] **Step 3: Migrationen pushen**

```bash
supabase db push
```

Erwartetes Ergebnis: `Applying migration ..._create_source_snapshots.sql...` und `Applying migration ..._create_compliance_source_drafts.sql...` gefolgt von `Finished supabase db push.`

- [ ] **Step 4: ComplianceSourceDraft-Typ in src/types/index.ts hinzufügen**

Füge am Ende von `src/types/index.ts` ein:

```typescript
// ─── COMPLIANCE SCANNER ───────────────────────────────────────────────────────
export interface ComplianceSourceDraft {
  id: string
  source_url: string
  source_label: string
  summary: string
  status_estimate: 'final' | 'entwurf' | 'unklar'
  review_status: 'pending_review' | 'beruecksichtigt' | 'ignoriert'
  scanned_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}
```

- [ ] **Step 5: TypeScript prüfen**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: keine Fehler.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/ src/types/index.ts
git commit -m "feat: DB-Migrationen source_snapshots + compliance_source_drafts + Typ"
```

---

## Task 4: Scan-API-Route

**Files:**
- Create: `src/app/api/admin/compliance/scan/route.ts`
- Create: `src/__tests__/security/compliance-scan-security.test.ts`

- [ ] **Step 1: Security-Test schreiben (failing)**

Erstelle `src/__tests__/security/compliance-scan-security.test.ts`:

```typescript
import { POST } from '@/app/api/admin/compliance/scan/route'

// requireAdmin wirft für Nicht-Admins — simuliert 403
jest.mock('@/lib/utils/admin-check', () => ({
  requireAdmin: jest.fn().mockRejectedValue(new Error('Forbidden')),
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    insert: jest.fn().mockResolvedValue({ error: null }),
  }),
}))

describe('Security: POST /api/admin/compliance/scan', () => {
  it('gibt 403 zurück für nicht-Admin', async () => {
    const req = new Request('http://localhost/api/admin/compliance/scan', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })
})
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

```bash
npm test -- src/__tests__/security/compliance-scan-security.test.ts --no-coverage
```

Erwartetes Ergebnis: `FAIL` — Route noch nicht vorhanden.

- [ ] **Step 3: Verzeichnis + Route erstellen**

```bash
mkdir -p "src/app/api/admin/compliance/scan"
```

Erstelle `src/app/api/admin/compliance/scan/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const COMPLIANCE_SOURCES = [
  { url: 'https://www.edpb.europa.eu/news_de', label: 'EDPB Newsroom' },
  { url: 'https://www.datenschutzkonferenz-online.de/pressemitteilungen.html', label: 'DSK Pressemitteilungen' },
  { url: 'https://artificialintelligenceact.eu/implementation-timeline/', label: 'AI Act Timeline' },
  { url: 'https://ai-act-service-desk.ec.europa.eu/s/', label: 'EU AI Act Service Desk' },
  { url: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689', label: 'EUR-Lex AI Act Volltext' },
]

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000) // max 8k Zeichen für Claude-Prompt
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'AI-Navigator-ComplianceMonitor/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return stripHtml(html)
  } catch {
    return null
  }
}

async function summarizeWithClaude(oldText: string, newText: string): Promise<{ summary: string; status_estimate: 'final' | 'entwurf' | 'unklar' }> {
  const FALLBACK = { summary: '(Automatische Zusammenfassung fehlgeschlagen — manuell prüfen)', status_estimate: 'unklar' as const }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return FALLBACK

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Du bist ein Compliance-Analyst. Vergleiche die beiden Texte und antworte NUR als JSON ohne Markdown-Wrapper.

VORHER:
${oldText.slice(0, 3000)}

NACHHER:
${newText.slice(0, 3000)}

Antworte genau so:
{"summary":"<max 3 Sätze auf Deutsch was sich geändert hat>","status_estimate":"<final|entwurf|unklar>"}

final = im EU-Amtsblatt veröffentlicht. entwurf = Vorschlag/Einigung noch nicht verabschiedet. unklar = nicht bestimmbar.`,
        }],
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return FALLBACK
    const data = await res.json() as { content: Array<{ text: string }> }
    const text = data.content?.[0]?.text ?? ''
    const parsed = JSON.parse(text) as { summary: string; status_estimate: string }
    if (!parsed.summary) return FALLBACK
    const estimate = ['final', 'entwurf', 'unklar'].includes(parsed.status_estimate)
      ? (parsed.status_estimate as 'final' | 'entwurf' | 'unklar')
      : 'unklar'
    return { summary: parsed.summary, status_estimate: estimate }
  } catch {
    return FALLBACK
  }
}

export async function POST() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  let changed = 0
  let draftsCreated = 0

  for (const source of COMPLIANCE_SOURCES) {
    const newText = await fetchText(source.url)
    if (!newText) continue

    const newHash = createHash('sha256').update(newText).digest('hex')

    // Letzten Snapshot für diese URL laden
    const { data: lastSnapshot } = await supabase
      .from('source_snapshots')
      .select('content_hash, id')
      .eq('url', source.url)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Snapshot immer aktualisieren
    await supabase.from('source_snapshots').insert({
      url: source.url,
      label: source.label,
      content_hash: newHash,
    })

    if (!lastSnapshot || lastSnapshot.content_hash === newHash) continue

    // Inhalt hat sich geändert — alten Text für Diff laden
    changed++
    const { data: oldSnap } = await supabase
      .from('source_snapshots')
      .select('content_hash')
      .eq('id', lastSnapshot.id)
      .single()

    // Wir haben nur den Hash des alten Inhalts, nicht den Text selbst.
    // Daher übergeben wir nur den neuen Text an Claude mit Hinweis "vorheriger Inhalt nicht mehr verfügbar".
    const { summary, status_estimate } = await summarizeWithClaude(
      `(Vorheriger Inhalt nicht mehr verfügbar — Hash: ${oldSnap?.content_hash ?? 'unbekannt'})`,
      newText,
    )

    const { error } = await supabase.from('compliance_source_drafts').insert({
      source_url: source.url,
      source_label: source.label,
      summary,
      status_estimate,
    })

    if (!error) draftsCreated++
  }

  return NextResponse.json({
    scanned: COMPLIANCE_SOURCES.length,
    changed,
    drafts_created: draftsCreated,
  })
}
```

**Hinweis:** Da nur der Hash des alten Snapshots gespeichert wird (nicht der Volltext), schickt Claude nur den neuen Text. Für bessere Diffs könnte man künftig den Volltext speichern — aber das würde die DB-Größe deutlich erhöhen (5 × ~8KB × Quartale). Für jetzt ist der einfachere Ansatz ausreichend.

- [ ] **Step 4: Test laufen lassen — muss grün sein**

```bash
npm test -- src/__tests__/security/compliance-scan-security.test.ts --no-coverage
```

Erwartetes Ergebnis: PASS.

- [ ] **Step 5: TypeScript + alle Tests**

```bash
npx tsc --noEmit && npm test -- --passWithNoTests
```

Erwartetes Ergebnis: TypeScript clean, alle 653+ Tests grün.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/compliance/scan/route.ts \
        src/__tests__/security/compliance-scan-security.test.ts
git commit -m "feat: Compliance-Scanner API-Route POST /api/admin/compliance/scan"
```

---

## Task 5: Admin-Panel — Quellen-Monitor Tab

**Files:**
- Modify: `src/app/(dashboard)/admin/AdminPageClient.tsx`
- Modify: `src/app/(dashboard)/admin/page.tsx`

Der `AdminPageClient` hat aktuell 4 Tabs: `content`, `users`, `catalog`, `synonyms`. Wir fügen `scanner` als 5. Tab hinzu.

- [ ] **Step 1: Tab-Typ + State + Handlers in AdminPageClient ergänzen**

Öffne `src/app/(dashboard)/admin/AdminPageClient.tsx`.

**1a. Import ergänzen** (Zeile 3, nach den bestehenden Typen):

```typescript
import type { ContentLibraryEntry, UserProfile, Tier, CatalogComponent, CatalogSource, CatalogUploadLog, CanvasSynonym, ComplianceSourceDraft } from '@/types'
```

**1b. Tab-Typ erweitern** (Zeile 36):

```typescript
type Tab = 'content' | 'users' | 'catalog' | 'synonyms' | 'scanner'
```

**1c. Props-Interface erweitern** (nach `initialUploadLog`):

```typescript
interface Props {
  initialEntries: ContentLibraryEntry[]
  initialUsers?: UserProfile[]
  initialComponents?: CatalogComponent[]
  componentCount?: number
  initialSources?: CatalogSource[]
  initialUploadLog?: CatalogUploadLog[]
  initialDrafts?: ComplianceSourceDraft[]
}
```

**1d. Scanner-State nach dem synonyms-State-Block hinzufügen:**

```typescript
  // ── Scanner state ────────────────────────────────────────────────────────────
  const [drafts, setDrafts] = useState<ComplianceSourceDraft[]>(initialDrafts ?? [])
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ scanned: number; changed: number; drafts_created: number } | null>(null)
  const [showArchive, setShowArchive] = useState(false)
```

**1e. Scanner-Handler nach den Synonyms-Handlern hinzufügen:**

```typescript
  async function runScan() {
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch('/api/admin/compliance/scan', { method: 'POST' })
      if (!res.ok) throw new Error('Scan fehlgeschlagen')
      const result = await res.json() as { scanned: number; changed: number; drafts_created: number }
      setScanResult(result)
      if (result.drafts_created > 0) {
        // Neue Drafts nachladen
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
```

- [ ] **Step 2: Scanner-Tab-Button in der Tab-Leiste hinzufügen**

Suche den Tab-Array und ergänze den scanner-Eintrag:

```typescript
          ['content', 'Content Library', entries.length],
          ['users', 'Nutzer-Verwaltung', users.length],
          ['catalog', 'Komponenten-Katalog', componentCount],
          ['synonyms', 'Canvas-Synonyme', synonyms.length],
          ['scanner', 'Quellen-Monitor', drafts.filter(d => d.review_status === 'pending_review').length],
```

- [ ] **Step 3: Scanner-Tab-Panel am Ende vor dem schließenden `</div>` einfügen**

Füge vor dem allerletzten `</div>` und `  )` der Return-Anweisung ein:

```tsx
      {/* ─── Scanner tab ──────────────────────────────────────────────────────── */}
      {tab === 'scanner' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Regulatorische Quellenüberwachung</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Scannt 5 Primärquellen auf Änderungen und erstellt Entwürfe zur manuellen Freigabe.
                Nie automatisch publiziert.
              </p>
            </div>
            <button
              onClick={runScan}
              disabled={scanning}
              className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {scanning ? 'Scanne…' : '🔍 Quellen jetzt scannen'}
            </button>
          </div>

          {scanResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
              {scanResult.scanned} Quellen geprüft · {scanResult.changed} Änderungen gefunden · {scanResult.drafts_created} neue Entwürfe
            </div>
          )}

          {/* Pending Drafts */}
          {(() => {
            const pending = drafts.filter(d => d.review_status === 'pending_review')
            const archived = drafts.filter(d => d.review_status !== 'pending_review')
            return (
              <>
                {pending.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">Keine offenen Entwürfe.</p>
                ) : (
                  <div className="space-y-3">
                    {pending.map(draft => (
                      <div key={draft.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                        <div className="flex flex-wrap items-start gap-2 min-w-0">
                          <span className={cn(
                            'px-2 py-0.5 text-xs font-medium border rounded-full flex-shrink-0',
                            draft.status_estimate === 'final'   && 'bg-red-50 border-red-200 text-red-700',
                            draft.status_estimate === 'entwurf' && 'bg-amber-50 border-amber-200 text-amber-700',
                            draft.status_estimate === 'unklar'  && 'bg-slate-100 border-slate-200 text-slate-600',
                          )}>
                            {draft.status_estimate}
                          </span>
                          <span className="text-sm font-medium text-slate-800 min-w-0">{draft.source_label}</span>
                          <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
                            {new Date(draft.scanned_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{draft.summary}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => reviewDraft(draft.id, 'beruecksichtigt')}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Berücksichtigt
                          </button>
                          <button
                            onClick={() => reviewDraft(draft.id, 'ignoriert')}
                            className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
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
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      {showArchive ? '▲ Archiv verbergen' : `▼ Archiv anzeigen (${archived.length})`}
                    </button>
                    {showArchive && (
                      <div className="mt-2 space-y-2 opacity-60">
                        {archived.map(draft => (
                          <div key={draft.id} className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-xs text-slate-500">
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
```

- [ ] **Step 4: Drafts-API-Route für GET/PATCH erstellen**

```bash
mkdir -p "src/app/api/admin/compliance/drafts"
```

Erstelle `src/app/api/admin/compliance/drafts/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/utils/admin-check'

const PatchSchema = z.object({
  id: z.string().uuid(),
  review_status: z.enum(['beruecksichtigt', 'ignoriert']),
})

export async function GET() {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compliance_source_drafts')
    .select('*')
    .order('scanned_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(request: Request) {
  try { await requireAdmin() } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('compliance_source_drafts')
    .update({ review_status: parsed.data.review_status, reviewed_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
```

- [ ] **Step 5: Admin page.tsx — initiale Drafts laden**

Öffne `src/app/(dashboard)/admin/page.tsx`.

**5a. Import erweitern:**

```typescript
import type { ContentLibraryEntry, UserProfile, CatalogComponent, CatalogSource, CatalogUploadLog, ComplianceSourceDraft } from '@/types'
```

**5b. Drafts-Query zum `Promise.all` hinzufügen:**

Ergänze in der destructuring-Zeile:

```typescript
const [{ data: entries }, { data: users }, { data: components }, { count: componentCount }, { data: sources }, { data: uploadLog }, { data: drafts }] = await Promise.all([
  // ... alle bestehenden Queries unverändert ...
  adminClient
    .from('compliance_source_drafts')
    .select('*')
    .order('scanned_at', { ascending: false })
    .limit(50),
])
```

**5c. Prop übergeben:**

```tsx
<AdminPageClient
  initialEntries={(entries ?? []) as ContentLibraryEntry[]}
  initialUsers={(users ?? []) as UserProfile[]}
  initialComponents={(components ?? []) as CatalogComponent[]}
  componentCount={componentCount ?? 0}
  initialSources={(sources ?? []) as CatalogSource[]}
  initialUploadLog={(uploadLog ?? []) as CatalogUploadLog[]}
  initialDrafts={(drafts ?? []) as ComplianceSourceDraft[]}
/>
```

- [ ] **Step 6: TypeScript + alle Tests**

```bash
npx tsc --noEmit && npm test -- --passWithNoTests
```

Erwartetes Ergebnis: TypeScript clean, alle Tests grün.

- [ ] **Step 7: Commit + Push**

```bash
git add \
  src/app/\(dashboard\)/admin/AdminPageClient.tsx \
  src/app/\(dashboard\)/admin/page.tsx \
  src/app/api/admin/compliance/drafts/route.ts
git commit -m "feat: Admin-Panel Quellen-Monitor Tab — manueller Scan-Trigger + Draft-Review"
git push origin main
```

---

## Selbstreview

**Spec-Abdeckung:**
- ✅ `ChecklistItem.sourceUrl` + `lastVerified` (Task 1)
- ✅ Neuer DSGVO-Check `dsgvo_edpb_cef2026` (Task 1)
- ✅ EU AI Act `sourceUrl` auf alle 14 Items (Task 1)
- ✅ `REGULATORY_WATCHLIST` mit 3 Einträgen (Task 1)
- ✅ `WatchlistCard` mit Status-Badges (Task 2)
- ✅ Watchlist-Sektion in `CompliancePageClient` — gelber Rahmen, "nicht verbindlich" (Task 2)
- ✅ `source_snapshots` Tabelle + RLS (Task 3)
- ✅ `compliance_source_drafts` Tabelle + RLS (Task 3)
- ✅ Scan-Route mit 5 Quellen + fetch + hash + Claude + Fallback (Task 4)
- ✅ Admin-Tab "Quellen-Monitor" + Scan-Button + Draft-Review-UI (Task 5)
- ✅ Kein Auto-Publish (draft-Modell mit pending_review)
- ✅ RLS auf beiden neuen Tabellen

**Typ-Konsistenz:**
- `ComplianceSourceDraft` in `src/types/index.ts` definiert (Task 3) — verwendet in Task 5 und admin/page.tsx
- `WatchlistItem` aus `compliance-data.ts` — verwendet in `WatchlistCard` (Task 2)
- `WatchlistStatus` aus `compliance-data.ts` — verwendet in `STATUS_CONFIG` in `WatchlistCard`
- `'scanner'` Tab-Typ in `AdminPageClient` — verwendet in Tab-Button und Tab-Panel
