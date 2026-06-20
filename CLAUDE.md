# AI Navigator — CLAUDE.md
## Projekt-Konventionen für Claude Code

### Produkt
- **Name:** AI Navigator
- **Domain:** enterprise-ai.biz
- **Tagline:** Enterprise AI. Strukturiert navigiert.
- **Stack:** Next.js 15 (App Router) + Supabase EU + Stripe + PostHog

### Technischer Stack
- **Framework:** Next.js 15, TypeScript strict, App Router
- **Styling:** Tailwind CSS + shadcn/ui Komponenten
- **Backend:** Supabase (Frankfurt eu-central-1) — Auth, PostgreSQL, RLS, Storage
- **Payments:** Stripe Checkout + Billing Portal + Stripe Tax
- **Analytics:** PostHog EU-Cloud (cookieless)
- **E-Mail:** Resend
- **Deployment:** Vercel (fra1 Region)

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
  migrations/         # SQL Migrations
```

### Design-System (PFLICHT für jede UI-Komponente)
Vollständiges Regelwerk: `docs/design/design-system-handoff.md`. Kurzfassung:
- **Mobile-first**: Basis-Klassen für 375px, `sm:`/`md:`/`lg:` fügen für größere Screens hinzu, niemals umgekehrt patchen
- **Feste Typo-Skala**: h1 `text-xl sm:text-2xl`, h2 `text-base sm:text-lg`, Body `text-sm` (ändert sich nicht), Meta `text-xs` (ändert sich nicht)
- **Feste Spacing-Skala**: Karten-Padding `p-4 sm:p-6/p-8`, niemals `p-8` auf Mobile-Basis
- **`min-w-0` Pflicht** auf jedem Flex-Kind, das Text unbekannter Länge enthält (Namen, Firmennamen, Labels)
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
