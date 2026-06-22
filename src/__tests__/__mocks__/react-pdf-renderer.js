// CJS-Mock für @react-pdf/renderer in Jest (ESM-Paket, nicht transformierbar ohne VM-Modules)
const React = require('react')

const StyleSheet = {
  create: (styles) => styles,
}

const Document = ({ children }) => React.createElement('div', { 'data-pdf': 'document' }, children)
const Page = ({ children }) => React.createElement('div', { 'data-pdf': 'page' }, children)
const View = ({ children }) => React.createElement('div', { 'data-pdf': 'view' }, children)
const Text = ({ children }) => React.createElement('span', { 'data-pdf': 'text' }, String(children ?? ''))

async function renderToBuffer() {
  // Gibt gültigen PDF-Magic-Bytes-Prefix zurück — genug für Unit-Tests
  return Buffer.from('%PDF-1.4 mock-content')
}

module.exports = { Document, Page, View, Text, StyleSheet, renderToBuffer }
