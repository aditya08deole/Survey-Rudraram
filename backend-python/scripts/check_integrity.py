
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dashboard_app.core.config import get_settings

def check_integrity():
    print("🔍 Starting Data Integrity Check...")
    
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    
    # 1. Fetch all devices IDs
    print("Fetching devices...")
    device_res = supabase.table('devices').select('survey_id').execute()
    device_ids = set([d['survey_id'] for d in device_res.data])
    print(f"✅ Found {len(device_ids)} devices.")
    
    # 2. Fetch all image survey_codes
    print("Fetching images...")
    image_res = supabase.table('device_images').select('id, survey_code').execute()
    images = image_res.data
    print(f"✅ Found {len(images)} images.")
    
    # 3. Find Orphans
    orphans = []
    for img in images:
        if img['survey_code'] not in device_ids:
            orphans.append(img)
            
    if orphans:
        print(f"❌ Found {len(orphans)} ORPHAN images (No matching Device):")
        for o in orphans:
            print(f"   - Image ID: {o['id']} | Survey Code: {o['survey_code']}")
        print("\n⚠️  ACTION REQUIRED: Delete these orphans or create missing devices before running FK migration.")
    else:
        print("✅ No orphans found. Referential integrity is healthy.")
        print("🚀 You can safe to run 'database_schema_integrity.sql'.")

if __name__ == "__main__":
    check_integrity()
