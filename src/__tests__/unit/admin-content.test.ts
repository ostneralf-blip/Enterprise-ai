import { readFileSync } from 'fs'
import { join } from 'path'

describe('Unit: Admin Content Library', () => {
  describe('Migration 003_admin_panel.sql', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase/migrations/003_admin_panel.sql'), 'utf-8')

    it('adds is_admin column to profiles', () => {
      expect(sql).toContain('ALTER TABLE public.profiles')
      expect(sql).toContain('is_admin BOOLEAN NOT NULL DEFAULT false')
    })

    it('creates is_admin() helper function with SECURITY DEFINER', () => {
      expect(sql).toContain('CREATE OR REPLACE FUNCTION public.is_admin()')
      expect(sql).toContain('SECURITY DEFINER')
    })

    it('creates content_library table', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.content_library')
    })

    it('content_library has required columns', () => {
      expect(sql).toContain('module')
      expect(sql).toContain('category')
      expect(sql).toContain('title')
      expect(sql).toContain('content')
      expect(sql).toContain('source')
      expect(sql).toContain('tags')
    })

    it('enables RLS on content_library', () => {
      expect(sql).toContain('ALTER TABLE public.content_library ENABLE ROW LEVEL SECURITY')
    })

    it('has admin_all policy using is_admin() helper', () => {
      expect(sql).toContain('"admin_all"')
      expect(sql).toContain('public.is_admin()')
    })

    it('has authenticated read policy', () => {
      expect(sql).toContain('"authenticated_read"')
      expect(sql).toContain("auth.role() = 'authenticated'")
    })
  })

  describe('admin-check utility', () => {
    const source = readFileSync(join(process.cwd(), 'src/lib/utils/admin-check.ts'), 'utf-8')

    it('uses supabase server client', () => {
      expect(source).toContain("from '@/lib/supabase/server'")
    })

    it('checks auth.getUser()', () => {
      expect(source).toContain('supabase.auth.getUser()')
    })

    it('reads is_admin from profiles', () => {
      expect(source).toContain("'is_admin'")
      expect(source).toContain('.eq(')
    })

    it('throws FORBIDDEN for non-admin', () => {
      expect(source).toContain("throw new Error('FORBIDDEN')")
    })

    it('throws UNAUTHORIZED for unauthenticated', () => {
      expect(source).toContain("throw new Error('UNAUTHORIZED')")
    })
  })
})
