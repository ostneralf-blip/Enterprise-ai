import type { WizardAnswers } from './architecture-data'
import type { ArchLayer } from '@/types'

export interface LayerRecommendation {
  layer: ArchLayer
  componentNames: string[]
}

export interface CatalogRecommendations {
  layers: LayerRecommendation[]
  roleNames: string[]
}

function isSAP(a: WizardAnswers)   { return a.data_platform === 'sap_bw' || a.model_platform === 'sap_ai_core' }
function isAzure(a: WizardAnswers) { return a.data_platform === 'azure_fabric' }
function isAWS(a: WizardAnswers)   { return !isSAP(a) && !isAzure(a) && (a.infra === 'cloud' || a.infra === 'multicloud') }
function isOnprem(a: WizardAnswers){ return a.infra === 'onprem' }
function isHybrid(a: WizardAnswers){ return a.infra === 'hybrid' }

export function recommendFromWizard(answers: WizardAnswers): CatalogRecommendations {
  const sap    = isSAP(answers)
  const azure  = isAzure(answers)
  const aws    = isAWS(answers)
  const onprem = isOnprem(answers)
  const hybrid = isHybrid(answers)
  const gen    = answers.usecase === 'generative'
  const strict = answers.compliance === 'strict'

  // ── DATA ─────────────────────────────────────────────────────────────────
  const data: string[] = []
  if (answers.data_platform === 'sap_bw') {
    data.push('SAP Datasphere', 'SAP HANA Cloud')
    if (!onprem) data.push('Apache Kafka')
  } else if (answers.data_platform === 'azure_fabric') {
    data.push('Microsoft Fabric', 'Azure Synapse Analytics', 'Apache Kafka')
  } else if (answers.data_platform === 'snowflake') {
    data.push('Snowflake', 'Databricks', 'Apache Kafka')
  } else if (answers.data_platform === 'open_source') {
    data.push('Databricks', 'Apache Kafka')
  } else if (aws) {
    data.push('Amazon Redshift', 'Amazon S3', 'AWS Glue', 'Apache Kafka')
  } else {
    data.push('Apache Kafka')
  }
  if (aws && !data.includes('Amazon S3')) data.push('Amazon S3', 'AWS Glue')

  // ── MODEL ─────────────────────────────────────────────────────────────────
  const model: string[] = []
  if (answers.model_platform === 'sap_ai_core') {
    model.push('SAP AI Core')
    if (gen) model.push('SAP GenAI Hub')
  } else if (answers.model_platform === 'cloud_ml') {
    if (azure) model.push('Azure Machine Learning')
    else if (aws) model.push('Amazon SageMaker')
    else model.push('Azure Machine Learning', 'Amazon SageMaker')
  } else if (answers.model_platform === 'open_mlops') {
    model.push('MLflow')
  } else if (answers.model_platform === 'no_code') {
    if (azure) model.push('Azure OpenAI Service')
    else if (sap) model.push('SAP GenAI Hub')
    else model.push('AWS Bedrock')
  }
  if (gen) {
    if (strict || onprem) {
      if (!model.includes('Aleph Alpha')) model.push('Aleph Alpha')
      if (!model.includes('Mistral AI')) model.push('Mistral AI')
      if (onprem) model.push('Ollama')
    } else if (!model.some(c => ['SAP GenAI Hub','Azure OpenAI Service','AWS Bedrock','Mistral AI'].includes(c))) {
      if (azure) model.push('Azure OpenAI Service')
      else if (sap) model.push('SAP GenAI Hub')
      else model.push('AWS Bedrock', 'Mistral AI')
    }
  }

  // ── MLOPS ─────────────────────────────────────────────────────────────────
  const mlops: string[] = []
  if (answers.model_platform === 'sap_ai_core') {
    mlops.push('MLflow')
  } else if (answers.model_platform === 'cloud_ml') {
    if (azure) mlops.push('Azure ML Pipelines', 'MLflow')
    else mlops.push('SageMaker Pipelines', 'MLflow')
  } else if (answers.model_platform === 'open_mlops') {
    mlops.push('MLflow', 'Kubeflow', 'ZenML')
  } else {
    mlops.push('MLflow', 'GitHub Actions')
  }
  if (!mlops.includes('Grafana')) mlops.push('Grafana')
  if (answers.monitoring !== 'basic' && answers.monitoring !== 'cloud_native_monitor') {
    if (!mlops.includes('Evidently AI')) mlops.push('Evidently AI')
  }

  // ── SERVING ───────────────────────────────────────────────────────────────
  const serving: string[] = []
  if (answers.model_platform === 'sap_ai_core') {
    serving.push('SAP AI Launchpad')
  } else if (onprem || hybrid) {
    if (gen) serving.push('vLLM')
    serving.push('BentoML', 'Kong Gateway')
  } else if (answers.model_platform === 'cloud_ml') {
    if (aws) serving.push('SageMaker Endpoints')
    serving.push('BentoML')
  } else {
    serving.push('BentoML', 'Kong Gateway')
  }

  // ── GOVERNANCE ────────────────────────────────────────────────────────────
  const governance: string[] = []
  if (sap)        governance.push('SAP MDG', 'OpenMetadata')
  else if (azure) governance.push('Microsoft Purview', 'OpenMetadata')
  else if (aws)   governance.push('AWS DataZone', 'OpenMetadata')
  else            governance.push('OpenMetadata')

  // ── SECURITY ──────────────────────────────────────────────────────────────
  const security: string[] = []
  if (sap)                    security.push('SAP BTP Auth & Trust', 'HashiCorp Vault')
  else if (azure)             security.push('Microsoft Entra ID', 'HashiCorp Vault')
  else if (onprem || hybrid)  security.push('Keycloak', 'HashiCorp Vault')
  else                        security.push('HashiCorp Vault')

  // ── APPLICATION ───────────────────────────────────────────────────────────
  const application: string[] = []
  if (sap) {
    application.push('SAP Integration Suite')
    if (gen) application.push('SAP Joule Studio')
  } else if (aws)   application.push('AWS API Gateway', 'Kong Gateway')
  else if (azure)   application.push('Azure API Management', 'Kong Gateway')
  else              application.push('Kong Gateway')

  // ── ROLES ─────────────────────────────────────────────────────────────────
  const roles: string[] = ['AI Product Owner', 'Business AI Champion', 'Data Privacy Manager', 'Data Engineer']

  if (answers.skills === 'team') {
    roles.push('Data Scientist', 'ML Engineer', 'MLOps Engineer')
    if (answers.data_platform) roles.push('AI CoE Lead', 'Chief Data Officer (CDO)')
  } else if (answers.skills === 'individuals') {
    roles.push('Data Scientist')
  }
  if (gen) roles.push('Prompt Engineer')
  if (strict) roles.push('AI Ethics / Risk Officer')
  if (!onprem && answers.skills !== 'business') roles.push('Enterprise Architect (AI)')

  return {
    layers: ([
      { layer: 'data'        as ArchLayer, componentNames: data },
      { layer: 'model'       as ArchLayer, componentNames: model },
      { layer: 'mlops'       as ArchLayer, componentNames: mlops },
      { layer: 'serving'     as ArchLayer, componentNames: serving },
      { layer: 'governance'  as ArchLayer, componentNames: governance },
      { layer: 'security'    as ArchLayer, componentNames: security },
      { layer: 'application' as ArchLayer, componentNames: application },
    ] as LayerRecommendation[]).filter(l => l.componentNames.length > 0),
    roleNames: [...new Set(roles)],
  }
}
