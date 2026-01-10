"""
Auth Package

JWT-based authentication system for FastAPI.
"""

from .jwt_handler import (
    create_access_token,
    verify_token,
    get_password_hash,
    verify_password,
    create_user_token,
    is_token_expired,
    get_token_expiry
)
from .dependencies import (
    get_current_user,
    get_current_active_user,
    require_role,
    require_admin,
    require_manager
)

__all__ = [
    'create_access_token',
    'verify_token',
    'get_password_hash',
    'verify_password',
    'create_user_token',
    'is_token_expired',
    'get_token_expiry',
    'get_current_user',
    'get_current_active_user',
    'require_role',
    'require_admin',
    'require_manager'
]
