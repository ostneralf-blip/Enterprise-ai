'use client'
import { useTranslations } from 'next-intl'

export function ComplianceContextBanner({ riskClass }: { riskClass: string | null | undefined }) {
  const t = useTranslations('modules')

  if (!riskClass) return null

  const RISK_CONFIG: Record<string, { bg: string; border: string; text: string; label: string; message: string }> = {
    prohibited: {
      bg: 'bg-error-subtle', border: 'border-error-border', text: 'text-error-text',
      label: t('compliance.bannerProhibitedLabel'),
      message: t('compliance.bannerProhibitedMsg'),
    },
    high: {
      bg: 'bg-error-subtle', border: 'border-error-border', text: 'text-error-text',
      label: t('compliance.bannerHighLabel'),
      message: t('compliance.bannerHighMsg'),
    },
    limited: {
      bg: 'bg-warning-subtle', border: 'border-warning-border', text: 'text-warning-text',
      label: t('compliance.bannerLimitedLabel'),
      message: t('compliance.bannerLimitedMsg'),
    },
  }

  if (!RISK_CONFIG[riskClass]) return null

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
          {t('compliance.bannerLink')}
        </a>
      </div>
    </div>
  )
}
