import { readFileSync } from 'fs'
import { join } from 'path'

// Statik-Checks fürs Free-Tageslimit fürs Speichern (Issue #222). Kein Laufzeit-Mock
// nötig — wir verifizieren, dass Enforcement + Konfiguration korrekt verdrahtet sind.
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf-8')

const quotaLib = read('src/lib/tier/save-quota.ts')
const tiers = read('src/config/tiers.ts')

describe('Security: Free-Tageslimit fürs Speichern (enforceSaveQuota)', () => {
  it('greift nur bei Free — Pro/Enterprise unbegrenzt', () => {
    expect(quotaLib).toContain("if (tier !== 'free') return null")
  })

  it('setzt das Limit atomar über die RPC increment_save_usage durch', () => {
    expect(quotaLib).toContain('increment_save_usage')
    expect(quotaLib).toContain('FREE_DAILY_SAVES_PER_MODULE')
  })

  it('antwortet bei erreichtem Limit mit 429 + Code SAVE_LIMIT_REACHED', () => {
    expect(quotaLib).toContain('SAVE_LIMIT_REACHED')
    expect(quotaLib).toContain('status: 429')
  })

  it('config/tiers: save_results ist free, Tageslimit-Konstante definiert', () => {
    expect(tiers).toMatch(/save_results:\s*'free'/)
    expect(tiers).toContain('FREE_DAILY_SAVES_PER_MODULE')
  })

  it.each(['canvas', 'governance', 'roadmap'])('Save-Route /api/%s ruft enforceSaveQuota beim Anlegen auf', (mod) => {
    const route = read(`src/app/api/${mod}/route.ts`)
    expect(route).toContain('enforceSaveQuota')
  })

  it('Assessment-Finalisierung ruft enforceSaveQuota (nur bei completed)', () => {
    const idRoute = read('src/app/api/assessment/[id]/route.ts')
    expect(idRoute).toContain('enforceSaveQuota')
  })
})
