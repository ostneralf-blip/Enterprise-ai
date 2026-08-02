import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'

const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100),
  company: z.string().max(100).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
})

describe('Security: Settings API', () => {

  describe('Eingabevalidierung', () => {
    it('lehnt leeren Namen ab', () => {
      expect(ProfileUpdateSchema.safeParse({ full_name: '' }).success).toBe(false)
    })

    it('lehnt Namen mit nur Leerzeichen nicht auf Schema-Ebene ab (trim in Handler)', () => {
      // Der Handler trimmt den Wert, das Schema selbst akzeptiert Leerzeichen-Strings
      // (min(1) prüft Länge vor trim — der Handler prüft via trim() vor dem Schema-Aufruf nicht)
      // Dieser Test dokumentiert das Verhalten: min(1) schlägt bei '' fehl, ' ' besteht das Schema
      expect(ProfileUpdateSchema.safeParse({ full_name: ' ' }).success).toBe(true)
    })

    it('blockiert überlange Felder (Längenvalidierung)', () => {
      expect(ProfileUpdateSchema.safeParse({ full_name: 'a'.repeat(101) }).success).toBe(false)
      expect(ProfileUpdateSchema.safeParse({ full_name: 'Max', company: 'a'.repeat(101) }).success).toBe(false)
      expect(ProfileUpdateSchema.safeParse({ full_name: 'Max', role: 'a'.repeat(101) }).success).toBe(false)
    })
  })

  describe('Auth-Check (statischer Code-Check)', () => {
    it('Settings-Route prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/route.ts'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain('status: 401')
    })

    it('Portal-Route prüft Auth via requireFeature (delegiert an tier-check)', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/portal/route.ts'), 'utf-8')
      // Auth und Tier-Check laufen zentral in requireFeature() — nicht mehr inline
      expect(source).toContain('requireFeature')
      expect(source).toContain('gate instanceof NextResponse')
    })
  })

  describe('Tier-Gating Portal (statischer Code-Check)', () => {
    it('Portal-Route nutzt requireFeature("billing_portal") statt manuellem Tier-Check', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/portal/route.ts'), 'utf-8')
      expect(source).toContain("requireFeature('billing_portal')")
      // Kein manuelles tier === 'free' mehr — einzige Quelle der Wahrheit ist FEATURE_TIERS
      expect(source).not.toContain("tier === 'free'")
    })

    it('Portal-Route prüft stripe_customer_id', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/portal/route.ts'), 'utf-8')
      expect(source).toContain('stripe_customer_id')
      expect(source).toContain('status: 400')
    })
  })

  describe('Theme-Feld in /api/settings', () => {
    it('settings route validiert theme-Feld mit Zod enum', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/route.ts'), 'utf-8')
      expect(source).toContain("z.enum")
      expect(source).toContain("'book'")
      expect(source).toContain("'dark'")
    })

    it('settings route nimmt nur erlaubte Theme-Werte an (kein freier String)', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/route.ts'), 'utf-8')
      // Muss z.enum sein, kein z.string()
      const themeMatch = source.match(/theme[^,\n]*z\.[a-z]+/)
      expect(themeMatch?.[0]).toContain('z.enum')
    })

    // Das Theme wurde aus dem Root-Layout in das (dashboard)-Layout verschoben, damit
    // öffentliche Seiten ohne Supabase-Abfrage statisch gerendert werden können
    // (SEO-/Performance-Sprint 02.08.2026). Die Sicherheitseigenschaft bleibt dieselbe:
    // der Wert stammt server-seitig aus der profiles-Tabelle, nicht aus einer vom
    // Client kontrollierbaren Quelle.
    it('Dashboard-Layout liest theme server-seitig aus DB (kein Client-Cookie-Bypass)', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/[locale]/(dashboard)/layout.tsx'),
        'utf-8'
      )
      expect(source).toContain("from('profiles')")
      expect(source).toContain('ThemeAttribute')
      expect(source).toContain('profile?.theme')
    })

    it('ThemeAttribute setzt data-theme nur aus einer Whitelist (XSS-Schutz im Inline-Skript)', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/components/shared/ThemeAttribute.tsx'),
        'utf-8'
      )
      expect(source).toContain('data-theme')
      expect(source).toContain('VALID_THEMES')
      // Der DB-Wert landet in einem <script>. Er darf nur eingesetzt werden, wenn er
      // vorher gegen die Whitelist geprüft wurde — sonst wäre das eine XSS-Senke.
      expect(source).toContain('VALID_THEMES.includes')
      expect(source).toContain('JSON.stringify(safeTheme)')
    })
  })
})
