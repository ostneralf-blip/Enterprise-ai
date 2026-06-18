'use client'
import { AssessmentWizard, type AssessmentResultData } from '@/components/modules/assessment/AssessmentWizard'
import { createClient } from '@/lib/supabase/client'
import type { Tier } from '@/types'

interface AssessmentPageClientProps {
  tier: Tier
  userId: string
}

export function AssessmentPageClient({ tier, userId }: AssessmentPageClientProps) {
  const supabase = createClient()

  const handleSave = async (result: AssessmentResultData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('assessment_sessions') as any).insert({
      user_id: userId,
      type: 'quick',
      archetype: result.archetype,
      total_score: result.totalScore,
      dim_scores: result.dimScores,
      answers: result.answers,
      completed: true,
    })
    if (error) {
      console.error('Failed to save assessment:', error)
      throw new Error('Speichern fehlgeschlagen')
    }
  }

  return <AssessmentWizard tier={tier} onSave={handleSave} />
}
