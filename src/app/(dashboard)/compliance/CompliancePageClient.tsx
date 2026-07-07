'use client'
import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  EU_AI_ACT_RISK_CLASSES,
  EU_AI_ACT_OBLIGATIONS,
  DSGVO_CHECKLIST,
  RISK_MATRIX,
  getRiskLevel,
  POLICY_TEMPLATES,
  ADDITIONAL_REGULATIONS,
  REGULATORY_WATCHLIST,
  type CheckRow,
  type CheckStatus,
  type EuAiActRiskClass,
} from '@/config/compliance-data'
import { InfoHint, HintBox } from '@/components/shared/InfoHint'
import { WatchlistCard } from '@/components/modules/WatchlistCard'

type Tab = 'euaiact' | 'dsgvo' | 'matrix' | 'summary' | 'templates' | 'extras'

const TABS: { id: Tab; label: string }[] = [
  { id: 'euaiact', label: 'EU AI Act' },
  { id: 'dsgvo', label: 'DSGVO' },
  { id: 'matrix', label: 'Risikomatrix' },
  { id: 'summary', label: 'Zusammenfassung' },
  { id: 'templates', label: 'Policy-Templates' },
  { id: 'extras', label: 'Weitere Gesetze' },
]

const CONTENT_REVIEWED_AT = '2026-06-25'
const COMPLIANCE_REVIEWED_DAYS = Math.floor((Date.now() - new Date(CONTENT_REVIEWED_AT).getTime()) / 86_400_000)

interface Props {
  initialChecks: CheckRow[]
}

function makeKey(regulation: string, checkType: string) {
  return `${regulation}::${checkType}`
}

