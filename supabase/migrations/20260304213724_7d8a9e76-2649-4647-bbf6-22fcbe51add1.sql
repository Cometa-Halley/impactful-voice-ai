
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS structure jsonb DEFAULT '[]'::jsonb;
