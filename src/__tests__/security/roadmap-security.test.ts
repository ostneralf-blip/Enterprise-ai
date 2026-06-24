import { readFileSync } from 'fs'
import { join } from 'path'

describe('Security: Roadmap-Generator', () => {

  describe('Auth-Check (statischer Code-Check)', () => {
    it('Roadmap-Page prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/roadmap/page.tsx'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain("redirect('/login')")
    })

    it('Roadmap-Page liest Assessment-Daten server-seitig aus assessment_sessions (kein Client-Trust)', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/roadmap/page.tsx'), 'utf-8')
      expect(source).toContain('assessment_sessions')
      expect(source).toContain('user_id')
    })
  })

  describe('Client-Komponente kein direkter Supabase-Zugriff', () => {
    it('RoadmapPageClient importiert keinen Supabase-Client', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/(dashboard)/roadmap/RoadmapPageClient.tsx'), 'utf-8'
      )
      expect(source).not.toContain("from '@/lib/supabase")
    })

    it('RoadmapPageClient nutzt fetch() nur für eigene API-Route (kein direkter DB-Zugriff)', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/(dashboard)/roadmap/RoadmapPageClient.tsx'), 'utf-8'
      )
      expect(source).toContain('/api/roadmap')
      expect(source).not.toContain("from '@/lib/supabase")
    })
  })
})
