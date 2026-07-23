import { readFileSync } from 'fs'
import { join } from 'path'

// Statik-Checks für Deep-Check (#250) + Draft-Übernahme (#251).
const deepRoute = readFileSync(join(process.cwd(), 'src/app/api/admin/compliance/deep-check/route.ts'), 'utf-8')
const deepLib = readFileSync(join(process.cwd(), 'src/lib/compliance/deep-check.ts'), 'utf-8')
const draftsRoute = readFileSync(join(process.cwd(), 'src/app/api/admin/compliance/drafts/route.ts'), 'utf-8')

describe('Security: Compliance Deep-Check (#250/#251)', () => {
  it('Deep-Check-Route gatet über requireAdmin (403) + Zod-Slug', () => {
    expect(deepRoute).toContain('requireAdmin')
    expect(deepRoute).toContain('status: 403')
    expect(deepRoute).toContain('safeParse')
  })

  it('Deep-Check-Route setzt maxDuration (langlaufende LLM-Calls)', () => {
    expect(deepRoute).toMatch(/export const maxDuration/)
  })

  it('Deep-Check publiziert NICHT automatisch — schreibt nur Drafts', () => {
    expect(deepLib).toContain('compliance_source_drafts')
    expect(deepLib).not.toMatch(/update[\s\S]{0,120}compliance_checklist_items/)
  })

  it('Draft-Übernahme (#251) schreibt suggested_value nur bei beruecksichtigt + Deep-Check-Draft', () => {
    expect(draftsRoute).toContain("review_status === 'beruecksichtigt'")
    expect(draftsRoute).toContain('checklist_item_id')
    expect(draftsRoute).toContain('suggested_value')
    expect(draftsRoute).toContain('compliance_checklist_items')
    expect(draftsRoute).toContain('last_verified')
  })
})
