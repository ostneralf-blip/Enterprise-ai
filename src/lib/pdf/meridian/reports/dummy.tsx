import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, MeterBar, RingGauge, Badge, StatCard } from '@/lib/pdf/meridian/components'
import { reportColors, reportFonts, reportPage, reportType, reportSpacing } from '@/config/report-tokens'

// Dummy-Seite (Issue #223, Akzeptanzkriterium): demonstriert alle 7
// MERIDIAN-Basiskomponenten auf einer Seite, angelehnt an die Komposition
// von Musterseite 1 — Grundlage für den visuellen Pixelabgleich, kein
// eigenständiger Report-Typ für Endnutzer.

const T = {
  de: {
    docType: 'FUNDAMENT-TEST',
    title: 'MERIDIAN-Fundament',
    subtitle: 'Komponenten-Vorschau · AI Navigator · Interner Test',
    ringUnit: 'VON 100',
    badgeArchetype: 'ARCHETYP · SCALER',
    badgeQuickWin: 'QUICK WIN',
    badgeAi: 'KI-GESTÜTZT',
    dimensionsLabel: 'SECHS DIMENSIONEN',
    statsLabel: 'KENNZAHLEN',
    stat1: { eyebrow: 'INVESTITION J1', value: '240–640 k€', caption: 'Lizenzen · Integration' },
    stat2: { eyebrow: 'RISIKOPROFIL', value: 'DSGVO', caption: 'prüfen — AVV offen' },
    confidential: 'VERTRAULICH',
  },
  en: {
    docType: 'FOUNDATION TEST',
    title: 'MERIDIAN Foundation',
    subtitle: 'Component Preview · AI Navigator · Internal Test',
    ringUnit: 'OF 100',
    badgeArchetype: 'ARCHETYPE · SCALER',
    badgeQuickWin: 'QUICK WIN',
    badgeAi: 'AI-POWERED',
    dimensionsLabel: 'SIX DIMENSIONS',
    statsLabel: 'KEY FIGURES',
    stat1: { eyebrow: 'YEAR-1 INVESTMENT', value: '€240–640k', caption: 'Licenses · Integration' },
    stat2: { eyebrow: 'RISK PROFILE', value: 'GDPR', caption: 'review — DPA pending' },
    confidential: 'CONFIDENTIAL',
  },
} as const

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
  topRow: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  sectionEyebrow: { ...reportType.eyebrow, marginBottom: 10 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
})

const DUMMY_DIMENSIONS: { label: string; value: number }[] = [
  { label: 'Strategie', value: 72 },
  { label: 'Technologie', value: 65 },
  { label: 'Kultur', value: 58 },
  { label: 'Organisation', value: 55 },
  { label: 'Daten', value: 48 },
  { label: 'Governance', value: 41 },
]

export function renderMeridianDummy(locale: 'de' | 'en') {
  registerMeridianFonts()
  const t = T[locale]
  const contentWidth = reportPage.width - reportPage.margin * 2

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ReportHeader refId={`FT·${new Date().toISOString().slice(0, 10)}`} documentType={t.docType} contentWidth={contentWidth} />

        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>

        <View style={styles.topRow}>
          <RingGauge value={62} unitLabel={t.ringUnit} />
          <View style={{ justifyContent: 'center' }}>
            <View style={styles.badgeRow}>
              <Badge label={t.badgeArchetype} variant="primary" />
              <Badge label={t.badgeQuickWin} variant="success" />
              <Badge label={t.badgeAi} variant="ai" />
            </View>
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>{t.dimensionsLabel}</Text>
        {DUMMY_DIMENSIONS.map(d => (
          <MeterBar key={d.label} label={d.label} value={d.value} width={contentWidth - 90 - 24 - 16} />
        ))}

        <Text style={{ ...styles.sectionEyebrow, marginTop: reportSpacing.sectionGap }}>{t.statsLabel}</Text>
        <View style={styles.statRow}>
          <StatCard {...t.stat1} width={(contentWidth - 10) / 2} accentColor={reportColors.primary} />
          <StatCard {...t.stat2} width={(contentWidth - 10) / 2} accentColor={reportColors.warningText} />
        </View>

        <ReportFooter confidentialLabel={t.confidential} />
      </Page>
    </Document>
  )
}
