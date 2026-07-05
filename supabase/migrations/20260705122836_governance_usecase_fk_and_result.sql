-- #65: Governance-Ergebnisse pro Use Case verknüpfen
-- governance_sessions erhält nullable FK auf use_cases
-- use_cases erhält governance_result Feld

ALTER TABLE governance_sessions
  ADD COLUMN IF NOT EXISTS use_case_id uuid REFERENCES use_cases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_governance_sessions_use_case_id
  ON governance_sessions(use_case_id);

ALTER TABLE use_cases
  ADD COLUMN IF NOT EXISTS governance_result text
    CHECK (governance_result IN ('approve', 'stop_dsgvo', 'stop_risk', 'improve'));

CREATE INDEX IF NOT EXISTS idx_use_cases_governance_result
  ON use_cases(governance_result);
