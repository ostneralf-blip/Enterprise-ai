import { Font } from '@react-pdf/renderer'
import { reportFonts } from '@/config/report-tokens'

// MERIDIAN-Fontregistrierung (Issue #223). @react-pdf/renderer läuft serverless
// auf Vercel und bringt keine Systemfonts mit — Font.register() lädt die TTF-
// Dateien direkt von einem CDN, genau wie ein Browser es über die Google-Fonts-
// CSS täte. Kein lokales Font-Bundling nötig, dadurch bleibt die Serverless-
// Function klein (kein zusätzliches File-Tracing). URLs stammen aus der
// offiziellen Google-Fonts-CSS-API (legacy /css-Endpoint, liefert .ttf statt
// .woff2 — von react-pdf/fontkit zuverlässig unterstützt).
//
// AUSNAHME IBM Plex Mono: Googles CDN-optimiertes/subset TTF
// (fonts.gstatic.com/s/ibmplexmono/...) crasht fontkit@2.0.4 (aktuell neueste
// Version, von @react-pdf/renderer fest vorgegeben) beim Layout — konkret ein
// "RangeError: Offset is outside the bounds of the DataView" beim Berechnen
// der advanceWidth des LEERZEICHEN-Glyphs, reproduziert isoliert per fontkit
// direkt (unabhängig von react-pdf). Betrifft nur diese eine Google-Fonts-
// CDN-Datei — die unbearbeitete Quelldatei aus Googles eigenem font-family-
// Repo (raw.githubusercontent.com/google/fonts, identische OFL-Lizenz) hat
// dasselbe Problem nicht und wird deshalb ausschließlich für IBM Plex Mono
// verwendet. Lora/Work Sans laufen unverändert über gstatic.
let registered = false

export function registerMeridianFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: reportFonts.serif,
    fonts: [
      { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkqg.ttf', fontWeight: 400, fontStyle: 'normal' },
      { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vBJBkqg.ttf', fontWeight: 700, fontStyle: 'normal' },
      { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFoq92mQ.ttf', fontWeight: 400, fontStyle: 'italic' },
    ],
  })

  Font.register({
    family: reportFonts.sans,
    fonts: [
      { src: 'https://fonts.gstatic.com/s/worksans/v24/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXBi8Jow.ttf', fontWeight: 400, fontStyle: 'normal' },
      { src: 'https://fonts.gstatic.com/s/worksans/v24/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K67QBi8Jow.ttf', fontWeight: 700, fontStyle: 'normal' },
    ],
  })

  Font.register({
    family: reportFonts.mono,
    fonts: [
      { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf', fontWeight: 400, fontStyle: 'normal' },
      { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexmono/IBMPlexMono-Bold.ttf', fontWeight: 700, fontStyle: 'normal' },
    ],
  })

  // react-pdf trennt Wörter standardmäßig per Silbentrennungs-Heuristik, die bei
  // Eigennamen/Zahlen (REF-IDs, Produktnamen) unschöne Umbrüche erzeugt — für den
  // präzisen Meridian-Look wird global deaktiviert und stattdessen an Leerzeichen
  // umgebrochen (siehe react-pdf-Doku zu Font.registerHyphenationCallback).
  Font.registerHyphenationCallback(word => [word])
}
