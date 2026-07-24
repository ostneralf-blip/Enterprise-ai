import {
  layersComps,
  togafComps,
  dataFlowComps,
  ruleEdges,
  type BandId,
} from '@/lib/architecture/diagram-grouping'

type LayerComp = { architecture_layer: string | null }

describe('diagram-grouping', () => {
  describe('layersComps', () => {
    it('should group components into application, dataTech, and cross', () => {
      const comps: LayerComp[] = [
        { architecture_layer: 'application' },
        { architecture_layer: 'data' },
        { architecture_layer: 'model' },
        { architecture_layer: 'serving' },
        { architecture_layer: 'mlops' },
        { architecture_layer: 'governance' },
        { architecture_layer: 'security' },
      ]

      const result = layersComps(comps)

      expect(result.application).toHaveLength(1)
      expect(result.application[0].architecture_layer).toBe('application')

      expect(result.dataTech).toHaveLength(4)
      expect(result.dataTech.map((c) => c.architecture_layer)).toEqual(
        expect.arrayContaining(['data', 'model', 'serving', 'mlops'])
      )

      expect(result.cross).toHaveLength(2)
      expect(result.cross.map((c) => c.architecture_layer)).toEqual(
        expect.arrayContaining(['governance', 'security'])
      )
    })

    it('should handle components with null architecture_layer', () => {
      const comps: LayerComp[] = [
        { architecture_layer: 'application' },
        { architecture_layer: null },
      ]

      const result = layersComps(comps)

      expect(result.application).toHaveLength(1)
      expect(result.dataTech).toHaveLength(0)
    })

    it('should handle empty array', () => {
      const result = layersComps([])

      expect(result.application).toHaveLength(0)
      expect(result.dataTech).toHaveLength(0)
      expect(result.cross).toHaveLength(0)
    })
  })

  describe('togafComps', () => {
    it('should group components into data, application, technology, and cross', () => {
      const comps: LayerComp[] = [
        { architecture_layer: 'data' },
        { architecture_layer: 'application' },
        { architecture_layer: 'serving' },
        { architecture_layer: 'model' },
        { architecture_layer: 'mlops' },
        { architecture_layer: 'governance' },
        { architecture_layer: 'security' },
      ]

      const result = togafComps(comps)

      expect(result.data).toHaveLength(1)
      expect(result.data[0].architecture_layer).toBe('data')

      expect(result.application).toHaveLength(2)
      expect(result.application.map((c) => c.architecture_layer)).toEqual(
        expect.arrayContaining(['application', 'serving'])
      )

      expect(result.technology).toHaveLength(2)
      expect(result.technology.map((c) => c.architecture_layer)).toEqual(
        expect.arrayContaining(['model', 'mlops'])
      )

      expect(result.cross).toHaveLength(2)
      expect(result.cross.map((c) => c.architecture_layer)).toEqual(
        expect.arrayContaining(['governance', 'security'])
      )
    })

    it('should handle empty array', () => {
      const result = togafComps([])

      expect(result.data).toHaveLength(0)
      expect(result.application).toHaveLength(0)
      expect(result.technology).toHaveLength(0)
      expect(result.cross).toHaveLength(0)
    })
  })

  describe('dataFlowComps', () => {
    it('should group components by data flow stages', () => {
      const comps: LayerComp[] = [
        { architecture_layer: 'data' },
        { architecture_layer: 'mlops' },
        { architecture_layer: 'model' },
        { architecture_layer: 'serving' },
        { architecture_layer: 'application' },
        { architecture_layer: 'governance' },
        { architecture_layer: 'security' },
      ]

      const result = dataFlowComps(comps)

      expect(result.sources).toHaveLength(1)
      expect(result.sources[0].architecture_layer).toBe('data')

      expect(result.platform).toHaveLength(1)
      expect(result.platform[0].architecture_layer).toBe('mlops')

      expect(result.models).toHaveLength(2)
      expect(result.models.map((c) => c.architecture_layer)).toEqual(
        expect.arrayContaining(['model', 'serving'])
      )

      expect(result.consumption).toHaveLength(1)
      expect(result.consumption[0].architecture_layer).toBe('application')

      expect(result.cross).toHaveLength(2)
      expect(result.cross.map((c) => c.architecture_layer)).toEqual(
        expect.arrayContaining(['governance', 'security'])
      )
    })

    it('should handle empty array', () => {
      const result = dataFlowComps([])

      expect(result.sources).toHaveLength(0)
      expect(result.platform).toHaveLength(0)
      expect(result.models).toHaveLength(0)
      expect(result.consumption).toHaveLength(0)
      expect(result.cross).toHaveLength(0)
    })
  })

  describe('ruleEdges', () => {
    describe('with layers grouping', () => {
      it('should return edge between application and dataTech when both present', () => {
        const nonEmpty = new Set<BandId>(['application', 'dataTech'])
        const edges = ruleEdges('layers', nonEmpty)

        expect(edges).toContainEqual(['application', 'dataTech'])
        expect(edges).toHaveLength(1)
      })

      it('should return empty when dataTech is missing', () => {
        const nonEmpty = new Set<BandId>(['application'])
        const edges = ruleEdges('layers', nonEmpty)

        expect(edges).toHaveLength(0)
      })

      it('should return empty when application is missing', () => {
        const nonEmpty = new Set<BandId>(['dataTech'])
        const edges = ruleEdges('layers', nonEmpty)

        expect(edges).toHaveLength(0)
      })

      it('should handle multiple bands gracefully', () => {
        const nonEmpty = new Set<BandId>(['application', 'dataTech', 'cross'])
        const edges = ruleEdges('layers', nonEmpty)

        expect(edges).toContainEqual(['application', 'dataTech'])
        expect(edges.length).toBeGreaterThanOrEqual(1)
      })
    })

    describe('with togaf grouping', () => {
      it('should return edges when data, application, and technology are present', () => {
        const nonEmpty = new Set<BandId>([
          'data',
          'application',
          'technology',
        ])
        const edges = ruleEdges('togaf', nonEmpty)

        expect(edges).toContainEqual(['application', 'data'])
        expect(edges).toContainEqual(['application', 'technology'])
        expect(edges).toContainEqual(['technology', 'data'])
        expect(edges).toHaveLength(3)
      })

      it('should omit edges where one band is missing', () => {
        const nonEmpty = new Set<BandId>(['application', 'data'])
        const edges = ruleEdges('togaf', nonEmpty)

        expect(edges).toContainEqual(['application', 'data'])
        expect(edges).not.toContainEqual(['application', 'technology'])
        expect(edges).not.toContainEqual(['technology', 'data'])
      })

      it('should return empty when only technology is present', () => {
        const nonEmpty = new Set<BandId>(['technology'])
        const edges = ruleEdges('togaf', nonEmpty)

        expect(edges).toHaveLength(0)
      })

      it('should filter correctly with partial sets', () => {
        const nonEmpty = new Set<BandId>(['data', 'technology'])
        const edges = ruleEdges('togaf', nonEmpty)

        expect(edges).toContainEqual(['technology', 'data'])
        expect(edges).not.toContainEqual(['application', 'data'])
        expect(edges).not.toContainEqual(['application', 'technology'])
      })
    })

    it('should return empty array for empty nonEmpty set', () => {
      const nonEmpty = new Set<BandId>()
      const edges = ruleEdges('layers', nonEmpty)

      expect(edges).toHaveLength(0)
    })
  })
})
