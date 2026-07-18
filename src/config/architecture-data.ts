import type { LocaleString } from '@/lib/utils/locale-data'
import type { RasicMatrix, RasicPhase, RasicValue } from '@/types'

export type InfraOption = 'cloud' | 'hybrid' | 'onprem' | 'multicloud'
export type DataOption = 'centralized' | 'distributed' | 'silos' | 'to_build'
export type SkillsOption = 'team' | 'individuals' | 'business' | 'external'
export type UseCaseOption = 'predictive' | 'generative' | 'vision' | 'automation'
export type SapLandscapeOption = 'full' | 'partial' | 'planned' | 'none'
export type CloudProviderHintOption = 'azure' | 'aws' | 'gcp' | 'sap_btp' | 'none_or_multi'
export type IndustryOption = 'finance' | 'manufacturing' | 'healthcare_public' | 'retail_consumer' | 'other'
export type CompanySizeOption = 'small' | 'medium' | 'large' | 'enterprise'
export type ComplianceOption = 'strict' | 'moderate' | 'low' | 'undefined'
export type DataPlatformOption = 'sap_bw' | 'snowflake' | 'azure_fabric' | 'open_source'
export type ModelPlatformOption = 'sap_ai_core' | 'cloud_ml' | 'open_mlops' | 'no_code'
export type MonitoringOption = 'enterprise' | 'cloud_native_monitor' | 'open_source_monitor' | 'basic'
export type PatternId = 'cloud_native' | 'managed' | 'hybrid' | 'onprem' | 'data_first'

export interface WizardAnswers {
  infra?: InfraOption
  data?: DataOption
  skills?: SkillsOption
  usecase?: UseCaseOption
  sap_landscape?: SapLandscapeOption
  cloud_provider_hint?: CloudProviderHintOption
  industry?: IndustryOption
  company_size?: CompanySizeOption
  compliance?: ComplianceOption
  data_platform?: DataPlatformOption
  model_platform?: ModelPlatformOption
  monitoring?: MonitoringOption
}

export interface WizardOption {
  id: string
  label: LocaleString
  description: LocaleString
}

