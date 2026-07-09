import { computeCountdown } from '@/components/modules/WatchlistCard'

describe('computeCountdown', () => {
  it('zeigt grünen Badge für mehr als 12 Monate', () => {
    const today = new Date('2026-07-07')
    const result = computeCountdown('2027-12-01', today)
    expect(result.months).toBeGreaterThanOrEqual(12)
    expect(result.className).toContain('emerald')
  })

  it('zeigt amber Badge für 3–11 Monate', () => {
    const today = new Date('2027-03-01')
    const result = computeCountdown('2027-09-01', today)
    expect(result.className).toContain('amber')
  })

  it('zeigt roten Badge für weniger als 3 Monate', () => {
    const today = new Date('2027-10-01')
    const result = computeCountdown('2027-12-01', today)
    expect(result.className).toContain('red')
  })

  it('zeigt roten Badge und negative Tage für überschrittenen Stichtag', () => {
    const today = new Date('2028-01-01')
    const result = computeCountdown('2027-12-01', today)
    expect(result.days).toBeLessThan(0)
    expect(result.className).toContain('red')
  })

  it('gibt months=0 zurück wenn unter 30 Tage verbleiben', () => {
    const today = new Date('2027-11-20')
    const result = computeCountdown('2027-12-01', today)
    expect(result.months).toBe(0)
    expect(result.days).toBeGreaterThan(0)
    expect(result.className).toContain('red')
  })

  it('gibt korrekte Monatsanzahl für bekannten Stichtag zurück', () => {
    const today = new Date('2026-07-07')
    const result = computeCountdown('2027-12-01', today)
    // Juli 2026 → Dez 2027 = ca. 17 Monate
    expect(result.months).toBe(17)
  })
})
