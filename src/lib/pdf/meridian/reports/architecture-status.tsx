import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { createTranslator } from 'next-intl'
import deMessages from '../../../../../messages/de.json'
import enMessages from '../../../../../messages/en.json'
import { registerMeridianFonts } from '@/lib/pdf/meridian/fonts'
import { ReportHeader, ReportFooter, AiCalloutBlock, AiSectionEyebrow, AiDisclosureNote, Badge, StatCard } from '@/lib/pdf/meridian/components'
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
  // EAM-Landkarte im Band-Layout (umrandete Bänder mit Label-Spalte links — wie
  // die Bildschirm-Landkarte), damit es als Architektur erkennbar ist.
  eamBand: { flexDirection: 'row', gap: 6, marginBottom: 5, borderWidth: 1, borderColor: reportColors.line, borderRadius: 6, padding: 6, backgroundColor: reportColors.white },
  eamBandDashed: { borderStyle: 'dashed', borderColor: reportColors.lineStrong, backgroundColor: reportColors.ivory },
  eamBandLabel: { width: 82, fontFamily: reportFonts.sans, fontSize: 6.5, fontWeight: 700, color: reportColors.inkMuted, textTransform: 'uppercase', paddingTop: 2 },
  eamBandChips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  motivNode: { backgroundColor: reportColors.primarySoft, borderWidth: 1, borderColor: reportColors.primaryBorder, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 },
  motivNodeLabel: { fontFamily: reportFonts.sans, fontSize: 8, fontWeight: 700, color: reportColors.ink },
  motivNodeSub: { fontFamily: reportFonts.mono, fontSize: 5.5, fontWeight: 700, color: reportColors.warningText, textTransform: 'uppercase', marginTop: 1 },
  roleChip: { backgroundColor: reportColors.lineSubtle, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 7 },
  roleChipText: { fontFamily: reportFonts.sans, fontSize: 7, color: reportColors.inkSecondary },
  eamValidationLine: { ...reportType.bodyMuted, fontSize: 7.5, marginTop: 6, marginBottom: 2 },
  // Geschäftsfähigkeiten & Reifegrad (#259)
  capGroup: { borderWidth: 1, borderColor: reportColors.line, borderRadius: 6, padding: 6, marginBottom: 5, backgroundColor: reportColors.white },
  capDomain: { fontFamily: reportFonts.sans, fontSize: 6.5, fontWeight: 700, color: reportColors.inkSecondary, textTransform: 'uppercase', marginBottom: 4 },
  capTilesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  capTile: { borderWidth: 1, borderColor: reportColors.line, borderRadius: 5, paddingVertical: 3, paddingHorizontal: 6, backgroundColor: reportColors.ivory, minWidth: 108 },
  capTileName: { fontFamily: reportFonts.sans, fontSize: 7.5, fontWeight: 700, color: reportColors.ink, marginBottom: 3 },
  capPipsRow: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  pip: { width: 5, height: 5, borderRadius: 1 },
  capLegend: { ...reportType.bodyMuted, fontSize: 7, marginTop: 2 },
  emptyState: { ...reportType.bodyMuted, fontStyle: 'italic', fontSize: 8 },
  connRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  connNode: { ...reportType.body, fontSize: 8, fontWeight: 700, color: reportColors.ink },
  connVerb: { fontFamily: reportFonts.mono, fontSize: 7, color: reportColors.primary, textTransform: 'uppercase' },
  connVerbConflict: { fontFamily: reportFonts.mono, fontSize: 7, color: reportColors.warningText, textTransform: 'uppercase' },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  estimateNote: { ...reportType.bodyMuted, fontStyle: 'italic', fontSize: 7, marginTop: 5 },
  recommendationText: { ...reportType.body, fontSize: 8.5, lineHeight: 1.45 },
})

