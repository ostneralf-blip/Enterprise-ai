# Security-Checkliste — Manuelle Verifikation vor Produktions-Launch

**Zweck:** Diese Checkliste deckt Security-Aspekte ab, die **nicht** automatisiert in Jest getestet werden können, weil sie eine echte Supabase-Instanz, einen echten Browser oder echte Stripe-Testtransaktionen erfordern. Jeder Punkt muss von Daniel (oder einer zweiten Person) tatsächlich durchgeklickt und mit ✅/❌ + Datum abgezeichnet werden — nicht nur gelesen.

**Status-Tracking:** Kopieren Sie diese Tabelle bei jedem Durchlauf und tragen Sie Ergebnis + Datum ein.

---

## 1. Row-Level-Security (RLS) — kritischster Punkt

**Warum das nicht automatisierbar in Jest ist:** RLS-Policies leben in PostgreSQL, nicht im Anwendungscode. Ein Unit-Test kann die SQL-Syntax prüfen, aber nicht, ob Supabase die Policy zur Laufzeit tatsächlich korrekt gegen echte Auth-Sessions durchsetzt.

### Testaufbau
1. Zwei Test-Accounts in Supabase anlegen: `test-a@enterprise-ai.biz` und `test-b@enterprise-ai.biz`
2. Mit Account A einloggen, ein Assessment ausfüllen und speichern → Session-ID notieren
3. Mit Account B einloggen

### Tests

| # | Test | Erwartetes Ergebnis | ✅/❌ | Datum |
|---|---|---|---|---|
| 1.1 | Als Account B: `/dashboard` aufrufen → erscheint Account A's Assessment in der Liste? | **Nein**, nur eigene Ergebnisse sichtbar | | |
| 1.2 | Als Account B in Browser-DevTools-Konsole: `supabase.from('assessment_sessions').select('*')` ausführen | Liefert **nur** Account B's eigene Zeilen, auch wenn Account A mehr Daten hat | | |
| 1.3 | Als Account B: direkt `supabase.from('assessment_sessions').select('*').eq('id', '<account-a-session-id>')` versuchen | Liefert **leeres Array**, kein Fehler mit Dateninhalt | | |
| 1.4 | Als Account B: versuchen, Account A's Session per `.update()` zu verändern | Schlägt fehl / betrifft 0 Zeilen | | |
| 1.5 | Gleiche Tests 1.1–1.4 wiederholen für: `use_cases`, `canvases`, `governance_sessions`, `compliance_checks`, `architectures`, `result_versions` | Für **jede** Tabelle: kein Zugriff auf fremde Daten | | |
| 1.6 | `profiles`-Tabelle: Account B versucht `profiles` von Account A zu lesen | Kein Zugriff | | |
| 1.7 | `share_links`: Ein gültiger, nicht abgelaufener Share-Link von Account A wird von einem **nicht eingeloggten** Browser (Inkognito) aufgerufen | Inhalt wird angezeigt (read-only), aber **keine** Bearbeitungsmöglichkeit | | |
| 1.8 | Ein **abgelaufener** Share-Link wird aufgerufen | HTTP 404 oder "Link abgelaufen"-Meldung, **keine** Daten sichtbar | | |

---

## 2. Authentifizierung & Session-Sicherheit

| # | Test | Erwartetes Ergebnis | ✅/❌ | Datum |
|---|---|---|---|---|
| 2.1 | `/dashboard` ohne Login aufrufen | Redirect zu `/login?redirect=/dashboard` | | |
| 2.2 | Nach Login über den Redirect-Parameter: landet man wieder auf der ursprünglich angeforderten Seite? | Ja | | |
| 2.3 | Eingeloggter User ruft `/login` auf | Redirect zu `/dashboard` (kein doppeltes Login-Formular) | | |
| 2.4 | Logout-Button klicken, dann Browser-Zurück-Button | Keine geschützten Daten mehr sichtbar, Redirect zu Login | | |
| 2.5 | Falsches Passwort 5× hintereinander eingeben | Supabase Auth Rate-Limiting greift (Standard: Sperre nach mehreren Versuchen) | | |
| 2.6 | Session-Cookie in DevTools inspizieren | `HttpOnly` und `Secure` Flags gesetzt (kein JS-Zugriff auf Token) | | |
| 2.7 | Mit abgelaufenem/manipuliertem Cookie eine geschützte Route aufrufen | Redirect zu Login, kein Crash, keine Daten geleakt | | |

---

## 3. Stripe-Webhook-Sicherheit

