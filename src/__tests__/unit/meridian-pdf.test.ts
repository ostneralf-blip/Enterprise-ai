import { renderMeridianDummy } from '@/lib/pdf/meridian/reports/dummy'
import { renderPdf } from '@/lib/pdf/generate'

// MERIDIAN-Fundament (Issue #223) — Test-Gate laut CLAUDE.md ("Bei PDF/Export-
// Features: Integration-Test für die Template-Generierung"). Prüft, dass der
// Komponentenbaum (ReportHeader/ReportFooter/RingGauge/MeterBar/Badge/
// StatCard/TickRuler) für beide Sprachen ohne Fehler durchläuft — die reale
// Font-Kompatibilität (Google-Fonts-CDN vs. raw.githubusercontent.com für IBM
// Plex Mono, siehe fonts.ts) wurde separat manuell mit echtem Netzwerkzugriff
// verifiziert, da der Jest-Mock keine echten Fontdateien lädt.
async function isPdf(doc: ReturnType<typeof renderMeridianDummy>): Promise<boolean> {
  const buf = await renderPdf({ document: doc, filename: 'test.pdf' })
  return buf.slice(0, 4).toString() === '%PDF'
}

describe('MERIDIAN-Fundament — Dummy-Report (#223)', () => {
  it('rendert DE ohne Fehler', async () => {
    expect(await isPdf(renderMeridianDummy('de'))).toBe(true)
  })

  it('rendert EN ohne Fehler', async () => {
    expect(await isPdf(renderMeridianDummy('en'))).toBe(true)
  })
})
