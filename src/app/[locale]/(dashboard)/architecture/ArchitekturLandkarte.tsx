'use client'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { CatalogComponent } from '@/types'
import type { CatalogRecommendations } from '@/config/architecture-rules'
import type { WizardAnswers } from '@/config/architecture-data'

const APP_LAYERS  = new Set(['application'])
const DATA_LAYERS = new Set(['data', 'model', 'mlops', 'serving'])
const CROSS_LAYERS = new Set(['governance', 'security'])

const CATEGORY_LABEL: Record<string, string> = {
  data_platform:   'Data Platform',  DATA_PLATFORM:   'Data Platform',
  ml_platform:     'ML Platform',    ML_PLATFORM:     'ML Platform',
  llm:             'LLM / Foundation Model', LLM: 'LLM / Foundation Model',
  mlops:           'MLOps',          MLOPS:           'MLOps',
  monitoring:      'Monitoring',     MONITORING:      'Monitoring',
  governance:      'AI Governance',  GOVERNANCE:      'AI Governance',
  security:        'Security & IAM', SECURITY:        'Security & IAM',
  integration:     'Integration',    INTEGRATION:     'Integration',
  serving:         'Model Serving',  SERVING:         'Model Serving',
  vector_store:    'Vector Store',   VECTOR_STORE:    'Vector Store',
  embedding:       'Embedding',      EMBEDDING:       'Embedding',
  orchestration:   'Orchestration',  ORCHESTRATION:   'Orchestration',
}

