import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createTranslator } from 'next-intl'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, HorizonCard, MeterBar } from '@/lib/pdf/meridian/components'
import { reportColors, reportFonts, reportPage, reportType } from '@/config/report-tokens'
import { ARCHETYPE_LABELS } from '@/config/roadmap-data'
import type { RoadmapStatusData } from '@/lib/pdf/meridian/data/roadmap-status'
import type { Archetype } from '@/types'
import type { Locale } from '@/i18n/routing'

// Roadmap-Report (Musterseite 5, Issue #225) — drei Horizont-Karten +
// Steuerungsprinzip (generischer Methodik-Text, keine Nutzerdaten) +
// Reifegrad-Entwicklung (echter Ist-vs-Vorher-Score statt erfundener
// Zukunftsprojektion, siehe Kommentar in der Datenschicht).

const MESSAGES = { de: deMessages, en: enMessages } as const
type RoadmapTranslator = ReturnType<typeof createTranslator<typeof deMessages, 'reports.roadmapStatus'>>

function getRoadmapTranslator(locale: Locale): RoadmapTranslator {
  return createTranslator({ locale, messages: MESSAGES[locale], namespace: 'reports.roadmapStatus' })
}

const HORIZON_ACCENT = [reportColors.primary, reportColors.ai, reportColors.successText]

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
  horizonRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
  bottomRow: { flexDirection: 'row', gap: 32, paddingTop: 12, borderTopWidth: 0.75, borderTopColor: reportColors.line },
  bottomCol: { flex: 1 },
  sectionEyebrow: { ...reportType.eyebrow, marginBottom: 8 },
  principleText: { ...reportType.body, fontSize: 8, lineHeight: 1.5 },
  scoreDelta: { ...reportType.bodyMuted, fontSize: 7.5, marginTop: 4 },
  emptyState: { ...reportType.bodyMuted, fontStyle: 'italic', fontSize: 8 },
})

export function renderMeridianRoadmapStatus(data: RoadmapStatusData, locale: Locale) {
  registerMeridianFonts()
  const t = getRoadmapTranslator(locale)
  const contentWidth = reportPage.width - reportPage.margin * 2
  const cardWidth = (contentWidth - 14 * 2) / 3

  const archetypeLabel = data.archetype ? ARCHETYPE_LABELS[data.archetype as Archetype]?.label[locale] : null
  const subtitle = archetypeLabel ? t('subtitleWithArchetype', { archetype: archetypeLabel }) : t('subtitle')

  const delta = data.currentScore100 !== null && data.previousScore100 !== null
    ? data.currentScore100 - data.previousScore100
    : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader refId={`RM·${data.generatedAt.slice(0, 10)}`} documentType={t('documentType')} contentWidth={contentWidth} />

        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.horizonRow}>
          {data.horizons.map((h, i) => (
            <HorizonCard
              key={i}
              eyebrowLabel={h.eyebrowLabel}
              durationLabel={h.durationLabel}
              title={h.title}
              accentColor={HORIZON_ACCENT[i % HORIZON_ACCENT.length]}
              items={h.items}
              width={cardWidth}
            />
          ))}
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.bottomCol}>
            <Text style={styles.sectionEyebrow}>{t('principleLabel')}</Text>
            <Text style={styles.principleText}>{t('principleText')}</Text>
          </View>
          <View style={styles.bottomCol}>
            <Text style={styles.sectionEyebrow}>{t('scoreLabel')}</Text>
            {data.currentScore100 !== null ? (
              <>
                <MeterBar label={t('scoreBarLabel')} value={data.currentScore100} width={contentWidth / 2 - 90 - 24 - 16} />
                {delta !== null && data.previousScore100 !== null && (
                  <Text style={styles.scoreDelta}>
                    {t('scoreDeltaNote', { score: data.previousScore100, delta: delta >= 0 ? `+${delta}` : String(delta) })}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.emptyState}>{t('noScore')}</Text>
            )}
          </View>
        </View>

        <ReportFooter confidentialLabel={t('confidential')} />
      </Page>
    </Document>
  )
}
