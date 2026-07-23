# AI Navigator — Design-System & Übergabe an Claude Code

**Zweck dieses Dokuments:** Diese Datei beschreibt das verbindliche, mobile-first Design-System für AI Navigator, das die wiederkehrenden Responsive-Bugs strukturell verhindern soll. Sie ist als direkte Arbeitsgrundlage für Claude Code gedacht — nicht als Inspiration, sondern als Regelwerk, das bei jeder neuen Komponente angewendet wird.

**Kontext:** In den letzten Test-Sessions traten wiederholt dieselbe Fehlerklasse auf — Text läuft über Boxränder, Schriftgrößen sind inkonsistent, Buttons haben unterschiedliche Höhen, Layouts brechen auf Mobile. Ursache: Komponenten wurden Desktop-first gebaut und nachträglich auf Mobile gepatcht, ohne feste Tokens für Typografie, Spacing und Breakpoints. Dieses Dokument behebt das systemisch.

---

## 1. Grundprinzip: Mobile-First, nicht Desktop-First-mit-Patches

**Falsch (bisheriges Muster):**
```tsx
<div className="text-lg p-8 flex items-center gap-8">
```
Funktioniert auf Desktop, bricht auf Mobile, wird nachträglich mit `sm:`-Overrides gepatcht.

**Richtig (Zielzustand):**
```tsx
<div className="text-sm p-4 sm:text-lg sm:p-8 flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-4 sm:gap-8 min-w-0">
```
Basis-Klassen gelten für die kleinste Breite (Mobile). `sm:`/`md:`/`lg:`-Varianten fügen für größere Screens *hinzu*, sie korrigieren nicht nachträglich.

**Regel:** Jede neue Komponente wird zuerst bei 375px Breite entworfen und verifiziert, danach erst für Desktop erweitert. Niemals umgekehrt.

---

## 2. Verbindliche Typografie-Skala

Nur diese Klassen verwenden — kein freies Mischen von Schriftgrößen innerhalb vergleichbarer Elemente:

| Verwendung | Mobile | Desktop (`sm:`) | Beispiel |
|---|---|---|---|
| Seitentitel (h1) | `text-xl` | `sm:text-2xl` | "Guten Tag", "AI-Readiness Assessment" |
| Sektionstitel (h2) | `text-base` | `sm:text-lg` | "Ergebnis nach Dimension" |
| Fließtext / Body | `text-sm` | `text-sm` (ändert sich nicht) | Beschreibungen, Fragetexte |
| Kleingedrucktes / Meta | `text-xs` | `text-xs` (ändert sich nicht) | Labels, Zeitangaben, Badges |
| Große Zahlen (Score-Anzeigen) | `text-3xl` | `sm:text-4xl` oder `sm:text-5xl` | Assessment-Score |

**Regel:** Body- und Meta-Text ändern sich zwischen Mobile/Desktop NICHT — das verhindert das "unterschiedliche Schriftgrößen, die nicht zu Boxen passen"-Problem, weil der Großteil des Textes auf allen Geräten gleich groß bleibt. Nur Überschriften und große Zahlen skalieren.

---

## 3. Verbindliche Spacing-Skala

| Verwendung | Mobile | Desktop (`sm:`) |
|---|---|---|
| Innenabstand große Karten/Boxen | `p-4` | `sm:p-6` oder `sm:p-8` |
| Innenabstand Buttons | `px-4 py-2.5` | unverändert |
| Abstand zwischen Elementen (vertikal) | `space-y-3` | `sm:space-y-4` |
| Abstand zwischen Elementen (horizontal, flex gap) | `gap-2` | `sm:gap-4` |

**Regel:** Padding/Gap-Werte verdoppeln sich höchstens von Mobile zu Desktop, nie mehr. `p-8` auf Mobile ist grundsätzlich verboten (zu viel Platzverlust bei 375px Breite).

---

## 4. Pflicht-Klassen für jeden Container mit dynamischem Text

Jeder Flex- oder Grid-Container, der einen Text-Knoten unbekannter Länge enthält (Namen, Firmennamen, Labels, Übersetzungen), MUSS folgende Absicherung haben:

