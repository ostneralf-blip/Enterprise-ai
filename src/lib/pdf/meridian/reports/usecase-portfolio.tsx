import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createTranslator } from 'next-intl'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, QuadrantMatrix } from '@/lib/pdf/meridian/components'
import { reportColors, reportFonts, reportPage, reportType } from '@/config/report-tokens'
import { CRITERIA } from '@/config/usecase-data'
import type { UsecasePortfolioData, QuadrantKey } from '@/lib/pdf/meridian/data/usecase-portfolio'
import type { Locale } from '@/i18n/routing'

// Use-Case-Portfolio-Report (Musterseite 3, Issue #225) — Wert×Machbarkeit-
// Matrix mit nummerierten Punkten, Rangliste, Portfolio-Logik-Text und
// Verteilung nach Quadranten. Rangliste ist per Zeilen-Budget gekappt statt
// umzubrechen (Akzeptanzkriterium: keine Überläufe bei 12+ Use-Cases).

const MESSAGES = { de: deMessages, en: enMessages } as const
type PortfolioTranslator = ReturnType<typeof createTranslator<typeof deMessages, 'reports.usecasePortfolio'>>

function getPortfolioTranslator(locale: Locale): PortfolioTranslator {
  return createTranslator({ locale, messages: MESSAGES[locale], namespace: 'reports.usecasePortfolio' })
}

const MAX_RANK_ROWS = 12

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
  topRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  rankCol: { flex: 1 },
  sectionEyebrow: { ...reportType.eyebrow, marginBottom: 8 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rankIndex: { fontFamily: reportFonts.mono, fontSize: 8, fontWeight: 700, width: 16, color: reportColors.primary },
  rankIndexMuted: { fontFamily: reportFonts.mono, fontSize: 8, width: 16, color: reportColors.inkSubtle },
  rankName: { ...reportType.body, fontSize: 8.5 },
  rankNameTop: { fontFamily: reportFonts.sans, fontWeight: 700, fontSize: 8.5, color: reportColors.ink },
  rankMore: { ...reportType.bodyMuted, fontSize: 7.5, marginTop: 2 },
  logicText: { ...reportType.body, lineHeight: 1.55, marginBottom: 16 },
  bottomRow: { flexDirection: 'row', gap: 32 },
  bottomCol: { flex: 1 },
  bottomColLabel: { ...reportType.eyebrowPrimary, marginBottom: 6 },
  bottomColText: { ...reportType.body, fontSize: 8, lineHeight: 1.5 },
  distRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  distLabel: { ...reportType.body, fontSize: 8 },
  distValue: { fontFamily: reportFonts.mono, fontSize: 8, fontWeight: 700, color: reportColors.primary },
})

const QUADRANT_LABEL_KEY: Record<QuadrantKey, 'quadrantQuickWin' | 'quadrantStrategicBet' | 'quadrantLowHangingFruit' | 'quadrantAvoid'> = {
  quick_win: 'quadrantQuickWin',
  strategic_bet: 'quadrantStrategicBet',
  low_hanging_fruit: 'quadrantLowHangingFruit',
  avoid: 'quadrantAvoid',
}

export function renderMeridianUsecasePortfolio(data: UsecasePortfolioData, locale: Locale) {
  registerMeridianFonts()
  const t = getPortfolioTranslator(locale)
  const contentWidth = reportPage.width - reportPage.margin * 2

  const total = data.useCases.length
  const visibleRanks = data.useCases.slice(0, MAX_RANK_ROWS)
  const hiddenCount = total - visibleRanks.length

  const quickWinCount = data.distribution.quick_win
  const logicText = quickWinCount > 0
    ? t('logicWithQuickWins', { count: quickWinCount })
    : t('logicNoQuickWins')

  const valueCriterion = CRITERIA.find(c => c.id === 'value')
  const feasibilityCriterion = CRITERIA.find(c => c.id === 'feasibility')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader refId={`UC·${data.generatedAt.slice(0, 10)}`} documentType={t('documentType')} contentWidth={contentWidth} />

        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{t('subtitle', { count: total })}</Text>

        <View style={styles.topRow}>
          <QuadrantMatrix
            size={260}
            points={data.useCases.map(uc => ({ rank: uc.rank, x: uc.feasibility100, y: uc.value100, filled: uc.rank <= 3 }))}
            quadrantLabels={{
              topLeft: t('quadrantStrategicBet'),
              topRight: t('quadrantQuickWin'),
              bottomLeft: t('quadrantAvoid'),
              bottomRight: t('quadrantLowHangingFruit'),
            }}
          />
          <View style={styles.rankCol}>
            <Text style={styles.sectionEyebrow}>{t('rankLabel')}</Text>
            {visibleRanks.map(uc => (
              <View key={uc.rank} style={styles.rankRow}>
                <Text style={uc.rank <= 3 ? styles.rankIndex : styles.rankIndexMuted}>{String(uc.rank).padStart(2, '0')}</Text>
                <Text style={uc.rank <= 3 ? styles.rankNameTop : styles.rankName}>{uc.name}</Text>
              </View>
            ))}
            {hiddenCount > 0 && <Text style={styles.rankMore}>{t('moreUseCases', { count: hiddenCount })}</Text>}
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>{t('logicLabel')}</Text>
        <Text style={styles.logicText}>{logicText}</Text>

        <View style={styles.bottomRow}>
          <View style={styles.bottomCol}>
            <Text style={styles.bottomColLabel}>{t('valueLabel')}</Text>
            <Text style={styles.bottomColText}>{valueCriterion?.description[locale] ?? ''}</Text>
          </View>
          <View style={styles.bottomCol}>
            <Text style={styles.bottomColLabel}>{t('feasibilityLabel')}</Text>
            <Text style={styles.bottomColText}>{feasibilityCriterion?.description[locale] ?? ''}</Text>
          </View>
          <View style={styles.bottomCol}>
            <Text style={styles.bottomColLabel}>{t('distributionLabel')}</Text>
            {(Object.keys(data.distribution) as QuadrantKey[]).map(key => (
              <View key={key} style={styles.distRow}>
                <Text style={styles.distLabel}>{t(QUADRANT_LABEL_KEY[key])}</Text>
                <Text style={styles.distValue}>{data.distribution[key]}</Text>
              </View>
            ))}
          </View>
        </View>

        <ReportFooter confidentialLabel={t('confidential')} />
      </Page>
    </Document>
  )
}
