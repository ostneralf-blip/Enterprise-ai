# Deployment-Anleitung — AI Navigator

**Voraussetzung:** Alle drei manuellen Test-Dokumente (`security-checklist.md`, `manual-test-plan.md`, `accessibility-checklist.md`) sind vollständig abgearbeitet und mit "Freigabe: Ja" abgezeichnet, **bevor** Sie diesen Schritten folgen.

---

## 0. Deployment-Reihenfolge — Übersicht

```
Lokale Entwicklung
       ↓ (automatisierte Tests grün + manuelle Checklisten abgezeichnet)
Staging (Vercel Preview oder eigenes Staging-Projekt)
       ↓ (Staging-Smoke-Test bestanden)
Produktion (enterprise-ai.biz)
```

**Grundprinzip:** Niemals direkt von lokal nach Produktion deployen. Staging ist Pflicht, auch im Solo-Betrieb — es ist der einzige Ort, an dem echte Stripe-Webhooks, echte E-Mails und echte OAuth-Redirects gegen reale externe Dienste getestet werden, ohne dass ein Fehler echte Kunden betrifft.

---

## 1. Pre-Deployment-Gate (vor JEDEM Deployment, auch kleinen Änderungen)

Dieser Block läuft **lokal**, bevor irgendetwas gepusht wird:

```bash
# 1. Alle automatisierten Tests
npm run test           # oder: npx jest

# 2. TypeScript strict check
npx tsc --noEmit

# 3. Lint ohne Toleranz für Warnungen
npx eslint src --max-warnings 0

# 4. Produktions-Build muss lokal erfolgreich durchlaufen
npm run build

# 5. Dependency-Sicherheitscheck
npm audit --omit=dev
```

**Regel: Wenn auch nur einer dieser 5 Schritte einen Fehler zeigt, wird NICHT deployed.** Bei `npm audit`-Findings: prüfen ob "moderate" (dokumentieren, weiterfahren erlaubt) oder "high"/"critical" (Blocker, muss behoben werden).

---

## 2. Staging-Deployment

### 2.1 Staging-Umgebung einmalig einrichten (nur beim ersten Mal)

1. **Separates Supabase-Projekt für Staging** anlegen (Region weiterhin eu-central-1 Frankfurt)
   - Migration `supabase/migrations/001_initial_schema.sql` im Staging-SQL-Editor ausführen
   - Eigene API-Keys generieren (getrennt von Produktion!)
2. **Separates Stripe-Konto im Test-Modus** (nicht Live-Modus) verwenden — Stripe trennt das automatisch über Test/Live-Keys
3. **Vercel-Projekt für Staging:**
   ```bash
   vercel link   # falls noch nicht verknüpft
   vercel env add NEXT_PUBLIC_SUPABASE_URL preview
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
   vercel env add SUPABASE_SERVICE_ROLE_KEY preview
   vercel env add STRIPE_SECRET_KEY preview        # sk_test_... !
   vercel env add STRIPE_WEBHOOK_SECRET preview
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY preview
   vercel env add NEXT_PUBLIC_POSTHOG_KEY preview
   vercel env add RESEND_API_KEY preview
   vercel env add NEXT_PUBLIC_APP_URL preview      # https://<preview-url>.vercel.app
   ```
4. **Region festlegen:** Vercel-Dashboard → Project Settings → Functions → Region: `fra1` (Frankfurt)
5. **Stripe-Webhook für Staging-URL registrieren:** Stripe-Dashboard (Test-Modus) → Webhooks → Endpoint mit der Vercel-Preview-URL anlegen

### 2.2 Staging-Deployment durchführen

```bash
git add .
git commit -m "Sprint 1: Assessment-Modul mit Test-Suite"
git push origin <branch-name>
```

→ Vercel erstellt automatisch ein Preview-Deployment bei jedem Push (sofern GitHub-Integration aktiv ist). Alternativ manuell:

```bash
vercel --target preview
```

### 2.3 Staging-Smoke-Test (Minimal-Check, kein vollständiger manueller Testplan nötig)

Direkt nach jedem Staging-Deployment, auch bei kleinen Änderungen:

| # | Check | Wie |
|---|---|---|
| 1 | Seite lädt ohne 500-Fehler | Staging-URL im Browser öffnen |
| 2 | Login funktioniert | Mit Test-Account einloggen |
| 3 | Assessment startet und eine Frage lässt sich beantworten | Klick-Test |
| 4 | Keine Konsolen-Fehler | Browser DevTools → Console |
| 5 | Stripe-Webhook erreichbar | `stripe trigger checkout.session.completed --api-key sk_test_...` gegen Staging-Webhook-URL |

**Erst nach diesem Smoke-Test:** vollständigen `manual-test-plan.md` einmal komplett gegen Staging durchführen (nicht nur lokal) — Staging ist die erste Umgebung, die echtes HTTPS, echte Cookies und echte Latenz hat.

---

## 3. Produktions-Deployment

### 3.1 Einmalige Produktions-Einrichtung

1. **Produktions-Supabase-Projekt** (separat von Staging!) in eu-central-1 anlegen, Migration ausführen
2. **Stripe Live-Modus aktivieren:** Geschäftsdetails vervollständigen, Bankverbindung hinterlegen, Live-API-Keys generieren
3. **Stripe Tax aktivieren** im Live-Modus (separat vom Test-Modus zu konfigurieren!)
4. **DNS:** `enterprise-ai.biz` bei Vercel als Custom Domain hinzufügen, DNS-Records beim Domain-Registrar setzen (A-Record oder CNAME, je nach Vercel-Anweisung)
5. **Vercel Production Environment Variables** setzen (gleiche Liste wie Staging, aber mit Live-Werten):
   ```bash
   vercel env add STRIPE_SECRET_KEY production       # sk_live_... !
   vercel env add NEXT_PUBLIC_APP_URL production     # https://enterprise-ai.biz
   # ... alle weiteren Variablen analog
   ```
