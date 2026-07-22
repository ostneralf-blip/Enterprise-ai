'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { CanvasContext, DetectedTag } from '@/lib/canvas-context'
import type { Archetype } from '@/types'

// Aus ArchitecturePageClient.tsx extrahiert (UX-Review Sprint 34, 22.07.2026) —
// reines Refactoring ohne Verhaltensänderung, damit derselbe „erkannter Kontext"-
// Banner auch von anderen Modulen (Roadmap) genutzt werden kann. Die i18n-Keys
// bleiben bewusst im `modules.architecture.*`-Namespace (der Banner beschreibt
// modulübergreifend „erkannter Kontext", die Texte gelten überall) — ein
// Namespace-Umzug wäre eine Verhaltensänderung und ist hier nicht Ziel.

export interface AssessmentContext {
  archetype: Archetype | null
  total_score: number
  dim_scores: Record<string, number>
}

export interface GovernanceContext {
  use_case_name: string | null
  result: string | null
}

export interface RoadmapContext {
  title: string
  archetype: string | null
  phasesCount: number
}

const ARCHETYPE_LABELS: Record<string, string> = {
  starter: 'Starter',
  scaler: 'Scaler',
  transformer: 'Transformer',
}

const GOVERNANCE_COLORS: Record<string, string> = {
  approve: 'text-success-text bg-success-subtle',
  stop_dsgvo: 'text-error-text bg-error-subtle',
  stop_risk: 'text-error-text bg-error-subtle',
  improve: 'text-warning-text bg-warning-subtle',
}

const TAG_COLORS: Record<DetectedTag['type'], string> = {
  score:      'bg-success-subtle text-success-text border-success-border',
  industry:   'bg-surface-raised text-ink-secondary border-line',
  usecase:    'bg-primary-soft text-primary-hover border-primary-border',
  platform:   'bg-violet-50 text-violet-700 border-violet-200',
  compliance: 'bg-warning-subtle text-warning-text border-warning-border',
}

export interface UnifiedContextBannerProps {
  assessmentContext?: AssessmentContext | null
  governanceContext?: GovernanceContext | null
  compliancePreset?: string | null
  roadmapContext?: RoadmapContext | null
  canvasContext?: CanvasContext | null
  canvasTitle?: string | null
  useCaseName?: string | null
  filledWizardFields?: number
  onDismiss?: () => void
  wizardTargetId?: string
}

export function UnifiedContextBanner({
  assessmentContext, governanceContext, compliancePreset, roadmapContext,
  canvasContext, canvasTitle, filledWizardFields, onDismiss, wizardTargetId,
}: UnifiedContextBannerProps) {
  const t = useTranslations('modules')
  const [collapsed, setCollapsed] = useState(false)

  const hasModuleContext = !!(assessmentContext || governanceContext || compliancePreset || roadmapContext)
  const hasCanvas = !!(canvasContext && canvasTitle)
  if (!hasModuleContext && !hasCanvas) return null

  const filledCount = filledWizardFields ?? (canvasContext ? Object.keys(canvasContext.wizard_prefill).length : 0)

  const governanceLabel: Record<string, string> = {
    approve:    t('architecture.governanceApprove'),
    improve:    t('architecture.governanceImprove'),
    stop_dsgvo: t('architecture.governanceStopDsgvo'),
    stop_risk:  t('architecture.governanceStopRisk'),
  }
  // #205 (Teil B): der Governance-Badge erklärt sein Label per title, analog zum
  // Archetyp-Badge (Score) und Roadmap-Badge (Phasenzahl) — vorher fehlte der Hint.
  const governanceTitle: Record<string, string> = {
    approve:    t('architecture.governanceApproveTitle'),
    improve:    t('architecture.governanceImproveTitle'),
    stop_dsgvo: t('architecture.governanceStopDsgvoTitle'),
    stop_risk:  t('architecture.governanceStopRiskTitle'),
  }
  const complianceLabel: Record<string, string> = {
    strict:    t('architecture.complianceStrict'),
    moderate:  t('architecture.complianceModerate'),
    low:       t('architecture.complianceLow'),
    undefined: t('architecture.complianceUndefined'),
  }

  return (
    <div className="bg-primary-soft border border-primary-border rounded-xl p-3.5 mb-5">
      <div className="flex items-start gap-3">
        {/* ◈ icon dot */}
        <div className="w-[34px] h-[34px] rounded-[10px] bg-primary flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
          <span className="text-white text-sm font-bold">◈</span>
        </div>
        <div className="min-w-0 flex-1">
          {/* Header line */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-primary min-w-0 truncate">
              {hasCanvas
                ? t('architecture.contextDetectedCanvas', { title: canvasTitle!, count: filledCount })
                : t('architecture.contextDetectedGeneral')}
            </p>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setCollapsed(v => !v)}
                aria-label={collapsed ? t('architecture.expandAriaLabel') : t('architecture.collapseAriaLabel')}
                className="p-1 text-xs text-primary hover:opacity-70 focus:outline-none"
              >
                {collapsed ? '▾' : '▴'}
              </button>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  aria-label={t('architecture.bannerCloseAriaLabel')}
                  className="p-1 text-xs text-primary hover:opacity-70 focus:outline-none"
                >✕</button>
              )}
            </div>
          </div>

          {!collapsed && (
            <div className="mt-2 space-y-2">
              {/* Canvas tags */}
              {hasCanvas && canvasContext!.detected_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {canvasContext!.detected_tags.map(tag => (
                    <span key={tag.label} className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', TAG_COLORS[tag.type])}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
              {/* Module context chips */}
              {hasModuleContext && (
                <div className="flex flex-wrap gap-1.5">
                  {assessmentContext?.archetype && (
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-raised text-ink-secondary border border-line"
                      title={`Score: ${assessmentContext.total_score}`}
                    >
                      {ARCHETYPE_LABELS[assessmentContext.archetype] ?? assessmentContext.archetype}
                    </span>
                  )}
                  {governanceContext?.result && (
                    <span
                      className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full border border-transparent',
                        GOVERNANCE_COLORS[governanceContext.result] ?? 'text-ink-secondary bg-surface-raised border-line'
                      )}
                      title={governanceTitle[governanceContext.result] ?? undefined}
                    >
                      {governanceLabel[governanceContext.result] ?? governanceContext.result}
                    </span>
                  )}
                  {compliancePreset && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning-subtle text-warning-text border border-warning-border">
                      {complianceLabel[compliancePreset] ?? compliancePreset}
                    </span>
                  )}
                  {roadmapContext && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-raised text-ink-secondary border border-line"
                      title={roadmapContext.phasesCount > 0 ? t('architecture.phasesLabel', { count: roadmapContext.phasesCount }) : undefined}>
                      {roadmapContext.title}
                    </span>
                  )}
                </div>
              )}
              {/* Wizard prüfen */}
              {wizardTargetId && (
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById(wizardTargetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } }).posthog?.capture('arch_context_review_clicked', { filled_count: filledCount })
                  }}
                  className="text-[10px] font-semibold text-primary underline hover:opacity-70 focus:outline-none"
                >
                  {t('architecture.wizardPruefenButton')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
