# Design-Refresh Variante D — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App-Branding an das Buchcover angleichen: semantische Farbtokens, Cover-Blau, Lora-Serifen, helle Sidebar, kompaktes Dashboard mit Lucide-Icons und CSS-Animationen.

**Architecture:** Sequenziell in 4 Tasks: (1) Token-Codemod als Fundament (kein visueller Diff), (2) Theme-D-Werte + Font + Sidebar, (3) Dashboard V2 mit Lucide-Icons, (4) CSS-Animationen. Alles rein Frontend — keine DB-Migration, keine neuen API-Routen.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, `next/font/google` (Lora), `lucide-react ^1.20.0`, jest-axe

---

## Datei-Map

| Aktion | Pfad | Task |
|--------|------|------|
| Modify | `src/app/globals.css` | 1 + 2 |
| Modify | `src/app/layout.tsx` | 2 |
| Modify | `src/app/(dashboard)/layout.tsx` | 2 |
| Modify | `src/components/layout/Sidebar.tsx` | 2 |
| Modify | `src/app/(dashboard)/dashboard/page.tsx` | 2 + 3 + 4 |
| Create | `src/components/dashboard/GuidedPathHero.tsx` | 3 |
| Create | `src/components/dashboard/CountUp.tsx` | 3 + 4 |
| Create | `src/__tests__/accessibility/dashboard-a11y.test.tsx` | 3 |
| Create | `src/__tests__/unit/count-up.test.tsx` | 3 |

---

## Task 1: Semantische Farbtokens + Codemod (Issue #85)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (Zeile 14 — scaler archetype)
- Codemod: `src/**/*.tsx`, `src/**/*.ts` (exklusive `src/lib/pdf/templates.tsx`)

Kein visueller Diff nach diesem Task — Initialwerte = heutige Blues.

- [ ] **Schritt 1: Token-Block in globals.css ergänzen**

Ersetze den bestehenden `@theme inline`-Block in `src/app/globals.css` durch:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* Semantische Primärfarb-Tokens — Initialwerte = heutige Blues (kein visueller Diff) */
  --color-primary:        #2563EB;
  --color-primary-hover:  #1D4ED8;
  --color-primary-soft:   #EFF6FF;
  --color-primary-border: #BFDBFE;
  --color-primary-ring:   #3B82F6;
}
```

- [ ] **Schritt 2: Scaler-Archetype-Badge VOR dem Codemod auf Sky umstellen**

In `src/app/(dashboard)/dashboard/page.tsx` Zeile 14:
```typescript
// Alt:
scaler: { label: 'AI Scaler', color: 'text-blue-700 bg-blue-50 border-blue-200' },
// Neu:
scaler: { label: 'AI Scaler', color: 'text-sky-700 bg-sky-100 border-sky-200' },
```

- [ ] **Schritt 3: Codemod ausführen**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"

# Reihenfolge wichtig: hover-Varianten vor Basis-Klassen ersetzen
find src -name "*.tsx" -o -name "*.ts" | \
  grep -v "src/lib/pdf/templates.tsx" | \
  grep -v "node_modules" | \
  xargs sed -i '' \
    -e 's/hover:bg-blue-700/hover:bg-primary-hover/g' \
    -e 's/hover:bg-blue-500/hover:bg-primary/g' \
    -e 's/hover:text-blue-700/hover:text-primary-hover/g' \
    -e 's/focus:ring-blue-500/focus:ring-primary-ring/g' \
    -e 's/bg-blue-700/bg-primary-hover/g' \
    -e 's/bg-blue-600/bg-primary/g' \
    -e 's/bg-blue-500/bg-primary/g' \
    -e 's/bg-blue-50/bg-primary-soft/g' \
    -e 's/border-blue-200/border-primary-border/g' \
    -e 's/ring-blue-500/ring-primary-ring/g' \
    -e 's/text-blue-700/text-primary-hover/g' \
    -e 's/text-blue-600/text-primary/g' \
    -e 's/text-blue-500/text-primary/g'
```

- [ ] **Schritt 4: Build + Grep-Verifikation**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
npx tsc --noEmit 2>&1 | head -20
```

Erwartung: 0 Fehler.

```bash
npm run build 2>&1 | tail -10
```

Erwartung: ✓ Compiled successfully.

```bash
grep -rn "blue-[0-9]" src --include="*.tsx" --include="*.ts" | \
  grep -v "src/lib/pdf/templates.tsx" | \
  grep -v "sky-\|emerald-\|amber-\|red-\|slate-" | \
  grep -v "// ausnahme\|blue-200\|blue-300\|blue-400\|text-blue-2\|from-blue\|to-blue\|\/[0-9]"
