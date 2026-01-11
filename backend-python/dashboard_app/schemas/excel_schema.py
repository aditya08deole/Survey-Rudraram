"""
Excel Schema Contract
Defines the canonical data model for Rudraram Survey System
"""

from typing import Dict, List, Any, Optional
from enum import Enum

# ============================================================================
# FORMAL HEADER MAPPING CONTRACT
# This is the single source of truth for Excel column name translation
# Excel headers (with spaces, parentheses, slashes) → Canonical field names
# ============================================================================

EXCEL_HEADER_MAP: Dict[str, str] = {
    # Core Identification
    "Survey Code (ID)": "survey_id",
    "Original Name": "original_name",
    
    # Location
    "Zone": "zone",
    "Street Name / Landmark": "street",
    
    # Device Information
    "Device Type": "device_type",
    "Status": "status",
    
    # GPS Coordinates (CRITICAL - must be numeric)
    "Latitude": "lat",
    "Longitude": "lng",
    
    # Operational Data
    "Houses Conn.": "houses",
    "Daily Usage (Hrs)": "usage_hours",
    
    # Technical Specifications
    "Pipe Size (inch)": "pipe_size",
    "Motor HP / Cap": "motor_hp",
    
    # Maintenance
    "Notes / Maintenance Issue": "notes",
}

# Reverse mapping for debugging
CANONICAL_TO_EXCEL: Dict[str, str] = {v: k for k, v in EXCEL_HEADER_MAP.items()}

# ============================================================================
# REQUIRED FIELDS
# Rows missing these fields will be quarantined
# ============================================================================

REQUIRED_FIELDS: List[str] = [
    "survey_id",  # Must have unique identifier
    "lat",        # Must have GPS coordinates
    "lng",        # Must have GPS coordinates
]

# ============================================================================
# VALIDATION RULES
# Type and range constraints for each field
# ============================================================================

class DeviceType(str, Enum):
    BOREWELL = "Borewell"
    SUMP = "Sump"
    OHT = "OHT"
    OHSR = "OHSR"
    OVERHEAD_TANK = "Overhead Tank"

class DeviceStatus(str, Enum):
    WORKING = "Working"
    NOT_WORKING = "Not Working"
    NOT_WORK = "Not Work"
    ON_REPAIR = "On Repair"
    FAILED = "Failed"
    REPAIR = "Repair"

VALIDATION_RULES: Dict[str, Dict[str, Any]] = {
    "lat": {
        "type": "float",
        "min": -90.0,
        "max": 90.0,
        "description": "Latitude must be between -90 and 90"
    },
    "lng": {
        "type": "float",
        "min": -180.0,
        "max": 180.0,
        "description": "Longitude must be between -180 and 180"
    },
    "device_type": {
        "type": "string",
        "allowed": [dt.value for dt in DeviceType],
        "description": "Must be Borewell, Sump, OHT, or OHSR"
    },
    "status": {
        "type": "string",
        "allowed": [ds.value for ds in DeviceStatus],
        "description": "Must be Working, Not Working, On Repair, or Failed"
    },
    "houses": {
        "type": "int",
        "min": 0,
        "max": 10000,
        "description": "Number of houses connected"
    },
    "usage_hours": {
        "type": "float",
        "min": 0.0,
        "max": 24.0,
        "description": "Daily usage hours (0-24)"
    },
    "pipe_size": {
        "type": "float",
        "min": 0.0,
        "max": 100.0,
        "description": "Pipe size in inches"
    },
    "motor_hp": {
        "type": "float",
        "min": 0.0,
        "max": 1000.0,
        "description": "Motor horsepower"
    },
}

# ============================================================================
# CANONICAL SCHEMA DEFINITION
# This is what every device object MUST look like after normalization
# ============================================================================

CANONICAL_SCHEMA: Dict[str, str] = {
    "survey_id": "string",
    "original_name": "string | null",
    "zone": "string | null",
    "street": "string | null",
    "device_type": "string | null",
    "status": "string | null",
    "lat": "float | null",
    "lng": "float | null",
    "houses": "int | null",
    "usage_hours": "float | null",
    "pipe_size": "float | null",
    "motor_hp": "float | null",
    "notes": "string | null",
    "row_index": "int",  # Excel row number for debugging
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_expected_headers() -> List[str]:
    """Get list of expected Excel headers"""
    return list(EXCEL_HEADER_MAP.keys())

def get_canonical_fields() -> List[str]:
    """Get list of canonical field names"""
    return list(EXCEL_HEADER_MAP.values())

def validate_excel_headers(excel_headers: List[str]) -> Dict[str, Any]:
    """
    Validate that Excel file has expected headers
    Returns: {
        "valid": bool,
        "missing_headers": List[str],
        "extra_headers": List[str],
        "warnings": List[str]
    }
    """
    expected = set(EXCEL_HEADER_MAP.keys())
    actual = set(excel_headers)
    
    missing = expected - actual
    extra = actual - expected
    
    warnings = []
    if missing:
        warnings.append(f"Missing expected headers: {', '.join(missing)}")
    if extra:
        warnings.append(f"Unexpected headers found: {', '.join(extra)}")
    
    return {
        "valid": len(missing) == 0,
        "missing_headers": list(missing),
        "extra_headers": list(extra),
        "warnings": warnings
    }
