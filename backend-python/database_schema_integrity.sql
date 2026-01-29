-- PHASE 8: DATA INTEGRITY
-- Enforce relationship between Devices and Images

-- 1. Ensure devices.survey_id is UNIQUE/PK
-- (It should be, but let's be safe. If it fails, we have duplicates to clean first)
ALTER TABLE devices 
ADD CONSTRAINT devices_survey_id_key UNIQUE (survey_id);

-- 2. Add Foreign Key Constraint
-- This ensures we can't upload an image for a device that doesn't exist
-- ON DELETE CASCADE: If a device is deleted, delete its images? 
-- Let's say YES for clean-up, or SET NULL if we want to keep them.
-- Given it's a "Survey", orphan images are useless. CASCADE is safer for hygiene.

ALTER TABLE device_images
ADD CONSTRAINT fk_device_images_device
FOREIGN KEY (survey_code)
REFERENCES devices(survey_id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- 3. Validation View (Optional)
-- View to find images with no matching device (orphans) BEFORE applying FK
-- (Run this SELECT manually if the ALTER fails)
-- SELECT * FROM device_images WHERE survey_code NOT IN (SELECT survey_id FROM devices);
