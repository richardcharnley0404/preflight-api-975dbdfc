
-- Create public bucket for artwork PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('artwork', 'artwork', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload artwork"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'artwork');

-- Allow public read access
CREATE POLICY "Public read access for artwork"
ON storage.objects FOR SELECT
USING (bucket_id = 'artwork');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own artwork"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'artwork' AND auth.uid()::text = (storage.foldername(name))[1]);
