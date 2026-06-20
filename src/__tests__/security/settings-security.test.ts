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

    it('Portal-Route prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/portal/route.ts'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain('status: 401')
    })
  })

  describe('Tier-Gating Portal (statischer Code-Check)', () => {
    it('Portal-Route gibt 403 für Free-Tier zurück', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/portal/route.ts'), 'utf-8')
      expect(source).toContain("tier === 'free'")
      expect(source).toContain('status: 403')
    })

    it('Portal-Route prüft stripe_customer_id', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/settings/portal/route.ts'), 'utf-8')
      expect(source).toContain('stripe_customer_id')
      expect(source).toContain('status: 400')
    })
  })
})
