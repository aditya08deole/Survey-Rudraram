"""
Excel to Supabase Migration Script

Imports data from Excel sheets to Supabase tables:
- Borewell sheet -> borewells table (52 records)
- Sumps sheet -> sumps table (4 records)
- OHTs sheet -> overhead_tanks table (5 records)
"""

import pandas as pd
import sys
import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('.env.development')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Supabase credentials not found!")
    print("Please set SUPABASE_URL and SUPABASE_KEY in .env.development")
    sys.exit(1)

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
print(f"✓ Connected to Supabase: {SUPABASE_URL}")

# Excel file path
EXCEL_FILE = '../rudraram_survey.xlsx'

def clean_value(value):
    """Clean pandas values (handle NaN, etc.)"""
    if pd.isna(value):
        return None
    if isinstance(value, (int, float)):
        if pd.isna(value):
            return None
        return value
    return str(value).strip() if value else None


def migrate_borewells():
    """Migrate Borewell sheet to borewells table"""
    print("\n" + "="*80)
    print("MIGRATING BOREWELLS")
    print("="*80)
    
    df = pd.read_excel(EXCEL_FILE, sheet_name='Borewell')
    print(f"Found {len(df)} records in Borewell sheet")
    
    success_count = 0
    error_count = 0
    
    for idx, row in df.iterrows():
        try:
            data = {
                "sr_no": int(row['Sr. No.']) if pd.notna(row['Sr. No.']) else None,
                "survey_code": clean_value(row['Survey Code (ID)']),
                "original_name": clean_value(row['Original Name']),
                "zone": clean_value(row['Zone']),
                "location": clean_value(row['Location']),
                "status": clean_value(row['Status']),
                "depth_ft": clean_value(row['Depth (ft)']),
                "motor_hp": clean_value(row['Motor HP']),
                "pipe_size_inch": clean_value(row['Pipe Size (inch)']),  # Changed to TEXT
                "power_type": clean_value(row['Power Type (1Ph/3Ph)']),
                "houses_connected": int(row['Houses Connected']) if pd.notna(row['Houses Connected']) else None,
                "daily_usage_hrs": float(row['Daily Usage (Hrs)']) if pd.notna(row['Daily Usage (Hrs)']) else None,
                "latitude": float(row['Latitude']) if pd.notna(row['Latitude']) else None,
                "longitude": float(row['Longitude']) if pd.notna(row['Longitude']) else None,
                "notes": clean_value(row['Notes']),
                "images": clean_value(row['Images']),
                "done": bool(row['Done']) if pd.notna(row['Done']) else False
            }
            
            # Insert to Supabase
            result = supabase.table("borewells").insert(data).execute()
            success_count += 1
            print(f"  ✓ Inserted: {data['survey_code']}")
            
        except Exception as e:
            error_count += 1
            print(f"  ✗ Error at row {idx+1}: {e}")
    
    print(f"\n✓ Borewells migration complete: {success_count} success, {error_count} errors")
    return success_count, error_count


def migrate_sumps():
    """Migrate Sumps sheet to sumps table"""
    print("\n" + "="*80)
    print("MIGRATING SUMPS")
    print("="*80)
    
    df = pd.read_excel(EXCEL_FILE, sheet_name='Sumps')
    print(f"Found {len(df)} records in Sumps sheet")
    
    success_count = 0
    error_count = 0
    
    # Note: The Excel has header rows in the data, skip first row if it's headers
    for idx, row in df.iterrows():
        try:
            survey_code = clean_value(row['Survey Code (ID)'])
            
            # Skip header rows or empty rows
            if not survey_code or survey_code == 'Survey Code (ID)':
                continue
            
            data = {
                "survey_code": survey_code,
                "original_name": clean_value(row['Original Name']),
                "zone": clean_value(row['Zone']),
                "location": clean_value(row['Location']),
                "capacity": clean_value(row['Capacity']),
                "tank_height_m": clean_value(row['Tank Height (m)']),
                "tank_circumference": clean_value(row['Tank Circumference']),
                "latitude": float(row['Latitude']) if pd.notna(row['Latitude']) else None,
                "longitude": float(row['Longitude']) if pd.notna(row['Longitude']) else None,
                "power_distance_m": float(row['Power Distance (m)']) if pd.notna(row['Power Distance (m)']) else None,
                "notes": clean_value(row.get('Note')),
                "images": clean_value(row['Images'])
            }
            
            # Insert to Supabase
            result = supabase.table("sumps").insert(data).execute()
            success_count += 1
            print(f"  ✓ Inserted: {data['survey_code']}")
            
        except Exception as e:
            error_count += 1
            print(f"  ✗ Error at row {idx+1}: {e}")
    
    print(f"\n✓ Sumps migration complete: {success_count} success, {error_count} errors")
    return success_count, error_count


