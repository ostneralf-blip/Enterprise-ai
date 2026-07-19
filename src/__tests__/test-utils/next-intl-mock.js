/* eslint-disable @typescript-eslint/no-require-imports */
// CJS-Mock für 'next-intl' in Jest — 'next-intl'/'use-intl' sind reines ESM
// (keine "require"-Export-Condition), Jest bricht sonst mit "Unexpected token
// 'export'" ab (dieselbe Klasse Problem wie @react-pdf/renderer, siehe
// __mocks__/react-pdf-renderer.js). Im Unterschied zu diesem Mock ist hier
// aber eine ECHTE Implementierung sinnvoll (nicht nur ein Platzhalter):
// Übersetzungs-Assertions in Tests sollen echte Message-Werte prüfen können.
//
// Liegt BEWUSST NICHT unter __tests__/__mocks__/ und ist NICHT global via
// jest.config.ts moduleNameMapper aktiviert:
// 1. Ein Dateiname __mocks__/next-intl.js löst bei jest.mock('next-intl', factory)
//    eine Rekursion aus, sobald die Factory genau diese Datei per require()
//    lädt (Jest matcht den Pfad erneut gegen die node_modules-Mock-Konvention
//    und ruft die Factory erneut auf) — "Maximum call stack size exceeded".
//    Deshalb liegt die Implementierung hier in test-utils/, außerhalb jeder
//    __mocks__-Konvention.
// 2. Eine globale Aktivierung würde alle bereits bestehenden (unabhängig von
//    #224 seit Langem roten) next-intl-Testsuiten gleichzeitig verändern —
//    manche stürzten vorher ganz ab (0 Assertions gezählt), liefen mit diesem
//    Mock aber durch und deckten dabei unabhängige, vorbestehende Bugs auf
//    (z. B. falsche Namespace-Keys), was den Test-Diff dieses Tickets unnötig
//    aufbläht. Stattdessen gezielt per
//    `jest.mock('next-intl', () => require('../test-utils/next-intl-mock'))`
//    in den betroffenen Testdateien einbinden (siehe meridian-executive-summary.test.ts).
const deMessages = require('../../../messages/de.json')

function resolveNamespace(messages, namespace) {
  if (!namespace) return messages
  return namespace.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined) ?? {}, messages)
}

// Deckt einfache ICU-Argument-Interpolation ({name}) ab — reicht für alle
// aktuell im Projekt genutzten Messages (keine Plural-/Select-Syntax).
function interpolate(template, values) {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match))
}

function createTranslator({ messages, namespace }) {
  const scoped = resolveNamespace(messages, namespace)
  const t = (key, values) => {
    const raw = scoped[key]
    return typeof raw === 'string' ? interpolate(raw, values) : key
  }
  t.rich = (key, values) => t(key, values)
  t.markup = (key, values) => t(key, values)
  t.raw = key => scoped[key]
  t.has = key => Object.prototype.hasOwnProperty.call(scoped, key)
  return t
}

// Für Client-Komponenten (useTranslations aus 'next-intl'), die in Tests ohne
// <NextIntlClientProvider> gerendert werden — feste DE-Messages, da bestehende
// Komponenten-Tests (z. B. VersionsPanel/ShareButton) keinen Locale-Kontext
// bereitstellen.
function useTranslations(namespace) {
  return createTranslator({ messages: deMessages, namespace })
}

module.exports = {
  createTranslator,
  useTranslations,
  useLocale: () => 'de',
  useMessages: () => deMessages,
  useFormatter: () => ({ dateTime: d => String(d), number: n => String(n) }),
  useNow: () => new Date(),
  useTimeZone: () => 'Europe/Berlin',
  NextIntlClientProvider: ({ children }) => children,
}
