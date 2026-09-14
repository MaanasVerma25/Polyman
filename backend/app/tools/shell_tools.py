import asyncio
import os
import subprocess
from typing import Dict, Any

async def run_shell_command(project_path: str, command: str, timeout: int = 30) -> Dict[str, Any]:
    """Execute a shell command inside the project path with timeout safety."""
    try:
        process = await asyncio.create_subprocess_shell(
            command,
            cwd=project_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
        return {
            "command": command,
            "exit_code": process.returncode,
            "stdout": stdout.decode("utf-8", errors="replace"),
            "stderr": stderr.decode("utf-8", errors="replace"),
            "timed_out": False
        }
    except asyncio.TimeoutError:
        try:
            process.kill()
        except Exception:
            pass
        return {
            "command": command,
            "exit_code": -1,
            "stdout": "",
            "stderr": f"Command timed out after {timeout} seconds",
            "timed_out": True
        }
    except Exception as e:
        return {
            "command": command,
            "exit_code": -1,
            "stdout": "",
            "stderr": str(e),
            "timed_out": False
        }
