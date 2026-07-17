-- Add English localisation fields to roles_catalog
alter table roles_catalog
  add column if not exists description_en     text,
  add column if not exists responsibilities_en text[];

update roles_catalog set
  description_en = 'Owns the strategic deployment of AI across the organisation. Prioritises use cases, aligns with business stakeholders, and ensures AI projects contribute to corporate objectives.',
  responsibilities_en = array['Use-case prioritisation and roadmap management','Business stakeholder alignment','ROI tracking for AI initiatives','Maintaining the product backlog for AI features']
where role_name = 'AI Product Owner';

update roles_catalog set
  description_en = 'Ambassador for AI within the business unit. Identifies usage potential, coordinates with IT, and empowers colleagues in the use of AI tools.',
  responsibilities_en = array['Identifying AI usage potential within the business unit','Training and enabling business colleagues','Channelling business unit feedback to AI teams','Initiating quick-win AI projects']
where role_name = 'Business AI Champion';

update roles_catalog set
  description_en = 'Ensures GDPR compliance across all AI projects. Assesses data-protection risks, prepares DPIAs, and coordinates with the Data Protection Officer.',
  responsibilities_en = array['Conducting Data Protection Impact Assessments (DPIAs)','Reviewing and approving data-processing agreements','Evaluating data-protection risks in AI projects','Delivering GDPR training and awareness']
where role_name = 'Data Privacy Manager';

update roles_catalog set
  description_en = 'Builds and operates scalable data pipelines. Provides quality-assured, ML-ready datasets and owns the data infrastructure.',
  responsibilities_en = array['Developing and operating data pipelines (ELT/ETL)','Implementing data-quality monitoring','Populating and maintaining the feature store','Scaling the data infrastructure']
where role_name = 'Data Engineer';

update roles_catalog set
  description_en = 'Develops and trains ML models for defined use cases. Conducts exploratory data analyses and translates business requirements into statistical models.',
  responsibilities_en = array['Developing, training, and evaluating ML models','Conducting feature engineering','Documenting model performance','Ensuring experiment tracking and reproducibility']
where role_name = 'Data Scientist';

update roles_catalog set
  description_en = 'Builds production-ready ML systems and serving infrastructure. Optimises model performance for latency and throughput, and implements batch and real-time inference.',
  responsibilities_en = array['Optimising and containerising ML models for production','Implementing inference APIs and serving layers','Building batch and streaming inference pipelines','Providing A/B testing infrastructure']
where role_name = 'ML Engineer';

update roles_catalog set
  description_en = 'Automates the ML lifecycle from experiment to production. Builds CI/CD pipelines for models and implements monitoring for data drift and model degradation.',
  responsibilities_en = array['Building CI/CD pipelines for model training and deployment','Implementing model monitoring and alerting','Automating retraining processes','Operating the ML platform (MLflow, Kubeflow, etc.)']
where role_name = 'MLOps Engineer';

update roles_catalog set
  description_en = 'Leads the AI Centre of Excellence and coordinates all AI initiatives across the organisation. Sets standards, promotes knowledge transfer, and builds AI capabilities.',
  responsibilities_en = array['Developing AI strategy and governance frameworks','Establishing AI standards and best practices','Coordinating talent development and training','Ensuring AI portfolio overview and prioritisation']
where role_name = 'AI CoE Lead';

update roles_catalog set
  description_en = 'Accountable at C-level for the organisation''s data strategy and AI governance. Secures organisational resources and embeds a data-driven decision culture.',
  responsibilities_en = array['Owning data strategy and AI vision','Securing budget and resources for data/AI teams','Aligning and convincing executive stakeholders','Enforcing data governance at enterprise level']
where role_name = 'Chief Data Officer (CDO)';

update roles_catalog set
  description_en = 'Specialist in the optimal use of large language models. Develops and tests prompt strategies, RAG architectures, and evaluation frameworks for generative AI systems.',
  responsibilities_en = array['Developing and systematically evaluating prompt strategies','Implementing RAG (Retrieval-Augmented Generation) architectures','Assessing LLM output quality and hallucination risks','Maintaining prompt templates and libraries']
where role_name = 'Prompt Engineer';

update roles_catalog set
  description_en = 'Ensures AI systems are fair, transparent, and compliant with the EU AI Act. Conducts bias audits, assesses societal risks, and develops governance frameworks.',
  responsibilities_en = array['Conducting bias and fairness audits for ML models','Coordinating EU AI Act compliance assessments','Maintaining and updating the AI risk register','Developing ethics guidelines for AI development']
where role_name = 'AI Ethics / Risk Officer';

update roles_catalog set
  description_en = 'Specialist in integrating AI into SAP system landscapes. Plans SAP BTP, AI Core, and Joule implementations, and connects AI use cases with SAP business processes.',
  responsibilities_en = array['Planning and implementing SAP BTP and AI Core architecture','Connecting AI use cases with SAP modules (S/4HANA, ECC)','Configuring SAP Joule and embedded AI','Aligning the SAP AI roadmap with business requirements']
where role_name = 'SAP AI Architect';

update roles_catalog set
  description_en = 'Responsible for the holistic AI architecture in the enterprise context. Ensures the integration of AI components into existing IT landscapes and defines technical standards.',
  responsibilities_en = array['Developing an enterprise-wide AI reference architecture','Planning the integration of AI with existing enterprise systems','Defining technology standards and architectural principles','Supporting build-vs-buy decisions for AI platforms']
where role_name = 'Enterprise Architect (AI)';
