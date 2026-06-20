# Manueller Test-Plan — Assessment-Modul (Usability & Funktion)

**Zweck:** Vollständiger Klick-Durchlauf, den automatisierte Tests nicht abdecken — visuelles Erscheinungsbild, echte Browser-Interaktion, PDF-Endergebnis, Responsive-Verhalten. Auf echtem Gerät/Browser durchführen, nicht nur in der Entwicklungsumgebung.

**Vor Testbeginn:** Stack lokal gestartet (`npm run dev`) ODER gegen Staging-URL getestet. Mindestens 2 Test-Accounts vorhanden (1× Free-Tier, 1× Pro-Tier — Pro-Tier ggf. manuell in Supabase auf `tier = 'pro'` setzen für Testzwecke).

---

## 1. Registrierung & Login

| # | Schritt | Erwartung | ✅/❌ |
|---|---|---|---|
| 1.1 | `/register` aufrufen, Formular mit gültigen Daten ausfüllen | Bestätigungsmail-Hinweis erscheint | |
| 1.2 | Bestätigungsmail im Postfach öffnen, Link klicken | Weiterleitung zu `/dashboard`, eingeloggt | |
| 1.3 | Registrierung mit bereits verwendeter E-Mail wiederholen | Verständliche Fehlermeldung, kein technischer Stacktrace | |
| 1.4 | Passwort mit weniger als 8 Zeichen eingeben | Browser-native Validierung verhindert Submit | |
| 1.5 | Logout, dann `/login` mit korrekten Daten | Login erfolgreich, Redirect zu `/dashboard` | |
| 1.6 | `/login` mit falschem Passwort | Fehlermeldung "E-Mail oder Passwort nicht korrekt", kein Hinweis welches Feld falsch war (Security) | |

---

## 2. Dashboard

| # | Schritt | Erwartung | ✅/❌ |
|---|---|---|---|
| 2.1 | Dashboard nach Login ansehen | Begrüßung mit Vornamen (falls angegeben), 7 Tool-Kacheln sichtbar | |
| 2.2 | Als Free-User: Kacheln für Pro-Module (Compliance, Architektur) anklicken | UpgradeModal erscheint statt Tool-Seite | |
| 2.3 | "Upgrade auf Professional"-Banner unten prüfen | Sichtbar nur für Free-Tier, verschwindet für Pro-Tier | |
| 2.4 | Sidebar: alle 7 Module aufgelistet, gesperrte mit "Pro"-Badge | Visuell klar erkennbar, welche Tools gesperrt sind | |

---

## 3. Assessment — Kompletter Durchlauf (Free-Tier)

| # | Schritt | Erwartung | ✅/❌ |
|---|---|---|---|
| 3.1 | "AI-Readiness Assessment" öffnen | Intro-Screen mit 6 Dimensionen-Übersicht | |
| 3.2 | "Assessment starten" klicken | Erste Frage erscheint, Progress-Bar bei 0 % | |
| 3.3 | Alle 16 Fragen durchklicken (verschiedene Score-Werte wählen) | Progress-Bar bewegt sich korrekt, Dimensions-Label oben wechselt sinnvoll | |
| 3.4 | Bei Frage 5: "Zurück"-Button klicken | Vorherige Frage erscheint, vorherige Auswahl ist NICHT mehr markiert (bekanntes MVP-Verhalten, kein Bug) | |
| 3.5 | Letzte (16.) Frage beantworten | Direkter Sprung zur Ergebnis-Seite, kein Zwischenschritt | |
| 3.6 | Ergebnis-Seite ansehen | Gesamtscore farblich passend (rot/gelb/grün je nach Wert), Archetyp-Badge korrekt, alle 6 Dimensions-Balken gefüllt | |
| 3.7 | "Top Handlungsempfehlungen" prüfen | Zeigt genau 3 Einträge, sortiert nach niedrigstem Score | |
| 3.8 | "Ergebnis speichern" klicken (als Free-User) | UpgradeModal erscheint, **kein** stiller Fehlschlag | |
| 3.9 | "PDF exportieren" klicken (als Free-User) | UpgradeModal erscheint | |
| 3.10 | "Neu starten" klicken | Zurück zum Intro-Screen, alle Antworten zurückgesetzt | |
| 3.11 | FeedbackWidget unten: 👍 klicken | "Danke für Ihr Feedback" erscheint sofort, kein Ladezustand hängt | |
| 3.12 | Assessment erneut durchlaufen, 👎 klicken | Textfeld erscheint, Text eingeben, "Feedback senden" klicken → Bestätigung | |

