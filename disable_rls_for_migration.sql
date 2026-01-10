-- ============================================================================
-- TEMPORARILY DISABLE RLS FOR MIGRATION
-- Run this BEFORE migration, then run enable_rls.sql AFTER migration
-- ============================================================================

-- Disable RLS on device tables (keep users/audit_logs protected)
ALTER TABLE borewells DISABLE ROW LEVEL SECURITY;
ALTER TABLE sumps DISABLE ROW LEVEL SECURITY;
ALTER TABLE overhead_tanks DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled for migration - run migration now, then enable_rls.sql' as message;
