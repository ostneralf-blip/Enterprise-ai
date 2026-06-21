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

### Feature-Lücken-Analyse (21.06.2026 — CDO/CIO-Perspektive, verifiziert gegen Repo)

**WICHTIG — DB-Schema ist weiter als die UI:** Migration 001 legt bereits `result_versions`
(Versionierung) UND `share_links` (Sharing, inkl. `share_public_read`-Policy für öffentlichen
Lesezugriff) an. Das Datenfundament steht — es fehlen nur API-Routen und UI. Beim Bauen NICHT
neue Tabellen anlegen, sondern die vorhandenen verdrahten.

**A — Rechtlich kritisch (Blocker vor jedem echten Go-Live):**
- DSGVO-Datenlöschung (Account + alle Daten, Art. 17): Settings-Seite hat "Konto"-Abschnitt,
  aber KEINE Löschfunktion. Route `/api/account/delete` fehlt (404). Pflicht, nicht optional.
- Impressum (/impressum), Datenschutzerklärung (/datenschutz), AGB (/agb): existieren als
  Routen noch nicht — separater Legal-Arbeitsblock (siehe Punkt 1 der Brainstorming-Liste).

**B — Geplant, Schema vorhanden, aber NICHT verdrahtet (hoher Produktwert):**
- Versionierung: Tabelle `result_versions` existiert, aber keine Speicher-/Vergleichs-UI.
  Zentrales Pro-Feature laut Tier-Tabelle → "Pro" preislich sonst schwer zu rechtfertigen.
- Link-Sharing (read-only, Ablaufdatum): Tabelle `share_links` existiert, aber Route
  `share/[token]/` und `/api/share` fehlen (404).
- PDF-Export für alle 7 Module: bisher nur für Assessment (Sprint 1) bestätigt. Kern-Produktwert
  ("Ergebnis dem Vorstand zeigen") funktioniert sonst nur für 2 von 7 Modulen.
- Google OAuth: bisher nur E-Mail-Login. Conversion-Hebel für B2B-Self-Service, kein Blocker.

**C — UX-Verbesserungen (wichtig, nicht blockierend):**
- Onboarding/Leerer-Zustand-Führung: empfohlene Modul-Reihenfolge aus dem Konzeptpapier
  (30-Tage-Aktionsplan) im Produkt sichtbar machen, nicht nur im PDF.
- Dashboard als echtes "Mein Stand" (Fortschritt, Readiness-Score, nächster empfohlener
  Schritt) statt reiner Modul-Kachel-Liste.
- Quer-Modul-Hinweise sichtbar machen (z. B. "erst Assessment, dann Use-Case-Scoring" —
  technische Verknüpfung Roadmap↔Assessment existiert bereits, ist aber für Nutzer unsichtbar).
- Suche/Filter/Sortierung in Tabellen (Use-Case-Liste) — ab ~10 Einträgen nötig (Pro/Enterprise).
- Reminder-Mechanik für "Quarterly AI-Health-Review" (Konzeptpapier-Best-Practice) — macht aus
  Einmal-Tool ein wiederkehrendes Arbeitsinstrument.

**D — Strategische Abgrenzung (bewusst NICHT bauen, nur kommunizieren):**
- AI Navigator ist Planungs-/Strategietool, KEIN Runtime-/Monitoring-Tool. Abgrenzung zu
  OneTrust/Credo AI/TrueFoundry (die docken an laufende AI-Systeme an). Bewusst kommunizieren,
  nicht nachbauen.
- Team-/Mandantenfunktion (mehrere User pro Unternehmen) = identisch mit Admin-Panel-"Stufe B".
  Wird bei echten Enterprise-Verkaufsgesprächen schneller zum Showstopper als gedacht — im Blick
  behalten, aber weiter zurückgestellt bis konkrete Kundenanfrage.

**USP-Kandidat (eigener Sprint, erst nach A+B+Tests):**
- AI-Komponenten-Katalog: kuratierte Modell-/Komponenten-Tabelle (Hosting EU/On-Prem,
  DSGVO-Einordnung, EU-AI-Act-Relevanz, SAP-Kompatibilität), integriert in den Architektur-
  Generator als Vorschlags-Engine. Nutzt vorhandenes Admin-Panel (`content_library`) als Basis.
  ACHTUNG Content-Pflege-Problem, nicht nur Code: ohne klaren Aktualisierungsprozess veraltet
  der Katalog und wird zum Vertrauensrisiko (Compliance-Lage von Modellen ändert sich laufend).

