import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createTranslator } from 'next-intl'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, AiCalloutBlock, Badge, StatCard } from '@/lib/pdf/meridian/components'
import { reportColors, reportFonts, reportPage, reportType } from '@/config/report-tokens'
import type { ArchitectureStatusData } from '@/lib/pdf/meridian/data/architecture-status'
import type { Locale } from '@/i18n/routing'

// Architektur-Report (Musterseite 6, Issue #225) — KI-Einordnung, Investitions-
// rahmen (vier Kennzahl-Karten) und Empfehlung stehen oberhalb der Schlüssel-
// Entscheidungen (explizit von Daniel angefordert, 19.07.2026). Alle drei
// kommen aus derselben KI-Narrativ-Generierung und werden nur gezeigt, wenn
// narrative_locale zur Report-Sprache passt (siehe Kommentar in der
// Datenschicht) — investmentFramework ist eine vom Modell ausdrücklich als
// grobe Schätzung gekennzeichnete Größenordnung, keine belastbare Kalkulation.

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
  subtitle: { ...reportType.subtitle, marginTop: 4, marginBottom: 14 },
  sectionEyebrow: { ...reportType.eyebrow, marginTop: 12, marginBottom: 7 },
  listRow: { flexDirection: 'row', gap: 8, marginBottom: 5, alignItems: 'flex-start' },
  listIndex: { fontFamily: reportFonts.mono, fontSize: 8, fontWeight: 700, color: reportColors.primary, width: 16 },
  listText: { ...reportType.body, flex: 1, fontSize: 8.5 },
  stackLayer: { marginBottom: 7 },
  stackLayerLabel: { ...reportType.eyebrow, marginBottom: 4 },
  stackBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  eamValidationLine: { ...reportType.bodyMuted, fontSize: 7.5, marginTop: 6, marginBottom: 2 },
  emptyState: { ...reportType.bodyMuted, fontStyle: 'italic', fontSize: 8 },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  connNode: { ...reportType.body, fontSize: 8, fontWeight: 700, color: reportColors.ink },
  connVerb: { fontFamily: reportFonts.mono, fontSize: 7, color: reportColors.primary, textTransform: 'uppercase' },
  connVerbConflict: { fontFamily: reportFonts.mono, fontSize: 7, color: reportColors.warningText, textTransform: 'uppercase' },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  estimateNote: { ...reportType.bodyMuted, fontStyle: 'italic', fontSize: 7, marginTop: 5 },
  recommendationText: { ...reportType.body, fontSize: 8.5, lineHeight: 1.45 },
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

        {data.investmentFramework && (
          <>
            <Text style={styles.sectionEyebrow}>{t('investmentLabel')}</Text>
            <View style={styles.statRow}>
              <StatCard
                eyebrow={t('investmentYear1Label')}
                value={data.investmentFramework.year1_estimate}
                caption={data.investmentFramework.year1_caption}
                accentColor={reportColors.primary}
                width={(contentWidth - 30) / 4}
              />
              <StatCard
                eyebrow={t('investmentOngoingLabel')}
                value={data.investmentFramework.ongoing_estimate}
                caption={t('investmentOngoingCaption')}
                accentColor={reportColors.primary}
                width={(contentWidth - 30) / 4}
              />
              <StatCard
                eyebrow={t('investmentTimeframeLabel')}
                value={data.investmentFramework.timeframe_estimate}
                accentColor={reportColors.ai}
                width={(contentWidth - 30) / 4}
              />
              <StatCard
                eyebrow={t('investmentRiskLabel')}
                value={data.investmentFramework.risk_label}
                caption={data.investmentFramework.risk_note}
                accentColor={reportColors.warningText}
                width={(contentWidth - 30) / 4}
              />
            </View>
            <Text style={styles.estimateNote}>{t('investmentEstimateNote')}</Text>
          </>
        )}

        {data.decisionRecommendation && (
          <>
            <Text style={styles.sectionEyebrow}>{t('recommendationLabel')}</Text>
            <Text style={styles.recommendationText}>{data.decisionRecommendation}</Text>
          </>
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

        {data.eam && (data.eam.roleNames.length + data.eam.application.length + data.eam.dataTech.length + data.eam.cross.length > 0) && (
          <>
            <Text style={styles.sectionEyebrow}>{t('eamLabel')}</Text>
            {data.eam.roleNames.length > 0 && (
              <View style={styles.stackLayer}>
                <Text style={styles.stackLayerLabel}>{t('eamRoles')}</Text>
                <View style={styles.stackBadgeRow}>
                  {data.eam.roleNames.map((r, i) => <Badge key={i} label={r} variant="ai" />)}
                </View>
              </View>
            )}
            {data.eam.application.length > 0 && (
              <View style={styles.stackLayer}>
                <Text style={styles.stackLayerLabel}>{t('eamApplication')}</Text>
                <View style={styles.stackBadgeRow}>
                  {data.eam.application.map((c, i) => <Badge key={i} label={c} variant="primary" />)}
                </View>
              </View>
            )}
            {data.eam.dataTech.length > 0 && (
              <View style={styles.stackLayer}>
                <Text style={styles.stackLayerLabel}>{t('eamDataTech')}</Text>
                <View style={styles.stackBadgeRow}>
                  {data.eam.dataTech.map((c, i) => <Badge key={i} label={c} variant="primary" />)}
                </View>
              </View>
            )}
            {data.eam.cross.length > 0 && (
              <View style={styles.stackLayer}>
                <Text style={styles.stackLayerLabel}>{t('eamCross')}</Text>
                <View style={styles.stackBadgeRow}>
                  {data.eam.cross.map((c, i) => <Badge key={i} label={c} variant="primary" />)}
                </View>
              </View>
            )}
            <Text style={styles.eamValidationLine}>
              {t('eamComponentsLine', { rule: data.eam.ruleComps, total: data.eam.total, add: data.eam.addComps })}
              {'  ·  '}
              {data.eam.openViolations === 0
                ? t('eamValidationOk')
                : t('eamValidationFail', { n: data.eam.openViolations })}
            </Text>
          </>
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

        {(data.dependencies.length > 0 || data.conflicts.length > 0) && (
          <>
            <Text style={styles.sectionEyebrow}>{t('connectionsLabel')}</Text>
            {data.dependencies.map((e, i) => (
              <View key={`e${i}`} style={styles.connRow}>
                <Text style={styles.connNode}>{e.from}</Text>
                <Text style={styles.connVerb}>{e.kind === 'requires' ? t('connRequires') : t('connSuggests')} →</Text>
                <Text style={styles.connNode}>{e.to}</Text>
              </View>
            ))}
            {data.conflicts.map((c, i) => (
              <View key={`c${i}`} style={styles.connRow}>
                <Text style={styles.connNode}>{c.a}</Text>
                <Text style={styles.connVerbConflict}>⚠ {t('connConflict')}</Text>
                <Text style={styles.connNode}>{c.b}</Text>
              </View>
            ))}
          </>
        )}

        <ReportFooter confidentialLabel={t('confidential')} />
      </Page>
    </Document>
  )
}
