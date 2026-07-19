import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createTranslator } from 'next-intl'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, Timeline, MeterBar, Badge } from '@/lib/pdf/meridian/components'
import { reportColors, reportFonts, reportPage, reportType } from '@/config/report-tokens'
import type { ComplianceStatusData, RiskClassBand } from '@/lib/pdf/meridian/data/compliance-status'
import type { CheckStatus } from '@/config/compliance-data'
import type { Locale } from '@/i18n/routing'

// Compliance-Report (Musterseite 4, Issue #225) — vier EU-AI-Act-Risikoklassen-
// Bänder (echte Zählung via computeEuAiActStatusV1, siehe #224), offizielle
// EU-AI-Act-Fristen-Zeitleiste (feste, öffentlich bekannte Gesetzestermine —
// kein Nutzerdatum, daher unbedenklich hartcodiert), offene Pflichten mit
// echtem Status aus compliance_checks, ein echter Gesamt-Fortschrittsbalken
// statt vier erfundener Einzelprozentwerte (siehe Kommentar in der Datenschicht).

const MESSAGES = { de: deMessages, en: enMessages } as const
type ComplianceTranslator = ReturnType<typeof createTranslator<typeof deMessages, 'reports.complianceStatus'>>

function getComplianceTranslator(locale: Locale): ComplianceTranslator {
  return createTranslator({ locale, messages: MESSAGES[locale], namespace: 'reports.complianceStatus' })
}

const RISK_BAND_COLOR: Record<RiskClassBand['id'], string> = {
  prohibited: reportColors.critical,
  high: reportColors.critical,
  limited: reportColors.warningText,
  minimal: reportColors.successText,
}

const STATUS_VARIANT: Record<CheckStatus, 'success' | 'warning' | 'critical' | 'primary'> = {
  compliant: 'success',
  partial: 'warning',
  pending: 'critical',
  non_compliant: 'critical',
}

// Offizielle, öffentlich bekannte EU-AI-Act-Umsetzungstermine (Art. 113) —
// gesetzlich fixiert, kein pro Nutzer variierendes Datum.
const EU_AI_ACT_MILESTONES = [
  { dateMs: Date.UTC(2025, 1, 2), key: 'milestoneProhibitions' as const },
  { dateMs: Date.UTC(2025, 7, 2), key: 'milestoneGpai' as const },
  { dateMs: Date.UTC(2026, 7, 2), key: 'milestoneHighRisk' as const },
  { dateMs: Date.UTC(2027, 7, 2), key: 'milestoneTransitionEnd' as const },
]

const styles = StyleSheet.create({
  page: {
    backgroundColor: reportColors.ivory,
    paddingTop: reportPage.margin,
    paddingBottom: reportPage.margin + 24,
    paddingHorizontal: reportPage.margin,
    fontFamily: reportFonts.sans,
  },
  title: { ...reportType.title, marginTop: 16 },
  subtitle: { ...reportType.subtitle, marginTop: 4, marginBottom: 18 },
  band: { flexDirection: 'row', gap: 10, borderWidth: 0.75, borderColor: reportColors.line, borderRadius: 3, padding: 9, marginBottom: 6, alignItems: 'flex-start' },
  bandCount: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  bandCountText: { fontFamily: reportFonts.serif, fontWeight: 700, fontSize: 13, color: reportColors.white },
  bandBody: { flex: 1 },
  bandTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bandTitle: { fontFamily: reportFonts.sans, fontWeight: 700, fontSize: 9.5, color: reportColors.ink },
  bandArticle: { fontFamily: reportFonts.mono, fontSize: 6.5, color: reportColors.inkSubtle },
  bandSummary: { ...reportType.bodyMuted, fontSize: 7.5, marginTop: 2, lineHeight: 1.4 },
  sectionEyebrow: { ...reportType.eyebrow, marginTop: 16, marginBottom: 10 },
  obligationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  obligationBadgeCol: { width: 68 },
  obligationText: { ...reportType.body, fontSize: 8, flex: 1 },
  obligationArticle: { fontFamily: reportFonts.mono, fontSize: 6.5, color: reportColors.inkSubtle },
  emptyState: { ...reportType.bodyMuted, fontStyle: 'italic' },
})

export function renderMeridianComplianceStatus(data: ComplianceStatusData, locale: Locale) {
  registerMeridianFonts()
  const t = getComplianceTranslator(locale)
  const contentWidth = reportPage.width - reportPage.margin * 2
  const totalUseCases = data.riskBands.reduce((sum, b) => sum + b.count, 0)
  const now = Date.now()

  const statusLabel: Record<CheckStatus, string> = {
    compliant: t('statusDone'),
    partial: t('statusInProgress'),
    pending: t('statusOpen'),
    non_compliant: t('statusOpen'),
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader refId={`CP·${data.generatedAt.slice(0, 10)}`} documentType={t('documentType')} contentWidth={contentWidth} />

        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{t('subtitle', { count: totalUseCases })}</Text>

        {data.riskBands.map(band => (
          <View key={band.id} style={styles.band}>
            <View style={[styles.bandCount, { backgroundColor: RISK_BAND_COLOR[band.id] }]}>
              <Text style={styles.bandCountText}>{band.count}</Text>
            </View>
            <View style={styles.bandBody}>
              <View style={styles.bandTitleRow}>
                <Text style={styles.bandTitle}>{band.title.toUpperCase()}</Text>
                <Text style={styles.bandArticle}>{band.articleRef}</Text>
              </View>
              <Text style={styles.bandSummary}>{band.summary}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionEyebrow}>{t('timelineLabel')}</Text>
        <Timeline
          width={contentWidth}
          todayMs={now}
          todayLabel={t('today')}
          markers={EU_AI_ACT_MILESTONES.map(m => ({
            dateMs: m.dateMs,
            dateLabel: new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(new Date(m.dateMs)).toUpperCase(),
            eventLabel: t(m.key),
            filled: m.dateMs <= now,
          }))}
        />

        <Text style={styles.sectionEyebrow}>{t('obligationsLabel')}</Text>
        {data.obligations.length === 0 ? (
          <Text style={styles.emptyState}>{t('noObligations')}</Text>
        ) : (
          data.obligations.map((ob, i) => (
            <View key={i} style={styles.obligationRow}>
              <View style={styles.obligationBadgeCol}>
                <Badge label={statusLabel[ob.status].toUpperCase()} variant={STATUS_VARIANT[ob.status]} />
              </View>
              <Text style={styles.obligationText}>{ob.label}</Text>
              <Text style={styles.obligationArticle}>{ob.article}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionEyebrow}>{t('progressLabel')}</Text>
        <MeterBar
          label={t('progressBarLabel')}
          value={data.obligationsTotalCount > 0 ? Math.round((data.obligationsCompletedCount / data.obligationsTotalCount) * 100) : 0}
          width={contentWidth - 90 - 24 - 16}
        />
        <Text style={styles.obligationArticle}>
          {t('progressNote', { done: data.obligationsCompletedCount, total: data.obligationsTotalCount })}
        </Text>

        <ReportFooter confidentialLabel={t('confidential')} />
      </Page>
    </Document>
  )
}
