# AI Navigator — Sprint 0 Setup-Anleitung

## Voraussetzungen
- Node.js 22+ installiert
- Claude Code installiert (`npm install -g @anthropic-ai/claude-code`)
- Git installiert

## Schritt 1: Supabase-Projekt anlegen

1. Gehen Sie zu [supabase.com](https://supabase.com) → "New Project"
2. Region: **eu-central-1 (Frankfurt)** ← Pflicht für DSGVO!
3. Datenbank-Passwort sicher speichern
4. Warten bis Projekt bereit ist (~2 Min)

### Datenbank-Schema einrichten:
1. Im Supabase-Dashboard: SQL-Editor öffnen
2. Inhalt von `supabase/migrations/001_initial_schema.sql` einfügen
3. "Run" klicken → alle Tabellen werden erstellt

### API-Keys kopieren:
- Settings → API → "Project URL" → in `.env.local` als `NEXT_PUBLIC_SUPABASE_URL`
- Settings → API → "anon public" → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Settings → API → "service_role" → `SUPABASE_SERVICE_ROLE_KEY` (NIEMALS im Client!)

### Auth einrichten:
- Authentication → Providers → Google aktivieren (optional, MVP läuft auch ohne)
- Authentication → URL Configuration → Site URL: `https://enterprise-ai.biz`
- Redirect URLs hinzufügen: `https://enterprise-ai.biz/api/auth/callback`

## Schritt 2: Stripe einrichten

1. [stripe.com](https://stripe.com) → Account erstellen (Deutschland)
2. Stripe Tax aktivieren: Billing → Tax → "Automatic tax" aktivieren
3. Zwei Produkte anlegen:
   - "AI Navigator Pro Monthly" → €49/Monat → Price ID kopieren
   - "AI Navigator Pro Yearly" → €399/Jahr → Price ID kopieren
4. API Keys: Developers → API Keys
   - Publishable Key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret Key → `STRIPE_SECRET_KEY`
5. Webhook einrichten: Developers → Webhooks → "Add endpoint"
   - URL: `https://enterprise-ai.biz/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Signing Secret → `STRIPE_WEBHOOK_SECRET`

## Schritt 3: PostHog einrichten

1. [eu.posthog.com](https://eu.posthog.com) → Account erstellen (EU-Region!)
2. Project Key kopieren → `NEXT_PUBLIC_POSTHOG_KEY`
3. Host: `https://eu.posthog.com` (bereits in .env.local)

## Schritt 4: Resend einrichten

1. [resend.com](https://resend.com) → Account + Domain verifizieren
2. API Key → `RESEND_API_KEY`

## Schritt 5: .env.local befüllen

Alle Werte aus den obigen Schritten in `.env.local` eintragen.

## Schritt 6: Lokal starten

```bash
npm run dev
```

→ App läuft auf http://localhost:3000

## Schritt 7: Vercel Deployment

```bash
npm install -g vercel
vercel login
vercel
```

1. Bei Vercel: Settings → Environment Variables → alle .env.local Werte eintragen
2. Settings → Functions → Region: **fra1 (Frankfurt)** setzen
3. Domain: `enterprise-ai.biz` verknüpfen

## Nächste Schritte (Sprint 1)

Mit Claude Code weiterarbeiten:
```bash
claude  # Claude Code starten
```

Dann z.B.:
- "Baue das AI-Readiness Assessment Modul basierend auf CLAUDE.md"
- "Implementiere das Use-Case Scoring Tool mit Portfolio-Tabelle"
- "Erstelle die PDF-Export Funktion für das Assessment"

## Projektstruktur Quick-Reference

| Pfad | Inhalt |
|------|--------|
| `src/app/(auth)/` | Login, Register Pages |
| `src/app/(dashboard)/` | Alle Tool-Seiten (geschützt) |
| `src/app/api/` | Backend-Endpunkte |
| `src/components/modules/` | Tool-spezifische Komponenten |
| `src/components/shared/` | UpgradeModal, FeedbackWidget |
| `src/config/modules.ts` | Tool-Konfiguration |
| `src/config/tiers.ts` | Freemium-Tier-Definitionen |
| `supabase/migrations/` | SQL-Datenbankschema |
| `CLAUDE.md` | Konventionen für Claude Code |
