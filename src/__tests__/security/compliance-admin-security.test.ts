import { readFileSync } from 'fs'
import { join } from 'path'

// Statik-Checks für den Admin-CRUD der Compliance-Regularien (#245).
const src = readFileSync(join(process.cwd(), 'src/app/api/admin/compliance/regulations/route.ts'), 'utf-8')

describe('Security: /api/admin/compliance/regulations', () => {
  it('gatet jede Methode über requireAdmin (403 für Nicht-Admins)', () => {
    expect(src).toContain('requireAdmin')
    expect(src).toContain('status: 403')
    // guard() wird in GET, POST und DELETE aufgerufen
    expect((src.match(/const g = await guard\(\)/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('nutzt den Admin-Client (RLS-Bypass nur nach Admin-Gate)', () => {
    expect(src).toContain('createAdminClient')
    expect(src).not.toContain("from '@/lib/supabase/server'\nimport { createClient }")
  })

  it('validiert Eingaben via Zod inkl. URL für source_url und Datumsformat für last_verified', () => {
    expect(src).toContain('safeParse')
    expect(src).toContain('status: 422')
    expect(src).toContain('.url(')
    expect(src).toMatch(/last_verified[\s\S]*\\d\{4\}-\\d\{2\}-\\d\{2\}/)
  })

  it('kapselt das locale-per-row-Modell — Upserts schreiben beide Locale-Zeilen', () => {
    expect(src).toContain("const LOCALES = ['de', 'en']")
    expect(src).toContain("onConflict: 'slug,locale'")
    expect(src).toContain("onConflict: 'regulation_id,item_key'")
  })
})
