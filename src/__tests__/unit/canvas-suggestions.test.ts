import { platformToProvider, usecaseToApiType } from '@/app/[locale]/(dashboard)/canvas/CanvasPageClient'

describe('platformToProvider', () => {
  it('SAP → sap', () => expect(platformToProvider('SAP')).toBe('sap'))
  it('Azure → azure', () => expect(platformToProvider('Azure')).toBe('azure'))
  it('AWS → aws', () => expect(platformToProvider('AWS')).toBe('aws'))
  it('GCP → gcp', () => expect(platformToProvider('GCP')).toBe('gcp'))
  it('On-Premises → null (kein direkter cloud_provider)', () => expect(platformToProvider('On-Premises')).toBeNull())
  it('Unbekannte Plattform → null', () => expect(platformToProvider('Oracle Cloud')).toBeNull())
  it('Leerstring → null', () => expect(platformToProvider('')).toBeNull())
})

describe('usecaseToApiType', () => {
  it('Generative AI → generative', () => expect(usecaseToApiType('Generative AI')).toBe('generative'))
  it('Predictive Analytics → predictive', () => expect(usecaseToApiType('Predictive Analytics')).toBe('predictive'))
  it('Computer Vision → vision', () => expect(usecaseToApiType('Computer Vision')).toBe('vision'))
  it('Prozessautomatisierung → automation', () => expect(usecaseToApiType('Prozessautomatisierung')).toBe('automation'))
  it('null → null', () => expect(usecaseToApiType(null)).toBeNull())
  it('Unbekannter Typ → null', () => expect(usecaseToApiType('Clustering')).toBeNull())
})
