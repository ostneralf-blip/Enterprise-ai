import { View, Text, StyleSheet, Svg, Path, Circle } from '@react-pdf/renderer'
import { reportColors, reportFonts, reportType, REPORT_CRITICAL_THRESHOLD } from '@/config/report-tokens'

// MERIDIAN-Basiskomponenten (Issue #223) — react-pdf-Pendants zu den 7 in der
// Design-Philosophie beschriebenen Bausteinen. Jede Komponente hält sich an
// die "stille Vermessung": Haarlinien statt Flächen, Messstriche statt
// Dekoration, Farbe nur als Signal (primary = Standard, critical = Wert < 50).

const semanticColor = (value: number) => (value < REPORT_CRITICAL_THRESHOLD ? reportColors.critical : reportColors.primary)

// ─────────────────────────────────────────────────────────────────────────
// TickRuler — horizontale Messleiste mit gleichmäßigen Strichen. Dient sowohl
// als dekorative Haarlinie unter dem ReportHeader als auch (in späteren
// Phasen) als Basis für Zeitachsen/Timelines.
// ─────────────────────────────────────────────────────────────────────────
interface TickRulerProps {
  width: number
  tickCount?: number
  color?: string
  height?: number
}
export function TickRuler({ width, tickCount = 32, color = reportColors.line, height = 5 }: TickRulerProps) {
  const gap = width / (tickCount - 1)
  return (
    <Svg width={width} height={height}>
      <Path d={`M0,0 L${width},0`} stroke={color} strokeWidth={0.75} />
      {Array.from({ length: tickCount }).map((_, i) => (
        <Path key={i} d={`M${i * gap},0 L${i * gap},${height}`} stroke={color} strokeWidth={0.75} />
      ))}
    </Svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// ReportHeader — Mono-Eyebrow »AI NAVIGATOR«, REF-ID rechts, Haarlinie +
// Tick-Leiste, Dokumenttyp-Zeile (Musterseiten 1-6, immer identisch aufgebaut).
// ─────────────────────────────────────────────────────────────────────────
const headerStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  brand: { fontFamily: reportFonts.mono, fontSize: 8, letterSpacing: 1.6, color: reportColors.primary },
  ref: { fontFamily: reportFonts.mono, fontSize: 7.5, letterSpacing: 0.5, color: reportColors.inkSubtle },
  docType: { ...reportType.eyebrow, marginTop: 6 },
})
interface ReportHeaderProps {
  refId: string // z. B. "EX·2026-07-18"
  documentType: string // z. B. "MANAGEMENT-REPORT"
  contentWidth: number
}
export function ReportHeader({ refId, documentType, contentWidth }: ReportHeaderProps) {
  return (
    <View>
      <View style={headerStyles.row}>
        <Text style={headerStyles.brand}>AI NAVIGATOR</Text>
        <Text style={headerStyles.ref}>REF {refId}</Text>
      </View>
      <TickRuler width={contentWidth} />
      <Text style={headerStyles.docType}>{documentType}</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// ReportFooter — VERTRAULICH/CONFIDENTIAL · enterprise-ai.biz · Seitenzahl,
// über eine Haarlinie vom Inhalt abgesetzt. Fixiert am unteren Seitenrand.
// ─────────────────────────────────────────────────────────────────────────
const footerStyles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 30, left: 54, right: 54 },
  line: { borderTopWidth: 0.75, borderTopColor: reportColors.line, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  text: { fontFamily: reportFonts.mono, fontSize: 6.5, letterSpacing: 1, color: reportColors.inkSubtle },
})
interface ReportFooterProps {
  confidentialLabel: string // "VERTRAULICH" | "CONFIDENTIAL"
}
export function ReportFooter({ confidentialLabel }: ReportFooterProps) {
  return (
    <View style={footerStyles.wrap} fixed>
      <View style={footerStyles.line} />
      <View style={footerStyles.row}>
        <Text style={footerStyles.text}>{confidentialLabel}</Text>
        <Text style={footerStyles.text}>ENTERPRISE-AI.BIZ</Text>
        {/* render() liefert echte Seitenzahlen über alle Seiten des Dokuments —
            robuster als eine manuell durchgereichte page/pageCount-Prop, sobald
            ein Report (z. B. Roadmap, Architektur) mehr als eine Seite hat. */}
        <Text
          style={footerStyles.text}
          render={({ pageNumber, totalPages }) => `${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`}
        />
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// MeterBar — Balken mit Messstrichen, semantische Färbung (primary/critical).
// ─────────────────────────────────────────────────────────────────────────
const meterStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  label: { ...reportType.body, width: 90 },
  trackWrap: { flex: 1, marginHorizontal: 8 },
  value: { fontFamily: reportFonts.mono, fontSize: 9, fontWeight: 700, width: 24, textAlign: 'right' },
})
interface MeterBarProps {
  label: string
  value: number // 0-100
  max?: number
  width: number // Track-Breite in pt
  tickCount?: number
}
export function MeterBar({ label, value, max = 100, width, tickCount = 20 }: MeterBarProps) {
  const color = semanticColor(value)
  const fillWidth = Math.max(0, Math.min(1, value / max)) * width
  const trackHeight = 5
  return (
    <View style={meterStyles.row}>
      <Text style={meterStyles.label}>{label}</Text>
      <View style={meterStyles.trackWrap}>
        <Svg width={width} height={trackHeight}>
          <Path d={`M0,${trackHeight / 2} L${width},${trackHeight / 2}`} stroke={reportColors.lineSubtle} strokeWidth={trackHeight} />
          <Path d={`M0,${trackHeight / 2} L${fillWidth},${trackHeight / 2}`} stroke={color} strokeWidth={trackHeight} />
          {Array.from({ length: tickCount + 1 }).map((_, i) => (
            <Path key={i} d={`M${(i * width) / tickCount},0 L${(i * width) / tickCount},${trackHeight}`} stroke={reportColors.ivory} strokeWidth={0.5} />
          ))}
        </Svg>
      </View>
      <Text style={[meterStyles.value, { color }]}>{value}</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// RingGauge — Score-Ring mit großer zentrierter Ziffer + "VON N"-Unterzeile.
// ─────────────────────────────────────────────────────────────────────────
interface RingGaugeProps {
  value: number
  max?: number
  size?: number
  unitLabel: string // "VON 100" | "OF 100"
}
export function RingGauge({ value, max = 100, size = 108, unitLabel }: RingGaugeProps) {
  const strokeWidth = 9
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fraction = Math.max(0, Math.min(1, value / max))
  const color = semanticColor(value)
  const center = size / 2
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={center} cy={center} r={radius} stroke={reportColors.lineSubtle} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center} cy={center} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference * fraction} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
      <Text style={{ fontFamily: reportFonts.serif, fontWeight: 700, fontSize: 30, color: reportColors.ink }}>{value}</Text>
      <Text style={{ fontFamily: reportFonts.mono, fontSize: 6, letterSpacing: 1, color: reportColors.inkSubtle, marginTop: 1 }}>{unitLabel}</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Badge — Pill, z. B. "ARCHETYP · SCALER", "QUICK WIN", "KI-GESTÜTZT".
// ─────────────────────────────────────────────────────────────────────────
type BadgeVariant = 'primary' | 'success' | 'warning' | 'critical' | 'ai'
const badgeVariantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  primary:  { bg: reportColors.primarySoft, text: reportColors.primary },
  success:  { bg: reportColors.successSubtle, text: reportColors.successText },
  warning:  { bg: reportColors.warningSubtle, text: reportColors.warningText },
  critical: { bg: reportColors.criticalSubtle, text: reportColors.critical },
  ai:       { bg: reportColors.aiSoft, text: reportColors.ai },
}
interface BadgeProps {
  label: string
  variant?: BadgeVariant
}
export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const { bg, text } = badgeVariantColors[variant]
  return (
    <View style={{ backgroundColor: bg, borderRadius: 9, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: reportFonts.mono, fontSize: 6.5, letterSpacing: 0.8, color: text }}>{label}</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// StatCard — Kennzahl-Karte mit farbigem Akzentbalken links.
// ─────────────────────────────────────────────────────────────────────────
interface StatCardProps {
  eyebrow: string
  value: string
  caption?: string
  accentColor?: string
  width: number
}
export function StatCard({ eyebrow, value, caption, accentColor = reportColors.primary, width }: StatCardProps) {
  return (
    <View style={{ width, flexDirection: 'row', borderWidth: 0.75, borderColor: reportColors.line, borderRadius: 3 }}>
      <View style={{ width: 2.5, backgroundColor: accentColor }} />
      <View style={{ padding: 8, flex: 1 }}>
        <Text style={{ ...reportType.eyebrow, marginBottom: 4 }}>{eyebrow}</Text>
        <Text style={{ fontFamily: reportFonts.serif, fontSize: 15, fontWeight: 700, color: reportColors.ink }}>{value}</Text>
        {caption && <Text style={{ ...reportType.bodyMuted, fontSize: 7, marginTop: 2 }}>{caption}</Text>}
      </View>
    </View>
  )
}
