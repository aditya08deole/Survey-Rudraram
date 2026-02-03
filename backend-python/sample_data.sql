-- Sample data for testing the Rudraram Survey application
-- Run this in Supabase SQL Editor to populate your tables with test data

-- Insert sample borewells
INSERT INTO borewells (survey_code, original_name, zone, location, status, depth_ft, motor_hp, pipe_size_inch, power_type, houses_connected, daily_usage_hrs, latitude, longitude) VALUES
('BW-001', 'Main Street Borewell', 'Zone A', 'Main Street', 'Working', '650', '7.5 HP', '2 inch', '3Ph', 50, 8.0, 17.4850, 78.3570),
('BW-002', 'Market Borewell', 'Zone A', 'Market Area', 'Working', '500', '5 HP', '1.5 inch', '1Ph', 30, 6.0, 17.4860, 78.3580),
('BW-003', 'School Borewell', 'Zone B', 'School Road', 'Not Working', '700', '10 HP', '2 inch', '3Ph', 40, 0, 17.4870, 78.3590);

-- Insert sample sumps
INSERT INTO sumps (survey_code, original_name, zone, location, capacity, tank_height_m, power_distance_m, latitude, longitude) VALUES
('SM-001', 'Central Sump', 'Zone A', 'Central Square', '100000 L', '3 m', 50, 17.4855, 78.3575),
('SM-002', 'East Sump', 'Zone B', 'East Colony', '50000 L', '2.5 m', 30, 17.4865, 78.3585);

-- Insert sample overhead tanks  
INSERT INTO overhead_tanks (survey_code, original_name, zone, location, capacity, tank_height_m, material, type, houses_connected, latitude, longitude) VALUES
('OH-001', 'Main OHSR', 'Zone A', 'Main Tower', '200000 L', '25 m', 'RCC', 'OHSR', 100, 17.4845, 78.3565),
('OH-002', 'Colony OHSR', 'Zone B', 'Colony Area', '150000 L', '20 m', 'Steel', 'OHSR', 80, 17.4875, 78.3595);

-- Verify data was inserted
SELECT 'Borewells' as table_name, COUNT(*) as count FROM borewells
UNION ALL
SELECT 'Sumps', COUNT(*) FROM sumps
UNION ALL
SELECT 'Overhead Tanks', COUNT(*) FROM overhead_tanks;
