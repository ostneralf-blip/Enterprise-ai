-- Add primary_usecase_id to user_preferences for the Ergebnisse usecase tab
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS primary_usecase_id uuid REFERENCES use_cases(id) ON DELETE SET NULL;