### Deployment-Lektion: Vercel Framework Preset (21.06.2026)
**Symptom:** Grüner Build, Root Directory korrekt (`./`), aber 404 auf JEDER Route
inklusive Startseite — auch auf der deployment-spezifischen URL, nicht nur dem Alias.
**Ursache:** In Vercel war unter Settings → Build & Deployment das **Framework Preset
auf "Other" statt "Next.js"** gesetzt. Dadurch wurde die App nicht als Next.js erkannt,
das gesamte Routing (App Router, proxy.ts, Server Components) lief nicht → 404 überall,
obwohl der Build formal "grün" durchlief (er hat nur nichts Sinnvolles gebaut).
**Fix:** Framework Preset auf "Next.js" stellen, dann Redeploy OHNE Build-Cache
auslösen (••• → Redeploy → "Use existing Build Cache" abwählen). Preset greift erst
beim nächsten Build.
**Verifikation im Build-Log:** Next.js-typische Zeilen müssen erscheinen
(`▲ Next.js 16`, `Collecting page data`, `Generating static pages`). Fehlen sie,
wurde nicht als Next.js gebaut.
**Lehre:** Bei neuem Vercel-Projekt-Setup IMMER zuerst Framework Preset prüfen,
besonders bei sehr neuen Next.js-Versionen, wo die Auto-Erkennung versagen kann.

### Bugs & Feature-Wünsche aus Mobile-Test (21.06.2026, verifiziert)

**BUG 1 — Gespeicherte Ergebnisse nicht anzeigbar (Architektur-Modul, vmtl. weitere):**
- Tabelle `architectures` existiert mit allen Spalten (title, wizard_data, result) + RLS,
  ABER `architecture/page.tsx` lädt keine gespeicherten Einträge — fragt nur Profil/Tier ab.
- Vergleich: canvas/page.tsx macht es korrekt (`from('canvases').select('*').eq('user_id'...)`
  → übergibt `initialCanvases`). Dieser Lade-Schritt fehlt im Architektur-Modul.
- Folge: Ergebnisse werden gespeichert, aber nie zurückgeladen/gelistet ("nicht gelistet").
- FIX: Lade-Logik analog Canvas in alle Module mit Speicherfunktion einbauen. Prüfen,
  welche der 7 Module betroffen sind (Canvas funktioniert, Architektur nicht — Rest checken).

**BUG 2 — UI öffnet im "Popup-Modus" statt Vollbild (Mobile/iOS):**
- Dashboard-Layout nutzt `h-screen overflow-hidden` außen + `overflow-y-auto` nur auf <main>.
  Auf iOS Safari verhält sich das wie ein Modal: Seite klebt oben, scrollt erst nach
  "Zieh"-Geste korrekt, native Adressleisten-Mechanik greift nicht.
- FIX-Richtung: Mobile-Scroll-Verhalten überarbeiten — statt fixed `h-screen`-Container mit
  innen-scrollendem main eher natürliches Body-Scrolling auf Mobile zulassen (z. B.
  `min-h-screen` / `dvh`-Einheiten statt `h-screen overflow-hidden`, sticky statt fixed).
  Bei 375px/393px verifizieren.

**FEATURE-WUNSCH 1 — "Andere Ergebnisse speichern" ermöglichen:**
- Nutzer sollen auch weitere/alternative Ergebnisse speichern können (nicht nur eins
  überschreiben). Schema unterstützt das bereits (mehrere Zeilen pro user_id möglich,
  result_versions-Tabelle vorhanden) — UI/Logik muss "Neu speichern" vs. "Überschreiben"
  anbieten und eine Liste der gespeicherten Ergebnisse je Modul zeigen.

**FEATURE-WUNSCH 2 — Geführter Onboarding-Wizard durch die Tools (PRIORITÄT):**
- User soll ZUERST das Archetyp-Assessment durchlaufen (AI Starter/Scaler/Transformer),
  dann sinnvoll durch die weiteren Tools geführt werden — statt 7 gleichwertige Kacheln
  ohne Reihenfolge. Empfohlene Abfolge existiert bereits im Konzeptpapier (30-Tage-
  Aktionsplan) und ist technisch teils verdrahtet (Roadmap zieht Archetyp aus Assessment).
  Im Produkt als sichtbarer "Geführter Pfad"/Wizard umsetzen. Deckt sich mit Feature-Lücke
  C "Onboarding/Leerer-Zustand-Führung".

### Priorisierte Gesamt-Roadmap (21.06.2026, Brainstorming-Ergebnis)
Ordnungsprinzip: Was blockiert Go-Live mit zahlenden Kunden zuerst, dann Wert/USP,
dann strategisch-wichtig-aber-nicht-dringend. Aufwände sind grobe Orientierung —
tatsächliche Komplexität zeigt sich beim Bauen (v. a. Onboarding-Wizard und Abo-Kanten
können größer werden als sie wirken).

