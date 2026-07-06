-- Add primary_compliance_id to user_preferences for the Ergebnisse compliance tab
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS primary_compliance_id uuid REFERENCES compliance_checks(id) ON DELETE SET NULL;
