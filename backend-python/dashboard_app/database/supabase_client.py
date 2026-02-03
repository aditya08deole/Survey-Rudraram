"""
Shared Supabase Client with Connection Pooling
Singleton pattern to avoid creating multiple clients
"""

import os
from supabase import create_client, Client
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)

_supabase_client: Client = None

@lru_cache()
def get_supabase_client() -> Client:
    """
    Get shared Supabase client instance (singleton pattern)
    Uses connection pooling for better performance
    
    Returns:
        Client: Supabase client instance
    
    Raises:
        ValueError: If Supabase credentials not configured
    """
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        error_msg = "Supabase credentials (SUPABASE_URL, SUPABASE_KEY) not configured"
        logger.error(f"❌ {error_msg}")
        raise ValueError(error_msg)
    
    try:
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info(f"✅ Supabase client initialized: {supabase_url}")
        return _supabase_client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase client: {e}")
        raise


def get_supabase() -> Client:
    """
    FastAPI dependency to inject Supabase client
    Use this in route dependencies: supabase: Client = Depends(get_supabase)
    """
    return get_supabase_client()