---

## 4. Assessment — Pro-Tier Funktionen

| # | Schritt | Erwartung | ✅/❌ |
|---|---|---|---|
| 4.1 | Mit Pro-Test-Account Assessment durchlaufen | Identischer Flow wie Free, aber ohne Sperren | |
| 4.2 | "Ergebnis speichern" klicken | Button wechselt zu "✓ Gespeichert", bleibt deaktiviert nach Erfolg | |
| 4.3 | In Supabase-Dashboard `assessment_sessions`-Tabelle prüfen | Neue Zeile mit korrekten `dim_scores`, `total_score`, `archetype` | |
| 4.4 | "PDF exportieren" klicken | Neuer Tab/Download startet, PDF lädt herunter | |
| 4.5 | **PDF-Datei öffnen und visuell prüfen** | Layout nicht verrutscht, Logo/Header sichtbar, Score-Box lesbar, alle 6 Dimensions-Balken mit korrekten Farben, Footer-Disclaimer vorhanden, **keine** abgeschnittenen Texte | |
| 4.6 | PDF-Dateigröße prüfen | Unter 500 KB (Performance-Richtwert) | |
| 4.7 | PDF mit Firmennamen testen (Profil mit `company`-Feld befüllen, dann exportieren) | Firmenname erscheint korrekt im Header | |

---

## 5. Responsive-Verhalten

Auf folgenden Viewport-Größen testen (Browser-DevTools Device-Toolbar oder echte Geräte):

| # | Gerät/Breite | Was prüfen | ✅/❌ |
|---|---|---|---|
| 5.1 | Desktop (1440px) | Sidebar sichtbar, Layout wie vorgesehen | |
| 5.2 | Tablet (768px) | Sidebar verhält sich sinnvoll (Web-MVP: Sidebar ist `hidden lg:flex` — auf Tablet ggf. nicht sichtbar, das ist als Phase-2-Lücke zu dokumentieren, kein Sprint-1-Blocker) | |
| 5.3 | Mobile (375px, iPhone SE Referenzgröße) | Assessment-Fragebogen bleibt nutzbar, Buttons nicht abgeschnitten, Text lesbar ohne horizontales Scrollen | |
| 5.4 | Mobile: Ergebnis-Seite | Score-Box und Dimensions-Balken passen sich an, keine Überlappung | |

**Hinweis:** Da kein dedizierter Mobile-Nav-Drawer in Sprint 1 gebaut wurde, ist eingeschränkte Mobile-Nutzbarkeit erwartbar. Für Web-first-MVP mit primärer Desktop-Nutzung (Enterprise-Kontext) akzeptabel, aber für Sprint 2 als Nachbesserung vormerken.

---

## 6. Browser-Matrix

| Browser | Version | Getestet | ✅/❌ |
|---|---|---|---|
| Chrome | aktuell | | |
| Firefox | aktuell | | |
| Safari | aktuell | | |
| Edge | aktuell | | |

Mindestanforderung für Launch: Chrome + Safari (deckt die überwiegende Mehrheit der Enterprise-Zielgruppe ab).

---

## 7. Fehler- & Edge-Cases

| # | Schritt | Erwartung | ✅/❌ |
|---|---|---|---|
| 7.1 | Während des Assessments Internetverbindung trennen, dann eine Antwort klicken | Kein Absturz; State bleibt im Browser erhalten (Client-State, kein Server-Call pro Frage) | |
| 7.2 | Browser-Tab während des Assessments schließen und neu öffnen | Assessment startet neu von vorne (kein Auto-Save zwischen Fragen — bekanntes MVP-Verhalten) | |
| 7.3 | Zwei Browser-Tabs gleichzeitig mit demselben Account offen, in beiden ein Assessment starten und in Tab 1 speichern | Kein Crash; Tab 2 zeigt ggf. veralteten Stand bis Reload (akzeptabel für MVP) | |
| 7.4 | PDF-Export bei sehr langsamer Verbindung (DevTools Network-Throttling "Slow 3G") | Kein Timeout-Fehler innerhalb von 30 Sekunden (Vercel `maxDuration`-Limit), ansonsten verständliche Fehlermeldung | |

