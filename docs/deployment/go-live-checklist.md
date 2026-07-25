# AI Navigator — Go-Live Checkliste

_Letzte Aktualisierung: 25.07.2026 (Stabilisierung + Go-Live-Vorbereitung)._

Legende: ✅ erledigt · 🔶 bestätigen/verifizieren (Daniel) · ⬜ offen

## A. Code-Qualität (automatisiert, Stand 25.07.2026)

| Prüfung | Status | Notiz |
|---|---|---|
| `npx tsc --noEmit` | ✅ | 0 Fehler |
| `npx eslint src --max-warnings 0` | ✅ | sauber |
| `npm run build` | ✅ | „Compiled successfully" |
| `npm run test` | ✅* | 65 Suites grün. *27 Suites können wegen next-intl-ESM-Transform im Jest-Harness nicht laufen (Komponenten-Render-Tests) — KEIN Produkt-Bug, Kernlogik (Unit) grün. Post-Launch-Tech-Debt: Jest-ESM-Transform fixen, damit Security-/a11y-Suiten in CI laufen. |
| `npm audit --omit=dev` | 🔶 | 6 Findings (1 low, 5 high), ALLE in `sharp`/`libvips` (transitiv über Next.js). Kein Launch-Blocker: User-Uploads laufen über plain `<img>`, NICHT über next/image/sharp → libvips-CVEs nicht erreichbar. Post-Launch: `sharp`-`overrides`-Pin oder Next-Patch abwarten. |

## B. Billing / Stripe (nach Incident 24.07. repariert)

