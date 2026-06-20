import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { calcWeightedScore, deriveQuadrant, weightsAreValid } from '@/config/usecase-data'
import type { UseCaseWeights } from '@/types'

const WeightsSchema = z.object({
  value: z.number().min(0).max(1),
  feasibility: z.number().min(0).max(1),
  data_readiness: z.number().min(0).max(1),
  risk: z.number().min(0).max(1),
  speed: z.number().min(0).max(1),
})

export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parse = WeightsSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Ungültige Gewichte' }, { status: 400 })

    const weights = parse.data as UseCaseWeights
    if (!weightsAreValid(weights)) {
      return NextResponse.json({ error: 'Gewichte müssen 100% ergeben' }, { status: 400 })
    }

    // Get user's portfolio
    const { data: portfolio } = await supabase
      .from('uc_portfolios')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null }

    if (!portfolio) return NextResponse.json({ error: 'Portfolio nicht gefunden' }, { status: 404 })

    // Save new weights
    const { error: updateErr } = await supabase
      .from('uc_portfolios')
      .update({ weights })
      .eq('id', portfolio.id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    // Recalculate all use case scores with new weights
    const { data: cases } = await supabase
      .from('use_cases')
      .select('id, scores')
      .eq('portfolio_id', portfolio.id) as { data: { id: string; scores: Record<string, number> }[] | null }

    if (cases && cases.length > 0) {
      const updates = cases.map(c => ({
        id: c.id,
        weighted_score: calcWeightedScore(c.scores, weights),
        quadrant: deriveQuadrant(c.scores),
      }))
      for (const u of updates) {
        await supabase.from('use_cases').update({ weighted_score: u.weighted_score, quadrant: u.quadrant }).eq('id', u.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
