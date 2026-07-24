-- Persistierter Diagramm-Stil je Nutzer (Feature „Architektur-Diagramm").
-- JSONB: { art, connections, density } bzw. { preset: "<name>" }.
alter table public.user_preferences
  add column if not exists diagram_style jsonb;
