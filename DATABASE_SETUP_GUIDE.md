# Database Setup Guide

## Phase 1B: Database Migration & Integration

This guide will help you migrate from Excel-based data to Supabase PostgreSQL database.

---

## 📋 Prerequisites

1. **Supabase Account**: You already have one
   - URL: `https://gzcodbnkjrnqsyrjcgzq.supabase.co`
   - Anon Key: Already configured in `.env` files

2. **Excel File**: `rudraram_survey.xlsx` with sheets:
   - ✅ **Borewell** (52 records, 15 columns)
   - ✅ **Sumps** (4 records, 9 columns)
   - ✅ **OHTs** (5 records, 12 columns)

---

## 🗄️ Step 1: Create Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://gzcodbnkjrnqsyrjcgzq.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `database_schema.sql` from your project root
5. Copy the entire SQL script
6. Paste into the Supabase SQL Editor
7. Click **Run** (or press `Ctrl+Enter`)

**What this creates:**
- ✅ `users` table (authentication)
- ✅ `borewells` table (52 records from Excel)
- ✅ `sumps` table (4 records from Excel)
- ✅ `overhead_tanks` table (5 records from Excel)
- ✅ `audit_logs` table (track all changes)
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for fast queries
- ✅ Triggers for auto-updating timestamps
- ✅ `all_devices` view (unified access)
- ✅ Admin user (email: admin@rudraram-survey.local, password: admin123)

### Option B: Using psql Command Line

```bash
psql -h db.gzcodbnkjrnqsyrjcgzq.supabase.co -U postgres -d postgres -f database_schema.sql
```

---

## 📊 Step 2: Migrate Excel Data to Supabase

### Run Migration Script

```bash
cd backend-python
python migrate_excel_to_supabase.py
```

**What it does:**
1. Reads Excel file: `rudraram_survey.xlsx`
2. Extracts data from Borewell sheet → `borewells` table
3. Extracts data from Sumps sheet → `sumps` table
4. Extracts data from OHTs sheet → `overhead_tanks` table
5. Verifies record counts
6. Shows success/error summary

**Expected Output:**
```
================================================================================
RUDRARAM SURVEY - EXCEL TO SUPABASE MIGRATION
================================================================================
✓ Connected to Supabase: https://gzcodbnkjrnqsyrjcgzq.supabase.co
✓ Found Excel file: ../rudraram_survey.xlsx

Continue? (yes/no): yes

================================================================================
MIGRATING BOREWELLS
================================================================================
Found 52 records in Borewell sheet
  ✓ Inserted: ED-SCC-BW-001
  ✓ Inserted: ED-SCC-BW-002
  ...
✓ Borewells migration complete: 52 success, 0 errors

================================================================================
MIGRATING SUMPS
================================================================================
Found 4 records in Sumps sheet
  ✓ Inserted: ED-SCC-SM-001
  ...
✓ Sumps migration complete: 4 success, 0 errors

================================================================================
MIGRATING OVERHEAD TANKS (OHTs)
================================================================================
Found 5 records in OHTs sheet
  ✓ Inserted: ED-SCC-OHT-001
  ...
✓ Overhead tanks migration complete: 5 success, 0 errors

================================================================================
VERIFICATION
================================================================================

Records in database:
  Borewells: 52
  Sumps: 4
  Overhead Tanks: 5
  Total Devices: 61

================================================================================
MIGRATION SUMMARY
================================================================================
  Total Success: 61
  Total Errors: 0

✓ Migration complete!
```

---

## 🔧 Step 3: Update Backend to Use Database

The backend (`app.py`) needs to be updated to use Supabase instead of Excel file.

### Current Flow (Excel-based):
```
Request → Fetch Excel from GitHub → Parse with pandas → Return JSON
```

### New Flow (Database-based):
```
Request → Query Supabase → Return JSON
```

### Integration Points:

1. **GET /api/survey-data** → Use `get_all_devices()` or `get_devices_by_type()`
2. **GET /api/survey-data/stats** → Use `get_device_statistics()`
3. **GET /api/device/{code}** → Use `get_device_by_code()`
4. **Authentication** → Replace `users_db` dict with `get_user_by_email()`

---

## 🧪 Step 4: Test Database Connection

### Test in Python REPL:

```python
cd backend-python
python

>>> from database.operations import get_all_borewells, get_device_statistics
>>> import asyncio

# Test fetching borewells
>>> asyncio.run(get_all_borewells())
[{'id': '...', 'survey_code': 'ED-SCC-BW-001', ...}, ...]

# Test statistics
>>> asyncio.run(get_device_statistics())
{
    'total_devices': 61,
    'by_type': {
        'borewells': 52,
        'sumps': 4,
        'overhead_tanks': 5
    },
    ...
}
```

### Test via Supabase Dashboard:

1. Go to **Table Editor** in Supabase dashboard
2. Click on `borewells` table
3. You should see 52 records
4. Click on `sumps` → 4 records
5. Click on `overhead_tanks` → 5 records

---

## 🔍 Step 5: Verify Data Integrity

### Check Sample Records:

**Borewell:**
```sql
SELECT * FROM borewells WHERE survey_code = 'ED-SCC-BW-001';
```

