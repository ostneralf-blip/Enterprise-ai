// 'next-intl' ist reines ESM und bricht in Jest sonst mit einer SyntaxError ab
// (siehe __tests__/test-utils/next-intl-mock.js) — hier bewusst nur lokal
// aktiviert, nicht global über jest.config.ts (siehe #224-Kommentar dort).
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock()-Factory wird gehoisted, ES-Import geht hier nicht
jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))

import { EU_AI_ACT_MILESTONES } from '@/lib/pdf/meridian/reports/compliance-status'

// Issue #262: Nach Verordnung (EU) 2026/1744 („Digital Omnibus on AI") liegen die
// Hochrisiko-Stichtage bei 02.12.2027 (Anhang III) und 02.08.2028 (Anhang I).
// Dieser Test fängt einen künftigen Rückschritt hinter den 02.12.2027 auf.
describe('EU_AI_ACT_MILESTONES (Compliance-Status-PDF)', () => {
  const HIGH_RISK_FLOOR = Date.UTC(2027, 11, 2) // 02.12.2027

  it('kein Hochrisiko-Meilenstein liegt vor dem 02.12.2027', () => {
    const highRisk = EU_AI_ACT_MILESTONES.filter(m => m.key.startsWith('milestoneHighRisk'))
    expect(highRisk.length).toBeGreaterThanOrEqual(2)
    for (const m of highRisk) {
      expect(m.dateMs).toBeGreaterThanOrEqual(HIGH_RISK_FLOOR)
    }
  })

  it('enthält die vom Digital Omnibus gesetzten Stichtage', () => {
    const byKey = Object.fromEntries(EU_AI_ACT_MILESTONES.map(m => [m.key, m.dateMs]))
    expect(byKey.milestoneTransparency).toBe(Date.UTC(2026, 7, 2))   // 02.08.2026 Art. 50
    expect(byKey.milestoneWatermarking).toBe(Date.UTC(2026, 11, 2))  // 02.12.2026 Kennzeichnung
    expect(byKey.milestoneHighRisk).toBe(Date.UTC(2027, 11, 2))      // 02.12.2027 Anhang III
    expect(byKey.milestoneHighRiskAnnex1).toBe(Date.UTC(2028, 7, 2)) // 02.08.2028 Anhang I
  })

  it('führt keinen überholten Stichtag mehr (02.08.2026/02.08.2027) als Hochrisiko', () => {
    const highRisk = EU_AI_ACT_MILESTONES.filter(m => m.key.startsWith('milestoneHighRisk'))
    expect(highRisk.some(m => m.dateMs === Date.UTC(2026, 7, 2))).toBe(false)
    expect(highRisk.some(m => m.dateMs === Date.UTC(2027, 7, 2))).toBe(false)
    // der frühere „Übergang Ende" (02.08.2027) ist ersatzlos entfallen
    expect(EU_AI_ACT_MILESTONES.some(m => m.dateMs === Date.UTC(2027, 7, 2))).toBe(false)
  })

  it('ist chronologisch sortiert', () => {
    const dates = EU_AI_ACT_MILESTONES.map(m => m.dateMs)
    const sorted = [...dates].sort((a, b) => a - b)
    expect(dates).toEqual(sorted)
  })
})
