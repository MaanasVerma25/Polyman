import asyncio
import uuid
from pathlib import Path
from typing import Dict, Any, Optional
from .fs_tools import write_file
from ..core.database import db_save_report

def save_report(project_path: str, category: str, filename: str, content: str, run_id: Optional[str] = None) -> Dict[str, Any]:
    """Save an agent deliverable report to docs/{category}/{filename} and Supabase/DB"""
    rel_path = f"docs/{category}/{filename}"
    bytes_written = len(content.encode("utf-8"))
    
    # Try writing to filesystem (works locally or in writable directories)
    try:
        res = write_file(project_path, rel_path, content)
        bytes_written = res.get("bytes_written", bytes_written)
    except Exception:
        pass

    # Save to database (persists in Supabase PostgreSQL in serverless environments)
    report_id = f"rep-{uuid.uuid4().hex[:8]}"
    try:
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(db_save_report(report_id, run_id, category, filename, rel_path, content))
        except RuntimeError:
            asyncio.run(db_save_report(report_id, run_id, category, filename, rel_path, content))
    except Exception:
        pass

    return {
        "report_path": rel_path,
        "category": category,
        "filename": filename,
        "bytes": bytes_written
    }
