import asyncio
import pytest
from app.core.database import init_db
from app.agents import get_agent_for_role, BUILTIN_AGENTS
from app.tools.fs_tools import resolve_safe_path, write_file, read_file
from app.engine.dag import DAGExecutor
from app.engine.orchestrator import orchestrator

@pytest.mark.asyncio
async def test_builtin_agents():
    roles = ["architect", "sde", "lawyer", "auditor", "accountant"]
    for r in roles:
        agent = get_agent_for_role(r)
        assert agent is not None
        assert agent.role == r

def test_safe_path_traversal(tmp_path):
    # Safe path within tmp_path
    safe = resolve_safe_path(str(tmp_path), "docs/legal/test.md")
    assert str(tmp_path) in str(safe)

    # Path traversal attack
    with pytest.raises(ValueError):
        resolve_safe_path(str(tmp_path), "../../outside.txt")

def test_file_write_and_read(tmp_path):
    res = write_file(str(tmp_path), "test.txt", "Polyman Test Content")
    assert res["is_new"] is True
    assert res["bytes_written"] > 0
    content = read_file(str(tmp_path), "test.txt")
    assert content == "Polyman Test Content"
