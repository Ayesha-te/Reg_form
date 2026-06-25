CREATE TABLE public.registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text NOT NULL,
  mobile text NOT NULL,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  interests text[] NOT NULL DEFAULT '{}',
  country text NOT NULL,
  city text NOT NULL,
  photo_path text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.registrations TO anon;
GRANT SELECT, INSERT ON public.registrations TO authenticated;
GRANT ALL ON public.registrations TO service_role;

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a registration"
  ON public.registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);