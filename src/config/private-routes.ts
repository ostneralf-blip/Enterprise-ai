// Einzige Quelle der Wahrheit für die privaten, authentifizierten Tool-Routen.
//
// Diese Liste wird an zwei Stellen gebraucht, die zwingend synchron bleiben müssen:
//   1. src/app/robots.ts   — Disallow-Regeln, damit private Bereiche nicht indexiert werden
//   2. next.config.ts      — Cache-Control: no-store, damit personalisierte Seiten nicht
//                            im Browser- oder CDN-Cache landen
//
// Vorher stand die Liste doppelt im Code (mit dem Kommentar „dieselbe Liste, damit
// robots.txt und die Auth-/Cache-Konfiguration nicht auseinanderlaufen") — und war
// bereits auseinandergelaufen: /admin, /settings, /ergebnisse, /zusammenfassung,
// /upgrade, /feedback und /geteilte-links fehlten in beiden Listen, obwohl sie alle
// unter (dashboard) liegen und personenbezogene Daten zeigen.
//
// Beim Anlegen einer neuen Route unter src/app/[locale]/(dashboard)/ hier ergänzen.
export const PRIVATE_TOOL_ROUTES = [
  'admin',
  'architecture',
  'assessment',
  'canvas',
  'compliance',
  'dashboard',
  'ergebnisse',
  'feedback',
  'geteilte-links',
  'governance',
  'roadmap',
  'settings',
  'upgrade',
  'usecase',
  'zusammenfassung',
] as const

// Quellmuster für next.config.ts headers(): matcht DE (ohne Prefix) und EN (/en/...).
export const PRIVATE_ROUTES_HEADER_SOURCE = `/(en/)?(${PRIVATE_TOOL_ROUTES.join('|')})(.*)`
