import { View, Text, StyleSheet, Svg, Path, Circle, Polygon, Line } from '@react-pdf/renderer'
import { reportColors, reportFonts, reportType, REPORT_CRITICAL_THRESHOLD } from '@/config/report-tokens'

// MERIDIAN-Basiskomponenten (Issue #223) — react-pdf-Pendants zu den 7 in der
// Design-Philosophie beschriebenen Bausteinen. Jede Komponente hält sich an
// die "stille Vermessung": Haarlinien statt Flächen, Messstriche statt
// Dekoration, Farbe nur als Signal (primary = Standard, critical = Wert < 50).

// Exportiert (nicht nur intern genutzt), da z. B. der Executive-Summary-
// Report (#224) eigene, schmalere Balken für die Top-Use-Cases-Tabelle
// braucht, aber dieselbe Schwellenlogik verwenden soll wie MeterBar/RingGauge.
export const semanticColor = (value: number) => (value < REPORT_CRITICAL_THRESHOLD ? reportColors.critical : reportColors.primary)

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
  label: { ...reportType.body },
  trackWrap: { flex: 1, marginHorizontal: 8 },
  value: { fontFamily: reportFonts.mono, fontSize: 9, fontWeight: 700, width: 24, textAlign: 'right' },
})
interface MeterBarProps {
  label: string
  value: number // 0-100
  max?: number
  width: number // Track-Breite in pt
  tickCount?: number
  labelWidth?: number // Standard 90; z. B. der Compliance-Report braucht mehr für "DSGVO 9/12"
}
export function MeterBar({ label, value, max = 100, width, tickCount = 20, labelWidth = 90 }: MeterBarProps) {
  const color = semanticColor(value)
  const fillWidth = Math.max(0, Math.min(1, value / max)) * width
  const trackHeight = 5
  return (
    <View style={meterStyles.row}>
      <Text style={[meterStyles.label, { width: labelWidth }]}>{label}</Text>
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

// ─────────────────────────────────────────────────────────────────────────
// RadarChart — Hexagon-Netz mit gefülltem Datenpolygon (Musterseite 2,
// Readiness-Report, #225). Labels werden NICHT innerhalb des Svg platziert
// (react-pdf/fontkit rendert Text-in-Svg nicht zuverlässig für beliebige
// Positionen), sondern als absolut positionierte Text-Geschwister außerhalb
// des Svg, per selber Trigonometrie wie die Datenpunkte berechnet.
// ─────────────────────────────────────────────────────────────────────────
interface RadarChartProps {
  dimensions: Array<{ label: string; value: number }> // 0-100, beliebige Achsenzahl ≥ 3
  size?: number
}
export function RadarChart({ dimensions, size = 220 }: RadarChartProps) {
  const n = dimensions.length
  const center = size / 2
  const maxRadius = size / 2 - 34
  const angleFor = (i: number) => (-90 + (360 / n) * i) * (Math.PI / 180)
  const pointFor = (i: number, fraction: number): [number, number] => {
    const angle = angleFor(i)
    return [center + Math.cos(angle) * maxRadius * fraction, center + Math.sin(angle) * maxRadius * fraction]
  }
  const gridLevels = [0.25, 0.5, 0.75, 1]
  const dataPoints = dimensions.map((d, i) => pointFor(i, Math.max(0, Math.min(1, d.value / 100))))

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size}>
        {gridLevels.map((level, gi) => (
          <Polygon
            key={gi}
            points={dimensions.map((_, i) => pointFor(i, level).join(',')).join(' ')}
            stroke={reportColors.line}
            strokeWidth={0.5}
            fill="none"
          />
        ))}
        {dimensions.map((_, i) => {
          const [x, y] = pointFor(i, 1)
          return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke={reportColors.line} strokeWidth={0.5} />
        })}
        <Polygon
          points={dataPoints.map(p => p.join(',')).join(' ')}
          stroke={reportColors.primary}
          strokeWidth={1.5}
          fill={reportColors.primary}
          fillOpacity={0.18}
        />
        {dataPoints.map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={2.5} fill={reportColors.primary} />
        ))}
      </Svg>
      {dimensions.map((d, i) => {
        const [x, y] = pointFor(i, 1.22)
        const cos = Math.cos(angleFor(i))
        const align = cos > 0.3 ? 'left' : cos < -0.3 ? 'right' : 'center'
        return (
          <Text
            key={i}
            style={{
              position: 'absolute', left: x - 32, top: y - 4, width: 64,
              textAlign: align, fontFamily: reportFonts.sans, fontSize: 7.5, color: reportColors.inkSecondary,
            }}
          >
            {d.label}
          </Text>
        )
      })}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// QuadrantMatrix — Wert×Machbarkeit-Streudiagramm mit vier Quadranten-Labels
