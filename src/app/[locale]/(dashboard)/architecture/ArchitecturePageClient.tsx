'use client'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ShareButton } from '@/components/shared/ShareButton'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { InfoHint, HintBox } from '@/components/shared/InfoHint'
import { WIZARD_STEPS, generateArchitecture, generateRasic, COST_ESTIMATES, scaleCostEstimate, selectPatternReason, type WizardAnswers, type ArchitectureResult, type PatternId } from '@/config/architecture-data'
import { recommendFromWizard, recommendFromCatalog, recommendJouleUseCases, generateDynamicKeyDecisions, generateDynamicNextSteps, generateCrossModuleDecisions, generateCrossModuleNextSteps, isSAP, runEamValidation, type CatalogRecommendations, type JouleUseCase } from '@/config/architecture-rules'
import { getSelectionStats } from '@/lib/architecture/selection'
import { findConflicts, explainConflict } from '@/lib/utils/catalog-compatibility'
import { AIAnalysisButton, AIBadge } from '@/components/shared/AIAnalysisButton'
import type { Archetype, CatalogComponent, Canvas, UseCase, CanvasSynonym, RasicMatrix, RasicPhase, RasicValue } from '@/types'
import { RasicMatrixCard, EamValidationBanner, ComplianceControlTable, type ValidationOverride } from './RasicSection'
import { ArchitekturLandkarte } from './ArchitekturLandkarte'
import { EamMap } from './EamMap'
import { ComponentSelectionStep } from './ComponentSelectionStep'
import { AIPanel } from './AIPanel'
import { ArchitectureDiagram } from '@/components/modules/ArchitectureDiagram'
import { extractCanvasContext, type CanvasContext, type DetectedTag } from '@/lib/canvas-context'
import { mergeCanvasContexts } from '@/lib/utils/merge-canvas-contexts'
import { CanvasScopeStep } from './CanvasScopeStep'
import { TechnicalArchitectureOptimisation } from './TechnicalArchitectureOptimisation'
import { ArchitectureWorkbench } from './ArchitectureWorkbench'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const NOW = Date.now()


const ARCHETYPE_LABELS: Record<string, string> = {
  starter: 'Starter',
  scaler: 'Scaler',
  transformer: 'Transformer',
}

const GOVERNANCE_COLORS: Record<string, string> = {
  approve: 'text-green-700 bg-green-50',
  stop_dsgvo: 'text-red-700 bg-red-50',
  stop_risk: 'text-red-700 bg-red-50',
  improve: 'text-amber-700 bg-amber-50',
}

interface SavedArchitecture {
  id: string
  title: string | null
  wizard_data: WizardAnswers
  result: ArchitectureResult
  updated_at: string
  ai_narrative?: { summary?: string; key_decisions: { de: string; en: string }[]; next_steps: { de: string; en: string }[]; component_suggestions?: string[] } | null
  narrative_locale?: string | null
}

interface AssessmentContext {
  archetype: Archetype | null
  total_score: number
  dim_scores: Record<string, number>
}

interface GovernanceContext {
  use_case_name: string | null
  result: string | null
}

interface RoadmapContext {
  title: string
  archetype: string | null
  phasesCount: number
}

interface RoleCatalogEntry {
  role_name: string
  role_category: string | null
  description: string | null
  responsibilities: string[] | null
  raci_activities: { activity: string; type: string }[] | null
}

const RACI_COLORS: Record<string, string> = {
  R: 'bg-blue-100 text-blue-800 border-blue-200',
  A: 'bg-amber-100 text-amber-800 border-amber-200',
  C: 'bg-violet-100 text-violet-800 border-violet-200',
  I: 'bg-slate-100 text-slate-600 border-slate-200',
}
const RACI_LABEL: Record<string, string> = { R: 'Responsible', A: 'Accountable', C: 'Consulted', I: 'Informed' }

const ROLE_CATEGORY_CLASS: Record<string, string> = {
  strategic:   'bg-blue-50 border-blue-200 text-blue-800',
  technical:   'bg-violet-50 border-violet-200 text-violet-800',
  governance:  'bg-amber-50 border-amber-200 text-amber-800',
  operational: 'bg-emerald-50 border-emerald-200 text-emerald-800',
}

interface Props {
  initialArchitectures?: SavedArchitecture[]
  assessmentContext?: AssessmentContext | null
  governanceContext?: GovernanceContext | null
  compliancePreset?: 'strict' | 'moderate' | 'low' | 'undefined'
  tier?: string
  canvasContext?: { canvas: Canvas; useCase: UseCase } | null
  roadmapContext?: RoadmapContext | null
  synonyms?: CanvasSynonym[]
  rolesCatalog?: RoleCatalogEntry[]
}


const TAG_COLORS: Record<DetectedTag['type'], string> = {
  score:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  industry:   'bg-slate-100 text-slate-700 border-slate-200',
  usecase:    'bg-primary-soft text-primary-hover border-primary-border',
  platform:   'bg-violet-50 text-violet-700 border-violet-200',
  compliance: 'bg-amber-50 text-amber-700 border-amber-200',
}

interface UnifiedContextBannerProps {
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

function UnifiedContextBanner({
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
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                      title={`Score: ${assessmentContext.total_score}`}
                    >
                      {ARCHETYPE_LABELS[assessmentContext.archetype] ?? assessmentContext.archetype}
                    </span>
                  )}
                  {governanceContext?.result && (
                    <span className={cn(
                      'text-[10px] font-medium px-2 py-0.5 rounded-full border border-transparent',
                      GOVERNANCE_COLORS[governanceContext.result] ?? 'text-slate-700 bg-slate-100 border-slate-200'
                    )}>
                      {governanceLabel[governanceContext.result] ?? governanceContext.result}
                    </span>
                  )}
                  {compliancePreset && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {complianceLabel[compliancePreset] ?? compliancePreset}
                    </span>
                  )}
                  {roadmapContext && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
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

function CostIndicationCard({ patternId, companySize, locale }: {
  patternId: PatternId
  companySize?: string
  locale: string
}) {
  const t = useTranslations('modules')
  const base = COST_ESTIMATES[patternId]
  const est = scaleCostEstimate(base, companySize)
  const fmt = (v: number) => v >= 1_000_000
    ? `€${(v / 1_000_000).toFixed(1).replace('.0', '')}M`
    : `€${Math.round(v / 1_000)}k`
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{t('architecture.costTitle')}</h3>
        <InfoHint title={t('architecture.costHintTitle')}>
          <p>{t('architecture.costHintBody')}</p>
        </InfoHint>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{t('architecture.costSetup')}</p>
          <p className="text-sm font-semibold text-slate-800">{fmt(est.setup.min)}–{fmt(est.setup.max)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('architecture.costOneTime')}</p>
        </div>
        <div className="text-center border-x border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{t('architecture.costMonthly')}</p>
          <p className="text-sm font-semibold text-slate-800">{fmt(est.monthly.min)}–{fmt(est.monthly.max)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('architecture.costPerMonth')}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{t('architecture.costDuration')}</p>
          <p className="text-sm font-semibold text-slate-800">{est.durationMonths.min}–{est.durationMonths.max}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{t('architecture.costMonths')}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        {pick(base.note, locale)} {t('architecture.costDisclaimer')}
      </p>
    </div>
  )
}

type ResultAudience = 'exec' | 'architect' | 'compliance'
type View = 'list' | 'canvas-scope' | 'wizard' | 'component-picker' | 'result'

function KpiCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-4 overflow-hidden">
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl', accent ? 'bg-amber-400' : 'bg-primary')} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-2">{label}</p>
      <p className="text-base font-semibold text-slate-900 mt-1.5 pl-2">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5 pl-2">{sub}</p>}
    </div>
  )
}

function ExecKpiStrip({ result, answers }: { result: ArchitectureResult; answers: WizardAnswers }) {
  const t = useTranslations('modules')
  const base = COST_ESTIMATES[result.patternId as PatternId]
  const est = scaleCostEstimate(base, answers.company_size)
  const fmt = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.0', '')}M€` : `${Math.round(v / 1_000)}k€`
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <KpiCard label={t('architecture.kpiInvestment')} value={`${fmt(est.setup.min)}–${fmt(est.setup.max)}`} sub={t('architecture.kpiInvestmentSub')} />
      <KpiCard label={t('architecture.kpiMonthly')} value={`${fmt(est.monthly.min)}–${fmt(est.monthly.max)}`} sub={t('architecture.kpiMonthlySub')} />
      <KpiCard label={t('architecture.kpiTimeline')} value={`${est.durationMonths.min}–${est.durationMonths.max}`} sub={t('architecture.kpiTimelineSub')} />
      <KpiCard label={t('architecture.kpiRisk')} value={answers.compliance === 'strict' ? t('architecture.kpiRiskStrict') : t('architecture.kpiRiskModerate')} accent />
    </div>
  )
}

