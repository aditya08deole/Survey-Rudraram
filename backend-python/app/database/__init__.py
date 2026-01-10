"""
Database Package

Supabase database operations for Rudraram Survey
"""

from .operations import (
    # Borewell operations
    get_all_borewells,
    get_borewell_by_code,
    create_borewell,
    update_borewell,
    delete_borewell,
    
    # Sump operations
    get_all_sumps,
    get_sump_by_code,
    create_sump,
    update_sump,
    delete_sump,
    
    # Overhead tank operations
    get_all_overhead_tanks,
    get_overhead_tank_by_code,
    create_overhead_tank,
    update_overhead_tank,
    delete_overhead_tank,
    
    # Unified operations
    get_all_devices,
    get_device_by_code,
    get_devices_by_type,
    
    # User operations
    get_user_by_email,
    create_user,
    update_user,
    
    # Audit logs
    create_audit_log,
    get_audit_logs,
    
    # Statistics
    get_device_statistics
)

__all__ = [
    'get_all_borewells',
    'get_borewell_by_code',
    'create_borewell',
    'update_borewell',
    'delete_borewell',
    'get_all_sumps',
    'get_sump_by_code',
    'create_sump',
    'update_sump',
    'delete_sump',
    'get_all_overhead_tanks',
    'get_overhead_tank_by_code',
    'create_overhead_tank',
    'update_overhead_tank',
    'delete_overhead_tank',
    'get_all_devices',
    'get_device_by_code',
    'get_devices_by_type',
    'get_user_by_email',
    'create_user',
    'update_user',
    'create_audit_log',
    'get_audit_logs',
    'get_device_statistics'
]