**Voraussetzung:** [Stripe CLI](https://docs.stripe.com/stripe-cli) installiert (`stripe login` durchgeführt).

| # | Test | Befehl / Vorgehen | Erwartetes Ergebnis | ✅/❌ | Datum |
|---|---|---|---|---|---|
| 3.1 | Webhook mit gültiger Signatur | `stripe listen --forward-to localhost:3000/api/stripe/webhook` laufen lassen, dann `stripe trigger checkout.session.completed` | Profil wird auf `tier: pro` aktualisiert | | |
| 3.2 | Webhook OHNE Signatur-Header | `curl -X POST http://localhost:3000/api/stripe/webhook -d '{"fake":"data"}'` (ohne `stripe-signature` Header) | HTTP 400 "Invalid signature", **keine** Datenbankänderung | | |
| 3.3 | Webhook mit falscher/manipulierter Signatur | Signatur-Header manuell verändern und senden | HTTP 400, keine Verarbeitung | | |
| 3.4 | Doppelte Zustellung desselben Events (Stripe sendet bei Netzwerkfehlern erneut) | Gleiches Event 2× senden | Idempotent — kein doppeltes Upgrade, kein Fehler beim zweiten Mal | | |
| 3.5 | `customer.subscription.deleted` Event | `stripe trigger customer.subscription.deleted` | Tier fällt zurück auf `free` | | |

---

## 4. Tier-Gating / Feature-Umgehung

| # | Test | Erwartetes Ergebnis | ✅/❌ | Datum |
|---|---|---|---|---|
| 4.1 | Als Free-User direkt `GET /api/export/pdf?module=assessment` aufrufen (curl oder Browser, nicht über UI-Button) | HTTP 403 mit `code: 'UPGRADE_REQUIRED'`, **keine** PDF-Daten im Response-Body | | |
| 4.2 | Als Free-User: `tier`-Wert im React-DevTools / Browser-State manuell auf `'pro'` patchen, dann PDF-Export erneut versuchen | Serverseitiger Check greift weiterhin — Export wird **trotzdem** verweigert (Client-State ist nicht vertrauenswürdig) | | |
| 4.3 | Als Free-User: Speichern-Button im Assessment klicken | UpgradeModal erscheint, **kein** Datenbank-Insert passiert | | |
| 4.4 | Direkter `POST` an einen Endpunkt, der Pro-Daten schreiben würde, mit Free-Account-Session | Serverseitige Tier-Prüfung blockiert (sofern Endpoint existiert) | | |

---

## 5. Input-Validierung gegen reale Angriffsmuster

| # | Test | Eingabe | Erwartetes Ergebnis | ✅/❌ | Datum |
|---|---|---|---|---|---|
| 5.1 | Feedback-Kommentarfeld | `<img src=x onerror=alert(1)>` | Wird als Text gespeichert/angezeigt, **kein** Script-Ausführung im Browser | | |
| 5.2 | Feedback-Kommentarfeld | String mit 10.000 Zeichen | Wird vom Zod-Schema abgelehnt (max. 500) | | |
| 5.3 | PDF-Export `module`-Parameter | `module=../../../etc/passwd` | HTTP 400, kein Filesystem-Zugriff | | |
| 5.4 | PDF-Export `entityId`-Parameter | `entityId=' OR '1'='1` | HTTP 400 (keine gültige UUID), kein SQL-Verhalten sichtbar | | |
| 5.5 | Registrierungs-Formular: E-Mail-Feld | `<script>alert(1)</script>@test.de` | Wird von Supabase Auth / Browser-`type="email"` abgelehnt oder sicher gespeichert | | |

---

## 6. Abhängigkeits- & Infrastruktur-Sicherheit

| # | Test | Befehl | Erwartetes Ergebnis | ✅/❌ | Datum |
|---|---|---|---|---|---|
| 6.1 | Dependency-Audit | `npm audit --omit=dev` | Keine **kritischen** oder **hohen** Findings (moderate sind dokumentiert, siehe Test-Report) | | |
| 6.2 | Keine Secrets im Git-Repo | `git log --all -p \| grep -iE "sk_live\|service_role"` | Keine Treffer | | |
| 6.3 | `.env.local` ist in `.gitignore` | `git check-ignore .env.local` | Gibt Pfad zurück (= wird ignoriert) | | |
| 6.4 | Vercel Environment Variables sind als "Sensitive" markiert | Im Vercel-Dashboard prüfen | `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` als verschlüsselt markiert | | |
| 6.5 | HTTPS wird erzwungen | `curl -I http://enterprise-ai.biz` | Redirect zu `https://` | | |

---

## 7. Abschluss-Freigabe

Erst wenn **alle** Punkte oben mit ✅ abgezeichnet sind, darf das Produktions-Deployment (siehe `docs/deployment/deployment-guide.md`) freigegeben werden.

| Geprüft von | Datum | Alle Punkte ✅? | Freigabe für Produktions-Deployment |
|---|---|---|---|
| | | ☐ Ja ☐ Nein | ☐ Ja ☐ Nein |
