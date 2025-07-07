-- Create storage bucket for quote attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quote-attachments', 'quote-attachments', true);

-- Create storage policies for quote attachments
CREATE POLICY "Anyone can view quote attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'quote-attachments');

CREATE POLICY "Authenticated users can upload quote attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'quote-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own quote attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'quote-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own quote attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'quote-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);