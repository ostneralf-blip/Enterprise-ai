# Design-Refresh Variante D — Sprint 14 Design-Spec

> Entscheidung Daniel 05.07.2026: Variante D aus dem Figma-Vergleich wird umgesetzt.
> Figma-Referenz: Frame „Variante D — Buch-Branding" auf Seite „Dashboard — Redesign".

---

## Ziel

Die App übernimmt die visuelle DNA des Buchcovers: Cover-Blau als Primärfarbe, Serifen-Headlines, helle Editorial-Sidebar, Eyebrow-Labels in gesperrten Versalien, feine blaue Deckenlinie. Buchkäufer erkennen die App sofort wieder — App, Buch und Konzeptpapier treten als eine Marke auf.

## Scope

| Task | Issue | Was | Abhängigkeit |
|------|-------|-----|--------------|
| 1 | #85 | Semantische Farbtokens + Codemod | — |
| 2 | #86 | Theme D anwenden (Farben, Serifen, helle Sidebar) | Task 1 |
| 3 | #87 | Dashboard V2 (Lucide-Icons, kompaktes Grid, Hero-Karte) | Task 1 + 2 |
| 4 | #88 | Micro-Animationen (6 CSS-only, motion-reduce-safe) | Task 3 |

**Ausgeschlossen:** Issue #89 (User-wählbare Themes + Dark Mode, Stufe 3, braucht DB-Migration + Produkt-Entscheidung). Bug #90 (Use-Case-PDF) ist separates Ticket.

**Keine DB-Migration, kein neues API-Route, keine neuen Supabase-Calls** — rein Frontend.

---

## Task 1 — Semantische Farbtokens (#85)

### Motivation

`grep` zählt 250+ Vorkommen von `bg-blue-*` / `text-blue-*` / `border-blue-*` / `ring-blue-*` in `src/`. Ohne Tokens ist jede Themeänderung Streuarbeit; mit Tokens ist Theme D eine reine CSS-Wertänderung.

### Token-Definitionen

In `src/app/globals.css` im bestehenden `@theme inline`-Block ergänzen. **Initialwerte = heutige Blues → kein visueller Diff nach Task 1:**

```css
--color-primary:        #2563EB;   /* ersetzt text-blue-600 / bg-blue-600 */
--color-primary-hover:  #1D4ED8;   /* ersetzt hover:bg-blue-700 */
--color-primary-strong: #1D4ED8;   /* ersetzt bg-blue-700 (Buttons, aktive States) */
--color-primary-soft:   #EFF6FF;   /* ersetzt bg-blue-50 */
--color-primary-border: #BFDBFE;   /* ersetzt border-blue-200 */
--color-primary-ring:   #3B82F6;   /* ersetzt ring-blue-500 */
```

### Tailwind-Mapping (Codemod-Tabelle)

| Alt | Neu | Hinweis |
|-----|-----|---------|
| `bg-blue-600` | `bg-primary` | |
| `bg-blue-700` | `bg-primary-strong` | |
| `hover:bg-blue-700` | `hover:bg-primary-hover` | |
| `bg-blue-50` | `bg-primary-soft` | |
| `border-blue-200` | `border-primary-border` | |
| `ring-blue-500` | `ring-primary-ring` | |
| `text-blue-600` | `text-primary` | |
| `text-blue-700` | `text-primary` | |
| `text-blue-500` | `text-primary` | |
| `hover:text-blue-700` | `hover:text-primary-hover` | |
| `focus:ring-blue-500` | `focus:ring-primary-ring` | |

### Ausnahmen (bleiben hartcodiert)

- **Slate-Neutraltöne** (`bg-slate-*`, `text-slate-*`, `border-slate-*`) — Grautöne, nicht Aktionsfarbe
- **Status-Farben** (`emerald-*`, `amber-*`, `red-*`) — semantisch fest
- **Archetyp-Badges** in `ARCHETYPE_LABELS` (`src/lib/pdf/templates.tsx` und alle Stellen wo Archetyp-Farben definiert sind) — werden in Task 2 separat behandelt: „AI Scaler" wechselt von Blau auf Sky/Cyan

### Test-Gate Task 1