export interface WizardStep {
  id: keyof WizardAnswers
  step: number
  question: LocaleString
  context: LocaleString
  options: WizardOption[]
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'infra',
    step: 1,
    question: { de: 'Wo läuft Ihre aktuelle IT-Infrastruktur?', en: 'Where does your current IT infrastructure run?' },
    context: { de: 'Die Infrastruktur-Basis bestimmt maßgeblich, welche AI-Architektur-Muster praktikabel sind.', en: 'The infrastructure base largely determines which AI architecture patterns are feasible.' },
    options: [
      { id: 'cloud',      label: { de: 'Public Cloud',                      en: 'Public Cloud'                      }, description: { de: 'Hauptsächlich AWS, Azure oder GCP — Workloads laufen in der Cloud',              en: 'Primarily AWS, Azure or GCP — workloads running in the cloud'              } },
      { id: 'hybrid',     label: { de: 'Hybrid (Cloud + On-Premise)',        en: 'Hybrid (Cloud + On-Premise)'        }, description: { de: 'Teile on-premise, Teile in der Cloud — verbunden über VPN oder Private Link',     en: 'Parts on-premise, parts in the cloud — connected via VPN or Private Link'   } },
      { id: 'onprem',     label: { de: 'Hauptsächlich On-Premise',           en: 'Primarily On-Premise'               }, description: { de: 'Eigene Rechenzentren oder Private Cloud, wenig externer Cloud-Einsatz',           en: 'Own data centers or private cloud, minimal external cloud usage'            } },
      { id: 'multicloud', label: { de: 'Multi-Cloud',                        en: 'Multi-Cloud'                        }, description: { de: 'Mehrere Cloud-Anbieter parallel im Einsatz',                                    en: 'Multiple cloud providers in use in parallel'                               } },
    ],
  },
  {
    id: 'data',
    step: 2,
    question: { de: 'Wie schätzen Sie Ihre aktuelle Datensituation ein?', en: 'How would you assess your current data situation?' },
    context: { de: 'Datenqualität und -verfügbarkeit sind der häufigste Engpass bei AI-Projekten.', en: 'Data quality and availability are the most common bottleneck in AI projects.' },
    options: [
      { id: 'centralized', label: { de: 'Zentralisiert und strukturiert',              en: 'Centralized and structured'              }, description: { de: 'Data Warehouse oder Data Lake vorhanden, Daten gut dokumentiert und zugänglich',        en: 'Data Warehouse or Data Lake in place, data well documented and accessible'      } },
      { id: 'distributed', label: { de: 'Verteilt in Quellsystemen',                  en: 'Distributed across source systems'        }, description: { de: 'Daten in ERP, CRM, etc. — Zugang möglich, aber keine zentrale Plattform',              en: 'Data in ERP, CRM, etc. — access possible, but no central platform'              } },
      { id: 'silos',       label: { de: 'Siloisiert, wenig Austausch',                en: 'Siloed, little exchange'                  }, description: { de: 'Daten in Abteilungssilos, technische und organisatorische Barrieren',                  en: 'Data in departmental silos, technical and organizational barriers'               } },
      { id: 'to_build',   label: { de: 'Infrastruktur muss noch aufgebaut werden',   en: 'Infrastructure still needs to be built'  }, description: { de: 'Kaum strukturierte Daten vorhanden — Foundation fehlt noch',                          en: 'Barely any structured data available — foundation still missing'                } },
    ],
  },
  {
    id: 'skills',
    step: 3,
    question: { de: 'Welche AI/ML-Kompetenzen sind intern verfügbar?', en: 'What AI/ML competencies are available internally?' },
    context: { de: 'Eigene Kompetenzen bestimmen, wie viel Eigenentwicklung vs. Managed Services sinnvoll ist.', en: 'Internal competencies determine how much custom development vs. managed services makes sense.' },
    options: [
      { id: 'team',        label: { de: 'Dediziertes Data-Science/MLOps-Team',   en: 'Dedicated Data Science/MLOps team'    }, description: { de: 'Mehrere Data Scientists, ML Engineers oder AI-Spezialisten im Haus',          en: 'Multiple Data Scientists, ML Engineers or AI specialists in-house'      } },
      { id: 'individuals', label: { de: 'Einzelne Data Scientists / Analysten',  en: 'Individual Data Scientists / Analysts' }, description: { de: 'Einige Personen mit ML-Kenntnissen, kein vollständiges Team',                 en: 'Some people with ML knowledge, no complete team'                        } },
      { id: 'business',    label: { de: 'Business-Verständnis, wenig Technik',   en: 'Business expertise, little tech'       }, description: { de: 'Domänenwissen vorhanden, AI/ML-Umsetzungskompetenz fehlt noch',              en: 'Domain knowledge available, AI/ML implementation expertise still lacking'} },
      { id: 'external',    label: { de: 'Primär externe Partner',                en: 'Primarily external partners'          }, description: { de: 'Umsetzung hauptsächlich über Dienstleister und Beratung',                    en: 'Implementation mainly via service providers and consultants'             } },
    ],
  },
  {
    id: 'usecase',
    step: 4,
    question: { de: 'Welcher AI-Use-Case-Typ steht im Fokus?', en: 'Which type of AI use case is the primary focus?' },
    context: { de: 'Unterschiedliche Use-Case-Typen erfordern unterschiedliche Technologie-Stacks.', en: 'Different use case types require different technology stacks.' },
    options: [
      { id: 'predictive',  label: { de: 'Predictive Analytics / Machine Learning', en: 'Predictive Analytics / Machine Learning' }, description: { de: 'Prognosen, Klassifikation, Anomalie-Erkennung auf strukturierten Daten',         en: 'Forecasting, classification, anomaly detection on structured data'          } },
      { id: 'generative',  label: { de: 'Generative AI / LLM',                    en: 'Generative AI / LLM'                    }, description: { de: 'Chatbots, Dokumentenanalyse, Textgenerierung, RAG-Systeme',                    en: 'Chatbots, document analysis, text generation, RAG systems'                   } },
      { id: 'vision',      label: { de: 'Computer Vision',                         en: 'Computer Vision'                        }, description: { de: 'Bildanalyse, Qualitätskontrolle, OCR, visuelle Inspektion',                    en: 'Image analysis, quality control, OCR, visual inspection'                    } },
      { id: 'automation',  label: { de: 'Prozessautomatisierung (RPA + AI)',       en: 'Process Automation (RPA + AI)'          }, description: { de: 'Intelligente Dokument-Verarbeitung, Workflow-Automatisierung',                 en: 'Intelligent document processing, workflow automation'                        } },
    ],
  },
  {
    id: 'sap_landscape',
    step: 5,
    question: { de: 'Ist SAP Bestandteil Ihrer aktuellen Systemlandschaft?', en: 'Is SAP part of your current system landscape?' },
    context: { de: 'SAP-Systeme haben dedizierte AI-Integrationspfade (BTP, Joule, AI Core) — relevant für die Komponenten- und Plattformauswahl.', en: 'SAP systems have dedicated AI integration paths (BTP, Joule, AI Core) — relevant for component and platform selection.' },
    options: [
      { id: 'full',    label: { de: 'Ja, SAP-Kernsystem (S/4HANA / ERP)',      en: 'Yes, SAP core system (S/4HANA / ERP)'     }, description: { de: 'SAP ist das zentrale Geschäftssystem — enge AI-Integration auf SAP BTP geplant',   en: 'SAP is the central business system — close AI integration on SAP BTP planned' } },
      { id: 'partial', label: { de: 'Teilweise (einzelne SAP-Produkte)',        en: 'Partially (individual SAP products)'       }, description: { de: 'Einige SAP-Komponenten im Einsatz, kein vollständiger SAP-Stack',              en: 'Some SAP components in use, no full SAP stack'                                } },
      { id: 'planned', label: { de: 'SAP-Migration ist in Planung',             en: 'SAP migration is being planned'            }, description: { de: 'Aktuell kein SAP, aber S/4HANA- oder BTP-Einführung geplant',                  en: 'No SAP currently, but S/4HANA or BTP introduction planned'                    } },
      { id: 'none',    label: { de: 'Nein, kein SAP',                           en: 'No, no SAP'                                }, description: { de: 'SAP spielt in der AI-Architektur keine Rolle',                                  en: 'SAP plays no role in the AI architecture'                                    } },
    ],
  },
  {
    id: 'cloud_provider_hint',
    step: 6,
    question: { de: 'Welchen Cloud-Anbieter nutzen oder evaluieren Sie primär?', en: 'Which cloud provider are you primarily using or evaluating?' },
    context: { de: 'Der Cloud-Anbieter entscheidet konkret über verfügbare Managed Services, ML-Plattformen und Compliance-Optionen.', en: 'The cloud provider determines the available managed services, ML platforms and compliance options.' },
    options: [
      { id: 'azure',        label: { de: 'Microsoft Azure',                         en: 'Microsoft Azure'                         }, description: { de: 'Azure als primäre Cloud — Azure ML, Azure OpenAI, Fabric, Entra ID',         en: 'Azure as primary cloud — Azure ML, Azure OpenAI, Fabric, Entra ID'        } },
      { id: 'aws',          label: { de: 'Amazon Web Services (AWS)',               en: 'Amazon Web Services (AWS)'               }, description: { de: 'AWS als primäre Cloud — SageMaker, Bedrock, Redshift, DataZone',            en: 'AWS as primary cloud — SageMaker, Bedrock, Redshift, DataZone'            } },
      { id: 'gcp',          label: { de: 'Google Cloud Platform (GCP)',             en: 'Google Cloud Platform (GCP)'             }, description: { de: 'GCP als primäre Cloud — Vertex AI, BigQuery, Gemini',                       en: 'GCP as primary cloud — Vertex AI, BigQuery, Gemini'                       } },
      { id: 'sap_btp',     label: { de: 'SAP Business Technology Platform',        en: 'SAP Business Technology Platform'        }, description: { de: 'SAP BTP als zentrale Plattform — AI Core, GenAI Hub, Integration Suite, Joule', en: 'SAP BTP as central platform — AI Core, GenAI Hub, Integration Suite, Joule'} },
      { id: 'none_or_multi',label: { de: 'Kein primärer Anbieter / Multi-Cloud',   en: 'No primary provider / Multi-Cloud'       }, description: { de: 'Mehrere Anbieter parallel oder noch keine Cloud-Strategie festgelegt',         en: 'Multiple providers in parallel or no cloud strategy defined yet'           } },
    ],
  },
  {
    id: 'industry',
    step: 7,
    question: { de: 'In welcher Branche ist Ihr Unternehmen hauptsächlich tätig?', en: 'In which industry does your company primarily operate?' },
    context: { de: 'Branchenspezifische AI-Use-Cases, regulatorische Anforderungen und Datenstrukturen unterscheiden sich erheblich.', en: 'Industry-specific AI use cases, regulatory requirements and data structures differ significantly.' },
    options: [
      { id: 'finance',           label: { de: 'Finance, Banking & Versicherung',         en: 'Finance, Banking & Insurance'         }, description: { de: 'Finanzdienstleistungen — reguliert (BaFin, EZB), Betrugseerkennung, Kreditrisiko, Compliance', en: 'Financial services — regulated (BaFin, ECB), fraud detection, credit risk, compliance' } },
      { id: 'manufacturing',     label: { de: 'Industrie & Produktion',                  en: 'Manufacturing & Industry'             }, description: { de: 'Fertigung, Supply Chain — Predictive Maintenance, Qualitätskontrolle, Prozessoptimierung',    en: 'Manufacturing, supply chain — predictive maintenance, quality control, process optimization' } },
      { id: 'healthcare_public', label: { de: 'Gesundheit & Öffentlicher Sektor',        en: 'Healthcare & Public Sector'           }, description: { de: 'Kliniken, Behörden — hohe Datenschutzanforderungen, sensible Patientendaten',              en: 'Clinics, authorities — high data protection requirements, sensitive patient data'           } },
      { id: 'retail_consumer',   label: { de: 'Handel & Konsumgüter',                   en: 'Retail & Consumer Goods'              }, description: { de: 'Retail, E-Commerce, FMCG — Personalisierung, Demand Forecasting, Customer Analytics',       en: 'Retail, e-commerce, FMCG — personalization, demand forecasting, customer analytics'         } },
      { id: 'other',             label: { de: 'Andere Branche',                          en: 'Other Industry'                       }, description: { de: 'IT-Dienstleistung, Energie, Transport, Chemie oder sonstiges',                              en: 'IT services, energy, transport, chemicals or other'                                         } },
    ],
  },
  {
    id: 'company_size',
    step: 8,
    question: { de: 'Wie groß ist Ihr Unternehmen?', en: 'How large is your company?' },
    context: { de: 'Die Unternehmensgröße bestimmt den empfohlenen Reifegrad-Pfad, die Teamstruktur und den Plattform-Umfang.', en: 'Company size determines the recommended maturity path, team structure and platform scope.' },
    options: [
      { id: 'small',      label: { de: 'Bis 500 Mitarbeitende',                    en: 'Up to 500 employees'                    }, description: { de: 'Mittelstand — pragmatischer Start mit Managed Services, schlankes Team',                  en: 'SME — pragmatic start with managed services, lean team'                           } },
      { id: 'medium',     label: { de: '500–5.000 Mitarbeitende',                  en: '500–5,000 employees'                    }, description: { de: 'Wachsender Mittelstand — erstes AI-Team aufbauen, Plattform skalieren',                 en: 'Growing SME — build first AI team, scale platform'                                } },
      { id: 'large',      label: { de: '5.000–10.000 Mitarbeitende',              en: '5,000–10,000 employees'                 }, description: { de: 'Großunternehmen — AI CoE sinnvoll, mehrere parallele Use Cases',                       en: 'Large enterprise — AI CoE meaningful, multiple parallel use cases'                } },
      { id: 'enterprise', label: { de: 'Über 10.000 Mitarbeitende (Konzern)',     en: 'Over 10,000 employees (Corporate)'      }, description: { de: 'Konzern — dezentrale AI-Teams, Enterprise-Plattform, starke Governance',                en: 'Corporate — decentralized AI teams, enterprise platform, strong governance'       } },
    ],
  },
  {
    id: 'compliance',
    step: 9,
    question: { de: 'Welche Compliance- und Datenschutz-Anforderungen gelten?', en: 'What compliance and data protection requirements apply?' },
    context: { de: 'Regulatorische Anforderungen begrenzen manche Architektur-Optionen und beeinflussen die Datenhaltung.', en: 'Regulatory requirements limit some architecture options and influence data storage decisions.' },
    options: [
      { id: 'strict',    label: { de: 'Strenge Regulierung',          en: 'Strict regulation'           }, description: { de: 'Hochrisiko (EU AI Act), Finanz (BAFIN), Medizin (MDR), HR-Entscheidungen — On-Premise oder Private Cloud oft Pflicht', en: 'High-risk (EU AI Act), finance (BaFin), medical (MDR), HR decisions — on-premise or private cloud often required' } },
      { id: 'moderate',  label: { de: 'Moderate Anforderungen',       en: 'Moderate requirements'       }, description: { de: 'DSGVO-konform, interne Richtlinien, ISO 27001 — Cloud mit EU-Rechenzentrum akzeptiert',                              en: 'GDPR-compliant, internal policies, ISO 27001 — cloud with EU data center accepted'                             } },
      { id: 'low',       label: { de: 'Geringe Anforderungen',        en: 'Low requirements'            }, description: { de: 'Rein interner Einsatz, keine personenbezogenen Daten, kein Kundenkontakt',                                          en: 'Purely internal use, no personal data, no customer contact'                                                    } },
      { id: 'undefined', label: { de: 'Noch nicht definiert',         en: 'Not yet defined'             }, description: { de: 'Compliance-Anforderungen müssen noch geklärt werden',                                                               en: 'Compliance requirements still need to be clarified'                                                            } },
    ],
  },
  {
    id: 'data_platform',
    step: 10,
    question: { de: 'Welche Datenplattform nutzen oder planen Sie?', en: 'Which data platform are you using or planning?' },
    context: { de: 'Die Wahl der Data-Plattform bestimmt konkrete Tooling-Empfehlungen für Ihre Architektur.', en: 'The choice of data platform determines specific tooling recommendations for your architecture.' },
    options: [
      { id: 'sap_bw',       label: { de: 'SAP Datasphere / SAP BW',              en: 'SAP Datasphere / SAP BW'               }, description: { de: 'SAP-zentrierte Umgebung, HANA als Fundament, enge S/4HANA- oder ERP-Integration geplant',                               en: 'SAP-centric environment, HANA as foundation, close S/4HANA or ERP integration planned'                               } },
      { id: 'snowflake',    label: { de: 'Snowflake oder Databricks',             en: 'Snowflake or Databricks'               }, description: { de: 'Cloud-native Analytics-Plattform, SQL-first (Snowflake) oder Lakehouse-Ansatz (Databricks/Delta Lake)',                  en: 'Cloud-native analytics platform, SQL-first (Snowflake) or Lakehouse approach (Databricks/Delta Lake)'                } },
      { id: 'azure_fabric', label: { de: 'Microsoft Fabric / Azure Synapse',     en: 'Microsoft Fabric / Azure Synapse'      }, description: { de: 'Microsoft-Stack im Einsatz, Power BI-Integration wichtig, Azure als primäre Cloud',                                      en: 'Microsoft stack in use, Power BI integration important, Azure as primary cloud'                                      } },
      { id: 'open_source',  label: { de: 'Open-Source (Spark, dbt, Delta Lake)', en: 'Open-Source (Spark, dbt, Delta Lake)'  }, description: { de: 'Maximale Kontrolle und Flexibilität, eigenes Engineering-Team vorhanden, kein Vendor-Lock-in',                          en: 'Maximum control and flexibility, own engineering team available, no vendor lock-in'                                  } },
    ],
  },
  {
    id: 'model_platform',
    step: 11,
    question: { de: 'Wie sollen KI-Modelle entwickelt und betrieben werden?', en: 'How should AI models be developed and operated?' },
    context: { de: 'Die MLOps-Plattform bestimmt, wie effizient Modelle entwickelt, versioniert und in Produktion gebracht werden.', en: 'The MLOps platform determines how efficiently models are developed, versioned and deployed to production.' },
    options: [
      { id: 'sap_ai_core', label: { de: 'SAP AI Core & AI Launchpad',                               en: 'SAP AI Core & AI Launchpad'                              }, description: { de: 'SAP-Ökosystem, BTP-Integration, standardisiertes MLOps im SAP-Stack — ideal bei SAP-Landschaft',              en: 'SAP ecosystem, BTP integration, standardized MLOps in SAP stack — ideal for SAP landscapes'            } },
      { id: 'cloud_ml',    label: { de: 'Cloud ML-Plattform (Azure ML, SageMaker, Vertex AI)',      en: 'Cloud ML Platform (Azure ML, SageMaker, Vertex AI)'      }, description: { de: 'Vollständig managed, Auto-Scaling, tiefe Cloud-Integration — für cloud-affine Teams',                    en: 'Fully managed, auto-scaling, deep cloud integration — for cloud-affine teams'                          } },
      { id: 'open_mlops',  label: { de: 'Open-Source MLOps (Kubeflow, MLflow)',                     en: 'Open-Source MLOps (Kubeflow, MLflow)'                    }, description: { de: 'Maximale Flexibilität und Eigenverantwortung, kein Vendor-Lock-in, eigenes DevOps-Team nötig',            en: 'Maximum flexibility and self-reliance, no vendor lock-in, own DevOps team required'                    } },
      { id: 'no_code',     label: { de: 'Low-Code / No-Code KI (Power Platform, AI Studio)',        en: 'Low-Code / No-Code AI (Power Platform, AI Studio)'       }, description: { de: 'Kein ML-Team erforderlich, schnelle Time-to-Value — für Business-Teams mit wenig Technik',                en: 'No ML team required, fast time-to-value — for business teams with little technical expertise'           } },
    ],
  },
  {
    id: 'monitoring',
    step: 12,
    question: { de: 'Wie wollen Sie KI-Systeme überwachen und deren Qualität sichern?', en: 'How do you want to monitor AI systems and ensure their quality?' },
    context: { de: 'KI-spezifisches Monitoring (Drift, Fairness, Performance) geht über klassisches IT-Monitoring hinaus.', en: 'AI-specific monitoring (drift, fairness, performance) goes beyond classical IT monitoring.' },
    options: [
      { id: 'enterprise',            label: { de: 'Enterprise AI-Governance-Platform',                       en: 'Enterprise AI Governance Platform'                      }, description: { de: 'Dedizierte AI-Monitoring-Tools, AI-Registry, vollständiges Audit-Trail — für regulierte Umgebungen',   en: 'Dedicated AI monitoring tools, AI registry, full audit trail — for regulated environments'   } },
      { id: 'cloud_native_monitor',  label: { de: 'Cloud-native Monitoring (Azure Monitor, CloudWatch)',    en: 'Cloud-native Monitoring (Azure Monitor, CloudWatch)'    }, description: { de: 'Cloud-Bordmittel für Basis-Observability, kostengünstig, ausreichend für einfache Use Cases',          en: 'Cloud built-in tools for basic observability, cost-effective, sufficient for simple use cases'} },
      { id: 'open_source_monitor',   label: { de: 'Open-Source Monitoring (Prometheus, Grafana, Evidently)', en: 'Open-Source Monitoring (Prometheus, Grafana, Evidently)'}, description: { de: 'Eigenhosting mit maximaler Flexibilität — Evidently AI für ML-spezifisches Drift-Monitoring',         en: 'Self-hosted with maximum flexibility — Evidently AI for ML-specific drift monitoring'        } },
      { id: 'basic',                 label: { de: 'Einfaches Basis-Monitoring zunächst ausreichend',        en: 'Simple basic monitoring sufficient for now'             }, description: { de: 'Logging + Basis-Alerts reichen für den Start — Ausbau in Phase 2 geplant',                           en: 'Logging + basic alerts sufficient for start — expansion planned in phase 2'                  } },
    ],
  },
]