function ExecRecommendationCard({ result }: { result: ArchitectureResult }) {
  const t = useTranslations('modules')
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 [border-left-width:4px] border-l-primary">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">{t('architecture.execRecommendTitle')}</h3>
      <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
    </div>
  )
}

function NarrativeCard({
  narrative, aiModel, generatedAt, audience, tier, savedId, onAnalyze, usage, error, loading,
}: {
  narrative: { summary?: string } | null
  aiModel: string | null
  generatedAt: string | null
  audience: ResultAudience
  tier: string
  savedId: string | null
  onAnalyze: () => Promise<void>
  usage: { remaining: number; used: number; limit: number; exceeded: boolean } | null
  error: string | null
  loading?: boolean
}) {
  const t = useTranslations('modules')
  const audienceLabel: Record<ResultAudience, string> = {
    exec:       t('architecture.viewExec'),
    architect:  t('architecture.viewArchitect'),
    compliance: t('architecture.viewCompliance'),
  }
  const hasSummary = !!narrative?.summary
  return (
    <div className="border-l-[3px] border-[color:var(--color-ai)] bg-[color:var(--color-ai-soft)] rounded-r-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-[color:var(--color-ai)] font-black text-sm shrink-0" aria-hidden="true">◆</span>
          <h3 className="font-serif text-sm font-semibold text-slate-900 whitespace-nowrap">{t('architecture.narrativeTitle')}</h3>
          {hasSummary && (
            <>
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded whitespace-nowrap',
                loading ? 'bg-purple-200 text-purple-600 animate-pulse' : 'bg-[color:var(--color-ai)] text-white'
              )}>
                {loading ? t('architecture.narrativeLoading') : t('architecture.narrativeGeneratedChip')}
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-white border border-purple-200 text-[color:var(--color-ai)] whitespace-nowrap">
                {audienceLabel[audience]}
              </span>
            </>
          )}
        </div>
        <AIAnalysisButton tier={tier} onAnalyze={onAnalyze} usage={usage} size="sm" />
      </div>
      {!hasSummary && !savedId && tier !== 'free' && (
        <p className="text-xs text-slate-500 mb-1">{t('architecture.narrativeSaveFirst')}</p>
      )}
      {!hasSummary && (
        <p className="text-xs text-slate-400 italic">{t('architecture.narrativePlaceholder')}</p>
      )}
      {hasSummary && (
        <p className={cn('text-sm text-slate-700 leading-relaxed', loading && 'opacity-60')}>{narrative!.summary}</p>
      )}
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      {hasSummary && aiModel && (
        <div className="mt-3 pt-2 border-t border-purple-100 space-y-0.5">
          <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
            {t('architecture.narrativeProvenance')}: {aiModel.replace(' (cached)', '')}
            {generatedAt ? ` · ${new Date(generatedAt).toLocaleDateString('de-DE')}` : ''}
          </p>
          <p className="text-[10px] text-slate-400">
            {t('architecture.narrativeCacheHit')}:{' '}
            <span className={aiModel.includes('(cached)') ? 'text-green-600 font-medium' : ''}>
              {aiModel.includes('(cached)') ? t('architecture.narrativeCacheHitYes') : t('architecture.narrativeCacheHitNo')}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

function ResultBar({
  audience,
  level,
  onAudience,
  onLevel,
  tier,
  presentationTemplate,
  onPresentation,
  savedId,
  locale,
}: {
  audience: ResultAudience
  level: 1 | 2 | 3
  onAudience: (a: ResultAudience) => void
  onLevel: (l: 1 | 2 | 3) => void
  tier: string
  presentationTemplate: 'book' | 'board' | 'blueprint'
  onPresentation: (t: 'book' | 'board' | 'blueprint') => void
  savedId: string | null
  locale: string
}) {
  const t = useTranslations('modules')
  const execDisabled = audience === 'exec'
  const views: ResultAudience[] = ['exec', 'architect', 'compliance']
  const viewLabels: Record<ResultAudience, string> = {
    exec:       t('architecture.viewExec'),
    architect:  t('architecture.viewArchitect'),
    compliance: t('architecture.viewCompliance'),
  }
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-white/95 border-b border-slate-200 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 mb-2">
      {/* SICHT */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('architecture.viewLabel')}</span>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
          {views.map(v => (
            <button
              key={v}
              onClick={() => onAudience(v)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-ring',
                audience === v ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>
      {/* TIEFE — immer sichtbar, in exec-Modus disabled */}
      <div className="flex items-center gap-2">
        <span className={cn('text-[10px] font-bold uppercase tracking-widest whitespace-nowrap', execDisabled ? 'text-slate-300' : 'text-slate-400')}>
          {t('architecture.levelLabel')}
        </span>
        <div className={cn('flex border rounded-lg overflow-hidden', execDisabled ? 'border-slate-100' : 'border-slate-200')}>
          {([1, 2, 3] as const).map(l => (
            <button
              key={l}
              onClick={() => !execDisabled && onLevel(l)}
              disabled={execDisabled}
              title={execDisabled ? t('architecture.execLevelDisabledTooltip') : undefined}
              className={cn(
                'w-10 py-1.5 text-xs font-mono font-semibold transition-colors focus:outline-none',
                execDisabled
                  ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                  : level === l
                    ? 'bg-primary text-white focus:ring-2 focus:ring-inset focus:ring-primary-ring'
                    : 'text-slate-600 hover:bg-slate-50 focus:ring-2 focus:ring-inset focus:ring-primary-ring'
              )}
            >
              L{l}
            </button>
          ))}
        </div>
      </div>
      {/* Präsentationsmodus + PDF */}
      <div className="flex items-center gap-1.5 ml-auto">
        {tier !== 'free' ? (
          (['book', 'board', 'blueprint'] as const).map(tmpl => (
            <button
              key={tmpl}
              onClick={() => onPresentation(tmpl)}
              className={cn(
                'px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring',
                presentationTemplate === tmpl ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              )}
            >
              {tmpl === 'book' ? '◻ ' : tmpl === 'board' ? '⬛ ' : '⬡ '}
              {t(`architecture.presentationTemplate${tmpl.charAt(0).toUpperCase() + tmpl.slice(1)}` as Parameters<typeof t>[0])}
            </button>
          ))
        ) : (
          <button
            className="px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-slate-200 text-slate-400 whitespace-nowrap cursor-default"
            title={t('architecture.presentationModeButton')}
            disabled
          >
            ⬡ {t('architecture.presentationModeButton')} 🔒
          </button>
        )}
        {savedId && tier !== 'free' && (
          <a
            href={`/api/export/pdf?module=architecture&entityId=${savedId}&locale=${locale}&template=${presentationTemplate}&audience=${audience}&level=${level}`}
            download
            className="px-3 py-1.5 bg-primary text-white text-[10px] font-semibold rounded-lg whitespace-nowrap hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring"
          >
            {t('architecture.pdfButtonLabel')}
          </a>
        )}
      </div>
    </div>
  )
}

const DSGVO_BADGE: Record<string, string> = {
  compliant:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  conditional:   'bg-amber-50 text-amber-700 border-amber-200',
  non_compliant: 'bg-red-50 text-red-700 border-red-200',
}
const DSGVO_LABEL: Record<string, string> = {
  compliant: 'DSGVO ✓', conditional: 'DSGVO ~', non_compliant: 'DSGVO ✗',
}
const LAYER_LABEL: Record<string, string> = {
  data: 'Daten', model: 'Modell', mlops: 'MLOps', serving: 'Serving',
  governance: 'Governance', security: 'Security', application: 'Anwendung',
}

const JOULE_DOMAIN_BADGE: Record<string, string> = {
  Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Supply Chain': 'bg-primary-soft text-primary-hover border-primary-border',
  HR: 'bg-violet-50 text-violet-700 border-violet-200',
  Procurement: 'bg-amber-50 text-amber-700 border-amber-200',
  CX: 'bg-pink-50 text-pink-700 border-pink-200',
  Transformation: 'bg-slate-100 text-slate-700 border-slate-200',
}

function JouleUseCasesCard({ useCases }: { useCases: JouleUseCase[] }) {
  const t = useTranslations('modules')
  if (useCases.length === 0) return null
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">SAP</span>
        <h3 className="text-sm font-semibold text-slate-900">{t('architecture.jouleTitle')}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {useCases.map(uc => (
          <div key={uc.name} className="border border-slate-100 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', JOULE_DOMAIN_BADGE[uc.domain] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
                {uc.domain}
              </span>
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', {
                starter:     'bg-slate-50 text-slate-500 border-slate-200',
                scaler:      'bg-primary-soft text-primary border-primary-border',
                transformer: 'bg-violet-50 text-violet-600 border-violet-200',
              }[uc.complexity])}>
                {uc.complexity === 'starter' ? t('architecture.complexityStarter') : uc.complexity === 'scaler' ? t('architecture.complexityScaler') : t('architecture.complexityTransformer')}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">{uc.name}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{uc.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}


const RASIC_ROLE_DEFAULTS: Record<string, Partial<Record<RasicPhase, RasicValue>>> = {
  'AI Product Owner':          { konzeption: 'A', daten: 'I', build: 'I', freigabe: 'A', betrieb: 'I' },
  'Business AI Champion':      { konzeption: 'R', daten: 'S', build: 'S', freigabe: 'R', betrieb: 'S' },
  'Data Engineer':             { konzeption: 'S', daten: 'R', build: 'R', freigabe: 'S', betrieb: 'S' },
  'ML Engineer':               { konzeption: 'S', daten: 'S', build: 'R', freigabe: 'S', betrieb: 'S' },
  'MLOps Engineer':            { konzeption: 'I', daten: 'S', build: 'A', freigabe: 'I', betrieb: 'R' },
  'Data Scientist':            { konzeption: 'S', daten: 'C', build: 'R', freigabe: 'S', betrieb: 'S' },
  'Data Privacy Manager':      { konzeption: 'C', daten: 'C', build: 'C', freigabe: 'C', betrieb: 'C' },
  'AI Ethics / Risk Officer':  { konzeption: 'C', daten: 'C', build: 'C', freigabe: 'A', betrieb: 'C' },
  'SAP AI Architect':          { konzeption: 'R', daten: 'C', build: 'C', freigabe: 'S', betrieb: 'I' },
  'Enterprise Architect (AI)': { konzeption: 'C', daten: 'C', build: 'C', freigabe: 'C', betrieb: 'C' },
  'Prompt Engineer':           { konzeption: 'S', daten: 'I', build: 'R', freigabe: 'S', betrieb: 'S' },
  'AI CoE Lead':               { konzeption: 'A', daten: 'I', build: 'I', freigabe: 'A', betrieb: 'A' },
  'Chief Data Officer (CDO)':  { konzeption: 'A', daten: 'A', build: 'I', freigabe: 'A', betrieb: 'A' },
}

function autoFillRasic(rasic: RasicMatrix): RasicMatrix {
  const newEntries = rasic.entries.map(entry => {
    const defaults = RASIC_ROLE_DEFAULTS[entry.role]
    if (!defaults) return entry
    const assignments = { ...entry.assignments }
    for (const phase of rasic.phases as RasicPhase[]) {
      if (!assignments[phase] && defaults[phase]) {
        assignments[phase] = defaults[phase] as RasicValue
      }
    }
    return { ...entry, assignments }
  })
  return { ...rasic, entries: newEntries }
}

function SortableSection({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      id={id}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-75')}
    >
      <div
        {...attributes}
        {...listeners}
        className="hidden md:flex absolute -left-5 top-3 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 select-none focus:outline-none"
        aria-label="Abschnitt verschieben"
        role="button"
        tabIndex={0}
      >
        ⠿
      </div>
      {children}
    </div>
  )
}

const DEFAULT_RESULT_SECTIONS = ['cost', 'pattern', 'eam', 'joule', 'rasic', 'decisions'] as const
type ResultSectionId = typeof DEFAULT_RESULT_SECTIONS[number]
const SECTION_ORDER_KEY = 'arch_result_section_order_v1'

export function ArchitecturePageClient({ initialArchitectures = [], assessmentContext = null, governanceContext = null, compliancePreset, tier = 'free', canvasContext = null, roadmapContext = null, synonyms = [], rolesCatalog = [] }: Props) {
  const t = useTranslations('modules')
  const locale = useLocale()
  const [architectures, setArchitectures] = useState<SavedArchitecture[]>(initialArchitectures)
  const [view, setView] = useState<View>(initialArchitectures.length === 0 ? 'wizard' : 'list')
  const [selectedComp, setSelectedComp] = useState<CatalogComponent | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<WizardAnswers>(() => {
    // Compliance aus drei Quellen: explizites compliancePreset > Governance-DSGVO-Stop > nichts
    const governanceCompliance: Partial<WizardAnswers> =
      governanceContext?.result === 'stop_dsgvo' ? { compliance: 'strict' } : {}
    const base: Partial<WizardAnswers> = {
      ...governanceCompliance,
      ...(compliancePreset ? { compliance: compliancePreset } : {}),
    }
    if (canvasContext) {
      const ctx = extractCanvasContext(canvasContext.canvas, canvasContext.useCase, [], synonyms)
      return { ...base, ...ctx.wizard_prefill }
    }
    return base as WizardAnswers
  })
  const [canvasCtx, setCanvasCtx] = useState<CanvasContext | null>(() => {
    if (!canvasContext) return null
    return extractCanvasContext(canvasContext.canvas, canvasContext.useCase, [], synonyms)
  })
  const [showCanvasBanner, setShowCanvasBanner] = useState(!!canvasContext)
  const [selectedCanvasIds, setSelectedCanvasIds] = useState<string[]>(canvasContext ? [canvasContext.canvas.id] : [])
  const [result, setResult] = useState<ArchitectureResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [dsgvoConfirmed, setDsgvoConfirmed] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [aiNarrative, setAiNarrative] = useState<{ summary?: string; key_decisions: { de: string; en: string }[]; next_steps: { de: string; en: string }[]; component_suggestions?: string[] } | null>(null)
  const [aiGeneratedAt, setAiGeneratedAt] = useState<string | null>(null)
  const [narrativeLocale, setNarrativeLocale] = useState<string | null>(null)
  const [aiUsageArch, setAiUsageArch] = useState<{ remaining: number; used: number; limit: number; exceeded: boolean } | null>(null)
  const [aiNarrativeError, setAiNarrativeError] = useState<string | null>(null)
  const [aiModel, setAiModel] = useState<string | null>(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [validationOverrides, setValidationOverrides] = useState<Record<string, ValidationOverride>>({})
  const [catalogRecs, setCatalogRecs] = useState<CatalogRecommendations | null>(null)
  const [recComponents, setRecComponents] = useState<CatalogComponent[]>([])
  const [activeComponentNames, setActiveComponentNames] = useState<Set<string>>(new Set())
  const [componentSources, setComponentSources] = useState<Record<string, 'rule' | 'ai' | 'manual'>>({})
  const [resultShowAltFor, setResultShowAltFor] = useState<Set<string>>(new Set())
  const [jouleUseCases, setJouleUseCases] = useState<JouleUseCase[]>([])
  const catalogFetched = useRef(false)
  const [resultAudience, setResultAudience] = useState<ResultAudience>('architect')
  const [resultLevel, setResultLevel] = useState<1 | 2 | 3>(1)
  const [rasic, setRasic] = useState<RasicMatrix | null>(null)
  const [presentationTemplate, setPresentationTemplate] = useState<'book' | 'board' | 'blueprint'>('book')
  const [aiAccepted, setAiAccepted] = useState<string[]>([])
  const [componentOwners, setComponentOwners] = useState<Record<string, string>>({})
  const [componentOpsNotes, setComponentOpsNotes] = useState<Record<string, string>>({})
  const [workbenchForceTab, setWorkbenchForceTab] = useState<'komponenten' | null>(null)

  const [resultSectionOrder, setResultSectionOrder] = useState<ResultSectionId[]>(() => {
    if (typeof window === 'undefined') return [...DEFAULT_RESULT_SECTIONS]
    try {
      const stored = localStorage.getItem(SECTION_ORDER_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        const valid = parsed.filter((id): id is ResultSectionId =>
          (DEFAULT_RESULT_SECTIONS as readonly string[]).includes(id)
        )
        if (valid.length === DEFAULT_RESULT_SECTIONS.length) return valid
      }
    } catch {}
    return [...DEFAULT_RESULT_SECTIONS]
  })
  const dndSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Scroll main back to top when entering result view — prevents sticky bar from
  // being immediately stuck because main retained scroll position from wizard steps
  useEffect(() => {
    if (view === 'result') {
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [view])

  useEffect(() => {
    localStorage.setItem(SECTION_ORDER_KEY, JSON.stringify(resultSectionOrder))
  }, [resultSectionOrder])

  // PostHog: eam_validation — fires whenever EAM validation recomputes in result view
  useEffect(() => {
    if (view !== 'result' || !result || resultAudience === 'exec') return
    const phStats = getSelectionStats({
      activeComponentNames,
      fallbackNames: catalogRecs?.layers.flatMap(lr => lr.componentNames),
      components: recComponents,
    })
    const eamRes = runEamValidation(rasic ?? undefined, phStats.activeComponents, answers.compliance, phStats.activeCount)
    ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
      .posthog?.capture('eam_validation', {
        passed_count: eamRes.filter(r => r.passed).length,
        total_count: eamRes.length,
      })
  }, [view, result, resultAudience, rasic, recComponents, activeComponentNames, catalogRecs, answers])

  // Case-insensitive Set der aktiven Namen — verhindert Duplikate durch Vendor-Schreibvarianten (#181)
  const activeNameKeySet = useMemo(
    () => new Set([...activeComponentNames].map(n => n.toLowerCase().trim())),
    [activeComponentNames],
  )

  const totalSteps = WIZARD_STEPS.length
  const step = WIZARD_STEPS[currentStep]
  const selectedOptionId = answers[step?.id ?? 'infra']
  const isLastStep = currentStep === totalSteps - 1
  const progress = Math.round((currentStep / totalSteps) * 100)

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: optionId }))
  }

  function applyRecs(wizardAnswers: WizardAnswers, loadedCatalog?: CatalogComponent[], savedRasic?: RasicMatrix | null, savedSelection?: string[]) {
    const catalog = loadedCatalog ?? recComponents
    // #182 Lazy-Migration: gespeicherte Auswahl gewinnt gegen frisch berechnete
    // Empfehlungen; Alt-Datensätze ohne selectedComponents fallen auf die Empfehlung zurück.
    const applySelection = (recNames: Set<string>) =>
      setActiveComponentNames(savedSelection && savedSelection.length > 0 ? new Set(savedSelection) : recNames)
    let recs: CatalogRecommendations
    if (catalog.length > 0) {
      recs = recommendFromCatalog(wizardAnswers, catalog)
      setCatalogRecs(recs)
    } else {
      recs = recommendFromWizard(wizardAnswers)
      setCatalogRecs(recs)
    }
    applySelection(new Set(recs.layers.flatMap(lr => lr.componentNames)))
    setJouleUseCases(recommendJouleUseCases(
      wizardAnswers,
      assessmentContext?.archetype ?? null,
      canvasCtx?.wizard_prefill?.industry ?? null
    ))
    // Generate RASIC from roleNames — use saved version if available
    if (savedRasic !== undefined) {
      setRasic(savedRasic ?? null)
    } else {
      setRasic(generateRasic(recs.roleNames, rolesCatalog, wizardAnswers.compliance))
    }
    if (!catalogFetched.current) {
      catalogFetched.current = true
      fetch('/api/catalog/components')
        .then(r => r.json())
        .then(({ data }: { data: CatalogComponent[] }) => {
          const loaded = data ?? []
          setRecComponents(loaded)
          const catalogResult = recommendFromCatalog(wizardAnswers, loaded)
          if (isSAP(wizardAnswers)) {
            // SAP-Kontext: Phase-1-Wizard-Recs stabil halten — Katalog nur für Vorschläge.
            // Wenn der Katalog gar keine SAP-Komponenten hat, Wizard-Recs explizit setzen.
            const hasSAPLayer = catalogResult.layers.some(lr =>
              lr.componentNames.some(n => loaded.find(c => c.name === n)?.cloud_provider === 'sap')
            )
            if (!hasSAPLayer) {
              const fallbackRecs = recommendFromWizard(wizardAnswers)
              setCatalogRecs(fallbackRecs)
              applySelection(new Set(fallbackRecs.layers.flatMap(lr => lr.componentNames)))
            }
            // hasSAPLayer=true → Phase-1-Recs bleiben unverändert (kein setCatalogRecs)
          } else {
            setCatalogRecs(catalogResult)
            applySelection(new Set(catalogResult.layers.flatMap(lr => lr.componentNames)))
          }
          if (canvasContext) {
            setCanvasCtx(extractCanvasContext(canvasContext.canvas, canvasContext.useCase, loaded, synonyms))
          }
        })
        .catch(() => { catalogFetched.current = false })
    }
  }

  const handleNext = () => {
    if (isLastStep) {
      setResult(generateArchitecture(answers))
      setSaved(false)
      applyRecs(answers)
      setView('result') // #163: Komponenten-Auswahl-Schritt entfernt — Auto-Selektion, Anpassung via TechnicalArchitectureOptimisation
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  const handleConfirmSelection = (selected: Set<string>, sources: Record<string, 'rule' | 'ai' | 'manual'>) => {
    setActiveComponentNames(selected)
    setComponentSources(sources)
    setView('result')
  }

  const handleNewWizard = () => {
    setAnswers({})
    setCurrentStep(0)
    setResult(null)
    setSaved(false)
    setSavedId(null)
    setCatalogRecs(null)
    setActiveComponentNames(new Set())
    setJouleUseCases([])
    setCanvasCtx(null)
    setShowCanvasBanner(false)
    setSelectedCanvasIds([])
    setRasic(null)
    setAiModel(null)
    // Canvas-Scope-Schritt zeigen (wird übersprungen wenn keine Canvases vorhanden)
    setView('canvas-scope')
  }

  const handleCanvasScopeConfirm = (canvasIds: string[], canvases: import('@/types').Canvas[]) => {
    setSelectedCanvasIds(canvasIds)
    if (canvases.length > 0) {
      const contexts = canvases.map(cv => {
        const minimalUseCase: import('@/types').UseCase = {
          id: cv.id, portfolio_id: '', name: cv.title, domain: null,
          description: cv.data.problem?.slice(0, 200) ?? '',
          scores: {}, weighted_score: 0,
          quadrant: ((cv.ai_enrichment as Record<string, unknown> | null)?.suggested_quadrant as import('@/types').UseCase['quadrant']) ?? 'quick_win',
          canvas_id: cv.id, governance_result: null, created_at: cv.created_at, updated_at: cv.updated_at,
        }
        return extractCanvasContext(cv, minimalUseCase, recComponents, synonyms)
      })
      const merged = mergeCanvasContexts(contexts)
      setAnswers(prev => ({ ...prev, ...merged.prefill }))
      setCanvasCtx(contexts[0] ?? null)
      setShowCanvasBanner(true)
    }
    setView('wizard')
  }

  const handleViewSaved = (arch: SavedArchitecture) => {
    setAnswers(arch.wizard_data)
    setResult(arch.result)
    setSaved(true)
    setSavedId(arch.id)
    setAiNarrative(arch.ai_narrative ?? null)
    setNarrativeLocale(arch.narrative_locale ?? null)
    setAiUsageArch(null)
    setAiModel(null)
    setView('result')
    const saved = arch.result as unknown as { componentOwners?: Record<string, string>; componentOpsNotes?: Record<string, string>; selectedComponents?: string[] }
    // #182 Lazy-Migration: fehlt rasic im Alt-Datensatz, wird er in applyRecs
    // regeneriert statt „nicht generiert" zu melden (undefined ⇒ generateRasic);
    // fehlende selectedComponents fallen auf die Empfehlungen zurück.
    applyRecs(arch.wizard_data, undefined, arch.result.rasic, saved.selectedComponents)
    setComponentOwners(saved.componentOwners ?? {})
    setComponentOpsNotes(saved.componentOpsNotes ?? {})
    setComponentSources(arch.result.componentSources ?? {})
  }

  const handleAINarrative = async (audienceOverride?: ResultAudience) => {
    if (!savedId) return
    setAiNarrativeError(null)
    setNarrativeLoading(true)
    const components = getSelectionStats({
      activeComponentNames,
      fallbackNames: catalogRecs?.layers.flatMap(lr => lr.componentNames),
      components: recComponents,
    }).activeComponents.map(c => c.name)
    const roles = rolesCatalog.map(r => r.role_name).slice(0, 10)
    const res = await fetch(`/api/architecture/${savedId}/ai-narrative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        components,
        roles,
        compliance: answers.compliance ?? undefined,
        archetype: assessmentContext?.archetype ?? undefined,
        canvas_quadrant: canvasContext?.useCase?.quadrant ?? undefined,
        governance_result: governanceContext?.result ?? undefined,
        roadmap_phases: roadmapContext?.phasesCount ?? 0,
        locale,
        audience: audienceOverride ?? resultAudience,
      }),
    })
    const json = await res.json() as {
      result?: { summary?: string; key_decisions: { de: string; en: string }[]; next_steps: { de: string; en: string }[]; component_suggestions?: string[] }
      usage?: { remaining: number; used: number; limit: number; exceeded: boolean }
      ai_model?: string
      error?: string
    }
    if (json.usage) setAiUsageArch(json.usage)
    if (!res.ok) { setAiNarrativeError(json.error ?? 'KI-Analyse fehlgeschlagen'); setNarrativeLoading(false); return }
    if (json.result) {
      setAiNarrative(json.result)
      setAiGeneratedAt(new Date().toISOString())
      setNarrativeLocale(locale)
      setAiAccepted([])
      setResult(prev => prev ? { ...prev, rejected_suggestions: [] } : prev)
    }
    if (json.ai_model) setAiModel(json.ai_model as string)
    setNarrativeLoading(false)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      const dateStr = new Date().toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
      const title = `${result.pattern} — ${dateStr}`
      const res = await fetch('/api/architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, wizard_data: answers, result: { ...result, rasic: rasic ?? result.rasic, selectedComponents: [...activeComponentNames], componentSources, componentOwners, componentOpsNotes } }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setArchitectures(prev => [data, ...prev])
        setSaved(true)
        setSavedId(data.id)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/architecture/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setArchitectures(prev => prev.filter(a => a.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (view === 'list') {
    return (
      <div className="max-w-2xl space-y-5">
        <UnifiedContextBanner
          assessmentContext={assessmentContext}
          governanceContext={governanceContext}
          compliancePreset={compliancePreset}
          roadmapContext={roadmapContext}
        />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">{t('architecture.savedTitle', { count: architectures.length })}</h2>
          <button
            onClick={handleNewWizard}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            {t('architecture.newButton')}
          </button>
        </div>
        {architectures.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
            {t('architecture.emptyList')}
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {architectures.map(arch => (
              <li key={arch.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{arch.title ?? arch.result.pattern}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{arch.result.pattern}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(arch.updated_at).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleViewSaved(arch)}
                      className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1"
                    >
                      {t('architecture.viewButton')}
                    </button>
                    <button
                      onClick={() => handleDelete(arch.id)}
                      disabled={deletingId === arch.id}
                      aria-label={t('architecture.deleteAriaLabel', { title: arch.title ?? arch.result.pattern })}
                      className="px-3 py-1.5 text-xs font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                      {deletingId === arch.id ? '…' : t('architecture.deleteButton')}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  if (view === 'canvas-scope') {
    return (
      <div className="max-w-xl">
        <CanvasScopeStep
          initialCanvasId={canvasContext?.canvas.id ?? null}
          locale={locale}
          onConfirm={handleCanvasScopeConfirm}
          onSkip={() => setView('wizard')}
        />
      </div>
    )
  }

  if (view === 'result' && result) {
    const patternReasons = selectPatternReason(answers)
    const canvasEnrichment = canvasContext?.canvas.ai_enrichment as { use_case_type?: string; confidence?: number; additional_compliance_flags?: string[] } | null | undefined
    const rejected = result.rejected_suggestions ?? []
    const handleAccept = (name: string) => {
      // #181: Case-insensitiver Guard — nie eine Namensvariante doppelt übernehmen
      if (activeNameKeySet.has(name.toLowerCase().trim())) return
      const comp = recComponents.find(c => c.name === name)
      if (comp?.architecture_layer) {
        setCatalogRecs(prev => {
          if (!prev) return prev
          const layers = prev.layers.map(lr =>
            lr.layer === comp.architecture_layer && !lr.componentNames.includes(name)
              ? { ...lr, componentNames: [...lr.componentNames, name] }
              : lr
          )
          return { ...prev, layers }
        })
      }
      setComponentSources(prev => ({ ...prev, [name]: 'ai' as const }))
      setAiAccepted(prev => prev.includes(name) ? prev : [...prev, name])
      setResult(prev => prev ? { ...prev, rejected_suggestions: rejected.filter(n => n !== name) } : prev)
    }
    const handleReject = (name: string) => {
      setResult(prev => prev ? { ...prev, rejected_suggestions: [...(prev.rejected_suggestions ?? []), name] } : prev)
    }
    const handleAcceptAll = () => {
      const suggestions = aiNarrative?.component_suggestions ?? []
      const rejSet = new Set(result.rejected_suggestions ?? [])
      const toAccept: string[] = []
      suggestions.filter(n => !rejSet.has(n) && !aiAccepted.includes(n) && !activeNameKeySet.has(n.toLowerCase().trim())).forEach(name => {
        const comp = recComponents.find(c => c.name === name)
        if (comp?.architecture_layer) {
          setCatalogRecs(prev => {
            if (!prev) return prev
            const layers = prev.layers.map(lr =>
              lr.layer === comp.architecture_layer && !lr.componentNames.includes(name)
                ? { ...lr, componentNames: [...lr.componentNames, name] }
                : lr
            )
            return { ...prev, layers }
          })
        }
        setComponentSources(prev => ({ ...prev, [name]: 'ai' as const }))
        toAccept.push(name)
      })
      if (toAccept.length > 0) setAiAccepted(prev => [...prev, ...toAccept.filter(n => !prev.includes(n))])
      setResult(prev => prev ? { ...prev, rejected_suggestions: [] } : prev)
    }
    // Gate D (#182): EINE Selektor-Instanz für den gesamten Ergebnis-Screen —
    // Validierung, Workbench, Panel, Landkarte und DSGVO-Warnung lesen dieselbe Quelle.
    const selStats = getSelectionStats({
      activeComponentNames,
      fallbackNames: catalogRecs?.layers.flatMap(lr => lr.componentNames),
      components: recComponents,
      aiSuggestions: aiNarrative?.component_suggestions,
      rejectedSuggestions: result.rejected_suggestions,
      acceptedSuggestions: aiAccepted,
    })
    const activeCompsForEam = selStats.activeComponents
    const eamResults = resultAudience !== 'exec'
      ? runEamValidation(rasic ?? undefined, selStats.activeComponents, answers.compliance, selStats.activeCount)
      : []

    // Key Decisions + Next Steps — VOR dem return-Statement (für DnD-Mapping)
    const kpComponents = selStats.activeComponents
    const kpDecisions = generateDynamicKeyDecisions(kpComponents)
    const kpSteps = generateDynamicNextSteps(kpComponents)
    const kpCrossDecisions = generateCrossModuleDecisions({
      assessment: assessmentContext,
      canvas: canvasContext,
      governance: governanceContext,
      roadmap: roadmapContext,
    })
    const kpCrossSteps = generateCrossModuleNextSteps({
      assessment: assessmentContext,
      canvas: canvasContext,
      governance: governanceContext,
      roadmap: roadmapContext,
    })
    const kpAiDec = aiNarrative?.key_decisions ?? []
    const kpAiStp = aiNarrative?.next_steps ?? []
    const kpSeenDe = new Set([...kpAiDec, ...kpCrossDecisions, ...kpDecisions].map(d => d.de))
    const kpSeenStepDe = new Set([...kpAiStp, ...kpCrossSteps, ...kpSteps].map(s => s.de))
    const allKeyDecisions = [...kpAiDec, ...kpCrossDecisions, ...kpDecisions, ...result.keyDecisions.filter(d => !kpSeenDe.has(d.de))]
    const allNextSteps = [...kpAiStp, ...kpCrossSteps, ...kpSteps, ...result.nextSteps.filter(s => !kpSeenStepDe.has(s.de))]

    return (
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start"
        data-presentation={presentationTemplate !== 'book' ? presentationTemplate : undefined}
      >
      <div className="space-y-5 min-w-0 max-w-2xl">
        {/* Sticky Sichten + Detailtiefe + Präsentation Bar */}
        <ResultBar
          audience={resultAudience}
          level={resultLevel}
          onAudience={a => {
            setResultAudience(a)
            ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
              .posthog?.capture('arch_view_switched', { audience: a })
            if (a === 'exec') setResultLevel(1)
          }}
          onLevel={setResultLevel}
          tier={tier}
          presentationTemplate={presentationTemplate}
          onPresentation={(tmpl) => {
            setPresentationTemplate(tmpl)
            ;(window as Window & { posthog?: { capture: (e: string, p?: object) => void } })
              .posthog?.capture('arch_presentation_mode', { template: tmpl, tier })
          }}
          savedId={savedId}
          locale={locale}
        />

        <UnifiedContextBanner
          assessmentContext={assessmentContext}
          governanceContext={governanceContext}
          compliancePreset={compliancePreset}
          roadmapContext={roadmapContext}
          canvasContext={canvasCtx}
          canvasTitle={canvasContext?.canvas.title}
        />

        {/* KI-Einordnung Narrativ-Karte */}
        <NarrativeCard
          narrative={aiNarrative}
          aiModel={aiModel}
          generatedAt={aiGeneratedAt}
          audience={resultAudience}
          tier={tier}
          savedId={savedId}
          onAnalyze={handleAINarrative}
          usage={aiUsageArch}
          error={aiNarrativeError}
          loading={narrativeLoading}
        />

        {/* Exec: KPI-Kennzahlenstreifen */}
        {resultAudience === 'exec' && (
          <ExecKpiStrip result={result} answers={answers} />
        )}

        {/* Compliance: Hinweis-Banner */}
        {resultAudience === 'compliance' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 leading-relaxed">
            {t('architecture.complianceHighlightHint')}
          </div>
        )}

        {/* DSGVO-Warnung bei bedingter Konformität — nur Komponenten die im Diagramm aktiv sind */}
        {(() => {
          const conditionalComps = selStats.activeComponents.filter(c => c.dsgvo_status === 'conditional')
          if (conditionalComps.length === 0) return null
          return (
            <div role="alert" className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="text-amber-600 text-lg flex-shrink-0" aria-hidden="true">⚠</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    {t('architecture.dsgvoWarningTitle')}
                  </h3>
                  <p className="text-xs text-amber-800 mb-2 leading-relaxed">
                    {t('architecture.dsgvoWarningBody')}
                  </p>
                  <ul className="mb-3 space-y-1">
                    {conditionalComps.map(c => (
                      <li key={c.name} className="text-xs text-amber-700 flex items-center gap-1.5">
                        <span aria-hidden="true">·</span>
                        <strong>{c.name}</strong>
                        {c.vendor && <span className="text-amber-600">({c.vendor})</span>}
                      </li>
                    ))}
                  </ul>
                  {!dsgvoConfirmed && (
                    <button
                      onClick={() => setDsgvoConfirmed(true)}
                      className="text-xs font-medium px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
                    >
                      {t('architecture.dsgvoConfirmButton')}
                    </button>
                  )}
                  {dsgvoConfirmed && (
                    <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                      <span aria-hidden="true">✓</span> {t('architecture.dsgvoConfirmedMsg')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Locale-Mismatch-Warnung */}
        {aiNarrative && narrativeLocale && narrativeLocale !== locale && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <span>{locale === 'de' ? '⚠ Analyse wurde auf Englisch gespeichert.' : '⚠ Analysis was saved in German.'}</span>
            <button
              onClick={() => void handleAINarrative()}
              className="whitespace-nowrap font-semibold underline underline-offset-2 hover:text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-600 rounded"
            >
              {locale === 'de' ? 'Auf Deutsch neu generieren' : 'Re-generate in English'}
            </button>
          </div>
        )}

        {/* Drag&Drop Sektionen — vollständig umsortierbar (#166): Pattern, EAM-Karte, Kosten, Joule, RASIC, Key Decisions */}
        <DndContext
          sensors={dndSensors}
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event
            if (over && active.id !== over.id) {
              setResultSectionOrder(prev => {
                const oldIndex = prev.indexOf(active.id as ResultSectionId)
                const newIndex = prev.indexOf(over.id as ResultSectionId)
                return arrayMove(prev, oldIndex, newIndex)
              })
            }
          }}
        >
          <SortableContext items={resultSectionOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-6 md:pl-6">
              {resultSectionOrder.map(sectionId => {
                if (sectionId === 'cost') {
                  if (resultAudience === 'exec') return null
                  return (
                    <SortableSection key="cost" id="cost">
                      <CostIndicationCard patternId={result.patternId} companySize={answers.company_size} locale={locale} />
                    </SortableSection>
                  )
                }
                if (sectionId === 'pattern') {
                  return (
                    <SortableSection key="pattern" id="pattern">
                      <div className={cn('rounded-2xl border p-5 sm:p-6', result.color.bg, result.color.border)}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', result.color.badge)}>
                            {t('architecture.patternBadge')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <h2 className={cn('text-base sm:text-lg font-semibold min-w-0', result.color.title)}>{result.pattern}</h2>
                          {patternReasons.length > 0 && (
                            <InfoHint title={t('architecture.patternWhyTitle')} side="bottom">
                              <ul className="space-y-1">
                                {patternReasons.map((r, i) => (
                                  <li key={i} className="flex gap-1.5">
                                    <span className="text-primary font-medium flex-shrink-0">✓</span>
                                    <span className="min-w-0">{pick(r, locale)}</span>
                                  </li>
                                ))}
                              </ul>
                            </InfoHint>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{result.summary}</p>
                      </div>
                    </SortableSection>
                  )
                }
                if (sectionId === 'eam') {
                  if (resultAudience === 'exec' && catalogRecs) {
                    const effectiveNamesLk = selStats.effectiveNames
                    const eamOk = runEamValidation(rasic ?? undefined, selStats.activeComponents, answers.compliance, selStats.activeCount).every(r => r.passed)
                    return (
                      <SortableSection key="eam" id="eam">
                        <div className="space-y-4">
                          <ArchitekturLandkarte
                            catalogRecs={catalogRecs}
                            components={recComponents}
                            activeNames={effectiveNamesLk}
                            aiSuggested={new Set(aiNarrative?.component_suggestions ?? [])}
                            complianceMode={false}
                            execMode={true}
                            level={resultLevel}
                            answers={answers}
                            useCaseName={governanceContext?.use_case_name ?? canvasContext?.useCase?.name ?? null}
                            eamValid={eamOk}
                          />
                          <ExecRecommendationCard result={result} />
                        </div>
                      </SortableSection>
                    )
                  }
                  if (resultAudience !== 'exec') {
                    return (
                      <SortableSection key="eam" id="eam">
                        <EamMap
                          result={result}
                          activeComponents={selStats.activeComponents}
                          componentSources={componentSources}
                          componentOwners={componentOwners}
                          componentOpsNotes={componentOpsNotes}
                          eamResults={eamResults}
                          roleNames={catalogRecs?.roleNames ?? []}
                          detailLevel={resultLevel}
                          locale={locale}
                        />
                      </SortableSection>
                    )
                  }
                  return null
                }
                if (sectionId === 'joule') {
                  return resultAudience !== 'exec' ? (
                    <SortableSection key="joule" id="joule">
                      <JouleUseCasesCard useCases={jouleUseCases} />
                    </SortableSection>
                  ) : null
                }
                if (sectionId === 'decisions') {
                  return (
                    <SortableSection key="decisions" id="decisions">
                      <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-sm font-semibold text-slate-900">{t('architecture.keyDecisions')}</h3>
                            {aiNarrative && <AIBadge />}
                          </div>
                          <ul className="space-y-2.5" role="list">
                            {allKeyDecisions.map((decision, i) => (
                              <li key={i} className="flex gap-2.5 text-xs text-slate-600">
                                <span className="flex-shrink-0 mt-0.5 w-4 h-4 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-semibold text-[10px]">
                                  {i + 1}
                                </span>
                                <span className="min-w-0">{pick(decision, locale)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                          <h3 className="text-sm font-semibold text-slate-900 mb-3">{t('architecture.nextSteps')}</h3>
                          <ul className="space-y-2.5" role="list">
                            {allNextSteps.map((s, i) => (
                              <li key={i} className="flex gap-2.5 text-xs text-slate-600">
                                <span className="flex-shrink-0 mt-0.5 w-4 h-4 bg-primary-soft text-primary-hover rounded-full flex items-center justify-center font-semibold text-[10px]">
                                  {i + 1}
                                </span>
                                <span className="min-w-0">{pick(s, locale)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </SortableSection>
                  )
                }
                if (sectionId === 'rasic') {
                  const hasOpenRasicViolations = eamResults.some(r =>
                    (r.ruleId === 'r1' || r.ruleId === 'r2') && !r.passed && !validationOverrides[r.ruleId]
                  )
                  return resultAudience !== 'exec' ? (
                    <SortableSection key="rasic" id="rasic">
                      <div className="space-y-4">
                        {/* RASIC Erklärung / Hilfetext */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                          <h3 className="text-sm font-semibold text-slate-900 mb-1">{t('architecture.rasicTitle')}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">{t('architecture.rasicSectionDescription')}</p>
                        </div>

                        {/* EAM-Validierungsbanner — nur bei offenen Regelverstößen */}
                        {hasOpenRasicViolations && (
                          <EamValidationBanner
                            results={eamResults.filter(r => r.ruleId === 'r1' || r.ruleId === 'r2')}
                            overrides={validationOverrides}
                            onOverride={(ruleId, override) => {
                              setValidationOverrides(prev => {
                                if (!override) { const { [ruleId]: _, ...rest } = prev; return rest }
                                return { ...prev, [ruleId]: override }
                              })
                            }}
                          />
                        )}

                        {/* RASIC-Matrix */}
                        {rasic ? (
                          <>
                            <RasicMatrixCard
                              rasic={rasic}
                              readOnly={resultAudience === 'compliance'}
                              onUpdate={updated => {
                                setRasic(updated)
                                setResult(prev => prev ? { ...prev, rasic: updated } : prev)
                                ;(window as Window & { posthog?: { capture: (e: string) => void } }).posthog?.capture('rasic_edited')
                              }}
                              componentOwners={componentOwners}
                            />
                            {resultAudience !== 'compliance' && (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filled = autoFillRasic(rasic)
                                    setRasic(filled)
                                    setResult(prev => prev ? { ...prev, rasic: filled } : prev)
                                  }}
                                  className="px-3 py-1.5 text-xs font-semibold border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 whitespace-nowrap"
                                >
                                  {t('architecture.rasicSuggestButton')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleSave()}
                                  disabled={saving}
                                  className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-ring whitespace-nowrap"
                                >
                                  {saving ? t('architecture.saving') : t('architecture.save')}
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div id="rasic-matrix" className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 text-center">
                            <p className="text-sm text-slate-400">{t('architecture.rasicNotGenerated')}</p>
                          </div>
                        )}

                        {resultAudience === 'compliance' && (
                          <ComplianceControlTable activeComponents={activeCompsForEam} rasic={rasic ?? undefined} />
                        )}
                      </div>
                    </SortableSection>
                  ) : null
                }
                return null
              })}
            </div>
          </SortableContext>
        </DndContext>
        <div className="flex justify-end">
          <button
            onClick={() => setResultSectionOrder([...DEFAULT_RESULT_SECTIONS])}
            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 focus:outline-none"
          >
            {t('architecture.resetSectionOrder')}
          </button>
        </div>

        {/* Bereich 2 — Technical Architecture Workbench (#179): 3 Tabs, nur Architektur-Sicht */}
        {resultAudience === 'architect' && catalogRecs && (
          <ArchitectureWorkbench
            catalogRecs={catalogRecs}
            recComponents={recComponents}
            activeComponentNames={activeComponentNames}
            onCheckedChange={setActiveComponentNames}
            aiSuggestions={aiNarrative?.component_suggestions ?? []}
            componentSources={componentSources}
            aiSuggested={new Set(aiNarrative?.component_suggestions ?? [])}
            level={resultLevel}
            answers={answers}
            useCaseName={governanceContext?.use_case_name ?? canvasContext?.useCase?.name ?? null}
            locale={locale}
            componentOwners={componentOwners}
            componentOpsNotes={componentOpsNotes}
            onOwnerChange={(name, role) => setComponentOwners(prev => ({ ...prev, [name]: role }))}
            onOpsNotesChange={(name, notes) => setComponentOpsNotes(prev => ({ ...prev, [name]: notes }))}
            roleNames={catalogRecs?.roleNames ?? []}
            forceOpenTab={workbenchForceTab}
            rejectedSuggestions={result.rejected_suggestions ?? []}
            acceptedSuggestions={aiAccepted}
          />
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleNewWizard}
            className="px-5 py-2 text-sm font-medium border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            {t('architecture.newGenerate')}
          </button>
          {!saved && (() => {
            const needsDsgvoConfirm = recComponents.some(c => c.dsgvo_status === 'conditional') && !dsgvoConfirmed
            return (
              <button
                onClick={handleSave}
                disabled={saving || needsDsgvoConfirm}
                title={needsDsgvoConfirm ? t('architecture.dsgvoConfirmTitle') : undefined}
                className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
              >
                {saving ? t('architecture.saving') : needsDsgvoConfirm ? t('architecture.dsgvoBlockButton') : t('architecture.save')}
              </button>
            )
          })()}
          {saved && (
            <span className="text-sm text-green-700 font-medium">{t('architecture.saved')}</span>
          )}
          <a
            href={`/api/export/pdf?module=architecture&locale=${locale}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            {t('architecture.pdfExport')}
          </a>
          {savedId && result && (
            <>
              <VersionsPanel
                module="architecture"
                entityId={savedId}
                tier={tier}
                currentData={{ wizard_data: answers, result }}
              />
              <ShareButton module="architecture" entityId={savedId} tier={tier} />
            </>
          )}
          {architectures.length > 0 && (
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
            >
              {t('architecture.allArchitectures')}
            </button>
          )}
        </div>

        {/* Canvas CTA */}
        <div className="bg-primary-soft border border-primary-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">{t('architecture.nextStepCanvasTitle')}</p>
            <p className="text-xs text-primary-hover mt-0.5">{t('architecture.nextStepCanvasDesc')}</p>
          </div>
          <Link href={`/${locale}/canvas`} className="whitespace-nowrap px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary transition-colors text-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2">
            {t('architecture.openCanvas')}
          </Link>
        </div>

        {/* Component detail modal */}
        {selectedComp && (
          <ComponentDetailModal comp={selectedComp} onClose={() => setSelectedComp(null)} />
        )}
      </div>

      {/* Rechte Spalte: KI-Analyse-Panel (sticky auf Desktop) */}
      {resultAudience !== 'exec' && (
        <div className="lg:sticky lg:top-[74px] hidden lg:block">
          <AIPanel
            narrative={aiNarrative}
            usage={aiUsageArch}
            aiModel={aiModel}
            generatedAt={aiGeneratedAt}
            tier={tier}
            catalogComponents={recComponents}
            rejectedSuggestions={rejected}
            canvasEnrichment={canvasEnrichment}
            acceptedSuggestions={aiAccepted}
            activeComponentNames={activeComponentNames}
            onAccept={handleAccept}
            onReject={handleReject}
            onAcceptAll={handleAcceptAll}
            onScrollToFirst={() => {
              setWorkbenchForceTab('komponenten')
              setTimeout(() => {
                const wb = document.getElementById('architecture-workbench')
                if (wb) wb.scrollIntoView({ behavior: 'smooth', block: 'start' })
                setWorkbenchForceTab(null)
              }, 250)
            }}
            onReanalyze={handleAINarrative}
            loading={narrativeLoading}
          />
        </div>
      )}
    </div>
    )
  }

  // Component-Picker view
  if (view === 'component-picker') {
    if (!catalogRecs) {
      return <div className="max-w-2xl py-12 text-center text-sm text-slate-400">{t('architecture.loadingCatalog')}</div>
    }
    const rejected = result?.rejected_suggestions ?? []
    const handleAcceptAI = (name: string) => {
      if (activeNameKeySet.has(name.toLowerCase().trim())) return
      const comp = recComponents.find(c => c.name === name)
      // Add to layer only when architecture_layer is known — visual feedback always fires
      if (comp?.architecture_layer) {
        setCatalogRecs(prev => {
          if (!prev) return prev
          const layers = prev.layers.map(lr =>
            lr.layer === comp.architecture_layer && !lr.componentNames.includes(name)
              ? { ...lr, componentNames: [...lr.componentNames, name] }
              : lr
          )
          return { ...prev, layers }
        })
      }
      setComponentSources(prev => ({ ...prev, [name]: 'ai' as const }))
      setAiAccepted(prev => prev.includes(name) ? prev : [...prev, name])
      setResult(prev => prev ? { ...prev, rejected_suggestions: rejected.filter(n => n !== name) } : prev)
    }
    const handleAcceptAllAI = () => {
      const suggestions = aiNarrative?.component_suggestions ?? []
      const rejSet = new Set(rejected)
      const acceptedSet = new Set(aiAccepted)
      const toAccept: string[] = []
      suggestions.filter(n => !rejSet.has(n) && !acceptedSet.has(n) && !activeNameKeySet.has(n.toLowerCase().trim())).forEach(name => {
        const comp = recComponents.find(c => c.name === name)
        if (comp?.architecture_layer) {
          setCatalogRecs(prev => {
            if (!prev) return prev
            const layers = prev.layers.map(lr =>
              lr.layer === comp.architecture_layer && !lr.componentNames.includes(name)
                ? { ...lr, componentNames: [...lr.componentNames, name] }
                : lr
            )
            return { ...prev, layers }
          })
        }
        setComponentSources(prev => ({ ...prev, [name]: 'ai' as const }))
        toAccept.push(name)
      })
      if (toAccept.length > 0) setAiAccepted(prev => [...prev, ...toAccept.filter(n => !prev.includes(n))])
      ;(window as Window & { posthog?: { capture: (e: string) => void } }).posthog?.capture('ai_suggestions_accepted_all')
    }
    const handleRejectAI = (name: string) => {
      setResult(prev => prev ? { ...prev, rejected_suggestions: [...(prev.rejected_suggestions ?? []), name] } : prev)
    }
    const handleScrollToFirstAI = () => {
      const el = document.querySelector<HTMLElement>('[data-ai-row]')
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.style.outline = '2px solid var(--color-ai)'
      setTimeout(() => { el.style.outline = '' }, 2000)
    }
    const pickerCompliance = answers.compliance === 'strict'
      ? (locale === 'de' ? 'EU AI Act + DSGVO: EU-Hosting Pflicht' : 'EU AI Act + GDPR: EU hosting required')
      : answers.compliance === 'moderate'
      ? (locale === 'de' ? 'Begrenzte DSGVO-Anforderungen prüfen' : 'Check limited GDPR requirements')
      : null
    const pickerEnrichment = {
      use_case_type: answers.usecase ?? undefined,
      additional_compliance_flags: pickerCompliance ? [pickerCompliance] : undefined,
    }
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_300px] max-w-4xl">
        <ComponentSelectionStep
          catalogRecs={catalogRecs}
          components={recComponents}
          aiSuggested={new Set(aiNarrative?.component_suggestions ?? [])}
          onBack={() => setView('wizard')}
          onConfirm={handleConfirmSelection}
          locale={locale}
        />
        <div className="lg:sticky lg:top-[74px]">
          <AIPanel
            narrative={aiNarrative}
            usage={aiUsageArch}
            aiModel={aiModel}
            generatedAt={aiGeneratedAt}
            tier={tier}
            catalogComponents={recComponents}
            rejectedSuggestions={rejected}
            acceptedSuggestions={aiAccepted}
            activeComponentNames={activeComponentNames}
            canvasEnrichment={pickerEnrichment}
            onAccept={handleAcceptAI}
            onReject={handleRejectAI}
            onAcceptAll={handleAcceptAllAI}
            onScrollToFirst={handleScrollToFirstAI}
            onReanalyze={handleAINarrative}
            loading={narrativeLoading}
          />
        </div>
      </div>
    )
  }

  // Wizard view
  return (
    <div className="max-w-2xl">
      <UnifiedContextBanner
        assessmentContext={assessmentContext}
        governanceContext={governanceContext}
        roadmapContext={roadmapContext}
        canvasContext={showCanvasBanner && canvasCtx ? canvasCtx : null}
        canvasTitle={canvasContext?.canvas.title}
        useCaseName={canvasContext?.useCase.name}
        onDismiss={showCanvasBanner && canvasCtx ? () => setShowCanvasBanner(false) : undefined}
        wizardTargetId="wizard-question"
      />

      {/* Progress */}
      <div className="mb-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={t('architecture.stepProgress', { step: currentStep + 1, total: totalSteps })}>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{t('architecture.stepProgress', { step: currentStep + 1, total: totalSteps })}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div id="wizard-question" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4">
        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-2">{t('architecture.stepLabel', { step: step.step })}</p>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">{pick(step.question, locale)}</h2>
        <p className="text-sm text-slate-500 mb-5">{pick(step.context, locale)}</p>

        <fieldset>
          <legend className="sr-only">{pick(step.question, locale)}</legend>
          <div className="space-y-2.5">
            {step.options.map(option => {
              const isSelected = selectedOptionId === option.id
              return (
                <label
                  key={option.id}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors select-none',
                    isSelected
                      ? 'border-primary-ring bg-primary-soft'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <input
                    type="radio"
                    name={step.id}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => handleSelect(option.id)}
                    className="mt-0.5 accent-blue-600 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-slate-900')}>{pick(option.label, locale)}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{pick(option.description, locale)}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </fieldset>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          {t('architecture.back')}
        </button>
        {architectures.length > 0 && (
          <button
            onClick={() => setView('list')}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
          >
            {t('architecture.overview')}
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!selectedOptionId}
          className="px-5 py-2 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
        >
          {isLastStep ? t('architecture.generateArch') : t('architecture.wizardNext')}
        </button>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ComponentDetailModal({ comp, onClose }: { comp: CatalogComponent; onClose: () => void }) {
  const tc = useTranslations('common')
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-5 sm:p-6 max-w-sm w-full">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id="comp-modal-title" className="text-sm font-semibold text-slate-900 min-w-0">{comp.name}</h2>
          <button
            onClick={onClose}
            aria-label={tc('close')}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-ring rounded p-0.5"
          >✕</button>
        </div>
        {comp.description && (
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">{comp.description}</p>
        )}
        <dl className="space-y-2.5">
          {comp.dsgvo_status && (
            <div className="flex items-center gap-3">
              <dt className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">DSGVO</dt>
              <dd>
                <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', DSGVO_BADGE[comp.dsgvo_status])}>
                  {DSGVO_LABEL[comp.dsgvo_status]}
                </span>
              </dd>
            </div>
          )}
          {comp.eu_ai_act_risk && (
            <div className="flex items-center gap-3">
              <dt className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">EU AI Act</dt>
              <dd className="text-xs text-slate-700">{comp.eu_ai_act_risk}</dd>
            </div>
          )}
          {comp.cloud_provider && (
            <div className="flex items-center gap-3">
              <dt className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">Hosting</dt>
              <dd className="text-xs text-slate-700">{comp.cloud_provider}</dd>
            </div>
          )}
          {comp.website_url && (
            <div className="flex items-center gap-3">
              <dt className="text-xs font-medium text-slate-500 w-24 flex-shrink-0">Website</dt>
              <dd>
                <a
                  href={comp.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline break-all"
                >
                  {comp.website_url.replace(/^https?:\/\//, '')} ↗
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}

function RoleDetailModal({ role, onClose, tc }: {
  role: RoleCatalogEntry
  onClose: () => void
  tc: (key: string) => string
}) {
  const catClass = role.role_category ? (ROLE_CATEGORY_CLASS[role.role_category] ?? '') : ''
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="role-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 id="role-modal-title" className="text-sm font-semibold text-slate-900">{role.role_name}</h2>
            {role.role_category && (
              <span className={cn('mt-1 inline-block text-[10px] font-medium px-2 py-0.5 border rounded-full', catClass)}>
                {role.role_category}
              </span>
            )}
          </div>
          <button onClick={onClose} aria-label={tc('close')} className="flex-shrink-0 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-ring rounded p-0.5">✕</button>
        </div>

        {role.description && (
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">{role.description}</p>
        )}

        {role.responsibilities && role.responsibilities.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Verantwortlichkeiten</p>
            <ul className="space-y-1.5">
              {role.responsibilities.map((r, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-600">
                  <span className="flex-shrink-0 text-primary mt-0.5">•</span>
                  <span className="min-w-0">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {role.raci_activities && role.raci_activities.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">RACI</p>
            <div className="space-y-1.5">
              {role.raci_activities.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={cn('flex-shrink-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold border rounded', RACI_COLORS[item.type] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
                    {item.type}
                  </span>
                  <span className="text-xs text-slate-600 min-w-0">{item.activity}</span>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">{RACI_LABEL[item.type]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {Object.entries(RACI_LABEL).map(([k, v]) => (
                <span key={k} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className={cn('w-4 h-4 flex items-center justify-center font-bold border rounded text-[9px]', RACI_COLORS[k])}>{k}</span>
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
