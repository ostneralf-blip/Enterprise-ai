import { createClient } from '@/lib/supabase/server'
import { MODULES } from '@/config/modules'
import Link from 'next/link'
import type { Metadata } from 'next'
import { hasAccess } from '@/lib/utils/tier-check'
import type { Tier } from '@/types'
import {
  ClipboardCheck, Target, LayoutGrid, Shield, Map, Scale, Layers, FileText, type LucideIcon
} from 'lucide-react'
import { GuidedPathHero, type PathStep } from '@/components/dashboard/GuidedPathHero'
import { CountUp } from '@/components/dashboard/CountUp'

export const metadata: Metadata = { title: 'Dashboard' }

const NOW = Date.now()

const ARCHETYPE_LABELS: Record<string, { label: string; color: string }> = {
  starter:     { label: 'AI Starter',     color: 'text-amber-700 bg-amber-50 border-amber-200' },
  scaler:      { label: 'AI Scaler',      color: 'text-sky-700 bg-sky-100 border-sky-200' },
  transformer: { label: 'AI Transformer', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  assessment:   ClipboardCheck,
  canvas:       LayoutGrid,
  usecase:      Target,
  governance:   Shield,
  roadmap:      Map,
  compliance:   Scale,
  architecture: Layers,
}

const MODULE_CHIP_COLORS: Record<string, { bg: string; icon: string }> = {
  assessment:   { bg: 'bg-primary-soft',  icon: 'text-primary' },
  canvas:       { bg: 'bg-purple-50',     icon: 'text-purple-600' },
  usecase:      { bg: 'bg-violet-50',     icon: 'text-violet-600' },
  governance:   { bg: 'bg-sky-50',        icon: 'text-sky-600' },
  roadmap:      { bg: 'bg-amber-50',      icon: 'text-amber-600' },
  compliance:   { bg: 'bg-emerald-50',    icon: 'text-emerald-600' },
  architecture: { bg: 'bg-slate-100',     icon: 'text-slate-600' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name, company, tier, guided_path_reset_at')
    .eq('id', user!.id)
    .single() as { data: { full_name: string | null; company: string | null; tier: string; guided_path_reset_at: string | null } | null }

  const resetAt = profileData?.guided_path_reset_at ?? null
  const uid = user!.id

  const cnt = (table: string, extra?: Record<string, string | boolean>) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    if (extra) for (const [k, v] of Object.entries(extra)) q = (q as typeof q).eq(k, v)
    if (resetAt) q = (q as typeof q).gt('created_at', resetAt)
    return q
  }

  const [
    { data: latestAssessment },
    { count: architectureCount },
    { count: governanceCount },
    { count: roadmapCount },
    { count: assessmentCount },
    { count: usecaseCount },
    { count: canvasCount },
    { count: complianceCount },
  ] = await Promise.all([
    supabase.from('assessment_sessions').select('archetype, total_score, created_at').eq('user_id', uid).eq('completed', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    cnt('architectures',       { user_id: uid }),
    cnt('governance_sessions', { user_id: uid }),
    cnt('roadmaps',            { user_id: uid }),
    cnt('assessment_sessions', { user_id: uid, completed: true }),
    cnt('use_cases',            { user_id: uid }),
    cnt('canvases',            { user_id: uid }),
    cnt('compliance_checks',   { user_id: uid }),
  ])

  const tier = (profileData?.tier ?? 'free') as Tier
  const firstName = profileData?.full_name?.split(' ')[0] ?? null
  const savedCount = (architectureCount ?? 0) + (governanceCount ?? 0) + (roadmapCount ?? 0) + (assessmentCount ?? 0)
  const moduleDone: Record<string, boolean> = {
    assessment:  (assessmentCount ?? 0) > 0,
    usecase:     (usecaseCount ?? 0) > 0,
    canvas:      (canvasCount ?? 0) > 0,
    governance:  (governanceCount ?? 0) > 0,
    compliance:  (complianceCount ?? 0) > 0,
    architecture:(architectureCount ?? 0) > 0,
    roadmap:     (roadmapCount ?? 0) > 0,
  }

  const assessmentDaysSince = latestAssessment
    ? Math.floor((NOW - new Date(latestAssessment.created_at as string).getTime()) / 86_400_000)
    : 0
  const assessmentWeeksSince = Math.floor(assessmentDaysSince / 7)

  const guidedSteps: PathStep[] = [
    { step: 1, icon: '◎', title: 'Assessment',   desc: 'Archetype & Reifegrad',          href: '/assessment',      done: (assessmentCount ?? 0) > 0 },
    { step: 2, icon: '⊞', title: 'Use-Case',     desc: 'Prioritäten setzen',              href: '/usecase',         done: (usecaseCount ?? 0) > 0 },
    { step: 3, icon: '◧', title: 'Canvas',       desc: 'Use-Case ausarbeiten',            href: '/canvas',          done: (canvasCount ?? 0) > 0 },
    { step: 4, icon: '⚖', title: 'Governance',   desc: 'Use-Case freigeben',              href: '/governance',      done: (governanceCount ?? 0) > 0 },
    { step: 5, icon: '⚖', title: 'Compliance',   desc: 'EU AI Act & DSGVO',               href: '/compliance',      done: (complianceCount ?? 0) > 0 },
    { step: 6, icon: '⬡', title: 'Architektur',  desc: 'AI-Architektur definieren',       href: '/architecture',    done: (architectureCount ?? 0) > 0 },
    { step: 7, icon: '□', title: 'Summary',      desc: 'PDF-Export & Überblick',          href: '/zusammenfassung', done: (assessmentCount ?? 0) > 0 && (usecaseCount ?? 0) > 0 && (canvasCount ?? 0) > 0 && (governanceCount ?? 0) > 0 && (complianceCount ?? 0) > 0 && (architectureCount ?? 0) > 0 },
  ]

  const completedSteps = guidedSteps.filter(s => s.done).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-primary tracking-widest uppercase mb-1">
            Enterprise Architecture · AI Strategy
          </p>
          <h1 className="text-xl sm:text-2xl font-serif text-slate-900">
            Guten Tag{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {completedSteps === 0
              ? 'Starten Sie Ihren geführten AI-Pfad'
              : completedSteps === guidedSteps.length
                ? 'Ihr AI-Navigator-Pfad ist vollständig abgeschlossen'
                : `${completedSteps} von ${guidedSteps.length} Schritten abgeschlossen`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {latestAssessment && (
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${ARCHETYPE_LABELS[latestAssessment.archetype as string]?.color ?? 'text-slate-700 bg-slate-50 border-slate-200'}`}>
              {ARCHETYPE_LABELS[latestAssessment.archetype as string]?.label ?? String(latestAssessment.archetype)}
            </span>
          )}
          {latestAssessment && (
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border text-slate-700 bg-slate-50 border-slate-200">
              Score: {latestAssessment.total_score} / 5.0
            </span>
          )}
          <Link href="/ergebnisse" className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:border-primary-border hover:bg-primary-soft transition-colors text-slate-600 hover:text-primary whitespace-nowrap">
            <CountUp value={savedCount} />
            <span>&nbsp;gespeicherte Ergebnisse</span>
          </Link>
        </div>
      </div>

      {/* Guided Path Hero */}
      <GuidedPathHero steps={guidedSteps} tier={tier} />

      {/* Quarterly Review Reminder */}
      {latestAssessment && assessmentDaysSince >= 90 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Zeit für Ihren Quarterly AI Health Review</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Ihr letztes Assessment ist {assessmentWeeksSince} Wochen alt. Regelmäßige Reviews sichern Ihren AI-Fortschritt.
            </p>
          </div>
          <Link href="/assessment" className="whitespace-nowrap px-4 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors flex-shrink-0">
            Assessment neu starten →
          </Link>
        </div>
      )}

      {/* Modul-Grid */}
      <div className="mb-4">
        <h2 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Alle Tools</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MODULES.map(mod => {
          const locked = !hasAccess(tier, mod.requiredTier)
          const done = moduleDone[mod.id] ?? false
          const Icon = MODULE_ICONS[mod.id] ?? FileText
          const chipColors = MODULE_CHIP_COLORS[mod.id] ?? { bg: 'bg-slate-100', icon: 'text-slate-600' }
          const subtitle = tier !== 'free' && mod.subtitlePro ? mod.subtitlePro : mod.subtitle
          return (
            <Link
              key={mod.id}
              href={locked ? '/upgrade' : `/${mod.id}`}
              className={`group bg-white rounded-xl p-4 transition-[border-color,box-shadow] duration-150 block border hover:shadow-sm motion-reduce:transition-none ${
                locked
                  ? 'opacity-60 border-slate-200'
                  : done
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : 'border-slate-200 hover:border-primary-border'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-[34px] h-[34px] rounded-xl ${chipColors.bg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={chipColors.icon} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {done && !locked && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5 font-medium whitespace-nowrap">✓ Erledigt</span>
                  )}
                  {locked && <span className="text-xs text-primary bg-primary-soft border border-primary-border rounded-md px-2 py-0.5 font-medium">Pro</span>}
                </div>
              </div>
              <h3 className={`text-sm font-semibold text-slate-900 mb-0.5 min-w-0 transition-colors ${!locked ? 'group-hover:text-primary' : ''}`}>{mod.title}</h3>
              <p className="text-xs text-slate-400 mb-3 line-clamp-1">{subtitle}</p>
              <div className={`text-xs font-medium ${locked ? 'text-slate-400' : done ? 'text-emerald-600' : 'text-primary'}`}>
                {locked ? '🔒 Pro erforderlich →' : done ? 'Ergebnis ansehen →' : 'Starten →'}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Upgrade-Banner */}
      {tier === 'free' && (
        <div className="mt-8 bg-primary-soft border border-primary-border rounded-xl p-5 sm:p-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-primary font-semibold mb-1">Auf Professional upgraden</div>
            <div className="text-slate-600 text-sm">PDF-Export, Ergebnisse speichern, Versionierung und alle 7 Tools.</div>
          </div>
          <Link href="/upgrade"
            className="bg-primary hover:bg-primary-hover text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shrink-0 whitespace-nowrap">
            Ab €49/Monat →
          </Link>
        </div>
      )}
    </div>
  )
}
