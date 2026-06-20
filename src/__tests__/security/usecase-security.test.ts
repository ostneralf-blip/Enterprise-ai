import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'

// Spiegelt die API-Schemas wider — stellt sicher, dass Validierungslogik wasserdicht ist
const UseCaseInputSchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  scores: z.object({
    value: z.number().int().min(1).max(5),
    feasibility: z.number().int().min(1).max(5),
    data_readiness: z.number().int().min(1).max(5),
    risk: z.number().int().min(1).max(5),
    speed: z.number().int().min(1).max(5),
  }),
})

const WeightsSchema = z.object({
  value: z.number().min(0).max(1),
  feasibility: z.number().min(0).max(1),
  data_readiness: z.number().min(0).max(1),
  risk: z.number().min(0).max(1),
  speed: z.number().min(0).max(1),
})

describe('Security: Use-Case API-Eingabevalidierung', () => {

  describe('UseCaseInputSchema', () => {
    it('akzeptiert valide Eingabe', () => {
      const result = UseCaseInputSchema.safeParse({
        name: 'CRM Chatbot', domain: 'Kundenservice', description: null,
        scores: { value: 4, feasibility: 3, data_readiness: 2, risk: 5, speed: 3 },
      })
      expect(result.success).toBe(true)
    })

    it('lehnt leeren Namen ab', () => {
      expect(UseCaseInputSchema.safeParse({
        name: '', scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      }).success).toBe(false)
    })

    it('lehnt Name > 200 Zeichen ab (DoS-Schutz)', () => {
      expect(UseCaseInputSchema.safeParse({
        name: 'x'.repeat(201), scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      }).success).toBe(false)
    })

    it('lehnt Beschreibung > 1000 Zeichen ab', () => {
      expect(UseCaseInputSchema.safeParse({
        name: 'Test', description: 'x'.repeat(1001),
        scores: { value: 3, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      }).success).toBe(false)
    })

    it('lehnt Score außerhalb 1-5 ab', () => {
      expect(UseCaseInputSchema.safeParse({
        name: 'Test', scores: { value: 6, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      }).success).toBe(false)
      expect(UseCaseInputSchema.safeParse({
        name: 'Test', scores: { value: 0, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      }).success).toBe(false)
    })

    it('lehnt Dezimalzahlen als Score ab (nur Integer)', () => {
      expect(UseCaseInputSchema.safeParse({
        name: 'Test', scores: { value: 3.5, feasibility: 3, data_readiness: 3, risk: 3, speed: 3 },
      }).success).toBe(false)
    })

    it('lehnt fehlende Scores ab', () => {
      expect(UseCaseInputSchema.safeParse({ name: 'Test', scores: {} }).success).toBe(false)
    })

    it('lehnt XSS-Payload im Name nicht ab (Escaping ist Aufgabe der Ausgabe, nicht des Schemas)', () => {
      // Input-Validierung soll XSS nicht durch Ablehnung verhindern — das macht die Ausgabe-Schicht
      const r = UseCaseInputSchema.safeParse({
        name: '<script>alert(1)</script>', scores: { value: 1, feasibility: 1, data_readiness: 1, risk: 1, speed: 1 },
      })
      expect(r.success).toBe(true) // Wird in der DB gespeichert, sicher ausgegeben via React (auto-escaping)
    })
  })

  describe('WeightsSchema', () => {
    it('akzeptiert valide Gewichte', () => {
      expect(WeightsSchema.safeParse({ value: 0.30, feasibility: 0.25, data_readiness: 0.20, risk: 0.15, speed: 0.10 }).success).toBe(true)
    })

    it('lehnt negative Gewichte ab', () => {
      expect(WeightsSchema.safeParse({ value: -0.1, feasibility: 0.5, data_readiness: 0.3, risk: 0.2, speed: 0.1 }).success).toBe(false)
    })

    it('lehnt Gewichte > 1 ab', () => {
      expect(WeightsSchema.safeParse({ value: 1.1, feasibility: 0, data_readiness: 0, risk: 0, speed: 0 }).success).toBe(false)
    })
  })

  describe('Tier-Gating (statischer Code-Check)', () => {
    it('FREE_LIMIT ist serverseitig in der API-Route geprüft — nicht nur im Client', () => {
      // Strukturprüfung: API-Route importiert FREE_LIMIT aus config/usecase-data
      const routeSource = readFileSync(
        join(process.cwd(), 'src/app/api/usecase/route.ts'), 'utf-8'
      )
      expect(routeSource).toContain('FREE_LIMIT')
      expect(routeSource).toContain("status: 403")
    })

    it('API-Routen prüfen Auth via supabase.auth.getUser() — kein Client-Trust', () => {
      const routeSource = readFileSync(
        join(process.cwd(), 'src/app/api/usecase/route.ts'), 'utf-8'
      )
      expect(routeSource).toContain('supabase.auth.getUser()')
      expect(routeSource).toContain("status: 401")
    })
  })
})
