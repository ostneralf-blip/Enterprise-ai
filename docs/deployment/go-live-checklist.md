# AI Navigator — Go-Live Checkliste

_Letzte Aktualisierung: 06.07.2026_

## Stripe (Zahlungen)

| Schritt | Status | Notiz |
|---------|--------|-------|
| Test-Produkt + Preise angelegt | ✅ | AI Navigator Pro, monatlich + jährlich |
| Test-Webhook auf enterprise-ai.biz registriert | ✅ | 5 Events konfiguriert |
| Testkauf durchgeführt (4242…) | ✅ | 06.07.2026 |
| Webhook `checkout.session.completed` empfangen | ✅ | |
| `tier = pro` in Supabase nach Kauf | ✅ | |
| **Live-Keys in Vercel setzen** | ⬜ | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **Live-Webhook in Stripe anlegen** | ⬜ | Gleiche 5 Events, neue `whsec_...` in Vercel |
| **Stripe-Konto aktiviert** (Geschäftsdaten ausgefüllt) | ⬜ | Voraussetzung für Live-Zahlungen |

## E-Mail (Resend)

| Schritt | Status | Notiz |
|---------|--------|-------|
| Resend-Konto + API Key | ✅ | `RESEND_API_KEY` in Vercel gesetzt |
| DKIM-Record bei Strato | ✅ | `resend._domainkey.enterprise-ai.biz` |
| SPF-Record bei Strato | ✅ | TXT + MX für `send`-Subdomain |
| **Domain `enterprise-ai.biz` in Resend verifizieren** | ⬜ | DNS-Propagierung abwarten, dann "Verify" klicken |
| Feedback-E-Mail Testversand | ⬜ | Nach Domain-Verifizierung testen |

## Rechtliches

| Schritt | Status | Notiz |
|---------|--------|-------|
| Impressum-Route vorhanden | ✅ | `/impressum` |
| Datenschutz-Route vorhanden | ✅ | `/datenschutz` |
| AGB-Route vorhanden | ✅ | `/agb` |
| **Echte Rechtstexte einsetzen** | ⬜ | Platzhalter ersetzen (eRecht24 / Anwalt) — Go-Live-Blocker |
| DSGVO-Datenlöschung | ✅ | `/api/account/delete` vorhanden |

## Technische Infrastruktur

| Schritt | Status | Notiz |
|---------|--------|-------|
| Vercel-Deployment läuft | ✅ | fra1-Region, Framework Preset = Next.js |
| Supabase EU-Region (Frankfurt) | ✅ | |
| CI-Pipeline (GitHub Actions) | ✅ | Tests + Build bei jedem Push |
| `NEXT_PUBLIC_APP_URL` auf Produktion | ✅ | `https://enterprise-ai.biz` |
| Supabase-Migrationen synchron | ⬜ | Vor Go-Live: `supabase migration list` prüfen |
| **Sentry Error-Tracking aktivieren** | ⬜ | `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` in Vercel |

## Manuell testen vor Go-Live

- [ ] Registrierung + Login (E-Mail)
- [ ] Guided Path: Assessment → Use Case → Governance → Roadmap → Canvas → Architektur
- [ ] PDF-Export (alle 7 Module)
- [ ] Stripe Checkout (Live-Modus, echter Betrag)
- [ ] Abo kündigen → `tier` fällt auf `free`
- [ ] DSGVO-Datenlöschung über Settings
- [ ] Feedback-Formular (mit Screenshot-Anhang)
- [ ] Mobile: 375px (iOS Safari), 768px (iPad)

## Offene Go-Live-Blocker (Prio 1)

1. **Rechtstexte** — Impressum/Datenschutz/AGB noch Platzhalter
2. **Stripe Live-Keys** — Konto aktivieren + Keys tauschen
3. **Resend Domain-Verifizierung** — DNS propagiert, "Verify" in Dashboard klicken
