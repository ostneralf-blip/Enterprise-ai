import { readFileSync } from 'fs'
import { join } from 'path'

describe('Security: Compliance Center', () => {

  describe('Auth- und Tier-Check (statischer Code-Check)', () => {
    it('Compliance-Page prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/compliance/page.tsx'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain("redirect('/login')")
    })

    it('Compliance-Page leitet auf /upgrade für Free-Nutzer weiter', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/compliance/page.tsx'), 'utf-8')
      expect(source).toContain('hasAccess')
      expect(source).toContain("redirect('/upgrade')")
    })

    it('Compliance-Page prüft explizit auf Pro-Tier', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/compliance/page.tsx'), 'utf-8')
      expect(source).toContain("'pro'")
    })

    it('Compliance-Page liest Tier server-seitig aus Datenbank', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/compliance/page.tsx'), 'utf-8')
      expect(source).toContain('profiles')
      expect(source).toContain('tier')
    })
  })

  describe('Client-Komponente ohne direkten Datenbankzugriff', () => {
    it('CompliancePageClient importiert keinen Supabase-Client', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/[locale]/(dashboard)/compliance/CompliancePageClient.tsx'), 'utf-8'
      )
      expect(source).not.toContain("from '@/lib/supabase")
    })

    it('CompliancePageClient nutzt fetch() NUR für /api/compliance (keine anderen Endpunkte)', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/[locale]/(dashboard)/compliance/CompliancePageClient.tsx'), 'utf-8'
      )
      // fetch ist erlaubt — aber nur für den eigenen API-Endpunkt
      const fetchCalls = source.match(/fetch\(['"`][^'"` ]+['"`]/g) ?? []
      fetchCalls.forEach(call => {
        expect(call).toContain('/api/compliance')
      })
    })

    it('CompliancePageClient nutzt kein localStorage mehr (Persistenz via API)', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/[locale]/(dashboard)/compliance/CompliancePageClient.tsx'), 'utf-8'
      )
      expect(source).not.toContain('localStorage')
    })

    it('Compliance-Inhalte kommen aus config, nicht vom Client', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/[locale]/(dashboard)/compliance/CompliancePageClient.tsx'), 'utf-8'
      )
      expect(source).toContain("from '@/config/compliance-data'")
    })
  })

  describe('DELETE /api/compliance/[id] — Eigentumscheck', () => {
    it('Route-Datei existiert', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/compliance/[id]/route.ts'), 'utf-8')
      expect(source.length).toBeGreaterThan(0)
    })

    it('DELETE-Handler prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/compliance/[id]/route.ts'), 'utf-8')
      expect(source).toContain('getUser()')
    })

    it('DELETE-Handler filtert nach user_id (verhindert Löschen fremder Daten)', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/compliance/[id]/route.ts'), 'utf-8')
      expect(source).toContain('user_id')
      expect(source).toContain('user.id')
    })

    it('DELETE-Handler filtert nach der übergebenen id (kein Bulk-Delete)', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/compliance/[id]/route.ts'), 'utf-8')
      expect(source).toContain('.eq(')
      expect(source).toContain("'id'")
    })
  })

  describe('DELETE /api/usecase/[id] — Eigentumscheck via uc_portfolios', () => {
    it('UseCase-DELETE prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/usecase/[id]/route.ts'), 'utf-8')
      expect(source).toContain('getUser()')
    })

    it('UseCase-DELETE nutzt uc_portfolios-Join für Eigentumsverifikation', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/usecase/[id]/route.ts'), 'utf-8')
      expect(source).toContain('uc_portfolios')
      expect(source).toContain('user_id')
    })

    it('UseCase-DELETE gibt 403 zurück wenn kein Eigentum nachgewiesen', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/usecase/[id]/route.ts'), 'utf-8')
      expect(source).toContain('403')
    })
  })

  describe('Preferences-API — primary_compliance_id + primary_usecase_id', () => {
    it('/api/preferences enthält primary_compliance_id im Schema', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/preferences/route.ts'), 'utf-8')
      expect(source).toContain('primary_compliance_id')
    })

    it('/api/preferences enthält primary_usecase_id im Schema', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/preferences/route.ts'), 'utf-8')
      expect(source).toContain('primary_usecase_id')
    })

    it('Governance-Page nutzt primary_compliance_id aus user_preferences als Fallback-Quelle', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/governance/page.tsx'), 'utf-8')
      expect(source).toContain('primary_compliance_id')
      expect(source).toContain('user_preferences')
    })

    it('UseCase-Page nutzt primary_compliance_id aus user_preferences als Fallback-Quelle', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/usecase/page.tsx'), 'utf-8')
      expect(source).toContain('primary_compliance_id')
      expect(source).toContain('user_preferences')
    })
  })
})