// Ein EAM-Band: Label-Spalte links, Chips rechts (Bildschirm-Landkarte nachgebaut).
function EamBand({ label, dashed, children }: { label: string; dashed?: boolean; children: React.ReactNode }) {
  return (
    <View style={dashed ? [styles.eamBand, styles.eamBandDashed] : styles.eamBand} wrap={false}>
      <Text style={styles.eamBandLabel}>{label}</Text>
      <View style={styles.eamBandChips}>{children}</View>
    </View>
  )
}

function RoleChip({ name }: { name: string }) {
  return (
    <View style={styles.roleChip}>
      <Text style={styles.roleChipText}>{name}</Text>
    </View>
  )
}

// Reifegrad-Pips analog MaturityPips (4 Kästchen, Füllzahl = level; Primary nur bei 4).
function PdfMaturityPips({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <View style={styles.capPipsRow}>
      {[1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={[
            styles.pip,
            { backgroundColor: i > level ? reportColors.line : level === 4 ? reportColors.primary : reportColors.inkSecondary },
          ]}
        />
      ))}
    </View>
  )
}

export function renderMeridianArchitectureStatus(data: ArchitectureStatusData, locale: Locale) {
  registerMeridianFonts()
  const t = getArchitectureTranslator(locale)
  const contentWidth = reportPage.width - reportPage.margin * 2

  // Motivation-Band der EAM-Landkarte (Compliance-Treiber + Business-Treiber).
  const eam = data.eam
  const motiv: { label: string; sub?: string }[] = []
  if (eam) {
    if (eam.compliance === 'strict' || eam.compliance === 'moderate') {
      motiv.push({ label: 'EU AI Act', sub: eam.compliance === 'strict' ? t('eamRiskHigh') : t('eamRiskLimited') })
      motiv.push({ label: 'DSGVO', sub: t('eamEuHosting') })
    }
    motiv.push({ label: t('eamBizGoal') })
  }

  // Führt dieser Report überhaupt KI-generierte Inhalte? Steuert Fußnote und
  // Dokument-Metadaten — ein rein regelbasierter Report darf NICHT als
  // KI-generiert markiert werden (falsche Kennzeichnung entwertet die echten).
  const hasAiContent = Boolean(data.aiSummary || data.decisionRecommendation || data.investmentFramework)

  return (
    <Document
      title={t('title')}
      author="AI Navigator"
      creator="AI Navigator (enterprise-ai.biz)"
      producer="AI Navigator (enterprise-ai.biz)"
      subject={t('documentType')}
      // Maschinenlesbare Kennzeichnung nach Art. 50 Abs. 2 EU AI Act. Für Text
      // schreibt der Code of Practice (10.06.2026) keine Wasserzeichentechnik vor —
      // die Dokument-Metadaten sind der etablierte Weg, ein PDF als teilweise
      // KI-generiert auszuweisen. Schonfrist für Bestandssysteme: 02.12.2026.
      keywords={
        hasAiContent
          ? 'ai-generated-content=partial; generator=AI Navigator; eu-ai-act-article=50'
          : 'ai-generated-content=none; generator=AI Navigator'
      }
    >
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
            {/* Kennzeichnungspflicht Art. 50 EU AI Act: Die Schätzwerte stammen aus
                derselben KI-Generierung wie die Einordnung oben und müssen als solche
                erkennbar sein — bisher wies nur die Fußnote darunter darauf hin. */}
            <AiSectionEyebrow label={t('investmentLabel')} badgeLabel={t('badgeGenerated')} />
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
            {/* Ebenfalls KI-generiert (ai_narrative.exec.decision_recommendation) und
                bis 02.08.2026 ohne jeden Hinweis im PDF — die auffälligste Lücke,
                weil eine Handlungsempfehlung als redaktionelle Aussage gelesen wird. */}
            <AiSectionEyebrow label={t('recommendationLabel')} badgeLabel={t('badgeGenerated')} />
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

        {eam && (eam.roleNames.length + eam.application.length + eam.dataTech.length + eam.cross.length > 0) && (
          <>
            <Text style={styles.sectionEyebrow}>{t('eamLabel')}</Text>
            <EamBand label={t('eamMotivation')} dashed>
              {motiv.map((n, i) => (
                <View key={i} style={styles.motivNode}>
                  {/* Bewusst ohne Symbol: Die Bildschirm-Landkarte (EamMap.tsx) setzt hier
                      je Knotentyp ein eigenes Zeichen (Waage, Schild, Zielscheibe) — keines
                      davon existiert in Work Sans, Lora oder IBM Plex Mono. U+25CE wurde
                      im PDF bis 02.08.2026 als lateinisches I mit Zirkumflex ausgegeben.
                      Siehe UNSUPPORTED_PDF_GLYPHS in fonts.ts. */}
                  <Text style={styles.motivNodeLabel}>{n.label}</Text>
                  {n.sub && <Text style={styles.motivNodeSub}>{n.sub}</Text>}
                </View>
              ))}
            </EamBand>
            {eam.roleNames.length > 0 && (
              <EamBand label={t('eamBusiness')}>
                {eam.roleNames.map((r, i) => <RoleChip key={i} name={r} />)}
              </EamBand>
            )}
            {eam.application.length > 0 && (
              <EamBand label={t('eamApplication')}>
                {eam.application.map((c, i) => <Badge key={i} label={c} variant="primary" />)}
              </EamBand>
            )}
            {eam.dataTech.length > 0 && (
              <EamBand label={t('eamDataTech')}>
                {eam.dataTech.map((c, i) => <Badge key={i} label={c} variant="primary" />)}
              </EamBand>
            )}
            {eam.cross.length > 0 && (
              <EamBand label={t('eamCross')} dashed>
                {eam.cross.map((c, i) => <Badge key={i} label={c} variant="primary" />)}
              </EamBand>
            )}
            <Text style={styles.eamValidationLine}>
              {t('eamComponentsLine', { rule: eam.ruleComps, total: eam.total, add: eam.addComps })}
              {'  ·  '}
              {eam.openViolations === 0
                ? t('eamValidationOk')
                : t('eamValidationFail', { n: eam.openViolations })}
            </Text>
          </>
        )}

        {data.capabilities.length > 0 && (
          <>
            <Text style={styles.sectionEyebrow}>{t('capabilityLabel')}</Text>
            {data.capabilities.map((g, gi) => (
              <View key={gi} style={styles.capGroup} wrap={false}>
                <Text style={styles.capDomain}>{g.domain}  ·  {g.tiles.length}</Text>
                <View style={styles.capTilesRow}>
                  {g.tiles.map((tile, ti) => (
                    <View key={ti} style={styles.capTile}>
                      <Text style={styles.capTileName}>{tile.name}</Text>
                      <PdfMaturityPips level={tile.level} />
                    </View>
                  ))}
                </View>
              </View>
            ))}
            <Text style={styles.capLegend}>{t('capabilityLegend')}</Text>
          </>
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
                {/* U+26A0 (Warndreieck) fehlt in allen drei registrierten Fonts und wurde
                    als Leerraum gerendert. Die Warnfarbe plus Versalien trägt die Bedeutung. */}
                <Text style={styles.connVerbConflict}>{t('connConflict')}</Text>
                <Text style={styles.connNode}>{c.b}</Text>
              </View>
            ))}
          </>
        )}

        {/* Einmalige Offenlegung, wenn der Report überhaupt KI-Inhalte führt.
            Art. 50 Abs. 5 verlangt eine klare, unterscheidbare Information —
            die Badges allein benennen nicht, was sie bedeuten. */}
        {hasAiContent && <AiDisclosureNote text={t('aiDisclosureNote')} width={contentWidth} />}

        <ReportFooter confidentialLabel={t('confidential')} />
      </Page>
    </Document>
  )
}
