import { readFileSync } from 'fs'
import { join } from 'path'

describe('Security: AI Use-Case Canvas', () => {

  describe('Auth-Check (statischer Code-Check)', () => {
    it('Canvas-Page prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/canvas/page.tsx'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain("redirect('/login')")
    })

    it('Canvas-Page liest Canvases server-seitig mit user_id-Filter', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/canvas/page.tsx'), 'utf-8')
      expect(source).toContain('canvases')
      expect(source).toContain('user_id')
    })
  })

  describe('API-Route Auth', () => {
    it('GET /api/canvas prüft Auth', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/canvas/route.ts'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain('status: 401')
    })

    it('POST /api/canvas prüft Auth', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/canvas/route.ts'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain('status: 401')
    })

    it('PATCH /api/canvas/[id] prüft Auth und filtert per user_id', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/canvas/[id]/route.ts'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain('status: 401')
      expect(source).toContain('.eq(\'user_id\', user.id)')
    })

    it('DELETE /api/canvas/[id] prüft Auth und filtert per user_id', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/canvas/[id]/route.ts'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain('.eq(\'user_id\', user.id)')
    })

    it('PATCH validiert Input via Zod', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/api/canvas/[id]/route.ts'), 'utf-8')
      expect(source).toContain('CanvasUpdateSchema')
      expect(source).toContain('safeParse')
      expect(source).toContain('status: 400')
    })
  })

  describe('Client-Komponente kein direkter Supabase-Zugriff', () => {
    it('CanvasPageClient importiert keinen Supabase-Client', () => {
      const source = readFileSync(
        join(process.cwd(), 'src/app/(dashboard)/canvas/CanvasPageClient.tsx'), 'utf-8'
      )
      expect(source).not.toContain("from '@/lib/supabase")
    })
  })
})
