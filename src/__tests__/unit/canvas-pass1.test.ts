import {
  checkLiteralPresence,
  checkCanonicalVendor,
  shouldAddSynonym,
  shouldAddToBlocklist,
} from '@/lib/canvas/pass1'
import type { Pass1TermResult } from '@/lib/ai/schemas'

// ─── Guard: wörtlich-im-Text ──────────────────────────────────────────────────
describe('checkLiteralPresence', () => {
  it('"Successfactor" im Text → true', () => {
    expect(checkLiteralPresence('Successfactor', 'Successfactor HCM als Datenquelle')).toBe(true)
  })

  it('Groß-/Kleinschreibung ignorieren', () => {
    expect(checkLiteralPresence('successfactor', 'Successfactor HCM')).toBe(true)
    expect(checkLiteralPresence('SUCCESSFACTOR', 'successfactor hcm')).toBe(true)
  })

  it('Term nicht im Text → false', () => {
    expect(checkLiteralPresence('SAP', 'Successfactor HCM als Datenquelle')).toBe(false)
  })

  it('leerer Text → false', () => {
    expect(checkLiteralPresence('sap', '')).toBe(false)
  })
})

// ─── Guard: Canonical-Vendor ──────────────────────────────────────────────────
describe('checkCanonicalVendor', () => {
  it('SAP ist kanonischer Vendor', () => {
    expect(checkCanonicalVendor('SAP')).toBe(true)
  })

  it('Microsoft ist kanonischer Vendor', () => {
    expect(checkCanonicalVendor('Microsoft')).toBe(true)
  })

  it('AWS ist kanonischer Vendor', () => {
    expect(checkCanonicalVendor('AWS')).toBe(true)
  })

  it('unbekannter Vendor → false', () => {
    expect(checkCanonicalVendor('UnbekannterHersteller')).toBe(false)
  })

  it('null/undefined → false', () => {
    expect(checkCanonicalVendor(null)).toBe(false)
    expect(checkCanonicalVendor(undefined)).toBe(false)
  })

  it('Groß-/Kleinschreibung bei Vendor', () => {
    expect(checkCanonicalVendor('sap')).toBe(true)
    expect(checkCanonicalVendor('microsoft')).toBe(true)
  })
})

// ─── Akzeptanz-Test: Successfactor in Datenquellen → Synonym-Kandidat ─────────
describe('shouldAddSynonym', () => {
  it('"Successfactor" in Datenquellen → produkt/SAP → Synonym hinzufügen', () => {
    const result: Pass1TermResult = {
      term: 'Successfactor',
      class: 'produkt',
      vendor: 'SAP',
      confidence: 0.92,
    }
    const { ok } = shouldAddSynonym(result, 'Successfactor HCM als primäre Datenquelle')
    expect(ok).toBe(true)
  })

  // ─── Akzeptanz-Test: "Projekt Successfactor" → projekt_eigenname, KEIN Synonym ─
  it('"Projekt Successfactor haben wir ein Tool" → projekt_eigenname → KEIN Synonym', () => {
    const result: Pass1TermResult = {
      term: 'Successfactor',
      class: 'projekt_eigenname',
      confidence: 0.85,
    }
    const { ok, reason } = shouldAddSynonym(
      result,
      'Projekt Successfactor haben wir ein Tool bereits eingeführt',
    )
    expect(ok).toBe(false)
    expect(reason).toContain('projekt_eigenname')
  })

  it('class=capability → KEIN Synonym (Capability, kein Produkt)', () => {
    const result: Pass1TermResult = { term: 'Texterkennung', class: 'capability', confidence: 0.9 }
    const { ok } = shouldAddSynonym(result, 'Texterkennung von Dokumenten')
    expect(ok).toBe(false)
  })

  it('class=fuellwort → KEIN Synonym', () => {
    const result: Pass1TermResult = { term: 'sollen', class: 'fuellwort', confidence: 0.95 }
    const { ok } = shouldAddSynonym(result, 'KI sollen Prozesse automatisieren')
    expect(ok).toBe(false)
  })

  it('class=mehrdeutig → KEIN Synonym', () => {
    const result: Pass1TermResult = { term: 'Navigator', class: 'mehrdeutig', confidence: 0.5 }
    const { ok } = shouldAddSynonym(result, 'Navigator-Ansicht')
    expect(ok).toBe(false)
  })

  it('produkt + unbekannter Vendor → KEIN Synonym (Canonical-Guard)', () => {
    const result: Pass1TermResult = {
      term: 'MyBizSoft',
      class: 'produkt',
      vendor: 'UnbekannteSoftwareGmbH',
      confidence: 0.7,
    }
    const { ok } = shouldAddSynonym(result, 'MyBizSoft als ERP')
    expect(ok).toBe(false)
  })

  it('produkt + SAP, aber Term nicht im Text → KEIN Synonym (wörtlich-Guard)', () => {
    const result: Pass1TermResult = {
      term: 'injectedTerm',
      class: 'produkt',
      vendor: 'SAP',
      confidence: 0.95,
    }
    // Term erscheint nicht im Canvas-Text
    const { ok } = shouldAddSynonym(result, 'Successfactor HCM als Datenquelle')
    expect(ok).toBe(false)
  })
})

// ─── Akzeptanz-Test: "sollen" → fuellwort → Blocklist ─────────────────────────
describe('shouldAddToBlocklist', () => {
  it('"sollen" → fuellwort → Block-Kandidat', () => {
    const result: Pass1TermResult = { term: 'sollen', class: 'fuellwort', confidence: 0.97 }
    expect(shouldAddToBlocklist(result)).toBe(true)
  })

  it('"können" → fuellwort → Block-Kandidat', () => {
    const result: Pass1TermResult = { term: 'können', class: 'fuellwort', confidence: 0.95 }
    expect(shouldAddToBlocklist(result)).toBe(true)
  })

  it('"Successfactor" → produkt → KEIN Block-Kandidat', () => {
    const result: Pass1TermResult = {
      term: 'Successfactor', class: 'produkt', vendor: 'SAP', confidence: 0.9,
    }
    expect(shouldAddToBlocklist(result)).toBe(false)
  })

  it('capability → KEIN Block-Kandidat', () => {
    const result: Pass1TermResult = { term: 'Texterkennung', class: 'capability', confidence: 0.9 }
    expect(shouldAddToBlocklist(result)).toBe(false)
  })
})
