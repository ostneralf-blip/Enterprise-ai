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
const Text = ({ children }) => {
  assertValidChild(children)
  return React.createElement('span', { 'data-pdf': 'text' }, String(children ?? ''))
}

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

module.exports = { Document, Page, View, Text, StyleSheet, renderToBuffer }
