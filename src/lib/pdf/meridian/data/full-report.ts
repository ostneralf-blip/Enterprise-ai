import 'server-only'
import { getExecutiveSummaryData } from '@/lib/pdf/meridian/data/executive-summary'
import { getReadinessData } from '@/lib/pdf/meridian/data/readiness'
import { getUsecasePortfolioData } from '@/lib/pdf/meridian/data/usecase-portfolio'
import { getComplianceStatusData } from '@/lib/pdf/meridian/data/compliance-status'
import { getRoadmapStatusData } from '@/lib/pdf/meridian/data/roadmap-status'
import { getArchitectureStatusData } from '@/lib/pdf/meridian/data/architecture-status'
import type { FullReportData } from '@/lib/pdf/meridian/reports/full-report'
import type { Locale } from '@/i18n/routing'

/**
 * Lädt alle 6 MERIDIAN-Reports parallel für das Gesamtdokument (Issue #225).
 * Jeder Report ist unabhängig optional — fehlende Module (z. B. noch keine
 * gespeicherte Architektur) werden im Ergebnis einfach weggelassen, statt den
 * gesamten Export scheitern zu lassen. Gibt `null` zurück, wenn NICHT EINMAL
 * die Executive Summary verfügbar ist (kein abgeschlossenes Assessment) —
 * ohne dieses Fundament wäre ein "leeres" Gesamtdokument wenig sinnvoll.
 */
export async function getFullReportData(userId: string, locale: Locale): Promise<FullReportData | null> {
  const [executiveSummary, readiness, usecasePortfolio, complianceStatus, roadmapStatus, architectureStatus] = await Promise.all([
    getExecutiveSummaryData(userId, locale),
    getReadinessData(userId, locale),
    getUsecasePortfolioData(userId),
    getComplianceStatusData(userId, locale),
    getRoadmapStatusData(userId, locale),
    getArchitectureStatusData(userId, locale),
  ])

  if (!executiveSummary) return null

  return {
    executiveSummary,
    readiness: readiness ?? undefined,
    usecasePortfolio: usecasePortfolio ?? undefined,
    complianceStatus: complianceStatus ?? undefined,
    roadmapStatus: roadmapStatus ?? undefined,
    architectureStatus: architectureStatus ?? undefined,
  }
}