---

## 8. Abschluss-Freigabe

| Geprüft von | Datum | Kritische Bugs gefunden? | Freigabe für Staging-Deployment |
|---|---|---|---|
| | | ☐ Ja (Liste unten) ☐ Nein | ☐ Ja ☐ Nein |

**Gefundene Bugs (falls vorhanden):**

| # | Beschreibung | Schweregrad | Status |
|---|---|---|---|
| | | | |

---

## Tatsächliche Test-Ergebnisse (durchgeführt 19. Juni 2026)

### Abschnitt 1-2: Registrierung, Login, Dashboard
✅ Alle Tests bestanden (nach Fixes aus RLS/Security-Session)

### Abschnitt 3: Assessment Free-Tier (12 Tests)
✅ Alle Tests bestanden — kompletter Flow fehlerfrei

### Abschnitt 4: Assessment Pro-Tier (7 Tests)
✅ Alle Tests bestanden

**Kritischer Bug gefunden und behoben:** Lokaler PDF-Export schlug fehl,
da `executablePath: '/usr/bin/google-chrome'` ein Linux-Pfad ist und auf
macOS nicht existiert. Behoben durch dynamische Pfad-Auflösung über
`@puppeteer/browsers` (`getInstalledBrowsers` + `computeExecutablePath`),
funktioniert jetzt plattformunabhängig (macOS/Linux/Windows) und ist nicht
mehr von einer geratenen Chrome-Version abhängig.

**Setup-Hinweis für neue Entwicklungsumgebungen:**
```bash
npx @puppeteer/browsers install chrome@stable --path ./chrome
```
muss einmalig lokal ausgeführt werden, bevor PDF-Export lokal getestet
werden kann. Auf Vercel (Produktion) wird stattdessen automatisch
`@sparticuz/chromium` verwendet — kein manueller Schritt nötig.

### Zusätzlich während dieser Session behoben (nicht im ursprünglichen Plan)
- Fehlende `upgrade`-Seite komplett neu gebaut (Preisseite mit Stripe-Checkout-Anbindung)
- Fehlende `compliance`/`architecture` Placeholder-Pages nachgezogen
- Komplettes Passwort-vergessen-Flow neu gebaut (fehlte komplett — Hinweis von Daniel während Test 2.2)
- `posthog/client.ts` fehlte lokal — nachinstalliert

### Freigabe

| Geprüft von | Datum | Freigabe für weitere Manual-Tests (Responsive, Browser-Matrix) |
|---|---|---|
| Daniel Ostner | 19. Juni 2026 | ✅ Ja |

---

## Nachgelagerte Mobile-Fixes (Runde 2, 20. Juni 2026)

Nach dem ersten Mobile-Fix (Hamburger-Menü) traten zwei weitere Bugs auf:

| # | Problem | Fix |
|---|---|---|
| 1 | Dashboard-Stats-Karten (3 Stück) nebeneinander erzwungen bei 375px, Text abgeschnitten ("Profe…ial") | `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`, stapeln sich jetzt vertikal auf Mobile |
| 2 | Dimension-Labels im Assessment-Ergebnis zu aggressiv trunkiert ("Datenqualität & -z…") | `truncate` entfernt, `break-words` + `items-start` statt `items-center` — Label darf jetzt über 2 Zeilen umbrechen statt abgeschnitten zu werden |

## Notiert für Feature-Liste (nicht Teil von Sprint 1)

**Hinweis von Daniel:** Einstellungsseite für Personalisierung und
Rechnungsstellung fehlt komplett — insbesondere:
- Eigenen Namen/Firmennamen im Profil bearbeiten (aktuell nur via
  Supabase SQL Editor möglich, kein UI)
- Rechnungsadresse / Stripe Customer Portal Zugang aus der App heraus
- Vermutlich auch: Sprache, Avatar, Benachrichtigungseinstellungen

→ Vorschlag: als eigenständiges "Einstellungen"-Modul in Sprint 2 oder 3
einplanen. Sidebar hat bereits einen (aktuell toten) Link zu `/settings`
vorgesehen — Ziel-Route existiert konzeptionell schon.
