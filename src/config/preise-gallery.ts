import type { Bi } from '@/config/leitfaden-data'
import { DASHBOARD_B64 } from '@/config/gallery/dashboard'
import { CANVAS_B64 } from '@/config/gallery/canvas'
import { COMPLIANCE_B64 } from '@/config/gallery/compliance'
import { COMPLIANCELAWS_B64 } from '@/config/gallery/complianceLaws'
import { KNOWLEDGE_B64 } from '@/config/gallery/knowledge'
import { ARCHITEKTUR_B64 } from '@/config/gallery/architektur'
import { ARCHCOMPARE_B64 } from '@/config/gallery/archCompare'
import { SCENARIO_B64 } from '@/config/gallery/scenario'
import { CATALOG_B64 } from '@/config/gallery/catalog'

export type GalleryImage = {
  key: string
  src: string
  alt: Bi
  caption: Bi
  /** true = only available on the Professional plan, false = available on Free & Pro */
  pro: boolean
}

export const PREISE_GALLERY: GalleryImage[] = [
  {
    key: 'dashboard',
    src: DASHBOARD_B64,
    alt: { de: 'AI Navigator Dashboard', en: 'AI Navigator dashboard' },
    caption: {
      de: 'Ihr persönliches Dashboard: Fortschritt, AI-Profil und Use-Case-Portfolio auf einen Blick',
      en: 'Your personal dashboard: progress, AI profile and use-case portfolio at a glance',
    },
    pro: false,
  },
  {
    key: 'canvas',
    src: CANVAS_B64,
    alt: { de: 'AI Use-Case Canvas', en: 'AI Use-Case Canvas' },
    caption: {
      de: 'AI Use-Case Canvas – Anwendungsfälle strukturiert erfassen und bewerten',
      en: 'AI Use-Case Canvas – capture and evaluate use cases in a structured way',
    },
    pro: false,
  },
  {
    key: 'compliance',
    src: COMPLIANCE_B64,
    alt: { de: 'Compliance Center Zusammenfassung', en: 'Compliance Center summary' },
    caption: {
      de: 'Compliance Center – Zusammenfassung aller relevanten Regularien',
      en: 'Compliance Center – summary of all relevant regulations',
    },
    pro: true,
  },
  {
    key: 'complianceLaws',
    src: COMPLIANCELAWS_B64,
    alt: { de: 'Compliance Center weitere Gesetze', en: 'Compliance Center additional laws' },
    caption: {
      de: 'Compliance Center – weitere Gesetze wie ISO 42001, NIS-2, ISO 27001, BAIT und LkSG',
      en: 'Compliance Center – additional laws such as ISO 42001, NIS-2, ISO 27001, BAIT and LkSG',
    },
    pro: true,
  },
  {
    key: 'knowledge',
    src: KNOWLEDGE_B64,
    alt: { de: 'Wissensbasis', en: 'Knowledge base' },
    caption: {
      de: 'Wissensbasis – Ihre Dokumente und Quellen zentral verwaltet',
      en: 'Knowledge base – manage your documents and sources centrally',
    },
    pro: true,
  },
  {
    key: 'architektur',
    src: ARCHITEKTUR_B64,
    alt: { de: 'Architektur-Generator', en: 'Architecture generator' },
    caption: {
      de: 'Architektur-Generator mit KI-gestützter Analyse',
      en: 'Architecture generator with AI-powered analysis',
    },
    pro: true,
  },
  {
    key: 'archCompare',
    src: ARCHCOMPARE_B64,
    alt: { de: 'Architekturvergleich', en: 'Architecture comparison' },
    caption: {
      de: 'Zwei Architekturen direkt gegenüberstellen',
      en: 'Compare two architectures side by side',
    },
    pro: true,
  },
  {
    key: 'scenario',
    src: SCENARIO_B64,
    alt: { de: 'Szenario-Vergleich', en: 'Scenario comparison' },
    caption: {
      de: 'Szenario-Vergleich für Compliance-Entscheidungen',
      en: 'Scenario comparison for compliance decisions',
    },
    pro: true,
  },
  {
    key: 'catalog',
    src: CATALOG_B64,
    alt: { de: 'Technical Architecture Workbench Katalog', en: 'Technical Architecture Workbench catalog' },
    caption: {
      de: 'Technical Architecture Workbench – Katalog verfügbarer Bausteine',
      en: 'Technical Architecture Workbench – catalog of available building blocks',
    },
    pro: true,
  },
]
