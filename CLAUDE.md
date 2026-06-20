# AI Navigator — CLAUDE.md
## Projekt-Konventionen für Claude Code

### Produkt
- **Name:** AI Navigator
- **Domain:** enterprise-ai.biz
- **Tagline:** Enterprise AI. Strukturiert navigiert.
- **Stack:** Next.js 16 (App Router) + Supabase EU + Stripe + PostHog

### Technischer Stack
- **Framework:** Next.js 16, TypeScript strict, App Router, Turbopack
- **Styling:** Tailwind CSS + shadcn/ui Komponenten
- **Backend:** Supabase (Frankfurt eu-central-1) — Auth, PostgreSQL, RLS, Storage
- **Supabase Keys:** Neues Key-System (`sb_publishable_...` / `sb_secret_...`), NICHT die alten JWT-basierten `anon`/`service_role`-Keys
- **Payments:** Stripe Checkout + Billing Portal + Stripe Tax
- **Analytics:** PostHog EU-Cloud (cookieless)
- **E-Mail:** Resend
- **Deployment:** Vercel (fra1 Region)
- **Lokale Entwicklung:** IMMER über `http://localhost:3001` zugreifen, NIEMALS über die Netzwerk-IP (z. B. `192.168.x.x`) — Next.js blockiert sonst Dev-Hot-Reload-Ressourcen (`allowedDevOrigins`), was zu vollständigem Hydration-Ausfall ohne sichtbare Fehlermeldung führt

### Datenbank-Migrationen — VERBINDLICHER Workflow (seit 20.06.2026)
**NIEMALS mehr Migrationen manuell im Supabase SQL-Editor ausführen.** Das umgeht
die Tracking-Tabelle `supabase_migrations.schema_migrations` und führt zu
`relation already exists`-Fehlern bei jedem GitHub-Push (Supabase-GitHub-Integration
versucht dann, bereits angewendete Migrationen erneut auszuführen).

**Korrekter Workflow für jede neue Migration:**
```bash
# Neue Migration erstellen
supabase migration new beschreibender_name

# SQL in die generierte Datei schreiben, dann:
supabase db push

# Verifizieren, dass lokal UND remote synchron sind:
supabase migration list
```
Beide Spalten (Local/Remote) müssen nach jedem `db push` einen Wert zeigen.

**Falls die Historie doch einmal aus dem Tritt gerät** (z. B. nach einem
manuellen Eingriff): `supabase migration repair --status applied <name>`
markiert nur den Tracking-Eintrag, führt KEIN SQL aus — bei bereits
angewendeten Migrationen korrekt, bei noch nicht angewendeten muss zusätzlich
`supabase db push` folgen, um das eigentliche SQL auch wirklich anzuwenden.

### Ordnerstruktur
```
src/
  app/
    (auth)/           # Login, Register — kein Dashboard-Layout
    (dashboard)/      # Alle Tool-Seiten — mit Dashboard-Layout
    api/              # API Routes
    share/[token]/    # Öffentliche Read-only Sharing-Seiten
  components/
    ui/               # Basis-Komponenten
    layout/           # Navbar, Sidebar, Footer
    modules/          # Tool-spezifische Komponenten
    shared/           # UpgradeModal, FeedbackWidget, ...
  lib/
    supabase/         # createClient (server + client)
    stripe/           # stripe client, helpers
    posthog/          # tracking events
    utils/            # cn(), formatDate(), tierCheck()
  hooks/              # useUser(), useTier(), ...
  types/              # TypeScript-Typen & Zod-Schemas
  config/             # constants.ts, tiers.ts, modules.ts
supabase/
  migrations/         # SQL Migrations — IMMER via `supabase migration new` + `db push`
```