6. **Stripe Live-Webhook** auf `https://enterprise-ai.biz/api/stripe/webhook` registrieren, neuen Live-Signing-Secret eintragen
7. **Resend:** Produktions-Domain (`enterprise-ai.biz`) verifizieren (SPF/DKIM-Records setzen)
8. **PostHog:** Separates Production-Projekt anlegen (oder gleiches Projekt mit Environment-Tag, je nach Präferenz)

### 3.2 Produktions-Deployment durchführen

```bash
# Sicherstellen, dass man auf dem korrekten, getesteten Branch ist
git checkout main
git pull

# Letzter lokaler Check (Wiederholung von Schritt 1)
npm run test && npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build

# Deployment
vercel --prod
```

### 3.3 Post-Deployment-Verifikation (sofort nach Live-Schaltung)

| # | Check | Wie |
|---|---|---|
| 1 | `https://enterprise-ai.biz` lädt mit gültigem HTTPS-Zertifikat | Browser, Schloss-Symbol prüfen |
| 2 | Registrierung mit echter (eigener) E-Mail-Adresse | Vollständiger Flow inkl. Bestätigungsmail |
| 3 | Echte Stripe-Testtransaktion mit Stripe-Testkarte (`4242 4242 4242 4242`) im Live-Modus — **Stripe erlaubt Testkarten auch im Live-Modus nur in bestimmten Konstellationen, sonst: Kleinstbetrag mit echter Karte + sofortige Erstattung** | Upgrade-Flow einmal vollständig durchklicken |
| 4 | PDF-Export funktioniert in Produktionsumgebung (Sparticuz-Chromium läuft auf Vercel anders als lokal!) | Als Pro-Account PDF exportieren, Datei öffnen |
| 5 | PostHog empfängt Events | PostHog-Dashboard → Live-Events prüfen |
| 6 | Sentry/Error-Tracking (falls eingerichtet) zeigt keine Fehler in den ersten 15 Minuten | Dashboard prüfen |

**Falls Punkt 4 (PDF-Export) fehlschlägt:** Das ist der bekannteste Stolperstein bei Puppeteer-auf-Vercel-Deployments — meist liegt es an der `@sparticuz/chromium`-Versionskompatibilität mit der Vercel-Node-Runtime. Sofortmaßnahme: Vercel-Function-Logs für `/api/export/pdf` prüfen, ggf. `@sparticuz/chromium` auf die in der Vercel-Dokumentation empfohlene Version pinnen.

---

## 4. Rollback-Plan

**Bei kritischem Fehler in Produktion:**

```bash
# Sofortiger Rollback auf letztes funktionierendes Deployment
vercel rollback
```

Oder über das Vercel-Dashboard: Deployments → vorheriges funktionierendes Deployment → "Promote to Production".

**Datenbank-Migrationen sind NICHT automatisch rückgängig zu machen.** Falls eine Migration fehlerhaft war:
1. Niemals in Produktion experimentieren — Migration zuerst gegen Staging-Datenbank testen
2. Falls doch ein Fehler in Produktion auftritt: manuelles Korrektur-SQL schreiben, niemals die Migration-Datei rückwirkend ändern (Migrationshistorie bleibt unveränderlich)

**Stripe-Webhook-Ausfall (Tier-Sync hängt):**
- Im Stripe-Dashboard unter Webhooks → fehlgeschlagene Events sind dort protokolliert und können manuell erneut zugestellt werden ("Resend")

---

## 5. Monitoring nach Launch (erste 48 Stunden)

| Was | Wo prüfen | Frequenz |
|---|---|---|
| Error-Rate | Vercel-Dashboard → Logs / Functions | Mehrmals täglich |
| PostHog Funnel: Registrierung → Assessment-Abschluss → Upgrade | PostHog-Dashboard | Täglich |
| Stripe-Zahlungseingänge | Stripe-Dashboard | Täglich |
| Supabase-Datenbank-Last | Supabase-Dashboard → Database | Täglich |
| Erste echte User-Feedback-Einträge | Supabase `feedback`-Tabelle oder PostHog | Täglich |

---

## 6. Checkliste — Zusammenfassung für schnellen Zugriff

```
☐ docs/testing/security-checklist.md       — alle Punkte ✅, abgezeichnet
☐ docs/testing/manual-test-plan.md         — alle Punkte ✅, abgezeichnet
☐ docs/testing/accessibility-checklist.md  — alle Punkte ✅, abgezeichnet
☐ npm run test                              — grün
☐ npx tsc --noEmit                          — 0 Fehler
☐ npx eslint src --max-warnings 0           — 0 Fehler/Warnungen
☐ npm run build                             — erfolgreich
☐ npm audit --omit=dev                      — keine high/critical
☐ Staging-Deployment durchgeführt
☐ Staging-Smoke-Test bestanden
☐ Vollständiger manual-test-plan.md gegen Staging wiederholt
☐ Produktions-Umgebungsvariablen gesetzt (Live-Keys!)
☐ Stripe Live-Webhook registriert
☐ DNS für enterprise-ai.biz konfiguriert
☐ Produktions-Deployment durchgeführt
☐ Post-Deployment-Verifikation (Abschnitt 3.3) durchgeführt
☐ Monitoring für die ersten 48h eingeplant
```