export interface ArchitectureLayer {
  name: string
  role: string
  components: string[]
  examples: string
}

export interface ArchitectureResult {
  patternId: PatternId
  pattern: string
  summary: string
  color: { bg: string; border: string; badge: string; title: string }
  layers: ArchitectureLayer[]
  keyDecisions: { de: string; en: string }[]
  nextSteps: { de: string; en: string }[]
  rasic?: RasicMatrix
  rejected_suggestions?: string[]
  componentSources?: Record<string, 'rule' | 'ai' | 'manual'>
}

const RASIC_PHASES: RasicPhase[] = ['konzeption', 'daten', 'build', 'freigabe', 'betrieb']

// Base assignments per role category (A is determined separately per phase)
const RASIC_CATEGORY_BASE: Record<string, Partial<Record<RasicPhase, RasicValue>>> = {
  strategic:   { konzeption: 'R', daten: 'I', build: 'I', freigabe: 'R', betrieb: 'I' },
  technical:   { konzeption: 'C', daten: 'R', build: 'R', freigabe: 'C', betrieb: 'R' },
  governance:  { konzeption: 'C', daten: 'C', build: 'I', freigabe: 'C', betrieb: 'C' },
  operational: { konzeption: 'I', daten: 'S', build: 'S', freigabe: 'S', betrieb: 'S' },
}

