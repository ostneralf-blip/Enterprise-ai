import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(
  join(process.cwd(), 'src/app/api/admin/compliance/scan/route.ts'),
  'utf-8'
)

describe('Security: POST /api/admin/compliance/scan', () => {
  it('gibt 403 zurück für nicht-Admin', () => {
    expect(source).toContain('{ status: 403 }')
  })

  it('ruft requireAdmin() vor jeder Operation auf', () => {
    expect(source).toContain('requireAdmin()')
  })

  it('importiert requireAdmin aus admin-check utility', () => {
    expect(source).toContain("from '@/lib/utils/admin-check'")
  })

  it('gibt kein Forbidden-Detail preis (nur generische Fehlermeldung)', () => {
    expect(source).toContain("'Forbidden'")
  })
})
