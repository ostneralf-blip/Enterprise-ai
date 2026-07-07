import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(
  join(process.cwd(), 'src/app/api/admin/compliance/drafts/route.ts'),
  'utf-8'
)

describe('Security: /api/admin/compliance/drafts', () => {
  it('GET gibt 403 zurück für nicht-Admin', () => {
    expect(source).toContain('{ status: 403 }')
  })

  it('ruft requireAdmin() in GET und PATCH auf', () => {
    const matches = source.match(/requireAdmin\(\)/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBeGreaterThanOrEqual(2)
  })

  it('importiert requireAdmin aus admin-check utility', () => {
    expect(source).toContain("from '@/lib/utils/admin-check'")
  })

  it('PATCH validiert Input mit Zod', () => {
    expect(source).toContain('PatchSchema')
    expect(source).toContain('safeParse')
    expect(source).toContain('{ status: 400 }')
  })

  it('PATCH akzeptiert nur gültige review_status-Werte', () => {
    expect(source).toContain('beruecksichtigt')
    expect(source).toContain('ignoriert')
    expect(source).toContain('z.enum')
  })

  it('PATCH prüft UUID-Format für id', () => {
    expect(source).toContain('z.string().uuid()')
  })
})
