// WatchlistCard.tsx importiert 'next-intl' (reines ESM) — ohne diesen Mock bricht
// die Suite beim Laden mit SyntaxError ab (dokumentierte Baseline-Ursache in der
// CLAUDE.md). Lokal gemockt wie im Phase-3-Report-Test, nicht global.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock()-Factory wird gehoisted, ES-Import geht hier nicht
jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))

import { computeCountdown } from '@/components/modules/WatchlistCard'

// Non-Null-Helper für die Fälle mit gesetztem Stichtag — computeCountdown gibt
// seit Issue #262 CountdownInfo | null zurück (null bei deadline null/undefined).
const cd = (deadline: string, today?: Date) => {
  const result = computeCountdown(deadline, today)
  if (!result) throw new Error('erwartete CountdownInfo, erhielt null')
  return result
}

describe('computeCountdown', () => {
  it('zeigt grünen Badge für mehr als 12 Monate', () => {
    const today = new Date('2026-07-07')
    const result = cd('2027-12-01', today)
    expect(result.months).toBeGreaterThanOrEqual(12)
    expect(result.className).toContain('emerald')
  })

  it('zeigt amber Badge für 3–11 Monate', () => {
    const today = new Date('2027-03-01')
    const result = cd('2027-09-01', today)
    expect(result.className).toContain('amber')
  })

  it('zeigt roten Badge für weniger als 3 Monate', () => {
    const today = new Date('2027-10-01')
    const result = cd('2027-12-01', today)
    expect(result.className).toContain('red')
  })

  it('zeigt roten Badge und negative Tage für überschrittenen Stichtag', () => {
    const today = new Date('2028-01-01')
    const result = cd('2027-12-01', today)
    expect(result.days).toBeLessThan(0)
    expect(result.className).toContain('red')
  })

  it('gibt months=0 zurück wenn unter 30 Tage verbleiben', () => {
    const today = new Date('2027-11-20')
    const result = cd('2027-12-01', today)
    expect(result.months).toBe(0)
    expect(result.days).toBeGreaterThan(0)
    expect(result.className).toContain('red')
  })

  it('gibt korrekte Monatsanzahl für bekannten Stichtag zurück', () => {
    const today = new Date('2026-07-07')
    const result = cd('2027-12-01', today)
    // Juli 2026 → Dez 2027 = ca. 17 Monate
    expect(result.months).toBe(17)
  })

  it('gibt null zurück für deadline null (kein Countdown-Badge)', () => {
    expect(computeCountdown(null)).toBeNull()
  })

  it('gibt null zurück für deadline undefined (kein Countdown-Badge)', () => {
    expect(computeCountdown(undefined)).toBeNull()
  })

  it('gibt roten Badge für einen Stichtag in unter drei Monaten (Art.-50-Kennzeichnung)', () => {
    const today = new Date('2026-09-14')
    const result = cd('2026-12-02', today)
    expect(result.months).toBeLessThan(3)
    expect(result.className).toContain('red')
  })
})
