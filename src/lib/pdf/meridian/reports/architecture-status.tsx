import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createTranslator } from 'next-intl'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, AiCalloutBlock, Badge } from '@/lib/pdf/meridian/components'
import { reportColors, reportFonts, reportPage, reportType } from '@/config/report-tokens'
import type { ArchitectureStatusData } from '@/lib/pdf/meridian/data/architecture-status'
import type { Locale } from '@/i18n/routing'

// Architektur-Report (Musterseite 6, Issue #225) — KI-Einordnung (nur bei
// passendem narrative_locale, siehe Datenschicht), Schlüssel-Entscheidungen,
// Nächste Schritte, Komponenten-Stack nach Layern. Die vier erfundenen
// Kennzahl-Karten der Musterseite (Investition/Laufend/Umsetzung/Risikoprofil)
// entfallen mangels echter Datenquelle (siehe Kommentar in der Datenschicht).

const MESSAGES = { de: deMessages, en: enMessages } as const
type ArchitectureTranslator = ReturnType<typeof createTranslator<typeof deMessages, 'reports.architectureStatus'>>

function getArchitectureTranslator(locale: Locale): ArchitectureTranslator {
  return createTranslator({ locale, messages: MESSAGES[locale], namespace: 'reports.architectureStatus' })
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
  subtitle: { ...reportType.subtitle, marginTop: 4, marginBottom: 18 },
  sectionEyebrow: { ...reportType.eyebrow, marginTop: 16, marginBottom: 8 },
  listRow: { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  listIndex: { fontFamily: reportFonts.mono, fontSize: 8, fontWeight: 700, color: reportColors.primary, width: 16 },
  listText: { ...reportType.body, flex: 1, fontSize: 8.5 },
  stackLayer: { marginBottom: 10 },
  stackLayerLabel: { ...reportType.eyebrow, marginBottom: 5 },
  stackBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  emptyState: { ...reportType.bodyMuted, fontStyle: 'italic', fontSize: 8 },
})

export function renderMeridianArchitectureStatus(data: ArchitectureStatusData, locale: Locale) {
  registerMeridianFonts()
  const t = getArchitectureTranslator(locale)
  const contentWidth = reportPage.width - reportPage.margin * 2

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader refId={`AR·${data.generatedAt.slice(0, 10)}`} documentType={t('documentType')} contentWidth={contentWidth} />

        <Text style={styles.title}>{t('title')}</Text>
        <Text style={styles.subtitle}>{t('subtitle', { pattern: data.pattern })}</Text>

        {data.aiSummary && (
          <AiCalloutBlock
            eyebrowLabel={t('aiCalloutLabel')}
            badges={[t('badgeGenerated'), t('badgeExecutive')]}
            text={data.aiSummary}
            width={contentWidth}
          />
        )}

        <Text style={styles.sectionEyebrow}>{t('keyDecisionsLabel')}</Text>
        {data.keyDecisions.length === 0 ? (
          <Text style={styles.emptyState}>{t('noKeyDecisions')}</Text>
        ) : (
          data.keyDecisions.map((d, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.listIndex}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.listText}>{d}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionEyebrow}>{t('nextStepsLabel')}</Text>
        {data.nextSteps.length === 0 ? (
          <Text style={styles.emptyState}>{t('noNextSteps')}</Text>
        ) : (
          data.nextSteps.map((s, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.listIndex}>{String(i + 1).padStart(2, '0')}</Text>
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))
        )}

        <Text style={styles.sectionEyebrow}>{t('stackLabel')}</Text>
        {data.layers.length === 0 ? (
          <Text style={styles.emptyState}>{t('noStack')}</Text>
        ) : (
          data.layers.map((layer, i) => (
            <View key={i} style={styles.stackLayer}>
              <Text style={styles.stackLayerLabel}>{layer.name.toUpperCase()}</Text>
              <View style={styles.stackBadgeRow}>
                {layer.components.map((c, ci) => (
                  <Badge key={ci} label={c} variant="primary" />
                ))}
              </View>
            </View>
          ))
        )}

        <ReportFooter confidentialLabel={t('confidential')} />
      </Page>
    </Document>
  )
}
