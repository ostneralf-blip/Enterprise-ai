import type { Bi } from '@/config/leitfaden-data'
import dashboardImg from '@/config/gallery/dashboard.jpg'
import canvasImg from '@/config/gallery/canvas.jpg'
import complianceImg from '@/config/gallery/compliance.jpg'
import complianceLawsImg from '@/config/gallery/complianceLaws.jpg'
import knowledgeImg from '@/config/gallery/knowledge.jpg'
import architekturImg from '@/config/gallery/architektur.jpg'
import archCompareImg from '@/config/gallery/archCompare.jpg'
import scenarioImg from '@/config/gallery/scenario.jpg'
import catalogImg from '@/config/gallery/catalog.jpg'

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
    src: dashboardImg.src,
    alt: { de: 'AI Navigator Dashboard', en: 'AI Navigator dashboard' },
    caption: {
      de: 'Ihr persönliches Dashboard: Fortschritt, AI-Profil und Use-Case-Portfolio auf einen Blick',
      en: 'Your personal dashboard: progress, AI profile and use-case portfolio at a glance',
    },
    pro: false,
  },
  {
    key: 'canvas',
    src: canvasImg.src,
    alt: { de: 'AI Use-Case Canvas', en: 'AI Use-Case Canvas' },
    caption: {
      de: 'AI Use-Case Canvas – Anwendungsfälle strukturiert erfassen und bewerten',
      en: 'AI Use-Case Canvas – capture and evaluate use cases in a structured way',
    },
    pro: false,
  },
  {
    key: 'compliance',
    src: complianceImg.src,
    alt: { de: 'Compliance Center Zusammenfassung', en: 'Compliance Center summary' },
    caption: {
      de: 'Compliance Center – Zusammenfassung aller relevanten Regularien',
      en: 'Compliance Center – summary of all relevant regulations',
    },
    pro: true,
  },
  {
    key: 'complianceLaws',
    src: complianceLawsImg.src,
    alt: { de: 'Compliance Center weitere Gesetze', en: 'Compliance Center additional laws' },
    caption: {
      de: 'Compliance Center – weitere Gesetze wie ISO 42001, NIS-2, ISO 27001, BAIT und LkSG',
      en: 'Compliance Center – additional laws such as ISO 42001, NIS-2, ISO 27001, BAIT and LkSG',
    },
    pro: true,
  },
  {
    key: 'knowledge',
    src: knowledgeImg.src,
    alt: { de: 'Wissensbasis', en: 'Knowledge base' },
    caption: {
      de: 'Wissensbasis – Ihre Dokumente und Quellen zentral verwaltet',
      en: 'Knowledge base – manage your documents and sources centrally',
    },
    pro: true,
  },
  {
    key: 'architektur',
    src: architekturImg.src,
    alt: { de: 'Architektur-Generator', en: 'Architecture generator' },
    caption: {
      de: 'Architektur-Generator mit KI-gestützter Analyse',
      en: 'Architecture generator with AI-powered analysis',
    },
    pro: true,
  },
  {
    key: 'archCompare',
    src: archCompareImg.src,
    alt: { de: 'Architekturvergleich', en: 'Architecture comparison' },
    caption: {
      de: 'Zwei Architekturen direkt gegenüberstellen',
      en: 'Compare two architectures side by side',
    },
    pro: true,
  },
  {
    key: 'scenario',
    src: scenarioImg.src,
    alt: { de: 'Szenario-Vergleich', en: 'Scenario comparison' },
    caption: {
      de: 'Szenario-Vergleich für Compliance-Entscheidungen',
      en: 'Scenario comparison for compliance decisions',
    },
    pro: true,
  },
  {
    key: 'catalog',
    src: catalogImg.src,
    alt: { de: 'Technical Architecture Workbench Katalog', en: 'Technical Architecture Workbench catalog' },
    caption: {
      de: 'Technical Architecture Workbench – Katalog verfügbarer Bausteine',
      en: 'Technical Architecture Workbench – catalog of available building blocks',
    },
    pro: true,
  },
]
