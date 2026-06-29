ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS jersey_name text,
  ADD COLUMN IF NOT EXISTS jersey_number text,
  ADD COLUMN IF NOT EXISTS jersey_size text,
  ADD COLUMN IF NOT EXISTS preferred_sleeves text,
  ADD COLUMN IF NOT EXISTS current_club text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS not_available_on text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fee_agreement boolean NOT NULL DEFAULT false;

ALTER TABLE public.registrations
  ALTER COLUMN date_of_birth DROP NOT NULL,
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN country DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL;
