import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderPdf } from '@/lib/pdf/generate'
import {
  renderAssessmentPdf,
  renderGovernancePdf,
  renderRoadmapPdf,
  renderCanvasPdf,
  renderCompliancePdf,
  renderArchitecturePdf,
  renderUsecasePdf,
} from '@/lib/pdf/templates'
import { z } from 'zod'

const querySchema = z.object({
  module: z.enum(['assessment', 'usecase', 'governance', 'roadmap', 'canvas', 'compliance', 'architecture']),
  entityId: z.string().uuid().optional(),
})

export const maxDuration = 60

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      module: searchParams.get('module'),
      entityId: searchParams.get('entityId') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('tier, company')
      .eq('id', user.id)
      .single() as { data: { tier: string; company: string | null } | null }

    const tier = profileData?.tier ?? 'free'
    if (tier === 'free') {
      return NextResponse.json(
        { error: 'PDF-Export ist ein Pro-Feature.', code: 'UPGRADE_REQUIRED' },
        { status: 403 }
      )
    }

    const { module, entityId } = parsed.data
    const company = profileData?.company ?? undefined
    let html: string
    let filename: string

    if (module === 'assessment') {
      const query = supabase
        .from('assessment_sessions')
        .select('total_score, dim_scores, archetype')
        .eq('user_id', user.id)
      const { data: sessionData } = entityId
        ? await query.eq('id', entityId).single() as { data: { total_score: number; dim_scores: Record<string, number>; archetype: string } | null }
        : await query.order('created_at', { ascending: false }).limit(1).single() as { data: { total_score: number; dim_scores: Record<string, number>; archetype: string } | null }

      if (!sessionData) return NextResponse.json({ error: 'Kein Ergebnis gefunden' }, { status: 404 })
      html = renderAssessmentPdf({
        totalScore: sessionData.total_score,
        dimScores: sessionData.dim_scores,
        archetype: sessionData.archetype as 'starter' | 'scaler' | 'transformer',
        companyName: company,
      })
      filename = 'ai-readiness-assessment.pdf'

    } else if (module === 'governance') {
      const query = supabase
        .from('governance_sessions')
        .select('use_case_name, result, protocol')
        .eq('user_id', user.id)
      const { data: sessionData } = entityId
        ? await query.eq('id', entityId).single() as { data: { use_case_name: string | null; result: string | null; protocol: unknown[] | null } | null }
        : await query.order('created_at', { ascending: false }).limit(1).single() as { data: { use_case_name: string | null; result: string | null; protocol: unknown[] | null } | null }

      if (!sessionData) return NextResponse.json({ error: 'Kein Ergebnis gefunden' }, { status: 404 })
      html = renderGovernancePdf({
        useCaseName: sessionData.use_case_name,
        result: sessionData.result as 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve' | null,
        protocol: sessionData.protocol as Array<{ question?: string; answer?: string }> | null,
        companyName: company,
      })
      filename = 'governance-check.pdf'

    } else if (module === 'roadmap') {
      const query = supabase
        .from('roadmaps')
        .select('title, archetype, phases')
        .eq('user_id', user.id)
      const { data: roadmapData } = entityId
        ? await query.eq('id', entityId).single() as { data: { title: string; archetype: string | null; phases: unknown[] } | null }
        : await query.order('updated_at', { ascending: false }).limit(1).single() as { data: { title: string; archetype: string | null; phases: unknown[] } | null }

      if (!roadmapData) return NextResponse.json({ error: 'Keine Roadmap gefunden' }, { status: 404 })
      html = renderRoadmapPdf({
        title: roadmapData.title,
        archetype: roadmapData.archetype,
        phases: roadmapData.phases as Array<{ title: string; duration?: string; focus?: string; actions?: Array<{ label: string }>; kpis?: string[]; budget?: string }>,
        companyName: company,
      })
      filename = 'ai-roadmap.pdf'

    } else if (module === 'canvas') {
      const query = supabase
        .from('canvases')
        .select('title, archetype, data')
        .eq('user_id', user.id)
      const { data: canvasData } = entityId
        ? await query.eq('id', entityId).single() as { data: { title: string; archetype: string | null; data: Record<string, string> } | null }
        : await query.order('updated_at', { ascending: false }).limit(1).single() as { data: { title: string; archetype: string | null; data: Record<string, string> } | null }

      if (!canvasData) return NextResponse.json({ error: 'Kein Canvas gefunden' }, { status: 404 })
      html = renderCanvasPdf({
        title: canvasData.title,
        archetype: canvasData.archetype,
        data: canvasData.data,
        companyName: company,
      })
      filename = 'ai-canvas.pdf'

    } else if (module === 'compliance') {
      const { data: checks } = await supabase
        .from('compliance_checks')
        .select('regulation, check_type, status, notes, completed_at')
        .eq('user_id', user.id)
        .order('regulation') as { data: Array<{ regulation: string; check_type: string; status: string; notes: string | null; completed_at: string | null }> | null }

      if (!checks || checks.length === 0) {
        return NextResponse.json({ error: 'Keine Compliance-Prüfungen gefunden' }, { status: 404 })
      }
      html = renderCompliancePdf({ checks, companyName: company })
      filename = 'compliance-report.pdf'

    } else if (module === 'architecture') {
      const query = supabase
        .from('architectures')
        .select('title, result')
        .eq('user_id', user.id)
      const { data: archData } = entityId
        ? await query.eq('id', entityId).single() as { data: { title: string; result: { pattern: string; description?: string; layers: Array<{ name: string; role: string; components: string[]; examples?: string }>; nextSteps?: string[] } } | null }
        : await query.order('updated_at', { ascending: false }).limit(1).single() as { data: { title: string; result: { pattern: string; description?: string; layers: Array<{ name: string; role: string; components: string[]; examples?: string }>; nextSteps?: string[] } } | null }

      if (!archData) return NextResponse.json({ error: 'Keine Architektur gefunden' }, { status: 404 })
      html = renderArchitecturePdf({
        title: archData.title,
        result: archData.result,
        companyName: company,
      })
      filename = 'ai-architektur.pdf'

    } else {
      // module === 'usecase'
      const { data: portfolio } = await supabase
        .from('uc_portfolios')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single() as { data: { id: string; name: string } | null }

      if (!portfolio) return NextResponse.json({ error: 'Kein Portfolio gefunden' }, { status: 404 })

      const portfolioQuery = entityId
        ? supabase.from('use_cases').select('name, domain, description, weighted_score, quadrant').eq('portfolio_id', entityId)
        : supabase.from('use_cases').select('name, domain, description, weighted_score, quadrant').eq('portfolio_id', portfolio.id)

      const { data: useCases } = await portfolioQuery
        .order('weighted_score', { ascending: false }) as {
          data: Array<{ name: string; domain: string | null; description: string | null; weighted_score: number | null; quadrant: string | null }> | null
        }

      html = renderUsecasePdf({
        portfolioName: portfolio.name,
        useCases: useCases ?? [],
        companyName: company,
      })
      filename = 'use-case-portfolio.pdf'
    }

    const pdfBuffer = await renderPdf({ html, filename })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('PDF export error:', detail, err)
    return NextResponse.json({ error: 'PDF-Generierung fehlgeschlagen', detail }, { status: 500 })
  }
}