export function generateRasic(
  roleNames: string[],
  rolesCatalog: Array<{ role_name: string; role_category?: string | null }>,
  compliance?: string
): RasicMatrix {
  const catMap = Object.fromEntries(rolesCatalog.map(r => [r.role_name, r.role_category ?? 'operational']))

  const strategic = roleNames.filter(r => catMap[r] === 'strategic')
  const technical  = roleNames.filter(r => catMap[r] === 'technical')
  const dpm = roleNames.find(r => r.toLowerCase().includes('privacy') || r.toLowerCase().includes('datenschutz'))

  // Exactly one A per phase — deterministic selection
  const phaseA: Record<RasicPhase, string> = {
    konzeption: strategic[0] ?? roleNames[0] ?? '',
    daten:      compliance === 'strict' && dpm ? dpm : (dpm ?? strategic[0] ?? roleNames[0] ?? ''),
    build:      technical[0] ?? roleNames[0] ?? '',
    freigabe:   strategic[0] ?? roleNames[0] ?? '',
    betrieb:    technical[1] ?? technical[0] ?? roleNames[0] ?? '',
  }

  const entries = roleNames.map(role => {
    const category = catMap[role] ?? 'operational'
    const base = { ...(RASIC_CATEGORY_BASE[category] ?? RASIC_CATEGORY_BASE.operational) } as Record<RasicPhase, RasicValue>
    for (const phase of RASIC_PHASES) {
      if (phaseA[phase] === role) base[phase] = 'A'
    }
    return { role, assignments: base }
  })

  return { phases: RASIC_PHASES, entries }
}

