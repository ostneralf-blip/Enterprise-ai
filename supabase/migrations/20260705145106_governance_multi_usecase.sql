-- Governance Sessions: Multi-Use-Case-Auswahl
-- use_case_ids speichert ein Array von UUIDs der geprüften Use Cases.
-- use_case_id bleibt als primärer/erster Use Case für Rückwärtskompatibilität.

alter table governance_sessions
  add column if not exists use_case_ids jsonb not null default '[]'::jsonb;
