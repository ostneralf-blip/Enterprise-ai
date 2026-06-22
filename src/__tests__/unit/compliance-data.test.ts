import {
  EU_AI_ACT_RISK_CLASSES,
  EU_AI_ACT_OBLIGATIONS,
  DSGVO_CHECKLIST,
  RISK_MATRIX,
  getRiskLevel,
  POLICY_TEMPLATES,
} from '@/config/compliance-data'

describe('Compliance-Daten: Integrität', () => {

  describe('EU AI Act Risikoklassen', () => {
    it('genau 4 Risikoklassen sind definiert', () => {
      expect(EU_AI_ACT_RISK_CLASSES).toHaveLength(4)
    })

    it('jede Klasse hat id, title, badge, articleRef, color und examples', () => {
      EU_AI_ACT_RISK_CLASSES.forEach(cls => {
        expect(cls.id).toBeTruthy()
        expect(cls.title).toBeTruthy()
        expect(cls.badge).toBeTruthy()
        expect(cls.articleRef).toBeTruthy()
        expect(cls.color.bg).toBeTruthy()
        expect(cls.color.border).toBeTruthy()
        expect(cls.color.badge).toBeTruthy()
        expect(cls.color.title).toBeTruthy()
        expect(cls.examples.length).toBeGreaterThan(0)
      })
    })

    it('Klassen-IDs sind eindeutig', () => {
      const ids = EU_AI_ACT_RISK_CLASSES.map(c => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('alle vier Klassen vorhanden: prohibited, high, limited, minimal', () => {
      const ids = EU_AI_ACT_RISK_CLASSES.map(c => c.id)
      expect(ids).toContain('prohibited')
      expect(ids).toContain('high')
      expect(ids).toContain('limited')
      expect(ids).toContain('minimal')
    })
  })

  describe('EU AI Act Obligations', () => {
    it('Hochrisiko hat die meisten Pflichten (mind. 8)', () => {
      expect(EU_AI_ACT_OBLIGATIONS.high.length).toBeGreaterThanOrEqual(8)
    })

    it('jede Hochrisiko-Pflicht hat id, article, label und description', () => {
      EU_AI_ACT_OBLIGATIONS.high.forEach(item => {
        expect(item.id).toBeTruthy()
        expect(item.article).toBeTruthy()
        expect(item.label).toBeTruthy()
        expect(item.description).toBeTruthy()
      })
    })

    it('Verboten und Minimal haben keine Pflichten', () => {
      expect(EU_AI_ACT_OBLIGATIONS.prohibited).toHaveLength(0)
      expect(EU_AI_ACT_OBLIGATIONS.minimal).toHaveLength(0)
    })

    it('Hochrisiko-Pflicht-IDs sind eindeutig', () => {
      const ids = EU_AI_ACT_OBLIGATIONS.high.map(i => i.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('Art. 14 Human Oversight ist in Hochrisiko enthalten', () => {
      const art14 = EU_AI_ACT_OBLIGATIONS.high.find(i => i.id === 'euaiact_art14')
      expect(art14).toBeDefined()
      expect(art14?.article).toContain('14')
    })
  })

  describe('DSGVO-Checkliste', () => {
    it('mindestens 10 Checklist-Einträge', () => {
      expect(DSGVO_CHECKLIST.length).toBeGreaterThanOrEqual(10)
    })

    it('jeder Eintrag hat id, article, label und description', () => {
      DSGVO_CHECKLIST.forEach(item => {
        expect(item.id).toBeTruthy()
        expect(item.article).toBeTruthy()
        expect(item.label).toBeTruthy()
        expect(item.description).toBeTruthy()
      })
    })

    it('IDs sind eindeutig', () => {
      const ids = DSGVO_CHECKLIST.map(i => i.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('Art. 22 (automatisierte Entscheidungen) ist enthalten', () => {
      const art22 = DSGVO_CHECKLIST.find(i => i.id === 'dsgvo_art22')
      expect(art22).toBeDefined()
      expect(art22?.article).toContain('22')
    })

    it('alle IDs haben dsgvo_-Prefix', () => {
      DSGVO_CHECKLIST.forEach(item => {
        expect(item.id).toMatch(/^dsgvo_/)
      })
    })
  })

  describe('Risikomatrix', () => {
    it('4 Impact-Labels und 4 Probability-Labels', () => {
      expect(RISK_MATRIX.impactLabels).toHaveLength(4)
      expect(RISK_MATRIX.probabilityLabels).toHaveLength(4)
    })

    it('getRiskLevel gibt kritisches Level bei impact=4, probability=4', () => {
      const level = getRiskLevel(4, 4)
      expect(level.label).toBe('Kritisch')
    })

    it('getRiskLevel gibt niedriges Level bei impact=1, probability=1', () => {
      const level = getRiskLevel(1, 1)
      expect(level.label).toBe('Niedrig')
    })

    it('kritisches Level enthält DSGVO oder Datenpanne als Beispiel', () => {
      const critical = getRiskLevel(4, 4)
      const joined = critical.examples.join(' ')
      expect(joined).toMatch(/DSGVO|Datenpanne/i)
    })

    it('jeder Quadrant hat label, action und examples', () => {
      RISK_MATRIX.quadrants.forEach(q => {
        expect(q.label).toBeTruthy()
        expect(q.action).toBeTruthy()
        expect(q.examples.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Policy-Templates', () => {
    it('mindestens 3 Templates sind definiert', () => {
      expect(POLICY_TEMPLATES.length).toBeGreaterThanOrEqual(3)
    })

    it('jedes Template hat id, title, subtitle und content', () => {
      POLICY_TEMPLATES.forEach(tpl => {
        expect(tpl.id).toBeTruthy()
        expect(tpl.title).toBeTruthy()
        expect(tpl.subtitle).toBeTruthy()
        expect(tpl.content.length).toBeGreaterThan(100)
      })
    })

    it('AI Usage Policy ist enthalten', () => {
      expect(POLICY_TEMPLATES.find(t => t.id === 'ai_usage')).toBeDefined()
    })

    it('Model Card Template ist enthalten', () => {
      expect(POLICY_TEMPLATES.find(t => t.id === 'model_card')).toBeDefined()
    })
  })
})
