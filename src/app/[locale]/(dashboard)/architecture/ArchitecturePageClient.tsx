'use client'
import { useTranslations, useLocale } from 'next-intl'
import { pick } from '@/lib/utils/locale-data'
import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ShareButton } from '@/components/shared/ShareButton'
import { VersionsPanel } from '@/components/shared/VersionsPanel'
import { InfoHint, HintBox } from '@/components/shared/InfoHint'
import { WIZARD_STEPS, generateArchitecture, COST_ESTIMATES, scaleCostEstimate, selectPatternReason, type WizardAnswers, type ArchitectureResult, type PatternId } from '@/config/architecture-data'
import { recommendFromWizard, recommendFromCatalog, recommendJouleUseCases, generateDynamicKeyDecisions, generateDynamicNextSteps, generateCrossModuleDecisions, generateCrossModuleNextSteps, isSAP, type CatalogRecommendations, type JouleUseCase } from '@/config/architecture-rules'
import { AIAnalysisButton, AIBadge } from '@/components/shared/AIAnalysisButton'
import type { Archetype, CatalogComponent, Canvas, UseCase, CanvasSynonym } from '@/types'
import { ArchitectureDiagram } from '@/components/modules/ArchitectureDiagram'
import { extractCanvasContext, type CanvasContext, type DetectedTag } from '@/lib/canvas-context'

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
  ai_narrative?: { key_decisions: { de: string; en: string }[]; next_steps: { de: string; en: string }[] } | null
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


interface ContextBannerProps {
  assessmentContext: AssessmentContext | null | undefined
  governanceContext: GovernanceContext | null | undefined
  compliancePreset?: string
  roadmapContext?: RoadmapContext | null
}

function ContextBanner({ assessmentContext, governanceContext, compliancePreset, roadmapContext }: ContextBannerProps) {
  const t = useTranslations('modules')
  if (!assessmentContext && !governanceContext && !compliancePreset && !roadmapContext) return null
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
    <div className="bg-primary-soft border border-primary-border rounded-xl p-3.5 mb-5 text-xs text-primary space-y-1.5">
      <p className="font-semibold text-primary">{t('architecture.contextTitle')}</p>
      {assessmentContext?.archetype && (
        <p>
          <span className="font-medium">{t('architecture.contextMaturity')}</span>{' '}
          {ARCHETYPE_LABELS[assessmentContext.archetype] ?? assessmentContext.archetype}
          {' '}(Score: {assessmentContext.total_score})
        </p>
      )}
      {governanceContext?.result && (
        <p>
          <span className="font-medium">{t('architecture.contextGovernance')}</span>{' '}
          {governanceContext.use_case_name && <span>{governanceContext.use_case_name} — </span>}
          <span className={cn('px-1.5 py-0.5 rounded font-medium', GOVERNANCE_COLORS[governanceContext.result] ?? 'text-slate-700 bg-slate-100')}>
            {governanceLabel[governanceContext.result] ?? governanceContext.result}
          </span>
        </p>
      )}
      {compliancePreset && (
        <p>
          <span className="font-medium">{t('architecture.contextCompliance')}</span>{' '}
          {complianceLabel[compliancePreset] ?? compliancePreset}
        </p>
      )}
      {roadmapContext && (
        <p>
          <span className="font-medium">{t('architecture.roadmapLabel')}</span>{' '}
          {roadmapContext.title}
          {roadmapContext.phasesCount > 0 && ` · ${t('architecture.phasesLabel', { count: roadmapContext.phasesCount })}`}
        </p>
      )}
    </div>
  )
}

const TAG_COLORS: Record<DetectedTag['type'], string> = {
  score:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  industry:   'bg-slate-100 text-slate-700 border-slate-200',
  usecase:    'bg-primary-soft text-primary-hover border-primary-border',
  platform:   'bg-violet-50 text-violet-700 border-violet-200',
  compliance: 'bg-amber-50 text-amber-700 border-amber-200',
}

