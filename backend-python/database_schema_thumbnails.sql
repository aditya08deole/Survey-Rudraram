-- PHASE 5 MIGRATION: THUMBNAILS
-- Add thumbnail_url column to device_images table

ALTER TABLE device_images 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update existing rows to use image_url as thumbnail (fallback)
UPDATE device_images 
SET thumbnail_url = image_url 
WHERE thumbnail_url IS NULL;
