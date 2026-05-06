
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-images', 'trip-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view trip images" ON storage.objects FOR SELECT USING (bucket_id = 'trip-images');
CREATE POLICY "Admins can upload trip images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'trip-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update trip images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'trip-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete trip images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'trip-images' AND has_role(auth.uid(), 'admin'::app_role));