```

Erlaubte Restfunde:
- `text-blue-400`, `text-blue-200` (Info-Text auf dunklen Hintergründen in Sidebar — wird in Task 2 behoben)
- `from-blue-600 to-blue-700` (Gradient im Upgrade-Banner — wird in Task 2 behoben)
- `ring-blue-300`, `border-blue-300` (Step-Indicators — feingranulare Hover-States)
- `bg-blue-600/20`, `border-blue-500/30` (Opacity-Varianten in Sidebar-Upgrade-Box — wird in Task 2 behoben)

- [ ] **Schritt 5: Tests**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
npm test 2>&1 | tail -5
```

Erwartung: alle Tests grün.

- [ ] **Schritt 6: Commit**

```bash
git add src/app/globals.css src/app/\(dashboard\)/dashboard/page.tsx
git add -u src/  # alle durch Codemod geänderten Dateien
git status       # KEIN .env* darf erscheinen
git commit -m "refactor(tokens): semantische Farbtokens + Codemod blue-* → primary-* (#85)"
```

---

## Task 2: Theme D anwenden (Issue #86)

**Files:**
- Modify: `src/app/globals.css` (Token-Werte auf Cover-Blau)
- Modify: `src/app/layout.tsx` (Lora-Font)
- Modify: `src/app/(dashboard)/layout.tsx` (Ivory-Bg + 3px-Linie)
- Modify: `src/components/layout/Sidebar.tsx` (helle Sidebar komplett)
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (Upgrade-Banner + Eyebrow)

- [ ] **Schritt 1: Token-Werte auf Cover-Blau stellen**

In `src/app/globals.css` die 5 Primärfarb-Tokens aktualisieren:

```css
  /* Theme D — Cover-Blau (WCAG AA: #1D4ED8 auf #FFF = 6,3:1 ✓) */
  --color-primary:        #1D4ED8;
  --color-primary-hover:  #2563EB;
  --color-primary-soft:   #EFF6FF;
  --color-primary-border: #BFDBFE;
  --color-primary-ring:   #3B82F6;
```

Außerdem Ivory-Hintergrundvariable und Serif-Font-Referenz ergänzen (Lora wird in Schritt 2 geladen):

```css
  /* Ivory-Content-Hintergrund */
  --color-ivory: #FCFCFA;

  /* Serifenschrift (Lora via next/font/google, geladen in layout.tsx) */
  --font-serif: var(--font-lora);
```

- [ ] **Schritt 2: Lora-Font in Root-Layout laden**

Ersetze `src/app/layout.tsx` vollständig:

```typescript
import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import './globals.css'

const lora = Lora({
  subsets: ['latin'],
  weight: ['500', '600'],
  display: 'swap',
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: { default: 'AI Navigator', template: '%s | AI Navigator' },
  description: 'Enterprise AI. Strukturiert navigiert. Strategische Frameworks für AI-Readiness, Governance und Use-Case-Priorisierung.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://enterprise-ai.biz'),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'AI Navigator',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={lora.variable}>
      <body className="font-sans antialiased bg-ivory text-slate-900">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Schritt 3: Dashboard-Layout — 3px Deckenlinie + Ivory**

Ersetze `src/app/(dashboard)/layout.tsx` vollständig:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { BfcacheGuard } from '@/components/shared/BfcacheGuard'
import { MobileNavProvider } from '@/components/layout/MobileNavContext'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.is_banned) redirect('/login?message=account_suspended')

  return (
    <MobileNavProvider>
      {/* h-[100dvh] statt h-screen: verhindert iOS-Safari-Modal-Effekt */}
      <div className="flex h-[100dvh] overflow-hidden bg-ivory">
        <BfcacheGuard />
        <Sidebar profile={profile} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* 3px Cover-Blau Deckenlinie — Buch-Branding-Zitat */}
          <div className="h-[3px] bg-primary shrink-0" aria-hidden="true" />
          <TopBar profile={profile} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MobileNavProvider>
  )
}
```

- [ ] **Schritt 4: Sidebar komplett auf helles Theme umbauen**

Ersetze `src/components/layout/Sidebar.tsx` vollständig:

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MODULES } from '@/config/modules'
import type { UserProfile } from '@/types'
import { useMobileNav } from './MobileNavContext'

interface SidebarProps {
  profile: UserProfile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const tier = profile?.tier ?? 'free'
  const { isOpen, close } = useMobileNav()

