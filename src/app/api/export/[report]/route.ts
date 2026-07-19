import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFeature } from '@/lib/utils/tier-check'
import { renderPdf } from '@/lib/pdf/generate'
import { renderMeridianDummy } from '@/lib/pdf/meridian/reports/dummy'
import { renderMeridianExecutiveSummary } from '@/lib/pdf/meridian/reports/executive-summary'
import { getExecutiveSummaryData } from '@/lib/pdf/meridian/data/executive-summary'

// MERIDIAN-Report-Route (Issue #223/#224) — bewusst getrennt von
// /api/export/pdf (bestehendes book/board/blueprint-Templatesystem für die
// 7 Modul-Exports). MERIDIAN ist ein eigenständiges, hochwertigeres
// Management-Report-Design; [report] wählt den konkreten Report-Typ.
// "dummy" ist ausschließlich das Fundament-Testblatt aus Issue #223 und
// dient dem visuellen Abgleich mit Musterseite 1. "executive-summary" ist
// der erste echte Report (Issue #224).
const REPORT_TYPES = ['dummy', 'executive-summary'] as const
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
    if (report === 'executive-summary') {
      const data = await getExecutiveSummaryData(gate.userId, locale)
      if (!data) {
        return NextResponse.json({ error: 'Kein abgeschlossenes Assessment gefunden' }, { status: 404 })
      }
      doc = renderMeridianExecutiveSummary(data, locale)
    } else {
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
