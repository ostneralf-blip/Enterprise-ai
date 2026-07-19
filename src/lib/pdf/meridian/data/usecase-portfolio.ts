import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type QuadrantKey = 'quick_win' | 'strategic_bet' | 'low_hanging_fruit' | 'avoid'

export interface PortfolioUseCase {
  rank: number
  name: string
  value100: number
  feasibility100: number
  quadrant: QuadrantKey | null
}

export interface QuadrantDistribution {
  quick_win: number
  strategic_bet: number
  low_hanging_fruit: number
  avoid: number
}

export interface UsecasePortfolioData {
  companyName: string | null
  generatedAt: string
  portfolioName: string | null
  useCases: PortfolioUseCase[] // absteigend nach weighted_score, vollständig
  distribution: QuadrantDistribution
}

const score100 = (score5: number | null | undefined) =>
  Math.round(Math.max(0, Math.min(5, score5 ?? 0)) * 20)

/**
 * Lädt die Daten für den MERIDIAN Use-Case-Portfolio-Report (Musterseite 3,
 * Issue #225). Gibt `null` zurück, wenn kein Portfolio mit Use-Cases existiert.
 */
export async function getUsecasePortfolioData(userId: string): Promise<UsecasePortfolioData | null> {
  const supabase = await createClient()

  const [profileRes, portfolioRes] = await Promise.all([
    supabase.from('profiles').select('company').eq('id', userId).single() as unknown as Promise<{
      data: { company: string | null } | null
    }>,
    supabase
      .from('uc_portfolios')
      .select('id, name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() as unknown as Promise<{ data: { id: string; name: string } | null }>,
  ])

  const portfolio = portfolioRes.data
  if (!portfolio) return null

  const { data: rawUseCases } = await (supabase
    .from('use_cases')
    .select('name, scores, quadrant')
    .eq('portfolio_id', portfolio.id)
    .order('weighted_score', { ascending: false }) as unknown as Promise<{
    data: Array<{ name: string; scores: Record<string, number> | null; quadrant: QuadrantKey | null }> | null
  }>)

  const list = rawUseCases ?? []
  if (list.length === 0) return null

  const useCases: PortfolioUseCase[] = list.map((uc, i) => ({
    rank: i + 1,
    name: uc.name,
    value100: score100(uc.scores?.value),
    feasibility100: score100(uc.scores?.feasibility),
    quadrant: uc.quadrant,
  }))

  const distribution: QuadrantDistribution = { quick_win: 0, strategic_bet: 0, low_hanging_fruit: 0, avoid: 0 }
  for (const uc of useCases) {
    if (uc.quadrant) distribution[uc.quadrant]++
  }

  return {
    companyName: profileRes.data?.company ?? null,
    generatedAt: new Date().toISOString(),
    portfolioName: portfolio.name,
    useCases,
    distribution,
  }
}