function CanvasContextBanner({
  canvasTitle,
  useCaseName,
  context,
  onDismiss,
}: {
  canvasTitle: string
  useCaseName: string
  context: CanvasContext
  onDismiss: () => void
}) {
  const t = useTranslations('modules')
  const [collapsed, setCollapsed] = useState(false)
  const filledCount = Object.keys(context.wizard_prefill).length
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-emerald-700 font-semibold text-xs shrink-0">◧ {t('architecture.canvasContextLabel')}</span>
          <span className="text-xs text-emerald-600 truncate">{canvasTitle} · {useCaseName}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? t('architecture.expandAriaLabel') : t('architecture.collapseAriaLabel')}
            className="text-xs text-emerald-700 hover:text-emerald-900 p-1"
          >
            {collapsed ? '▾' : '▴'}
          </button>
          <button
            onClick={onDismiss}
            aria-label={t('architecture.bannerCloseAriaLabel')}
            className="text-xs text-emerald-600 hover:text-emerald-900 p-1"
          >✕</button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {context.detected_tags.map(tag => (
              <span
                key={tag.label}
                className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', TAG_COLORS[tag.type])}
              >
                {tag.label}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-emerald-600 mt-1.5">
            {t('architecture.prefillHint', { count: filledCount })}
          </p>
        </>
      )}
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

function PatternReasonSection({ answers, locale }: { answers: WizardAnswers; locale: string }) {
  const t = useTranslations('modules')
  const [open, setOpen] = useState(false)
  const reasons = selectPatternReason(answers)
  if (reasons.length === 0) return null
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full text-left focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1 rounded"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold text-slate-700 flex-1">{t('architecture.patternReasonTitle')}</span>
        <span className="text-slate-400 text-[10px]" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="mt-2.5 space-y-1.5">
          {reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-600">
              <span className="flex-shrink-0 text-primary font-medium">✓</span>
              <span className="min-w-0">{pick(r, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

type ResultAudience = 'exec' | 'architect' | 'compliance'
type View = 'list' | 'wizard' | 'result'

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

function ResultBar({
  audience,
  level,
  onAudience,
  onLevel,
}: {
  audience: ResultAudience
  level: 1 | 2 | 3
  onAudience: (a: ResultAudience) => void
  onLevel: (l: 1 | 2 | 3) => void
}) {
  const t = useTranslations('modules')
  const views: ResultAudience[] = ['exec', 'architect', 'compliance']
  const viewLabels: Record<ResultAudience, string> = {
    exec:       t('architecture.viewExec'),
    architect:  t('architecture.viewArchitect'),
    compliance: t('architecture.viewCompliance'),
  }
  return (
    <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-white/95 backdrop-blur border-b border-slate-200 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 mb-2">
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
      {audience !== 'exec' && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('architecture.levelLabel')}</span>
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            {([1, 2, 3] as const).map(l => (
              <button
                key={l}
                onClick={() => onLevel(l)}
                className={cn(
                  'w-10 py-1.5 text-xs font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-ring',
                  level === l ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                L{l}
              </button>
            ))}
          </div>
        </div>
      )}
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

function CatalogRecommendationsCard({
  recs,
  components,
  onSelectComp,
  rolesCatalog = [],
  level = 1,
  complianceMode = false,
}: {
  recs: CatalogRecommendations
  components: CatalogComponent[]
  onSelectComp: (comp: CatalogComponent) => void
  rolesCatalog?: RoleCatalogEntry[]
  level?: 1 | 2 | 3
  complianceMode?: boolean
}) {
  const t = useTranslations('modules')
  const tc = useTranslations('common')
  const byName = Object.fromEntries(components.map(c => [c.name, c]))
  const catalogMap = Object.fromEntries(rolesCatalog.map(r => [r.role_name, r]))
  const [selectedRole, setSelectedRole] = useState<RoleCatalogEntry | null>(null)
  const layerLabelT: Record<string, string> = {
    data: t('architecture.layerData'), model: t('architecture.layerModel'),
    mlops: 'MLOps', serving: 'Serving', governance: 'Governance', security: 'Security',
    application: t('architecture.layerApplication'),
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{t('architecture.catalogSectionTitle')}</h3>
        <InfoHint title={t('architecture.catalogHintTitle')}>
          <p>{t('architecture.catalogSelectedDesc')}</p>
          <p className="mt-1.5"><strong>{t('architecture.catalogSelectedNote')}</strong></p>
        </InfoHint>
      </div>
      <HintBox variant="tip" className="py-2 text-xs">
        {t('architecture.catalogHintClick')}
      </HintBox>
      <div className="space-y-3">
        {recs.layers.map(lr => (
          <div key={lr.layer}>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
              {layerLabelT[lr.layer] ?? LAYER_LABEL[lr.layer] ?? lr.layer}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lr.componentNames.map(name => {
                const comp = byName[name]
                if (comp) {
                  const isComplianceRelevant = comp.dsgvo_status === 'conditional' || comp.eu_ai_act_risk === 'high' || comp.eu_ai_act_risk === 'limited'
                  return (
                    <button
                      key={name}
                      onClick={() => onSelectComp(comp)}
                      className={cn(
                        'inline-flex flex-col items-start gap-0.5 px-2.5 py-1 bg-slate-50 border rounded-lg text-xs text-slate-700 hover:border-primary-border hover:bg-primary-soft transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1',
                        complianceMode && isComplianceRelevant ? 'border-amber-400' : complianceMode ? 'border-slate-200 opacity-40' : 'border-slate-200'
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium min-w-0 truncate max-w-[120px]">{name}</span>
                        {comp.dsgvo_status && (
                          <span className={cn('px-1 py-0.5 rounded text-[10px] font-medium border', DSGVO_BADGE[comp.dsgvo_status])}>
                            {DSGVO_LABEL[comp.dsgvo_status]}
                          </span>
                        )}
                      </span>
                      {level >= 2 && comp.version_info && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {comp.version_info.release ?? comp.version_info.model_id ?? comp.version_info.notes}
                        </span>
                      )}
                    </button>
                  )
                }
                return (
                  <span key={name} className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
                    {name}
                  </span>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t('architecture.recommendedRoles')}</p>
          <InfoHint title={t('architecture.teamHintTitle')}>
            <p>{t('architecture.teamClickHint')}</p>
          </InfoHint>
        </div>
        <div className="space-y-1.5">
          {recs.roleNames.map(role => {
            const entry = catalogMap[role]
            const catCls = entry?.role_category ? (ROLE_CATEGORY_CLASS[entry.role_category] ?? 'bg-slate-50 border-slate-200 text-slate-600') : 'bg-slate-50 border-slate-200 text-slate-600'
            return entry ? (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(entry)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:bg-white hover:border-primary-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1"
              >
                <span className={cn('shrink-0 px-1.5 py-0.5 border rounded text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap', catCls)}>
                  {entry.role_category ?? '—'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{role}</p>
                  {entry.description && (
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{entry.description}</p>
                  )}
                </div>
                <span className="shrink-0 text-slate-300 text-xs" aria-hidden="true">›</span>
              </button>
            ) : (
              <span key={role} className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">{role}</span>
            )
          })}
        </div>
        {selectedRole && (
          <RoleDetailModal role={selectedRole} onClose={() => setSelectedRole(null)} tc={tc} />
        )}
      </div>
    </div>
  )
}

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
  const [result, setResult] = useState<ArchitectureResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [dsgvoConfirmed, setDsgvoConfirmed] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [aiNarrative, setAiNarrative] = useState<{ key_decisions: { de: string; en: string }[]; next_steps: { de: string; en: string }[] } | null>(null)
  const [aiUsageArch, setAiUsageArch] = useState<{ remaining: number; used: number; limit: number; exceeded: boolean } | null>(null)
  const [aiNarrativeError, setAiNarrativeError] = useState<string | null>(null)
  const [catalogRecs, setCatalogRecs] = useState<CatalogRecommendations | null>(null)
  const [recComponents, setRecComponents] = useState<CatalogComponent[]>([])
  const [jouleUseCases, setJouleUseCases] = useState<JouleUseCase[]>([])
  const catalogFetched = useRef(false)
  const [resultAudience, setResultAudience] = useState<ResultAudience>('architect')
  const [resultLevel, setResultLevel] = useState<1 | 2 | 3>(1)

  const totalSteps = WIZARD_STEPS.length
  const step = WIZARD_STEPS[currentStep]
  const selectedOptionId = answers[step?.id ?? 'infra']
  const isLastStep = currentStep === totalSteps - 1
  const progress = Math.round((currentStep / totalSteps) * 100)

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: optionId }))
  }

  function applyRecs(wizardAnswers: WizardAnswers, loadedCatalog?: CatalogComponent[]) {
    const catalog = loadedCatalog ?? recComponents
    if (catalog.length > 0) {
      setCatalogRecs(recommendFromCatalog(wizardAnswers, catalog))
    } else {
      setCatalogRecs(recommendFromWizard(wizardAnswers))
    }
    setJouleUseCases(recommendJouleUseCases(
      wizardAnswers,
      assessmentContext?.archetype ?? null,
      canvasCtx?.wizard_prefill?.industry ?? null
    ))
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
              setCatalogRecs(recommendFromWizard(wizardAnswers))
            }
            // hasSAPLayer=true → Phase-1-Recs bleiben unverändert (kein setCatalogRecs)
          } else {
            setCatalogRecs(catalogResult)
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
      setView('result')
      setSaved(false)
      applyRecs(answers)
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  const handleNewWizard = () => {
    setAnswers({})
    setCurrentStep(0)
    setResult(null)
    setSaved(false)
    setSavedId(null)
    setCatalogRecs(null)
    setJouleUseCases([])
    setCanvasCtx(null)
    setShowCanvasBanner(false)
    setView('wizard')
  }

  const handleViewSaved = (arch: SavedArchitecture) => {
    setAnswers(arch.wizard_data)
    setResult(arch.result)
    setSaved(true)
    setSavedId(arch.id)
    setAiNarrative(arch.ai_narrative ?? null)
    setAiUsageArch(null)
    setView('result')
    applyRecs(arch.wizard_data)
  }

  const handleAINarrative = async () => {
    if (!savedId) return
    setAiNarrativeError(null)
    const activeNames = new Set(catalogRecs?.layers.flatMap(lr => lr.componentNames) ?? [])
    const components = recComponents.filter(c => activeNames.has(c.name)).map(c => c.name)
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
        audience: resultAudience,
      }),
    })
    const json = await res.json() as {
      result?: { key_decisions: { de: string; en: string }[]; next_steps: { de: string; en: string }[] }
      usage?: { remaining: number; used: number; limit: number; exceeded: boolean }
      error?: string
    }
    if (json.usage) setAiUsageArch(json.usage)
    if (!res.ok) { setAiNarrativeError(json.error ?? 'KI-Analyse fehlgeschlagen'); return }
    if (json.result) setAiNarrative(json.result)
  }

  const handleSave = async () => {
    if (!result) return
    setSaving(true)
    try {
      const res = await fetch('/api/architecture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wizard_data: answers, result }),
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
        <ContextBanner assessmentContext={assessmentContext} governanceContext={governanceContext} compliancePreset={compliancePreset} roadmapContext={roadmapContext} />
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

  if (view === 'result' && result) {
    return (
      <div className="max-w-2xl space-y-5">
        {/* Sticky Sichten + Detailtiefe Bar */}
        <ResultBar audience={resultAudience} level={resultLevel} onAudience={setResultAudience} onLevel={setResultLevel} />

        <ContextBanner assessmentContext={assessmentContext} governanceContext={governanceContext} compliancePreset={compliancePreset} roadmapContext={roadmapContext} />

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

        {/* Pattern card */}
        <div className={cn('rounded-2xl border p-5 sm:p-6', result.color.bg, result.color.border)}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', result.color.badge)}>
              {t('architecture.patternBadge')}
            </span>
          </div>
          <h2 className={cn('text-base sm:text-lg font-semibold mb-1', result.color.title)}>{result.pattern}</h2>
          <p className="text-sm text-slate-600">{result.summary}</p>
        </div>

        {/* Exec: Empfehlungskarte (statt Detail-Sections) */}
        {resultAudience === 'exec' && (
          <ExecRecommendationCard result={result} />
        )}

        {/* Warum dieses Muster? — nicht in Exec-Sicht */}
        {resultAudience !== 'exec' && (
          <PatternReasonSection answers={answers} locale={locale} />
        )}

        {/* Kosten-Indikator — nicht in Exec-Sicht (dort im KPI-Strip) */}
        {resultAudience !== 'exec' && (
          <CostIndicationCard patternId={result.patternId} companySize={answers.company_size} locale={locale} />
        )}

        {/* Architecture diagram — nicht in Exec-Sicht */}
        {resultAudience !== 'exec' && catalogRecs && (
          <ArchitectureDiagram
            recs={catalogRecs}
            components={recComponents}
            tier={tier}
            pattern={result?.pattern}
            archetype={assessmentContext?.archetype ? (ARCHETYPE_LABELS[assessmentContext.archetype] ?? assessmentContext.archetype) : undefined}
          />
        )}

        {/* Catalog recommendations */}
        {catalogRecs && (
          <>
            <CatalogRecommendationsCard
              recs={catalogRecs}
              components={recComponents}
              onSelectComp={setSelectedComp}
              rolesCatalog={rolesCatalog}
              level={resultLevel}
              complianceMode={resultAudience === 'compliance'}
            />
            {recComponents.length > 0 && (() => {
              const latest = recComponents.reduce((a, b) => a.updated_at > b.updated_at ? a : b)
              const days = Math.floor((NOW - new Date(latest.updated_at).getTime()) / 86_400_000)
              return (
                <p className={cn('text-xs mt-1', days > 30 ? 'text-amber-600' : 'text-slate-400')}>
                  {days > 30
                    ? t('architecture.catalogStale', { days })
                    : `${t('architecture.catalogUpdated')} ${new Date(latest.updated_at).toLocaleDateString(locale)}`
                  }
                </p>
              )
            })()}
          </>
        )}

        {/* DSGVO-Warnung bei bedingter Konformität — nur Komponenten die im Diagramm aktiv sind */}
        {(() => {
          const activeNames = new Set(catalogRecs?.layers.flatMap(lr => lr.componentNames) ?? [])
          const conditionalComps = recComponents.filter(c => c.dsgvo_status === 'conditional' && activeNames.has(c.name))
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

        {/* SAP Joule use cases — nicht in Exec-Sicht */}
        {resultAudience !== 'exec' && (
          <JouleUseCasesCard useCases={jouleUseCases} />
        )}

        {/* Key decisions + Next steps */}
        {(() => {
          const recNames = new Set(catalogRecs?.layers.flatMap(lr => lr.componentNames) ?? [])
          const activeComponents = recComponents.filter(c => recNames.has(c.name))
          const dynamicDecisions = generateDynamicKeyDecisions(activeComponents)
          const dynamicSteps = generateDynamicNextSteps(activeComponents)
          const crossDecisions = generateCrossModuleDecisions({
            assessment: assessmentContext,
            canvas: canvasContext,
            governance: governanceContext,
            roadmap: roadmapContext,
          })
          const crossSteps = generateCrossModuleNextSteps({
            assessment: assessmentContext,
            canvas: canvasContext,
            governance: governanceContext,
            roadmap: roadmapContext,
          })
          // AI-Narrative hat höchste Priorität, dann Cross-Modul, dann dynamisch, dann statisch
          const aiDec = aiNarrative?.key_decisions ?? []
          const aiStp = aiNarrative?.next_steps ?? []
          const seenDecisionDe = new Set([...aiDec, ...crossDecisions, ...dynamicDecisions].map(d => d.de))
          const seenStepDe = new Set([...aiStp, ...crossSteps, ...dynamicSteps].map(s => s.de))
          const allDecisions = [...aiDec, ...crossDecisions, ...dynamicDecisions, ...result.keyDecisions.filter(d => !seenDecisionDe.has(d.de))]
          const allSteps = [...aiStp, ...crossSteps, ...dynamicSteps, ...result.nextSteps.filter(s => !seenStepDe.has(s.de))]
          return (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{t('architecture.keyDecisions')}</h3>
                    {aiNarrative && <AIBadge />}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <AIAnalysisButton
                      tier={tier}
                      onAnalyze={handleAINarrative}
                      usage={aiUsageArch}
                      size="sm"
                    />
                    {!savedId && tier !== 'free' && (
                      <p className="text-[11px] text-slate-400">Erst speichern, dann KI aktivieren</p>
                    )}
                    {aiNarrativeError && (
                      <p className="text-[11px] text-red-500">{aiNarrativeError}</p>
                    )}
                  </div>
                </div>
                <ul className="space-y-2.5" role="list">
                  {allDecisions.map((decision, i) => (
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
                  {allSteps.map((s, i) => (
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
          )
        })()}

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
          <a href="/canvas" className="whitespace-nowrap px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary transition-colors text-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2">
            {t('architecture.openCanvas')}
          </a>
        </div>

        {/* Component detail modal */}
        {selectedComp && (
          <ComponentDetailModal comp={selectedComp} onClose={() => setSelectedComp(null)} />
        )}
      </div>
    )
  }

  // Wizard view
  return (
    <div className="max-w-2xl">
      <ContextBanner assessmentContext={assessmentContext} governanceContext={governanceContext} roadmapContext={roadmapContext} />
      {showCanvasBanner && canvasCtx && canvasContext && (
        <CanvasContextBanner
          canvasTitle={canvasContext.canvas.title}
          useCaseName={canvasContext.useCase.name}
          context={canvasCtx}
          onDismiss={() => setShowCanvasBanner(false)}
        />
      )}

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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-4">
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
