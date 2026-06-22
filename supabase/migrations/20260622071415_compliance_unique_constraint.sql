-- Unique constraint enables upsert (ON CONFLICT) per user + regulation + check_type
ALTER TABLE public.compliance_checks
  ADD CONSTRAINT compliance_checks_user_reg_type_unique
  UNIQUE (user_id, regulation, check_type);

-- updated_at column for last-modified tracking
ALTER TABLE public.compliance_checks
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Auto-update trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_compliance_checks_updated_at
  BEFORE UPDATE ON public.compliance_checks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