### Design-System (PFLICHT für jede UI-Komponente)
Vollständiges Regelwerk: `docs/design/design-system-handoff.md`. Kurzfassung:
- **Mobile-first**: Basis-Klassen für 375px, `sm:`/`md:`/`lg:` fügen für größere Screens hinzu, niemals umgekehrt patchen
- **Feste Typo-Skala**: h1 `text-xl sm:text-2xl`, h2 `text-base sm:text-lg`, Body `text-sm` (ändert sich nicht), Meta `text-xs` (ändert sich nicht)
- **Feste Spacing-Skala**: Karten-Padding `p-4 sm:p-6/p-8`, niemals `p-8` auf Mobile-Basis
- **`min-w-0` Pflicht** auf jedem Flex-Kind, das Text unbekannter Länge enthält (Namen, Firmennamen, Labels)
- **`whitespace-nowrap` auf Button-Text** bei `flex-1`-Buttons nebeneinander — unterschiedlich lange Texte brechen sonst unterschiedlich um und Buttons wirken verschieden hoch (siehe Bug-Historie unten)
- **Eine Button-Basisklasse** pro Funktionsebene (z. B. `buttonBase`-Konstante), nie individuelle Maße pro Button
- **Verifikation bei 375px / 768px / 1440px** vor "fertig"-Meldung jeder Komponente — kein abgeschnittener Text, kein horizontales Scrollen

### Coding-Konventionen
1. TypeScript strict — kein `any`
2. Server Components by default — "use client" nur wenn nötig
3. Zod für alle Inputs
4. RLS immer aktiv auf jeder Tabelle
5. Keine direkten Supabase-Calls im Client
6. Feature-Gating immer server-seitig
7. cn() für alle Tailwind-Klassen
8. Deutsche UI-Texte (EN kommt Phase 2)
9. Max. ~150 Zeilen pro Komponente

### Tier-System
- free: Basis-Zugang, Registrierung erforderlich
- pro: €49/Monat — PDF, Speichern, Sharing, Versionierung
- enterprise: Auf Anfrage — Team, SSO, unbegrenzt

### PostHog Events
- tool_started, tool_completed, export_pdf, share_created
- upgrade_clicked, feedback_submitted, version_saved

### Kritische Regeln
- NIEMALS Service Role Key im Client
- NIEMALS Feature-Gating nur im Client
- IMMER Stripe Webhooks idempotent
- IMMER RLS testen vor Produktiv-Go
- NIEMALS User-Daten außerhalb EU
- NIEMALS `.env*`-Dateien oder Backups davon (`.env.local.backup` etc.) committen — vor jedem `git add .` einen `git status`-Check auf unerwartete Dateien durchführen (siehe Incident vom 20.06.2026 in `docs/testing/rls-verification-results.md`)
- NIEMALS Migrationen manuell im SQL-Editor ausführen — immer `supabase migration new` + `db push` (siehe Abschnitt oben)

### Umgang mit laufenden Korrekturen & Feature-Wünschen
Während der Entwicklung kommen ständig kleine Korrekturen oder neue Feature-Ideen auf. Diese werden nach folgender Klassifikation behandelt, nicht jedes Mal einzeln rückgefragt:

| Stufe | Kriterium | Vorgehen |
|---|---|---|
| **1. Sofort-Fix** | Eindeutiger Bug, keine Designentscheidung nötig (Tippfehler, kaputter Button, abgeschnittener Text, falscher Link) | Sofort umsetzen, kurz im Commit-Message dokumentieren |
| **2. Sprint-Einplanung** | Neues Feature oder größere Änderung ohne Dringlichkeit (z. B. "wir brauchen eine Einstellungsseite") | In diesem Dokument unter "Feature-Rückstand" notieren, NICHT sofort bauen, mit Daniel terminieren |
| **3. Rücksprache nötig** | Betrifft Preismodell, Datenschema/Migrationen, Auth-Flow, oder hat Sicherheits-/Compliance-Implikationen | Vor Umsetzung explizit mit Daniel klären, auch wenn es klein wirkt |

