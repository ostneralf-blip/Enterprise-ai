# AI Navigator — CLAUDE.md
## Projekt-Konventionen für Claude Code
_Zuletzt inhaltlich gegen Repo + GitHub abgeglichen: 17.07.2026. Diese Datei aktualisiert
sich nicht automatisch — nach größeren Sprints manuell nachziehen (siehe Hinweis in der
Feature-Lücken-Analyse unten)._

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
8. **Bilinguale UI (DE + EN) — PFLICHT ab sofort (seit 09.07.2026):** Jede neue UI-Anforderung muss gleichzeitig auf Deutsch und Englisch umgesetzt werden. Kein hardcodierter String im JSX — ausschließlich `t()`-Aufrufe via `useTranslations()` aus next-intl. Neue Keys immer parallel in `messages/de.json` UND `messages/en.json` eintragen. Bestehende Namespaces: `common`, `nav`, `sidebar`, `auth`, `dashboard`, `modules` (mit Untersektionen je Modul), `ergebnisse`, `settings`, `share`, `summary`, `upgrade`, `feedback`, `guidance`, `errors`.
9. **Sie-Form (PFLICHT für alle deutschen Texte):** Alle deutschen UI-Texte, E-Mails und Fehlermeldungen verwenden ausschließlich die formelle Anrede (Sie/Ihr/Ihre). Kein du/dein/deine. Gilt für JSX, i18n-Keys in `messages/de.json`, API-E-Mails und Stripe-Templates.
10. Max. ~150 Zeilen pro Komponente

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
- NIEMALS `package.json` ohne begleitendes `package-lock.json` ändern — nach jedem Dependency-Change lokal `npm ci` als Gegenprobe (Lektion #140, 12.07.2026: desynchrones Lockfile machte CI für mehrere Commits blind)

### Obsidian Vault — Pflicht nach jedem finalen Push (seit 06.07.2026)
Nach jedem `git push origin main` (finaler Push, nicht feature-branch) muss der Obsidian Vault
aktualisiert werden. Drei Kategorien:

**1. DB-Schema-Änderungen** (jede neue Migration):
- Neue Tabellen, Spalten, Constraints, RLS-Policies → Note `AI Navigator/Datenbankstruktur.md` aktualisieren
- Format: `| Tabelle | Spalte/Änderung | Typ | Migration | Datum |`

**2. Neue Features und Architekturentscheidungen**:
- Sprint-Abschluss → Note `AI Navigator/Sprint-Log.md` mit Commit-Hash, Feature-Beschreibung, betroffene Dateien
- Neue API-Routen, neue Komponenten-Typen, neue Datenflüsse dokumentieren

**3. Bugfixes mit Architektur-Relevanz**:
- Fixes die das DB-Schema, Auth-Flow, Tier-Gating oder RLS betreffen → in Obsidian vermerken

**Werkzeug:** MCP-Obsidian-Integration (`obsidian_patch_content` / `obsidian_append_content`) oder
manuell in der Obsidian-App. Vault-Pfad und Note-Struktur aus bestehenden Notes übernehmen.
Kein separater Commit nötig — Vault-Updates sind kein Git-Artefakt.

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

**Visueller Abnahme-Gate für UI-/Design-Issues (PFLICHT, seit 07.07.2026):**
Vor jeder „fertig"-Meldung zu einem Issue mit UI- oder Design-Bezug:
1. Screenshot des betroffenen Bereichs bei 1440px erstellen (bei mobil-relevanten
   Änderungen zusätzlich 375px).
2. Gegen die im Issue benannte Referenz abgleichen (Figma Variante D,
   `design-demo-variante-d.html` oder die Spezifikation im Issue-Text/Kommentar).
3. Abweichungen explizit benennen — nicht stillschweigend „fertig" melden.
   Erst nach Screenshot-Abgleich gilt ein UI-Issue als abgeschlossen.
Hintergrund: Am 07.07.2026 brauchten Dashboard-Kacheln und Scoring-Matrix drei
Nachbesserungsrunden, weil Umsetzungen ohne visuellen Abgleich als fertig galten
(Issues #105, #106 inkl. Kommentare).

### Feature-Rückstand (Stufe 2 — Stand 05.07.2026, gegen Repo + GitHub verifiziert)
**Erledigt seit dem letzten Stand (21.06.2026) — hier verbleibend, damit die Historie nachvollziehbar bleibt:**
- ~~Settings: Adressfelder + Kontaktdetails~~ → erledigt (`SettingsPageClient.tsx` hat `mobile`/`phone`-Felder)
- ~~Admin Panel: User-Management~~ → erledigt (`/api/admin/users`, `is_admin`/`is_banned`/`feature_flags` auf `profiles`)

**Noch offen:**
- Settings/Impressum/Datenschutz/AGB: Routen existieren jetzt (`/impressum`, `/datenschutz`, `/agb`), Inhalt ist aber weiterhin Platzhalter (`[Name / Firmenname]`, `[Straße und Hausnummer]` etc.) — echte Rechtstexte (eRecht24/Anwalt) stehen noch aus. Bleibt Go-Live-Blocker, siehe Prio-1-Liste unten.
- FeedbackWidget-Überlaufen bei 393px: Status nicht erneut verifiziert in dieser Runde — bei nächster Mobile-Testrunde gegenprüfen.

### Admin-Panel & Content-Anreicherung (Stand 05.07.2026)

**Stufe A — Plattform-Content-Verwaltung: WEITGEHEND UMGESETZT** (war 20.06.2026 noch
"in Rückstand eingeplant"):
- `content_library`-Tabelle + `/api/admin/content` (GET/POST/PATCH) existiert und wird genutzt
- Admin-Erkennung läuft über `is_admin`-Flag auf `profiles` (nicht `role='admin'` wie ursprünglich
  skizziert — funktional gleichwertig), RLS-geschützt
- CRUD-Interface im Admin-Panel (`/admin`) vorhanden, inkl. Komponenten-Katalog-Editor
  (Tags, Abhängigkeiten `incompatible_with`/`requires`/`suggests`), Upload-Verlauf + Soft-Restore
- Ob **jedes** Modul bereits inhaltlich mit konkreten Gesetzesartikel-Verweisen (EU AI Act Art. X,
  DSGVO Art. Y) angereichert ist oder der `content_library`-Mechanismus bisher nur für den
  Komponenten-Katalog genutzt wird, wurde in dieser Runde nicht Modul-für-Modul verifiziert —
  bei Bedarf gezielt nachprüfen.

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

### Feature-Lücken-Analyse (05.07.2026 — aktualisiert gegen Repo + GitHub Issues/Commits)

**Hinweis zur Methode:** Dieser Abschnitt wurde zuletzt am 21.06.2026 gepflegt. Seitdem
liefen 98 Commits gegen `src/`+`supabase/`, ohne dass CLAUDE.md mitgezogen wurde — die
Datei ist eine Momentaufnahme, keine Live-Ansicht des Repos, und muss nach größeren Sprints
manuell nachgezogen werden (kein Hook macht das automatisch). Diese Aktualisierung wurde
gegen den lokalen Code, die GitHub-Commit-Historie und die GitHub Issues des Repos
`ostneralf-blip/enterprise-ai` abgeglichen. **Nicht möglich war** ein Live-Check des
Supabase-Remote-Projekts (kein `supabase` CLI/Login in der Prüfumgebung) — die Aussagen
zum DB-Schema stützen sich auf die 22 Migrationsdateien in `supabase/migrations/`. Vor
dem nächsten Produktions-Deployment `supabase migration list` laufen lassen und
verifizieren, dass Local/Remote für alle Migrationen bis `20260705122836` synchron sind.

**A — Rechtlich kritisch: TEILWEISE ERLEDIGT**
- ~~DSGVO-Datenlöschung~~ → erledigt: `/api/account/delete` existiert.
- Impressum/Datenschutz/AGB: Routen existieren jetzt (waren am 21.06. noch 404), sind auch
  in Sidebar-Footer + Settings verlinkt — **aber der Seiteninhalt ist weiterhin Platzhalter**
  (`src/app/impressum/page.tsx`: `[Name / Firmenname]`, `[Straße und Hausnummer]`, `[PLZ] [Stadt]`).
  Bleibt ein echter Go-Live-Blocker, auch wenn die 404 behoben ist — braucht echte Rechtstexte
  (eRecht24/Anwalt), keine Selbstformulierung.

**B — Geplant, Schema vorhanden: GRÖSSTENTEILS VERDRAHTET, mit Lücken**
- ~~Versionierung~~ / ~~Sharing~~ → API + UI existieren (`/api/versions`, `/api/share`,
  `share/[token]/`). ABER: Das Versions-UI (`VersionsPanel`) ist laut Issue #68 nur in der
  Architektur-Zeile von `/ergebnisse` eingebaut, nicht "pro Modul" wie im Issue gefordert
  (Roadmap/Governance/Canvas fehlen). Issue #68 ist auf GitHub entsprechend korrekt noch OPEN.
- ~~PDF-Export für alle 7 Module~~ → erledigt (`/api/export/pdf` deckt assessment, governance,
  roadmap, canvas, compliance, architecture, executive_summary, usecase ab; Issues #36, #61 CLOSED).
- **Neu entdeckt:** `/ergebnisse` (gespeicherte Ergebnisse) listet Assessment, Architektur,
  Governance, Roadmap, Canvas (Issues #4, #45, #55 CLOSED) — aber **Compliance-Checks und
  Use-Case-Scoring fehlen weiterhin** in dieser Übersicht. Kein "primär"-Flag, kein Vergleich
  für diese zwei Module. Nicht als offenes Issue gefunden — sollte angelegt werden.
- Google OAuth: weiterhin nur E-Mail-Login. Unverändert, kein Blocker.

**B2 — Aus dem Prozessdiagramm abgeleitete Datenfluss-Anforderungen (05.07.2026, via Issues
#65/#67/#68/#71 von Daniel selbst als GitHub Issues angelegt und referenzieren explizit
"Laut Prozessdiagramm"):**
- ~~#66 DSGVO-Warnung mit Bestätigung im Architektur-Generator~~ → CLOSED, commit `0e238a0`.
- ~~#72 Canvas-Komponentenerkennung (SAP-Alias/Cluster-Bonus)~~ → CLOSED, commit `897578f`.
- ~~#69/#70 SAP-Komponenten-Suggests + Architektur-UI~~ → CLOSED.
- ~~**#65 Governance↔UseCase-Verknüpfung + Roadmap-Badges**~~ → CLOSED (17.07.2026).
- ~~**#67 Compliance als globale Annahme**~~ → CLOSED (17.07.2026).
- ~~**#68 Executive Summary Priorisierung + Versionsvergleich**~~ → CLOSED (17.07.2026).
- ~~**#71 Joule Use Cases dynamisch nach Archetyp + Canvas**~~ → CLOSED (17.07.2026).
- **#73/#74 SAP-Fokus-Bug / Vorschlag-Checkbox-Sync-Bug** — beide OPEN, mit jeweils mehreren
  Fix-Commits heute (`c2c997d`, `2e9f268`, `975396a`). Bei #73 brauchte es drei Anläufe am
  selben Tag — Status vor dem nächsten Release nochmal manuell im Architektur-Generator
  gegenprüfen (SAP-zentrischer Fokus + Vorschlag-Checkbox), bevor das Issue geschlossen wird.
- **Prozess-Empfehlung:** Commits, die ein Issue vollständig erledigen, sollten `Closes #N`
  im Commit-Body verwenden (GitHub schließt dann automatisch beim Merge auf main). Aktuell
  bleiben mehrere fertige Features als offene Issues stehen, was den Rückstand größer aussehen
  lässt als er ist — und umgekehrt das Risiko birgt, dass ein Issue vorschnell "erledigt"
  wirkt, obwohl wie bei #68 nur ein Teil gebaut wurde.

**Neu gefundener Bug (nicht auf GitHub getrackt, sollte als Issue angelegt werden):**
- `governance/page.tsx` (Zeile 26) und `roadmap/page.tsx` (Zeile 31–32) fragen eine Tabelle
  `use_case_portfolios` ab. Diese existiert nicht — die Migration (`001_initial_schema.sql`)
  legt die Tabelle als `uc_portfolios` an. Da der Fehler nicht abgefangen wird, laufen
  vermutlich seit dem heutigen Commit `ed3eb92` sowohl das Use-Case-Dropdown im
  Governance-Check als auch die Governance-Badges in der Roadmap ins Leere. Stufe-1-Sofort-Fix.

**C — UX-Verbesserungen: teilweise erledigt**
- ~~Onboarding/Führung~~ → Dashboard hat jetzt "Ihr geführter Pfad durch den AI Navigator" +
  "Empfohlener nächster Schritt" (`dashboard/page.tsx`). Ursprüngliches Issue #22 (großer
  `wizard_sessions`-Ansatz mit separatem Wizard-Modus) wurde nicht 1:1 gebaut, sondern kleiner
  über Dashboard-Sequenzierung + `guided_path_reset_at`-Mechanismus gelöst — pragmatischer,
  aber funktional andere Lösung als ursprünglich skizziert. Folge-Issue #37 (Wizard "kann nicht
  zu 100% abgeschlossen werden") ist CLOSED; ob die dort beschriebenen Detailanforderungen
  (Executive Summary immer ausführbar, PDF-Export optional zählend) tatsächlich 1:1 umgesetzt
  sind, wurde nicht Zeile für Zeile nachverifiziert.
- Quer-Modul-Hinweise: durch #65/#67 (Governance-Badges in Roadmap, Compliance-Banner in
  UseCase/Governance) deutlich sichtbarer geworden als am 21.06.
- Suche/Filter/Sortierung in Use-Case-Tabelle: Status nicht erneut geprüft in dieser Runde.
- Quarterly-Review-Reminder: weiterhin nicht gefunden, unverändert offen.

**D — Strategische Abgrenzung:** unverändert gültig, keine neuen Erkenntnisse.

**E — Neu aus dem Prozessdiagramm-Abgleich (05.07.2026, noch nicht als GitHub Issue erfasst):**
- Roadmap → Architektur-Generator: Das Diagramm zeigt eine Kante von den Roadmap-Ergebnissen
  zu den Architektur-Ergebnissen. Im Code liest `architecture/page.tsx` Assessment, Governance
  und Canvas, aber an keiner Stelle `roadmaps`. Die Kette bricht dort ab — sollte als Issue
  angelegt werden, falls gewünscht.

**USP-Kandidat (unverändert Vision, nach A+B+Tests):**
- AI-Komponenten-Katalog: Der Kern davon (`component_catalog` + `catalog_sources` +
  Abhängigkeitsmatrix `incompatible_with`/`requires`/`suggests`, Admin-CRUD, Upload-Log +
  Soft-Restore) ist inzwischen weitgehend gebaut (Issue #41, Sprints 7–11) — deutlich weiter
  als am 21.06.2026 als reine Vision markiert. Externe Sync-Quellen (CNCF Landscape,
  Hugging Face, SAP API Hub) laut Issue #41 als Sprint 5 geplant — Status nicht verifiziert,
  ob das bereits läuft oder weiterhin manuelle Pflege ist.

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

### Datenbank-Lektion: PostgREST max_rows und wachstumssicheres Query-Design (19.07.2026)
**Symptom:** Drei unabhängige Bugs am selben Tag (18.–19.07.2026): Admin-Katalogliste
zeigte SAP-Joule-Einträge nicht, `/api/catalog/components` lieferte unvollständige
Ergebnisse, und die Architektur-Analyse markierte bereits im Katalog vorhandene
Komponenten (u. a. „Databricks", exakter Namenstreffer!) wiederholt als „neu" —
jedes Mal ohne jeden Fehler, rein stillschweigend falsches Ergebnis.
**Ursache:** `component_catalog` wuchs im Laufe der Sprints auf >1450 aktive Zeilen.
PostgREST kappt JEDE Antwort hart bei `api.max_rows = 1000` (`supabase/config.toml`)
— unabhängig vom angeforderten Range und ohne Fehlermeldung. Mehrere Stellen im Code
luden „den kompletten aktiven Katalog" per einfachem `.select().eq('is_active', true)`,
um danach in JS gegen ein paar Namen zu prüfen — bei >1000 Zeilen ohne definiertes
`.order()` fehlten dabei zufällige Zeilen im Ergebnis, nicht notwendigerweise die
zuletzt hinzugefügten.
**Fix (zwei Ebenen):**
1. **Kurzfristig behoben:** Betroffene Stellen (`admin/page.tsx`, `/api/catalog/components`,
   `/api/admin/users`, Analyse-Route-Backup im Seed-Endpoint) paginieren jetzt vollständig
   via `.range()`-Schleife statt einer einzelnen `.select()`.
2. **Architektonisch richtig (wo möglich vorzuziehen):** die Analyse-Route wurde von
   „kompletten Katalog laden" auf eine GEZIELTE Abfrage umgestellt — `.in('name_key', …)`
   (nutzt den bestehenden UNIQUE-Index) plus `.overlaps('aliases', …)` (nutzt den
   bestehenden GIN-Index) liefern nur die tatsächlich relevanten ~5–15 Zeilen statt der
   ganzen Tabelle. Skaliert dadurch unabhängig davon, wie groß der Katalog wird.
**Lehre — verbindlich für neue Queries auf wachsenden Tabellen** (`component_catalog`,
`profiles`, `architectures`, `catalog_suggestions`, `canvases`, `content_library`,
`catalog_upload_log`, `ai_prompt_cache`, …):
- Niemals „ganze Tabelle laden, dann in JS filtern", wenn eine gezielte `WHERE`-Bedingung
  (`.eq()`, `.in()`, `.overlaps()`, Volltextsuche) das Gleiche mit einer kleinen,
  von der Tabellengröße unabhängigen Ergebnismenge erreichen kann — das ist zugleich
  performanter UND wachstumssicher, nicht nur ein Workaround für das 1000-Zeilen-Limit.
- Wo ein echter „alles auflisten"-Fall unvermeidbar ist (z. B. Admin-Exportfunktionen,
  Backups vor Überschreiben): explizit über `.range()` in 1000er-Seiten paginieren, nie
  auf eine einzelne `.select()` ohne Limit verlassen.
- Neue Filterspalten, die absehbar für Lookups gebraucht werden (z. B. normalisierte
  Namens-Keys, Alias-Arrays), bekommen von Anfang an einen passenden Index (`UNIQUE`
  bei Eindeutigkeit, `GIN` bei Array-/Volltextsuche) — component_catalog hat das über
  `name_key` und `aliases` bereits vorbildlich.
- Bei Verdacht auf dieses Muster: `supabase/config.toml` → `api.max_rows` prüfen und
  die betroffene Tabellengröße gegenrechnen, bevor tiefer nach anderen Ursachen gesucht
  wird — spart Zeit gegenüber dem Nachverfolgen einzelner Symptome.

### Bugs & Feature-Wünsche aus Mobile-Test (21.06.2026) — Status 05.07.2026

**BUG 1 — Gespeicherte Ergebnisse nicht anzeigbar** → ERLEDIGT (GitHub Issue #4, CLOSED
21.06.2026). Lade-Logik wurde analog Canvas in die restlichen Module eingebaut, `/ergebnisse`
zeigt heute Assessment/Architektur/Governance/Roadmap/Canvas inkl. Primär-Markierung.

**BUG 2 — UI öffnet im "Popup-Modus" statt Vollbild (Mobile/iOS)** → ERLEDIGT.
`src/app/(dashboard)/layout.tsx` nutzt jetzt `h-[100dvh]` statt `h-screen`, mit explizitem
Kommentar im Code, der genau diesen iOS-Safari-Modal-Effekt referenziert.

**FEATURE-WUNSCH 1 — "Andere Ergebnisse speichern"** → ERLEDIGT für Architektur (VersionsPanel
in `/ergebnisse`, Issue #45 + #68 teilweise CLOSED). Für Roadmap/Governance/Canvas laut Issue
#68 noch nicht ausgerollt — siehe Feature-Lücken-Analyse B oben.

**FEATURE-WUNSCH 2 — Geführter Onboarding-Wizard** → funktional näherungsweise erledigt, aber
anders gebaut als ursprünglich beschrieben: kein separater `wizard_sessions`-Wizard-Modus,
stattdessen ein sequenzierter Dashboard-Pfad ("Ihr geführter Pfad durch den AI Navigator" +
"Empfohlener nächster Schritt", `dashboard/page.tsx`). GitHub Issues #22 und #37 sind CLOSED.
Ob alle in #37 genannten Detailanforderungen (Executive Summary immer ausführbar auch ohne
100%-Abschluss, PDF-Export zählt nicht zur Fortschritts-Berechnung) exakt so umgesetzt sind,
wurde in dieser Runde nicht zeilengenau nachverifiziert.

### Priorisierte Gesamt-Roadmap (Stand 17.07.2026 — gegen Repo + GitHub abgeglichen)
**Status: Sprints 14, 15, 32, 35 Wave 1–3, #215/#217/#218 implementiert.**

**ERLEDIGT — Sprint 14 (Design-Refresh + Produkt-Lücken, CLOSED 06.07.2026):**
- ~~#68 Versions-UI auf Roadmap/Governance/Canvas~~ → DONE (`4bf0af3`)
- ~~#75 /ergebnisse: Compliance + UseCase Tabs + Primär-Flag~~ → DONE (`cf4e0e0`, `049b6d0`)
- ~~Roadmap → Architektur-Verknüpfung~~ → DONE (`85b1570`, roadmapContext)
- ~~#83 Executive Summary PDF Redesign~~ → DONE (`c388e7f`)
- ~~#84–#88 Design-Refresh Variante D~~ → DONE (Buch-Branding, Tokens, Dashboard V2, Animationen)
- ~~#89 Farbthemes + Dark Mode~~ → DONE (`9df48fc`, `f1ffaf0`)
- ~~#82 Canvas-Compliance 7 Kategorien~~ → DONE (`4884888`)

**ERLEDIGT — Sprint 15 (Wissens-Layer, CLOSED 06.07.2026):**
- ~~#77 DB: content_library + context_key/display_order/is_published~~ → DONE (`4db4076`)
- ~~#78 UI: GuidanceCard + GuidancePanel als Side-Drawer~~ → DONE (`4db4076`, `be14e2b`)
- ~~#79 Verdrahtung in allen 7 Modulen~~ → DONE (`47436ca`)
- ~~#80 Content: Erst-Tranche 40 Blöcke~~ → DONE (`878eae3`)
- ~~#81 Tier-Gating: min_tier auf content_library, Admin-togglebar~~ → DONE (`67cb732`)
  **Hinweis:** Kein separates Preismodell nötig — Admins schalten `min_tier` pro Block im
  Content-Library-Editor. Entscheidung: `free` als Default, Admin kann auf `pro` stellen.

**ERLEDIGT — Sprint 32 (Arch-V2 Korrekturen #155 + #156, 17.07.2026):**
- ~~#156 aria-expanded, Konflikt-Badge, onConfirm sources in ComponentSelectionStep~~ → DONE
- ~~#155 componentSources in ArchitectureResult persistieren~~ → DONE
- ~~#155 EamMap.tsx — 5-Band-Architektur-Landkarte~~ → DONE (inkl. Hosting-Filter)
- ~~#155 ◆-Marker in PDF-Export + Share-View~~ → DONE
- ~~#155 PostHog arch_view_switched + eam_validation Events~~ → DONE
- GitHub-Kommentare auf #155/#156 müssen manuell gepostet werden (API 403)

**ERLEDIGT — PostHog Analytics + #215 (17.07.2026):**
- ~~PostHog $pageview + $pageleave tracking~~ → DONE (commits `797ff75`, `06fd37a`, `90ee85f`)
- ~~#215 EU-Reverse-Proxy (/ingest/*), share_created Event, Stripe Lifecycle Events~~ → DONE (`bf3ef4f`, `c16f0ec`)
- Root Causes behoben: proxy.ts Middleware fing /ingest/* ab; /ingest/array/* falsch geroutet;
  PostHog-Bot-PR (instrumentation-client.ts + skipTrailingSlashRedirect) entfernt.

**ERLEDIGT — #201 Wave 1–3 (17.07.2026):**
- ~~Wave 1 Shared/Layout (12 Dateien)~~ → DONE (`7d94c40`)
- ~~Wave 2 Dashboard/Settings/Feedback (6 Dateien)~~ → DONE (`fd68228`)
- ~~Wave 3 zusammenfassung/page.tsx~~ → DONE (`6463b88`)
- ~~Wave 4 große Module~~ → DONE (`1198e1a`, 17.07.2026) — verbleibende Farben sind intentionale Kategorie-/Brand-Farben (RACI, Dept-Badges, AI-Brand, dunkle CTAs)

**ERLEDIGT — Sprint 32 MERIDIAN PDF-Reports #223 + #224 + #225 (19.07.2026):**
- ~~#225 Readiness-, Portfolio-, Compliance-, Roadmap- & Architektur-Report~~ → DONE:
  5 weitere Report-Typen (Musterseiten 2-6) plus Gesamtdokument-Export. Neue Basis-
  komponenten in `components.tsx`: `RadarChart` (Hexagon-Netz, SVG-Polygon statt
  react-pdf-Text-in-Svg — Labels als absolut positionierte Text-Geschwister),
  `QuadrantMatrix`, `Timeline` (mit HEUTE-Marke, Insets gegen abgeschnittene
  Rand-Kreise), `HorizonCard`, `AiCalloutBlock`. Jede Musterseite hat 1-2 erfundene
  Datenpunkte, die mangels echter Quelle bewusst NICHT gebaut wurden (Prinzip
  konsequent aus #224 fortgeführt, jeweils in der jeweiligen `data/*.ts`-Datei
  dokumentiert): Readiness-Branchenbenchmark entfällt; Use-Case-Portfolio-Logik-Text
  nutzt echte Quadranten-Zählung statt erfundener Kapazitäts-/Quartalsangaben;
  Compliance-Dokumentationsstand ist EIN echter Gesamt-Fortschrittsbalken (erledigte/
  gesamt Hochrisiko-Pflichten aus `compliance_checks`) statt vier erfundener
  Einzelprozentwerte, EU-AI-Act-Fristen-Zeitleiste nutzt die offiziellen, öffentlich
  bekannten Gesetzestermine (unbedenklich hartcodiert, kein Nutzerdatum); Roadmap-
  "Projektion Reifegrad"/"Review-Kadenz" ersetzt durch echten Ist-vs-Vorher-Assessment-
  Score; Architektur-Kennzahl-Karten (Investition/Laufend/Umsetzung/Risikoprofil)
  entfallen komplett mangels Datenquelle, KI-Einordnung nutzt `architectures.ai_narrative.exec`
  (echter Speicher-Key laut `lib/ai/section-audience.ts` — NICHT `narrative_exec`,
  das ist nur der interne Analyse-Sektionsname) und wird nur bei zur Report-Sprache
  passendem `narrative_locale` gezeigt. Roadmap- und Architektur-Datenschicht lösen
  `{de,en}`-LocaleString-Felder konsequent über `resolveLocaleField()` auf (derselbe
  React-Fehler-#31-Bug-Typ wie beim #224-Fix vom 19.07.2026, hier von Anfang an vermieden).
  Gesamtdokument (`reports/full-report.tsx`): extrahiert das `<Page>`-Kind jedes
  Einzel-`<Document>` (`doc.props.children`) statt jede Datei auf eine Page-only-
  Variante umzubauen — react-pdf zählt `pageNumber`/`totalPages` automatisch über
  alle Seiten EINES gemeinsamen `<Document>`, dadurch stimmt die fortlaufende
  XX/YY-Paginierung ohne weiteres Zutun; fehlende Module werden übersprungen statt
  den Export scheitern zu lassen. Export-Buttons in allen 5 Modul-Seiten (Assessment,
  Use-Case, Compliance, Roadmap, Architektur) ersetzen die alten `/api/export/pdf`-Links
  (`MeridianExportButton.tsx` generalisiert auf ein `namespace`-Prop). Route
  `/api/export/[report]` erweitert um `readiness`/`usecase-portfolio`/`compliance-status`/
  `roadmap-status`/`architecture-status`/`full-report`, je mit eigenem 404 statt
  leerem Report bei fehlenden Daten.
- **Nachtrag 19.07.2026 — Investitionsrahmen + Empfehlung im Architektur-Report**
  (von Daniel nachträglich zu #225 angefordert, oberhalb Schlüssel-Entscheidungen):
  `NarrativeSectionSchema` (`lib/ai/schemas.ts`) um optionales `investment_framework`
  erweitert (year1_estimate/ongoing_estimate/timeframe_estimate/risk_label/risk_note),
  vom Modell im `narrative_exec`-Prompt (`lib/ai/analysis.ts`) explizit als GROBE
  Schätzung angefordert (keine belastbare Kalkulation, im Report entsprechend
  beschriftet) — additive Schema-Änderung, bricht die bestehenden 3 Narrative-
  Konsumenten (Architektur-Workbench-Karten) nicht. `decision_recommendation` gab
  es im Schema bereits, wurde aber im Report bisher nicht angezeigt — jetzt als
  eigener „Empfehlung"-Block ergänzt. Beide Felder (wie `aiSummary`) nur sichtbar,
  wenn `narrative_locale` zur Report-Sprache passt.
  **Bug gefunden + behoben:** `fontStyle: 'italic'` auf Work-Sans-Text (`emptyState`
  in 4 Report-Dateien: executive-summary/readiness/compliance-status/roadmap-status/
  architecture-status) crashte beim ECHTEN react-pdf-Rendern mit "Could not resolve
  font for Work Sans, fontWeight 400, fontStyle italic" — Work Sans war nur in
  Regular/Bold registriert, nie in Italic. Der Jest-Mock deckt das nicht ab (prüft
  keine Font-Auflösung), nur ein echtes Render-Skript hat es gezeigt. Fix: Work Sans
  Italic 400 in `lib/pdf/meridian/fonts.ts` ergänzt (URL per `curl -A "Mozilla/5.0"
  fonts.googleapis.com/css?family=Work+Sans:400italic` verifiziert, keine bekannten
  fontkit-Probleme wie bei IBM Plex Mono). **Lehre:** Bei jeder neuen MERIDIAN-
  Report-Komponente mit `fontStyle: 'italic'` prüfen, ob die verwendete
  Font-Familie diese Variante tatsächlich in `fonts.ts` registriert hat — der
  Jest-Mock validiert das nicht, nur ein reales Render-Skript mit Netzwerkzugriff
  deckt es auf (siehe auch die IBM-Plex-Mono-Lehre in `fonts.ts` selbst).
- **Nachtrag 19.07.2026 — Root-Cause-Fix: `narrative_locale` wurde nie geschrieben.**
  Daniel meldete, dass der Investitionsrahmen/die Empfehlung im Architektur-Report
  trotz Deploy weiterhin fehlten ("alte Struktur"). Reale exportierte PDF-Datei
  geprüft + `supabase db dump` gegen die Produktions-DB: `architectures.ai_narrative`
  enthält bei vielen Zeilen echten, korrekten KI-Text — aber `narrative_locale` ist
  bei JEDER je generierten KI-Einordnung `NULL`. Ursache: Migration
  `20260713155101_add_narrative_locale.sql` legte die Spalte an (für Issue #172),
  aber kein Code-Pfad hat sie je beschrieben — `src/app/api/analysis/architecture/[id]/route.ts`
  aktualisierte beim Speichern nur `ai_narrative`/`ai_model`/`ai_generated_at`, nie
  `narrative_locale`. Betraf nicht nur den neuen MERIDIAN-Report (der die Spalte als
  Sprach-Gate nutzt), sondern auch einen bereits bestehenden, aber nie ausgelösten
  Staleness-Hinweis in der Architektur-Workbench selbst (`ArchitecturePageClient.tsx`,
  `narrativeLocale !== locale`-Check griff mangels gesetztem Wert nie).
  **Fix:** `narrative_locale: locale` im Update-Payload ergänzt (Regressionstest
  `__tests__/unit/architecture-narrative-locale.test.ts`). **Kein Backfill** für
  bereits gespeicherte Zeilen — die Sprache des vorhandenen `ai_narrative`-Texts
  variiert nachweislich zeilenweise (DE und EN im selben Datensatz gefunden), ein
  pauschales Setzen von `narrative_locale='de'` hätte teils falschsprachigen Text
  als "passend" ausgegeben. Betroffene Nutzer müssen die KI-Einordnung einmal neu
  ausführen, danach greift der Fix automatisch.
- ~~#223 MERIDIAN-Fundament~~ → DONE (`b1b586c`): Design-Tokens (`config/report-tokens.ts`),
  Fontregistrierung (Lora/Work Sans/IBM Plex Mono — IBM Plex Mono bewusst von
  `raw.githubusercontent.com/google/fonts` statt gstatic, siehe Kommentar in
  `lib/pdf/meridian/fonts.ts` zu einem fontkit-Bug bei der gstatic-Subset-Datei),
  7 Basiskomponenten (`lib/pdf/meridian/components.tsx`), Route `/api/export/[report]`.
- ~~#224 Executive Summary MVP~~ → DONE: `lib/pdf/meridian/reports/executive-summary.tsx`
  bildet Musterseite 1 exakt nach (RingGauge, Archetyp-Badge, 6 MeterBars, Kernbefund,
  Top-3-Use-Cases-Tabelle, EU-AI-Act-Status, Nächste-90-Tage) — visuell gegen
  `docs/design/AI-Navigator-Report-Design-MERIDIAN(-EN).pdf` abgeglichen (Seite 1/1,
  kein Umbruch). Datenmapping in `lib/pdf/meridian/data/executive-summary.ts`:
  EU-AI-Act-Status nutzte zunächst `computeEuAiActStatusV1()` als bewusst isolierte,
  austauschbare Funktion — seit dem Use-Case-Compliance-Scoring-Nachtrag weiter unten
  läuft hier `computeEuAiActStatusV2()`, die Funktion wurde wie geplant 1:1 ausgetauscht,
  ohne diese Report-Komponente anzufassen. Branchenbenchmark aus der
  Musterseite entfällt mangels echter Datenquelle ersatzlos, Vorjahreswert wird nur bei
  einem zweiten abgeschlossenen Assessment angezeigt (keine erfundenen Zahlen).
  i18n-Namespace `reports.executiveSummary` neu in `messages/de.json`/`en.json`
  (next-intl `createTranslator()` statt der alten `PDF_T`-Dictionary, wie in #224 gefordert).
  Export-Button (`MeridianExportButton.tsx`, Pro-gated, disabled ohne Assessment)
  in `/zusammenfassung` neben dem bestehenden `/api/export/pdf`-Link; PostHog-Event
  `report_exported`. Jest-Testing-Hinweis: `next-intl`/`use-intl` sind reines ESM und
  brauchen einen lokalen `jest.mock()` (siehe `__tests__/test-utils/next-intl-mock.js`) —
  bewusst NICHT global aktiviert, das hätte 15 unabhängige, bereits vorher rote
  next-intl-Testsuiten mitverändert.

**IMPLEMENTIERT — Akzeptanz-Gate ausstehend (Freigabe Daniel vor GitHub-Close):**
- **#217** Tab-Leisten ohne Scrollbar (`783b940`): Compliance + Admin → Mobile Select + Fade-Kante; UseCaseTable scrollbar-hidden. Screenshot 1440+375 + Daniels Freigabe ausstehend.
- **#218** KI-Ergebnis-Autosave (`d60718f`): `lib/ai/draft-store.ts` (TTL 7d) + `AiDraftBanner` in Architektur + Canvas. GIF-Nachweis + Daniels Freigabe ausstehend.
- **#223/#224/#225** MERIDIAN PDF-Reports komplett: Screenshot 1440px (Musterseiten-Abgleich
  bereits im Rahmen der Umsetzung erfolgt, s. o.) + Daniels finale Freigabe vor GitHub-Close
  ausstehend.

**PRIO 1 — Noch offen (Betrieb & Vertrauen):**
- Rechtstexte (Impressum/Datenschutz/AGB): Daniel bestätigt Texte vorhanden (17.07.2026) — Code-seitig erledigt.
  Bei Go-Live nochmals auf rechtliche Vollständigkeit prüfen (eRecht24/Anwalt).
- ~~Sentry Error-Tracking~~ → Daniel bestätigt: läuft (17.07.2026).
- ~~`/trust`-Seite~~ → Daniel bestätigt: Inhalt vorhanden (17.07.2026).
- Abo-Lebenszyklus-Kanten (Zahlung fehlgeschlagen, Kündigung, Downgrade-Datenhandling) — noch offen.

**BEWUSST ZURÜCKGESTELLT:**
- Team-/Mandantenfunktion — bis konkrete Enterprise-Kundenanfrage
- Google OAuth — kein Blocker
- Compliance-Scanner Cron-Job — gestrichen (07.07.2026), manueller Trigger reicht

**Offene GitHub Issues (aktiv, kein Blocker):**
- ~~**#201** Zentrales Theme-System~~ → Wave 4 DONE (`1198e1a`, 17.07.2026). Daniels Screenshot-Freigabe für ArchitecturePageClient noch ausstehend.
- **#205** Einheitliche Grundelemente → TEILWEISE (korrigiert 22.07.2026, war fälschlich als „DONE" markiert): `1bd36f2` (17.07.) war nur EIN Teil-Commit (Roadmap-InfoHints), nicht das ganze Issue. Die breiten Akzeptanzkriterien (Inventur-Tabelle Modul × Hilfsmarker, ALLE Hinweisboxen aus der Einheits-Komponente, Wissensbasis-Komponente in ≥2 Modulen) sind NICHT erfüllt — Issue bleibt zu Recht OPEN. Verbleibender Rest u. a. im UX-Review-Sprintplan (`docs/sprints/2026-07-22-sprint-34-37-ux-review-plan.md`, Teil B): HintBox-`break-words`, Governance-Badge-`title` in `UnifiedContextBanner`, InfoHint-Ruhezustand-Rahmen.
- **#217 / #218** — implementiert, warten auf Daniels Screenshot-Freigabe (siehe oben).
- ~~**#223 / #224 / #225** MERIDIAN PDF-Fundament + alle 6 Report-Typen + Gesamtdokument~~ → DONE (s. o.), Freigabe ausstehend.

**Feature-Backlog (für zukünftige Sprints):**
- Compliance-Quellen: Admin kann neue URLs zur Überwachung eintragen (aktuell hardcodiert in `scanner.ts`)
- Canvas-Synonym-Lernvorschläge: nach Canvas-Speichern neue Begriffe als Admin-Vorschlag
- Compliance-Fristen-Timer: Countdown zu Stichtagen in WatchlistCard
- Versions-Diff-Ansicht: Änderungen zwischen zwei gespeicherten Versionen anzeigen
- Externe Sync-Quellen für AI-Katalog (CNCF Landscape, Hugging Face, SAP API Hub) — noch kein konkreter Bedarf
- Weitere unpaginierte `.select()`-Volltabellen-Ladungen auf wachsenden Tabellen prüfen/
  paginieren (siehe „Datenbank-Lektion" oben, Audit vom 19.07.2026 — Risiko aktuell gering,
  da kleine Zeilenzahlen, aber ohne Schutz): `/api/admin/synonyms/learn` (`canvases`,
  `canvas_synonyms` — global, nicht user-gescoped), `/api/admin/synonyms` (`canvas_synonyms`),
  `/api/admin/content` (`content_library`), `/api/admin/promotions`, `/api/admin/compliance/drafts`,
  `/api/admin/policy-templates`, `/api/canvas/[id]/classify-terms` (`detection_blocklist`)
- ~~**Use-Case-Compliance-Scoring**~~ → V2 UMGESETZT (19.07.2026, mit Daniel abgestimmt,
  im Rahmen der MERIDIAN-Report-Nacharbeiten). Ersetzt die V1-Näherung
  (`use_cases.governance_result` 1:1 auf Minimal/Begrenzt/Hochrisiko) durch ein
  echtes Use-Case-Scoring:
  - **Wichtige Entdeckung bei der Umsetzung:** Es gab bereits eine fertige, aber in der
    CLAUDE.md-Analyse übersehene Infrastruktur — `lib/eu-ai-act/classifier.ts`
    (deterministischer Art.-6-Klassifikator, kein LLM) + `canvases.ai_act_assessment`
    (Migration `20260715220302`, Ergebnis `hochrisiko`/`anhang_iii_ausgenommen`/
    `nicht_anhang_iii`) + `use_cases.canvas_id` (FK, seit `20260626202141`). Aktuell
    deckt der Klassifikator nur die Domäne Beschäftigung (Anhang III Nr. 4) ab, nicht
    alle 8 Anhang-III-Bereiche.
  - **Scoring-Formel** (`lib/compliance/eu-ai-act-use-case-scoring.ts`,
    `computeEuAiActStatusV2`): Basis aus `ai_act_assessment.classification.result` —
    `hochrisiko`→100 Punkte, `anhang_iii_ausgenommen`/`nicht_anhang_iii`→0 Punkte
    (rechtlich korrektes Mapping: eine Art.-6-Abs.-3-Ausnahme bedeutet ebenso wie
    "nicht Anhang III" keine Hochrisiko-Pflicht — der einzige Unterschied ist das
    *Warum*, nicht das *Ob*). Zuschlag pro aktiver Compliance-Kategorie (aus
    `analyzeCanvas().compliance`, 7 Kategorien seit #82) = `(100 − Fortschritt-%) × 0,3`,
    aus dem KONTOWEITEN Checklisten-Fortschritt der jeweiligen Kategorie
    (`compliance_checks` ist pro Nutzer, nicht pro Use-Case — der Fortschritt einer
    Kategorie wird auf jeden Use-Case angewendet, der sie als relevant erkennt; inhaltlich
    vertretbar, da Maßnahmen wie ein VVT unternehmensweit gelten). Schwellwerte: ≥67
    Hochrisiko, 34–66 Begrenzt, <34 Minimal. Nur 5 von 7 Kategorien haben eine echte
    Checkliste (DSGVO, EU AI Act, ISO 27001, NIS2, Finanzregulierung≈BAIT) —
    Gesundheitsdaten/MDR und EU-Hosting/Datensouveränität bleiben ohne Zuschlag
    (kein erfundener Wert ohne echte Datenquelle).
  - **Fallback ohne Canvas/Assessment:** automatisch V1 (`governance_result`) pro
    einzelnem Use-Case, kein Fehlerzustand — `computeEuAiActStatusV1` liegt jetzt in
    einer eigenen Datei `lib/compliance/eu-ai-act-status-v1.ts` (aus
    `data/executive-summary.ts` ausgelagert, um einen Zirkelbezug mit V2 zu vermeiden).
  - **Nebenbei gefunden + behoben:** `POST /api/compliance` akzeptierte nur
    `eu_ai_act`/`dsgvo`/`risk_matrix` als `regulation` — die "Weiteren Regularien"
    (NIS2, ISO 27001, ISO 42001, BAIT, LkSG) und deren Aktivierung (`regulation='system'`)
    scheiterten seit ihrer Einführung serverseitig an Zod (422), ohne dass die UI den
    Fehler bemerkte (optimistisches Update lief trotzdem durch — Checkboxen wirkten
    gespeichert, waren es nie). Ohne diesen Fix hätte das V2-Scoring für diese 5
    Kategorien nie echte Daten gehabt. Enum jetzt aus `ADDITIONAL_REGULATIONS`
    abgeleitet statt hartcodiert.
  - Gleiche `EuAiActStatusSummary`-Ausgabeform wie V1 — Report-Komponenten
    (`executive-summary.tsx`, `compliance-status.tsx`) unverändert, wie in #224
    versprochen. 16 neue Unit-Tests (Formel-Logik + Fallback + Kategorie-Fortschritt).
- **Nachtrag 22.07.2026 — V2-Redesign nach Daniels Test: von pro-Canvas-Kategorien
  auf GLOBAL aktivierte Regularien + Sichtbarkeit im Report.** Daniel meldete, dass
  DSGVO- und NIS2-Checklisten-Arbeit im Compliance-Report keinerlei Wirkung zeigte.
  Ursachenkette (per `supabase db dump` am realen Testkonto verifiziert):
  1. Seine 2 Use-Cases haben Canvases, aber KEINE `ai_act_assessment` (das
     Art.-6-Formular erscheint nur bei Beschäftigungs-/HR-Kontext, seine
     Prozess-Automatisierungen sind das nicht) UND `governance_result` ist NULL —
     beide fielen also in den V1-Fallback → gapCount → nie ein Kategorie-Zuschlag.
  2. Der pro-Canvas-Zuschlag (V2-Erstfassung) griff nur bei Use-Cases, deren Canvas-
     Text die Kategorie zufällig erkannte — unzuverlässig.
  3. Der Report-Subtitle summierte nur `riskBands.count` (klassifizierte) und zeigte
     "0 Use-Cases" trotz 2 vorhandener (behoben in `c752273`).
  **Mit Daniel abgestimmte Neuausrichtung (drei AskUserQuestion-Entscheidungen):**
  (a) Scoring bezieht sich auf die GLOBAL aktivierten Regularien (DSGVO + EU AI Act
  immer, NIS2/ISO/BAIT/... nur per Compliance-Seiten-Toggle, gespeichert als
  `regulation='system'`, `check_type='active_regulations'`, JSON-Liste in `notes`),
  NICHT mehr auf pro-Canvas erkannte Kategorien — vorhersehbar und direkt an
  Nutzeraktion gekoppelt. (b) Use-Cases MIT Canvas fließen auch OHNE Art.-6-Einordnung
  ins Scoring (Basis 0 + globaler Zuschlag), statt als Gap rauszufallen — nur
  canvas-lose Use-Cases fallen noch auf V1. (c) Neuer Report-Block
  „DOKUMENTATIONSSTAND JE REGULIERUNG": ein MeterBar pro aktivierter Regularie
  (Label „DSGVO 9/12", Wert = %) statt des früheren einzelnen EU-AI-Act-Balkens —
  Checklisten-Fortschritt ist jetzt direkt sichtbar.
  **Umbau:** `category-scoring.ts` liefert jetzt `computeRegulationProgress()`
  (Fortschritt je aktivierter Regularie, Kern DSGVO+EU-AI-Act via `DSGVO_CHECKLIST`/
  `EU_AI_ACT_OBLIGATIONS.high`, Zusätze via `ADDITIONAL_REGULATIONS`) +
  `surchargeFromProgress()` (Σ `(100−pct)×0,3`, jede Regularie gleich gewichtet, global
  auf jeden Use-Case, gedeckelt bei 100). `eu-ai-act-use-case-scoring.ts`:
  `computeEuAiActStatusV2(useCases, globalSurcharge: number)` (Signatur von Map auf
  Zahl geändert), `scoreUseCasesWithProgress()` für den Compliance-Report (lädt
  Fortschritt nur einmal, nutzt ihn für Zuschlag UND Anzeige), `loadEuAiActStatusV2()`
  weiterhin self-contained für die Executive Summary. `MeterBar` um optionales
  `labelWidth`-Prop erweitert (Default 90). Tests umgeschrieben (jetzt 20:
  Regulierungs-Fortschritt inkl. aktivierte-Toggles + Basis-0-Verhalten + Zuschlags-
  Schwellwerte + V1-Fallback).