  const content = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <Link href="/dashboard" onClick={close} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-sm font-bold text-white">N</div>
          <div>
            <div className="font-semibold text-sm tracking-wide text-slate-900">AI Navigator</div>
            <div className="text-xs text-slate-400">enterprise-ai.biz</div>
          </div>
        </Link>
        <button onClick={close} aria-label="Menü schließen"
          className="lg:hidden text-slate-400 hover:text-slate-600 p-1 -mr-1">
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavItem href="/dashboard" icon="◎" label="Geführter Pfad" active={pathname === '/dashboard'} onNavigate={close} />

        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Tools</span>
        </div>

        {MODULES.map(mod => {
          const isLocked = mod.requiredTier !== 'free' && tier === 'free'
          return (
            <NavItem
              key={mod.id}
              href={`/${mod.id}`}
              icon={mod.icon}
              label={mod.title}
              active={pathname.startsWith(`/${mod.id}`)}
              locked={isLocked}
              onNavigate={close}
            />
          )
        })}

        <NavItem
          href="/zusammenfassung"
          icon="□"
          label="Executive Summary"
          active={pathname === '/zusammenfassung'}
          onNavigate={close}
        />

        <div className="pt-4 pb-1 px-3">
          <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">Konto</span>
        </div>
        <NavItem href="/settings" icon="⚙" label="Einstellungen" active={pathname === '/settings'} onNavigate={close} />
        <NavItem href="/feedback" icon="✉" label="Feedback & Support" active={pathname === '/feedback'} onNavigate={close} />
        {profile?.is_admin && (
          <NavItem href="/admin" icon="🛡" label="Admin" active={pathname.startsWith('/admin')} onNavigate={close} />
        )}
      </nav>

      {/* Tier Badge — helles Editorial-Design */}
      {tier === 'free' && (
        <div className="p-4 border-t border-slate-200">
          <div className="bg-primary-soft border border-primary-border rounded-lg p-3">
            <div className="text-xs font-semibold text-primary mb-1">Explorer Plan</div>
            <div className="text-xs text-slate-500 mb-2">PDF-Export, Speichern und mehr mit Pro</div>
            <Link href="/upgrade" onClick={close}
              className="block text-center text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md py-1.5 transition-colors">
              Upgrade auf Pro →
            </Link>
          </div>
        </div>
      )}

      {/* Legal-Footer */}
      <div className="px-4 py-3 border-t border-slate-200 space-y-2">
        <div className="flex gap-3">
          <Link href="/impressum" target="_blank" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Impressum</Link>
          <Link href="/datenschutz" target="_blank" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Datenschutz</Link>
          <Link href="/agb" target="_blank" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">AGB</Link>
        </div>
        <div className="flex items-center justify-between">
          <Link href="/trust" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">🇩🇪 EU-Hosting · DSGVO</Link>
          <span className="text-xs text-slate-400">v0.5.0</span>
        </div>
        <div className="pt-1 border-t border-slate-200">
          <span className="text-xs text-slate-400">📖 Basiert auf: </span>
          <a
            href="https://enterprise-ai.biz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Enterprise AI Leitfaden · Daniel Ostner
          </a>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: statische Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        {content}
      </aside>