```tsx
// Eltern-Container, der schrumpfen darf:
<div className="flex-1 min-w-0">
  {/* Text-Kind: */}
  <span className="truncate">{dynamicText}</span>
  {/* ODER, wenn Umbruch gewünscht statt Abschneiden: */}
  <span className="break-words">{dynamicText}</span>
</div>
```

**Regel:** `min-w-0` ist in einem Flex-Layout zwingend auf jedem Element, das schrumpfen soll — ohne das ignoriert Flexbox per Default die `overflow`-Eigenschaft der Kinder. Das war die Ursache mehrerer der gemeldeten Bugs.

**Entscheidung Truncate vs. Wrap:** Für kurze UI-Labels (Sidebar-Einträge, Badges) → `truncate`. Für inhaltstragende Begriffe, die der Nutzer vollständig lesen muss (Dimension-Namen im Assessment, Firmenname im Header) → `break-words`, niemals abschneiden.

---

## 5. Button- und Eingabefeld-Konsistenz

Alle Buttons gleicher Funktionsebene (z. B. alle Primary-Actions) teilen sich exakt dieselben Höhen- und Padding-Klassen. Kein Button bekommt individuelle Werte.

```tsx
// Primary Button — IMMER diese Basis-Klasse, Farbe variiert, Größe nicht:
const buttonBase = "px-5 py-2.5 rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"

// Beispiel-Anwendung:
<button className={`${buttonBase} bg-blue-600 text-white hover:bg-blue-500`}>Speichern</button>
<button className={`${buttonBase} border border-slate-300 text-slate-700`}>Abbrechen</button>
```

**Regel:** Eine gemeinsame Konstante oder Utility-Funktion (`buttonBase`, `cn(buttonBase, variant)`) statt wiederholter Inline-Klassen — das verhindert das gemeldete "Feedback-Button unterschiedlich groß"-Problem strukturell, weil es keine zweite Quelle für Button-Maße mehr gibt.

---

## 6. Bekannte, noch offene Bugs (Stand 20. Juni 2026) — für Claude Code zu beheben

| # | Bug | Vermutete Ursache | Modul |
|---|---|---|---|
| 1 | Login-Screen "nicht passend" auf Mobile | Vermutlich feste Breiten/Paddings im `(auth)/layout.tsx`, kein Mobile-Test bisher durchgeführt | `src/app/(auth)/layout.tsx`, `LoginForm.tsx` |
| 2 | Name/Firma im Header nicht sichtbar | `hidden sm:inline` auf Firmenname in `TopBar.tsx` — auf Mobile bewusst versteckt, aber Daniel erwartet es trotzdem sichtbar | `TopBar.tsx` |
| 3 | Assessment-Gewichtungsboxen (Intro-Screen, 6 Dimensionen) passen nicht | Wahrscheinlich `grid-cols-2` ohne Mobile-Anpassung in `AssessmentIntro` | `AssessmentWizard.tsx` |
| 4 | Unterschiedliche Schriftgrößen in den Fragen, passen nicht zu Boxen | Fehlende einheitliche Typo-Skala (siehe Abschnitt 2 oben) | `AssessmentWizard.tsx` |
| 5 | "Zurück"-Button funktioniert nicht | Nicht reproduziert/diagnostiziert — braucht Untersuchung, evtl. State-Bug nicht Styling-Bug | `AssessmentWizard.tsx` |
| 6 | Feedback-Button unterschiedlich groß | Keine gemeinsame Button-Basisklasse (siehe Abschnitt 5) | `FeedbackWidget.tsx` |

**Empfehlung an Claude Code:** Bugs 3, 4, 6 sind direkte Konsequenzen der fehlenden Skalen aus Abschnitt 2/5 — beim Neuaufbau von `AssessmentWizard.tsx` mit den festen Tokens lösen sich diese vermutlich automatisch mit. Bug 5 (Zurück-Button) ist wahrscheinlich ein Logikfehler, kein Style-Fehler — separat debuggen, nicht nur stylen.

---

## 7. Verifikations-Protokoll für jede neue/überarbeitete Komponente

Bevor eine Komponente als "fertig" gilt, MUSS sie bei diesen drei Breiten geprüft werden (Browser-DevTools Device-Toolbar):

1. **375px** (iPhone SE — kleinster gängiger Referenzwert)
2. **768px** (Tablet)
3. **1440px** (Desktop)