```bash
npm run build                                           # Exit 0
npx tsc --noEmit                                        # 0 Fehler
grep -r "blue-[0-9]" src --include="*.tsx" | grep -v   \
  "emerald\|amber\|red\|ARCHETYPE\|// ausnahme"        # nur dokumentierte Ausnahmen
```

Kein visueller Diff gegenüber dem Stand vor Task 1 (Screenshots Dashboard, Assessment, Governance bei 375/768/1440px).

---

## Task 2 — Theme D anwenden (#86)

### Farb-Token-Werte (Änderung gegenüber Task 1)

In `src/app/globals.css` die Token-Werte auf Cover-Blau umstellen:

```css
--color-primary:        #1D4ED8;   /* blue-700 — WCAG AA 6,3:1 auf Weiß ✓ */
--color-primary-hover:  #2563EB;   /* blue-600 */
--color-primary-strong: #1D4ED8;   /* blue-700 */
--color-primary-soft:   #EFF6FF;   /* blue-50 — unverändert */
--color-primary-border: #BFDBFE;   /* blue-200 — unverändert */
--color-primary-ring:   #3B82F6;   /* blue-500 — unverändert */
```

Content-Bereich Hintergrund: `#FCFCFA` (Ivory) — in `src/app/(dashboard)/layout.tsx` und globalen Seiten-Containern `bg-slate-50` → `bg-[#FCFCFA]`.

### Serifen-Schrift (Lora)

In `src/app/layout.tsx`:

```typescript
import { Lora } from 'next/font/google'

const lora = Lora({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-serif',
})
```

