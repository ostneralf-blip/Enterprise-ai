import { Document, Page, View, Text, StyleSheet, Svg, Rect } from '@react-pdf/renderer'
import { createTranslator } from 'next-intl'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, MeterBar, RingGauge, Badge, StatCard, semanticColor } from '@/lib/pdf/meridian/components'
import { reportColors, reportFonts, reportPage, reportType, REPORT_CRITICAL_THRESHOLD } from '@/config/report-tokens'
import type { ExecutiveSummaryData, ExecutiveSummaryUseCase, QuadrantKey } from '@/lib/pdf/meridian/data/executive-summary'
import type { Locale } from '@/i18n/routing'

// createTranslator() statt getTranslations() aus next-intl/server (Issue
// #224, next-intl-Namespace 'reports'): react-pdf baut den Dokumentbaum
// außerhalb jedes React-/Request-Kontexts zusammen (kein Provider, keine
// Next.js-Request-Scope wie bei Server Components). getTranslations()
// funktioniert zwar auch mit explizitem locale-Param, greift intern aber
// über next-intl/server auf next/headers zu — das schlägt in genau den
// Kontexten fehl, in denen react-pdf tatsächlich läuft (z. B. isolierte
// Test-/Render-Skripte, aber potenziell auch Edge-Runtime-Variationen).
// createTranslator() ist die reine, Request-unabhängige Kern-API von
// next-intl/use-intl und braucht nur die Messages + Locale direkt.
const MESSAGES = { de: deMessages, en: enMessages } as const
type ReportsTranslator = ReturnType<typeof createTranslator<typeof deMessages, 'reports.executiveSummary'>>

function getReportsTranslator(locale: Locale): ReportsTranslator {
  return createTranslator({
    locale,
    messages: MESSAGES[locale],
    namespace: 'reports.executiveSummary',
  })
}

// Executive-Summary-Report (Issue #224) — erste "echte" MERIDIAN-Report-
// Komposition auf Basis des Fundaments aus #223. Bildet Musterseite 1 nach:
// RingGauge + Archetyp-Badge, sechs MeterBars, Kernbefund-Fließtext,
// Top-3-Use-Cases-Tabelle, EU-AI-Act-Status-Kennzahlen und "Nächste 90 Tage".
//
// Zwei Blöcke der Musterseite (Branchenbenchmark, Vorjahreswert als feste
// Kennzahl) sind bewusst NICHT 1:1 übernommen, wo keine echte Datenquelle
// existiert: Ein "Branchenschnitt" bräuchte ein eigenes Benchmark-Datenset,
// das es nicht gibt — dieser Block entfällt ersatzlos statt einer erfundenen
// Zahl. Der Vorjahreswert wird dagegen NUR angezeigt, wenn tatsächlich ein
// zweites abgeschlossenes Assessment existiert (siehe getExecutiveSummaryData).

const styles = StyleSheet.create({
  page: {
    backgroundColor: reportColors.ivory,
    paddingTop: reportPage.margin,
    paddingBottom: reportPage.margin + 24,
    paddingHorizontal: reportPage.margin,
    fontFamily: reportFonts.sans,
  },
  title: { ...reportType.title, marginTop: 16 },
  subtitle: { ...reportType.subtitle, marginTop: 4, marginBottom: 14 },
  topRow: { flexDirection: 'row', gap: 24, marginBottom: 4 },
  archetypeCol: { justifyContent: 'center', flex: 1 },
  previousValue: { ...reportType.bodyMuted, fontSize: 7.5, marginTop: 6 },
  headline: { fontFamily: reportFonts.sans, fontWeight: 700, fontSize: 10.5, color: reportColors.ink, lineHeight: 1.4, marginTop: 4, marginBottom: 4 },
  sectionEyebrow: { ...reportType.eyebrow, marginBottom: 7 },
  keyFindingText: { ...reportType.body, lineHeight: 1.55 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: reportColors.line, paddingBottom: 5, marginBottom: 6 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4.5, borderBottomWidth: 0.5, borderBottomColor: reportColors.lineSubtle },
  colUseCase: { flex: 2, flexDirection: 'row', gap: 6, alignItems: 'center' },
  colBar: { width: 118, flexDirection: 'row', alignItems: 'center', gap: 6 },
  colClassification: { flex: 1, alignItems: 'flex-start' },
  useCaseIndex: { fontFamily: reportFonts.mono, fontSize: 7.5, color: reportColors.inkSubtle, width: 14 },
  useCaseName: { ...reportType.body, fontSize: 8.5, color: reportColors.ink },
  barValue: { fontFamily: reportFonts.mono, fontSize: 8, fontWeight: 700, width: 18, textAlign: 'right' },
  emptyState: { ...reportType.bodyMuted, fontStyle: 'italic' },
  statRow: { flexDirection: 'row', gap: 10 },
  gapNoteRow: { flexDirection: 'row', marginTop: 5 },
  gapNoteText: { ...reportType.bodyMuted, fontSize: 7.5 },
  next90Row: { flexDirection: 'row', gap: 8, marginBottom: 5, alignItems: 'flex-start' },
  next90Index: { fontFamily: reportFonts.mono, fontSize: 8, fontWeight: 700, color: reportColors.primary, width: 16 },
  next90Label: { ...reportType.body, flex: 1 },
  twoColRow: { flexDirection: 'row', gap: 32 },
  twoCol: { flex: 1 },
})