const PATTERNS: Record<PatternId, Omit<ArchitectureResult, 'patternId'>> = {
  cloud_native: {
    pattern: 'Cloud-native AI Platform',
    summary: 'Vollständig cloud-basierte ML-Plattform mit eigenem Team. Maximale Skalierbarkeit und Entwicklungsgeschwindigkeit — bei bewusstem Umgang mit Cloud-Abhängigkeit.',
    color: { bg: 'bg-primary-soft', border: 'border-primary-border', badge: 'bg-blue-100 text-primary-hover', title: 'text-blue-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Zentrale Datenbasis für Training und Inference', components: ['Cloud Data Warehouse', 'Object Storage (Data Lake)', 'Stream Processing', 'Data Catalog'], examples: 'z. B. Snowflake/BigQuery + S3/GCS + Kafka + Apache Atlas' },
      { name: 'Modell & Entwicklung', role: 'Training, Experimente, Feature Engineering', components: ['Cloud ML Platform', 'Feature Store', 'Model Registry', 'Experiment Tracking'], examples: 'z. B. Azure ML / SageMaker / Vertex AI + MLflow' },
      { name: 'Serving & Monitoring', role: 'Modell-Deployment und Betriebsüberwachung', components: ['Container Orchestration', 'API Gateway', 'Model Monitoring', 'CI/CD für Modelle'], examples: 'z. B. Kubernetes/KServe + Kong + Prometheus/Grafana' },
      { name: 'Anwendung & Governance', role: 'Business-Integration und Compliance', components: ['Interne Anwendungen', 'AI Registry', 'Audit Logging', 'Cloud-native Observability'], examples: 'z. B. Power Apps + MLflow Registry + Cloud Monitor' },
    ],
    keyDecisions: [
      { de: 'Cloud-Anbieter-Auswahl: Azure vs. AWS vs. GCP — Lock-in vs. Kostenstruktur abwägen', en: 'Cloud provider selection: Azure vs. AWS vs. GCP — weigh lock-in against cost structure' },
      { de: 'Zentrales Data Warehouse oder dezentrales Data Mesh?', en: 'Centralised Data Warehouse or decentralised Data Mesh?' },
      { de: 'Eigene MLOps-Pipeline oder Cloud-nativer Managed Service?', en: 'Custom MLOps pipeline or cloud-native managed service?' },
      { de: 'Feature Store: Zentralisiert (Feast/Tecton) oder Ad-hoc?', en: 'Feature Store: centralised (Feast/Tecton) or ad-hoc?' },
      { de: 'Multi-Tenant oder Single-Tenant für ML-Workloads?', en: 'Multi-tenant or single-tenant for ML workloads?' },
    ],
    nextSteps: [
      { de: 'Cloud-Anbieter evaluieren und ML-Plattform-PoC aufsetzen (Monat 1–2)', en: 'Evaluate cloud provider and set up ML platform PoC (months 1–2)' },
      { de: 'Data Lake und Warehouse Migration/Aufbau (Monat 2–4)', en: 'Data Lake and Warehouse migration / build-out (months 2–4)' },
      { de: 'Erstes Modell mit Cloud-Services in Produktion bringen (Monat 3–5)', en: 'Deploy first model to production using cloud services (months 3–5)' },
      { de: 'MLOps-Pipeline: CI/CD für Modelle, Monitoring, automatisches Retraining (Monat 4–6)', en: 'MLOps pipeline: CI/CD for models, monitoring, automated retraining (months 4–6)' },
      { de: 'Governance-Framework und AI Registry einrichten (parallel)', en: 'Set up governance framework and AI registry (ongoing, in parallel)' },
    ],
  },
  managed: {
    pattern: 'Managed AI Services',
    summary: 'Maximale Nutzung von vortrainierten Modellen und Managed Services. Geringer Infrastrukturaufwand, schnelle Time-to-Value — ideal für Teams ohne eigene ML-Expertise.',
    color: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', title: 'text-violet-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Managed Storage und ETL ohne Eigenaufwand', components: ['Managed Cloud Storage', 'ETL-as-a-Service', 'Datenbank (managed)', 'Basis-Datenqualität'], examples: 'z. B. Azure Blob + AWS Glue + RDS/CosmosDB' },
      { name: 'Modell & Entwicklung', role: 'Pre-built Modelle und No-/Low-Code-ML', components: ['Foundation Models (LLM/Vision)', 'No-Code ML Tools', 'Prompt Engineering / RAG', 'Fine-Tuning nach Bedarf'], examples: 'z. B. Azure OpenAI + AWS Bedrock + Google Vertex AI' },
      { name: 'Serving & Monitoring', role: 'Managed Endpoints und Built-in Observability', components: ['Managed API Endpoints', 'Built-in Monitoring', 'Rate Limiting', 'Basis-Audit-Log'], examples: 'z. B. Azure AI Studio / Bedrock Endpoints + CloudWatch' },
      { name: 'Anwendung & Governance', role: 'Schnelle Business-Integration mit Low-Code', components: ['Low-Code-Integrationen', 'Workflow-Automation', 'Basis-Audit-Trail', 'Datenschutz-konforme Konfiguration'], examples: 'z. B. Power Automate + Teams Bot + Azure Policy' },
    ],
    keyDecisions: [
      { de: 'Welche Foundation Models? (GPT-4o, Llama, Gemini) — Kosten, Datenschutz, Qualität', en: 'Which foundation models? (GPT-4o, Llama, Gemini) — cost, privacy, quality' },
      { de: 'Prompt Engineering vs. Fine-Tuning vs. RAG — welcher Ansatz für den Use Case?', en: 'Prompt engineering vs. fine-tuning vs. RAG — which approach suits your use case?' },
      { de: 'Single-Provider oder Multi-Provider? Lock-in vs. Flexibilität', en: 'Single-provider or multi-provider? Lock-in vs. flexibility' },
      { de: 'Datenschutz: Private Deployment oder Managed Service mit DPA?', en: 'Privacy: private deployment or managed service with DPA?' },
      { de: 'Ausstiegsstrategie bei Vendor-Problemen oder Kostenexplosion planen', en: 'Plan an exit strategy for vendor issues or cost escalation' },
    ],
    nextSteps: [
      { de: 'Provider-Evaluierung und DPA/Datenschutz-Assessment (Monat 1)', en: 'Provider evaluation and DPA / privacy assessment (month 1)' },
      { de: 'Pilotprojekt mit einem Use Case aufsetzen (Monat 1–2)', en: 'Set up a pilot project with one use case (months 1–2)' },
      { de: 'Prompt Engineering / RAG-Architektur für Use Case entwickeln (Monat 2–3)', en: 'Develop prompt engineering / RAG architecture for the use case (months 2–3)' },
      { de: 'Rollout mit Business-KPIs und Monitoring (Monat 3–4)', en: 'Roll out with business KPIs and monitoring in place (months 3–4)' },
      { de: 'FinOps: Token-Kosten überwachen und optimieren (ab Monat 2)', en: 'FinOps: monitor and optimise token costs (from month 2)' },
    ],
  },
  hybrid: {
    pattern: 'Hybrid AI Platform',
    summary: 'Kombination aus on-premise Kerninfrastruktur und Cloud für skalierbare Workloads. Maximale Flexibilität bei kontrollierten Compliance-Anforderungen.',
    color: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', title: 'text-amber-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Hybride Datenhaltung mit klarer Klassifikation', components: ['On-Premise Data Lake / Warehouse', 'Cloud-Tier für unkritische Daten', 'Datenkatalog mit Klassifikation', 'Sichere Daten-Replikation'], examples: 'z. B. Hadoop/Spark on-premise + Azure Data Lake + Apache Atlas' },
      { name: 'Modell & Entwicklung', role: 'Training on-premise, Cloud-Burst für GPU-intensive Workloads', components: ['On-Premise Training Cluster', 'Cloud Burst für GPU-Training', 'Shared Model Registry', 'Einheitlicher Experiment-Tracker'], examples: 'z. B. Kubeflow on-premise + Cloud GPU Spot Instances + MLflow' },
      { name: 'Serving & Monitoring', role: 'Lokales Serving mit Cloud-Failover-Option', components: ['On-Premise Model Serving', 'Cloud Failover / Burst Serving', 'Zentrales Monitoring', 'VPN/Private Link'], examples: 'z. B. Seldon/TorchServe + KServe Cloud + Grafana' },
      { name: 'Anwendung & Governance', role: 'Hybride Apps mit zentralem Audit-Trail', components: ['Hybride Unternehmensanwendungen', 'Zentrales Identity Management', 'Data Lineage', 'Einheitliches Audit-Log'], examples: 'z. B. Internal apps + Azure AD + Apache Atlas + ELK Stack' },
    ],
    keyDecisions: [
      { de: 'Workload-Klassifikation: Was bleibt on-premise? (Datenschutz-Kriterien definieren)', en: 'Workload classification: what stays on-premise? (define data-privacy criteria)' },
      { de: 'Cloud für Training + On-Premise für Inference — oder umgekehrt?', en: 'Cloud for training + on-premise for inference — or the other way around?' },
      { de: 'Netzwerklatenz und Bandbreite zwischen Standorten messen und planen', en: 'Measure and plan network latency and bandwidth between sites' },
      { de: 'Single Identity Provider für Cloud und On-Premise (Azure AD, Okta)', en: 'Single identity provider for cloud and on-premise (Azure AD, Okta)' },
      { de: 'FinOps-Modell für Cloud-Kosten-Chargeback definieren', en: 'Define a FinOps model for cloud-cost chargeback' },
    ],
    nextSteps: [
      { de: 'Workload-Klassifizierung und Datenschutz-Assessment (Monat 1)', en: 'Workload classification and privacy assessment (month 1)' },
      { de: 'Netzwerk- und Security-Architektur für Hybrid-Konnektivität (Monat 1–2)', en: 'Network and security architecture for hybrid connectivity (months 1–2)' },
      { de: 'Einheitliche Identity- und Access-Management-Lösung einrichten (Monat 2)', en: 'Set up a unified identity and access management solution (month 2)' },
      { de: 'Pilotprojekt in der Hybrid-Architektur mit repräsentativem Use Case (Monat 2–4)', en: 'Run a pilot project in the hybrid architecture with a representative use case (months 2–4)' },
      { de: 'FinOps-Dashboard für Cloud-Kosten-Transparenz (ab Monat 3)', en: 'FinOps dashboard for cloud cost transparency (from month 3)' },
    ],
  },
  onprem: {
    pattern: 'On-Premise AI (Data Sovereignty)',
    summary: 'Vollständig on-premise AI-Infrastruktur für maximale Datenkontrolle und Compliance. Höherer Infrastrukturaufwand, aber volle Transparenz und Regulierungskonformität.',
    color: { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-100 text-slate-700', title: 'text-slate-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Lokale, vollständig kontrollierte Datenbasis', components: ['Enterprise Data Warehouse', 'On-Premise Object Storage', 'Lokale Stream Processing', 'Air-Gap-fähige Datenpipelines'], examples: 'z. B. PostgreSQL/Greenplum + MinIO + Kafka on-premise' },
      { name: 'Modell & Entwicklung', role: 'Privates GPU-Cluster und lokales MLOps', components: ['Privater GPU-Cluster', 'Lokale MLOps-Plattform', 'Private Model Registry', 'Internes Container-Registry'], examples: 'z. B. Bare-metal GPU + Kubeflow/MLflow + Harbor' },
      { name: 'Serving & Monitoring', role: 'Interne Microservices ohne Cloud-Abhängigkeit', components: ['Interne Model Serving', 'Lokales API Gateway', 'SIEM-Integration', 'On-Premise Monitoring Stack'], examples: 'z. B. TorchServe/Triton + Kong on-premise + Splunk + Prometheus' },
      { name: 'Anwendung & Governance', role: 'Interne Apps mit vollständigem Audit-Trail', components: ['On-Premise Anwendungen', 'Vollständiger Audit-Trail', 'Air-Gap-Deployment-Option', 'Interne Zertifizierungsstelle'], examples: 'z. B. Interne Web-Apps + Splunk SIEM + GitLab (lokal)' },
    ],
    keyDecisions: [
      { de: 'GPU-Infrastruktur: Kauf, Leasing oder Private Cloud (z. B. Nutanix, VMware)?', en: 'GPU infrastructure: purchase, lease, or private cloud (e.g. Nutanix, VMware)?' },
      { de: 'MLOps-Platform: Kubeflow vs. MLflow vs. kommerzielle Lösung (Weights & Biases on-premise)', en: 'MLOps platform: Kubeflow vs. MLflow vs. commercial solution (Weights & Biases on-premise)' },
      { de: 'Datenzugangs-Governance: Wer darf welche Daten für Training nutzen?', en: 'Data access governance: who may use which data for training?' },
      { de: 'Update-Strategie: Wie werden Modelle aktualisiert ohne externe Abhängigkeit?', en: 'Update strategy: how are models updated without external dependencies?' },
      { de: 'Air-Gap-Option: Ist vollständige Netzwerk-Isolation für bestimmte Systeme erforderlich?', en: 'Air-gap option: is full network isolation required for certain systems?' },
    ],
    nextSteps: [
      { de: 'GPU-Infrastruktur-Assessment: Anforderungen definieren, Angebote einholen (Monat 1)', en: 'GPU infrastructure assessment: define requirements, gather quotes (month 1)' },
      { de: 'Netzwerk-Segregation und Security-Konzept (Monat 1–2)', en: 'Network segmentation and security concept (months 1–2)' },
      { de: 'MLOps-Platform-Auswahl und Pilotinstallation (Monat 2–3)', en: 'MLOps platform selection and pilot installation (months 2–3)' },
      { de: 'Daten-Governance-Framework und Zugangskontrollen (Monat 2–3)', en: 'Data governance framework and access controls (months 2–3)' },
      { de: 'Erstes Modell vollständig on-premise trainieren und deployen (Monat 4–6)', en: 'Train and deploy the first model fully on-premise (months 4–6)' },
    ],
  },
  data_first: {
    pattern: 'Data-First Approach',
    summary: 'Bevor AI sinnvoll ist, muss die Datenbasis stimmen. Investition in Datenplattform, -qualität und -governance jetzt — AI-Use-Cases auf stabiler Basis in 3–6 Monaten.',
    color: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-800' },
    layers: [
      { name: 'Daten-Infrastruktur', role: 'Foundation zuerst: Einheitliche, qualitätsgesicherte Datenbasis aufbauen', components: ['Cloud Data Warehouse als Fundament', 'Ingestion Pipelines (ELT)', 'Data Quality Monitoring', 'Data Catalog & Lineage'], examples: 'z. B. Snowflake/BigQuery + dbt + Great Expectations + Alation' },
      { name: 'Erste AI-Ebene: Managed Services', role: 'Quick Wins mit Managed AI während Datenplattform wächst', components: ['Managed ML Services (No-Code)', 'Business Intelligence & Analytics', 'Einfache Automatisierungen', 'A/B-Testing-Framework'], examples: 'z. B. Azure ML Studio + Power BI + Power Automate' },
      { name: 'Serving & Monitoring', role: 'Einfach starten, dann ausbauen', components: ['REST-API-Layer', 'Basis-Monitoring', 'Datenqualitäts-Dashboards', 'Alerts bei Datenproblemen'], examples: 'z. B. FastAPI + Azure Monitor + dbt-Docs' },
      { name: 'Governance als Fundament', role: 'Governance von Anfang an — nicht nachträglich', components: ['Master Data Management', 'Dateneigentümerschaft definieren', 'DSGVO-Compliance in Datenpipelines', 'AI-Governance-Framework (vorbereiten)'], examples: 'z. B. Atlan/Collibra + Internal data owners + GDPR-Annotation' },
    ],
    keyDecisions: [
      { de: 'Datenplattform-Architektur: Data Warehouse, Data Lake oder Lakehouse (z. B. Delta Lake)?', en: 'Data platform architecture: Data Warehouse, Data Lake, or Lakehouse (e.g. Delta Lake)?' },
      { de: 'Datenqualität und Master Data Management als erste Investition priorisieren', en: 'Prioritise data quality and Master Data Management as the first investment' },
      { de: 'Self-Service Analytics vor KI: BI-Tools zuerst für Business-Value', en: 'Self-service analytics before AI: BI tools first for business value' },
      { de: 'AI-Ready-Kriterien definieren: Wann sind Daten gut genug für ML?', en: 'Define AI-readiness criteria: when are the data good enough for ML?' },
      { de: 'Team-Entwicklung: Data Engineer zuerst, dann Data Scientist', en: 'Team development: Data Engineer first, then Data Scientist' },
    ],
    nextSteps: [
      { de: 'Data Audit: Welche Daten existieren, wo, welche Qualität? (Monat 1)', en: 'Data audit: what data exists, where, and at what quality? (month 1)' },
      { de: 'Datenplattform-Architektur entscheiden und Cloud-Anbieter wählen (Monat 1–2)', en: 'Decide on data platform architecture and select cloud provider (months 1–2)' },
      { de: 'Core-Ingestion-Pipelines für 2–3 wichtigste Quellsysteme (Monat 2–4)', en: 'Core ingestion pipelines for 2–3 key source systems (months 2–4)' },
      { de: 'Data Catalog, Governance und Qualitäts-Monitoring einrichten (Monat 3–5)', en: 'Set up Data Catalog, governance, and quality monitoring (months 3–5)' },
      { de: 'Ersten AI Use Case auf stabiler Datenbasis umsetzen (Monat 5+)', en: 'Implement first AI use case on a solid data foundation (month 5+)' },
    ],
  },
}