Zusätzlich: Browser-Zoom auf 200% bei 375px testen (WCAG-Anforderung, siehe `docs/testing/accessibility-checklist.md`).

**Definition of Done für UI-Komponenten:** Kein Text wird abgeschnitten (außer bewusst mit `truncate` + Tooltip), kein horizontales Scrollen, alle interaktiven Elemente erreichbar und nicht überlappend, einheitliche Typo-/Spacing-Skala eingehalten.

---

## 8. Empfehlung zu MCP/Design-Tools für Claude Code

Für die Neuaufbau-Arbeit an Login-Screen und Assessment-Wizard sind folgende Werkzeuge sinnvoll, sofern verfügbar:

- **Chrome DevTools MCP** (falls verbunden): ermöglicht Claude Code, Screenshots bei verschiedenen Viewport-Breiten direkt zu erzeugen und visuell zu verifizieren, statt blind auf Klassennamen zu vertrauen — schließt die Lücke, die wir hier im Chat hatten (ich konnte die Screenshots nur nachträglich von Ihnen bekommen, nicht selbst erzeugen).
- **Figma MCP** (falls ein Figma-Entwurf existiert oder erstellt wird): für den Fall, dass Sie zuerst ein visuelles Mockup für Login/Assessment in Figma anlegen möchten, bevor Code entsteht — optional, nicht zwingend nötig bei einem bestehenden Produkt mit klaren Tokens wie oben.
- **Playwright/Puppeteer MCP** (falls verbunden): für automatisierte Screenshot-Vergleiche bei den drei Referenzbreiten aus Abschnitt 7, als Teil eines visuellen Regressionstests.

**Pragmatische Mindest-Empfehlung:** Selbst ohne zusätzliche MCP-Tools löst die direkte Dateisystem-Anbindung von Claude Code das größte Problem aus dieser Session bereits — keine Kopier-Synchronisationsfehler mehr zwischen zwei Umgebungen. Die MCP-Tools sind ein Plus für visuelle Verifikation, aber kein Blocker, um mit dem Neuaufbau zu starten.

## 9. Einheitliche Grundelemente (Issue #205) — verbindlicher Standard

Ziel (Anforderung Daniel 16.07.2026): Textelemente, Hilfetexte, Wissensbasis und
Box-Grunddesign sind über **alle** Module gleich. Farb-/Theme-Tokens selbst kommen
aus #201 — dieses Kapitel definiert die *Struktur-Komponenten*, die diese Tokens nutzen.

**Status (23.07.2026): Fundament gebaut, modulweite Adoption ausstehend** (bewusst
getrennt, weil ein visueller Sweep eine Screenshot-Abnahmerunde braucht — siehe Abschnitt 7).

### 9.1 Textelement-Hierarchie (`src/components/shared/typography.tsx`)
EIN Komponenten-Set statt ad-hoc-Klassen. Neue/überarbeitete UI nutzt diese:

| Komponente | Zweck | Basis-Klassen |
|---|---|---|
| `<Eyebrow>` | Seiten-/Sektions-Eyebrow | `text-xs text-primary tracking-widest uppercase font-medium` |
| `<SectionTitle as="h2">` | Sektions-Titel | `text-base sm:text-lg font-semibold text-ink` |
| `<CardTitle as="h3">` | Karten-Titel | `text-sm font-semibold text-ink` |
| `<BodyText>` | Beschreibungs-/Fließtext | `text-sm text-ink-secondary leading-relaxed` |
| `<HintText tone="info\|warning\|error\|muted">` | Inline-Hinweistext (KEINE Box) | `text-xs` + Ton-Farbe |
| `<MetaText>` | Meta-/Provenienz-Zeile (mono) | `text-xs text-ink-muted font-mono` |
| `<Badge tone="neutral\|info\|warning\|error\|success">` | Badge/Pill | `text-xs font-medium border rounded-full px-2 py-0.5` + Ton |

### 9.2 Hinweis-/Fehlerbox-Standard — EINE Komponente
- **Kanonisch & einzig:** `<AlertBox variant="info|warning|error">` (`src/components/shared/AlertBox.tsx`) —
  `role="alert"`, Icon-Slot, semantische Tokens (`info-/warning-/error-subtle`). **Genau drei Varianten.**
