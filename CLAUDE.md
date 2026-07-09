# AI Navigator — CLAUDE.md
## Projekt-Konventionen für Claude Code
_Zuletzt inhaltlich gegen Repo + GitHub abgeglichen: 07.07.2026. Diese Datei aktualisiert
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
- **#65 Governance↔UseCase-Verknüpfung + Roadmap-Badges** — Code ist committet (`ed3eb92`,
  heute erweitert um Multi-Use-Case-Auswahl in `975396a`), Issue aber weiterhin OPEN auf
  GitHub (kein "Closes #65" im Commit). Zusätzlich: **funktioniert aktuell nicht**, siehe Bug
  unten (`use_case_portfolios`). Issue korrekterweise offen lassen, bis der Bug behoben UND
  verifiziert ist.
- **#67 Compliance als globale Annahme** — Code committet (`ac6fa63`), Issue weiterhin OPEN
  (kein Closes-Keyword). Funktional wirkt es vollständig umgesetzt (Banner in UseCase +
  Governance + Zusammenfassung) — sollte nach Verifikation geschlossen werden.
- **#68 Executive Summary Priorisierung + Versionsvergleich** — teilweise erledigt
  (`summary-priorities.ts`, Prioritäts-Block in Zusammenfassung), aber laut eigenem
  Ist-Zustand im Issue fehlt die Versions-UI "pro Modul" noch — zu Recht weiterhin OPEN.
- **#71 Joule Use Cases dynamisch nach Archetyp + Canvas** — Code committet (`4234d63`),
  Issue weiterhin OPEN.
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

### Priorisierte Gesamt-Roadmap (Stand 07.07.2026 — gegen Repo + GitHub abgeglichen)
**Status: 0 offene GitHub Issues. Sprint 14 + Sprint 15 vollständig geliefert.**

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

**PRIO 1 — Noch offen (Betrieb & Vertrauen):**
- Rechtstexte (Impressum/Datenschutz/AGB): Routen existieren, Inhalt ist Platzhalter.
  **ZURÜCKGESTELLT:** externer Support nötig (eRecht24/Anwalt). Kein Code-Task.
- Sentry Error-Tracking: `sentry.*.config.ts` vorhanden, Produktions-Aktivierung nicht verifiziert.
- Abo-Lebenszyklus-Kanten (Zahlung fehlgeschlagen, Kündigung, Downgrade-Datenhandling).
- `/trust`-Seite: Route existiert (`src/app/trust`), Inhalt nicht geprüft.

**BEWUSST ZURÜCKGESTELLT:**
- Team-/Mandantenfunktion — bis konkrete Enterprise-Kundenanfrage
- Google OAuth — kein Blocker
- Compliance-Scanner Cron-Job — gestrichen (07.07.2026), manueller Trigger reicht

**Feature-Backlog (für zukünftige Sprints):**
- Compliance-Quellen: Admin kann neue URLs zur Überwachung eintragen (aktuell hardcodiert in `scanner.ts`)
- Canvas-Synonym-Lernvorschläge: nach Canvas-Speichern neue Begriffe als Admin-Vorschlag
- Compliance-Fristen-Timer: Countdown zu Stichtagen in WatchlistCard
- Versions-Diff-Ansicht: Änderungen zwischen zwei gespeicherten Versionen anzeigen
- Externe Sync-Quellen für AI-Katalog (CNCF Landscape, Hugging Face, SAP API Hub) — noch kein konkreter Bedarf
