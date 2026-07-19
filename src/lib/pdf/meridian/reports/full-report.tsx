import { Document } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { renderMeridianExecutiveSummary } from '@/lib/pdf/meridian/reports/executive-summary'
import { renderMeridianReadiness } from '@/lib/pdf/meridian/reports/readiness'
import { renderMeridianUsecasePortfolio } from '@/lib/pdf/meridian/reports/usecase-portfolio'
import { renderMeridianComplianceStatus } from '@/lib/pdf/meridian/reports/compliance-status'
import { renderMeridianRoadmapStatus } from '@/lib/pdf/meridian/reports/roadmap-status'
import { renderMeridianArchitectureStatus } from '@/lib/pdf/meridian/reports/architecture-status'
import type { ExecutiveSummaryData } from '@/lib/pdf/meridian/data/executive-summary'
import type { ReadinessData } from '@/lib/pdf/meridian/data/readiness'
import type { UsecasePortfolioData } from '@/lib/pdf/meridian/data/usecase-portfolio'
import type { ComplianceStatusData } from '@/lib/pdf/meridian/data/compliance-status'
import type { RoadmapStatusData } from '@/lib/pdf/meridian/data/roadmap-status'
import type { ArchitectureStatusData } from '@/lib/pdf/meridian/data/architecture-status'
import type { Locale } from '@/i18n/routing'

// Gesamtdokument-Export (Issue #225, Akzeptanzkriterium "Gesamtdokument-Export
// mit korrekter Paginierung"): Jede der 6 Report-Funktionen liefert bereits
// ein vollständiges <Document> mit genau einer <Page> — statt jede Datei auf
// eine "Page-only"-Variante umzubauen, wird hier einfach das <Page>-Kind des
// zurückgegebenen <Document> extrahiert (props.children) und in EIN
// gemeinsames <Document> gehängt. react-pdf zählt pageNumber/totalPages
// (siehe ReportFooter) automatisch über alle Seiten EINES <Document> —
// dadurch stimmt die fortlaufende XX/YY-Paginierung ohne weiteres Zutun.
// Seiten, für die keine Daten existieren, werden übersprungen statt die
// gesamte Zusammenstellung scheitern zu lassen.
function pageOf(doc: ReactElement): ReactElement {
  return (doc.props as { children: ReactElement }).children
}

export interface FullReportData {
  executiveSummary?: ExecutiveSummaryData
  readiness?: ReadinessData
  usecasePortfolio?: UsecasePortfolioData
  complianceStatus?: ComplianceStatusData
  roadmapStatus?: RoadmapStatusData
  architectureStatus?: ArchitectureStatusData
}

export function renderMeridianFullReport(data: FullReportData, locale: Locale) {
  const pages: ReactElement[] = []
  if (data.executiveSummary) pages.push(pageOf(renderMeridianExecutiveSummary(data.executiveSummary, locale)))
  if (data.readiness) pages.push(pageOf(renderMeridianReadiness(data.readiness, locale)))
  if (data.usecasePortfolio) pages.push(pageOf(renderMeridianUsecasePortfolio(data.usecasePortfolio, locale)))
  if (data.complianceStatus) pages.push(pageOf(renderMeridianComplianceStatus(data.complianceStatus, locale)))
  if (data.roadmapStatus) pages.push(pageOf(renderMeridianRoadmapStatus(data.roadmapStatus, locale)))
  if (data.architectureStatus) pages.push(pageOf(renderMeridianArchitectureStatus(data.architectureStatus, locale)))

  return <Document>{pages}</Document>
}
