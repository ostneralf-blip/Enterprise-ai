-- Add primary_canvas_id to user_preferences for the Ergebnisse canvas tab
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS primary_canvas_id uuid REFERENCES canvases(id) ON DELETE SET NULL;