Expected:
- Zone: SC Colony
- Location: Water Works Yard (Bore 1)
- Status: Working
- Depth: 650'
- Motor: 7.5 HP

**Sump:**
```sql
SELECT * FROM sumps WHERE survey_code = 'ED-SCC-SM-001';
```

Expected:
- Zone: SC Colony
- Location: Water Works Yard
- Capacity: 100,000 L

**Overhead Tank:**
```sql
SELECT * FROM overhead_tanks LIMIT 1;
```

---

## 📊 Excel Schema Mapping

### Borewell Sheet → borewells Table

| Excel Column | Database Column | Type | Notes |
|-------------|----------------|------|-------|
| Sr. No. | sr_no | INTEGER | Serial number |
| Survey Code (ID) | survey_code | TEXT | Primary identifier |
| Original Name | original_name | TEXT | Original device name |
| Zone | zone | TEXT | SC Colony, etc. |
| Location | location | TEXT | Physical location |
| Status | status | TEXT | Working/Non-Working |
| Depth (ft) | depth_ft | TEXT | e.g., "650'" |
| Motor HP | motor_hp | TEXT | e.g., "7.5 HP" |
| Pipe Size (inch) | pipe_size_inch | FLOAT | Pipe diameter |
| Houses Connected | houses_connected | INTEGER | Number of houses |
| Daily Usage (Hrs) | daily_usage_hrs | FLOAT | Hours per day |
| Power Type (1Ph/3Ph) | power_type | TEXT | Phase type |
| Notes | notes | TEXT | Additional notes |
| Images | images | TEXT | Image URLs |
| Done | done | BOOLEAN | Completion status |

### Sumps Sheet → sumps Table

| Excel Column | Database Column | Type |
|-------------|----------------|------|
| Survey Code (ID) | survey_code | TEXT |
| Zone | zone | TEXT |
| Location | location | TEXT |
| Capacity | capacity | TEXT |
| Tank Dimensions | tank_height_m | FLOAT |
| - | tank_width_m | FLOAT |
| - | tank_length_m | FLOAT |
| Power Distance (m) | power_distance_m | FLOAT |
| Images | images | TEXT |

### OHTs Sheet → overhead_tanks Table

| Excel Column | Database Column | Type |
|-------------|----------------|------|
| Survey Code (ID) | survey_code | TEXT |
| Zone | zone | TEXT |
| Location | location | TEXT |
| Capacity | capacity | TEXT |
| Type | type | TEXT |
| Tank Dimensions | tank_height_m | FLOAT |
| - | tank_width_m | FLOAT |
| - | tank_length_m | FLOAT |
| Material | material | TEXT |
| Lid Access? | lid_access | BOOLEAN |
| Houses Connected | houses_connected | INTEGER |
| Images | images | TEXT |

---

## 🔐 Security Features

### Row Level Security (RLS)

**Viewing data:**
- ✅ Anyone can view all devices (borewells, sumps, OHTs)
- ✅ Users can view their own profile
- ✅ Admins can view all users

**Modifying data:**
- ✅ Authenticated users can insert/update devices
- ✅ Only admins can delete devices
- ✅ Audit logs track all changes

### Test RLS Policies:

```sql
-- This should work (public read)
SELECT COUNT(*) FROM borewells;

-- This requires authentication
INSERT INTO borewells (survey_code, zone, location) 
VALUES ('TEST-001', 'Test Zone', 'Test Location');
```

---

## 🚀 Next Steps

1. ✅ **Create tables** using `database_schema.sql`
2. ✅ **Run migration** with `migrate_excel_to_supabase.py`
3. ⏳ **Update backend** to use database operations
4. ⏳ **Test API endpoints** with real database
5. ⏳ **Update frontend** to handle new data structure
6. ⏳ **Add real-time subscriptions** for live updates

---

## 🐛 Troubleshooting

### Error: "Supabase credentials not found"
```bash
# Make sure .env.development has:
SUPABASE_URL=https://gzcodbnkjrnqsyrjcgzq.supabase.co
SUPABASE_KEY=your-anon-key
```

### Error: "Table does not exist"
- Run `database_schema.sql` in Supabase SQL Editor first

### Error: "Duplicate key violation"
- Clear existing data:
```sql
TRUNCATE borewells, sumps, overhead_tanks CASCADE;
```

### Error: "Permission denied for table"
- Check RLS policies in Supabase dashboard
- Ensure you're using the anon key, not service key

---

## 📞 Need Help?

1. **Check Supabase logs**: Dashboard → Logs
2. **View table data**: Dashboard → Table Editor
3. **Test SQL queries**: Dashboard → SQL Editor
4. **Check RLS**: Dashboard → Authentication → Policies

---

## ✅ Success Checklist

- [ ] Supabase project accessible
- [ ] `database_schema.sql` executed successfully
- [ ] All 5 tables created (users, borewells, sumps, overhead_tanks, audit_logs)
- [ ] RLS policies enabled
- [ ] Migration script ran without errors
- [ ] 52 borewells in database
- [ ] 4 sumps in database
- [ ] 5 overhead tanks in database
- [ ] Admin user created
- [ ] Database operations module works
- [ ] Backend can query Supabase

---

**After completing these steps, your system will be fully database-driven!** 🎉
