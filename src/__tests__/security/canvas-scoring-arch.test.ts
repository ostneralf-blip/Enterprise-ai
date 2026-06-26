import { z } from 'zod'

// Spiegelt die API-Schemas wider — fokussiert auf canvas_id-Validierung im PUT-Handler
const UpdateUseCaseSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  canvas_id: z.string().uuid().nullable().optional(),
  scores: z.object({
    value: z.number().int().min(1).max(5),
    feasibility: z.number().int().min(1).max(5),
    data_readiness: z.number().int().min(1).max(5),
    risk: z.number().int().min(1).max(5),
    speed: z.number().int().min(1).max(5),
  }),
})

describe('Security: PUT /api/usecase/[id] — canvas_id Validierung', () => {
  describe('canvas_id UUID-Format-Validierung', () => {
    it('lehnt ungültige UUID als canvas_id ab', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test Use-Case',
        canvas_id: 'not-a-uuid',
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('canvas_id'))).toBe(true)
      }
    })

    it('lehnt ungültiges UUID-Format ab (zu kurz)', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: 'a0eebc99-9c0b-4ef8-bb6d',
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })

    it('lehnt leeren String als canvas_id ab', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: '',
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })

    it('lehnt Whitespace-String als canvas_id ab', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: '   ',
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })

    it('akzeptiert gültige UUID v4 als canvas_id', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test Use-Case',
        canvas_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(true)
    })

    it('akzeptiert eine weitere gültige UUID v4', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        scores: { value: 4, feasibility: 2, data_readiness: 5, risk: 1, speed: 3 },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('canvas_id null-Handling (Verknüpfung aufheben)', () => {
    it('akzeptiert null als canvas_id (Verknüpfung wird aufgehoben)', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: null,
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(true)
    })

    it('akzeptiert canvas_id-Feld komplett fehlend (optional)', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('canvas_id bei unvollständigen Updates', () => {
    it('erlaubt Update mit canvas_id ohne andere Felder zu ändern', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(true)
    })

    it('lehnt Update ab wenn scores fehlen', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('canvas_id SQL-Injection-Schutz', () => {
    it('lehnt SQL-Injection-Payload als canvas_id ab (nicht UUID-Format)', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: "'; DROP TABLE canvases; --",
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })

    it('lehnt UUID mit SQL-Injection ab', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' OR '1'='1",
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('canvas_id Typ-Sicherheit', () => {
    it('lehnt Number-Typ ab (auch wenn valide UUID-ähnlich)', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: 12345,
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })

    it('lehnt Boolean-Typ ab', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: true,
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })

    it('lehnt Array-Typ ab', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Test',
        canvas_id: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('UpdateUseCaseSchema — kombinierte Validierung', () => {
    it('lehnt alles ab wenn name + canvas_id ungültig sind', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: '',
        canvas_id: 'not-a-uuid',
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(false)
    })

    it('akzeptiert wenn nur canvas_id optional ungültig bleibt (null/absent)', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'Valid Name',
        canvas_id: null,
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      })
      expect(result.success).toBe(true)
    })

    it('akzeptiert komplette valide Update mit allen Feldern', () => {
      const result = UpdateUseCaseSchema.safeParse({
        name: 'CRM Automation',
        domain: 'Kundenservice',
        description: 'Automatisierung von CRM-Workflows mit KI',
        canvas_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        scores: { value: 4, feasibility: 3, data_readiness: 5, risk: 2, speed: 4 },
      })
      expect(result.success).toBe(true)
    })
  })
})
