-- ============================================================================
-- RE-ENABLE RLS AFTER MIGRATION
-- Run this AFTER successful migration to restore security
-- ============================================================================

-- Re-enable RLS on device tables
ALTER TABLE borewells ENABLE ROW LEVEL SECURITY;
ALTER TABLE sumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE overhead_tanks ENABLE ROW LEVEL SECURITY;

SELECT 'RLS re-enabled - database is now secure!' as message;
