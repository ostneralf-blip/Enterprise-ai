import { readFileSync } from 'fs'
import { join } from 'path'

const reportRoute = readFileSync(join(process.cwd(), 'src/app/api/export/[report]/route.ts'), 'utf-8')
// tier-check.ts zentralisiert Auth + 401/403 seit Sprint 19 (requireFeature)
const tierCheckSrc = readFileSync(join(process.cwd(), 'src/lib/utils/tier-check.ts'), 'utf-8')

describe('Security: /api/export/[report] (MERIDIAN, #223)', () => {
  it('erfordert Pro-Tier — requireFeature delegiert 401/403 an tier-check.ts', () => {
    expect(reportRoute).toContain("requireFeature('pdf_export')")
    expect(tierCheckSrc).toContain("status: 401")
    expect(tierCheckSrc).toContain("status: 403")
  })

  it('validiert locale via Zod (nur de|en, Default statt Client-Trust)', () => {
    expect(reportRoute).toContain("z.enum(['de', 'en'])")
  })

  it('validiert report-Typ gegen eine feste Allowlist statt beliebige Strings zu akzeptieren', () => {
    expect(reportRoute).toContain('REPORT_TYPES')
    expect(reportRoute).toContain("status: 404")
  })

  it('kein direkter Supabase-Zugriff ohne Auth-Gate (requireFeature läuft vor jeder Datenabfrage)', () => {
    const gateIndex = reportRoute.indexOf("requireFeature('pdf_export')")
    const renderIndex = reportRoute.indexOf('renderMeridianDummy(locale)')
    expect(gateIndex).toBeGreaterThan(-1)
    expect(renderIndex).toBeGreaterThan(gateIndex)
  })
})

describe('Security: Executive-Summary-Report (MERIDIAN, #224)', () => {
  it('lädt Executive-Summary-Daten erst nach dem Auth-Gate (kein Supabase-Zugriff vor requireFeature)', () => {
    const gateIndex = reportRoute.indexOf("requireFeature('pdf_export')")
    const dataIndex = reportRoute.indexOf('getExecutiveSummaryData(')
    expect(gateIndex).toBeGreaterThan(-1)
    expect(dataIndex).toBeGreaterThan(gateIndex)
  })

  it('nutzt die userId aus dem Gate-Ergebnis, nicht aus Client-Input', () => {
    expect(reportRoute).toContain('getExecutiveSummaryData(gate.userId, locale)')
  })

  it('gibt 404 zurück, wenn kein abgeschlossenes Assessment existiert, statt einen leeren Report zu rendern', () => {
    expect(reportRoute).toContain('if (!data)')
    expect(reportRoute).toMatch(/if \(!data\)[\s\S]{0,120}status: 404/)
  })

  it('"executive-summary" ist Teil der REPORT_TYPES-Allowlist', () => {
    expect(reportRoute).toContain("'executive-summary'")
  })
})

describe('Security: Phase-3-Reports + Gesamtdokument (MERIDIAN, #225)', () => {
  const gateIndex = reportRoute.indexOf("requireFeature('pdf_export')")

  it.each([
    ['readiness', 'getReadinessData('],
    ['usecase-portfolio', 'getUsecasePortfolioData('],
    ['compliance-status', 'getComplianceStatusData('],
    ['roadmap-status', 'getRoadmapStatusData('],
    ['architecture-status', 'getArchitectureStatusData('],
    ['full-report', 'getFullReportData('],
  ])('"%s" ist in der REPORT_TYPES-Allowlist und lädt Daten erst nach dem Auth-Gate', (reportType, dataFnCall) => {
    expect(reportRoute).toContain(`'${reportType}'`)
    const dataIndex = reportRoute.indexOf(dataFnCall)
    expect(dataIndex).toBeGreaterThan(-1)
    expect(dataIndex).toBeGreaterThan(gateIndex)
  })

  it('alle Datenlader werden mit gate.userId aufgerufen, nicht mit Client-Input', () => {
    expect(reportRoute).toContain('getReadinessData(gate.userId, locale)')
    expect(reportRoute).toContain('getUsecasePortfolioData(gate.userId)')
    expect(reportRoute).toContain('getComplianceStatusData(gate.userId, locale)')
    expect(reportRoute).toContain('getRoadmapStatusData(gate.userId, locale)')
    expect(reportRoute).toContain('getArchitectureStatusData(gate.userId, locale)')
    expect(reportRoute).toContain('getFullReportData(gate.userId, locale)')
  })

  it('jeder Phase-3-Report gibt 404 zurück statt eines leeren Reports, wenn keine Daten existieren', () => {
    const matches = reportRoute.match(/if \(!data\) return NextResponse\.json\([^)]*status: 404[^)]*\)/g) ?? []
    // executive-summary + 5 Phase-3-Reports + full-report = 7 eigenständige 404-Checks
    expect(matches.length).toBeGreaterThanOrEqual(7)
  })
})
