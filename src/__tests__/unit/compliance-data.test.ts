import {
  EU_AI_ACT_CLASSES,
  DSGVO_CHECKLIST,
  RISK_QUADRANTS,
  POLICY_TEMPLATES,
} from '@/config/compliance-data'

describe('Compliance-Daten: Integrität', () => {

  describe('EU AI Act Klassen', () => {
    it('genau 4 Risikoklassen sind definiert', () => {
      expect(EU_AI_ACT_CLASSES).toHaveLength(4)
    })

    it('jede Klasse hat id, title, badge, color, examples und obligations', () => {
      EU_AI_ACT_CLASSES.forEach(cls => {
        expect(cls.id).toBeTruthy()
        expect(cls.title).toBeTruthy()
        expect(cls.badge).toBeTruthy()
        expect(cls.color.bg).toBeTruthy()
        expect(cls.color.border).toBeTruthy()
        expect(cls.color.badge).toBeTruthy()
        expect(cls.color.title).toBeTruthy()
        expect(cls.examples.length).toBeGreaterThan(0)
        expect(cls.obligations.length).toBeGreaterThan(0)
      })
    })

    it('Klassen-IDs sind eindeutig', () => {
      const ids = EU_AI_ACT_CLASSES.map(c => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('Verboten-Klasse hat keine Ausnahmen als Pflicht', () => {
      const prohibited = EU_AI_ACT_CLASSES.find(c => c.id === 'prohibited')
      expect(prohibited?.obligations[0]).toContain('unzulässig')
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
      const art22 = DSGVO_CHECKLIST.find(i => i.id === 'art22')
      expect(art22).toBeDefined()
      expect(art22?.article).toContain('22')
    })
  })

  describe('Risikomatrix', () => {
    it('genau 4 Quadranten sind definiert', () => {
      expect(RISK_QUADRANTS).toHaveLength(4)
    })

    it('jeder Quadrant hat id, label, action, bg, border, badge und examples', () => {
      RISK_QUADRANTS.forEach(q => {
        expect(q.id).toBeTruthy()
        expect(q.label).toBeTruthy()
        expect(q.action).toBeTruthy()
        expect(q.bg).toBeTruthy()
        expect(q.border).toBeTruthy()
        expect(q.badge).toBeTruthy()
        expect(q.examples.length).toBeGreaterThan(0)
      })
    })

    it('kritischer Quadrant enthält Datenpanne oder DSGVO-Verstoß als Beispiel', () => {
      const critical = RISK_QUADRANTS.find(q => q.id === 'critical')
      expect(critical).toBeDefined()
      const examplesJoined = critical?.examples.join(' ')
      expect(examplesJoined).toMatch(/DSGVO|Datenpanne/i)
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
      const policy = POLICY_TEMPLATES.find(t => t.id === 'ai_usage')
      expect(policy).toBeDefined()
    })

    it('Model Card Template ist enthalten', () => {
      const card = POLICY_TEMPLATES.find(t => t.id === 'model_card')
      expect(card).toBeDefined()
    })
  })
})
