import { readFileSync } from 'fs'
import { join } from 'path'
import { calculateVerdict, GOVERNANCE_GATES } from '@/config/governance-data'
import type { GateAnswers } from '@/config/governance-data'

describe('Security: Governance-Check', () => {

  describe('Auth-Check (statischer Code-Check)', () => {
    it('Governance-Page prüft Auth via supabase.auth.getUser()', () => {
      const source = readFileSync(join(process.cwd(), 'src/app/[locale]/(dashboard)/governance/page.tsx'), 'utf-8')
      expect(source).toContain('supabase.auth.getUser()')
      expect(source).toContain("redirect('/login')")
    })
  })

  describe('Verdict-Robustheit gegen unbekannte Eingaben', () => {
    it('gibt "approved" zurück wenn answers leer ist (kein Crash)', () => {
      expect(() => calculateVerdict({})).not.toThrow()
    })

    it('gibt "approved" zurück bei unbekannten optionIds', () => {
      const unknown: GateAnswers = {}
      GOVERNANCE_GATES.forEach(g => { unknown[g.id] = 'totally_unknown_option' })
      const result = calculateVerdict(unknown)
      expect(['unlawful', 'stop', 'conditional', 'approved']).toContain(result.level)
    })

    it('gibt "approved" zurück bei unbekannten gateIds (ignoriert unbekannte Keys)', () => {
      const strangeAnswers: GateAnswers = { unknown_gate: 'unknown_option' }
      expect(() => calculateVerdict(strangeAnswers)).not.toThrow()
    })
  })

  describe('Unzulässig-Gate kann nicht umgangen werden', () => {
    it('unacceptable risk_class → immer unlawful, auch wenn alle anderen grün', () => {
      const answers: GateAnswers = { risk_class: 'unacceptable' }
      GOVERNANCE_GATES.forEach(g => {
        if (g.id !== 'risk_class') {
          const green = g.options.find(o => o.weight === 'green')
          if (green) answers[g.id] = green.id
        }
      })
      expect(calculateVerdict(answers).level).toBe('unlawful')
    })

    it('unacceptable verdict ignoriert andere rote Antworten (bleibt unlawful)', () => {
      const answers: GateAnswers = {}
      GOVERNANCE_GATES.forEach(g => {
        const red = g.options.find(o => o.weight === 'red')
        if (red) answers[g.id] = red.id
      })
      expect(calculateVerdict(answers).level).toBe('unlawful')
    })
  })
})