`--font-serif` auf `<html>` als CSS-Variable registrieren. **Einsatz ausschließlich auf:**
- Seiten-`<h1>` (z.B. Dashboard-Begrüßung „Guten Tag, …")
- Hero-Titel und Banner-Titel
- Logo-Wortmarke in der Sidebar

**Kein Einsatz bei:** Fließtext, Buttons, Labels, Meta-Zeilen, Tabellen — Lesbarkeit vor Stil.

Tailwind-Klasse: `font-serif` (Tailwind erkennt `--font-serif` automatisch via `fontFamily.serif`).

### Sidebar-Umbau (`src/components/layout/Sidebar.tsx`)

| Alt | Neu |
|-----|-----|
| `bg-slate-900` | `bg-white border-r border-slate-200` |
| `text-white` (Nav-Links) | `text-slate-700` |
| `text-slate-400` (inaktiv) | `text-slate-500` |
| Aktiver Nav-Punkt: `bg-slate-800 text-white` | `bg-primary-soft text-primary` + `border-l-[3px] border-primary` |
| Sektions-Labels (`TOOLS`, `KONTO`) | `text-primary text-[10px] tracking-widest font-semibold` |

Mobile-Overlay: Backdrop bleibt (`bg-black/30`), Drawer-Panel wechselt auf `bg-white`.

### Editorial-Details

**3px-Deckenlinie:** In `src/app/(dashboard)/layout.tsx` oberhalb des Content-Bereichs:
```tsx
<div className="h-[3px] bg-primary w-full" />
```

**Eyebrow-Label** (nur Dashboard `src/app/(dashboard)/dashboard/page.tsx`), oberhalb der Begrüßung:
```tsx
<p className="text-[10px] font-semibold text-primary tracking-widest uppercase mb-1">
  Enterprise Architecture · AI Strategy
</p>
```

**Upgrade-Banner** (`src/components/shared/UpgradeModal.tsx` oder Banner-Komponente): hell mit primary-Rahmen statt dunklem Block — `bg-primary-soft border border-primary-border text-primary` statt `bg-blue-600 text-white`.

### Archetyp-Badge-Farbe: AI Scaler

`ARCHETYPE_LABELS` (alle Vorkommen, primär in `src/config/` oder `src/lib/`): Scaler-Einträge von `blue-*` auf `sky-*` umstellen:
- `bg-blue-100 text-blue-700` → `bg-sky-100 text-sky-700`
- `border-blue-200` → `border-sky-200`

### Test-Gate Task 2

- WCAG AA: `#1D4ED8` auf `#FFFFFF` = 6,3:1 ✓ — jest-axe auf Dashboard-Seite grün
- Helle Sidebar bei 375px (Mobile-Overlay) geprüft, Touch-Targets ≥ 44px
- Lora lädt ohne FOUT (next/font SSR-integriert)
- Screenshots bei 375/768/1440px

---

## Task 3 — Dashboard V2 (#87)

### Datei

`src/app/(dashboard)/dashboard/page.tsx` — kompletter Umbau der Layout-Struktur.

### Layout-Struktur (1440px)

```
┌─────────────────────────────────────────────────────┐
│ [Eyebrow] ENTERPRISE ARCHITECTURE · AI STRATEGY     │
│ Guten Tag, Daniel  [Chip: AI Starter] [Score: 68%]  │
│                              [7 Ergebnisse gespeich.]│
├─────────────────────────────────────────────────────┤
│ Hero: Ihr geführter AI-Pfad                         │
│ ████████████░░░░░░ 57%                              │
│ [1✓][2✓][3✓][4→][5○][6○][7○]                       │
│ Nächster Schritt: Governance-Check starten →        │
├─────────────────────────────────────────────────────┤
│ [Icon][Titel]  [Icon][Titel]  [Icon][Titel]  [Icon] │
│ [Status]       [Status]       [Status]       [Titel]│
│                                              [Status]│
└─────────────────────────────────────────────────────┘
```

Free/Pro-Tabelle wird vollständig entfernt. Der Upgrade-Banner übernimmt den Upgrade-Pfad.

### Header-Zeile

```tsx
<div className="flex items-start justify-between gap-4 flex-wrap">
  <div className="min-w-0">
    <p className="text-[10px] font-semibold text-primary tracking-widest uppercase mb-1">
      Enterprise Architecture · AI Strategy
    </p>
    <h1 className="text-xl sm:text-2xl font-serif text-slate-900">
      Guten Tag, {firstName}
    </h1>
    <p className="text-sm text-slate-500 mt-0.5">{progressSentence}</p>
  </div>
  <div className="flex items-center gap-2 flex-wrap">
    {archetype && <ArchetypeChip archetype={archetype} />}
    {score && <ScoreChip score={score} />}
    <SavedResultsChip count={savedCount} />
  </div>
</div>
```

### Hero-Karte „Ihr geführter AI-Pfad"

Ersetzt die bisherige GuidedPath-Sektion. Eine Karte mit:
1. Fortschrittsbalken (`transition-[width]` — Animation in Task 4)
2. 7 nummerierte Schritt-Kacheln — Zustände: `done` (✓, grün), `current` (→, primary, Ring), `open` (○, slate)
3. CTA-Zeile: „Nächster Schritt: [Modul-Name] starten →"

Schritt-Kacheln horizontal scrollbar auf Mobile (snap), 1-zeilig auf Desktop.

### Modul-Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
  {modules.map(mod => <ModuleCard key={mod.id} module={mod} />)}
</div>
```

**`ModuleCard`-Aufbau:**
```
┌─────────────────────────┐
│ [Icon-Chip 34px]        │
│ Titel                   │
│ Meta-Zeile (text-xs)    │
│ ──────────────────────  │
│ [Status-Badge]          │
└─────────────────────────┘
```

Status-Badge-Varianten:
- `✓ Erledigt` — `text-emerald-700 bg-emerald-50`
- `Nächster Schritt →` — `text-primary bg-primary-soft`
- `🔒 Pro` — `text-amber-700 bg-amber-50`
- `Starten →` — `text-slate-600 bg-slate-100`

Lange Beschreibungen entfallen im Grid (wandern als `title`-Attribut auf den Container).

### Lucide-Icons-Mapping

```typescript
import {
  ClipboardCheck, Target, Shield, Scale, Map, Layers, FileText
} from 'lucide-react'

const MODULE_ICONS: Record<string, LucideIcon> = {
  assessment:    ClipboardCheck,
  usecase:       Target,
  governance:    Shield,
  compliance:    Scale,
  roadmap:       Map,
  architecture:  Layers,
  executive:     FileText,
}
```

Icon-Chip: 34px Kachel, abgerundet (`rounded-xl`), Hintergrund = modul-spezifische Soft-Farbe, Icon 18px in passender Akzentfarbe.

**Modul-Farben (Icon-Chips):**
| Modul | Chip-Hintergrund | Icon-Farbe |
|-------|-----------------|-----------|
| Assessment | `bg-primary-soft` | `text-primary` |
| Use-Case | `bg-violet-50` | `text-violet-600` |
| Governance | `bg-sky-50` | `text-sky-600` |
| Compliance | `bg-emerald-50` | `text-emerald-600` |
| Roadmap | `bg-amber-50` | `text-amber-600` |
| Architektur | `bg-slate-100` | `text-slate-600` |
| Zusammenfassung | `bg-rose-50` | `text-rose-600` |

### Scrollfrei-Ziel

- 1440×900: Hero + Grid above-the-fold, kein vertikales Scrollen
- 375px: 1-spaltiges Grid, Hero-Schritte horizontal snap-scrollbar

### Test-Gate Task 3

- jest-axe grün auf Dashboard
- PostHog-Events unverändert (`guided_path`-Klicks, Modul-Starts)
- 375/768/1440px verifiziert, Touch ≥ 44px
- Kein horizontales Overflow auf 375px

---

## Task 4 — Micro-Animationen (#88)

Alle Animationen: nur `transform` / `opacity` / `width` animiert, < 700ms, `motion-reduce:transition-none motion-reduce:transform-none` auf jeder Animation.

### Animation 1 — Fortschrittsbalken

```tsx
// useEffect setzt mounted=true nach erstem Render
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])

