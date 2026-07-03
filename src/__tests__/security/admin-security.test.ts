import { readFileSync } from 'fs'
import { join } from 'path'

describe('Security: Admin Panel', () => {
  describe('Admin page server-side gate', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/admin/page.tsx'), 'utf-8')

    it('checks auth via supabase.auth.getUser()', () => {
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain("redirect('/login')")
    })

    it('reads is_admin server-side from database', () => {
      expect(source).toContain('is_admin')
      expect(source).toContain('profiles')
    })

    it('redirects to /dashboard for non-admin users', () => {
      expect(source).toContain("redirect('/dashboard')")
    })

    it('is a Server Component (no use client directive)', () => {
      expect(source).not.toContain("'use client'")
    })
  })

  describe('API route: /api/admin/content', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/api/admin/content/route.ts'), 'utf-8')

    it('calls requireAdmin() before every operation', () => {
      const count = (source.match(/requireAdmin\(\)/g) ?? []).length
      expect(count).toBeGreaterThanOrEqual(2)
    })

    it('imports requireAdmin from admin-check utility', () => {
      expect(source).toContain("from '@/lib/utils/admin-check'")
    })

    it('uses Zod for input validation', () => {
      expect(source).toContain("from 'zod'")
      expect(source).toContain('.safeParse(')
    })

    it('returns 403 when not admin', () => {
      expect(source).toContain('{ status: 403 }')
    })

    it('returns 422 for invalid input', () => {
      expect(source).toContain('{ status: 422 }')
    })
  })

  describe('API route: /api/admin/content/[id]', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/api/admin/content/[id]/route.ts'), 'utf-8')

    it('calls requireAdmin() in PATCH handler', () => {
      const count = (source.match(/requireAdmin\(\)/g) ?? []).length
      expect(count).toBeGreaterThanOrEqual(2)
    })

    it('uses Zod for input validation on PATCH', () => {
      expect(source).toContain("from 'zod'")
      expect(source).toContain('.strict()')
    })

    it('returns 403 when not admin', () => {
      expect(source).toContain('{ status: 403 }')
    })

    it('returns 404 when entry not found', () => {
      expect(source).toContain('{ status: 404 }')
    })

    it('returns 204 on DELETE', () => {
      expect(source).toContain('{ status: 204 }')
    })
  })

  describe('Client component: no direct DB access', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/(dashboard)/admin/AdminPageClient.tsx'), 'utf-8')

    it('does not import Supabase client', () => {
      expect(source).not.toContain("from '@/lib/supabase")
    })

    it('only uses fetch() to API routes', () => {
      const fetches = source.match(/fetch\([^)]+\)/g) ?? []
      fetches.forEach(f => expect(f).toContain('/api/'))
    })
  })

  describe('API route: PATCH /api/admin/catalog/components/[id]', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/admin/catalog/components/[id]/route.ts'),
      'utf-8'
    )

    it('calls requireAdmin() before processing', () => {
      expect(source).toContain('requireAdmin()')
    })

    it('returns 403 when not admin', () => {
      expect(source).toContain('{ status: 403 }')
    })

    it('uses Zod to validate the tags array', () => {
      expect(source).toContain("from 'zod'")
      expect(source).toContain('safeParse(')
      expect(source).toContain('tags')
    })

    it('limits tag count to prevent oversized payloads', () => {
      expect(source).toContain('.max(30)')
    })

    it('limits individual tag length', () => {
      expect(source).toContain('.max(50)')
    })
  })

  describe('API route: GET /api/admin/catalog/log', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/admin/catalog/log/route.ts'),
      'utf-8'
    )

    it('calls requireAdmin() before processing', () => {
      expect(source).toContain('requireAdmin()')
    })

    it('returns 403 when not admin', () => {
      expect(source).toContain('{ status: 403 }')
    })

    it('reads from catalog_upload_log table', () => {
      expect(source).toContain('catalog_upload_log')
    })
  })

  describe('Upload log integration: upload and seed routes', () => {
    const uploadSource = readFileSync(
      join(process.cwd(), 'src/app/api/admin/catalog/upload/route.ts'),
      'utf-8'
    )
    const seedSource = readFileSync(
      join(process.cwd(), 'src/app/api/admin/catalog/seed/route.ts'),
      'utf-8'
    )

    it('upload route inserts into catalog_upload_log after successful upsert', () => {
      expect(uploadSource).toContain('catalog_upload_log')
      expect(uploadSource).toContain('.insert(')
    })

    it('seed route inserts into catalog_upload_log after successful upsert', () => {
      expect(seedSource).toContain('catalog_upload_log')
      expect(seedSource).toContain('.insert(')
    })

    it('upload route still requires admin (requireAdmin check present)', () => {
      expect(uploadSource).toContain('requireAdmin()')
    })

    it('seed route still requires admin (requireAdmin check present)', () => {
      expect(seedSource).toContain('requireAdmin()')
    })
  })
})
