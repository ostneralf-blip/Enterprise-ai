import { scoreToCoord } from '@/components/modules/usecase/UseCaseMatrix'

describe('scoreToCoord', () => {
  const S = 400

  it('mappt Score 1 auf 8 % der Achse', () => {
    expect(scoreToCoord(1, S)).toBeCloseTo(0.08 * S, 5)
  })

  it('mappt Score 5 auf 92 % der Achse', () => {
    expect(scoreToCoord(5, S)).toBeCloseTo(0.92 * S, 5)
  })

  it('mappt Score 3 auf die Mitte (50 %)', () => {
    expect(scoreToCoord(3, S)).toBeCloseTo(0.5 * S, 5)
  })

  it('clampt Werte unter 1 auf den Minimalwert', () => {
    expect(scoreToCoord(0, S)).toBeCloseTo(scoreToCoord(1, S), 5)
    expect(scoreToCoord(-5, S)).toBeCloseTo(scoreToCoord(1, S), 5)
  })

  it('clampt Werte über 5 auf den Maximalwert', () => {
    expect(scoreToCoord(6, S)).toBeCloseTo(scoreToCoord(5, S), 5)
    expect(scoreToCoord(100, S)).toBeCloseTo(scoreToCoord(5, S), 5)
  })

  it('skaliert korrekt mit unterschiedlichen SVG-Größen', () => {
    const sizes = [88, 200, 400, 800]
    sizes.forEach(size => {
      expect(scoreToCoord(1, size)).toBeCloseTo(0.08 * size, 5)
      expect(scoreToCoord(5, size)).toBeCloseTo(0.92 * size, 5)
    })
  })
})
