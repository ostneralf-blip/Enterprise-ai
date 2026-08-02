# Plan: Kennzeichnung KI-generierter Inhalte (Art. 50 EU AI Act)

**Stand:** 02.08.2026 · **Status:** abgestimmt mit Daniel, noch nicht umgesetzt
**Auslöser:** Art. 50 EU AI Act gilt seit dem 02.08.2026.

> **Kein Rechtsrat.** Dieses Dokument fasst eine Recherche zusammen und leitet daraus
> technische Maßnahmen ab. Die rechtliche Bewertung — insbesondere die Einstufung als
> „Anbieter" im Sinne der Verordnung und der finale Wortlaut der Datenschutzerklärung —
> gehört vor dem Scharfschalten anwaltlich geprüft.

---

## 1. Rechtslage (recherchiert am 02.08.2026)

Art. 50 gilt **seit dem 02.08.2026**. Der Digital Omnibus hat die Fristen für Hochrisiko-
Systeme verschoben, die Transparenzpflichten des Art. 50 aber **ausdrücklich ausgenommen**.

| Absatz | Adressat | Pflicht | Relevanz AI Navigator |
|---|---|---|---|
| 50(1) | Anbieter | Nutzer müssen erfahren, dass sie mit einem KI-System interagieren. Ausnahme: offensichtlich für einen verständigen Nutzer | **Faktisch erfüllt** — durchgängige KI-Beschriftung in der UI |
| 50(2) | Anbieter | Maschinenlesbare Kennzeichnung synthetischer Inhalte, **auch Text**. Ausnahme: reine Hilfsfunktion ohne wesentliche Veränderung der Eingabedaten | Schonfrist bis **02.12.2026** (System war vor 02.08.2026 am Markt) |
| 50(4) | Betreiber | Text, der die Öffentlichkeit über Angelegenheiten öffentlichen Interesses informiert. **Ausnahme: menschliche Prüfung + redaktionelle Verantwortung** | Betrifft den **Blog** |
| 50(5) | — | „clear and distinguishable manner **at the latest at the time of the first interaction**", barrierefrei | Schließt eine Kennzeichnung allein in AGB/Datenschutz aus |

**Zwei Befunde, die den Aufwand klein halten:**

- Der **Code of Practice on Transparency of AI-Generated Content** (Kommission + AI Office,
  10.06.2026) fokussiert Bild, Audio und Video. Für **Text schreibt er keine** Wasserzeichen-,
  C2PA- oder sonstige Markierungstechnik vor — dort stehen sichtbare Labels im Vordergrund.
  Da AI Navigator keine Bilder oder Videos generiert, entfällt der technisch aufwendige Teil.
- Die **Kommissions-Leitlinien** (angenommen 20.07.2026) verlangen jedoch visuelle Prominenz
  und Platzierung **in der Oberfläche**. Ein Hinweis nur in AGB oder Datenschutzerklärung
  genügt nicht. Die Ausgangsfrage „reicht ein Vermerk in AGB/Datenschutz?" ist damit
  beantwortet: **nein** — aber die Oberfläche leistet das Nötige bereits größtenteils.

Die EU hat am 10.06.2026 drei offizielle Icons zur Kennzeichnung veröffentlicht. Deren
Nutzung ist **optional**, die Kennzeichnung selbst nicht. Entscheidung: **kein EU-Icon**,
um das MERIDIAN-Layout nicht mit einem fremden Gestaltungselement zu brechen.

### Quellen
- Art. 50 Volltext: https://artificialintelligenceact.eu/article/50/
- Kommission, Quick Facts Transparenzregeln: https://digital-strategy.ec.europa.eu/en/factpages/quick-facts-transparency-rules-ai-systems
- EU-Icons: https://digital-strategy.ec.europa.eu/en/policies/eu-icons-labelling-ai-generated-content
- Code of Practice, Einordnung für Text: https://compliancehub.wiki/eu-ai-act-marking-labelling-code-of-practice-article-50-2026/
- Digital Omnibus betrifft Art. 50 nicht: https://talmeier.de/blog/2026/07/09/die-anforderung-des-art-50-eu-ai-act-gelten-unveraendert-ab-august-verschoben-wurde-eine-andere-frist/

---

## 2. Ist-Aufnahme im Code (02.08.2026)

