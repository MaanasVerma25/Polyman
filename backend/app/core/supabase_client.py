import logging
from typing import Optional
from .config import settings

logger = logging.getLogger("polyman.supabase")

_supabase_client = None

def get_supabase():
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.clean_supabase_url or not settings.supabase_key:
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(settings.clean_supabase_url, settings.supabase_key)
        logger.info(f"Supabase client initialized successfully for: {settings.clean_supabase_url}")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

def is_supabase_enabled() -> bool:
    return bool(settings.supabase_url and settings.supabase_key)
