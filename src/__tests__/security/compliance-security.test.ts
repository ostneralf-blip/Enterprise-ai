import { readFileSync } from 'fs'
import { join } from 'path'

describe('Security: Compliance Center', () => {

  describe('Auth- und Tier-Check (statischer Code-Check)', () => {
    it('Compliance-Page prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/compliance/page.tsx'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain("redirect('/login')")
    })

    it('Compliance-Page leitet auf /upgrade für Free-Nutzer weiter', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/compliance/page.tsx'), 'utf-8')
      expect(source).toContain('hasAccess')
      expect(source).toContain("redirect('/upgrade')")
    })

    it('Compliance-Page prüft explizit auf Pro-Tier', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/compliance/page.tsx'), 'utf-8')
      expect(source).toContain("'pro'")
    })

    it('Compliance-Page liest Tier server-seitig aus Datenbank', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/compliance/page.tsx'), 'utf-8')
      expect(source).toContain('profiles')
      expect(source).toContain('tier')
    })
  })

  describe('Client-Komponente ohne direkten Datenbankzugriff', () => {
    it('CompliancePageClient importiert keinen Supabase-Client', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/(dashboard)/compliance/CompliancePageClient.tsx'), 'utf-8'
      )
      expect(source).not.toContain("from '@/lib/supabase")
    })

    it('CompliancePageClient macht keine fetch()-Aufrufe (rein statische Anzeige)', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/(dashboard)/compliance/CompliancePageClient.tsx'), 'utf-8'
      )
      expect(source).not.toContain('fetch(')
    })

    it('Compliance-Inhalte kommen aus config, nicht vom Client', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/(dashboard)/compliance/CompliancePageClient.tsx'), 'utf-8'
      )
      expect(source).toContain("from '@/config/compliance-data'")
    })
  })
})
