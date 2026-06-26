INSERT INTO storage.buckets (id, name, public)
VALUES ('registration-photos', 'registration-photos', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

CREATE POLICY "Anyone can view registration photos"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'registration-photos');