// result.summary wird in PATTERNS nur auf Deutsch gepflegt (historisch — result.pattern/summary
// sind persistierte Plain-Strings, keine {de,en}-Objekte, siehe Bug-Report 18.07.2026: "Recommended
// Pattern"-Karte zeigte deutschen Text trotz EN-UI). Übersetzung separat über patternId, damit
// bereits gespeicherte Architekturen (result.summary als Plain-String in der DB) unangetastet bleiben.
export const PATTERN_SUMMARY_EN: Record<PatternId, string> = {
  cloud_native: 'A fully cloud-based ML platform run by your own team. Maximum scalability and development speed — with a deliberate approach to cloud dependency.',
  managed: 'Maximum use of pre-trained models and managed services. Low infrastructure effort, fast time-to-value — ideal for teams without in-house ML expertise.',
  hybrid: 'A combination of on-premise core infrastructure and cloud for scalable workloads. Maximum flexibility with controlled compliance requirements.',
  onprem: 'A fully on-premise AI infrastructure for maximum data control and compliance. Higher infrastructure effort, but full transparency and regulatory conformity.',
  data_first: 'Before AI can deliver value, the data foundation has to be right. Invest in your data platform, quality, and governance now — AI use cases on a stable foundation within 3–6 months.',
}

export function getPatternSummary(patternId: PatternId, summaryFallback: string, locale: string): string {
  return locale === 'en' ? PATTERN_SUMMARY_EN[patternId] ?? summaryFallback : summaryFallback
}

