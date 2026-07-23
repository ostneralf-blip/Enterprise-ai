# Sprintplan: Compliance-Content-DB-Migration (Sprints 38–41)

_Erstellt 23.07.2026. Quelle: 12 GitHub-Issues #243–#254 (alle von Daniel, 23.07.), abgeleitet
aus dem Fact-Check-Report vom 08.07.2026 und dem dort abgestimmten Migrationsplan._

## Warum

Der manuelle Fact-Check vom 08.07.2026 fand **3 Sachfehler** in `src/config/compliance-data.ts`
(falsche EU-AI-Act-Artikel-/Anhang-Zuordnungen), die unbemerkt blieben — obwohl `lastVerified`
im Code stand. Grund: Compliance-Inhalte sind **statische TS-Config**, nicht admin-editierbar
und nicht faktengeprüft wie Katalog/`content_library`. Zusätzlich fehlen bei den 5
`ADDITIONAL_REGULATIONS` (NIS2, LkSG, ISO 42001, ISO 27001, BAIT) die Referenzfelder komplett,
BDSG fehlt ganz, und zwei Scanner-Quellen synchronisieren still nie.

**Zielbild:** Compliance-Inhalte in die DB (analog `content_library`, locale-per-row),
admin-verwaltbar, mit sichtbarem Rechtsstand und einem wiederkehrenden Fakten-Abgleich.

## Abhängigkeitsgraph

```
#243 Schema ──┬─► #244 Seed+Fixes ──┬─► #245 Admin-CRUD ──┬─► #252 BDSG ──► #253 Querverweise
 (prio-1,     │   (prio-1)          │   (prio-2)          ├─► #254 Refs NIS2/LkSG/ISO/BAIT
  Stufe 3)    │                     └─► #246 DB-Fetch ──► #247 Rechtsstand-UI (prio-3)
              │                         (prio-2)
              └─► #249 Drafts-Schema (prio-2, Stufe 3) ──┐
#248 Scanner-Fix (prio-1, Bug, unabhängig) ─────────────┼─► #250 Deep-Check ──► #251 Review-UI
                                                          ┘   (prio-2)            (prio-2)
```

## ⚠️ Gates VOR Sprintstart (CLAUDE.md Stufe 3 — Rücksprache Daniel)

Diese Punkte sind Schema-/Entscheidungs-Gates und werden **vor** dem jeweiligen Bau geklärt,
nicht während:

- **#243 (Stufe 3, `needs-decision`):** Spaltenschnitt der zwei Tabellen freigeben (Vorschlag
  im Issue). Entscheidung „volle DB-Migration statt TS-Config" ist laut Issue schon getroffen
  (08.07.), aber der konkrete Schema-Freeze braucht ein explizites Go.
- **#249 (Stufe 3, `needs-decision`):** finale `status_estimate`-Wertenamen für den Fakten-Abgleich
  (Vorschlag `bestaetigt` / `korrektur_vorgeschlagen`) mit Daniel festlegen.
- **#250 Cron-Mechanik:** Es gibt aktuell **keine** Cron-Infrastruktur (keine `vercel.json`-Crons,
  kein pg_cron). Zudem wurde am 07.07.2026 in CLAUDE.md „Compliance-Scanner Cron-Job — gestrichen,
  manueller Trigger reicht" notiert. Der neue quartalsweise **Deep-Check** (Fakten-Abgleich der
  Artikel-Referenzen) ist etwas anderes als der alte Change-Scanner — vor Bau entscheiden:
  Vercel Cron vs. Supabase pg_cron vs. manueller Admin-Trigger. Empfehlung: **manueller
  Admin-Trigger zuerst** (quartalsweise Erinnerung), Automatisierung später — konsistent mit der
  07.07.-Entscheidung und ohne neue Infra.

---

## Sprint 38 — DB-Fundament + Scanner-Bug (Phase 1a)

**Thema:** Das Datenschema anlegen, Bestandsdaten sauber (inkl. der 3 Fixes) migrieren, und
parallel den still versagenden Scanner reparieren. Entsperrt den gesamten Rest.

**Umfang:**
- **#243** (prio-1, Stufe 3): Migration `compliance_regulations` + `compliance_checklist_items`
  (locale-per-row, RLS analog `content_library`: `authenticated_read` nur published/Admin,
  `admin_all`). Workflow `supabase migration new` + `db push` + `migration list`-Verifikation.
  Test-Gate: RLS-Test (Nicht-Admin sieht nur published) + Security-Test (Schreiben nur Admin).
