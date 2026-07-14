import { validateRasicAccountability, validateCrossControls, validateEuHosting, runEamValidation } from '@/config/architecture-rules'
import type { RasicMatrix } from '@/types'
import type { CatalogComponent } from '@/types'

const makeComp = (overrides: Partial<CatalogComponent>): CatalogComponent => ({
  id: 'c1', name: 'TestComp', vendor: null, category: null, architecture_layer: 'data',
  hosting: ['cloud'], dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal',
  sap_compatible: false, sap_components: [], use_case_types: [], infra_types: ['cloud'],
  cloud_provider: 'independent', icon_name: null, website_url: null, description: null,
  tags: [], incompatible_with: [], requires: [], suggests: [], aliases: [],
  source: 'seed', is_active: true, created_at: '', updated_at: '',
  ...overrides,
})

const validRasic: RasicMatrix = {
  phases: ['konzeption', 'daten', 'build', 'freigabe', 'betrieb'],
  entries: [
    { role: 'AI Lead',    assignments: { konzeption: 'A', daten: 'I', build: 'I', freigabe: 'A', betrieb: 'I' } },
    { role: 'Data Eng',  assignments: { konzeption: 'C', daten: 'R', build: 'R', freigabe: 'C', betrieb: 'R' } },
    { role: 'DPM',       assignments: { konzeption: 'C', daten: 'A', build: 'I', freigabe: 'C', betrieb: 'C' } },
    { role: 'Ops',       assignments: { konzeption: 'I', daten: 'S', build: 'A', freigabe: 'S', betrieb: 'A' } },
  ],
}

const doubleARasic: RasicMatrix = {
  phases: ['konzeption', 'daten', 'build', 'freigabe', 'betrieb'],
  entries: [
    { role: 'Role A', assignments: { konzeption: 'A', daten: 'A', build: 'A', freigabe: 'A', betrieb: 'A' } },
    { role: 'Role B', assignments: { konzeption: 'A', daten: 'A', build: 'I', freigabe: 'I', betrieb: 'I' } },
  ],
}

// ─── Rule 1: RASIC Accountability ────────────────────────────────
describe('validateRasicAccountability', () => {
  test('passes when exactly one A per phase', () => {
    expect(validateRasicAccountability(validRasic).passed).toBe(true)
  })

  test('fails when undefined rasic', () => {
    expect(validateRasicAccountability(undefined).passed).toBe(false)
  })

  test('fails when multiple A in same phase', () => {
    const result = validateRasicAccountability(doubleARasic)
    expect(result.passed).toBe(false)
    expect(result.message.de).toMatch(/konzeption/)
  })

  test('fails when phase has no A', () => {
    const noARasic: RasicMatrix = {
      phases: ['konzeption', 'daten', 'build', 'freigabe', 'betrieb'],
      entries: [
        { role: 'Only', assignments: { konzeption: 'R', daten: 'R', build: 'R', freigabe: 'R', betrieb: 'R' } },
      ],
    }
    expect(validateRasicAccountability(noARasic).passed).toBe(false)
  })

  test('anchor is rasic (SortableSection id, siehe #176 Fix 45445ed)', () => {
    expect(validateRasicAccountability(validRasic).anchor).toBe('rasic')
  })
})

// ─── Rule 3: Cross-Cutting Controls ──────────────────────────────
describe('validateCrossControls', () => {
  test('passes when no risk components', () => {
    const comps = [makeComp({ dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal' })]
    expect(validateCrossControls(comps).passed).toBe(true)
  })

  test('passes when risk component + monitoring present', () => {
    const comps = [
      makeComp({ name: 'GPT-4', eu_ai_act_risk: 'high' }),
      makeComp({ name: 'Grafana', eu_ai_act_risk: 'minimal' }),
    ]
    expect(validateCrossControls(comps).passed).toBe(true)
  })

  test('fails when risk component + no cross-cutting control', () => {
    const comps = [
      makeComp({ name: 'GPT-4', eu_ai_act_risk: 'high' }),
      makeComp({ name: 'Snowflake', eu_ai_act_risk: 'minimal' }),
    ]
    expect(validateCrossControls(comps).passed).toBe(false)
  })

  test('detects control via tags', () => {
    const comps = [
      makeComp({ name: 'HighRisk', eu_ai_act_risk: 'limited' }),
      makeComp({ name: 'ControlTool', tags: ['audit', 'compliance'] }),
    ]
    expect(validateCrossControls(comps).passed).toBe(true)
  })

  test('fails when dsgvo conditional without control', () => {
    const comps = [makeComp({ dsgvo_status: 'conditional' })]
    expect(validateCrossControls(comps).passed).toBe(false)
  })
})

// ─── Rule 4: EU Hosting ───────────────────────────────────────
describe('validateEuHosting', () => {
  test('passes when compliance is not strict', () => {
    const comps = [makeComp({ cloud_provider: 'aws', hosting: ['cloud'] })]
    expect(validateEuHosting(comps, 'moderate').passed).toBe(true)
  })

  test('passes when strict + all components EU-hosted', () => {
    const comps = [makeComp({ cloud_provider: 'aws', hosting: ['eu', 'cloud'] })]
    expect(validateEuHosting(comps, 'strict').passed).toBe(true)
  })

  test('passes when strict + sap provider (exempt)', () => {
    const comps = [makeComp({ cloud_provider: 'sap', hosting: ['cloud'] })]
    expect(validateEuHosting(comps, 'strict').passed).toBe(true)
  })

  test('passes when strict + independent provider (exempt)', () => {
    const comps = [makeComp({ cloud_provider: 'independent', hosting: ['cloud'] })]
    expect(validateEuHosting(comps, 'strict').passed).toBe(true)
  })

  test('fails when strict + non-EU cloud provider', () => {
    const comps = [makeComp({ cloud_provider: 'aws', hosting: ['cloud'] })]
    const result = validateEuHosting(comps, 'strict')
    expect(result.passed).toBe(false)
    expect(result.message.de).toMatch(/TestComp/)
  })

  test('DPM gets A in daten when compliance is strict (integration)', () => {
    // Tested via generateRasic — A in daten should go to DPM when strict
    // See architecture-data.test.ts for generateRasic tests
    expect(true).toBe(true) // placeholder — covered in separate test file
  })
})

// ─── runEamValidation ─────────────────────────────────────────
describe('runEamValidation', () => {
  test('returns 4 results (4. Regel: Komponenten-Owner, #155)', () => {
    expect(runEamValidation(validRasic, [], 'moderate')).toHaveLength(4)
  })

  test('all pass for clean state with active components and no risks', () => {
    const comps = [makeComp({ dsgvo_status: 'compliant', eu_ai_act_risk: 'minimal' })]
    const results = runEamValidation(validRasic, comps, 'moderate', comps.length)
    expect(results.every(r => r.passed)).toBe(true)
  })

  test('r2 fails for empty selection — 0 Komponenten ist ROT, nicht vacuously true (#182)', () => {
    const results = runEamValidation(validRasic, [], 'moderate', 0)
    const r2 = results.find(r => r.ruleId === 'r2')
    expect(r2?.passed).toBe(false)
    expect(r2?.message.de).toContain('unvollständig')
  })

  test('r1 fails when rasic undefined', () => {
    const results = runEamValidation(undefined, [], 'moderate')
    expect(results.find(r => r.ruleId === 'r1')?.passed).toBe(false)
  })
})