**PRIO 1 — Blocker (vor jedem echten Go-Live, rechtlich oder funktional zwingend):**
1. Legal-Seiten: Impressum, Datenschutz, AGB. Pflicht + tote Links auf Landing Page
   (/datenschutz, /impressum werden schon verlinkt, existieren nicht). Texte extern
   (eRecht24/Anwalt), nicht selbst formulieren. [Mittel]
2. DSGVO-Datenlöschung (Account + alle Daten, Art. 17). Settings-Seite hat Platz, keine
   Funktion. Route /api/account/delete fehlt. [Klein–Mittel]
3. Bug: gespeicherte Ergebnisse nicht anzeigbar. Tabellen + RLS existieren, Ladelogik
   fehlt (Architektur betroffen, Canvas korrekt als Vorlage). Alle 7 Module prüfen. [Klein]
4. Bug: Mobile Popup/Scroll-Verhalten (h-screen overflow-hidden → iOS-Modal-Effekt).
   Erster Eindruck mobil ist kaputt. [Klein–Mittel]
5. CI-Pipeline + Branch Protection auf main. Auto-Deploy = jeder Push geht ungeprüft live.
   Sicherheitsnetz fehlt. 1 Workflow-Datei + 1 GitHub-Einstellung. [Klein]

**PRIO 2 — Hoher Produktwert (macht das Produkt verkaufbar):**
6. Geführter Onboarding-Wizard: Archetyp-Test ZUERST, dann geführter Pfad durch die Tools
   statt 7 gleichwertige Kacheln. Teils vorbereitet (Roadmap↔Assessment). [Mittel]
7. Versionierung + Sharing verdrahten. Schema (result_versions, share_links) existiert,
   nur UI/API fehlt. Zentrale Pro-Features. [Mittel]
8. PDF-Export für alle 7 Module (aktuell nur Assessment). Kernwert "Ergebnis zeigen". [Mittel]
9. "Andere Ergebnisse speichern" (mehrere statt überschreiben). Schema unterstützt es. [Klein–Mittel]
10. Tests für die 5 neuen Module (Governance/Roadmap/Canvas/Compliance/Architecture). [Mittel]

**PRIO 3 — Betriebsgrundlagen & Vertrauen (vor/bei echtem Kundenwachstum):**
11. Error-Tracking + Uptime-Monitoring (z. B. Sentry). [Klein]
12. Abo-Lebenszyklus-Kanten: Zahlung fehlgeschlagen, Kündigung, Downgrade-Datenhandling
    (was passiert mit Daten über Free-Limit?), Jahreslizenz-Ablauf. [Mittel]
13. App-Versionierung: Changelog, Git-Tags, semantische Version. Macht Rollback machbar. [Klein]
14. Vertrauenssignale: Trust/Security-Seite, EU-Hosting (Frankfurt) kommunizieren, Über-uns. [Klein–Mittel]
15. Inhaltliche Aktualität sichern (EU-AI-Act-Fristen etc.) — Prozess, nicht Code. Verknüpft
    mit Admin-Panel/Content-Pflege. [Laufend]

**PRIO 4 — USP & Differenzierung (eigener Sprint, nach Fundament):**
16. AI-Komponenten-Katalog: stärkste USP-Idee. Braucht stabiles getestetes Fundament +
    durchdachten Pflegeprozess. Nutzt Admin-Panel (content_library) als Basis. [Groß]
17. UX-Feinschliff: Dashboard-Fortschritt, Suche/Filter (Use-Case-Liste ab ~10 Einträgen),
    Quer-Modul-Hinweise sichtbar machen. [Mittel]
18. Quarterly-Review-Reminder. Macht aus Einmal- ein wiederkehrendes Tool. [Klein–Mittel]

**BEWUSST ZURÜCKGESTELLT (nicht bauen ohne neuen Auslöser):**
- Team-/Mandantenfunktion (Admin-Panel Stufe B) — bis konkrete Enterprise-Kundenanfrage
- Runtime-/Monitoring-Features — bewusste Abgrenzung, AI Navigator bleibt Planungstool
- Google OAuth, Dark Mode, Mehrsprachigkeit EN — Conversion-/Komfort-Hebel, kein Blocker

**Empfohlene Umsetzungsreihenfolge:** Prio 1 komplett (viel davon "klein"), dann in Prio 2
mit #6 Onboarding-Wizard starten (größter spürbarer Wertsprung). Komponenten-Katalog (#16)
bewusst zuletzt — auf stabilem, getestetem Fundament.
