import { applyPass2, HIGH_CONF_THRESHOLD_DEFAULT } from '@/lib/canvas/pass2'
import type { Pass1TermResult } from '@/lib/ai/schemas'

// ─── Supabase-Mock ────────────────────────────────────────────────────────────
function makeSupabaseMock(overrides: {
  maybySingleResult?: Record<string, unknown> | null
} = {}) {
  const updates: unknown[] = []
  const inserts: unknown[] = []

  let callIndex = 0

  const chainable = (data: unknown) => ({
    eq:         () => chainable(data),
    is:         () => chainable(data),
    not:        () => chainable(data),
    maybeSingle: () => Promise.resolve({
      data: callIndex++ === 0 ? (overrides.maybySingleResult ?? null) : null,
    }),
    update: (fields: unknown) => {
      updates.push(fields)
      return { eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }
    },
    insert: (row: unknown) => {
      inserts.push(row)
      return Promise.resolve({ error: null })
    },
  })

  const supabase = {
    from: (_table: string) => chainable(null),
    _updates: updates,
    _inserts: inserts,
  }

  return supabase as unknown as Parameters<typeof applyPass2>[3] & { _updates: unknown[]; _inserts: unknown[] }
}

const CLIENT_ID = 'client-uuid-111'
const CANVAS_TEXT = 'Successfactor HCM als Datenquelle SAP SuccessFactors verwendet'

const produkt: Pass1TermResult = {
  term: 'Successfactor',
  class: 'produkt',
  vendor: 'SAP',
  confidence: 0.92,
}

const produktLowConf: Pass1TermResult = {
  term: 'Successfactor',
  class: 'produkt',
  vendor: 'SAP',
  confidence: 0.65,
}

const fuellwort: Pass1TermResult = {
  term: 'sollen',
  class: 'fuellwort',
  confidence: 0.97,
}

const eigenname: Pass1TermResult = {
  term: 'ProjectX',
  class: 'projekt_eigenname',
  confidence: 0.88,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HIGH_CONF_THRESHOLD_DEFAULT', () => {
  it('ist 0.80', () => {
    expect(HIGH_CONF_THRESHOLD_DEFAULT).toBe(0.80)
  })
})

describe('applyPass2 — Discard: nicht-produkt Klassen', () => {
  it('fuellwort wird verworfen', async () => {
    const supabase = makeSupabaseMock()
    const stats = await applyPass2([fuellwort], CLIENT_ID, CANVAS_TEXT, supabase)
    expect(stats.discarded).toBe(1)
    expect(stats.autoActive).toBe(0)
  })

  it('projekt_eigenname wird verworfen', async () => {
    const supabase = makeSupabaseMock()
    const stats = await applyPass2([eigenname], CLIENT_ID, CANVAS_TEXT, supabase)
    expect(stats.discarded).toBe(1)
  })
})

describe('applyPass2 — Wörtlich-Guard', () => {
  it('Term nicht im Canvas-Text → discard', async () => {
    const supabase = makeSupabaseMock()
    const result: Pass1TermResult = { term: 'injected', class: 'produkt', vendor: 'SAP', confidence: 0.95 }
    const stats = await applyPass2([result], CLIENT_ID, 'komplett anderer Text', supabase)
    expect(stats.discarded).toBe(1)
  })
})

describe('applyPass2 — Zone Client, neuer Eintrag', () => {
  it('hohe Konfidenz → autoActive=true', async () => {
    // Beide maybeSingle Calls geben null zurück (kein globaler, kein client-Eintrag)
    const supabase = makeSupabaseMock({ maybySingleResult: null })
    const stats = await applyPass2([produkt], CLIENT_ID, CANVAS_TEXT, supabase)
    expect(stats.autoActive).toBe(1)
    expect(stats.pendingClient).toBe(0)
  })

  it('niedrige Konfidenz → pendingClient (is_active=false)', async () => {
    const supabase = makeSupabaseMock({ maybySingleResult: null })
    const stats = await applyPass2([produktLowConf], CLIENT_ID, CANVAS_TEXT, supabase)
    expect(stats.pendingClient).toBe(1)
    expect(stats.autoActive).toBe(0)
  })
})

describe('applyPass2 — Promotion-Queue: Schwellen-Logik', () => {
  it('Konfidenz 0.80 ist noch auto-aktiv (Schwelle inklusiv)', async () => {
    const supabase = makeSupabaseMock()
    const result: Pass1TermResult = { term: 'Successfactor', class: 'produkt', vendor: 'SAP', confidence: 0.80 }
    const stats = await applyPass2([result], CLIENT_ID, CANVAS_TEXT, supabase)
    expect(stats.autoActive).toBe(1)
  })

  it('Konfidenz 0.79 ist pending', async () => {
    const supabase = makeSupabaseMock()
    const result: Pass1TermResult = { term: 'Successfactor', class: 'produkt', vendor: 'SAP', confidence: 0.79 }
    const stats = await applyPass2([result], CLIENT_ID, CANVAS_TEXT, supabase)
    expect(stats.pendingClient).toBe(1)
  })

  it('konfigurierbare Schwelle wird respektiert', async () => {
    const supabase = makeSupabaseMock()
    // Threshold auf 0.95 setzen — Konfidenz 0.92 gilt als pending
    const stats = await applyPass2([produkt], CLIENT_ID, CANVAS_TEXT, supabase, 0.95)
    expect(stats.pendingClient).toBe(1)
    expect(stats.autoActive).toBe(0)
  })
})
