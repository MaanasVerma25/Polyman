import asyncio
from typing import Dict, Any
from .shell_tools import run_shell_command

async def get_git_status(project_path: str) -> Dict[str, Any]:
    return await run_shell_command(project_path, "git status --short")

async def get_git_diff(project_path: str) -> Dict[str, Any]:
    return await run_shell_command(project_path, "git diff")

async def git_commit(project_path: str, message: str) -> Dict[str, Any]:
    # Stage all changes and commit
    await run_shell_command(project_path, "git add -A")
    safe_msg = message.replace('"', '\\"')
    return await run_shell_command(project_path, f'git commit -m "{safe_msg}"')
