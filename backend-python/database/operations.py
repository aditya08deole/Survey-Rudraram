"""
Database Operations Module

Async Supabase CRUD operations for all device types:
- Borewells
- Sumps  
- Overhead Tanks (OHTs/OHSR)
"""

from supabase import create_client, Client
from typing import List, Dict, Any, Optional
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.warning("Supabase credentials not found in environment variables")
    supabase: Optional[Client] = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")


# ============================================================================
# BOREWELL OPERATIONS
# ============================================================================

async def get_all_borewells(filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
    """
    Fetch all borewells with optional filters
    
    Args:
        filters: Optional dict with zone, status, etc.
    
    Returns:
        List of borewell records
    """
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    query = supabase.table("borewells").select("*")
    
    if filters:
        if "zone" in filters:
            query = query.eq("zone", filters["zone"])
        if "status" in filters:
            query = query.eq("status", filters["status"])
    
    response = query.execute()
    return response.data


async def get_borewell_by_code(survey_code: str) -> Optional[Dict]:
    """Get single borewell by survey code"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("borewells").select("*").eq("survey_code", survey_code).execute()
    return response.data[0] if response.data else None


async def create_borewell(data: Dict[str, Any]) -> Dict:
    """Create new borewell record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("borewells").insert(data).execute()
    return response.data[0]


async def update_borewell(survey_code: str, data: Dict[str, Any]) -> Dict:
    """Update borewell record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("borewells").update(data).eq("survey_code", survey_code).execute()
    return response.data[0] if response.data else None


async def delete_borewell(survey_code: str) -> bool:
    """Delete borewell record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("borewells").delete().eq("survey_code", survey_code).execute()
    return len(response.data) > 0


# ============================================================================
# SUMP OPERATIONS
# ============================================================================

async def get_all_sumps(filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
    """Fetch all sumps with optional filters"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    query = supabase.table("sumps").select("*")
    
    if filters:
        if "zone" in filters:
            query = query.eq("zone", filters["zone"])
    
    response = query.execute()
    return response.data


async def get_sump_by_code(survey_code: str) -> Optional[Dict]:
    """Get single sump by survey code"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("sumps").select("*").eq("survey_code", survey_code).execute()
    return response.data[0] if response.data else None


async def create_sump(data: Dict[str, Any]) -> Dict:
    """Create new sump record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("sumps").insert(data).execute()
    return response.data[0]


async def update_sump(survey_code: str, data: Dict[str, Any]) -> Dict:
    """Update sump record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("sumps").update(data).eq("survey_code", survey_code).execute()
    return response.data[0] if response.data else None


async def delete_sump(survey_code: str) -> bool:
    """Delete sump record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("sumps").delete().eq("survey_code", survey_code).execute()
    return len(response.data) > 0


# ============================================================================
# OVERHEAD TANK OPERATIONS
# ============================================================================

async def get_all_overhead_tanks(filters: Optional[Dict[str, Any]] = None) -> List[Dict]:
    """Fetch all overhead tanks with optional filters"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    query = supabase.table("overhead_tanks").select("*")
    
    if filters:
        if "zone" in filters:
            query = query.eq("zone", filters["zone"])
        if "type" in filters:
            query = query.eq("type", filters["type"])
    
    response = query.execute()
    return response.data


async def get_overhead_tank_by_code(survey_code: str) -> Optional[Dict]:
    """Get single overhead tank by survey code"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("overhead_tanks").select("*").eq("survey_code", survey_code).execute()
    return response.data[0] if response.data else None


async def create_overhead_tank(data: Dict[str, Any]) -> Dict:
    """Create new overhead tank record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("overhead_tanks").insert(data).execute()
    return response.data[0]


async def update_overhead_tank(survey_code: str, data: Dict[str, Any]) -> Dict:
    """Update overhead tank record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("overhead_tanks").update(data).eq("survey_code", survey_code).execute()
    return response.data[0] if response.data else None


async def delete_overhead_tank(survey_code: str) -> bool:
    """Delete overhead tank record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("overhead_tanks").delete().eq("survey_code", survey_code).execute()
    return len(response.data) > 0


# ============================================================================
# UNIFIED DEVICE OPERATIONS
# ============================================================================

async def get_all_devices() -> List[Dict]:
    """
    Get all devices across all types using the unified view
    Returns combined list with device_type field
    """
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("all_devices").select("*").execute()
    return response.data


async def get_device_by_code(survey_code: str) -> Optional[Dict]:
    """
    Get any device by survey code (checks all tables)
    """
    # Try borewells
    device = await get_borewell_by_code(survey_code)
    if device:
        device['device_type'] = 'borewell'
        return device
    
    # Try sumps
    device = await get_sump_by_code(survey_code)
    if device:
        device['device_type'] = 'sump'
        return device
    
    # Try overhead tanks
    device = await get_overhead_tank_by_code(survey_code)
    if device:
        device['device_type'] = 'overhead_tank'
        return device
    
    return None


async def get_devices_by_type(device_type: str, filters: Optional[Dict] = None) -> List[Dict]:
    """
    Get devices of specific type
    
    Args:
        device_type: 'borewell', 'sump', or 'overhead_tank'
        filters: Optional filters
    """
    if device_type == 'borewell':
        return await get_all_borewells(filters)
    elif device_type == 'sump':
        return await get_all_sumps(filters)
    elif device_type == 'overhead_tank':
        return await get_all_overhead_tanks(filters)
    else:
        raise ValueError(f"Invalid device type: {device_type}")


# ============================================================================
# USER OPERATIONS
# ============================================================================

async def get_user_by_email(email: str) -> Optional[Dict]:
    """Get user by email"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("users").select("*").eq("email", email).execute()
    return response.data[0] if response.data else None


async def create_user(email: str, username: str, hashed_password: str, role: str = "user") -> Dict:
    """Create new user"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    data = {
        "email": email,
        "username": username,
        "hashed_password": hashed_password,
        "role": role
    }
    
    response = supabase.table("users").insert(data).execute()
    return response.data[0]


async def update_user(email: str, data: Dict[str, Any]) -> Dict:
    """Update user record"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    response = supabase.table("users").update(data).eq("email", email).execute()
    return response.data[0] if response.data else None


# ============================================================================
# AUDIT LOG OPERATIONS
# ============================================================================

async def create_audit_log(
    user_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    changes: Optional[Dict] = None,
    ip_address: Optional[str] = None
) -> Dict:
    """Create audit log entry"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    data = {
        "user_id": user_id,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "changes": changes,
        "ip_address": ip_address
    }
    
    response = supabase.table("audit_logs").insert(data).execute()
    return response.data[0]


