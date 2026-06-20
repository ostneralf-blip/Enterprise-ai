import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { calcWeightedScore, deriveQuadrant, DEFAULT_WEIGHTS, FREE_LIMIT } from '@/config/usecase-data'
import type { UseCaseWeights } from '@/types'

const UseCaseInputSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  scores: z.object({
    value: z.number().int().min(1).max(5),
    feasibility: z.number().int().min(1).max(5),
    data_readiness: z.number().int().min(1).max(5),
    risk: z.number().int().min(1).max(5),
    speed: z.number().int().min(1).max(5),
  }),
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreatePortfolio(supabase: any, userId: string) {
  const { data: existing } = await supabase
    .from('uc_portfolios')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return existing

  const { data: created } = await supabase
    .from('uc_portfolios')
    .insert({ user_id: userId, name: 'Mein Portfolio', weights: DEFAULT_WEIGHTS })
    .select()
    .single()

  return created
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const portfolio = await getOrCreatePortfolio(supabase, user.id)
    if (!portfolio) return NextResponse.json({ error: 'Portfolio error' }, { status: 500 })

    const { data: use_cases } = await supabase
      .from('use_cases')
      .select('*')
      .eq('portfolio_id', portfolio.id)
      .order('weighted_score', { ascending: false })

    return NextResponse.json({ portfolio, use_cases: use_cases ?? [] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single() as { data: { tier: string } | null }

    const portfolio = await getOrCreatePortfolio(supabase, user.id)
    if (!portfolio) return NextResponse.json({ error: 'Portfolio error' }, { status: 500 })

    if (profile?.tier === 'free') {
      const { count } = await supabase
        .from('use_cases')
        .select('*', { count: 'exact', head: true })
        .eq('portfolio_id', portfolio.id)
      if ((count ?? 0) >= FREE_LIMIT) {
        return NextResponse.json({ error: 'Limit erreicht', code: 'FREE_LIMIT' }, { status: 403 })
      }
    }

    const body = await req.json()
    const parse = UseCaseInputSchema.safeParse(body)
    if (!parse.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

    const { name, domain, description, scores } = parse.data
    const weights = (portfolio.weights as UseCaseWeights) ?? DEFAULT_WEIGHTS
    const weighted_score = calcWeightedScore(scores, weights)
    const quadrant = deriveQuadrant(scores)

    const { data, error } = await supabase
      .from('use_cases')
      .insert({ portfolio_id: portfolio.id, name, domain: domain ?? null, description: description ?? null, scores, weighted_score, quadrant })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