function humanCategory(raw: string): string {
  return CATEGORY_LABEL[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function Badge({ label, variant }: { label: string; variant: 'eu' | 'sap' | 'warn' | 'ai' | 'ok' }) {
  return (
    <span className={cn(
      'inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded',
      variant === 'eu'   && 'bg-emerald-50 text-emerald-700',
      variant === 'sap'  && 'bg-primary-soft text-primary',
      variant === 'warn' && 'bg-amber-50 text-amber-700',
      variant === 'ai'   && 'bg-[color:var(--color-ai-soft)] text-[color:var(--color-ai)]',
      variant === 'ok'   && 'bg-emerald-50 text-emerald-700',
    )}>
      {label}
    </span>
  )
}

function CompNode({
  comp, name, isActive, isAiSuggested, complianceMode, level,
}: {
  comp: CatalogComponent | undefined
  name: string
  isActive: boolean
  isAiSuggested: boolean
  complianceMode: boolean
  level: 1 | 2 | 3
}) {
  const isComplianceRelevant = !!(comp?.dsgvo_status && comp.dsgvo_status !== 'compliant') || !!(comp?.eu_ai_act_risk)
  const dimmed = complianceMode && !isComplianceRelevant
  const versionLine = level >= 2
    ? (comp?.version_info?.release ?? comp?.version_info?.model_id ?? comp?.version_info?.notes
        ?? (comp?.hosting.includes('eu') ? 'EU Hosting' : null))
    : null
  const opsLine = level >= 3 ? (comp?.description ?? null) : null

  return (
    <div className={cn(
      'relative bg-white border rounded-xl p-3 min-w-[160px] max-w-[220px] flex-shrink-0 transition-all',
      isAiSuggested ? 'border-l-2 border-l-[color:var(--color-ai)] border-slate-200' : 'border-slate-200',
      complianceMode && isComplianceRelevant && 'border-amber-400',
      dimmed ? 'opacity-40' : 'opacity-100',
      !isActive && 'opacity-30 saturate-0',
    )}>
      {isAiSuggested && (
        <span className="absolute -top-1.5 right-2 text-[8px] font-black text-[color:var(--color-ai)] bg-white px-1 tracking-wide">
          ◆ KI
        </span>
      )}
      <p className="text-[12.5px] font-semibold text-slate-900 leading-tight">{name}</p>
      {comp?.vendor && (
        <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mt-0.5 leading-tight">
          {comp.vendor}{comp.category ? ` · ${humanCategory(comp.category)}` : ''}
        </p>
      )}
      {versionLine && (
        <p className="text-[10px] text-primary font-mono mt-1 leading-tight">{versionLine}</p>
      )}
      {opsLine && (
        <p className="text-[10px] text-slate-500 mt-1 leading-tight line-clamp-2 border-t border-slate-100 pt-1">
          {opsLine}
        </p>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {comp?.hosting.some(h => h.toLowerCase().includes('eu')) && <Badge label="EU" variant="eu" />}
        {comp?.cloud_provider === 'sap' && <Badge label="SAP" variant="sap" />}
        {comp?.eu_ai_act_risk && comp.eu_ai_act_risk !== 'minimal' && (
          <Badge label={`AI Act: ${comp.eu_ai_act_risk}`} variant="warn" />
        )}
        {comp?.dsgvo_status === 'conditional' && <Badge label="DSGVO prüfen" variant="warn" />}
        {comp?.dsgvo_status === 'non_compliant' && <Badge label="DSGVO ✗" variant="warn" />}
      </div>
    </div>
  )
}

function Band({ label, sub, children, dashed = false, hidden = false }: {
  label: string; sub: string; children: React.ReactNode; dashed?: boolean; hidden?: boolean
}) {
  if (hidden) return null
  return (
    <div className={cn(
      'grid border rounded-xl overflow-hidden mb-3',
      dashed ? 'border-dashed border-slate-200' : 'border-slate-200',
    )} style={{ gridTemplateColumns: '140px 1fr' }}>
      <div className={cn(
        'px-3 py-4 border-r border-slate-200 flex flex-col justify-center gap-1',
        dashed ? 'bg-slate-50' : 'bg-primary-soft',
      )}>
        <p className="font-serif text-[13px] font-semibold text-slate-900 leading-tight">{label}</p>
        <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold leading-tight">{sub}</p>
      </div>
      <div className="px-3 py-3 flex flex-wrap gap-2.5 items-start min-w-0">
        {children}
      </div>
    </div>
  )
}

export interface ArchitekturLandkarteProps {
  catalogRecs: CatalogRecommendations
  components: CatalogComponent[]
  activeNames: Set<string>
  aiSuggested?: Set<string>
  complianceMode?: boolean
  execMode?: boolean
  level?: 1 | 2 | 3
  answers: WizardAnswers
  useCaseName?: string | null
  eamValid?: boolean
}

export function ArchitekturLandkarte({
  catalogRecs, components, activeNames, aiSuggested = new Set(),
  complianceMode = false, execMode = false, level = 1,
  answers, useCaseName, eamValid,
}: ArchitekturLandkarteProps) {
  const t = useTranslations('modules.architecture')
  const byName = Object.fromEntries(components.map(c => [c.name, c]))

  const layerComps = (keys: Set<string>) =>
    [...new Set(catalogRecs.layers.filter(lr => keys.has(lr.layer)).flatMap(lr => lr.componentNames))]

  const appComps   = layerComps(APP_LAYERS)
  const dataComps  = layerComps(DATA_LAYERS)
  const crossComps = layerComps(CROSS_LAYERS)

  // Motivation nodes from wizard answers
  const motivNodes: { icon: string; label: string; sub: string }[] = []
  if (answers.compliance === 'strict' || answers.compliance === 'moderate') {
    motivNodes.push({ icon: '⚖', label: 'EU AI Act', sub: answers.compliance === 'strict' ? 'HOCHRISIKO · Art. 13–15' : 'LIMITED RISK · Art. 50' })
    motivNodes.push({ icon: '🛡', label: 'DSGVO', sub: 'EU-HOSTING PFLICHT' })
  }
  motivNodes.push({ icon: '◎', label: t('landkarteBizGoal'), sub: '' })

  const roles = catalogRecs.roleNames

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-900">{t('landkarteTitle')}</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {complianceMode ? t('landkarteComplianceBadge') : execMode ? t('landkarteExecBadge') : t('landkarteArchBadge')}
        </span>
      </div>

      {/* Motivation */}
      <Band label={t('landkarteBandMotivation')} sub={t('landkarteBandMotivationSub')} dashed hidden={execMode}>
        {motivNodes.map(n => (
          <div key={n.label} className="bg-primary-soft border border-primary-border rounded-xl p-2.5 min-w-[140px]">
            <p className="text-[12.5px] font-semibold text-slate-900">{n.icon} {n.label}</p>
            {n.sub && <p className="text-[9px] uppercase tracking-wide text-amber-600 font-bold mt-1">{n.sub}</p>}
          </div>
        ))}
      </Band>

      {/* Business */}
      <Band label={t('landkarteBandBusiness')} sub={t('landkarteBandBusinessSub')}>
        {useCaseName && (
          <div className="bg-primary-soft border border-primary-border rounded-xl p-2.5">
            <p className="text-[12.5px] font-semibold text-slate-900">{useCaseName}</p>
            <p className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold mt-0.5">{t('landkarteCapability')}</p>
          </div>
        )}
        {roles.map(role => {
          const initials = role.split(' ').filter(w => /^[A-ZÄÖÜ]/.test(w)).map(w => w[0]).join('').slice(0, 2)
          return (
            <div key={role} className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-800">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">{initials}</span>
              <span className="whitespace-nowrap">{role}</span>
            </div>
          )
        })}
      </Band>

      {/* Application */}
      {appComps.length > 0 && (
        <Band label={t('landkarteBandApplication')} sub={t('landkarteBandApplicationSub')}>
          {appComps.map(name => (
            <CompNode key={name} name={name} comp={byName[name]} isActive={activeNames.has(name)}
              isAiSuggested={aiSuggested.has(name)} complianceMode={complianceMode} level={level} />
          ))}
        </Band>
      )}

      {/* Data & Technology */}
      {dataComps.length > 0 && (
        <Band label={t('landkarteBandData')} sub={t('landkarteBandDataSub')}>
          {dataComps.map(name => (
            <CompNode key={name} name={name} comp={byName[name]} isActive={activeNames.has(name)}
              isAiSuggested={aiSuggested.has(name)} complianceMode={complianceMode} level={level} />
          ))}
        </Band>
      )}

      {/* Cross-cutting */}
      {crossComps.length > 0 && (
        <Band label={t('landkarteBandCross')} sub={t('landkarteBandCrossSub')}>
          {crossComps.map(name => (
            <CompNode key={name} name={name} comp={byName[name]} isActive={activeNames.has(name)}
              isAiSuggested={aiSuggested.has(name)} complianceMode={complianceMode} level={level} />
          ))}
        </Band>
      )}

      {/* Validation footer */}
      {eamValid !== undefined && (
        <p className={cn('text-xs mt-3 font-medium', eamValid ? 'text-emerald-700' : 'text-amber-700')}>
          {eamValid
            ? `✓ ${t('landkarteValid')}`
            : `⚠ ${t('landkarteInvalid')}`
          }
        </p>
      )}
    </div>
  )
}