// und nummerierten Punkten (Musterseite 3, Use-Case-Portfolio, #225).
// ─────────────────────────────────────────────────────────────────────────
interface QuadrantPoint {
  rank: number
  x: number // 0-100, Machbarkeit
  y: number // 0-100, Geschäftswert
  filled?: boolean
}
interface QuadrantMatrixProps {
  points: QuadrantPoint[]
  size: number
  quadrantLabels: { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string }
}
export function QuadrantMatrix({ points, size, quadrantLabels }: QuadrantMatrixProps) {
  const toPx = (v: number) => Math.max(0, Math.min(1, v / 100)) * size
  return (
    <View style={{ width: size, height: size, position: 'relative', borderWidth: 0.75, borderColor: reportColors.line }}>
      <Svg width={size} height={size}>
        <Line x1={size / 2} y1={0} x2={size / 2} y2={size} stroke={reportColors.line} strokeWidth={0.75} />
        <Line x1={0} y1={size / 2} x2={size} y2={size / 2} stroke={reportColors.line} strokeWidth={0.75} />
        {points.map(p => {
          const cx = toPx(p.x)
          const cy = size - toPx(p.y)
          return (
            <Circle
              key={p.rank}
              cx={cx} cy={cy} r={p.filled ? 8 : 6}
              fill={p.filled ? reportColors.primary : reportColors.ivory}
              stroke={p.filled ? reportColors.primary : reportColors.lineStrong}
              strokeWidth={0.75}
            />
          )
        })}
      </Svg>
      {points.map(p => {
        const cx = toPx(p.x)
        const cy = size - toPx(p.y)
        return (
          <Text
            key={p.rank}
            style={{
              position: 'absolute', left: cx - 9, top: cy - 4.5, width: 18, textAlign: 'center',
              fontFamily: reportFonts.mono, fontSize: p.filled ? 7 : 5.5, fontWeight: 700,
              color: p.filled ? reportColors.white : reportColors.inkMuted,
            }}
          >
            {p.rank}
          </Text>
        )
      })}
      <Text style={{ position: 'absolute', top: 8, left: 8, ...reportType.eyebrow }}>{quadrantLabels.topLeft}</Text>
      <Text style={{ position: 'absolute', top: 8, right: 8, ...reportType.eyebrow, textAlign: 'right' }}>{quadrantLabels.topRight}</Text>
      <Text style={{ position: 'absolute', bottom: 8, left: 8, ...reportType.eyebrow }}>{quadrantLabels.bottomLeft}</Text>
      <Text style={{ position: 'absolute', bottom: 8, right: 8, ...reportType.eyebrow, textAlign: 'right' }}>{quadrantLabels.bottomRight}</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Timeline — horizontale Zeitleiste mit Meilenstein-Punkten + gestrichelter
// HEUTE-Marke, proportional zur echten Zeitspanne positioniert (Musterseite 4,
// Compliance-Report, #225).
// ─────────────────────────────────────────────────────────────────────────
interface TimelineMarker {
  dateMs: number
  dateLabel: string
  eventLabel: string
  filled: boolean // liegt in der Vergangenheit / bereits wirksam
}
interface TimelineProps {
  markers: TimelineMarker[] // chronologisch sortiert
  todayMs: number
  todayLabel: string
  width: number
}
export function Timeline({ markers, todayMs, todayLabel, width }: TimelineProps) {
  const minMs = markers[0]?.dateMs ?? todayMs
  const maxMs = markers[markers.length - 1]?.dateMs ?? todayMs
  const span = Math.max(1, maxMs - minMs)
  // Inset um den Punkt-Radius: sonst werden die äußeren Meilenstein-Kreise
  // exakt am Svg-Rand abgeschnitten (halbe Kreise wirken wie Pfeilspitzen).
  const inset = 4
  const usableWidth = width - inset * 2
  const xFor = (ms: number) => inset + Math.max(0, Math.min(1, (ms - minMs) / span)) * usableWidth
  const todayX = xFor(todayMs)
  const lineY = 40

  return (
    <View style={{ width, height: 66, position: 'relative' }}>
      <Svg width={width} height={66}>
        <Line x1={inset} y1={lineY} x2={width - inset} y2={lineY} stroke={reportColors.line} strokeWidth={0.75} />
        <Line x1={todayX} y1={16} x2={todayX} y2={lineY} stroke={reportColors.primary} strokeWidth={0.75} strokeDasharray="2,2" />
        {markers.map((m, i) => (
          <Circle key={i} cx={xFor(m.dateMs)} cy={lineY} r={2.5} fill={m.filled ? reportColors.primary : reportColors.ivory} stroke={reportColors.primary} strokeWidth={0.75} />
        ))}
      </Svg>
      <Text style={{ position: 'absolute', left: todayX - 20, top: 4, width: 40, textAlign: 'center', fontFamily: reportFonts.mono, fontSize: 6, letterSpacing: 0.6, color: reportColors.primary, fontWeight: 700 }}>
        {todayLabel}
      </Text>
      {markers.map((m, i) => (
        <View key={i} style={{ position: 'absolute', left: xFor(m.dateMs) - 36, top: lineY + 8, width: 72, alignItems: 'center' }}>
          <Text style={{ fontFamily: reportFonts.mono, fontSize: 6, letterSpacing: 0.4, color: reportColors.inkSubtle }}>{m.dateLabel}</Text>
          <Text style={{ ...reportType.bodyMuted, fontSize: 6.5, textAlign: 'center', marginTop: 2 }}>{m.eventLabel}</Text>
        </View>
      ))}
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// HorizonCard — Karte mit farbigem Kopfbalken für die Drei-Horizonte-Roadmap
// (Musterseite 5, Roadmap-Report, #225).
// ─────────────────────────────────────────────────────────────────────────
interface HorizonCardProps {
  eyebrowLabel: string // "HORIZONT 1"
  durationLabel: string // "0-3 MONATE"
  title: string
  accentColor: string
  items: Array<{ title: string; subtitle?: string }>
  width: number
}
export function HorizonCard({ eyebrowLabel, durationLabel, title, accentColor, items, width }: HorizonCardProps) {
  return (
    <View style={{ width, borderWidth: 0.75, borderColor: reportColors.line, borderRadius: 3, overflow: 'hidden' }}>
      <View style={{ height: 2.5, backgroundColor: accentColor }} />
      <View style={{ padding: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ ...reportType.eyebrowPrimary, color: accentColor }}>{eyebrowLabel}</Text>
          <Text style={{ ...reportType.eyebrow, fontSize: 6 }}>{durationLabel}</Text>
        </View>
        <Text style={{ fontFamily: reportFonts.serif, fontSize: 17, color: reportColors.ink, marginBottom: 10 }}>{title}</Text>
        {items.map((item, i) => (
          <View key={i} style={{ marginBottom: 7 }}>
            <Text style={{ fontFamily: reportFonts.sans, fontWeight: 700, fontSize: 8, color: reportColors.ink }}>{item.title}</Text>
            {item.subtitle && <Text style={{ ...reportType.bodyMuted, fontSize: 7, marginTop: 1 }}>{item.subtitle}</Text>}
          </View>
        ))}
      </View>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// AiCalloutBlock — violett getönter KI-Einordnungs-Block mit Badges
// (Musterseite 6, Architektur-Report, #225).
// ─────────────────────────────────────────────────────────────────────────
interface AiCalloutBlockProps {
  eyebrowLabel: string
  badges: string[]
  text: string
  width: number
}
export function AiCalloutBlock({ eyebrowLabel, badges, text, width }: AiCalloutBlockProps) {
  return (
    <View style={{ width, backgroundColor: reportColors.aiSoft, borderRadius: 4, padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ ...reportType.eyebrow, color: reportColors.ai }}>{eyebrowLabel}</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {badges.map((b, i) => <Badge key={i} label={b} variant="ai" />)}
        </View>
      </View>
      <Text style={{ ...reportType.body, lineHeight: 1.5 }}>{text}</Text>
    </View>
  )
}
