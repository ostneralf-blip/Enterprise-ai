# Dynamisches Architekturdiagramm mit Komponentenauswahl und Abhängigkeitsmatrix — Design Spec

## Ziel

Issue #60 umsetzen: Das bestehende CSS-Swimlane-Diagramm wird um interaktive Komponentenauswahl und eine Abhängigkeits-Engine erweitert. Nutzer können ihre Zielarchitektur zusammenstellen, sehen Inkompatibilitäten farblich hervorgehoben und erhalten kontextuelle Vorschläge.

## Kontext

- **Bestehendes Diagramm:** `src/components/modules/ArchitectureDiagram.tsx` — CSS-Swimlane-Tabelle mit `ComponentButton` (Klick öffnet Detail-Panel), vollständig clientseitig
- **Datenquelle:** `CatalogComponent[]` aus `component_catalog` (Supabase), übergeben als Prop
- **Abhängigkeit erfüllt:** Issue #59 (kontextbasierte Filterung) ist abgeschlossen
- **Tier-Gate:** Diagramm ist Pro-Feature (Free sieht Blur-Overlay)

---

## Architektur — 3 unabhängig deploybare Blöcke

### Block 1 — Schema + Datenpflege

**Ziel:** Abhängigkeitsdaten in der DB speichern und pflegbar machen.

**Migration:** 3 neue Spalten auf `component_catalog`:
```sql
incompatible_with  text[]  DEFAULT '{}'
requires           text[]  DEFAULT '{}'
suggests           text[]  DEFAULT '{}'
```
Typ `text[]` mit Komponentennamen (keine Foreign Keys) — konsistent mit `sap_components text[]`. Alle nullable/optional, bestehende Einträge werden nicht verändert.

**TypeScript `CatalogComponent` (src/types/index.ts):**
```ts
incompatible_with: string[]
requires:          string[]
suggests:          string[]
```

**Admin Panel (bestehender Katalog-Tab):**
- Neue Sektion "Abhängigkeiten & Kompatibilität" im Komponenten-Editor
- Drei Tag-Chip-Inputs mit Autocomplete auf bestehende Katalognamen:
  - `incompatible_with` — rot, Label "✗ Inkompatibel mit"
  - `requires` — blau, Label "⬆ Setzt voraus"
  - `suggests` — grün, Label "💡 Schlägt vor"
- PATCH `/api/admin/catalog/[id]` Route (neu) speichert die drei Felder
- Bidirektionale Hinweistext: "Muss nur auf einer Seite eingetragen werden"

**JSON-Upload-Route (`src/app/api/admin/catalog/upload/route.ts`):**
- `RowSchema` um die drei Felder erweitern (alle `z.array(z.string()).default([])`)
- `normalizeStandardRow` liest die Felder per `splitField()` aus
- Bestehende Imports ohne diese Felder bleiben gültig (default `[]`)

**Deliverable Block 1:** Abhängigkeitsdaten können per Admin-Editor und JSON-Import gepflegt werden. Diagramm-Verhalten ändert sich noch nicht.

---

### Block 2 — Diagramm-Interaktion

**Ziel:** Interaktive Komponentenauswahl mit Sidebar, noch ohne Abhängigkeits-Engine.

**`ArchitectureDiagram.tsx` — State-Änderungen:**
```ts
// Vorher:
const [selected, setSelected] = useState<string | null>(null)

// Nachher:
const [checked, setChecked]   = useState<Set<string>>(new Set())  // Checkbox-Auswahl
const [focused, setFocused]   = useState<string | null>(null)     // Detail-Panel
```

**`ComponentButton` — zwei Interaktionen:**
- **Checkbox** (links): togglet `checked`-Set — persistente Mehrfachauswahl
- **Klick auf Namen** (rechts): setzt `focused` — öffnet Detail-Panel
- Visuelle Zustände:
  - Ausgewählt (checked): blauer Hintergrund + Rand (wie bisher `isSelected`)
  - Fokussiert (focused): fetter Rand, kein Hintergrund-Wechsel
  - Inkompatibel (wird in Block 3 aktiv): roter Rand + gedämpfte Darstellung
  - Vorschlag (wird in Block 3 aktiv): grüner Rand

**Layout-Änderung:**
- Wenn `checked.size > 0`: Diagramm-Breite ~70%, Sidebar erscheint rechts (~30%)
- Auf Mobile (< `md`): Sidebar klappt unterhalb des Diagramms

**`SelectionSidebar` (neue Komponente, `src/components/modules/SelectionSidebar.tsx`):**
```
┌─────────────────────┐
│ Meine Architektur   │
│ 3 Komponenten       │
│                     │
│ ⚠ Konflikte (Block3)│
│ 💡 Vorschläge (B3)  │
│                     │
│ Ausgewählt:         │
│ ☑ SAP Datasphere    │
│ ☑ SAP HANA Cloud    │
│ ☑ SAP AI Core       │
└─────────────────────┘
```
In Block 2 zeigt die Sidebar nur den Zähler und die Liste — Konflikt/Vorschlag-Sektionen erscheinen erst wenn Daten vorhanden (Block 3).