export function CompliancePageClient({ initialChecks }: Props) {
  const [tab, setTab] = useState<Tab>('euaiact')
  const [checks, setChecks] = useState<Map<string, CheckRow>>(() => {
    const m = new Map<string, CheckRow>()
    for (const c of initialChecks) m.set(makeKey(c.regulation, c.check_type), c)
    return m
  })
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<string | null>(null)

  const [activeRegIds, setActiveRegIds] = useState<Set<string>>(() => {
    const stored = initialChecks.find(
      c => c.regulation === 'system' && c.check_type === 'active_regulations'
    )
    if (!stored?.notes) return new Set()
    try { return new Set(JSON.parse(stored.notes) as string[]) }
    catch { return new Set() }
  })

  const toggleReg = (id: string) => {
    setActiveRegIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      upsert('system', 'active_regulations', 'compliant', JSON.stringify([...next]))
      return next
    })
  }

  const activeRegs = ADDITIONAL_REGULATIONS.filter(r => activeRegIds.has(r.id))

  const getCheck = (regulation: string, checkType: string): CheckRow | undefined =>
    checks.get(makeKey(regulation, checkType))

  const upsert = useCallback(async (
    regulation: string,
    checkType: string,
    status: CheckStatus,
    notes?: string | null
  ) => {
    const key = makeKey(regulation, checkType)
    const optimistic: CheckRow = {
      regulation,
      check_type: checkType,
      status,
      notes: notes ?? null,
      completed_at: status === 'compliant' ? new Date().toISOString() : null,
    }
    setChecks(prev => new Map(prev).set(key, optimistic))
    setSaving(prev => new Set(prev).add(key))
    try {
      await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regulation, check_type: checkType, status, notes: notes ?? null }),
      })
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(key); return n })
    }
  }, [])

  // Zyklus: pending → compliant → non_compliant → pending
  const toggleItem = (regulation: string, checkType: string) => {
    const current = getCheck(regulation, checkType)
    const s = current?.status ?? 'pending'
    const next: CheckStatus = s === 'pending' ? 'compliant' : s === 'compliant' ? 'non_compliant' : 'pending'
    upsert(regulation, checkType, next)
  }

  const setRiskClass = (riskClass: EuAiActRiskClass) => {
    const current = getCheck('eu_ai_act', 'risk_class')
    if (current?.notes === riskClass) {
      upsert('eu_ai_act', 'risk_class', 'pending', null)
    } else {
      upsert('eu_ai_act', 'risk_class', 'compliant', riskClass)
    }
  }

  const selectedRiskClass = (): EuAiActRiskClass | null => {
    const c = getCheck('eu_ai_act', 'risk_class')
    if (c?.status === 'compliant' && c.notes) return c.notes as EuAiActRiskClass
    return null
  }

  const getRiskMatrixPos = () => {
    const c = getCheck('risk_matrix', 'position')
    if (!c?.notes) return { impact: 2, probability: 2 }
    try { return JSON.parse(c.notes) as { impact: number; probability: number } }
    catch { return { impact: 2, probability: 2 } }
  }

  const setRiskMatrixPos = (impact: number, probability: number) => {
    upsert('risk_matrix', 'position', 'compliant', JSON.stringify({ impact, probability }))
  }

  // ─── Progress helpers ────────────────────────────────────────────────────
  const riskClass = selectedRiskClass()
  const obligations = riskClass ? EU_AI_ACT_OBLIGATIONS[riskClass] : []
  const euAiActDone = obligations.filter(o => getCheck('eu_ai_act', o.id)?.status === 'compliant').length
  const euAiActNonCompliant = obligations.filter(o => getCheck('eu_ai_act', o.id)?.status === 'non_compliant').length
  const dsgvoDone = DSGVO_CHECKLIST.filter(i => getCheck('dsgvo', i.id)?.status === 'compliant').length
  const dsgvoNonCompliant = DSGVO_CHECKLIST.filter(i => getCheck('dsgvo', i.id)?.status === 'non_compliant').length

  // ─── Offene Punkte (nicht erfüllte Einträge aller Regelwerke) ────────────
  const allOpenItems = [
    ...obligations.filter(o => getCheck('eu_ai_act', o.id)?.status === 'non_compliant')
      .map(o => ({ reg: 'EU AI Act', label: o.label })),
    ...DSGVO_CHECKLIST.filter(i => getCheck('dsgvo', i.id)?.status === 'non_compliant')
      .map(i => ({ reg: 'DSGVO', label: i.label })),
    ...activeRegs.flatMap(reg =>
      reg.items.filter(i => getCheck(reg.id, i.id)?.status === 'non_compliant')
        .map(i => ({ reg: reg.shortLabel, label: i.label }))
    ),
  ]

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      {/* Content freshness badge */}
      <div className={cn(
        'mb-4 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border w-fit',
        COMPLIANCE_REVIEWED_DAYS > 90
          ? 'bg-amber-50 border-amber-200 text-amber-700'
          : 'bg-slate-50 border-slate-200 text-slate-500'
      )}>
        {COMPLIANCE_REVIEWED_DAYS > 90 ? '⚠' : '✓'}
        <span>
          Inhalt zuletzt geprüft: {new Date(CONTENT_REVIEWED_AT).toLocaleDateString('de-DE')}
          {COMPLIANCE_REVIEWED_DAYS > 90 && ' — Review empfohlen'}
        </span>
      </div>

      {/* Tab bar */}
      <div role="tablist" aria-label="Compliance-Bereiche" className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-ring',
              tab === t.id
                ? 'border-blue-600 text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            )}
          >
            {t.label}
            {t.id === 'summary' && allOpenItems.length > 0 && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                {allOpenItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── EU AI ACT ── */}
      {tab === 'euaiact' && (
        <div role="tabpanel" id="panel-euaiact" aria-labelledby="tab-euaiact" className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-1">Schritt 1: Risikoklasse selbst einordnen</h2>
            <p className="text-xs text-slate-400 mb-3">
              Wählen Sie die EU AI Act-Risikoklasse, die auf Ihren primären AI-Use-Case zutrifft.
              Die passende Pflichten-Checkliste erscheint danach automatisch.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EU_AI_ACT_RISK_CLASSES.map(cls => {
                const isSelected = riskClass === cls.id
                return (
                  <button
                    key={cls.id}
                    onClick={() => setRiskClass(cls.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'text-left rounded-2xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1',
                      isSelected
                        ? `${cls.color.bg} ${cls.color.border} ring-2 ring-primary-ring`
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn('text-xs font-semibold', isSelected ? cls.color.title : 'text-slate-700')}>
                        {cls.title}
                      </span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', isSelected ? cls.color.badge : 'bg-slate-100 text-slate-500')}>
                        {cls.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{cls.articleRef}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{cls.summary}</p>
                    <ul className="mt-2 space-y-0.5">
                      {cls.examples.slice(0, 3).map((ex, i) => (
                        <li key={i} className="text-xs text-slate-500 flex gap-1.5">
                          <span className="flex-shrink-0">·</span><span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          </div>

          {riskClass === 'prohibited' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5">
              <p className="text-sm font-semibold text-red-800 mb-1">Deployment nicht zulässig</p>
              <p className="text-xs text-red-600">
                Systeme dieser Klasse sind nach Art. 5 EU AI Act in der EU verboten. Es gibt kein Übergangsrecht und keine Ausnahmen für gewerbliche Zwecke.
                Wenden Sie sich an einen Rechtsberater, bevor Sie weitermachen.
              </p>
            </div>
          )}

          {riskClass === 'minimal' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5">
              <p className="text-sm font-semibold text-emerald-800 mb-1">Keine gesetzlichen Pflichten nach EU AI Act</p>
              <p className="text-xs text-emerald-700">
                Systeme mit minimalem Risiko unterliegen keinen verpflichtenden Anforderungen des EU AI Act.
                Empfohlen: freiwilliger Code of Practice und interne AI-Governance nach ISO 42001.
              </p>
            </div>
          )}

          {riskClass && obligations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Schritt 2: Pflichten-Checkliste ({EU_AI_ACT_RISK_CLASSES.find(c => c.id === riskClass)?.title})
                  </h2>
                  <InfoHint title="Wie funktioniert die Checkliste?">
                    <p>Klicken Sie auf den Status-Kreis eines Eintrags, um zwischen drei Zuständen zu wechseln:</p>
                    <p className="mt-1.5"><strong>○ Offen</strong> — noch nicht geprüft (Ausgangszustand)</p>
                    <p className="mt-1.5"><strong>✓ Erfüllt</strong> — Anforderung ist umgesetzt</p>
                    <p className="mt-1.5"><strong>✗ Nicht erfüllt</strong> — geprüft, aber Lücke identifiziert. Diese Punkte erscheinen als Offene Punkte in der Zusammenfassung.</p>
                  </InfoHint>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {euAiActDone}/{obligations.length} erfüllt
                  {euAiActNonCompliant > 0 && (
                    <span className="ml-2 text-red-600 font-medium">· {euAiActNonCompliant} offen</span>
                  )}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(euAiActDone / obligations.length) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={euAiActDone}
                  aria-valuemin={0}
                  aria-valuemax={obligations.length}
                  aria-label="EU AI Act Fortschritt"
                />
              </div>
              <ul className="space-y-2">
                {obligations.map(item => {
                  const c = getCheck('eu_ai_act', item.id)
                  const status = c?.status ?? 'pending'
                  const isSaving = saving.has(makeKey('eu_ai_act', item.id))
                  return (
                    <li key={item.id}>
                      <div className={cn(
                        'flex items-start gap-3 p-3.5 rounded-xl border transition-colors',
                        status === 'compliant' ? 'bg-primary-soft border-primary-border' :
                        status === 'non_compliant' ? 'bg-red-50 border-red-200' :
                        'bg-white border-slate-200',
                        isSaving && 'opacity-60'
                      )}>
                        <StatusIcon status={status} onClick={() => toggleItem('eu_ai_act', item.id)} disabled={isSaving} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-primary mb-0.5">{item.article}</p>
                          <p className={cn('text-sm font-medium',
                            status === 'compliant' ? 'text-primary line-through' :
                            status === 'non_compliant' ? 'text-red-800' : 'text-slate-800'
                          )}>
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                          {item.relevance && (
                            <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 mt-1.5">
                              Warum relevant: {item.relevance}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {!riskClass && (
            <p className="text-sm text-slate-400 text-center py-6">
              Wählen Sie oben eine Risikoklasse, um die passende Pflichten-Checkliste zu sehen.
            </p>
          )}
        </div>
      )}

      {/* ── DSGVO ── */}
      {tab === 'dsgvo' && (
        <div role="tabpanel" id="panel-dsgvo" aria-labelledby="tab-dsgvo">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm text-slate-500 whitespace-nowrap">{dsgvoDone} von {DSGVO_CHECKLIST.length} erfüllt</p>
              {dsgvoNonCompliant > 0 && (
                <span className="text-xs text-red-600 font-medium whitespace-nowrap">· {dsgvoNonCompliant} nicht erfüllt</span>
              )}
              <InfoHint title="Wie funktioniert die DSGVO-Checkliste?">
                <p>Klicken Sie auf den Kreis links neben einem Eintrag, um seinen Status zu ändern:</p>
                <p className="mt-1.5"><strong>○ Offen</strong> — noch nicht geprüft</p>
                <p className="mt-1.5"><strong>✓ Erfüllt</strong> — Anforderung ist umgesetzt</p>
                <p className="mt-1.5"><strong>✗ Nicht erfüllt</strong> — Lücke identifiziert, muss adressiert werden</p>
                <p className="mt-2">Nicht erfüllte Punkte erscheinen als Handlungsbedarf in der Zusammenfassung.</p>
              </InfoHint>
            </div>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(dsgvoDone / DSGVO_CHECKLIST.length) * 100}%` }}
                role="progressbar"
                aria-valuenow={dsgvoDone}
                aria-valuemin={0}
                aria-valuemax={DSGVO_CHECKLIST.length}
                aria-label="DSGVO-Fortschritt"
              />
            </div>
          </div>
          <ul className="space-y-2">
            {DSGVO_CHECKLIST.map(item => {
              const c = getCheck('dsgvo', item.id)
              const status = c?.status ?? 'pending'
              const isSaving = saving.has(makeKey('dsgvo', item.id))
              return (
                <li key={item.id}>
                  <div className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border transition-colors',
                    status === 'compliant' ? 'bg-emerald-50 border-emerald-200' :
                    status === 'non_compliant' ? 'bg-red-50 border-red-200' :
                    'bg-white border-slate-200',
                    isSaving && 'opacity-60'
                  )}>
                    <StatusIcon status={status} onClick={() => toggleItem('dsgvo', item.id)} disabled={isSaving} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary mb-0.5">{item.article}</p>
                      <p className={cn('text-sm font-medium',
                        status === 'compliant' ? 'text-emerald-800 line-through' :
                        status === 'non_compliant' ? 'text-red-800' : 'text-slate-800'
                      )}>
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                      {item.relevance && (
                        <p className="text-xs text-primary-hover bg-primary-soft rounded px-2 py-1 mt-1.5">
                          AI-Relevanz: {item.relevance}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* ── RISIKOMATRIX ── */}
      {tab === 'matrix' && (
        <div role="tabpanel" id="panel-matrix" aria-labelledby="tab-matrix">
          <p className="text-sm text-slate-500 mb-5">
            Positionieren Sie Ihren AI-Use-Case nach Auswirkung (bei Fehler) und Eintrittswahrscheinlichkeit.
          </p>
          <RiskMatrixSelector
            value={getRiskMatrixPos()}
            onChange={({ impact, probability }) => setRiskMatrixPos(impact, probability)}
          />
        </div>
      )}

      {/* ── ZUSAMMENFASSUNG ── */}
      {tab === 'summary' && (
        <div role="tabpanel" id="panel-summary" aria-labelledby="tab-summary" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
            <SummaryCard
              label="EU AI Act Risikoklasse"
              value={riskClass
                ? EU_AI_ACT_RISK_CLASSES.find(c => c.id === riskClass)?.title ?? '—'
                : 'Nicht eingestuft'}
              sub={riskClass ? EU_AI_ACT_RISK_CLASSES.find(c => c.id === riskClass)?.articleRef : undefined}
              done={!!riskClass}
            />
            <SummaryCard
              label="EU AI Act Pflichten"
              value={obligations.length > 0 ? `${euAiActDone} / ${obligations.length}` : riskClass ? 'Keine Pflichten' : '—'}
              sub={obligations.length > 0 ? `${Math.round((euAiActDone / obligations.length) * 100)}% abgeschlossen` : undefined}
              done={obligations.length > 0 ? euAiActDone === obligations.length : !!riskClass}
              issues={euAiActNonCompliant}
            />
            <SummaryCard
              label="DSGVO-Checkliste"
              value={`${dsgvoDone} / ${DSGVO_CHECKLIST.length}`}
              sub={`${Math.round((dsgvoDone / DSGVO_CHECKLIST.length) * 100)}% abgeschlossen`}
              done={dsgvoDone === DSGVO_CHECKLIST.length}
              issues={dsgvoNonCompliant}
            />
          </div>

          {/* Risikoniveau */}
          {(() => {
            const pos = getRiskMatrixPos()
            const level = getRiskLevel(pos.impact, pos.probability)
            return (
              <div className={cn('rounded-2xl border p-4', level.color.bg, level.color.border)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', level.color.badge)}>
                    Risikoniveau: {level.label}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800">{level.action}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Auswirkung: {RISK_MATRIX.impactLabels[pos.impact - 1]} · Wahrscheinlichkeit: {RISK_MATRIX.probabilityLabels[pos.probability - 1]}
                </p>
              </div>
            )
          })()}

          {/* Offene Punkte */}
          {allOpenItems.length > 0 && (
            <div className="border border-red-200 rounded-2xl p-4 sm:p-5 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-red-900">
                  Offene Punkte ({allOpenItems.length})
                </h3>
                <InfoHint title="Was sind Offene Punkte?" side="bottom">
                  <p>Alle Anforderungen, die Sie als <strong>&bdquo;Nicht erfüllt&ldquo; (✗)</strong> markiert haben.</p>
                  <p className="mt-1.5">Diese Lücken sollten vor einem Go-Live adressiert werden — durch technische Maßnahmen, Prozessanpassungen oder Dokumentation.</p>
                  <p className="mt-1.5">Klicken Sie in der Checkliste auf den roten Status-Kreis, um den Status zurückzusetzen.</p>
                </InfoHint>
              </div>
              <p className="text-xs text-red-700 mb-3">
                Folgende Anforderungen wurden als &bdquo;Nicht erfüllt&ldquo; markiert und müssen vor einem Go-Live adressiert werden.
              </p>
              <ul className="space-y-2">
                {allOpenItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs">
                    <span
                      className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-[10px]"
                      aria-hidden="true"
                    >✗</span>
                    <span className="min-w-0">
                      <span className="font-semibold text-red-800">{item.reg}:</span>
                      <span className="text-red-700 ml-1">{item.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {allOpenItems.length === 0 && (dsgvoDone > 0 || euAiActDone > 0) && (
            <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50">
              <p className="text-xs font-medium text-emerald-800">✓ Keine offenen Punkte — alle geprüften Anforderungen sind erfüllt.</p>
            </div>
          )}
        </div>
      )}

      {/* ── POLICY TEMPLATES ── */}
      {tab === 'templates' && (
        <div role="tabpanel" id="panel-templates" aria-labelledby="tab-templates" className="space-y-4">
          {POLICY_TEMPLATES.map(tpl => (
            <section key={tpl.id} aria-labelledby={`tpl-${tpl.id}`} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h2 id={`tpl-${tpl.id}`} className="text-sm font-semibold text-slate-900">{tpl.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{tpl.subtitle}</p>
                </div>
                <button
                  onClick={() => handleCopy(tpl.id, tpl.content)}
                  aria-label={`${tpl.title} in Zwischenablage kopieren`}
                  className="flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1"
                >
                  {copied === tpl.id ? '✓ Kopiert' : 'Kopieren'}
                </button>
              </div>
              <pre className="text-xs text-slate-500 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-3 bg-slate-50">
                {tpl.content}
              </pre>
            </section>
          ))}
        </div>
      )}

      {/* ── WEITERE GESETZE ── */}
      {tab === 'extras' && (
        <div role="tabpanel" id="panel-extras" aria-labelledby="tab-extras" className="space-y-6">
          <HintBox variant="info" className="mb-1">
            <strong>Wählen Sie branchenspezifische Regelwerke aus</strong>, die für Ihr Unternehmen relevant sind.
            Aktivierte Gesetze erscheinen als ausfüllbare Checklisten — Ihr Fortschritt wird automatisch gespeichert.
          </HintBox>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-slate-700">Regelwerke aktivieren</h2>
              <InfoHint title="Warum zusätzliche Regelwerke?">
                <p>EU AI Act und DSGVO sind für alle AI-Projekte relevant. Je nach Branche und Unternehmensgröße kommen weitere Anforderungen hinzu:</p>
                <p className="mt-1"><strong>ISO 42001</strong> ist der internationale KI-Management-Standard — häufige Anforderung in Enterprise-Ausschreibungen.</p>
                <p className="mt-1"><strong>NIS-2</strong> gilt seit Oktober 2024 für kritische Infrastrukturen und digitale Dienste.</p>
                <p className="mt-1"><strong>BAIT</strong> ist verpflichtend für Banken und Finanzdienstleister unter BaFin-Aufsicht.</p>
                <p className="mt-1"><strong>LkSG</strong> betrifft Unternehmen ab 1.000 Mitarbeitenden — auch bei externer Datenbeschaffung relevant.</p>
              </InfoHint>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ADDITIONAL_REGULATIONS.map(reg => {
                const isActive = activeRegIds.has(reg.id)
                return (
                  <button
                    key={reg.id}
                    onClick={() => toggleReg(reg.id)}
                    aria-pressed={isActive}
                    className={cn(
                      'text-left rounded-2xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-1',
                      isActive
                        ? 'bg-primary-soft border-primary-ring ring-1 ring-primary-ring'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', isActive ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600')}>
                        {reg.shortLabel}
                      </span>
                      <span className={cn('text-xs font-medium', isActive ? 'text-primary' : 'text-slate-400')}>
                        {isActive ? '✓ Aktiv' : 'Aktivieren'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mb-1 leading-snug">{reg.label}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{reg.description}</p>
                    <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                      <strong>Gilt für:</strong> {reg.applicability}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {activeRegs.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">
              Aktivieren Sie oben ein Regelwerk, um die passende Checkliste anzuzeigen.
            </p>
          )}

          {activeRegs.map(reg => {
            const regDone = reg.items.filter(i => getCheck(reg.id, i.id)?.status === 'compliant').length
            const regNonCompliant = reg.items.filter(i => getCheck(reg.id, i.id)?.status === 'non_compliant').length
            return (
              <div key={reg.id} className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{reg.label}</h3>
                    <InfoHint title={reg.label} side="bottom">
                      <p>{reg.description}</p>
                      <p className="mt-1.5"><strong>Gilt für:</strong> {reg.applicability}</p>
                    </InfoHint>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                    {regDone}/{reg.items.length} erfüllt
                    {regNonCompliant > 0 && (
                      <span className="ml-1.5 text-red-600 font-medium">· {regNonCompliant} offen</span>
                    )}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(regDone / reg.items.length) * 100}%` }}
                    role="progressbar"
                    aria-valuenow={regDone}
                    aria-valuemin={0}
                    aria-valuemax={reg.items.length}
                    aria-label={`${reg.shortLabel} Fortschritt`}
                  />
                </div>
                <ul className="space-y-2">
                  {reg.items.map(item => {
                    const c = getCheck(reg.id, item.id)
                    const status = c?.status ?? 'pending'
                    const isSaving = saving.has(makeKey(reg.id, item.id))
                    return (
                      <li key={item.id}>
                        <div className={cn(
                          'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                          status === 'compliant' ? 'bg-primary-soft border-primary-border' :
                          status === 'non_compliant' ? 'bg-red-50 border-red-200' :
                          'bg-white border-slate-200',
                          isSaving && 'opacity-60'
                        )}>
                          <StatusIcon status={status} onClick={() => toggleItem(reg.id, item.id)} disabled={isSaving} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-primary mb-0.5">{item.category}</p>
                            <p className={cn('text-sm font-medium',
                              status === 'compliant' ? 'text-primary line-through' :
                              status === 'non_compliant' ? 'text-red-800' : 'text-slate-800'
                            )}>
                              {item.label}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {/* Regulatorische Beobachtungsliste */}
      <div className="border border-amber-200 rounded-xl bg-amber-50 p-4 sm:p-6 space-y-3 mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-amber-700">Regulatorische Beobachtungsliste</span>
          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full">
            In Gesetzgebung — noch nicht verbindlich
          </span>
          <span className="text-xs text-amber-600 ml-auto">({REGULATORY_WATCHLIST.length})</span>
        </div>
        <p className="text-xs text-amber-600">
          Diese Einträge sind keine Compliance-Pflichten. Sie zeigen an, was sich ändern könnte.
          Erst nach Veröffentlichung im EU-Amtsblatt (EUR-Lex) werden sie in die Checklisten übernommen.
        </p>
        <div className="space-y-2">
          {REGULATORY_WATCHLIST.map(item => (
            <WatchlistCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Aktions-Leiste */}
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-slate-200">
        <a
          href="/api/export/pdf?module=compliance"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 inline-flex items-center gap-1.5"
        >
          PDF exportieren
        </a>
      </div>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusIcon({
  status,
  onClick,
  disabled,
}: {
  status: CheckStatus | undefined
  onClick: () => void
  disabled: boolean
}) {
  const base = 'flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50'
  if (!status || status === 'pending') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="Offen — anklicken für Erfüllt"
        className={cn(base, 'border-slate-300 bg-white hover:border-primary-ring focus:ring-primary-ring')}
      />
    )
  }
  if (status === 'compliant') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label="Erfüllt — anklicken für Nicht erfüllt"
        className={cn(base, 'border-emerald-500 bg-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 focus:ring-emerald-500')}
      >
        <span className="text-white text-[10px] font-bold leading-none" aria-hidden="true">✓</span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Nicht erfüllt — anklicken für Offen"
      className={cn(base, 'border-red-500 bg-red-500 hover:bg-red-600 hover:border-red-600 focus:ring-red-500')}
    >
      <span className="text-white text-[10px] font-bold leading-none" aria-hidden="true">✗</span>
    </button>
  )
}

function SummaryCard({
  label,
  value,
  sub,
  done,
  issues,
}: {
  label: string
  value: string
  sub?: string
  done: boolean
  issues?: number
}) {
  return (
    <div className={cn('rounded-xl border p-4', done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200')}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={cn('text-base font-semibold', done ? 'text-emerald-800' : 'text-slate-900')}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      {issues != null && issues > 0 && (
        <p className="text-xs text-red-600 mt-1 font-medium">✗ {issues} nicht erfüllt</p>
      )}
    </div>
  )
}

function RiskMatrixSelector({
  value,
  onChange,
}: {
  value: { impact: number; probability: number }
  onChange: (v: { impact: number; probability: number }) => void
}) {
  const level = getRiskLevel(value.impact, value.probability)

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Auswirkung bei Fehler <span className="font-normal text-slate-400">(Was passiert wenn das System falsch liegt?)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {RISK_MATRIX.impactLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => onChange({ ...value, impact: i + 1 })}
              aria-pressed={value.impact === i + 1}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring',
                value.impact === i + 1
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {i + 1} — {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Eintrittswahrscheinlichkeit <span className="font-normal text-slate-400">(Wie häufig könnte das Fehler passieren?)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {RISK_MATRIX.probabilityLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => onChange({ ...value, probability: i + 1 })}
              aria-pressed={value.probability === i + 1}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring',
                value.probability === i + 1
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              {i + 1} — {label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('rounded-2xl border p-4 sm:p-5', level.color.bg, level.color.border)}>
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', level.color.badge)}>
            {level.label}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-800 mb-1">{level.action}</p>
        <ul className="space-y-0.5">
          {level.examples.map((ex, i) => (
            <li key={i} className="text-xs text-slate-500 flex gap-1.5">
              <span className="flex-shrink-0">·</span><span>{ex}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
