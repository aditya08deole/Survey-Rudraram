-- ============================================================================
-- DROP ALL EXISTING TABLES
-- Run this FIRST before running database_schema.sql
-- Note: overhead_tanks table stores OHSR (Overhead Service Reservoir) data
-- ============================================================================

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Anyone can view borewells" ON borewells;
DROP POLICY IF EXISTS "Authenticated users can insert borewells" ON borewells;
DROP POLICY IF EXISTS "Authenticated users can update borewells" ON borewells;
DROP POLICY IF EXISTS "Admins can delete borewells" ON borewells;
DROP POLICY IF EXISTS "Anyone can view sumps" ON sumps;
DROP POLICY IF EXISTS "Authenticated users can insert sumps" ON sumps;
DROP POLICY IF EXISTS "Authenticated users can update sumps" ON sumps;
DROP POLICY IF EXISTS "Admins can delete sumps" ON sumps;
DROP POLICY IF EXISTS "Anyone can view overhead_tanks" ON overhead_tanks;
DROP POLICY IF EXISTS "Authenticated users can insert overhead_tanks" ON overhead_tanks;
DROP POLICY IF EXISTS "Authenticated users can update overhead_tanks" ON overhead_tanks;
DROP POLICY IF EXISTS "Admins can delete overhead_tanks" ON overhead_tanks;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

-- Drop views
DROP VIEW IF EXISTS all_devices CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_borewells_updated_at ON borewells CASCADE;
DROP TRIGGER IF EXISTS update_sumps_updated_at ON sumps CASCADE;
DROP TRIGGER IF EXISTS update_overhead_tanks_updated_at ON overhead_tanks CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop tables (in reverse order due to foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS overhead_tanks CASCADE;  -- Stores OHSR data
DROP TABLE IF EXISTS sumps CASCADE;
DROP TABLE IF EXISTS borewells CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Success message
SELECT 'All tables dropped successfully! Ready for fresh schema.' as message;
