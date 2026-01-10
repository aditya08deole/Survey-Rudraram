-- ============================================================================
-- RUDRARAM SURVEY DATABASE SCHEMA
-- Supabase PostgreSQL Schema for Water Infrastructure Survey
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (Authentication)
-- ============================================================================

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

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- BOREWELLS TABLE (52 records from Excel)
-- ============================================================================

CREATE TABLE borewells (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    sr_no INTEGER,
    survey_code TEXT UNIQUE NOT NULL,  -- e.g., "ED-SCC-BW-001"
    original_name TEXT,
    zone TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT,  -- Allow any text value for status
    
    -- Technical Specifications
    depth_ft TEXT,  -- e.g., "650'"
    motor_hp TEXT,  -- e.g., "7.5 HP"
    pipe_size_inch TEXT,  -- e.g., "1→3/4", "2 inch Metal", "1 PVC"
    power_type TEXT,  -- e.g., "1Ph" or "3Ph"
    
    -- Usage Data
    houses_connected INTEGER,
    daily_usage_hrs FLOAT,
    
    -- Geolocation
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Additional Info
    notes TEXT,
    images TEXT,  -- Could be URL or JSON array
    done BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for Borewells
CREATE INDEX idx_borewells_survey_code ON borewells(survey_code);
CREATE INDEX idx_borewells_zone ON borewells(zone);
CREATE INDEX idx_borewells_status ON borewells(status);
CREATE INDEX idx_borewells_location ON borewells(location);

-- ============================================================================
-- SUMPS TABLE (4 records from Excel)
-- ============================================================================

CREATE TABLE sumps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    survey_code TEXT UNIQUE NOT NULL,  -- e.g., "ED-SCC-SM-001"
    original_name TEXT,
    zone TEXT NOT NULL,
    location TEXT NOT NULL,
    
    -- Specifications
    capacity TEXT,  -- e.g., "100,000 L"
    tank_height_m TEXT,  -- e.g., "3 m"
    tank_circumference TEXT,  -- Tank circumference
    power_distance_m FLOAT,
    
    -- Geolocation
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Additional Info
    images TEXT,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for Sumps
CREATE INDEX idx_sumps_survey_code ON sumps(survey_code);
CREATE INDEX idx_sumps_zone ON sumps(zone);
CREATE INDEX idx_sumps_location ON sumps(location);

-- ============================================================================
-- OVERHEAD TANKS TABLE - Stores OHSR (Overhead Service Reservoir) data
-- Excel Sheet: "OHSR" (5 records)
-- ============================================================================

CREATE TABLE overhead_tanks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Info
    survey_code TEXT UNIQUE NOT NULL,  -- OHSR codes from Excel
    original_name TEXT,
    zone TEXT NOT NULL,
    location TEXT NOT NULL,
    
    -- Specifications
    capacity TEXT,  -- e.g., "50,000 L"
    type TEXT,  -- Type of tank (OHSR, CMSR, etc.)
    tank_height_m TEXT,  -- e.g., "3 m"
    material TEXT,  -- Tank material (Concrete, etc.)
    
    -- Geolocation
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    
    -- Access & Usage
    lid_access TEXT,  -- Text field for lid access info
    houses_connected INTEGER,
    
    -- Additional Info
    images TEXT,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for Overhead Tanks
CREATE INDEX idx_overhead_tanks_survey_code ON overhead_tanks(survey_code);
CREATE INDEX idx_overhead_tanks_zone ON overhead_tanks(zone);
CREATE INDEX idx_overhead_tanks_type ON overhead_tanks(type);
CREATE INDEX idx_overhead_tanks_location ON overhead_tanks(location);

-- ============================================================================
-- AUDIT LOGS TABLE (Track all changes)
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who & When
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
    
    -- What & Where
    entity_type TEXT NOT NULL,  -- 'borewell', 'sump', 'overhead_tank', 'user'
    entity_id UUID,
    
    -- Details
    changes JSONB,  -- Store old and new values
    ip_address TEXT,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE borewells ENABLE ROW LEVEL SECURITY;
ALTER TABLE sumps ENABLE ROW LEVEL SECURITY;
ALTER TABLE overhead_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Borewells policies
CREATE POLICY "Anyone can view borewells"
    ON borewells FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert borewells"
    ON borewells FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update borewells"
    ON borewells FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete borewells"
    ON borewells FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Sumps policies (same as borewells)
CREATE POLICY "Anyone can view sumps"
    ON sumps FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert sumps"
    ON sumps FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sumps"
    ON sumps FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete sumps"
    ON sumps FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Overhead Tanks policies (same as borewells)
CREATE POLICY "Anyone can view overhead_tanks"
    ON overhead_tanks FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert overhead_tanks"
    ON overhead_tanks FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update overhead_tanks"
    ON overhead_tanks FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete overhead_tanks"
    ON overhead_tanks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borewells_updated_at BEFORE UPDATE ON borewells
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sumps_updated_at BEFORE UPDATE ON sumps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overhead_tanks_updated_at BEFORE UPDATE ON overhead_tanks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA - Create admin user
-- ============================================================================

-- Insert admin user (password: admin123 - hashed with bcrypt)
INSERT INTO users (email, username, hashed_password, role)
VALUES (
    'admin@rudraram-survey.local',
    'admin',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5aeB6xYJ9T.8K',
    'admin'
);

-- ============================================================================
-- VIEWS FOR UNIFIED DEVICE ACCESS
-- ============================================================================

-- View to get all devices across all types
CREATE OR REPLACE VIEW all_devices AS
SELECT 
    id,
    survey_code,
    'borewell' AS device_type,
    zone,
    location,
    status,
    houses_connected,
    created_at,
    updated_at
FROM borewells

UNION ALL

SELECT 
    id,
    survey_code,
    'sump' AS device_type,
    zone,
    location,
    NULL AS status,
    NULL AS houses_connected,
    created_at,
    updated_at
FROM sumps

UNION ALL

SELECT 
    id,
    survey_code,
    'overhead_tank' AS device_type,
    zone,
    location,
    NULL AS status,
    houses_connected,
    created_at,
    updated_at
FROM overhead_tanks;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE borewells IS 'Borewell devices from Excel sheet "Borewell" (60 records)';
COMMENT ON TABLE sumps IS 'Sump tanks from Excel sheet "Sumps" (4 records)';
COMMENT ON TABLE overhead_tanks IS 'OHSR (Overhead Service Reservoirs) from Excel sheet "OHSR" (5 records)';
COMMENT ON TABLE users IS 'User authentication and authorization';
COMMENT ON TABLE audit_logs IS 'Audit trail for all database operations';

COMMENT ON VIEW all_devices IS 'Unified view of all devices across all types for dashboard';
