import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createTranslator } from 'next-intl'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, RadarChart, MeterBar, Badge } from '@/lib/pdf/meridian/components'
import { reportColors, reportFonts, reportPage, reportType, REPORT_CRITICAL_THRESHOLD } from '@/config/report-tokens'
import type { ReadinessData } from '@/lib/pdf/meridian/data/readiness'
import type { Locale } from '@/i18n/routing'

// Readiness-Deep-Dive-Report (Musterseite 2, Issue #225) — Radar-Hexagon +
// Detailbalken, priorisierte Handlungsfelder (3 schwächste Dimensionen) und
// Methodik-Fußblock. Branchenbenchmark/Vorjahresabweichung aus der
// Musterseite entfallen bewusst mangels echter Datenquelle (siehe #224).

const MESSAGES = { de: deMessages, en: enMessages } as const
type ReadinessTranslator = ReturnType<typeof createTranslator<typeof deMessages, 'reports.readiness'>>

function getReadinessTranslator(locale: Locale): ReadinessTranslator {
  return createTranslator({ locale, messages: MESSAGES[locale], namespace: 'reports.readiness' })
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: reportColors.ivory,
    paddingTop: reportPage.margin,
    paddingBottom: reportPage.margin + 24,
    paddingHorizontal: reportPage.margin,
    fontFamily: reportFonts.sans,
  },
  title: { ...reportType.title, marginTop: 16 },
  subtitle: { ...reportType.subtitle, marginTop: 4, marginBottom: 20 },
  topRow: { flexDirection: 'row', gap: 24, marginBottom: 14 },
  radarCol: { alignItems: 'center', justifyContent: 'center' },
  dimCol: { flex: 1, justifyContent: 'center' },
  sectionEyebrow: { ...reportType.eyebrow, marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  actionBadgeCol: { width: 90 },
  actionText: { ...reportType.body, flex: 1, lineHeight: 1.5 },
  methodRow: { flexDirection: 'row', gap: 32, marginTop: 12, paddingTop: 12, borderTopWidth: 0.75, borderTopColor: reportColors.line },
  methodCol: { flex: 1 },
  methodLabel: { ...reportType.eyebrowPrimary, marginBottom: 5 },
  methodText: { ...reportType.body, fontSize: 8 },
})

export function renderMeridianReadiness(data: ReadinessData, locale: Locale) {
  registerMeridianFonts()
  const t = getReadinessTranslator(locale)
  const contentWidth = reportPage.width - reportPage.margin * 2

  const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(data.assessmentDate))
  const subtitle = t('subtitle', { count: data.questionCount })

  const dimById = new Map(data.dimensions.map(d => [d.id, d]))
  const meterWidth = contentWidth * 0.5 - 90 - 24 - 16

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader refId={`RD·${data.assessmentDate.slice(0, 10)}`} documentType={t('documentType')} contentWidth={contentWidth} />

        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.topRow}>
          <View style={styles.radarCol}>
            <RadarChart dimensions={data.dimensions.map(d => ({ label: d.label, value: d.score100 }))} size={216} />
          </View>
          <View style={styles.dimCol}>
            <Text style={styles.sectionEyebrow}>{t('dimensionsLabel')}</Text>
            {data.dimensions.map(d => (
              <MeterBar key={d.id} label={d.label} value={d.score100} width={meterWidth} />
            ))}
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>{t('actionFieldsLabel')}</Text>
        {data.weakestDimensionIds.map(id => {
          const dim = dimById.get(id)
          if (!dim) return null
          return (
            <View key={id} style={styles.actionRow}>
              <View style={styles.actionBadgeCol}>
                <Badge label={`${dim.label.toUpperCase()} · ${dim.score100}`} variant={dim.score100 < REPORT_CRITICAL_THRESHOLD ? 'critical' : 'warning'} />
              </View>
              <Text style={styles.actionText}>{t(`action.${id}` as 'action.data')}</Text>
            </View>
          )
        })}

        <View style={styles.methodRow}>
          <View style={styles.methodCol}>
            <Text style={styles.methodLabel}>{t('methodCollectionLabel')}</Text>
            <Text style={styles.methodText}>{t('methodCollectionText', { count: data.questionCount })}</Text>
          </View>
          <View style={styles.methodCol}>
            <Text style={styles.methodLabel}>{t('methodScaleLabel')}</Text>
            <Text style={styles.methodText}>{t('methodScaleText')}</Text>
          </View>
          <View style={styles.methodCol}>
            <Text style={styles.methodLabel}>{t('methodDateLabel')}</Text>
            <Text style={styles.methodText}>{monthYear}</Text>
          </View>
        </View>

        <ReportFooter confidentialLabel={t('confidential')} />
      </Page>
    </Document>
  )
}
