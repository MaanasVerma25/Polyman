import os
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from ..core.config import settings
from ..core.database import db_get_reports
from ..tools.fs_tools import list_files, read_file
from ..tools.git_tools import get_git_status, get_git_diff

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("/files")
async def get_project_files(project_path: Optional[str] = None):
    target = project_path or settings.workspace_dir
    try:
        files = list_files(target)
        return {"project_path": target, "files": files}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/file")
async def get_file_content(path: str = Query(...), project_path: Optional[str] = None):
    target = project_path or settings.workspace_dir
    try:
        content = read_file(target, path)
        return {"path": path, "content": content}
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reports")
async def get_all_reports(project_path: Optional[str] = None):
    # 1. Fetch from Supabase / database first
    try:
        db_reports = await db_get_reports()
        if db_reports and len(db_reports) > 0:
            return {"reports": db_reports}
    except Exception:
        pass

    # 2. Fallback to reading from local filesystem docs/
    target = project_path or settings.workspace_dir
    base = Path(target) / "docs"
    if not base.exists():
        return {"reports": []}

    reports = []
    categories = ["legal", "audit", "financial", "architecture"]
    for cat in categories:
        cat_dir = base / cat
        if cat_dir.exists():
            for f in cat_dir.glob("*.md"):
                try:
                    content = f.read_text(encoding="utf-8", errors="replace")
                    reports.append({
                        "id": f.stem,
                        "category": cat,
                        "filename": f.name,
                        "rel_path": f"docs/{cat}/{f.name}",
                        "content": content
                    })
                except Exception:
                    continue
    return {"reports": reports}

@router.get("/git")
async def get_git_info(project_path: Optional[str] = None):
    target = project_path or settings.workspace_dir
    try:
        status = await get_git_status(target)
        diff = await get_git_diff(target)
        return {
            "status": status.get("stdout", ""),
            "diff": diff.get("stdout", "")
        }
    except Exception:
        return {"status": "", "diff": ""}