def migrate_overhead_tanks():
    """Migrate OHSR sheet to overhead_tanks table"""
    print("\n" + "="*80)
    print("MIGRATING OVERHEAD TANKS (OHSR)")
    print("="*80)
    
    df = pd.read_excel(EXCEL_FILE, sheet_name='OHSR')
    print(f"Found {len(df)} records in OHSR sheet")
    
    success_count = 0
    error_count = 0
    
    for idx, row in df.iterrows():
        try:
            survey_code = clean_value(row['Survey Code (ID)'])
            
            # Skip header rows or empty rows
            if not survey_code:
                continue
            
            data = {
                "survey_code": survey_code,
                "original_name": clean_value(row['Original Name']),
                "zone": clean_value(row['Zone']),
                "location": clean_value(row['Location']),
                "capacity": clean_value(row['Capacity']),
                "type": clean_value(row['Type']),
                "tank_height_m": clean_value(row['Tank Height (m)']),
                "latitude": float(row['Latitude']) if pd.notna(row['Latitude']) else None,
                "longitude": float(row['Longitude']) if pd.notna(row['Longitude']) else None,
                "material": clean_value(row['Material']),
                "lid_access": clean_value(row['Lid Access?']),
                "houses_connected": int(row['Houses Connected']) if pd.notna(row['Houses Connected']) else None,
                "images": clean_value(row['Images'])
            }
            
            # Insert to Supabase
            result = supabase.table("overhead_tanks").insert(data).execute()
            success_count += 1
            print(f"  ✓ Inserted: {data['survey_code']}")
            
        except Exception as e:
            error_count += 1
            print(f"  ✗ Error at row {idx+1}: {e}")
    
    print(f"\n✓ Overhead tanks migration complete: {success_count} success, {error_count} errors")
    return success_count, error_count


def verify_migration():
    """Verify data was migrated correctly"""
    print("\n" + "="*80)
    print("VERIFICATION")
    print("="*80)
    
    # Count records in each table
    borewells_count = len(supabase.table("borewells").select("id").execute().data)
    sumps_count = len(supabase.table("sumps").select("id").execute().data)
    ohts_count = len(supabase.table("overhead_tanks").select("id").execute().data)
    
    print(f"\nRecords in database:")
    print(f"  Borewells: {borewells_count}")
    print(f"  Sumps: {sumps_count}")
    print(f"  Overhead Tanks: {ohts_count}")
    print(f"  Total Devices: {borewells_count + sumps_count + ohts_count}")
    
    return borewells_count, sumps_count, ohts_count


def main():
    """Run migration"""
    print("="*80)
    print("RUDRARAM SURVEY - EXCEL TO SUPABASE MIGRATION")
    print("="*80)
    
    try:
        # Check if Excel file exists
        if not os.path.exists(EXCEL_FILE):
            print(f"ERROR: Excel file not found: {EXCEL_FILE}")
            sys.exit(1)
        
        print(f"✓ Found Excel file: {EXCEL_FILE}")
        
        # Ask for confirmation
        print("\nThis will import data from Excel to Supabase.")
        print("Make sure you have created the tables using database_schema.sql")
        response = input("\nContinue? (yes/no): ")
        
        if response.lower() != 'yes':
            print("Migration cancelled.")
            sys.exit(0)
        
        # Run migrations
        bw_success, bw_errors = migrate_borewells()
        sumps_success, sumps_errors = migrate_sumps()
        ohts_success, ohts_errors = migrate_overhead_tanks()
        
        # Verify
        verify_migration()
        
        # Summary
        print("\n" + "="*80)
        print("MIGRATION SUMMARY")
        print("="*80)
        print(f"  Total Success: {bw_success + sumps_success + ohts_success}")
        print(f"  Total Errors: {bw_errors + sumps_errors + ohts_errors}")
        print("\n✓ Migration complete!")
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