async def get_audit_logs(user_id: Optional[str] = None, limit: int = 100) -> List[Dict]:
    """Get audit logs with optional user filter"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    query = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(limit)
    
    if user_id:
        query = query.eq("user_id", user_id)
    
    response = query.execute()
    return response.data


# ============================================================================
# STATISTICS & ANALYTICS
# ============================================================================

async def get_device_statistics() -> Dict[str, Any]:
    """Get comprehensive device statistics"""
    if not supabase:
        raise Exception("Supabase client not initialized")
    
    # Count by type
    borewells = await get_all_borewells()
    sumps = await get_all_sumps()
    overhead_tanks = await get_all_overhead_tanks()
    
    # Borewell statistics
    borewell_by_zone = {}
    borewell_by_status = {}
    total_houses_borewells = 0
    
    for bw in borewells:
        zone = bw.get('zone', 'Unknown')
        status = bw.get('status', 'Unknown')
        borewell_by_zone[zone] = borewell_by_zone.get(zone, 0) + 1
        borewell_by_status[status] = borewell_by_status.get(status, 0) + 1
        total_houses_borewells += bw.get('houses_connected', 0) or 0
    
    # Sump statistics
    sump_by_zone = {}
    for sump in sumps:
        zone = sump.get('zone', 'Unknown')
        sump_by_zone[zone] = sump_by_zone.get(zone, 0) + 1
    
    # Overhead tank statistics
    oht_by_zone = {}
    total_houses_ohts = 0
    for oht in overhead_tanks:
        zone = oht.get('zone', 'Unknown')
        oht_by_zone[zone] = oht_by_zone.get(zone, 0) + 1
        total_houses_ohts += oht.get('houses_connected', 0) or 0
    
    return {
        "total_devices": len(borewells) + len(sumps) + len(overhead_tanks),
        "by_type": {
            "borewells": len(borewells),
            "sumps": len(sumps),
            "overhead_tanks": len(overhead_tanks)
        },
        "borewells": {
            "by_zone": borewell_by_zone,
            "by_status": borewell_by_status,
            "total_houses_connected": total_houses_borewells
        },
        "sumps": {
            "by_zone": sump_by_zone
        },
        "overhead_tanks": {
            "by_zone": oht_by_zone,
            "total_houses_connected": total_houses_ohts
        },
        "total_houses_served": total_houses_borewells + total_houses_ohts
    }
