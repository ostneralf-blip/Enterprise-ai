'use client'
import { useState } from 'react'
import { AssessmentWizard, type AssessmentResultData } from '@/components/modules/assessment/AssessmentWizard'
import { AssessmentResults } from '@/components/modules/assessment/AssessmentResults'
import { createClient } from '@/lib/supabase/client'
import type { Tier } from '@/types'

interface SavedResult {
  archetype: 'starter' | 'scaler' | 'transformer'
  total_score: number
  dim_scores: Record<string, number>
}

interface AssessmentPageClientProps {
  tier: Tier
  userId: string
  savedResult?: SavedResult | null
}

export function AssessmentPageClient({ tier, userId, savedResult }: AssessmentPageClientProps) {
  const [mode, setMode] = useState<'results' | 'wizard'>(savedResult ? 'results' : 'wizard')
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

  if (mode === 'results' && savedResult) {
    return (
      <AssessmentResults
        totalScore={savedResult.total_score}
        dimScores={savedResult.dim_scores}
        archetype={savedResult.archetype}
        tier={tier}
        onSave={async () => {}}
        onRestart={() => setMode('wizard')}
        saving={false}
        saved={true}
      />
    )
  }

  return <AssessmentWizard tier={tier} onSave={handleSave} />
}
