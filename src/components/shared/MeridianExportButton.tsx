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

// Export-Button für MERIDIAN-Reports (Issue #224) — ersetzt auf /zusammenfassung
// den alten Executive-Summary-Link (/api/export/pdf, book/board/blueprint-
// Templatesystem). Bewusst als eigene Client-Komponente, da hier ein
// `report_exported`-PostHog-Event vor dem Öffnen der PDF-Route gefeuert wird.
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
      className="px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors whitespace-nowrap inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2"
    >
      {t('exportButton')}
    </button>
  )
}
