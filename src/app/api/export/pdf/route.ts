import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderPdf } from '@/lib/pdf/generate'
import { renderAssessmentPdf } from '@/lib/pdf/templates'
import { z } from 'zod'

const querySchema = z.object({
  module: z.enum(['assessment', 'usecase', 'governance', 'roadmap', 'canvas']),
  entityId: z.string().uuid().optional(),
})

export const maxDuration = 30 // Vercel serverless timeout

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({
      module: searchParams.get('module'),
      entityId: searchParams.get('entityId') ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
    }

    // ─── AUTH & TIER CHECK (server-seitig, niemals nur im Client) ───────────
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

    // ─── DATEN LADEN & TEMPLATE RENDERN ───────────────────────────────────
    let html: string
    let filename: string

    if (parsed.data.module === 'assessment') {
      let sessionData
      if (parsed.data.entityId) {
        const { data } = await supabase
          .from('assessment_sessions')
          .select('*')
          .eq('id', parsed.data.entityId)
          .eq('user_id', user.id) // RLS-Backup: explizite Ownership-Prüfung
          .single() as { data: { total_score: number; dim_scores: Record<string, number>; archetype: string } | null }
        sessionData = data
      } else {
        const { data } = await supabase
          .from('assessment_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single() as { data: { total_score: number; dim_scores: Record<string, number>; archetype: string } | null }
        sessionData = data
      }

      if (!sessionData) {
        return NextResponse.json({ error: 'Kein Ergebnis gefunden' }, { status: 404 })
      }

      html = renderAssessmentPdf({
        totalScore: sessionData.total_score,
        dimScores: sessionData.dim_scores,
        archetype: sessionData.archetype as 'starter' | 'scaler' | 'transformer',
        companyName: profileData?.company ?? undefined,
      })
      filename = 'ai-readiness-assessment.pdf'
    } else {
      return NextResponse.json({ error: 'Modul-Export noch nicht implementiert' }, { status: 501 })
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
    console.error('PDF export error:', err)
    return NextResponse.json({ error: 'PDF-Generierung fehlgeschlagen' }, { status: 500 })
  }
}
