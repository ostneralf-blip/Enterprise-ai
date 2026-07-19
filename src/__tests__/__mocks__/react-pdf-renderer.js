/* eslint-disable @typescript-eslint/no-require-imports */
// CJS-Mock für @react-pdf/renderer in Jest (ESM-Paket, nicht transformierbar ohne VM-Modules)
const React = require('react')

const StyleSheet = {
  create: (styles) => styles,
}

// Prüft rekursiv, dass children nur Strings/Zahlen/Booleans/Elemente enthalten —
// deckt React error #31 ("Objects are not valid as a React child") auf, das der
// echte react-pdf-Renderer wirft, der Jest-Mock aber sonst durch String()-Coercion
// stillschweigend verschluckt (z. B. rohe { de, en }-Objekte statt aufgelöster Strings).
function assertValidChild(child) {
  if (child == null || typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') return
  if (Array.isArray(child)) { child.forEach(assertValidChild); return }
  if (React.isValidElement(child)) return
  throw new TypeError(`Objects are not valid as a React child (found: object with keys {${Object.keys(child).join(', ')}})`)
}

const Document = ({ children }) => React.createElement('div', { 'data-pdf': 'document' }, children)
const Page = ({ children }) => React.createElement('div', { 'data-pdf': 'page' }, children)
const View = ({ children }) => React.createElement('div', { 'data-pdf': 'view' }, children)
const Text = ({ children, render }) => {
  // react-pdf unterstützt eine render()-Prop für dynamische Inhalte (z. B.
  // Seitenzahlen über pageNumber/totalPages) — siehe ReportFooter (MERIDIAN, #223).
  const content = render ? render({ pageNumber: 1, totalPages: 1 }) : children
  assertValidChild(content)
  return React.createElement('span', { 'data-pdf': 'text' }, String(content ?? ''))
}

// MERIDIAN (#223) nutzt SVG-Primitiven für TickRuler/MeterBar/RingGauge sowie
// Font.register() für die Custom-Fontregistrierung — beides bislang von den
// älteren book/board/blueprint-Templates ungenutzt und deshalb im Mock nicht
// vorhanden. Reine No-op-/Platzhalter-Implementierungen reichen hier: der Mock
// prüft nicht die SVG-Geometrie, sondern nur, dass der Komponentenbaum ohne
// Fehler durchläuft (siehe assertValidChild/walk).
const Svg = ({ children }) => React.createElement('svg', { 'data-pdf': 'svg' }, children)
const Path = () => React.createElement('path', { 'data-pdf': 'path' })
const Circle = () => React.createElement('circle', { 'data-pdf': 'circle' })
// Rect (Issue #224, Executive-Summary-Tabellenbalken) — dieselbe reine
// Platzhalter-Logik wie Path/Circle, siehe Kommentar oben.
const Rect = () => React.createElement('rect', { 'data-pdf': 'rect' })
const Font = { register: () => {}, registerHyphenationCallback: () => {} }

// Läuft den Element-Baum rekursiv durch und ruft dabei jede Funktionskomponente
// tatsächlich auf (React.createElement allein tut das nicht — Komponenten sind
// bis zum Rendern nur unausgewertete Beschreibungen). Ohne diesen Walk würde
// renderToBuffer() nie in Document/Page/View/Text hineinlaufen und Fehler wie
// assertValidChild() nie auslösen — der Mock hätte damit keinerlei Aussagekraft.
function walk(node) {
  if (node == null || typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') return
  if (Array.isArray(node)) { node.forEach(walk); return }
  if (!React.isValidElement(node)) return
  const { type, props } = node
  if (typeof type === 'function') {
    walk(type(props))
  } else {
    walk(props && props.children)
  }
}

async function renderToBuffer(document) {
  walk(document)
  // Gibt gültigen PDF-Magic-Bytes-Prefix zurück — genug für Unit-Tests
  return Buffer.from('%PDF-1.4 mock-content')
}

module.exports = { Document, Page, View, Text, Svg, Path, Circle, Rect, Font, StyleSheet, renderToBuffer }
