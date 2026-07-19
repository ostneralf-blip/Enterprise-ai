import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFeature } from '@/lib/utils/tier-check'
import { renderPdf } from '@/lib/pdf/generate'
import { renderMeridianDummy } from '@/lib/pdf/meridian/reports/dummy'
import { renderMeridianExecutiveSummary } from '@/lib/pdf/meridian/reports/executive-summary'
import { getExecutiveSummaryData } from '@/lib/pdf/meridian/data/executive-summary'
import { renderMeridianReadiness } from '@/lib/pdf/meridian/reports/readiness'
import { getReadinessData } from '@/lib/pdf/meridian/data/readiness'
import { renderMeridianUsecasePortfolio } from '@/lib/pdf/meridian/reports/usecase-portfolio'
import { getUsecasePortfolioData } from '@/lib/pdf/meridian/data/usecase-portfolio'
import { renderMeridianComplianceStatus } from '@/lib/pdf/meridian/reports/compliance-status'
import { getComplianceStatusData } from '@/lib/pdf/meridian/data/compliance-status'
import { renderMeridianRoadmapStatus } from '@/lib/pdf/meridian/reports/roadmap-status'
import { getRoadmapStatusData } from '@/lib/pdf/meridian/data/roadmap-status'
import { renderMeridianArchitectureStatus } from '@/lib/pdf/meridian/reports/architecture-status'
import { getArchitectureStatusData } from '@/lib/pdf/meridian/data/architecture-status'
import { renderMeridianFullReport } from '@/lib/pdf/meridian/reports/full-report'
import { getFullReportData } from '@/lib/pdf/meridian/data/full-report'

// MERIDIAN-Report-Route (Issue #223/#224/#225) — bewusst getrennt von
// /api/export/pdf (bestehendes book/board/blueprint-Templatesystem für die
// 7 Modul-Exports). MERIDIAN ist ein eigenständiges, hochwertigeres
// Management-Report-Design; [report] wählt den konkreten Report-Typ.
// "dummy" ist ausschließlich das Fundament-Testblatt aus Issue #223.
// "full-report" kombiniert alle verfügbaren Einzelreports zu einem
// Gesamtdokument mit fortlaufender Paginierung (siehe reports/full-report.tsx).
const REPORT_TYPES = [
  'dummy',
  'executive-summary',
  'readiness',
  'usecase-portfolio',
  'compliance-status',
  'roadmap-status',
  'architecture-status',
  'full-report',
] as const
type ReportType = typeof REPORT_TYPES[number]

const querySchema = z.object({
  locale: z.enum(['de', 'en']).default('de'),
})

export const maxDuration = 30

export async function GET(
  req: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  try {
    const { report } = await params
    if (!REPORT_TYPES.includes(report as ReportType)) {
      return NextResponse.json({ error: 'Unbekannter Report-Typ' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({ locale: searchParams.get('locale') ?? undefined })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
    }
    const { locale } = parsed.data

    // Pro-gated wie der bestehende PDF-Export (Middleware-freundlich, siehe
    // /api/export/pdf) — dieselbe Feature-Flag, damit Tier-Logik an einer
    // einzigen Stelle (config/tiers.ts) gepflegt wird.
    const gate = await requireFeature('pdf_export')
    if (gate instanceof NextResponse) return gate

    let doc
    switch (report as ReportType) {
      case 'executive-summary': {
        const data = await getExecutiveSummaryData(gate.userId, locale)
        if (!data) return NextResponse.json({ error: 'Kein abgeschlossenes Assessment gefunden' }, { status: 404 })
        doc = renderMeridianExecutiveSummary(data, locale)
        break
      }
      case 'readiness': {
        const data = await getReadinessData(gate.userId, locale)
        if (!data) return NextResponse.json({ error: 'Kein abgeschlossenes Assessment gefunden' }, { status: 404 })
        doc = renderMeridianReadiness(data, locale)
        break
      }
      case 'usecase-portfolio': {
        const data = await getUsecasePortfolioData(gate.userId)
        if (!data) return NextResponse.json({ error: 'Kein bewerteter Use-Case gefunden' }, { status: 404 })
        doc = renderMeridianUsecasePortfolio(data, locale)
        break
      }
      case 'compliance-status': {
        const data = await getComplianceStatusData(gate.userId, locale)
        if (!data) return NextResponse.json({ error: 'Keine Compliance-Daten gefunden' }, { status: 404 })
        doc = renderMeridianComplianceStatus(data, locale)
        break
      }
      case 'roadmap-status': {
        const data = await getRoadmapStatusData(gate.userId, locale)
        if (!data) return NextResponse.json({ error: 'Keine gespeicherte Roadmap gefunden' }, { status: 404 })
        doc = renderMeridianRoadmapStatus(data, locale)
        break
      }
      case 'architecture-status': {
        const data = await getArchitectureStatusData(gate.userId, locale)
        if (!data) return NextResponse.json({ error: 'Keine gespeicherte Architektur gefunden' }, { status: 404 })
        doc = renderMeridianArchitectureStatus(data, locale)
        break
      }
      case 'full-report': {
        const data = await getFullReportData(gate.userId, locale)
        if (!data) return NextResponse.json({ error: 'Kein abgeschlossenes Assessment gefunden' }, { status: 404 })
        doc = renderMeridianFullReport(data, locale)
        break
      }
      default:
        doc = renderMeridianDummy(locale)
    }
    const filename = `ai-navigator-${report}-${locale}.pdf`
    const pdfBuffer = await renderPdf({ document: doc, filename })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('MERIDIAN PDF export error:', detail, err)
    return NextResponse.json({ error: 'PDF-Generierung fehlgeschlagen', detail }, { status: 500 })
  }
}