Im Zweifel zwischen Stufe 1 und 2: lieber als Stufe 2 behandeln und kurz nachfragen, statt voreilig Architektur-Entscheidungen zu treffen.

### Test-Gate (PFLICHT vor jedem Merge/Deployment)
Jedes neue Modul braucht mindestens:
1. Unit-Tests für die Geschäftslogik (`src/__tests__/unit/`)
2. Security-Tests für neue API-Routen (`src/__tests__/security/`) — Input-Validierung, Tier-Gating, Auth-Check
3. Accessibility-Tests für neue interaktive Komponenten (`src/__tests__/accessibility/`) mit jest-axe
4. Bei PDF/Export-Features: Integration-Test für die Template-Generierung

Vor JEDEM Deployment (siehe docs/deployment/deployment-guide.md Abschnitt 1):
```bash
npm run test && npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build && npm audit --omit=dev
```
Kein Schritt wird übersprungen, auch nicht bei kleinen Änderungen. Manuelle Checklisten
(docs/testing/security-checklist.md, manual-test-plan.md, accessibility-checklist.md)
müssen vor jedem Produktions-Launch eines neuen Moduls aktualisiert und abgezeichnet werden.

### Feature-Rückstand (Stufe 2 — eingeplant, noch nicht terminiert)
- Einstellungsseite: Profil (Name/Firma bearbeiten), Rechnungsadresse, Stripe Customer Portal Zugang, Sprache/Avatar/Benachrichtigungen
- FeedbackWidget: leichtes horizontales Überlaufen bei 393px Breite — am Ende von Sprint 2 final polieren

### Admin-Panel & Content-Anreicherung (neu, 20.06.2026)

**Stufe A — Plattform-Content-Verwaltung (Stufe 2, in Rückstand eingeplant):**
- Eigene `content_library`-Tabelle statt hartcodierter Werte in `config/`-Dateien
  (Gesetzesverweise, Branchen-Use-Case-Beispiele, Quellenangaben pro Modul)
- `role = 'admin'`-Flag auf `profiles`, RLS-geschützt wie alle anderen Tabellen
- Einfaches CRUD-Interface nur für Daniel erreichbar (kein Kunden-Zugriff)
- Jedes Modul wird inhaltlich angereichert: konkrete Gesetzesartikel-Verweise
  (z. B. EU AI Act Art. X, DSGVO Art. Y), echte Branchenbeispiele statt
  Platzhalter, Quellenangaben mit Datum
- **Aufwand:** mittel, reine Plattform-Erweiterung, kein Risiko für bestehendes
  Tier-/RLS-Modell

**Stufe B — Kunden-konfigurierbare Inhalte (Phase 3, NUR Vision, nicht bauen
ohne erneute explizite Freigabe):**
- Hypothese (noch nicht durch echte Kundenanfrage validiert): Enterprise-Kunden
  sollen eigene Anforderungen/Gewichtungen/Informationen in Berechnungen und
  Modul-Inhalte einbringen können
- Würde erfordern: neue `organizations`-Tabelle (User-Gruppierung nach Firma,
  existiert aktuell nicht — wir haben nur Einzel-User), Mandantentrennung auf
  RLS-Ebene pro Organisation statt nur pro User, Preismodell-Klärung (eigenes
  Add-on oder Teil von "Enterprise auf Anfrage"?)
- **Bewusste Entscheidung (20.06.2026):** Architektur lässt das später zu, ohne
  dass Stufe A umgebaut werden müsste — aber NICHT vorab bauen, bevor ein
  echter Kunde das konkret anfragt. Vermeidet Over-Engineering für einen
  unvalidierten Business Case.
- **Externe Datenquellen-Anbindung** (z. B. automatischer Abruf aktueller
  Gesetzestexte über eine API) gehört ebenfalls hierher — explizit als
  "möglich, aber noch nicht spezifiziert, welche Quelle/API" markieren,
  bis ein konkreter Bedarf vorliegt.
