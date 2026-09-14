import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

def resolve_safe_path(base_dir: str, rel_path: str) -> Path:
    base = Path(base_dir).resolve()
    target = (base / rel_path).resolve()
    # Allow target to be within base directory or subpath
    try:
        target.relative_to(base)
    except ValueError:
        raise ValueError(f"Path traversal denied: {rel_path} is outside {base_dir}")
    return target

def read_file(project_path: str, rel_path: str) -> str:
    path = resolve_safe_path(project_path, rel_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {rel_path}")
    if not path.is_file():
        raise IsADirectoryError(f"Target is not a file: {rel_path}")
    return path.read_text(encoding="utf-8", errors="replace")

def write_file(project_path: str, rel_path: str, content: str) -> Dict[str, Any]:
    path = resolve_safe_path(project_path, rel_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    is_new = not path.exists()
    path.write_text(content, encoding="utf-8")
    return {
        "path": rel_path,
        "is_new": is_new,
        "bytes_written": len(content)
    }

def patch_file(project_path: str, rel_path: str, find_str: str, replace_str: str) -> Dict[str, Any]:
    path = resolve_safe_path(project_path, rel_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {rel_path}")
    original = path.read_text(encoding="utf-8")
    if find_str not in original:
        raise ValueError(f"Target snippet not found in {rel_path}")
    updated = original.replace(find_str, replace_str, 1)
    path.write_text(updated, encoding="utf-8")
    return {
        "path": rel_path,
        "success": True
    }

def list_files(project_path: str, rel_dir: str = "", max_depth: int = 4) -> List[Dict[str, Any]]:
    base = resolve_safe_path(project_path, rel_dir)
    if not base.exists():
        return []
    
    results = []
    ignored = {".git", "node_modules", "__pycache__", ".venv", "venv", ".idea", ".vscode", "dist", "build"}
    
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in ignored]
        current_path = Path(root)
        rel = current_path.relative_to(Path(project_path).resolve())
        
        # Check depth
        if len(rel.parts) > max_depth:
            continue
            
        for d in dirs:
            dir_rel = str((rel / d).as_posix()) if str(rel) != "." else d
            results.append({
                "path": dir_rel,
                "type": "directory"
            })
            
        for f in files:
            file_rel = str((rel / f).as_posix()) if str(rel) != "." else f
            file_path = current_path / f
            results.append({
                "path": file_rel,
                "type": "file",
                "size": file_path.stat().st_size
            })
            
    return results

def search_text(project_path: str, query: str, limit: int = 20) -> List[Dict[str, Any]]:
    base = Path(project_path).resolve()
    results = []
    ignored = {".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build"}
    
    for root, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in ignored]
        for f in files:
            file_path = Path(root) / f
            if file_path.suffix.lower() in [".png", ".jpg", ".ico", ".exe", ".bin", ".zip", ".tar"]:
                continue
            try:
                lines = file_path.read_text(encoding="utf-8", errors="ignore").splitlines()
                for idx, line in enumerate(lines):
                    if query.lower() in line.lower():
                        rel = file_path.relative_to(base).as_posix()
                        results.append({
                            "file": rel,
                            "line": idx + 1,
                            "content": line.strip()
                        })
                        if len(results) >= limit:
                            return results
            except Exception:
                continue
    return results
