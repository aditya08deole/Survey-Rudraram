"""
Quick Database Test Script

Tests connection to Supabase and shows record counts
"""

from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.development')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("="*60)
print("SUPABASE DATABASE CONNECTION TEST")
print("="*60)

# Check credentials
if not SUPABASE_URL or not SUPABASE_KEY:
    print("\n❌ ERROR: Supabase credentials not found!")
    print("\nPlease check .env.development file has:")
    print("  SUPABASE_URL=https://gzcodbnkjrnqsyrjcgzq.supabase.co")
    print("  SUPABASE_KEY=your-anon-key")
    exit(1)

print(f"\n✓ URL: {SUPABASE_URL}")
print(f"✓ Key: {SUPABASE_KEY[:20]}...")

# Create client
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("\n✓ Supabase client created successfully!")
except Exception as e:
    print(f"\n❌ Failed to create client: {e}")
    exit(1)

# Test connection and count records
print("\n" + "="*60)
print("CHECKING DATABASE TABLES")
print("="*60)

try:
    # Check borewells
    print("\n📊 Querying borewells table...")
    borewells = supabase.table("borewells").select("*", count="exact").execute()
    print(f"   ✓ Borewells: {borewells.count} records")
    
    # Check sumps
    print("\n📊 Querying sumps table...")
    sumps = supabase.table("sumps").select("*", count="exact").execute()
    print(f"   ✓ Sumps: {sumps.count} records")
    
    # Check overhead tanks
    print("\n📊 Querying overhead_tanks table...")
    ohts = supabase.table("overhead_tanks").select("*", count="exact").execute()
    print(f"   ✓ Overhead Tanks: {ohts.count} records")
    
    # Summary
    total = borewells.count + sumps.count + ohts.count
    print("\n" + "="*60)
    print(f"TOTAL DEVICES: {total}")
    print("="*60)
    
    # Show sample data
    if borewells.data and len(borewells.data) > 0:
        print("\n📋 Sample Borewell Record:")
        bw = borewells.data[0]
        print(f"   Survey Code: {bw.get('survey_code', 'N/A')}")
        print(f"   Zone: {bw.get('zone', 'N/A')}")
        print(f"   Location: {bw.get('location', 'N/A')}")
        print(f"   Status: {bw.get('status', 'N/A')}")
        print(f"   Depth: {bw.get('depth_ft', 'N/A')}")
        print(f"   Motor: {bw.get('motor_hp', 'N/A')}")
    
    if sumps.data and len(sumps.data) > 0:
        print("\n📋 Sample Sump Record:")
        sump = sumps.data[0]
        print(f"   Survey Code: {sump.get('survey_code', 'N/A')}")
        print(f"   Zone: {sump.get('zone', 'N/A')}")
        print(f"   Location: {sump.get('location', 'N/A')}")
        print(f"   Capacity: {sump.get('capacity', 'N/A')}")
    
    if ohts.data and len(ohts.data) > 0:
        print("\n📋 Sample Overhead Tank Record:")
        oht = ohts.data[0]
        print(f"   Survey Code: {oht.get('survey_code', 'N/A')}")
        print(f"   Zone: {oht.get('zone', 'N/A')}")
        print(f"   Location: {oht.get('location', 'N/A')}")
        print(f"   Capacity: {oht.get('capacity', 'N/A')}")
        print(f"   Type: {oht.get('type', 'N/A')}")
    
    print("\n" + "="*60)
    print("✅ DATABASE TEST SUCCESSFUL!")
    print("="*60)
    print("\nYour database is working correctly! 🎉")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print("\nPossible issues:")
    print("  1. Tables not created yet (run database_schema.sql in Supabase)")
    print("  2. Wrong credentials in .env.development")
    print("  3. Network/internet connection issue")
    print("\nSee MIGRATION_QUICK_START.md for detailed instructions.")
    exit(1)