- **#244** (prio-1): Seed-Migration der Bestandsdaten aus `compliance-data.ts` (DSGVO,
  EU AI Act je Risikoklasse, die 5 ADDITIONAL_REGULATIONS) **mit den 3 Korrekturen beim Import**:
  `euaiact_art46` → Art. 48, Deepfake `Art. 50 Abs. 3` → `Abs. 4`, „Medizinische Diagnose" von
  Anhang III Nr. 6 lösen → Art. 6 Abs. 1 + Anhang I (MDR). Akzeptanz: Anzahl-Stichprobe je
  Regulierung, Korrekturen im Seed sichtbar, article/source_url/last_verified für DSGVO+EU-AI-Act
  vollständig.
- **#248** (prio-1, Bug, **unabhängig — kann sofort parallel laufen**): Scanner-Quellen fixen.
  EUR-Lex-Hänger + AI-Act-Service-Desk (Salesforce-SPA) — scraping-freundliche Alternative
  (Cellar/ELI-Endpoint) prüfen bzw. Quelle streichen/ersetzen; **fehlgeschlagene Scans im
  Admin-UI sichtbar machen** („Quelle X seit N Tagen nicht erreichbar"). Test: manueller
  Abruf aller aktiven Quellen dokumentiert.

**Gates:** #243-Schema-Freigabe (Stufe 3) vor Start. DB-Workflow (nie SQL-Editor). Migration
auf Prod anwenden + `migration list` gegenprüfen. Obsidian-Datenbankstruktur nachziehen.

**Exit:** Beide Tabellen live + geseedet (inkl. Fixes); Scanner ruft alle aktiven Quellen
erfolgreich ab bzw. meldet Ausfälle sichtbar. #243/#244/#248 `Closes`.

---

## Sprint 39 — Admin-Verwaltung + Frontend-Umstellung (Phase 1b)

**Thema:** Compliance-Inhalte ohne Deploy pflegbar machen und das Modul/PDF von der TS-Config
auf DB-Fetch umstellen — inkl. sichtbarem Rechtsstand.

**Umfang:**
- **#245** (prio-2): Admin-Tab „Compliance-Regulierungen" (Vorlage: bestehender Katalog-CRUD).
  Liste + Editor je Regulierung (Stammdaten + Checklistenpunkte inkl. article/source_url/
  last_verified/category/display_order), neue Regulierung anlegbar (für BDSG), `is_published`-Toggle
  je Regulierung UND je Item. Test-Gate: nur Admin, Zod (source_url = valide URL, last_verified = Datum).
- **#246** (prio-2): Die **5 Importstellen** von DB-Fetch versorgen (grep-verifiziert):
  `compliance/CompliancePageClient.tsx`, `api/compliance/route.ts`, `lib/pdf/templates.tsx`,
  `lib/pdf/meridian/data/compliance-status.ts`, `lib/compliance/category-scoring.ts`
  (⚠️ letzteres speist das V2-Use-Case-Scoring — Vorher/Nachher-Gleichheit besonders prüfen).
  Nur `is_published`-Daten für Nicht-Admins. **Vorab klären:** ob `POLICY_TEMPLATES` +
  `REGULATORY_WATCHLIST` mitmigrieren (Vorschlag: NICHT, eigenes Ticket). Test-Gate:
  bestehende Unit-/Security-Tests bleiben grün + manueller Vorher/Nachher-Vergleich UI + PDF.
- **#247** (prio-3): Rechtsstand sichtbar — je Checklistenpunkt article + Link auf source_url +
  „zuletzt geprüft: TT.MM.JJJJ"; global ein Banner „Rechtsstand zuletzt geprüft am [jüngstes
  last_verified]". Vorab prüfen, ob article/source_url heute schon gerendert werden (falls
  nicht, gehört das Rendern mit hierher). Test-Gate: jest-axe für den source_url-Link.

**Gates:** i18n DE (Sie-Form) + EN. Security-Tests (Admin-only). Keine Regression im
V2-Scoring (Sprint-37/#222-Nachbarschaft). Screenshot-Abnahme Admin-Tab + Compliance-Modul.

**Exit:** Compliance-Inhalte kommen live aus der DB, sind im Admin editierbar, Rechtsstand
sichtbar. #245/#246/#247 `Closes`.

---

## Sprint 40 — Content-Anreicherung (Phase 2)

**Thema:** Inhaltliche Lücken schließen — jetzt ohne Deploy über die Admin-UI (bzw. Seed).
Reiner Content, kein neues Schema.

**Umfang:**
- **#254** (prio-2): Für alle **39** Checklistenpunkte der 5 ADDITIONAL_REGULATIONS
  `article` (bzw. Clause/Kapitel-Nr. bei Standards) + `source_url` + `last_verified` nachtragen
  (NIS2/BSIG, LkSG §§3–10, ISO 42001/27001 Clauses, BAIT Tz.). Gegen Primärquelle prüfen vor
  `is_published`.
- **#252** (prio-2): BDSG als neue Regulierung (`category: gesetz`) mit §§ 26/22/31/38 BDSG,
  von Anfang an im vollen Muster (article/source_url/last_verified), Einordnungssatz „konkretisiert
  DSGVO-Öffnungsklauseln, Art. 88 DSGVO". Primärquelle gesetze-im-internet.de/bdsg_2018.
  Watchlist-Eintrag `bdsg_dsb_threshold` bleibt bestehen.
- **#253** (prio-3, nach #252): Querverweise DSGVO↔BDSG bei passenden Punkten (mind.
  `dsgvo_art9` → § 22 BDSG; ggf. `dsgvo_art6` → § 26). Kurzer Verweis/Link, kein Duplikat.