<div
  className="h-2 bg-primary rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
  style={{ width: mounted ? `${progress}%` : '0%' }}
/>
```

### Animation 2 — Schritt-Kacheln Hover

```tsx
className="... hover:-translate-y-0.5 hover:shadow-md transition-[transform,box-shadow] duration-150 motion-reduce:transition-none motion-reduce:transform-none"
```

### Animation 3 — CTA-Pfeil

```tsx
<span className="group-hover:translate-x-1 transition-transform duration-150 motion-reduce:transition-none motion-reduce:transform-none">
  →
</span>
```

### Animation 4 — Modul-Karten Hover

```tsx
className="... hover:border-primary-border hover:shadow-sm transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none"
```

### Animation 5 — Häkchen-Pop (frisch abgeschlossener Schritt)

Nur bei Statuswechsel in der Session (nicht bei jedem Load). Via `useRef` auf den vorherigen Status:

```tsx
const [justCompleted, setJustCompleted] = useState<string | null>(null)
// scale-0 → scale-100 wenn justCompleted === step.id
className={cn(
  'transition-transform duration-300 motion-reduce:transition-none',
  justCompleted === step.id ? 'scale-100' : step.done ? 'scale-100' : 'scale-0'
)}
```

### Animation 6 — Count-up Ergebnis-Zahl

Kleine Client-Insel `<CountUp value={savedCount} duration={600} />` — eigene Datei mit `'use client'`:

```typescript
function CountUp({ value, duration }: { value: number; duration: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) return
    const steps = 20
    const increment = value / steps
    const interval = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, value)
      setDisplay(Math.round(current))
      if (current >= value) clearInterval(timer)
    }, interval)
    return () => clearInterval(timer)
  }, [value, duration])
  return <>{display}</>
}
```

### Test-Gate Task 4

- Lighthouse CLS = 0 auf Dashboard
- `prefers-reduced-motion`: alle Animationen inaktiv (Screenshot-Vergleich)
- jest-axe grün

---

## Gemeinsame Nicht-Ziele

- Kein Redesign der Modul-Innenseiten (Folge-Epic nach Dashboard-Abnahme)
- Keine Änderung an Informationsarchitektur oder Navigation
- Issue #89 (Dark Mode / wählbare Themes) — Stufe 3, nicht in Sprint 14

## Gesamtes Test-Gate (vor Merge)

```bash
npm run test && npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build
```

Manuelle Checks: Screenshots bei 375/768/1440px, Touch-Targets ≥ 44px, WCAG AA auf primäre Aktionsfarben.
