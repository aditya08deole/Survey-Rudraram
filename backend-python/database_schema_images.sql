-- Device Images Table
CREATE TABLE IF NOT EXISTS device_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    survey_code TEXT NOT NULL,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_by UUID, -- References auth.users
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_images_survey_code ON device_images(survey_code);

-- Storage Policies (Run in Supabase SQL Editor if buckets not public)
-- 1. Create Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('device-images', 'device-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow Public Read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'device-images' );

-- 3. Policy: Allow Authenticated Upload
CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'device-images' AND auth.role() = 'authenticated' );

-- 4. Policy: Allow Owners to Delete
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'device-images' AND auth.uid() = owner );
