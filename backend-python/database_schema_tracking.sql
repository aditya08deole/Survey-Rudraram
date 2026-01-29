-- PHASE 14: SYNC HISTORY & AUDIT TRAIL
-- Tracking synchronization events from Excel to Supabase

-- 1. Sync History Table
CREATE TABLE IF NOT EXISTS public.sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ DEFAULT now(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    devices_synced INTEGER DEFAULT 0,
    error_message TEXT,
    triggered_by TEXT DEFAULT 'manual',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- Allow public read (for dashboard status)
CREATE POLICY "Public Read Sync History" ON public.sync_history
    FOR SELECT USING (true);

-- Allow authenticated insert/update
CREATE POLICY "Auth Manage Sync History" ON public.sync_history
    FOR ALL USING (auth.role() = 'authenticated');

-- 2. Audit Trail (Log Metadata Changes)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ DEFAULT now(),
    changed_by TEXT DEFAULT 'system'
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Audit Logs" ON public.audit_logs
    FOR SELECT USING (true);
