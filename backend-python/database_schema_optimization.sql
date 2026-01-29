-- Database Schema Optimization: Indexes for Performance
-- Focus: Accelerated filtering and geospatial queries

-- 1. Index for Borewells
-- Essential for Type/Zone filtering and Survey Code lookups
CREATE INDEX IF NOT EXISTS idx_borewells_survey_code ON borewells (survey_code);
CREATE INDEX IF NOT EXISTS idx_borewells_zone ON borewells (zone);
CREATE INDEX IF NOT EXISTS idx_borewells_status ON borewells (status);

-- 2. Index for Sumps
CREATE INDEX IF NOT EXISTS idx_sumps_survey_code ON sumps (survey_code);
CREATE INDEX IF NOT EXISTS idx_sumps_zone ON sumps (zone);

-- 3. Index for Overhead Tanks (OHSR/OHT)
CREATE INDEX IF NOT EXISTS idx_overhead_tanks_survey_code ON overhead_tanks (survey_code);
CREATE INDEX IF NOT EXISTS idx_overhead_tanks_zone ON overhead_tanks (zone);

-- 4. Geospatial (Optional but recommended if using PostGIS)
-- If latitude and longitude are stored as geometric points, use GIST
-- Assuming standard double precision columns for now, B-Tree is typically used for range queries
CREATE INDEX IF NOT EXISTS idx_borewells_gps ON borewells (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sumps_gps ON sumps (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_overhead_tanks_gps ON overhead_tanks (latitude, longitude);

-- 5. Sync History optimization
CREATE INDEX IF NOT EXISTS idx_sync_history_date ON sync_history (started_at DESC);
