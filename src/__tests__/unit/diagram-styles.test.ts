import { PERSONA_PRESETS, resolvePreset, renderableArt, DEFAULT_STYLE, type DiagramStyle } from '@/config/diagram-styles'

describe('diagram-styles', () => {
  it('Executive-Preset = Capability + Bebauungsplan + sparsam', () => {
    const s = PERSONA_PRESETS.executive.style
    expect(s.art).toBe('capability')
    expect(s.connections).toBe('bebauungsplan')
    expect(s.density).toBe('sparsam')
  })
  it('resolvePreset gibt bei unbekanntem Namen DEFAULT_STYLE zurück', () => {
    expect(resolvePreset('gibtsnicht')).toEqual(DEFAULT_STYLE)
  })
  it('resolvePreset kennt alle vier Persona-Namen', () => {
    for (const key of ['executive', 'architect', 'compliance', 'data'] as const) {
      const r: DiagramStyle = resolvePreset(key)
      expect(r.art).toBeDefined()
    }
  })
  it('renderableArt liefert ab Phase 2 alle Arten 1:1', () => {
    expect(renderableArt('schichten')).toBe('schichten')
    expect(renderableArt('togaf')).toBe('togaf')
    expect(renderableArt('datenfluss')).toBe('datenfluss')
    expect(renderableArt('capability')).toBe('capability')
  })
})