// Dichter als reportSpacing.sectionGap (20pt) — diese Seite bildet acht
// Blöcke auf einer A4-Seite ab (Musterseite 1 hat dieselbe Dichte); mit dem
// generischen Section-Gap lief der letzte Block (Gap-Note + dritte 90-Tage-
// Maßnahme) auf eine fast leere zweite Seite über.
const SECTION_GAP = 11

const QUADRANT_VARIANT: Record<QuadrantKey, 'success' | 'primary' | 'warning' | 'critical'> = {
  quick_win: 'success',
  strategic_bet: 'primary',
  low_hanging_fruit: 'warning',
  avoid: 'critical',
}

const truncate = (str: string, max = 42) => (str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str)

function InlineBar({ value, width = 62 }: { value: number; width?: number }) {
  const color = semanticColor(value)
  const trackHeight = 4
  const fillWidth = Math.max(0, Math.min(1, value / 100)) * width
  return (
    <View style={{ width }}>
      {/* Reine Track+Fill-Leiste ohne Label/Ticks (im Unterschied zu MeterBar) —
          die Tabellenzeile trägt Name/Zahl bereits als eigene Text-Zellen. */}
      <Svg width={width} height={trackHeight}>
        <Rect width={width} height={trackHeight} rx={2} fill={reportColors.lineSubtle} />
        <Rect width={fillWidth} height={trackHeight} rx={2} fill={color} />
      </Svg>
    </View>
  )
}

function UseCaseRow({ useCase, index, t }: { useCase: ExecutiveSummaryUseCase; index: number; t: ReportsTranslator }) {
  const quadrantLabel = useCase.quadrant
    ? {
        quick_win: t('quadrantQuickWin'),
        strategic_bet: t('quadrantStrategicBet'),
        low_hanging_fruit: t('quadrantLowHangingFruit'),
        avoid: t('quadrantAvoid'),
      }[useCase.quadrant]
    : null
  return (
    <View style={styles.tableRow}>
      <View style={styles.colUseCase}>
        <Text style={styles.useCaseIndex}>{String(index + 1).padStart(2, '0')}</Text>
        <Text style={styles.useCaseName}>{truncate(useCase.name)}</Text>
      </View>
      <View style={styles.colBar}>
        <InlineBar value={useCase.value100} />
        <Text style={[styles.barValue, { color: semanticColor(useCase.value100) }]}>{useCase.value100}</Text>
      </View>
      <View style={styles.colBar}>
        <InlineBar value={useCase.feasibility100} />
        <Text style={[styles.barValue, { color: semanticColor(useCase.feasibility100) }]}>{useCase.feasibility100}</Text>
      </View>
      <View style={styles.colClassification}>
        {quadrantLabel && <Badge label={quadrantLabel} variant={QUADRANT_VARIANT[useCase.quadrant as QuadrantKey]} />}
      </View>
    </View>
  )
}

function buildHeadline(t: ReportsTranslator, locale: Locale, data: ExecutiveSummaryData): string {
  const weakDims = data.dimensions.filter(d => d.score100 < REPORT_CRITICAL_THRESHOLD)
  const hasGaps = weakDims.length > 0
  const gapsList = hasGaps
    ? new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(weakDims.map(d => d.label))
    : ''
  const key = `headline${data.archetype[0].toUpperCase()}${data.archetype.slice(1)}${hasGaps ? 'WithGaps' : 'Clean'}` as
    | 'headlineStarterWithGaps' | 'headlineStarterClean'
    | 'headlineScalerWithGaps' | 'headlineScalerClean'
    | 'headlineTransformerWithGaps' | 'headlineTransformerClean'
  return hasGaps ? t(key, { gaps: gapsList }) : t(key)
}

function buildKeyFinding(t: ReportsTranslator, locale: Locale, data: ExecutiveSummaryData): string {
  const sorted = data.dimensions // bereits absteigend sortiert (siehe getExecutiveSummaryData)
  const weakDims = sorted.filter(d => d.score100 < REPORT_CRITICAL_THRESHOLD).slice(-2)
  if (weakDims.length === 0) {
    return t('keyFindingClean', { threshold: REPORT_CRITICAL_THRESHOLD })
  }
  const strongDims = sorted.slice(0, 2)
  const listFmt = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' })
  return t('keyFindingWithGaps', {
    strong: listFmt.format(strongDims.map(d => d.label)),
    strongScores: strongDims.map(d => d.score100).join(' / '),
    weak: listFmt.format(weakDims.map(d => d.label)),
    weakScores: weakDims.map(d => d.score100).join(' / '),
    threshold: REPORT_CRITICAL_THRESHOLD,
  })
}

