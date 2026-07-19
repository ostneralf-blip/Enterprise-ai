// MERIDIAN — Design-Tokens für PDF-Reports (@react-pdf/renderer, Issue #223)
// Quelle: docs/design/DESIGN-PHILOSOPHIE-MERIDIAN.md +
// docs/design/AI-Navigator-Report-Design-MERIDIAN(-EN).pdf (freigegebene Musterseiten 1-6).
// Farben 1:1 aus src/app/globals.css (Light-Theme, Theme D — Cover-Blau) übernommen,
// damit Web-UI und PDF-Reports niemals auseinanderlaufen.

export const reportColors = {
  primary:        '#1D4ED8',
  primaryHover:   '#2563EB',
  primarySoft:    '#EFF6FF',
  primaryBorder:  '#BFDBFE',
  ivory:          '#FCFCFA',
  ai:             '#6D28D9',
  aiSoft:         '#F5F3FF',
  white:          '#FFFFFF',

  ink:            '#0F172A',
  inkSecondary:   '#334155',
  inkMuted:       '#64748B',
  inkSubtle:      '#94A3B8',

  lineSubtle:     '#F1F5F9',
  line:           '#E2E8F0',
  lineStrong:     '#CBD5E1',

  successSubtle:  '#F0FDF4',
  successBorder:  '#D1FAE5',
  successText:    '#065F46',

  warningSubtle:  '#FFFBEB',
  warningBorder:  '#FDE68A',
  warningText:    '#92400E',

  // "Brick"-Rot der Musterseiten (MeterBar/RingGauge/Badges unter kritischer
  // Schwelle, z. B. Dimensionen < 50 auf Musterseite 1+2) — dunkler/wärmer
  // als der reine UI-Fehlerton, damit es im Druck als Statusfarbe wirkt statt
  // als Fehlermeldung.
  critical:       '#991B1B',
  criticalSubtle: '#FEF2F2',
} as const

export const reportFonts = {
  serif: 'Lora',        // Titel, Untertitel, große Kennzahlen
  sans:  'Work Sans',   // Fließtext, Tabellen
  mono:  'IBM Plex Mono', // Eyebrows, REF-IDs, Achsen-/Messbeschriftung
} as const

// A4 in pt (@react-pdf/renderer rechnet nativ in pt), Rand M=54pt lt. Issue #223.
export const reportPage = {
  size: 'A4' as const,
  width: 595.28,
  height: 841.89,
  margin: 54,
} as const

// Typo-Skala exakt nach Issue #223 / Musterseiten. fontStyle/fontWeight referenzieren
// die in pdf/fonts.ts registrierten Font.register()-Varianten.
export const reportType = {
  title: {
    fontFamily: reportFonts.serif,
    fontSize: 30,
    fontWeight: 400,
    color: reportColors.ink,
    lineHeight: 1.05,
  },
  subtitle: {
    fontFamily: reportFonts.serif,
    fontStyle: 'italic',
    fontSize: 10.5,
    color: reportColors.inkMuted,
  },
  eyebrow: {
    fontFamily: reportFonts.mono,
    fontSize: 6.5,
    letterSpacing: 1.4,
    color: reportColors.inkMuted,
  },
  eyebrowPrimary: {
    fontFamily: reportFonts.mono,
    fontSize: 6.5,
    letterSpacing: 1.4,
    color: reportColors.primary,
  },
  body: {
    fontFamily: reportFonts.sans,
    fontSize: 8.5,
    color: reportColors.inkSecondary,
    lineHeight: 1.5,
  },
  bodyMuted: {
    fontFamily: reportFonts.sans,
    fontSize: 8.5,
    color: reportColors.inkMuted,
    lineHeight: 1.5,
  },
  statNumber: {
    fontFamily: reportFonts.serif,
    fontSize: 34,
    fontWeight: 700,
    color: reportColors.ink,
  },
  metricValue: {
    fontFamily: reportFonts.mono,
    fontSize: 9,
    fontWeight: 700,
    color: reportColors.primary,
  },
} as const

// Kritische Schwelle für semantische Einfärbung (MeterBar/RingGauge/Badges) —
// Musterseiten zeigen Dimensionswerte < 50 in reportColors.critical statt primary.
export const REPORT_CRITICAL_THRESHOLD = 50

export const reportSpacing = {
  sectionGap: 20,
  itemGap: 8,
  tickCount: 32, // Anzahl Messstriche in der Kopfzeilen-Tick-Leiste (TickRuler)
} as const