**Bereits gekennzeichnet — kein Handlungsbedarf:**
- UI durchgängig: `badgeGenerated: "KI-generiert"`, `narrativeTitle: "KI-Einordnung"`,
  `aiSuggestionBadge: "KI-Vorschlag"`, ◆-Herkunftsmarker, `investmentEstimateNote`
  („Grobe KI-Schätzung … keine belastbare Kalkulation")
- PDF-Block `KI-EINORDNUNG` via `AiCalloutBlock` mit Badge `badgeGenerated`
- AGB nennen die „automatisiert erzeugte Einordnung" bereits als Haftungsausschluss
- **Share-Ansicht** (`share/[token]`) enthält **keinen** KI-Text → keine Lücke

**Lücken:**

| # | Lücke | Datei | Schwere |
|---|---|---|---|
| L1 | `EMPFEHLUNG` (`decisionRecommendation`) im PDF ohne KI-Hinweis — stammt laut Code-Kommentar aus derselben Narrativ-Generierung | `lib/pdf/meridian/reports/architecture-status.tsx:180` | hoch (PDF verlässt die App) |
| L2 | `INVESTITIONSRAHMEN` (Kennzahl-Karten) ohne KI-Badge; nur die Fußnote nennt „KI-Schätzung" | ebd. `:142` | mittel |
| L3 | Keine maschinenlesbare Markierung in den PDF-Metadaten | `lib/pdf/meridian/reports/*` | mittel (Frist 02.12.2026) |
| L4 | Blog: KI-entworfener Text, öffentlich publiziert | `config/blog-data.ts` | hoch (bereits live) |
| L5 | **Datenschutzerklärung nennt KI-Verarbeitung und AWS Bedrock nirgends** | `app/[locale]/datenschutz/page.tsx` | **hoch — DSGVO, nicht AI Act** |

L5 ist der schwerwiegendste Punkt und hat mit Art. 50 nichts zu tun: Nutzereingaben gehen
an AWS Bedrock, ohne dass die Datenschutzerklärung den Empfänger, den Zweck oder die
Rechtsgrundlage nennt (Art. 13 DSGVO).

---

## 3. Abgestimmte Maßnahmen

### M1 — Blog: redaktionelle Verantwortung + dezenter Hinweis — ✅ UMGESETZT (02.08.2026)

Umgesetzt als vollständiges Redaktions-Dashboard statt als Feld in der Content-Datei
(Anforderung Daniel): Beiträge liegen jetzt in der Datenbank und werden im Admin-Panel
unter „Blog" angelegt, bearbeitet, geprüft, freigegeben und deaktiviert.

- Migrationen `20260802123609_blog_posts_schema` (Schema + RLS) und
  `20260802123753_blog_posts_seed_first_post` (Bestandsbeitrag als `in_review`)
- `src/lib/blog-status.ts` — Freigaberegeln als reine, testbare Logik
- `src/lib/blog.ts` — öffentlicher Lesepfad über `createPublicClient` (cookielos → die
  Seiten bleiben statisch; RLS filtert Entwürfe serverseitig)
- `src/app/api/admin/blog/route.ts` — CRUD + Statuswechsel, `revalidatePath` nach jeder
  Änderung, damit eine Freigabe sofort sichtbar wird
- `src/app/[locale]/(dashboard)/admin/BlogPanel.tsx` — Dashboard mit Statusanzeige
- `src/config/blog-data.ts` entfällt

**Nachweisführung:** „Veröffentlicht" ist ohne Prüfernamen und Prüfzeitpunkt nicht
erreichbar — abgesichert per CHECK-Constraint in der Datenbank, nicht nur in der API.
Der Transparenzhinweis im Autorenkasten erscheint automatisch bei `ai_assisted` + Freigabe.

**Bewusst nicht enthalten** (Entscheidung Daniel): kein separates Änderungsprotokoll. Eine
spätere Freigabe überschreibt den vorherigen Vermerk; eine lückenlose Historie entsteht
dadurch nicht. Additiv nachrüstbar, ohne das Schema zu ändern.

#### Ursprünglicher Entwurf (zur Nachvollziehbarkeit)
Die gesetzliche Ausnahme in Art. 50(4) greift, wenn der Text eine **echte** menschliche
Prüfung durchlaufen hat und eine benannte Person die redaktionelle Verantwortung trägt.
Oberflächliche Freigaben genügen ausdrücklich nicht.

- `blog-data.ts`: Felder `aiAssisted: boolean` und `reviewedBy: string | null` je Beitrag,
  plus `reviewedAt` (ISO-Datum). Ein Beitrag ohne `reviewedBy` gilt als **nicht
  veröffentlichungsreif**.
- Beitragsseite: dezente Zeile im Autorenkasten, nicht im Beitragskopf — „KI-unterstützt
  entworfen, redaktionell geprüft von Daniel Ostner am …". Bilingual über `messages/*.json`.
- Unit-Test: kein Beitrag mit `aiAssisted: true` ohne gesetztes `reviewedBy`/`reviewedAt`.
- **Sofort:** Der bereits live stehende Beitrag `ki-governance-betriebsmodelle` ist bis zu
  deiner Durchsicht formal ungeprüft. Entweder zeitnah lesen und freigeben oder
  vorübergehend depublizieren.

### M2 — PDF-Export: fehlende Blöcke, Fußnote, Metadaten
- `EMPFEHLUNG` und `INVESTITIONSRAHMEN` erhalten denselben `badgeGenerated`-Badge wie der
  bestehende `AiCalloutBlock` — gleiche Komponente, kein neues Gestaltungselement.
- Einmalige Fußzeile auf jeder Seite, die KI-Inhalte trägt: „Enthält KI-generierte
  Abschnitte (gekennzeichnet). Modell und Erstellungsdatum siehe Anhang." Bewusst **eine**
  Zeile pro Seite statt eines Labels pro Absatz — sonst kippt die Lesbarkeit des Reports.
- Maschinenlesbare Markierung über die `<Document>`-Props von react-pdf
  (`keywords`, `creator`, `producer`, `subject`) mit einem eindeutigen Marker wie
  `ai-generated-content=partial; generator=AI Navigator; model=<modelId>`. Deckt 50(2)
  vor Ablauf der Schonfrist am 02.12.2026 ab, ohne sichtbare Layoutänderung.
- Betrifft nur Reports, die tatsächlich KI-Text führen (aktuell `architecture-status`,
  `executive-summary`, `full-report`). Die rein regelbasierten Reports bleiben unberührt.

### M3 — Datenschutzerklärung: Entwurf für anwaltliche Prüfung
Ich formuliere einen Abschnitt auf Basis dessen, was im Code tatsächlich passiert.
Zu klären und im Entwurf abzudecken:
- Zweck (KI-gestützte Einordnung, Vorschläge, Textgenerierung)
- Empfänger: **AWS Bedrock**, Region aus `lib/ai/client.ts` (`REGION`) — muss EU sein,
  vor Veröffentlichung des Texts gegen die reale Konfiguration verifizieren
- Rechtsgrundlage (Vertragserfüllung Art. 6 Abs. 1 lit. b vs. berechtigtes Interesse lit. f)
- Keine Nutzung der Eingaben zum Modelltraining — **muss gegen die AWS-Vertragslage
  belegt werden**, nicht behaupten
- Prompt-Cache (`ai_prompt_cache`) und dessen Aufbewahrungsdauer
- Hinweis auf die Zweckbindung nach Art. 50 AI Act
Der Entwurf geht als Vorschlag an dich; der finale Text ist Stufe 3 (Rücksprache/Anwalt)
laut CLAUDE.md.

### M4 — Regelwerk
Neue verbindliche Regel in CLAUDE.md (siehe Abschnitt „KI-Kennzeichnungspflicht"), damit
jede künftige KI-Funktion die Kennzeichnung von Anfang an mitbringt und nicht nachträglich
gesucht werden muss.

---

## 4. Bewusst NICHT vorgesehen

- **Kein Label an jedem KI-Absatz in der App.** Die bestehenden Badges erfüllen 50(1)/(5);
  zusätzliche Hinweise würden die Oberfläche zumüllen, ohne die Rechtslage zu verbessern.
- **Keine Wasserzeichen im Text.** Für Text nicht gefordert; der Code of Practice adressiert
  Wasserzeichen für Bild/Audio/Video.
- **Kein EU-Icon.** Optional; bricht das MERIDIAN-Layout.
- **Keine Kennzeichnung der regelbasierten Ergebnisse.** Assessment-Score, Scoring-Matrix,
  Compliance-Checklisten und der Art.-6-Klassifikator (`lib/eu-ai-act/classifier.ts`) sind
  **deterministisch, kein LLM** — sie fallen nicht unter Art. 50 und dürfen nicht
  fälschlich als KI-generiert markiert werden.

---

## 5. Reihenfolge und Fristen

| Priorität | Maßnahme | Frist |
|---|---|---|
| 1 | M3 Datenschutz-Entwurf (DSGVO-Lücke, bußgeldbewehrt, betrifft alle Nutzer) | sofort |
| 2 | M1 Blog — Review des bereits live stehenden Beitrags | sofort |
| 3 | M4 Regelwerk | mit der Umsetzung |
| 4 | M2 PDF sichtbare Kennzeichnung (L1/L2) | zeitnah |
| 5 | M2 PDF Metadaten (L3) | **vor 02.12.2026** (Ende der Schonfrist) |

## 6. Anhang: Entwurf Datenschutz-Abschnitt (M3)

> **Entwurf, kein fertiger Rechtstext.** Vor Veröffentlichung anwaltlich prüfen lassen. Die
> mit ⚠ markierten Stellen müssen zuvor gegen die reale Konfiguration und die AWS-Vertragslage
> verifiziert werden — sie dürfen nicht auf Annahme veröffentlicht werden.

### ⚠ Vorab zu klären: Verlassen Daten die EU?

`src/lib/ai/client.ts` kennt zwei Pfade:
- **Regelfall:** AWS Bedrock, Region aus `BEDROCK_REGION` (Default `eu-west-1`, Irland).
- **Fallback:** direkter Aufruf der Anthropic-API (`ANTHROPIC_API_KEY`), aktivierbar über die
  Env-Variable `ALLOW_NON_EU_AI_FALLBACK` **oder** einen Admin-Toggle in der Datenbank
  (`getFallbackEnabled()`). Dieser Pfad führt aus der EU heraus.

`ALLOW_NON_EU_AI_FALLBACK` **ist in der Vercel-Production gesetzt** (Wert verschlüsselt, nicht
auslesbar). Der Code protokolliert eine Sentry-Meldung, wenn der Fallback in Production greift.

**Vor dem Formulieren des Texts zu beantworten:**
1. Steht `ALLOW_NON_EU_AI_FALLBACK` in Production auf `true` oder `false`?
2. Ist der Admin-Toggle aktuell aktiv?
3. Falls einer von beiden aktiv ist: Es liegt eine Drittlandsübermittlung vor. Dann braucht es
   ein Transfer-Instrument (Standardvertragsklauseln/DPF-Zertifizierung von Anthropic) **und**
   der Datenschutztext muss das offenlegen. Zudem kollidiert es mit der Regel „NIEMALS
   User-Daten außerhalb EU" in CLAUDE.md — die Regel gilt entweder, oder sie braucht eine
   dokumentierte, begründete Ausnahme.

Der folgende Entwurf ist für den **EU-only-Fall** formuliert.

---

### Entwurf (DE)

**KI-gestützte Auswertungen**

Einzelne Funktionen des AI Navigator nutzen ein KI-Sprachmodell, um Ihre Eingaben auszuwerten —
etwa die Einordnung Ihrer Architektur, Vorschläge für Komponenten und Verantwortlichkeiten oder
die Anreicherung Ihres Use-Case-Canvas. Diese Funktionen sind in der Oberfläche jeweils als
KI-gestützt gekennzeichnet und werden nur auf Ihre ausdrückliche Aktion hin ausgeführt.

*Verarbeitete Daten:* Übermittelt werden ausschließlich die Inhalte, die Sie im jeweiligen Modul
erfasst haben (z. B. Beschreibung des Use Cases, ausgewählte Komponenten, Assessment-Antworten),
sowie technische Angaben zum Auftrag. Es werden keine Kontaktdaten und keine Zahlungsdaten
übermittelt.

*Empfänger:* ⚠ Amazon Web Services EMEA SARL, als Auftragsverarbeiter über den Dienst „Amazon
Bedrock" in der Region Europa (Irland). Eine Übermittlung in ein Drittland findet nicht statt.

*Zweck und Rechtsgrundlage:* Erbringung der von Ihnen abgerufenen Auswertungsfunktion und damit
Erfüllung des Nutzungsvertrags, Art. 6 Abs. 1 lit. b DSGVO.

*Keine Nutzung zum Modelltraining:* ⚠ Ihre Eingaben werden nicht zum Training von KI-Modellen
verwendet. — *Diese Aussage muss vor Veröffentlichung gegen die AWS-Bedrock-Vertragslage belegt
werden. Ohne Beleg streichen.*

*Speicherdauer:* Ergebnisse werden Ihrem Konto zugeordnet gespeichert, bis Sie sie löschen oder
Ihr Konto auflösen. Zur Vermeidung wiederholter identischer Anfragen wird die Antwort zusätzlich
für 24 Stunden zwischengespeichert (`ai_prompt_cache`); der Zwischenspeicher enthält keine
Zuordnung zu Ihrer Person und läuft automatisch ab.

*Automatisierte Entscheidungen:* Die Ergebnisse sind Vorschläge zur Vorbereitung Ihrer eigenen
Entscheidung. Eine automatisierte Entscheidung im Sinne des Art. 22 DSGVO findet nicht statt.

**Zu ergänzen:** Englische Fassung parallel (`messages`-Konvention bzw. der Aufbau der
bestehenden Rechtstextseiten), sowie eine kurze Erwähnung der Kennzeichnung nach Art. 50 EU AI
Act mit Verweis auf die Kennzeichnung in der Oberfläche.

---

## 7. Verifikation

- Unit-Test: kein `aiAssisted`-Beitrag ohne `reviewedBy`/`reviewedAt`
- Integrationstest: erzeugtes PDF enthält den Metadaten-Marker und, sofern KI-Text
  vorhanden, die Fußzeile
- Realer Render-Check (nicht nur Jest-Mock) — siehe die Font-Lektion in CLAUDE.md
- Sichtprüfung eines Architektur-Reports mit und ohne KI-Einordnung