export function renderMeridianExecutiveSummary(data: ExecutiveSummaryData, locale: Locale) {
  registerMeridianFonts()
  const t = getReportsTranslator(locale)
  const contentWidth = reportPage.width - reportPage.margin * 2

  const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(data.generatedAt))
  const subtitle = [t('subtitleLabel'), data.companyName, monthYear].filter(Boolean).join(' · ')

  const delta = data.previousScore100 !== null ? data.overallScore100 - data.previousScore100 : null
  const deltaLabel = delta !== null ? (delta >= 0 ? `+${delta}` : String(delta)) : ''

  const headline = buildHeadline(t, locale, data)
  const keyFinding = buildKeyFinding(t, locale, data)

  const meterWidth = contentWidth - 90 - 24 - 16

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader refId={`EX·${data.generatedAt.slice(0, 10)}`} documentType={t('documentType')} contentWidth={contentWidth} />

        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.topRow}>
          <View>
            <RingGauge value={data.overallScore100} unitLabel={t('ringUnit')} />
          </View>
          <View style={styles.archetypeCol}>
            <Badge label={`${t('archetypeBadgePrefix')} · ${data.archetype.toUpperCase()}`} variant="primary" />
            {delta !== null && data.previousScore100 !== null && (
              <Text style={styles.previousValue}>{t('previousValue', { score: data.previousScore100, delta: deltaLabel })}</Text>
            )}
            <Text style={styles.headline}>{headline}</Text>
          </View>
        </View>

        <Text style={[styles.sectionEyebrow, { marginTop: SECTION_GAP }]}>{t('dimensionsLabel')}</Text>
        {data.dimensions.map(d => (
          <MeterBar key={d.id} label={d.label} value={d.score100} width={meterWidth} />
        ))}

        <Text style={[styles.sectionEyebrow, { marginTop: SECTION_GAP }]}>{t('keyFindingLabel')}</Text>
        <Text style={styles.keyFindingText}>{keyFinding}</Text>

        <Text style={[styles.sectionEyebrow, { marginTop: SECTION_GAP }]}>{t('topUseCasesLabel')}</Text>
        {data.topUseCases.length === 0 ? (
          <Text style={styles.emptyState}>{t('noUseCases')}</Text>
        ) : (
          <View>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.colUseCase, styles.sectionEyebrow]}>{t('colUseCase')}</Text>
              <Text style={[styles.colBar, styles.sectionEyebrow]}>{t('colValue')}</Text>
              <Text style={[styles.colBar, styles.sectionEyebrow]}>{t('colFeasibility')}</Text>
              <Text style={[styles.colClassification, styles.sectionEyebrow]}>{t('colClassification')}</Text>
            </View>
            {data.topUseCases.map((uc, i) => (
              <UseCaseRow key={`${uc.name}-${i}`} useCase={uc} index={i} t={t} />
            ))}
          </View>
        )}

        <View style={[styles.twoColRow, { marginTop: SECTION_GAP }]}>
          <View style={styles.twoCol}>
            <Text style={styles.sectionEyebrow}>{t('euAiActStatusLabel')}</Text>
            {data.euAiActStatus === null ? (
              <Text style={styles.emptyState}>{t('noEuAiActData')}</Text>
            ) : (
              <View>
                <View style={styles.statRow}>
                  <StatCard eyebrow={t('riskHigh')} value={String(data.euAiActStatus.highCount)} caption={t('useCasesSuffix')} accentColor={reportColors.critical} width={(contentWidth / 2 - 32 - 20) / 3} />
                  <StatCard eyebrow={t('riskLimited')} value={String(data.euAiActStatus.limitedCount)} caption={t('useCasesSuffix')} accentColor={reportColors.warningText} width={(contentWidth / 2 - 32 - 20) / 3} />
                  <StatCard eyebrow={t('riskMinimal')} value={String(data.euAiActStatus.minimalCount)} caption={t('useCasesSuffix')} accentColor={reportColors.successText} width={(contentWidth / 2 - 32 - 20) / 3} />
                </View>
                <View style={styles.gapNoteRow}>
                  <Text style={styles.gapNoteText}>
                    {t('classifiedNote', { classified: data.euAiActStatus.classifiedCount })}
                    {data.euAiActStatus.gapCount > 0 ? t('gapNote', { gap: data.euAiActStatus.gapCount }) : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <View style={styles.twoCol}>
            <Text style={styles.sectionEyebrow}>{t('next90DaysLabel')}</Text>
            {data.next90Days.length === 0 ? (
              <Text style={styles.emptyState}>{t('noNext90Days')}</Text>
            ) : (
              data.next90Days.map((action, i) => (
                <View key={i} style={styles.next90Row}>
                  <Text style={styles.next90Index}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={styles.next90Label}>{action}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <ReportFooter confidentialLabel={t('confidential')} />
      </Page>
    </Document>
  )
}
