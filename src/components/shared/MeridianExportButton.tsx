'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { track } from '@/lib/posthog/client'

interface Props {
  report: string
  locale: string
  isPro: boolean
  hasAssessment: boolean
}

// Export-Button für MERIDIAN-Reports (Issue #224) — bewusst als eigene
// Client-Komponente, da nur hier ein `report_exported`-PostHog-Event vor dem
// Öffnen der PDF-Route gefeuert werden muss (der bestehende Executive-
// Summary-Link auf derselben Seite bleibt unverändert bei /api/export/pdf,
// dem alten book/board/blueprint-Templatesystem).
export function MeridianExportButton({ report, locale, isPro, hasAssessment }: Props) {
  const t = useTranslations('reports.executiveSummary')

  if (!isPro) {
    return (
      <Link
        href="/upgrade"
        className="px-4 py-2 text-sm font-medium border border-violet-200 text-violet-700 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
      >
        {t('exportButton')}
      </Link>
    )
  }

  if (!hasAssessment) {
    return (
      <span
        title={t('exportHintNoAssessment')}
        className="px-4 py-2 text-sm font-medium border border-line text-ink-subtle rounded-xl whitespace-nowrap inline-flex items-center gap-1.5 cursor-not-allowed opacity-60"
      >
        {t('exportButton')}
      </span>
    )
  }

  const handleClick = () => {
    track('report_exported', { report, locale })
    window.open(`/api/export/${report}?locale=${locale}`, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 text-sm font-medium border border-line rounded-xl text-ink-secondary hover:bg-surface-raised transition-colors whitespace-nowrap inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
    >
      {t('exportButton')}
    </button>
  )
}
