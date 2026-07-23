import { render } from '@testing-library/react'
import { Eyebrow, SectionTitle, CardTitle, BodyText, HintText, MetaText, Badge } from '@/components/shared/typography'

// #205 Element 3: kanonische Textelement-Hierarchie.
describe('typography-Komponenten', () => {
  it('Eyebrow rendert Text mit Primär-/Versal-Klassen', () => {
    const { getByText } = render(<Eyebrow>Kontext</Eyebrow>)
    const el = getByText('Kontext')
    expect(el.tagName).toBe('P')
    expect(el.className).toContain('text-primary')
    expect(el.className).toContain('uppercase')
  })

  it('SectionTitle nutzt h2 standardmäßig, respektiert as-Prop', () => {
    const { getByText, rerender } = render(<SectionTitle>Titel</SectionTitle>)
    expect(getByText('Titel').tagName).toBe('H2')
    rerender(<SectionTitle as="h3">Titel</SectionTitle>)
    expect(getByText('Titel').tagName).toBe('H3')
  })

  it('CardTitle rendert als h3', () => {
    const { getByText } = render(<CardTitle>Karte</CardTitle>)
    expect(getByText('Karte').tagName).toBe('H3')
  })

  it('BodyText nutzt Sekundär-Text-Ton', () => {
    const { getByText } = render(<BodyText>Beschreibung</BodyText>)
    expect(getByText('Beschreibung').className).toContain('text-ink-secondary')
  })

  it('HintText wählt Ton-Farbe je tone', () => {
    const { getByText } = render(<HintText tone="warning">Achtung</HintText>)
    expect(getByText('Achtung').className).toContain('text-warning-text')
  })

  it('MetaText ist mono', () => {
    const { getByText } = render(<MetaText>Modell · Zeit</MetaText>)
    expect(getByText('Modell · Zeit').className).toContain('font-mono')
  })

  it('Badge rendert Pill mit Ton', () => {
    const { getByText } = render(<Badge tone="success">Aktiv</Badge>)
    const el = getByText('Aktiv')
    expect(el.tagName).toBe('SPAN')
    expect(el.className).toContain('success-subtle')
    expect(el.className).toContain('rounded-full')
  })

  it('className wird durchgereicht (Merge via cn)', () => {
    const { getByText } = render(<SectionTitle className="mb-4">X</SectionTitle>)
    expect(getByText('X').className).toContain('mb-4')
  })
})