      {/* Mobile: Backdrop + Slide-in-Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={close} aria-hidden="true" />
      )}
      <aside className={cn(
        'lg:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 max-w-[85vw] bg-white border-r border-slate-200 shrink-0 transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {content}
      </aside>
    </>
  )
}

function NavItem({ href, icon, label, active, locked, onNavigate }: {
  href: string; icon: string; label: string; active: boolean; locked?: boolean; onNavigate?: () => void
}) {
  return (
    <Link href={locked ? '/upgrade' : href} onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        active
          ? 'bg-primary-soft text-primary border-l-[3px] border-primary -ml-px pl-[11px]'
          : locked
          ? 'text-slate-400 cursor-pointer hover:text-slate-500'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      )}>
      <span className="text-base w-5 text-center shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {locked && <span className="text-xs text-slate-400 shrink-0">Pro</span>}
    </Link>
  )
}
```

- [ ] **Schritt 5: TypeScript + Build**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
npx tsc --noEmit 2>&1 | head -20
npm run build 2>&1 | tail -10
```

Erwartung: 0 Fehler, grüner Build.

- [ ] **Schritt 6: Tests**

```bash
npm test 2>&1 | tail -5
```

Erwartung: alle grün.

- [ ] **Schritt 7: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx \
        src/app/\(dashboard\)/layout.tsx \
        src/components/layout/Sidebar.tsx
git status  # KEIN .env* darf erscheinen
git commit -m "feat(design): Theme D — Cover-Blau, Lora, helle Sidebar, Ivory-Bg (#86)"
```

---

## Task 3: Dashboard V2 + Lucide-Icons (Issue #87)

**Files:**
- Create: `src/components/dashboard/GuidedPathHero.tsx`
- Create: `src/components/dashboard/CountUp.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (kompletter Layout-Umbau)
- Create: `src/__tests__/accessibility/dashboard-a11y.test.tsx`
- Create: `src/__tests__/unit/count-up.test.tsx`

- [ ] **Schritt 1: CountUp-Test schreiben (TDD — erwartet FAIL)**

Erstelle `src/__tests__/unit/count-up.test.tsx`:

```typescript
import { render, screen, act } from '@testing-library/react'
import { CountUp } from '@/components/dashboard/CountUp'

jest.useFakeTimers()

describe('CountUp', () => {
  it('startet bei 0 und endet beim Zielwert', () => {
    render(<CountUp value={7} duration={600} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    act(() => { jest.runAllTimers() })
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('zeigt sofort 0 wenn value=0', () => {
    render(<CountUp value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
```

- [ ] **Schritt 2: Test ausführen — erwartet FAIL**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
npx jest src/__tests__/unit/count-up.test.tsx 2>&1 | tail -10
```

Erwartung: FAIL — "Cannot find module '@/components/dashboard/CountUp'".

- [ ] **Schritt 3: CountUp-Komponente erstellen**

Erstelle `src/components/dashboard/CountUp.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'

export function CountUp({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const steps = 20
    const increment = value / steps
    const intervalMs = duration / steps
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + increment, value)
      setDisplay(Math.round(current))
      if (current >= value) clearInterval(timer)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [value, duration])

  return <>{display}</>
}
```

- [ ] **Schritt 4: CountUp-Test ausführen — erwartet PASS**

```bash
npx jest src/__tests__/unit/count-up.test.tsx 2>&1 | tail -5
```

Erwartung: PASS.

- [ ] **Schritt 5: GuidedPathHero-Komponente erstellen**

Erstelle `src/components/dashboard/GuidedPathHero.tsx`:

```typescript
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Tier } from '@/types'

interface PathStep {
  step: number
  icon: string
  title: string
  desc: string
  href: string
  done: boolean
  proOnly?: boolean
}

interface Props {
  steps: PathStep[]
  tier: Tier
}

export function GuidedPathHero({ steps, tier }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const completedCount = steps.filter(s => s.done).length
  const nextStep = steps.find(s => !s.done)
  const progressPct = Math.round((completedCount / steps.length) * 100)
  const allDone = completedCount === steps.length

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">Ihr geführter AI-Pfad</h2>
        <span className="text-xs text-slate-400">{completedCount}/{steps.length} abgeschlossen</span>
      </div>

      {/* Fortschrittsbalken — Animation in Task 4 ergänzt */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: mounted ? `${progressPct}%` : '0%' }}
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Fortschritt: ${completedCount} von ${steps.length} Schritten abgeschlossen`}
        />
      </div>

      {/* Schritt-Kacheln */}
      <div
        className="grid gap-1 mb-4"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        role="list"
      >
        {steps.map((s) => {
          const isCurrent = s === nextStep
          const isLocked = s.proOnly && tier === 'free'
          return (
            <Link
              key={s.step}
              href={isLocked ? '/upgrade' : s.href}
              role="listitem"
              aria-label={`Schritt ${s.step}: ${s.title}${s.done ? ' (abgeschlossen)' : isCurrent ? ' (aktuell empfohlen)' : ''}`}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-[transform,box-shadow] duration-150 text-center',
                'hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none',
                s.done
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : isCurrent
                    ? 'bg-primary-soft border-primary-border text-primary ring-1 ring-primary-ring'
                    : 'bg-slate-50 border-slate-200 text-slate-400',
              )}
            >
              <span className="text-sm leading-none">{s.done ? '✓' : s.icon}</span>
              <span className="text-[9px] font-medium leading-tight line-clamp-2 text-center w-full">{s.title}</span>
            </Link>
          )
        })}
      </div>

      {/* CTA */}
      {nextStep && (
        <Link
          href={nextStep.proOnly && tier === 'free' ? '/upgrade' : nextStep.href}
          className="group flex items-center gap-3 bg-primary hover:bg-primary-hover text-white rounded-lg px-4 py-3 transition-colors"
          aria-label={`Nächster Schritt: ${nextStep.title}`}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-white/70 mb-0.5">
              Nächster Schritt · {nextStep.step} von {steps.length}
            </div>
            <div className="text-sm font-semibold">{nextStep.title}</div>
          </div>
          <span
            className="text-white/70 group-hover:text-white text-sm shrink-0 group-hover:translate-x-1 transition-transform duration-150 motion-reduce:transition-none motion-reduce:transform-none"
            aria-hidden="true"
          >→</span>
        </Link>
      )}

      {allDone && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
          <span className="text-xl" aria-hidden="true">✓</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-emerald-800">AI-Navigator Pfad vollständig!</div>
            <div className="text-xs text-emerald-600">Alle Module abgeschlossen — Ergebnisse in PDF zusammenfassen.</div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Schritt 6: Accessibility-Test schreiben (TDD — erwartet FAIL)**

Erstelle `src/__tests__/accessibility/dashboard-a11y.test.tsx`:

```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { GuidedPathHero } from '@/components/dashboard/GuidedPathHero'

