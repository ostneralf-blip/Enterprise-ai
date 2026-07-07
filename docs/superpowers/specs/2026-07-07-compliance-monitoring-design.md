# Compliance-Monitoring Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Regulatorische Änderungen (DSGVO, EU AI Act, BDSG) verfolgen — mit Quellenangaben pro Check, einer Beobachtungsliste für laufende Gesetzgebung und einem manuell auslösbaren Scanner, der 5 Primärquellen auf Änderungen prüft und Entwürfe zur Admin-Freigabe erstellt.

**Architecture:** Drei unabhängige Schichten: (1) Daten-Layer in `compliance-data.ts` — neue Felder + Typen, (2) UI-Layer in `CompliancePageClient.tsx` — statischer Watchlist-Bereich, (3) Scanner-Layer — neue DB-Tabellen + API-Route + Admin-Tab. Kein Auto-Publish; jede Änderung landet als Entwurf zur manuellen Prüfung.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase PostgreSQL + RLS, Anthropic API (`claude-haiku-4-5-20251001`), Tailwind + shadcn/ui

---

## Subsystem 1 — Daten-Layer

### Dateien
- Modify: `src/config/compliance-data.ts`

### Änderungen

**1a. `ChecklistItem` erweitern (Zeile ~7)**

```typescript
export interface ChecklistItem {
  id: string
  article?: string
  label: string
  description?: string
  relevance?: string
  category?: string
  sourceUrl?: string      // Beleg-Link zur Primärquelle
  lastVerified?: string   // ISO-Datum (YYYY-MM-DD) der letzten Prüfung
}
```

**1b. Neuer DSGVO-Check nach `dsgvo_art44` einfügen**

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

**1c. `sourceUrl` für Key EU-AI-Act-Artikel** — folgende Einträge in `EU_AI_ACT_OBLIGATIONS` bekommen `sourceUrl` + `lastVerified`:

| id | sourceUrl |
|---|---|
| `euaiact_art9` bis `euaiact_art17` (Hochrisiko) | `https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689` |
| `euaiact_art50_1–3` (Limited) | `https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689` |

Gemeinsames Datum: `lastVerified: '2026-07-07'`

**1d. Neue Typen + `REGULATORY_WATCHLIST` ans Dateiende**

```typescript
export type WatchlistStatus = 'in_gesetzgebung' | 'angekuendigt' | 'final'

export interface WatchlistItem {
  id: string
  title: string
  status: WatchlistStatus
  summary: string
  potentialImpact: string
  sourceUrl: string
  lastChecked: string
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

---

## Subsystem 2 — Watchlist-UI

### Dateien
- Modify: `src/app/(dashboard)/compliance/CompliancePageClient.tsx`

### Änderungen

Import `REGULATORY_WATCHLIST, WatchlistItem` aus `compliance-data.ts`.

Neuer Bereich unterhalb der bestehenden Checklisten (vor dem schließenden `</div>`):

```tsx
<div className="border border-amber-200 rounded-xl bg-amber-50 p-4 sm:p-6 space-y-3">
  <div className="flex items-center gap-2">
    <span className="text-amber-700 font-semibold text-sm">Regulatorische Beobachtungsliste</span>
    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full">
      In Gesetzgebung — noch nicht verbindlich
    </span>
  </div>
  <p className="text-xs text-amber-600">
    Diese Einträge sind keine Compliance-Pflichten. Sie zeigen an, was sich ändern könnte.
    Erst nach Veröffentlichung im EU-Amtsblatt (EUR-Lex) werden sie in die Checklisten übernommen.
  </p>
  {REGULATORY_WATCHLIST.map(item => (
    <WatchlistCard key={item.id} item={item} />
  ))}
