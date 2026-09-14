from pathlib import Path
from typing import Dict, Any
from .fs_tools import write_file

def save_report(project_path: str, category: str, filename: str, content: str) -> Dict[str, Any]:
    """Save an agent deliverable report to docs/{category}/{filename}"""
    rel_path = f"docs/{category}/{filename}"
    res = write_file(project_path, rel_path, content)
    return {
        "report_path": rel_path,
        "category": category,
        "filename": filename,
        "bytes": res["bytes_written"]
    }
