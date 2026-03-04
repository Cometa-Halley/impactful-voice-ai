
-- Create storage bucket for video recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);

-- RLS: users can upload to their own folder
CREATE POLICY "Users upload own videos" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can read their own videos
CREATE POLICY "Users read own videos" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