</div>
```

`WatchlistCard` (interne Komponente, ~30 Zeilen): zeigt Titel, Status-Badge (`in_gesetzgebung` → amber, `angekuendigt` → slate), `summary`, `potentialImpact` (ausgeklappt per `<details>`), Quellen-Link + `lastChecked`-Datum.

Status-Badge-Mapping:
- `in_gesetzgebung` → `"In Gesetzgebung"` amber
- `angekuendigt` → `"Angekündigt"` slate
- `final` → `"Final — Übernahme ausstehend"` emerald

---

## Subsystem 3 — Manueller Quellen-Scanner

### Dateien
- Create: `supabase/migrations/YYYYMMDD_create_source_snapshots.sql`
- Create: `supabase/migrations/YYYYMMDD_create_compliance_source_drafts.sql`
- Create: `src/app/api/admin/compliance/scan/route.ts`
- Modify: `src/app/(dashboard)/admin/AdminPageClient.tsx` — neues Tab + State + UI
- Modify: `src/app/(dashboard)/admin/page.tsx` — initiale Drafts laden

### DB-Schema

**`source_snapshots`**
```sql
CREATE TABLE public.source_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT NOT NULL,
  label       TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.source_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON public.source_snapshots
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Index: (url, fetched_at DESC) für schnellen letzten Snapshot
```

**`compliance_source_drafts`**
```sql
CREATE TABLE public.compliance_source_drafts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url    TEXT NOT NULL,
  source_label  TEXT NOT NULL,
  summary       TEXT NOT NULL,       -- Claude-Zusammenfassung
  status_estimate TEXT NOT NULL      -- 'final' | 'entwurf' | 'unklar'
    CHECK (status_estimate IN ('final', 'entwurf', 'unklar')),
  review_status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (review_status IN ('pending_review', 'beruecksichtigt', 'ignoriert')),
  scanned_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES auth.users(id)
);
-- RLS: admin_all policy (is_admin())
```

### API-Route `/api/admin/compliance/scan` (POST)

```
requireAdmin() → fetch 5 URLs → strip HTML → hash → compare with last snapshot
→ if changed: call Claude API with diff → create draft
→ upsert snapshot
→ return { scanned: 5, changed: N, drafts_created: N }
```

**5 überwachte Quellen:**
```typescript
const COMPLIANCE_SOURCES = [
  { url: 'https://www.edpb.europa.eu/news_de', label: 'EDPB Newsroom' },
  { url: 'https://www.datenschutzkonferenz-online.de/pressemitteilungen.html', label: 'DSK Pressemitteilungen' },
  { url: 'https://artificialintelligenceact.eu/implementation-timeline/', label: 'AI Act Timeline' },
  { url: 'https://ai-act-service-desk.ec.europa.eu/s/', label: 'EU AI Act Service Desk' },
  { url: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689', label: 'EUR-Lex AI Act Volltext' },
]
```

**Claude-Prompt (Haiku, ~200 Token Output):**
```
Du bist ein Compliance-Analyst. Vergleiche die beiden Texte und beantworte auf Deutsch:
1. Was hat sich konkret geändert? (max. 3 Sätze)
2. Ist die Änderung: "final" (im EU-Amtsblatt veröffentlicht) / "entwurf" (Vorschlag/Einigung noch nicht veröffentlicht) / "unklar" (nicht bestimmbar)?
Antworte nur im JSON-Format: { "summary": "...", "status_estimate": "final|entwurf|unklar" }
```

**Modell:** `claude-haiku-4-5-20251001` — ausreichend für Zusammenfassung, ~4× günstiger als Sonnet.

**Fehlerbehandlung:**
- Einzelne URL-Fehler (Timeout, 5xx) werden geloggt aber nicht als Gesamt-Fehler behandelt — Scan läuft für die verbleibenden Quellen weiter.
- Falls Claude kein valides JSON zurückgibt: Fallback `{ summary: "(Automatische Zusammenfassung fehlgeschlagen — manuell prüfen)", status_estimate: "unklar" }` — Draft wird trotzdem angelegt.

### Admin-Panel Tab "Quellen-Monitor"

**Tab-Button:** `['scanner', 'Quellen-Monitor', pendingDrafts.length]` — Badge zeigt Anzahl offener Drafts.

**UI-Bereiche:**

1. **Scan-Button** mit letztem Scan-Datum (aus neuester `source_snapshots.fetched_at`)
2. **Ergebnis-Toast** nach Scan: "5 Quellen geprüft, 2 Änderungen gefunden"
3. **Draft-Karten** (je Draft): Quellen-Label, Scan-Datum, Claude-Zusammenfassung, Status-Schätzung-Badge (`final` → rot/dringend, `entwurf` → amber, `unklar` → slate), zwei Buttons:
   - **"Berücksichtigt"** → `review_status = 'beruecksichtigt'`, verschwindet aus Liste
   - **"Ignorieren"** → `review_status = 'ignoriert'`, verschwindet aus Liste
4. **Archiv-Toggle** "Archiv anzeigen" — zeigt bereits bearbeitete Drafts

---

## Nicht-Ziele

- Kein automatisches Publizieren von Änderungen in Checklisten oder Watchlist
- Kein Cron/Scheduled Job — ausschließlich manueller Trigger
- Keine Volltext-Analyse oder juristische Interpretation — nur Änderungshinweis
- Keine externe Authentifizierung gegenüber den Quell-URLs

---

## Tests

- Unit: `REGULATORY_WATCHLIST` hat mind. 3 Einträge, alle Pflichtfelder gesetzt, `status` ist gültiger Wert
- Unit: `WatchlistCard` rendert Status-Badge korrekt für alle 3 Statuszustände
- Security: `/api/admin/compliance/scan` wirft 403 für nicht-Admin
- Security: `compliance_source_drafts` RLS — nur Admin-Zugriff
- Integration: Scan-Route mit gemockten URLs erzeugt korrekte Draft-Einträge