export function selectPattern(answers: WizardAnswers): PatternId {
  if (answers.compliance === 'strict' || answers.infra === 'onprem') return 'onprem'
  if (answers.data === 'to_build' || answers.data === 'silos') return 'data_first'
  if (answers.skills === 'business' || answers.skills === 'external') return 'managed'
  if (answers.usecase === 'generative' && answers.skills !== 'team') return 'managed'
  if (answers.infra === 'hybrid') return 'hybrid'
  if (answers.infra === 'cloud' || answers.infra === 'multicloud') return 'cloud_native'
  return 'hybrid'
}

const DATA_PLATFORM_EXAMPLES: Partial<Record<DataPlatformOption, string>> = {
  sap_bw:        'SAP Datasphere (Virtualisierung) + SAP BW/4HANA + SAP HANA Data Lake + SAP Data Intelligence',
  snowflake:     'Snowflake (Warehouse) + dbt (Transformation) + Fivetran/Airbyte (Ingestion) + Alation (Catalog)',
  azure_fabric:  'Microsoft Fabric (Lakehouse) + Azure Data Factory + Azure Synapse Analytics + Microsoft Purview',
  open_source:   'Apache Spark + Delta Lake/Apache Iceberg + dbt + Great Expectations + Apache Atlas',
}

const MODEL_PLATFORM_EXAMPLES: Partial<Record<ModelPlatformOption, string>> = {
  sap_ai_core:  'SAP AI Core (MLOps) + SAP AI Launchpad (Management) + SAP AI Foundation + BTP-Integration',
  cloud_ml:     'Azure ML + SageMaker oder Vertex AI + MLflow (Experiment Tracking) + Managed Feature Store',
  open_mlops:   'Kubeflow (Pipeline-Orchestrierung) + MLflow (Tracking & Registry) + Seldon Core (Serving) + DVC',
  no_code:      'Azure AI Studio + Power Platform AI Builder + Copilot Studio + Azure OpenAI (Low-Code RAG)',
}

