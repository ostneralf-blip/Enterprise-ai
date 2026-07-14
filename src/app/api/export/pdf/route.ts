import { NextResponse } from 'next/server'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/utils/tier-check'
import { renderPdf } from '@/lib/pdf/generate'
import {
  renderAssessmentPdf,
  renderGovernancePdf,
  renderRoadmapPdf,
  renderCanvasPdf,
  renderCompliancePdf,
  renderArchitecturePdf,
  renderUsecasePdf,
  renderExecutiveSummaryPdf,
} from '@/lib/pdf/templates'
import type { ReactElement } from 'react'
import { z } from 'zod'

const querySchema = z.object({
  module: z.enum(['assessment', 'usecase', 'governance', 'roadmap', 'canvas', 'compliance', 'architecture', 'executive_summary']),
  entityId: z.string().uuid().optional(),
  locale: z.enum(['de', 'en']).optional(),
  template: z.enum(['book', 'board', 'blueprint']).optional(),
})

export const maxDuration = 30

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      module: searchParams.get('module'),
      entityId: searchParams.get('entityId') ?? undefined,
      locale: searchParams.get('locale') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    // getLocale() funktioniert nicht für /api/-Routen (Middleware wird übersprungen).
    // Locale kommt als Query-Param vom Frontend; Fallback auf getLocale() für direkte Aufrufe.
    const locale = parsed.data.locale ?? (await getLocale())
    const gate = await requireFeature('pdf_export')
    if (gate instanceof NextResponse) return gate
    const { userId } = gate

    const supabase = await createClient()
    const { data: profileData } = await supabase
      .from('profiles')
      .select('company')
      .eq('id', userId)
      .single() as { data: { company: string | null } | null }

    const { module, entityId, template } = parsed.data

    // Presentation-Templates sind Pro-Feature — server-seitig prüfen
    if (template && template !== 'book') {
      const tGate = await requireFeature('presentation_templates')
      if (tGate instanceof NextResponse) return tGate
    }
    const company = profileData?.company ?? undefined
    let doc: ReactElement
    let filename: string

    if (module === 'assessment') {
      const query = supabase
        .from('assessment_sessions')
        .select('total_score, dim_scores, archetype')
        .eq('user_id', userId)
      const { data: sessionData } = entityId
        ? await query.eq('id', entityId).single() as { data: { total_score: number; dim_scores: Record<string, number>; archetype: string } | null }
        : await query.order('created_at', { ascending: false }).limit(1).single() as { data: { total_score: number; dim_scores: Record<string, number>; archetype: string } | null }

      if (!sessionData) return NextResponse.json({ error: 'Kein Ergebnis gefunden' }, { status: 404 })
      doc = renderAssessmentPdf({
        totalScore: sessionData.total_score,
        dimScores: sessionData.dim_scores,
        archetype: sessionData.archetype as 'starter' | 'scaler' | 'transformer',
        companyName: company,
      }, locale)
      filename = 'ai-readiness-assessment.pdf'

    } else if (module === 'governance') {
      const query = supabase
        .from('governance_sessions')
        .select('use_case_name, result, protocol')
        .eq('user_id', userId)
      const { data: sessionData } = entityId
        ? await query.eq('id', entityId).single() as { data: { use_case_name: string | null; result: string | null; protocol: unknown[] | null } | null }
        : await query.order('created_at', { ascending: false }).limit(1).single() as { data: { use_case_name: string | null; result: string | null; protocol: unknown[] | null } | null }

      if (!sessionData) return NextResponse.json({ error: 'Kein Ergebnis gefunden' }, { status: 404 })
      doc = renderGovernancePdf({
        useCaseName: sessionData.use_case_name,
        result: sessionData.result as 'approve' | 'stop_dsgvo' | 'stop_risk' | 'improve' | null,
        protocol: sessionData.protocol as Array<{ question?: string; answer?: string }> | null,
        companyName: company,
      }, locale)
      filename = 'governance-check.pdf'

    } else if (module === 'roadmap') {
      const query = supabase
        .from('roadmaps')
        .select('title, archetype, phases')
        .eq('user_id', userId)
      const { data: roadmapData } = entityId
        ? await query.eq('id', entityId).single() as { data: { title: string; archetype: string | null; phases: unknown[] } | null }
        : await query.order('updated_at', { ascending: false }).limit(1).single() as { data: { title: string; archetype: string | null; phases: unknown[] } | null }

      if (!roadmapData) return NextResponse.json({ error: 'Keine Roadmap gefunden' }, { status: 404 })
      doc = renderRoadmapPdf({
        title: roadmapData.title,
        archetype: roadmapData.archetype,
        phases: roadmapData.phases as Array<{ title: string; duration?: string; focus?: string; actions?: Array<{ label: string }>; kpis?: string[]; budget?: string }>,
        companyName: company,
      }, locale)
      filename = 'ai-roadmap.pdf'

    } else if (module === 'canvas') {
      const query = supabase
        .from('canvases')
        .select('title, archetype, data')
        .eq('user_id', userId)
      const { data: canvasData } = entityId
        ? await query.eq('id', entityId).single() as { data: { title: string; archetype: string | null; data: Record<string, string> } | null }
        : await query.order('updated_at', { ascending: false }).limit(1).single() as { data: { title: string; archetype: string | null; data: Record<string, string> } | null }

      if (!canvasData) return NextResponse.json({ error: 'Kein Canvas gefunden' }, { status: 404 })
      doc = renderCanvasPdf({
        title: canvasData.title,
        archetype: canvasData.archetype,
        data: canvasData.data,
        companyName: company,
      }, locale)
      filename = 'ai-canvas.pdf'

    } else if (module === 'compliance') {
      const { data: checks } = await supabase
        .from('compliance_checks')
        .select('regulation, check_type, status, notes, completed_at')
        .eq('user_id', userId)
        .order('regulation') as { data: Array<{ regulation: string; check_type: string; status: string; notes: string | null; completed_at: string | null }> | null }

      if (!checks || checks.length === 0) {
        return NextResponse.json({ error: 'Keine Compliance-Prüfungen gefunden' }, { status: 404 })
      }
      doc = renderCompliancePdf({ checks, companyName: company }, locale)
      filename = 'compliance-report.pdf'

    } else if (module === 'architecture') {
      const query = supabase
        .from('architectures')
        .select('title, result')
        .eq('user_id', userId)
      type RawArchResult = {
        pattern: string; description?: string; componentSources?: Record<string, 'rule' | 'ai' | 'manual'>
        layers: Array<{ name: string; role: string; components: string[]; examples?: string }>
        nextSteps?: Array<string | { de: string; en: string }>
      }
      const { data: archData } = entityId
        ? await query.eq('id', entityId).single() as { data: { title: string; result: RawArchResult } | null }
        : await query.order('updated_at', { ascending: false }).limit(1).single() as { data: { title: string; result: RawArchResult } | null }

      if (!archData) return NextResponse.json({ error: 'Keine Architektur gefunden' }, { status: 404 })
      const rawResult = archData.result
      doc = renderArchitecturePdf({
        title: archData.title,
        result: {
          ...rawResult,
          layers: (rawResult.layers ?? []).map(l => ({ ...l, components: l.components ?? [] })),
          nextSteps: (rawResult.nextSteps ?? []).map(s =>
            typeof s === 'string' ? s : (locale === 'en' ? s.en : s.de)
          ),
        },
        companyName: company,
        template: template as 'book' | 'board' | 'blueprint' | undefined,
      }, locale)
      filename = 'ai-architektur.pdf'

    } else if (module === 'executive_summary') {
      const { data: esPortfolio } = await supabase
        .from('uc_portfolios')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { data: { id: string } | null }

      const portfolioId = esPortfolio?.id ?? null

      const [
        assessmentRes,
        governanceRes,
        roadmapRes,
        canvasRes,
        architectureRes,
        ucCountRes,
        topUcsRes,
      ] = await Promise.all([
        supabase.from('assessment_sessions').select('archetype, total_score, dim_scores').eq('user_id', userId).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle() as unknown as Promise<{ data: { archetype: string; total_score: number; dim_scores: Record<string, number> } | null }>,
        supabase.from('governance_sessions').select('use_case_name, result, protocol').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle() as unknown as Promise<{ data: { use_case_name: string | null; result: string; protocol: Array<{ question?: string; answer?: string; label?: string; value?: string }> | null } | null }>,
        supabase.from('roadmaps').select('title, archetype, phases').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle() as unknown as Promise<{ data: { title: string; archetype: string | null; phases: Array<{ title: string; duration?: string; focus?: string; actions?: Array<{ label: string }>; kpis?: string[] }> } | null }>,
        supabase.from('canvases').select('title, data').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle() as unknown as Promise<{ data: { title: string; data: Record<string, string> } | null }>,
        supabase.from('architectures').select('title, result').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle() as unknown as Promise<{ data: { title: string; result: { pattern: string; description?: string; layers: Array<{ name: string; role: string; components: string[] }>; nextSteps?: string[] } } | null }>,
        portfolioId
          ? supabase.from('use_cases').select('*', { count: 'exact', head: true }).eq('portfolio_id', portfolioId)
          : Promise.resolve({ count: 0 }),
        portfolioId
          ? supabase.from('use_cases').select('name, domain, weighted_score, quadrant').eq('portfolio_id', portfolioId).order('weighted_score', { ascending: false }).limit(5) as unknown as Promise<{ data: Array<{ name: string; domain: string | null; weighted_score: number | null; quadrant: string | null }> | null }>
          : Promise.resolve({ data: [] as Array<{ name: string; domain: string | null; weighted_score: number | null; quadrant: string | null }> }),
      ])

      const esAssessment = assessmentRes.data
      const esGovernance = governanceRes.data
      const esRoadmap = roadmapRes.data
      const esCanvas = canvasRes.data
      const esArchitecture = architectureRes.data
      const useCaseCount = (ucCountRes as { count: number | null }).count ?? 0
      const topUseCases = topUcsRes.data ?? []

      const completedModules = [
        !!esAssessment, useCaseCount > 0, !!esGovernance, !!esRoadmap, !!esCanvas, !!esArchitecture,
      ].filter(Boolean).length

      const moduleStatus = [
        { label: 'AI-Readiness Assessment',  done: !!esAssessment },
        { label: 'Use-Case Scoring',         done: useCaseCount > 0 },
        { label: 'Governance-Check',         done: !!esGovernance },
        { label: 'Roadmap-Generator',        done: !!esRoadmap },
        { label: 'AI Use-Case Canvas',       done: !!esCanvas },
        { label: 'Compliance Center',        done: false },
        { label: 'Architektur-Generator',    done: !!esArchitecture },
      ]

      doc = renderExecutiveSummaryPdf({
        companyName: company,
        completedModules,
        totalModules: 7,
        moduleStatus,
        assessment: esAssessment ? {
          archetype: esAssessment.archetype,
          totalScore: esAssessment.total_score,
          dimScores: esAssessment.dim_scores,
        } : undefined,
        useCaseCount,
        topUseCases: topUseCases.map(u => ({
          name: u.name,
          weightedScore: u.weighted_score,
          quadrant: u.quadrant,
          domain: u.domain,
        })),
        governance: esGovernance ? {
          useCaseName: esGovernance.use_case_name,
          result: esGovernance.result,
          protocol: esGovernance.protocol ?? undefined,
        } : undefined,
        roadmap: esRoadmap ? {
          title: esRoadmap.title,
          archetype: esRoadmap.archetype,
          phases: Array.isArray(esRoadmap.phases) ? esRoadmap.phases : [],
        } : undefined,
        canvas: esCanvas ? { title: esCanvas.title, data: esCanvas.data ?? {} } : undefined,
        architecture: esArchitecture ? {
          title: esArchitecture.title,
          result: esArchitecture.result,
        } : undefined,
      }, locale)
      filename = 'executive-summary.pdf'

    } else {
      // module === 'usecase'
      const { data: portfolio } = await supabase
        .from('uc_portfolios')
        .select('id, name')
        .eq('user_id', userId)
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

      doc = renderUsecasePdf({
        portfolioName: portfolio.name,
        useCases: useCases ?? [],
        companyName: company,
      }, locale)
      filename = 'use-case-portfolio.pdf'
    }

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
    console.error('PDF export error:', detail, err)
    return NextResponse.json({ error: 'PDF-Generierung fehlgeschlagen', detail }, { status: 500 })
  }
}
