CREATE POLICY "Anyone can upload registration photo"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'registration-photos');