- `HintBox` wurde **entfernt** (23.07.2026) — die einzigen Aufrufe (Compliance, info/tip)
  sind auf `AlertBox` migriert (tip→info, da AlertBox bewusst nur die drei Alert-Töne führt).
- **Regel:** kein zweites/drittes Box-Muster, keine ad-hoc `bg-*-50 border-*-200`-Box mehr für
  Hinweise/Fehler (Kategorie-/Status-Farben sind davon unberührt).

### 9.3 Hilfsmarker + Wissensbasis
- **Hilfsmarker:** EIN Muster — `<InfoHint title=…>` (das `?`-Popup). Erklärungsbedürftige
  Karten/Sektionen bekommen einen InfoHint; Texte in i18n (DE Sie-Form + EN), kein Inline-Freitext.
- **Wissensbasis:** `<GuidancePanel module=… contextKey=… />` (Side-Drawer aus `content_library`).
  Position oben rechts, gleiche Optik in allen Modulen.

### 9.4 Inventur — Modul × Hilfsmarker (Stand 23.07.2026)
Legende: ✓ vorhanden · (n) Anzahl · — Adoptions-/Lücken-Kandidat für den Sweep.

| Modul | Wissensbasis (GuidancePanel) | Hilfsmarker (InfoHint) | Bekannte Lücken-Kandidaten (Sweep) |
|---|---|---|---|
| Assessment | ✓ | ✓ (4, in `AssessmentResults`) | Score-/Dimensions-Anzeigen bereits abgedeckt |
| Use-Case | ✓ | ✓ (2) | Kontextanalyse-Spalten, Score-Zellen |
| Governance | ✓ | ✓ (2) | RACI-Zellen-Bedienung |
| Roadmap | ✓ | ✓ (5) | — (gut abgedeckt) |
| Canvas | ✓ | ✓ (1) | Compliance-Kategorien, Erkennungs-Badges |
| Compliance | ✓ | ✓ (5) | HintBox→AlertBox migrieren |
| Architektur | ✓ | ✓ (2) | Workbench-Tabs, Landkarten-Badges (EU/SAP/◆) |

**Wissensbasis-Akzeptanz (#205 E2) erfüllt:** GuidancePanel ist in allen 7 Modulen aktiv
(gefordert waren ≥2 zusätzliche) — keine Weglass-Entscheidung nötig.

### 9.5 Was der Adoptions-Sweep noch umfasst (separater, screenshot-abgenommener Schritt)
1. Hierarchie-Komponenten aus 9.1 in den Modulen ausrollen (uneinheitliche Titel-/Eyebrow-Größen ersetzen).
2. ~~HintBox-Aufrufe (Compliance) auf `AlertBox` migrieren~~ → **erledigt 23.07.2026** (HintBox entfernt).
   Verbleibend: echte ad-hoc Hinweis-/Fehlerboxen (falsch-farbige `bg-*-50`-Boxen mit Alert-Semantik) sichten.
3. Fehlende InfoHints aus der Inventur (9.4, Spalte „Lücken-Kandidaten") ergänzen, Texte in i18n.
4. Screenshot-Serie vorher/nachher (1440/375) + Freigabe Daniel.

**Sweep-Fortschritt (Stand 23.07.2026):**
- ✅ **E4** Box-Konsolidierung: HintBox entfernt, AlertBox einzige Box.
- ✅ **E3** Titel-Adoption: Compliance, Architektur, Governance, Roadmap nutzen
  `CardTitle`/`SectionTitle`. Canvas/Use-Case waren bereits konform; Assessment nutzt
  bewusst Serif-Seitentitel (PageHeader-Ebene). Titel-Sweep abgeschlossen.
- 🔶 **E1** InfoHint-Lücken: Compliance-Risikomatrix ergänzt. Verbleibende
  Inventur-Kandidaten (RASIC-Zellen, Landkarten-Badges, Canvas-Erkennungs-Badges,
  Use-Case-Score-Zellen) sind **Design-Entscheidungen** (ein „?" dort kann auch
  überladen) — bewusst offen für Daniels Einzelfall-Freigabe, kein Blindausbau.
