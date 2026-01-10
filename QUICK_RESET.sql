-- ============================================================================
-- COMPLETE RESET AND MIGRATION SETUP (RUN THIS ONE SCRIPT)
-- ============================================================================

-- Step 1: Drop everything
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

DROP VIEW IF EXISTS all_devices CASCADE;
DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
DROP TRIGGER IF EXISTS update_borewells_updated_at ON borewells CASCADE;
DROP TRIGGER IF EXISTS update_sumps_updated_at ON sumps CASCADE;
DROP TRIGGER IF EXISTS update_overhead_tanks_updated_at ON overhead_tanks CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS overhead_tanks CASCADE;
DROP TABLE IF EXISTS sumps CASCADE;
DROP TABLE IF EXISTS borewells CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create tables with NO status constraint
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE borewells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sr_no INTEGER,
    survey_code TEXT UNIQUE NOT NULL,
    original_name TEXT,
    zone TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT,  -- NO constraint - accepts any value
    depth_ft TEXT,
    motor_hp TEXT,
    pipe_size_inch TEXT,
    power_type TEXT,
    houses_connected INTEGER,
    daily_usage_hrs FLOAT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notes TEXT,
    images TEXT,
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE sumps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_code TEXT UNIQUE NOT NULL,
    original_name TEXT,
    zone TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity TEXT,
    tank_height_m TEXT,
    tank_circumference TEXT,
    power_distance_m FLOAT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    images TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE overhead_tanks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_code TEXT UNIQUE NOT NULL,
    original_name TEXT,
    zone TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity TEXT,
    type TEXT,
    tank_height_m TEXT,
    material TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    lid_access TEXT,
    houses_connected INTEGER,
    images TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_borewells_survey_code ON borewells(survey_code);
CREATE INDEX idx_borewells_zone ON borewells(zone);
CREATE INDEX idx_borewells_status ON borewells(status);
CREATE INDEX idx_sumps_survey_code ON sumps(survey_code);
CREATE INDEX idx_overhead_tanks_survey_code ON overhead_tanks(survey_code);

-- Step 4: RLS disabled for migration (will enable after)
ALTER TABLE borewells DISABLE ROW LEVEL SECURITY;
ALTER TABLE sumps DISABLE ROW LEVEL SECURITY;
ALTER TABLE overhead_tanks DISABLE ROW LEVEL SECURITY;

-- Step 5: Insert admin user
INSERT INTO users (email, username, hashed_password, role)
VALUES (
    'admin@rudraram-survey.local',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeB6xYJ9T.8K',
    'admin'
);

SELECT 'Database ready for migration! RLS is disabled. Run migration now.' as message;
