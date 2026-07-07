import { computeCountdown } from '@/components/modules/WatchlistCard'

describe('computeCountdown', () => {
  it('zeigt grünen Badge für mehr als 12 Monate', () => {
    const today = new Date('2026-07-07')
    const result = computeCountdown('2027-12-01', today)
    expect(result.label).toMatch(/noch \d+ Monate/)
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

  it('zeigt roten Badge für überschrittenen Stichtag', () => {
    const today = new Date('2028-01-01')
    const result = computeCountdown('2027-12-01', today)
    expect(result.label).toBe('⏱ Stichtag überschritten')
    expect(result.className).toContain('red')
  })

  it('zeigt Tage statt Monate wenn unter 30 Tage verbleiben', () => {
    const today = new Date('2027-11-20')
    const result = computeCountdown('2027-12-01', today)
    expect(result.label).toMatch(/noch \d+ Tag/)
    expect(result.className).toContain('red')
  })

  it('gibt korrekte Monatsanzahl für bekannten Stichtag zurück', () => {
    const today = new Date('2026-07-07')
    const result = computeCountdown('2027-12-01', today)
    // Juli 2026 → Dez 2027 = ca. 17 Monate
    expect(result.label).toContain('17')
  })
})
