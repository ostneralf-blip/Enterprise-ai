-- OCR/IDP Komponenten für document_processing Capability (#186)
-- Seed via UPSERT gegen lower(trim(name)) — idempotent, auch bei Wiederholung sicher.

INSERT INTO component_catalog (
  name, vendor, category, architecture_layer,
  hosting, dsgvo_status, eu_ai_act_risk,
  sap_compatible, cloud_provider, use_case_types,
  tags, aliases, source, is_active
) VALUES
(
  'SAP Document Information Extraction', 'SAP', 'IDP / OCR', 'application',
  ARRAY['cloud'], 'compliant', 'limited',
  true, 'sap', ARRAY['vision', 'automation'],
  ARRAY['ocr', 'idp', 'document', 'document_processing', 'rechnungsverarbeitung', 'sap btp'],
  ARRAY['sap die', 'document information extraction', 'sap document extraction'],
  'seed', true
),
(
  'Azure AI Document Intelligence', 'Microsoft', 'IDP / OCR', 'application',
  ARRAY['cloud', 'cloud-eu'], 'compliant', 'limited',
  false, 'azure', ARRAY['vision', 'automation'],
  ARRAY['ocr', 'idp', 'document', 'document_processing', 'formular', 'rechnungsverarbeitung', 'azure'],
  ARRAY['azure form recognizer', 'form recognizer', 'document intelligence', 'azure document'],
  'seed', true
),
(
  'AWS Textract', 'AWS', 'IDP / OCR', 'application',
  ARRAY['cloud'], 'compliant', 'limited',
  false, 'aws', ARRAY['vision', 'automation'],
  ARRAY['ocr', 'idp', 'document', 'document_processing', 'textextraktion'],
  ARRAY['amazon textract', 'textract'],
  'seed', true
),
(
  'Google Document AI', 'Google', 'IDP / OCR', 'application',
  ARRAY['cloud'], 'compliant', 'limited',
  false, 'gcp', ARRAY['vision', 'automation'],
  ARRAY['ocr', 'idp', 'document', 'document_processing', 'rechnungsverarbeitung'],
  ARRAY['google docai', 'document ai', 'gcp document ai'],
  'seed', true
),
(
  'Tesseract / docTR', null, 'OCR Engine (Open Source)', 'model',
  ARRAY['onprem', 'cloud'], 'compliant', 'minimal',
  false, 'independent', ARRAY['vision'],
  ARRAY['ocr', 'document', 'document_processing', 'open-source', 'on-prem'],
  ARRAY['tesseract', 'doctr', 'tesseract ocr', 'open source ocr'],
  'seed', true
)
ON CONFLICT ON CONSTRAINT component_catalog_name_key_unique DO UPDATE SET
  tags      = EXCLUDED.tags,
  aliases   = EXCLUDED.aliases,
  is_active = true;