**Gates:** Inhalte gegen Primärquellen gegengeprüft vor `is_published`. i18n DE+EN.
Fachliche Korrektheit — bei Unsicherheit an Daniel.

**Exit:** Keine Referenzfeld-Lücken mehr in den 5 Zusatzregularien; BDSG als vollwertige
Regulierung inkl. DSGVO-Querverweisen. #252/#253/#254 `Closes`.

---

## Sprint 41 — Aktualität automatisieren: Scheduled Deep-Check (Phase 3)

**Thema:** Das manuelle Fact-Check-Verfahren als wiederkehrenden, admin-freigegebenen
Fakten-Abgleich verankern, damit falsche Referenzen künftig auffallen statt still zu bleiben.

**Umfang:**
- **#249** (prio-2, Stufe 3): `compliance_source_drafts` erweitern — `checklist_item_id`
  (NULL für alte Change-Drafts), `status_estimate`-CHECK um Fakten-Abgleich-Werte
  (`bestaetigt`/`korrektur_vorgeschlagen`, Namen final mit Daniel), `suggested_value` TEXT NULL.
- **#250** (prio-2, Voraussetzung #243/#248/#249): Deep-Check — je Checklistenpunkt mit
  article+source_url prüft LLM+Websuche die Referenz gegen die Primärquelle; Ergebnis als
  Draft (`checklist_item_id`, status, suggested_value). **Kein Auto-Publish.** Mechanik:
  zunächst manueller Admin-Trigger (s. Gate oben), quartalsweise Erinnerung. Test-Gate:
  Testlauf gegen Teilmenge (nur DSGVO) vor Vollrollout + LLM-Kosten grob abschätzen.
- **#251** (prio-2, Voraussetzung #249/#250): Review-UI im Compliance-Scanner-Admin-Panel —
  Deep-Check-Drafts von News-Change-Drafts unterscheidbar; je Draft betroffener Punkt,
  Ist-Wert vs. suggested_value, Quelle; Freigabe schreibt in `compliance_checklist_items`
  (+ `last_verified` = Scan-Datum), Ablehnen setzt `review_status='ignoriert'`. Test-Gate:
  Security (Freigabe nur Admin) + manueller Schreib-/last_verified-Test.

**Gates:** #249-Wertenamen (Stufe 3) + #250-Cron-Entscheidung vor Start. #248 muss erledigt
sein (funktionierende Primärquellen). LLM-Kostentracking.

**Exit:** Quartalsweiser Fakten-Abgleich läuft (mind. manuell auslösbar), Ergebnisse gehen
durch Admin-Review in die Live-Daten. #249/#250/#251 `Closes` — Gesamtplan abgeschlossen.

---

## Kompakt-Übersicht

| Sprint | Thema | Issues | Prio | Voraussetzung | Stufe-3-Gate |
|---|---|---|---|---|---|
| 38 | DB-Fundament + Scanner-Bug | #243, #244, #248 | 1 | — | #243 Schema |
| 39 | Admin-CRUD + DB-Fetch + Rechtsstand | #245, #246, #247 | 2/3 | S38 | — |
| 40 | Content-Anreicherung | #254, #252, #253 | 2/3 | S39 (#245) | — |
| 41 | Scheduled Deep-Check | #249, #250, #251 | 2 | S38 (#243/#248) | #249 Werte, #250 Cron |

**Reihenfolge-Empfehlung:** 38 → 39 → {40 ‖ 41 parallelisierbar}. Sprint 40 (Content) und
Sprint 41 (Deep-Check) hängen beide nur an Phase 1 und können danach unabhängig laufen; #248
kann bereits in Sprint 38 parallel zur DB-Arbeit erledigt werden (unabhängiger Bug).

**Querschnitt-Gates (alle Sprints):** DB-Workflow (`migration new`+`db push`+`list`), i18n
DE Sie-Form + EN, Test-Gate (Unit + Security + a11y), Obsidian-Vault nach finalem Push,
`Closes #N` in Commits, Screenshot-Abnahme bei UI-Änderungen (Admin-Tab, Compliance-Modul).
