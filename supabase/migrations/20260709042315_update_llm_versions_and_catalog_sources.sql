-- Fact-Check Stufe 2 (09.07.2026): LLM-Versionen + Katalogquellen-URLs aktualisieren
--
-- LLM-Einträge: veraltete/abgekündigte Modellversionen auf aktuelle Generation heben.
-- Umbenennung per UPDATE (name ist Display-Label, kein FK-Referenzschlüssel).
-- catalog_sources: inkonsistente URLs zwischen Schema-Datei und DB vereinheitlichen.

-- ── LLM-Versionen ──────────────────────────────────────────────────────────────

UPDATE component_catalog
SET name        = 'OpenAI GPT-5',
    description = 'OpenAIs aktuelle Flaggschiff-LLM-Generation (GPT-5.x) mit Text, Code und Bildverständnis. GPT-4o wurde Feb. 2026 abgekündigt.'
WHERE name = 'GPT-4o' AND vendor = 'OpenAI';

UPDATE component_catalog
SET name        = 'Claude (Anthropic)',
    description = 'Anthropics LLM-Familie (Sonnet 4.6, Opus 4.8, Fable 5) — starke Reasoning- und Safety-Properties.'
WHERE name = 'Claude 3.5 Sonnet' AND vendor = 'Anthropic';

UPDATE component_catalog
SET name        = 'Gemini 3.x Pro',
    description = 'Googles aktuelle Multimodal-LLM-Generation (Gemini 3.1 Pro / 3.5 Flash). Gemini 1.5 API wurde abgeschaltet (404).'
WHERE name = 'Gemini 1.5 Pro' AND vendor = 'Google';

UPDATE component_catalog
SET name        = 'Llama 4',
    description = 'Metas aktuelle Open-Source-LLM-Generation (Scout/Maverick). Lokal oder EU-Cloud betreibbar.'
WHERE name = 'Llama 3.1 70B' AND vendor = 'Meta';

UPDATE component_catalog
SET name        = 'Mistral Large 3',
    description = 'Europäisches LLM — Mistral Large 3 (MoE-Architektur, Dez. 2025). EU-Hosting, DSGVO-konform.'
WHERE name = 'Mistral Large' AND vendor = 'Mistral AI';

UPDATE component_catalog
SET name        = 'Ministral 3',
    description = 'Kompaktes Open-Source LLM von Mistral AI (Nachfolger von Mistral 7B). Apache 2.0, On-Premise geeignet.'
WHERE name = 'Mistral 7B' AND vendor = 'Mistral AI';

UPDATE component_catalog
SET description = 'Serverloser LLM-Zugriff auf Claude (Anthropic), Llama 4, Nova (Amazon) und weitere Modelle via API. Titan-Familie nicht mehr aktiv entwickelt.'
WHERE name = 'Amazon Bedrock' AND vendor = 'Amazon';

UPDATE component_catalog
SET description = 'Aktuelle OpenAI-Modelle (GPT-5.x-Generation) in Azure-Infrastruktur mit DSGVO-Verträgen und EU-Hosting-Option.'
WHERE name = 'Azure OpenAI Service' AND vendor = 'Microsoft';

-- ── Katalogquellen-URLs ────────────────────────────────────────────────────────

UPDATE catalog_sources
SET url = 'https://api.smith.langchain.com/api/v1/public-prompts'
WHERE type = 'langchain_hub';

UPDATE catalog_sources
SET url = 'https://your-cluster.weaviate.network'
WHERE type = 'weaviate';
