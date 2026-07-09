-- Wissens-Layer EN-Tranche: English translations of all 40 content blocks (Issue #118)
-- Mirrors 20260706062943_content_library_seed_tranche1.sql with locale='en'.
-- ON CONFLICT DO NOTHING — idempotent.

INSERT INTO public.content_library
  (module, context_key, category, title, content, source, display_order, is_published, locale)
VALUES

-- ============================================================
-- ASSESSMENT — assessment.dimensionen (6 blocks)
-- ============================================================

('assessment', 'assessment.dimensionen', 'definition',
 'What do the 6 readiness dimensions measure?',
 'The AI Readiness Score evaluates your organization across six areas: **Strategy & Leadership**, **Data & Infrastructure**, **Processes & Organization**, **Technology & Architecture**, **Talent & Culture**, and **Compliance & Governance**. Each dimension is scored on a 0–100 scale and feeds into the overall score with individual weighting. A score ≥ 70 across all dimensions is a prerequisite for sustainable AI operations.',
 'Book Ch. 2.1', 10, true, 'en'),

('assessment', 'assessment.dimensionen', 'best_practice',
 'Which dimension to strengthen first?',
 'Always start with **Data & Infrastructure** — it is the enabler of all other dimensions. Without clean, accessible data, even high-calibre AI projects fail during the pilot phase. Rule of thumb: invest 40 % of your AI budget in data quality and governance before moving into model development.',
 'Book Ch. 2.3', 20, true, 'en'),

('assessment', 'assessment.dimensionen', 'best_practice',
 'Interpreting archetypes correctly',
 '**Starter** (score < 40): focus on quick wins and pilot projects — no company-wide rollout. **Scaler** (40–70): systematize and scale existing pilots. **Transformer** (> 70): strategic AI differentiation and ecosystem building. The archetype determines the starting point of your roadmap — not your budget.',
 'Book Ch. 2.4', 30, true, 'en'),

('assessment', 'assessment.dimensionen', 'anti_pattern',
 'The "technology first" mistake',
 'Many organizations buy AI tools before completing the assessment. The result: tool graveyards, because data, processes or governance are missing. The correct sequence is: Assessment → Strategy → Pilot selection → Technology decision. Technology is the last variable, not the first.',
 'Book Ch. 2.2', 40, true, 'en'),

('assessment', 'assessment.dimensionen', 'checkliste',
 'Before the assessment: what to prepare?',
 '- [ ] Org chart + decision-makers identified for all 6 dimensions
- [ ] Inventory of existing data systems (ERP, CRM, DWH) completed
- [ ] Current IT security policies available
- [ ] Open compliance audits (GDPR, ISO 27001) known
- [ ] Budget framework for AI investments roughly outlined',
 'Book Ch. 2.5', 50, true, 'en'),

('assessment', 'assessment.dimensionen', 'hinweis',
 'Dimension score vs. overall score',
 'A high overall score can mask low individual dimensions. Always check the lowest dimension score — it is your actual bottleneck. A Transformer with an overall score of 75 but only 30 in "Compliance & Governance" will fail when deploying high-risk AI under the EU AI Act.',
 'Book Ch. 2.6', 60, true, 'en'),

-- ============================================================
-- USE-CASE SCORING — scoring.gates (6 blocks)
-- ============================================================

('usecase', 'scoring.gates', 'definition',
 'The 5-criteria scoring model',
 'Each use case is evaluated on five weighted criteria: **Strategic Fit** (alignment with company strategy), **Data Availability**, **Technical Feasibility**, **Business Value** (ROI potential), and **Risk & Compliance**. The weighted score places use cases in a 2×2 portfolio matrix: Champions, Quick Wins, Strategic Bets, and candidates to cut.',
 'Book Ch. 4.2', 10, true, 'en'),

('usecase', 'scoring.gates', 'best_practice',
 'Optimal portfolio size',
 'Keep your active AI portfolio to **3–7 use cases** — more overloads organization and budget. Start with one Champion and one Quick Win in parallel. Every new use case must displace an existing one or improve the portfolio''s overall score. Continuous pruning matters more than continuous addition.',
 'Book Ch. 4.4', 20, true, 'en'),

('usecase', 'scoring.gates', 'best_practice',
 'Adjust weights to your archetype',
 'The default weights are a starting point. **Starters** should weight data availability higher — missing data is the most common reason projects are cancelled. **Transformers** can emphasize strategic fit more, since infrastructure and data are already in place. Adjust weights in the settings area to match your organizational priorities.',
 'Book Ch. 4.3', 30, true, 'en'),

('usecase', 'scoring.gates', 'anti_pattern',
 'Avoiding quick-win bias',
 'Optimizing purely for quick wins leads to a portfolio of small, isolated AI projects with no strategic impact. Deliberately plan for **at least one strategic bet use case** — even if ROI only becomes visible in 18–24 months. AI competency is built on strategic projects, not quick wins.',
 'Book Ch. 4.5', 40, true, 'en'),

('usecase', 'scoring.gates', 'checkliste',
 'Use case qualification gate',
 '- [ ] Clear business owner with budget responsibility named
- [ ] Data sources identified and access clarified
- [ ] Initial privacy review (GDPR Art. 5/6) completed
- [ ] EU AI Act risk class pre-assessed (screening)
- [ ] Measurable success criteria (KPI) defined',
 'Book Ch. 4.1', 50, true, 'en'),

('usecase', 'scoring.gates', 'hinweis',
 'Link a canvas for deeper analysis',
 'Link each use case to an AI Use-Case Canvas — only then are compliance relevance and architecture requirements forwarded automatically. Use cases without a canvas link provide only a score, but no action recommendations for governance and architecture.',
 'Book Ch. 4.6', 60, true, 'en'),

-- ============================================================
-- CANVAS — canvas.intro (5 blocks)
-- ============================================================

('canvas', 'canvas.intro', 'definition',
 'What is the AI Use-Case Canvas?',
 'The AI Use-Case Canvas is a structured planning instrument with 8 fields: **Problem & Goal**, **Target Audience**, **Data Foundation**, **AI Method**, **Integration**, **Risks & Compliance**, **Success Metrics**, and **Next Steps**. It enforces completeness before the first line of code, and automatically feeds inputs into the Governance Check, Compliance screening, and Architecture Generator.',
 'Book Ch. 5.1', 10, true, 'en'),

('canvas', 'canvas.intro', 'best_practice',
 'Iterative canvas completion in 3 rounds',
 '**Round 1 (30 min):** stakeholders fill the canvas independently — differences reveal disagreements early. **Round 2 (60 min):** consensus workshop on differences — this is often where the most valuable insights emerge. **Round 3 (after pilot sprint):** update the canvas with real data. A canvas is never "finished" — it grows with the project.',
 'Book Ch. 5.3', 20, true, 'en'),

('canvas', 'canvas.intro', 'anti_pattern',
 'Technology fixation in the canvas',
 'The most common canvas mistake: the AI Method field is filled in first ("we want to use an LLM") before the problem and data foundation are clear. The result is a solution in search of a problem. Always fill the fields in order: Problem → Data → Method — never the other way around.',
 'Book Ch. 5.4', 30, true, 'en'),

('canvas', 'canvas.intro', 'checkliste',
 'Canvas completeness check',
 '- [ ] All 8 fields completed (no placeholders)
- [ ] Data foundation: origin, format, volume and freshness specified
- [ ] Compliance field: GDPR personal data relevance and EU AI Act risk class estimated
- [ ] Success metrics: at least one measurable KPI with a target value
- [ ] Next steps: pilot sprint planned (date, owner, budget)',
 'Book Ch. 5.5', 40, true, 'en'),

('canvas', 'canvas.intro', 'hinweis',
 'Compliance detection in the canvas',
 'The Navigator automatically detects compliance relevance from the text in your canvas — GDPR, EU AI Act, NIS2, ISO 27001, and more. The more precisely you describe your project (industry, data types, interfaces), the more accurate the compliance hints. Vague text yields no matches.',
 'Book Ch. 5.6', 50, true, 'en'),

-- ============================================================
-- GOVERNANCE — governance.raci (6 blocks)
-- ============================================================

('governance', 'governance.raci', 'definition',
 'The 6 governance gates at a glance',
 'The Governance Check guides you through six sequential gates: **Gate 1** Risk classification (EU AI Act), **Gate 2** Privacy pre-check (GDPR), **Gate 3** RACI & responsibilities, **Gate 4** Model documentation & explainability, **Gate 5** Pilot approval & monitoring, **Gate 6** Production deployment authorization. No gate can be skipped.',
 'Book Ch. 6.1', 10, true, 'en'),

('governance', 'governance.raci', 'best_practice',
 'Define the RACI matrix before Gate 1',
 'Establish Responsible, Accountable, Consulted, and Informed before the first gate — not after. Typical roles: **Accountable** = CISO or CDO, **Responsible** = Data Science Lead, **Consulted** = Data Protection Officer (mandatory when GDPR applies), **Informed** = Works Council (for AI systems affecting employees). Missing RACI clarity is the most common cause of project cancellations at Gate 3.',
 'Book Ch. 6.2', 20, true, 'en'),

('governance', 'governance.raci', 'best_practice',
 'Transfer governance results to the roadmap',
 'A "Conditionally approved" verdict is not a project dead-end — it is a structured action plan. Transfer all open points directly into Phase 0 of your roadmap: privacy gaps as sprint tasks, missing documentation as Definition-of-Done criteria. Use the "Send to Roadmap" button to transfer context automatically.',
 'Book Ch. 6.5', 30, true, 'en'),

('governance', 'governance.raci', 'anti_pattern',
 'Governance as a brake — a misconception',
 'Governance is often perceived as a brake on innovation. In reality, a structured governance process reduces time-to-production: teams that complete Gates 1–6 fully have 60 % fewer rework loops during rollout. The effort for Gates 1–4 (approx. 4–8 hours) is marginal compared to the cost of recalling a non-compliant system.',
 'Book Ch. 6.3', 40, true, 'en'),

('governance', 'governance.raci', 'policy_template',
 'Escalation path for governance conflicts',
 E'**Level 1 — Project level:** Data Science Lead + Data Protection Officer resolve internally (max. 5 working days).\n**Level 2 — Division level:** involve CISO + Legal; formal Risk Acceptance document required.\n**Level 3 — Board level:** for high-risk AI (EU AI Act Annex III) or public visibility; external legal counsel recommended.',
 'Book Ch. 6.4', 50, true, 'en'),

('governance', 'governance.raci', 'checkliste',
 'Gate 1: Risk classification checklist',
 '- [ ] EU AI Act scope checked (Art. 2 — geographic/personal scope)
- [ ] Risk class determined: Prohibited / High-risk (Annex III) / Limited / Minimal
- [ ] For high-risk: conformity assessment path identified
- [ ] Intended purpose documented (intended use per Art. 9)
- [ ] Data Protection Officer informed (mandatory when personal data involved)',
 'Book Ch. 6.6', 60, true, 'en'),

-- ============================================================
-- COMPLIANCE — compliance.policies (6 blocks)
-- ============================================================

('compliance', 'compliance.policies', 'definition',
 'EU AI Act risk classes at a glance',
 '**Prohibited AI** (Art. 5): social scoring, subliminal manipulation, real-time biometrics in public spaces. **High-risk** (Annex III): AI in critical infrastructure, education, personnel decisions, law enforcement, medical devices. **Limited risk** (Art. 50): chatbots — transparency obligation. **Minimal risk**: no special requirements. When in doubt, treat as high-risk as a starting point.',
 'Book Ch. 8.1', 10, true, 'en'),

('compliance', 'compliance.policies', 'best_practice',
 'Compliance before the pilot — not after',
 'GDPR Data Protection Impact Assessments (DPIA) and EU AI Act compliance checks belong in Phase 0, not during rollout. Retroactive compliance costs on average 4× more than preventive compliance. Rule of thumb: anything that processes personal data or makes automated decisions requires a DPIA under Art. 35 GDPR.',
 'Book Ch. 8.3', 20, true, 'en'),

('compliance', 'compliance.policies', 'anti_pattern',
 'GDPR consent as a cure-all',
 'Many teams rely on consent (Art. 6(1)(a) GDPR) because it sounds simplest. The problem: consent must be freely given — this is rarely achievable in employment contexts. For internal AI systems using employee data, **Art. 6(1)(b) or (c)** or a works agreement is the more robust legal basis.',
 'Book Ch. 8.4', 30, true, 'en'),

('compliance', 'compliance.policies', 'policy_template',
 'Data Processing Agreement (DPA) key points',
 E'A DPA with AI service providers must include:\n- **Art. 28 GDPR**: data processing on behalf explicitly agreed\n- **Sub-processors**: list of all sub-processors with right to object\n- **Third-country transfers**: EU Standard Contractual Clauses (Art. 46) or exclusion\n- **Data deletion**: deadline and confirmation after contract termination\n- **AI-specific**: no use of your data for model training without consent',
 'Book Ch. 8.5', 40, true, 'en'),

('compliance', 'compliance.policies', 'checkliste',
 'EU AI Act high-risk: obligations checklist',
 '- [ ] Risk management system (Art. 9) documented and tested
- [ ] Training data governance (Art. 10): quality, representativeness, bias review
- [ ] Technical documentation (Art. 11) created
- [ ] Automatic logging (Art. 12) implemented
- [ ] Transparency to users (Art. 13) ensured
- [ ] Human oversight (Art. 14) defined and trained
- [ ] Accuracy, robustness & cybersecurity (Art. 15) tested',
 'Book Ch. 8.6', 50, true, 'en'),

('compliance', 'compliance.policies', 'hinweis',
 'Transfer compliance status to other modules',
 'The compliance status set here (risk class, open actions) is automatically forwarded to the Governance Check and the Architecture Generator. You do not need to enter the risk class multiple times. Make sure the Compliance Check is up to date before starting Governance or Architecture.',
 'Book Ch. 8.7', 60, true, 'en'),

-- ============================================================
-- ARCHITECTURE — architecture.prinzipien (6 blocks)
-- ============================================================

('architecture', 'architecture.prinzipien', 'definition',
 'Vendor-neutral reference architecture',
 'The generated architecture follows a layered model: **Data layer** (capture, storage, preparation), **Platform layer** (orchestration, MLOps, monitoring), **Application layer** (models, APIs, business logic), **Access layer** (UI, integrations, security). Vendor neutrality means: every component is replaceable — decisions are made based on capabilities, not brand name.',
 'Book Ch. 9.1', 10, true, 'en'),

('architecture', 'architecture.prinzipien', 'best_practice',
 'API-first as a core principle',
 'All AI components — models, data pipelines, monitoring — should be accessed through defined APIs, never directly. Benefits: testability, versioning, and the ability to replace individual components without rebuilding the system. A model change (e.g., from GPT to Claude) should require at most one API configuration change — not an application rebuild.',
 'Book Ch. 9.3', 20, true, 'en'),

('architecture', 'architecture.prinzipien', 'best_practice',
 'Securing data sovereignty through EU hosting',
 'For systems involving personal data or confidential business data: ensure all data — including training and inference data — is processed exclusively on EU-based servers. Avoid "multi-region" defaults from global cloud providers that can automatically replicate data to the US. Document EU hosting in the DPA.',
 'Book Ch. 9.4', 30, true, 'en'),

('architecture', 'architecture.prinzipien', 'anti_pattern',
 'Vendor lock-in with AI platforms',
 'Proprietary AI platforms without an abstraction layer create strong dependencies: price increases, feature deprecations, and vendor insolvency then affect the entire AI portfolio. Recommendation: open-source orchestration layer between business logic and cloud services. Abstract LLM providers behind a unified API gateway.',
 'Book Ch. 9.5', 40, true, 'en'),

('architecture', 'architecture.prinzipien', 'checkliste',
 'Security requirements for AI systems',
 '- [ ] Authentication: OAuth 2.0 / OIDC for all API access
- [ ] Authorization: least-privilege principle, no shared service accounts
- [ ] Data encryption: TLS 1.3 in transit, AES-256 at rest
- [ ] Prompt injection protection: input sanitization at LLM interfaces
- [ ] Model monitoring: drift detection + automatic alerts
- [ ] Incident response plan: AI-specific scenarios documented',
 'Book Ch. 9.6', 50, true, 'en'),

('architecture', 'architecture.prinzipien', 'hinweis',
 'Assessment archetype determines architecture complexity',
 'The Navigator automatically adapts architecture recommendations to your assessment archetype. **Starters** receive a lean 2-layer architecture (PoC-optimized). **Scalers** receive a full 4-layer reference architecture with MLOps. **Transformers** additionally receive recommendations for AI ecosystem integration. Complete the assessment to receive personalized recommendations.',
 'Book Ch. 9.2', 60, true, 'en'),

-- ============================================================
-- ROADMAP — roadmap.phase0 (5 blocks)
-- ============================================================

('roadmap', 'roadmap.phase0', 'definition',
 'Phase 0: Quick wins as foundation',
 '**Phase 0 (0–3 months)** is the pilot phase: choose a well-scoped use case with high data availability and low compliance risk. The goal is not a perfect system, but a working proof-of-value that builds internal trust and yields first learnings. Budget rule of thumb: Phase 0 costs 5–15 % of the total project budget.',
 'Book Ch. 3.1', 10, true, 'en'),

('roadmap', 'roadmap.phase0', 'best_practice',
 'Pilot project criteria: what works?',
 'A good pilot project for Phase 0 satisfies: **clearly measurable value** (not "gaining AI experience"), **data already available** (no data collection phase needed), **not high-risk** under the EU AI Act (reduces compliance overhead), **an enthusiastic internal champion** (business unit, not IT), **completion in 6–10 weeks** realistically achievable. Start with the second-best use case — the best is usually too complex for Phase 0.',
 'Book Ch. 3.2', 20, true, 'en'),

('roadmap', 'roadmap.phase0', 'anti_pattern',
 'Avoiding big-bang rollouts',
 'Company-wide AI rollouts without a prior pilot fail in over 70 % of cases (McKinsey 2024). Common reasons: data quality issues only visible in production, user acceptance overestimated, governance gaps not anticipated. The roadmap deliberately enforces three phases — Phase 0 is not an optional step, it is a risk buffer.',
 'Book Ch. 3.4', 30, true, 'en'),

('roadmap', 'roadmap.phase0', 'checkliste',
 'Phase 0 acceptance criteria (pilot to scale)',
 '- [ ] Use case KPI achieved (target value from canvas)
- [ ] Technical debt documented (no hidden MVP debt)
- [ ] Governance check complete (Gates 1–6 signed off)
- [ ] User feedback collected (min. 10 qualitative interviews)
- [ ] Phase 0 cost/benefit reviewed — does the business case still hold?
- [ ] Scalability of chosen architecture confirmed',
 'Book Ch. 3.5', 40, true, 'en'),

('roadmap', 'roadmap.phase0', 'hinweis',
 'Roadmap and governance are linked',
 'Open governance points ("Conditionally approved") are automatically shown as Phase 0 tasks in the roadmap. Close governance gaps before starting Phase 1 — in Phase 1 the number of users increases and so does the risk profile. An open DPIA in Phase 1 is a regulatory reporting obligation, not an internal task anymore.',
 'Book Ch. 3.3', 50, true, 'en')

ON CONFLICT DO NOTHING;