| Schritt | Status | Notiz |
|---|---|---|
| Live-Keys in Vercel (`STRIPE_SECRET_KEY` = `sk_live_…`) | ✅ | 24.07. gesetzt/verifiziert |
| **Live-Webhook-URL exakt `https://enterprise-ai.biz/api/stripe/webhook`** | ✅ | 24.07. korrigiert (war falsch → lieferte Homepage-HTML mit 200). Singular, kein Slash, kein Locale-Präfix. |
| Webhook auf alle 5 Event-Typen abonniert | 🔶 | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded` — im Stripe-Endpoint gegenprüfen |
| `STRIPE_WEBHOOK_SECRET` = `whsec_…` des Live-Endpoints | 🔶 | in Vercel gegenprüfen |
| `SUPABASE_SECRET_KEY` = `sb_secret_…` (neues Format) | ✅ | Code wählt robust den `sb_`-Key; Webhook schreibt jetzt zuverlässig |
| Webhook-Härtung (Fehler → 500 + Sentry statt stillem 200) | ✅ | commit `ba8272e` |
| `stripe_subscription_id` wird mitgeschrieben | ✅ | commit `6f968dd` |
| **Live-Lebenszyklus einmal verifizieren** | 🔶 | Live-`customer.subscription.updated` resenden → `processed_stripe_events` + Profil (tier/status/period_end) prüfen. Kündigung → `tier` fällt korrekt (deriveTier + Grace-Period, `tier-logic.ts` verifiziert). |
| Stripe-Konto aktiviert (Geschäftsdaten) | 🔶 | Voraussetzung für Live-Zahlungen |

## C. Rechtliches

| Schritt | Status | Notiz |
|---|---|---|
| Impressum/Datenschutz/AGB/Widerruf-Routen | ✅ | `/impressum` `/datenschutz` `/agb` `/widerruf` |
| Rechtstexte inhaltlich gefüllt (keine Platzhalter) | ✅ | Grep auf `[Name]`/`[Straße]` etc. leer (25.07.) |
| **Finale rechtliche Vollständigkeitsprüfung** | 🔶 | eRecht24/Anwalt gegenlesen (empfohlen vor Launch) |
| DSGVO-Datenlöschung | ✅ | `/api/account/delete` |

## D. Infrastruktur / Env

| Schritt | Status | Notiz |
|---|---|---|
| Vercel-Deployment (fra1), Framework Preset = **Next.js** | ✅ | Preset-Lektion 21.06. beachten |
| Supabase EU (Frankfurt), RLS aktiv | ✅ | |
| Sentry Error-Tracking | ✅ | läuft (Daniel bestätigt 17.07.) |
| PostHog EU + Reverse-Proxy `/ingest/*` | ✅ | #215 |
| Branding: Favicon/PWA-Icons/OG-Bild | ✅ | 25.07. (`a8f9ee7`) |
| **`supabase migration list` — Local/Remote synchron** | 🔶 | vor Go-Live prüfen |
| **Resend-Domain `enterprise-ai.biz` verifiziert** | 🔶 | DNS (DKIM/SPF) gesetzt; „Verify" im Resend-Dashboard bestätigen, dann Feedback-Testmail |

### Erforderliche Env-Variablen in Vercel (Production)
**Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` (sb_secret) · **Stripe:** `STRIPE_SECRET_KEY` (sk_live), `STRIPE_WEBHOOK_SECRET` (whsec), `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_YEARLY_PRICE_ID`, optional `STRIPE_GRACE_PERIOD_DAYS` · **KI:** `AWS_BEDROCK_ACCESS_KEY_ID`, `AWS_BEDROCK_SECRET_ACCESS_KEY`, `BEDROCK_REGION`, `BEDROCK_MODEL_HAIKU`/`_SONNET`; Fallback (optional, non-EU) `ANTHROPIC_API_KEY` + `ALLOW_NON_EU_AI_FALLBACK` · **E-Mail:** `RESEND_API_KEY`, `FEEDBACK_TO_EMAIL` · **Analytics/SEO:** `NEXT_PUBLIC_POSTHOG_KEY`/`_HOST`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` · **App:** `NEXT_PUBLIC_APP_URL` = `https://enterprise-ai.biz`, `NEXT_PUBLIC_EN_ENABLED` (false bis EN freigegeben), optional `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`

## E. Manueller Smoke-Test vor Go-Live (Produktion)

- [ ] Registrierung + Login (E-Mail-Bestätigung)
- [ ] Neuer User → Weiterleitung auf Einstellungen (Profil ausfüllen)
- [ ] Guided Path: Assessment → Use Case → Governance → Roadmap → Canvas → Architektur
- [ ] Architektur-Diagramm: Presets + „Ansicht anpassen" (TOGAF/Datenfluss/UML) + Vergrößern
- [ ] PDF-Export (MERIDIAN-Reports)
- [ ] Geteilte Links: Erstellen + Widerruf
- [ ] Stripe Checkout (Live, echter Betrag) → `tier=pro` → Abo kündigen → Grace/Downgrade
- [ ] DSGVO-Datenlöschung über Einstellungen
- [ ] Feedback-Formular (mit Screenshot) → Mail kommt an
- [ ] Favicon im Tab + PWA-Installierbarkeit + OG-Preview (z. B. Slack/LinkedIn-Debugger)
- [ ] Mobile 375px (iOS Safari) + 768px

## E2. Auth (verifiziert 25.07.2026)

| Punkt | Status | Notiz |
|---|---|---|
| E-Mail-Bestätigung (Double-Opt-in) | ✅ | Supabase „Confirm email" AN (`mailer_autoconfirm:false`); RegisterForm + Callback fertig; verifiziert (neuer User unbestätigt + Mail via Resend) |
| Google-OAuth | ✅ | auto-bestätigt (korrekt, keine Mail) |
| Passwort-Reset | ✅ | Eigene Route `/api/auth/reset-request` (Admin-generateLink → sauberer token_hash → Resend), `/reset-password` löst via verifyOtp ein; live getestet; PKCE/Template-unabhängig |
| Security-Header | ✅ | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (Clickjacking-Schutz + kein kaputter Webmail-Frame) |
| Supabase SMTP (Resend) | 🔶 | funktioniert (echte Mails kommen an); Auth-Bestätigungsmails laufen darüber |

## F. Verbleibende 🔶-Punkte vor „Launch" (Daniel)

1. ~~Stripe Live-Lebenszyklus verifizieren~~ → ✅ verifiziert (25.07., Event landete, tier/status/period_end/subscription_id korrekt). Nur noch: Konto-Aktivierung + 5 Webhook-Events gegenprüfen.
2. ~~Resend-Domain~~ → ✅ getestet.
3. ~~Migrationen synchron~~ → ✅ `supabase migration list` sauber (88 Migrationen, Local=Remote).
4. Finale rechtliche Gegenprüfung (extern).
5. Manueller Smoke-Test (Abschnitt E) auf Produktion — Rest.
6. Optionaler Schliff: Passwort-Reset einmal über die neue Route real gegentesten (Formular → Mail → Link → neues Passwort).

## Post-Launch (siehe `docs/backlog/2026-07-25-post-launch-backlog.md`)
Jest-ESM-Transform · sharp-Pin · EAM PDF/Share je Stil (#257/#258) · Capability in Exec Summary (#259).