expect.extend(toHaveNoViolations)

jest.mock('@/lib/posthog/client', () => ({ track: jest.fn() }))

const mockSteps = [
  { step: 1, icon: '◎', title: 'Assessment', desc: '', href: '/assessment', done: true },
  { step: 2, icon: '⊞', title: 'Use-Case', desc: '', href: '/usecase', done: false },
  { step: 3, icon: '◧', title: 'Canvas', desc: '', href: '/canvas', done: false },
  { step: 4, icon: '⚖', title: 'Governance', desc: '', href: '/governance', done: false },
  { step: 5, icon: '✓', title: 'Compliance', desc: '', href: '/compliance', done: false },
  { step: 6, icon: '⬡', title: 'Architektur', desc: '', href: '/architecture', done: false },
  { step: 7, icon: '□', title: 'Summary', desc: '', href: '/zusammenfassung', done: false },
]

describe('Accessibility: GuidedPathHero', () => {
  it('hat keine WCAG-Verstöße (axe-core)', async () => {
    const { container } = render(<GuidedPathHero steps={mockSteps} tier="free" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Progressbar hat korrekte ARIA-Attribute', () => {
    const { container } = render(<GuidedPathHero steps={mockSteps} tier="free" />)
    const bar = container.querySelector('[role="progressbar"]')
    expect(bar).not.toBeNull()
    expect(bar).toHaveAttribute('aria-valuenow')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-label')
  })
})
```

- [ ] **Schritt 7: A11y-Test ausführen — erwartet zunächst PASS (Komponente existiert)**

```bash
npx jest src/__tests__/accessibility/dashboard-a11y.test.tsx 2>&1 | tail -10
```

Erwartung: PASS.

- [ ] **Schritt 8: Dashboard-Page auf V2-Layout umbauen**

Ersetze `src/app/(dashboard)/dashboard/page.tsx` vollständig:

```typescript
import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/config/modules'
import Link from 'next/link'
import type { Metadata } from 'next'
import { hasAccess } from '@/lib/utils/tier-check'
import type { Tier } from '@/types'
import {
  ClipboardCheck, Target, LayoutGrid, Shield, Map, Scale, Layers, FileText, type LucideIcon
} from 'lucide-react'
import { GuidedPathHero } from '@/components/dashboard/GuidedPathHero'
import { CountUp } from '@/components/dashboard/CountUp'

export const metadata: Metadata = { title: 'Dashboard' }

const NOW = Date.now()

const ARCHETYPE_LABELS: Record<string, { label: string; color: string }> = {
  starter:     { label: 'AI Starter',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  scaler:      { label: 'AI Scaler',      color: 'text-sky-700 bg-sky-100 border-sky-200' },
  transformer: { label: 'AI Transformer', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  assessment:   ClipboardCheck,
  canvas:       LayoutGrid,
  usecase:      Target,
  governance:   Shield,
  roadmap:      Map,
  compliance:   Scale,
  architecture: Layers,
}

const MODULE_CHIP_COLORS: Record<string, { bg: string; icon: string }> = {
  assessment:   { bg: 'bg-primary-soft',  icon: 'text-primary' },
  canvas:       { bg: 'bg-purple-50',     icon: 'text-purple-600' },
  usecase:      { bg: 'bg-violet-50',     icon: 'text-violet-600' },
  governance:   { bg: 'bg-sky-50',        icon: 'text-sky-600' },
  roadmap:      { bg: 'bg-amber-50',      icon: 'text-amber-600' },
  compliance:   { bg: 'bg-emerald-50',    icon: 'text-emerald-600' },
  architecture: { bg: 'bg-slate-100',     icon: 'text-slate-600' },
}

interface PathStep {
  step: number; icon: string; title: string; desc: string; href: string; done: boolean; proOnly?: boolean
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, company, tier, guided_path_reset_at')
    .eq('id', user!.id)
    .single() as { data: { full_name: string | null; company: string | null; tier: string; guided_path_reset_at: string | null } | null }

  const resetAt = profileData?.guided_path_reset_at ?? null
  const uid = user!.id

  const cnt = (table: string, extra?: Record<string, string | boolean>) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (extra) for (const [k, v] of Object.entries(extra)) q = (q as typeof q).eq(k, v)
    if (resetAt) q = (q as typeof q).gt('created_at', resetAt)
    return q
  }

  const [
    { data: latestAssessment },
    { count: architectureCount },
    { count: governanceCount },
    { count: roadmapCount },
    { count: assessmentCount },
    { count: usecaseCount },
    { count: canvasCount },
    { count: complianceCount },
  ] = await Promise.all([
    supabase.from('assessment_sessions').select('archetype, total_score, created_at').eq('user_id', uid).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    cnt('architectures',       { user_id: uid }),
    cnt('governance_sessions', { user_id: uid }),
    cnt('roadmaps',            { user_id: uid }),
    cnt('assessment_sessions', { user_id: uid, completed: true }),
    cnt('use_cases'),
    cnt('canvases',            { user_id: uid }),
    cnt('compliance_checks',   { user_id: uid }),
  ])

  const tier = (profileData?.tier ?? 'free') as Tier
  const firstName = profileData?.full_name?.split(' ')[0] ?? null
  const savedCount = (architectureCount ?? 0) + (governanceCount ?? 0) + (roadmapCount ?? 0) + (assessmentCount ?? 0)
  const moduleDone: Record<string, boolean> = {
    assessment:  (assessmentCount ?? 0) > 0,
    usecase:     (usecaseCount ?? 0) > 0,
    canvas:      (canvasCount ?? 0) > 0,
    governance:  (governanceCount ?? 0) > 0,
    compliance:  (complianceCount ?? 0) > 0,
    architecture:(architectureCount ?? 0) > 0,
    roadmap:     (roadmapCount ?? 0) > 0,
  }

  const assessmentDaysSince = latestAssessment
    ? Math.floor((NOW - new Date(latestAssessment.created_at as string).getTime()) / 86_400_000)
    : 0
  const assessmentWeeksSince = Math.floor(assessmentDaysSince / 7)

  const guidedSteps: PathStep[] = [
    { step: 1, icon: '◎', title: 'Assessment',   desc: 'Archetype & Reifegrad',          href: '/assessment',    done: (assessmentCount ?? 0) > 0 },
    { step: 2, icon: '⊞', title: 'Use-Case',     desc: 'Prioritäten setzen',              href: '/usecase',       done: (usecaseCount ?? 0) > 0 },
    { step: 3, icon: '◧', title: 'Canvas',       desc: 'Use-Case ausarbeiten',            href: '/canvas',        done: (canvasCount ?? 0) > 0 },
    { step: 4, icon: '⚖', title: 'Governance',   desc: 'Use-Case freigeben',              href: '/governance',    done: (governanceCount ?? 0) > 0 },
    { step: 5, icon: '✓', title: 'Compliance',   desc: 'EU AI Act & DSGVO',               href: '/compliance',    done: (complianceCount ?? 0) > 0 },
    { step: 6, icon: '⬡', title: 'Architektur',  desc: 'AI-Architektur definieren',       href: '/architecture',  done: (architectureCount ?? 0) > 0 },
    { step: 7, icon: '□', title: 'Summary',      desc: 'PDF-Export & Überblick',          href: '/zusammenfassung', done: (assessmentCount ?? 0) > 0 && (usecaseCount ?? 0) > 0 && (canvasCount ?? 0) > 0 && (governanceCount ?? 0) > 0 && (complianceCount ?? 0) > 0 && (architectureCount ?? 0) > 0 },
  ]

  const completedSteps = guidedSteps.filter(s => s.done).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-primary tracking-widest uppercase mb-1">
            Enterprise Architecture · AI Strategy
          </p>
          <h1 className="text-xl sm:text-2xl font-serif text-slate-900">
            Guten Tag{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {completedSteps === 0
              ? 'Starten Sie Ihren geführten AI-Pfad'
              : completedSteps === guidedSteps.length
                ? 'Ihr AI-Navigator-Pfad ist vollständig abgeschlossen'
                : `${completedSteps} von ${guidedSteps.length} Schritten abgeschlossen`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {latestAssessment && (
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${ARCHETYPE_LABELS[latestAssessment.archetype as string]?.color ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}>
              {ARCHETYPE_LABELS[latestAssessment.archetype as string]?.label ?? String(latestAssessment.archetype)}
            </span>
          )}
          {latestAssessment && (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border text-slate-700 bg-slate-50 border-slate-200">
              Score: {latestAssessment.total_score} / 5.0
            </span>
          )}
          <Link href="/ergebnisse" className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:border-primary-border hover:bg-primary-soft transition-colors text-slate-600 hover:text-primary">
            <CountUp value={savedCount} />
            <span>&nbsp;gespeicherte Ergebnisse</span>
          </Link>
        </div>
      </div>

      {/* Guided Path Hero */}
      <GuidedPathHero steps={guidedSteps} tier={tier} />

      {/* Quarterly Review Reminder */}
      {latestAssessment && assessmentDaysSince >= 90 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Zeit für Ihren Quarterly AI Health Review</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Ihr letztes Assessment ist {assessmentWeeksSince} Wochen alt. Regelmäßige Reviews sichern Ihren AI-Fortschritt.
            </p>
          </div>
          <a href="/assessment" className="whitespace-nowrap px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors flex-shrink-0">
            Assessment neu starten →
          </a>
        </div>
      )}

      {/* Modul-Grid */}
      <div className="mb-4">
        <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Alle Tools</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MODULES.map(mod => {
          const locked = !hasAccess(tier, mod.requiredTier)
          const done = moduleDone[mod.id] ?? false
          const Icon = MODULE_ICONS[mod.id] ?? FileText
          const chipColors = MODULE_CHIP_COLORS[mod.id] ?? { bg: 'bg-slate-100', icon: 'text-slate-600' }
          const subtitle = tier !== 'free' && mod.subtitlePro ? mod.subtitlePro : mod.subtitle
          return (
            <Link
              key={mod.id}
              href={locked ? '/upgrade' : `/${mod.id}`}
              className={`group bg-white rounded-xl p-4 transition-[border-color,box-shadow] duration-150 block border hover:shadow-sm motion-reduce:transition-none ${
                locked
                  ? 'opacity-60 border-slate-200'
                  : done
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : 'border-slate-200 hover:border-primary-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-[34px] h-[34px] rounded-xl ${chipColors.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={chipColors.icon} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {done && !locked && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 font-medium whitespace-nowrap">✓ Erledigt</span>
                  )}
                  {locked && <span className="text-xs text-primary bg-primary-soft border border-primary-border rounded-md px-2 py-0.5 font-medium">Pro</span>}
                </div>
              </div>
              <h3 className={`text-sm font-semibold text-slate-900 mb-0.5 min-w-0 transition-colors ${!locked ? 'group-hover:text-primary' : ''}`}>{mod.title}</h3>
              <p className="text-xs text-slate-400 mb-3 line-clamp-1">{subtitle}</p>
              <div className={`text-xs font-medium ${locked ? 'text-slate-400' : done ? 'text-emerald-600' : 'text-primary'}`}>
                {locked ? '🔒 Pro erforderlich →' : done ? 'Ergebnis ansehen →' : 'Starten →'}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Upgrade-Banner */}
      {tier === 'free' && (
        <div className="mt-8 bg-primary-soft border border-primary-border rounded-xl p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-primary font-semibold mb-1">Auf Professional upgraden</div>
            <div className="text-slate-600 text-sm">PDF-Export, Ergebnisse speichern, Versionierung und alle 7 Tools.</div>
          </div>
          <Link href="/upgrade"
            className="bg-primary hover:bg-primary-hover text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shrink-0 whitespace-nowrap">
            Ab €49/Monat →
          </Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Schritt 9: TypeScript + Build + Tests**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
npx tsc --noEmit 2>&1 | head -20
npm run build 2>&1 | tail -10
npm test 2>&1 | tail -5
```

Erwartung: 0 Fehler, grüner Build, alle Tests PASS.

- [ ] **Schritt 10: Commit**

```bash
git add src/components/dashboard/GuidedPathHero.tsx \
        src/components/dashboard/CountUp.tsx \
        src/app/\(dashboard\)/dashboard/page.tsx \
        src/__tests__/accessibility/dashboard-a11y.test.tsx \
        src/__tests__/unit/count-up.test.tsx
git status  # KEIN .env* darf erscheinen
git commit -m "feat(dashboard): V2 — Lucide-Icons, 4-spaltig, GuidedPathHero, CountUp (#87)"
```

---

## Task 4: Micro-Animationen (Issue #88)

**Files:**
- Modify: `src/components/dashboard/GuidedPathHero.tsx` (Fortschrittsbalken-Animation bereits in Task 3 eingebaut — nur noch `mounted`-State verfeinern falls nötig)
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (Modul-Karten Hover bereits in Task 3 eingebaut)

Hinweis: Die meisten Animationen wurden bereits in Task 3 direkt eingebaut (Fortschrittsbalken `transition-[width] duration-700`, Kacheln `hover:-translate-y-0.5`, CTA-Pfeil `group-hover:translate-x-1`, Modul-Karten `transition-[border-color,box-shadow]`). Task 4 vervollständigt die Häkchen-Stagger-Animation und die CountUp-Integration.

- [ ] **Schritt 1: Häkchen-Stagger-Animation in GuidedPathHero ergänzen**

In `src/components/dashboard/GuidedPathHero.tsx` die Schritt-Kacheln erweitern. Nach dem `setMounted(true)` useEffect einen zweiten Effect für den staggered Checkmark-Pop ergänzen und den `done`-Zustand animieren:

Füge nach `const [mounted, setMounted] = useState(false)` ein:

```typescript
const [animatedDone, setAnimatedDone] = useState<Set<number>>(new Set())

useEffect(() => {
  if (!mounted) return
  const doneSteps = steps.filter(s => s.done).map(s => s.step)
  doneSteps.forEach((step, i) => {
    setTimeout(() => {
      setAnimatedDone(prev => new Set([...prev, step]))
    }, i * 80)
  })
}, [mounted, steps])
```

Dann im Render der Schritt-Kacheln das Häkchen-Icon mit der Animation versehen:

```tsx
<span
  className={`text-sm leading-none transition-transform duration-300 motion-reduce:transition-none motion-reduce:transform-none ${
    s.done
      ? animatedDone.has(s.step) ? 'scale-100' : 'scale-0'
      : ''
  }`}
>
  {s.done ? '✓' : s.icon}
</span>
```

- [ ] **Schritt 2: Verifikation motion-reduce**

Stelle sicher, dass alle animierten Elemente in `GuidedPathHero.tsx` die Klassen `motion-reduce:transition-none` und `motion-reduce:transform-none` tragen. Checklist:
- Fortschrittsbalken: ✓ (in Task 3 eingebaut)
- Schritt-Kacheln `hover:-translate-y-0.5`: ✓ (in Task 3 eingebaut)
- CTA-Pfeil `group-hover:translate-x-1`: ✓ (in Task 3 eingebaut)
- Häkchen-Pop: ✓ (in Schritt 1 kein Translate, nur scale — ergänze `motion-reduce:scale-100` auf dem Häkchen-Span für done-States)

Finale Häkchen-Span-Klassen:
```tsx
className={`text-sm leading-none transition-[transform] duration-300 motion-reduce:transition-none ${
  s.done
    ? `motion-reduce:scale-100 ${animatedDone.has(s.step) ? 'scale-100' : 'scale-0'}`
    : ''
}`}
```

- [ ] **Schritt 3: CountUp in Header-Chip validieren**

Der `<CountUp value={savedCount} />`-Chip wurde bereits in Task 3 eingebaut. Stelle sicher, dass er korrekt im `Link`-Element sitzt und der Text korrekt zusammengesetzt wird:

```tsx
<Link href="/ergebnisse" className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:border-primary-border hover:bg-primary-soft transition-colors text-slate-600 hover:text-primary whitespace-nowrap">
  <CountUp value={savedCount} />
  <span>&nbsp;gespeicherte Ergebnisse</span>
</Link>
```

- [ ] **Schritt 4: Abschluss-Tests**

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
npm run test && npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build
```

Erwartung: alle Tests grün (577+), 0 TS-Fehler, 0 ESLint-Warnings, Build erfolgreich.

- [ ] **Schritt 5: Manuelle Checks (nicht automatisierbar)**

- 1440×900px: Dashboard above-the-fold ohne vertikales Scrollen?
- 375px: Grid 1-spaltig, Schritt-Kacheln scrollbar?
- 768px: Grid 2-spaltig?
- Touch-Targets ≥ 44px auf Schritt-Kacheln und Modul-Karten?
- Animationen inaktiv wenn `prefers-reduced-motion: reduce`?

- [ ] **Schritt 6: Commit**

```bash
git add src/components/dashboard/GuidedPathHero.tsx \
        src/app/\(dashboard\)/dashboard/page.tsx
git status  # KEIN .env* darf erscheinen
git commit -m "feat(ui): Micro-Animationen — Fortschrittsbalken, Häkchen-Stagger, Hover-Effekte (#88)"
```

---

## Gesamtes Test-Gate (vor Merge/Push)

```bash
cd "/Users/Daniel1/AI Bots/Enterprise AI/ai-navigator 3"
npm run test && npx tsc --noEmit && npx eslint src --max-warnings 0 && npm run build && npm audit --omit=dev
```

Alle 5 Befehle müssen mit Exit-Code 0 durchlaufen.
