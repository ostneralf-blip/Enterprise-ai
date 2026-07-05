const RISK_CONFIG: Record<string, { bg: string; border: string; text: string; label: string; message: string }> = {
  prohibited: {
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800',
    label: 'EU AI Act: Verboten',
    message: 'Compliance-Check: EU AI Act stuft diesen Use-Case-Typ als verboten ein. Eine Umsetzung ist rechtlich nicht zulässig.',
  },
  high: {
    bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800',
    label: 'EU AI Act: Hochrisiko',
    message: 'Compliance-Check: EU AI Act Hochrisiko erkannt. Prüfen Sie Governance-Gates und Datenschutzmaßnahmen sorgfältig.',
  },
  limited: {
    bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800',
    label: 'EU AI Act: Begrenztes Risiko',
    message: 'Compliance-Check: Eingeschränktes Risiko laut EU AI Act. Transparenzpflichten können gelten — bitte prüfen.',
  },
}

export function ComplianceContextBanner({ riskClass }: { riskClass: string | null | undefined }) {
  if (!riskClass || !RISK_CONFIG[riskClass]) return null

  const cfg = RISK_CONFIG[riskClass]
  const icon = riskClass === 'limited' ? '⚠' : '⛔'

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 mb-5 ${cfg.bg} ${cfg.border}`}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5 text-base" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${cfg.text} opacity-75`}>
          {cfg.label}
        </p>
        <p className={`text-sm ${cfg.text}`}>{cfg.message}</p>
        <a
          href="/compliance"
          className={`text-xs underline mt-1 inline-block ${cfg.text} opacity-60 hover:opacity-100 transition-opacity`}
        >
          Compliance-Ergebnis ansehen →
        </a>
      </div>
    </div>
  )
}
