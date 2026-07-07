import { readFileSync } from 'fs'
import { join } from 'path'

describe('Security: Architektur-Generator', () => {

  describe('Auth- und Tier-Check (statischer Code-Check)', () => {
    it('Architecture-Page prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/architecture/page.tsx'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain("redirect('/login')")
    })

    it('Architecture-Page leitet auf /upgrade für Free-Nutzer weiter', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/architecture/page.tsx'), 'utf-8')
      expect(source).toContain('hasAccess')
      expect(source).toContain("redirect('/upgrade')")
    })

    it('Architecture-Page prüft explizit auf Pro-Tier', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/architecture/page.tsx'), 'utf-8')
      expect(source).toContain("'pro'")
    })

    it('Architecture-Page liest Tier server-seitig aus Datenbank', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/architecture/page.tsx'), 'utf-8')
      expect(source).toContain('profiles')
      expect(source).toContain('tier')
    })
  })

  describe('Client-Komponente ohne direkten Datenbankzugriff', () => {
    it('ArchitecturePageClient importiert keinen Supabase-Client', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/[locale]/(dashboard)/architecture/ArchitecturePageClient.tsx'), 'utf-8'
      )
      expect(source).not.toContain("from '@/lib/supabase")
    })

    it('ArchitecturePageClient nutzt fetch() nur für eigene API-Routen (kein direkter DB-Zugriff)', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/[locale]/(dashboard)/architecture/ArchitecturePageClient.tsx'), 'utf-8'
      )
      expect(source).toContain("fetch('/api/architecture")
      expect(source).not.toContain("from '@/lib/supabase")
    })

    it('Architektur-Logik kommt aus config, nicht vom Client', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/[locale]/(dashboard)/architecture/ArchitecturePageClient.tsx'), 'utf-8'
      )
      expect(source).toContain("from '@/config/architecture-data'")
    })
  })
})