**Deliverable Block 2:** Nutzer können beliebig viele Komponenten ankreuzen, Sidebar zeigt Auswahl. Detail-Panel öffnet wie bisher per Namens-Klick.

---

### Block 3 — Abhängigkeits-Engine

**Ziel:** Konflikte erkennen, Alternativen vorschlagen, Diagramm visuell anreichern.

**Neue Datei `src/lib/utils/catalog-compatibility.ts`:**

```ts
export interface Conflict {
  a: string           // Komponentenname A
  b: string           // Komponentenname B (inkompatibel mit A)
  alternatives: string[] // suggests-Schnittmenge beider Seiten
}

export interface Suggestion {
  source: string  // welche ausgewählte Komponente schlägt das vor
  target: string  // vorgeschlagener Komponentenname
}

// Bidirektional: Konflikt gilt wenn A.incompatible_with enthält B ODER B.incompatible_with enthält A
export function findConflicts(
  checked: Set<string>,
  byName: Record<string, CatalogComponent>
): Conflict[]

// Aus suggests aller ausgewählten Komponenten — nur wenn noch nicht in checked
export function findSuggestions(
  checked: Set<string>,
  byName: Record<string, CatalogComponent>
): Suggestion[]
```

**Diagramm-Anreicherung:**
- Inkompatible Chips (zu einer ausgewählten Komponente): roter Rand, Tooltip "Inkompatibel mit [Name]", Checkbox nicht sperrbar (Variante A: Auswahl erlaubt + Warnung)
- Vorgeschlagene Chips: grüner Rand, 💡-Icon, Tooltip "Empfohlen für [Name]"
- Konflikt-Warnung beim Ankreuzen einer inkompatiblen Komponente: Toast oder Banner unterhalb des Diagramms mit Alternative

**Sidebar-Erweiterungen:**
- Konflikte: rote Karte, erklärt A ✗ B, zeigt `alternatives` als klickbare Chips ("+ Hinzufügen")
- Vorschläge: grüne Karte, zeigt `target` mit Quelle, "+ Hinzufügen"-Button fügt zu `checked` hinzu

**Deliverable Block 3:** Vollständige Abhängigkeits-Engine aktiv. Nutzer sehen Konflikte in Echtzeit, erhalten Alternativen und können Vorschläge direkt ankreuzen.

---

## Datenpflege-Strategie (Admin)

- `incompatible_with` ist bidirektional — Admin trägt die Beziehung nur einmal ein (auf einer Seite)
- `requires` ist unidirektional — A requires B bedeutet nicht B requires A
- `suggests` ist unidirektional — A suggests B bedeutet nicht automatisch B suggests A
- Initiale Daten: manuell für die wichtigsten Konflikte (SAP vs. Open-Source-Inference-Schichten), dann per JSON-Import ergänzbar

---

## Fehlerbehandlung

- Komponentenname in `incompatible_with`/`requires`/`suggests` existiert nicht im Katalog: Engine ignoriert den Eintrag stillschweigend (kein Crash)
- Leere `checked`-Menge: Sidebar nicht sichtbar, kein Layout-Shift
- Pro-Gate: Diagramm bleibt hinter Blur-Overlay für Free-Nutzer — Checkbox-State nicht erreichbar

---

## Tests

**Block 1:**
- Unit: `RowSchema` akzeptiert/lehnt die 3 Felder korrekt ab
- Security: PATCH `/api/admin/catalog/[id]` erfordert Admin-Rolle

**Block 2:**
- Unit: `checked`-State togglet korrekt (Set-Semantik)
- A11y: Checkboxen haben `aria-label`, Sidebar ist per Tastatur erreichbar

**Block 3:**
- Unit: `findConflicts()` bidirektional korrekt
- Unit: `findSuggestions()` schließt bereits ausgewählte Komponenten aus
- Unit: `findConflicts()` mit leerem `checked` → `[]`

---

## Dateien die sich ändern

| Datei | Änderung |
|---|---|
| `supabase/migrations/20260704_issue60_dependencies.sql` | 3 neue Spalten auf component_catalog |
| `src/types/index.ts` | CatalogComponent + 3 Felder |
| `src/app/api/admin/catalog/upload/route.ts` | RowSchema + normalizeStandardRow |
| `src/app/api/admin/catalog/[id]/route.ts` | NEU: PATCH-Route |
| `src/app/(dashboard)/admin/AdminPageClient.tsx` | Abhängigkeits-Editor-Sektion |
| `src/components/modules/ArchitectureDiagram.tsx` | State + Layout + ComponentButton |
| `src/components/modules/SelectionSidebar.tsx` | NEU |
| `src/lib/utils/catalog-compatibility.ts` | NEU |
| Tests (unit, security, a11y) | Neue Test-Suites |