const MONITORING_EXAMPLES: Partial<Record<MonitoringOption, string>> = {
  enterprise:             'Fiddler AI / WhyLabs (AI-Monitoring) + Collibra AI Governance + AI-Registry + vollständiges Audit-Trail',
  cloud_native_monitor:   'Azure Monitor + Application Insights + CloudWatch + Google Cloud Operations Suite',
  open_source_monitor:    'Prometheus + Grafana + Evidently AI (Drift-Detection) + MLflow (Tracking)',
  basic:                  'Application Logging (ELK/Loki) + Basis-Alerts (Alertmanager) + Grafana-Dashboard',
}

export function generateArchitecture(answers: WizardAnswers): ArchitectureResult {
  const patternId = selectPattern(answers)
  const base = PATTERNS[patternId]

  // Deep-copy layers so shared config is never mutated
  const layers: ArchitectureLayer[] = base.layers.map(l => ({ ...l }))

  const dataEx = answers.data_platform ? DATA_PLATFORM_EXAMPLES[answers.data_platform] : undefined
  const modelEx = answers.model_platform ? MODEL_PLATFORM_EXAMPLES[answers.model_platform] : undefined
  const monEx = answers.monitoring ? MONITORING_EXAMPLES[answers.monitoring] : undefined

  if (dataEx) layers[0] = { ...layers[0], examples: dataEx }
  if (modelEx) layers[1] = { ...layers[1], examples: modelEx }
  if (monEx) layers[2] = { ...layers[2], examples: monEx }

  return { patternId, ...base, layers }
}

// ── Sprint 20: Kosten-Indikator + Pattern-Begründung ─────────────────────────

export interface CostEstimate {
  setup:          { min: number; max: number }
  monthly:        { min: number; max: number }
  durationMonths: { min: number; max: number }
  note: LocaleString
}

// Base estimates for a medium-sized company. Scaled via scaleCostEstimate().
export const COST_ESTIMATES: Record<PatternId, CostEstimate> = {
  cloud_native: {
    setup:          { min: 80_000,  max: 250_000 },
    monthly:        { min: 8_000,   max: 25_000  },
    durationMonths: { min: 4, max: 8 },
    note: { de: 'Skaliert stark mit Datenmenge, Team-Größe und Cloud-Nutzung.', en: 'Scales heavily with data volume, team size, and cloud usage.' },
  },
  managed: {
    setup:          { min: 20_000,  max: 80_000  },
    monthly:        { min: 3_000,   max: 12_000  },
    durationMonths: { min: 1, max: 3 },
    note: { de: 'Günstigster Einstieg. Token-Kosten können bei hohem Volumen stark steigen.', en: 'Lowest entry cost. Token costs can rise sharply at high volumes.' },
  },
  hybrid: {
    setup:          { min: 150_000, max: 400_000 },
    monthly:        { min: 12_000,  max: 35_000  },
    durationMonths: { min: 6, max: 12 },
    note: { de: 'Netzwerk- und Hardware-Kosten erhöhen die initiale Investition.', en: 'Network and hardware costs increase the initial investment.' },
  },
  onprem: {
    setup:          { min: 200_000, max: 600_000 },
    monthly:        { min: 10_000,  max: 30_000  },
    durationMonths: { min: 8, max: 18 },
    note: { de: 'Hohe Anfangsinvestition — dafür keine laufenden Cloud-Gebühren.', en: 'High initial investment — but no ongoing cloud fees.' },
  },
  data_first: {
    setup:          { min: 50_000,  max: 150_000 },
    monthly:        { min: 5_000,   max: 15_000  },
    durationMonths: { min: 3, max: 6 },
    note: { de: 'Phase 1 fokussiert auf Datenplattform. AI-Budget folgt in Phase 2.', en: 'Phase 1 focuses on the data platform. AI budget follows in phase 2.' },
  },
}

const SIZE_FACTOR: Record<string, number> = {
  small: 0.4, medium: 0.7, large: 1.0, enterprise: 1.6,
}

export function scaleCostEstimate(base: CostEstimate, companySize?: string): CostEstimate {
  const f = SIZE_FACTOR[companySize ?? 'large'] ?? 1.0
  return {
    ...base,
    setup:   { min: Math.round(base.setup.min * f),   max: Math.round(base.setup.max * f)   },
    monthly: { min: Math.round(base.monthly.min * f), max: Math.round(base.monthly.max * f) },
  }
}

export function selectPatternReason(answers: WizardAnswers): LocaleString[] {
  const reasons: LocaleString[] = []
  if (answers.compliance === 'strict') {
    reasons.push({ de: 'Strenge Compliance-Anforderungen erfordern maximale Datenkontrolle.', en: 'Strict compliance requirements demand maximum data control.' })
  }
  if (answers.infra === 'onprem') {
    reasons.push({ de: 'Hauptsächlich On-Premise-Infrastruktur — Architektur passt sich daran an.', en: 'Primarily on-premise infrastructure — architecture adapts accordingly.' })
  }
  if (answers.data === 'to_build') {
    reasons.push({ de: 'Datenbasis muss erst aufgebaut werden — Data-First ist die solide Grundlage.', en: 'The data foundation still needs to be built — Data-First is the solid foundation.' })
  }
  if (answers.data === 'silos') {
    reasons.push({ de: 'Daten in Silos: Zuerst eine einheitliche Datenplattform schaffen.', en: 'Data in silos: first establish a unified data platform.' })
  }
  if (answers.skills === 'business' || answers.skills === 'external') {
    reasons.push({ de: 'Begrenzte interne AI/ML-Kompetenz: Managed Services reduzieren den Fachkräftebedarf.', en: 'Limited internal AI/ML expertise: managed services reduce the need for specialists.' })
  }
  if (answers.usecase === 'generative' && answers.skills !== 'team') {
    reasons.push({ de: 'Generative AI ohne dediziertes ML-Team: Managed LLM-APIs sind der schnellste Weg.', en: 'Generative AI without a dedicated ML team: managed LLM APIs are the fastest route.' })
  }
  if (answers.infra === 'hybrid') {
    reasons.push({ de: 'Hybride Infrastruktur ermöglicht flexible Verteilung zwischen Cloud und On-Premise.', en: 'Hybrid infrastructure enables flexible distribution between cloud and on-premise.' })
  }
  if (reasons.length === 0 && (answers.infra === 'cloud' || answers.infra === 'multicloud')) {
    reasons.push({ de: 'Cloud-native Infrastruktur bietet maximale Skalierbarkeit und Entwicklungsgeschwindigkeit.', en: 'Cloud-native infrastructure offers maximum scalability and development velocity.' })
  }
  return reasons
}
