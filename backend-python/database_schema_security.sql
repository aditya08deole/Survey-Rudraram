-- SECURITY HARDENING MIGRATION
-- Phase 4: Enable Row Level Security (RLS) on device_images

-- 1. Enable RLS
ALTER TABLE device_images ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Public Read Access
-- Anyone can view images (since they are for public survey visibility)
CREATE POLICY "Public Read Access"
ON device_images FOR SELECT
USING (true);

-- 3. Policy: Authenticated Insert Access
-- Only logged-in users can upload images
CREATE POLICY "Authenticated Insert"
ON device_images FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 4. Policy: Owner Delete Access
-- Users can only delete images they uploaded
CREATE POLICY "Owner Delete"
ON device_images FOR DELETE
USING (auth.uid() = uploaded_by);

-- 5. Policy: Admin/Owner Update Access (Optional, for strictly mapped updates)
CREATE POLICY "Owner Update"
ON device_images FOR UPDATE
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);
