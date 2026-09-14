import json
import logging
import uuid
from typing import Optional, List, Dict, Any
import aiosqlite
from .config import settings
from .supabase_client import get_supabase, is_supabase_enabled

logger = logging.getLogger("polyman.db")

BUILTIN_AGENTS = [
    {
        "id": "agent-orchestrator",
        "role": "orchestrator",
        "name": "Orchestrator",
        "avatar": "BrainCircuit",
        "color": "#6366f1",
        "description": "Decomposes complex requests, constructs the execution DAG, and oversees subagents.",
        "system_prompt": "You are the Chief Orchestrator for Polyman. You analyze user task requests, identify dependencies, assign specialized subagents, and synthesize final mission outcomes.",
        "default_provider": "gemini",
        "default_model": "gemini-2.0-flash",
        "tools": ["task_planner", "dag_builder"],
        "is_builtin": True
    },
    {
        "id": "agent-architect",
        "role": "architect",
        "name": "System Architect",
        "avatar": "Layers",
        "color": "#0ea5e9",
        "description": "Designs system blueprints, API specifications, module seams, and data flows.",
        "system_prompt": "You are a Principal Software Architect. You specify high-level system diagrams, component interfaces, architectural decision records (ADRs), and directory layouts.",
        "default_provider": "gemini",
        "default_model": "gemini-2.0-flash",
        "tools": ["file_writer", "diagram_generator"],
        "is_builtin": True
    },
    {
        "id": "agent-sde",
        "role": "sde",
        "name": "Software Engineer",
        "avatar": "Code2",
        "color": "#10b981",
        "description": "Writes production-ready code, implements features, executes tests, and fixes bugs.",
        "system_prompt": "You are a Senior Full-Stack Software Development Engineer. You read existing code, generate clean, modular, typed code, execute tests, and implement core logic.",
        "default_provider": "anthropic",
        "default_model": "claude-3-7-sonnet",
        "tools": ["file_reader", "file_writer", "patch_file", "shell_exec", "git_tools"],
        "is_builtin": True
    },
    {
        "id": "agent-lawyer",
        "role": "lawyer",
        "name": "Legal Counsel",
        "avatar": "Scale",
        "color": "#f59e0b",
        "description": "Reviews open-source licenses, drafts Terms of Service, Privacy Policies, and IP attribution.",
        "system_prompt": "You are a specialized Corporate Tech & Open Source Legal Counsel. You evaluate software dependencies for copyleft/GPL contamination, draft commercial licenses, Terms of Service, and compliance frameworks.",
        "default_provider": "openai",
        "default_model": "gpt-4o",
        "tools": ["file_reader", "doc_writer", "license_checker"],
        "is_builtin": True
    },
    {
        "id": "agent-auditor",
        "role": "auditor",
        "name": "Security Auditor",
        "avatar": "ShieldCheck",
        "color": "#ef4444",
        "description": "Performs security audits, OWASP vulnerability scans, static code checks, and regulatory audits.",
        "system_prompt": "You are a Senior Application Security & Compliance Auditor. You examine code for vulnerabilities (injection, auth bypass, secret leaks), enforce secure coding standards, and gate release quality.",
        "default_provider": "gemini",
        "default_model": "gemini-2.0-flash",
        "tools": ["file_reader", "security_scanner", "doc_writer"],
        "is_builtin": True
    },
    {
        "id": "agent-accountant",
        "role": "accountant",
        "name": "Financial Accountant",
        "avatar": "Calculator",
        "color": "#8b5cf6",
        "description": "Calculates cloud infrastructure costs, API token consumption, OpEx, and pricing models.",
        "system_prompt": "You are a Cloud FinOps & Software Financial Accountant. You model server hosting costs (AWS/GCP/Vercel), AI token margins, database storage tiers, and generate budget breakdown reports.",
        "default_provider": "openai",
        "default_model": "gpt-4o-mini",
        "tools": ["cost_calculator", "doc_writer"],
        "is_builtin": True
    }
]

async def init_db():
    if is_supabase_enabled():
        logger.info("Supabase configured. Verifying Supabase connection...")
        client = get_supabase()
        if client:
            try:
                # Test query to check custom_agents
                res = client.table("custom_agents").select("id").limit(1).execute()
                logger.info(f"Supabase connection verified. Tables accessible.")
                return
            except Exception as e:
                logger.warning(f"Supabase check returned warning: {e}. Ensure supabase/schema.sql has been executed.")
                return

    # Fallback to local SQLite
    logger.info("Using local SQLite persistence.")
    async with aiosqlite.connect(settings.db_path) as db:
        await db.execute("PRAGMA foreign_keys = ON")
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                task_prompt TEXT NOT NULL,
                status TEXT NOT NULL,
                summary TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS dag_nodes (
                id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                agent_role TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL,
                dependencies TEXT,
                input_data TEXT,
                output_data TEXT,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
            )
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS agent_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                node_id TEXT,
                agent_role TEXT NOT NULL,
                event_type TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
            )
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS custom_agents (
                id TEXT PRIMARY KEY,
                role TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                avatar TEXT NOT NULL,
                color TEXT NOT NULL,
                description TEXT NOT NULL,
                system_prompt TEXT NOT NULL,
                default_provider TEXT NOT NULL,
                default_model TEXT NOT NULL,
                tools TEXT NOT NULL,
                is_builtin INTEGER DEFAULT 0
            )
        """)
        
        await db.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                run_id TEXT,
                category TEXT NOT NULL,
                filename TEXT NOT NULL,
                rel_path TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        
        await db.commit()

        # Seed builtin agents in SQLite
        for agent in BUILTIN_AGENTS:
            item = dict(agent)
            item["tools"] = json.dumps(item["tools"])
            item["is_builtin"] = 1 if item["is_builtin"] else 0
            await db.execute("""
                INSERT INTO custom_agents (id, role, name, avatar, color, description, system_prompt, default_provider, default_model, tools, is_builtin)
                VALUES (:id, :role, :name, :avatar, :color, :description, :system_prompt, :default_provider, :default_model, :tools, :is_builtin)
                ON CONFLICT(role) DO UPDATE SET
                    name = excluded.name,
                    avatar = excluded.avatar,
                    color = excluded.color,
                    description = excluded.description,
                    system_prompt = excluded.system_prompt,
                    tools = excluded.tools
            """, item)
        await db.commit()

# ==============================================================================
# Unified Database Abstraction Operations
# ==============================================================================

async def db_create_run(run_id: str, project_id: str, task_prompt: str, summary: str, status: str = "pending"):
    client = get_supabase()
    if client:
        client.table("runs").insert({
            "id": run_id,
            "project_id": project_id,
            "task_prompt": task_prompt,
            "summary": summary,
            "status": status
        }).execute()
        return

    async with aiosqlite.connect(settings.db_path) as db:
        await db.execute("""
            INSERT INTO runs (id, project_id, task_prompt, status, summary)
            VALUES (?, ?, ?, ?, ?)
        """, (run_id, project_id, task_prompt, status, summary))
        await db.commit()

async def db_update_run(run_id: str, status: Optional[str] = None, summary: Optional[str] = None):
    client = get_supabase()
    if client:
        payload: Dict[str, Any] = {}
        if status is not None:
            payload["status"] = status
        if summary is not None:
            payload["summary"] = summary
        if payload:
            client.table("runs").update(payload).eq("id", run_id).execute()
        return

    async with aiosqlite.connect(settings.db_path) as db:
        updates = []
        params = []
        if status is not None:
            updates.append("status = ?")
            params.append(status)
        if summary is not None:
            updates.append("summary = ?")
            params.append(summary)
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(run_id)
        sql = f"UPDATE runs SET {', '.join(updates)} WHERE id = ?"
        await db.execute(sql, params)
        await db.commit()

async def db_get_runs(limit: int = 20) -> List[Dict[str, Any]]:
    client = get_supabase()
    if client:
        res = client.table("runs").select("*").order("created_at", desc=True).limit(limit).execute()
        return res.data or []

    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM runs ORDER BY created_at DESC LIMIT ?", (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

async def db_get_run_detail(run_id: str) -> Optional[Dict[str, Any]]:
    client = get_supabase()
    if client:
        run_res = client.table("runs").select("*").eq("id", run_id).execute()
        if not run_res.data:
            return None
        run_data = run_res.data[0]

        nodes_res = client.table("dag_nodes").select("*").eq("run_id", run_id).order("started_at", desc=False).execute()
        nodes = []
        for n in nodes_res.data or []:
            nd = dict(n)
            if isinstance(nd.get("dependencies"), str):
                nd["dependencies"] = json.loads(nd["dependencies"])
            if isinstance(nd.get("input_data"), str):
                nd["input_data"] = json.loads(nd["input_data"])
            if isinstance(nd.get("output_data"), str):
                nd["output_data"] = json.loads(nd["output_data"])
            nodes.append(nd)
        run_data["nodes"] = nodes

        logs_res = client.table("agent_logs").select("*").eq("run_id", run_id).order("id", desc=False).execute()
        run_data["logs"] = logs_res.data or []
        return run_data

    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM runs WHERE id = ?", (run_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            run_data = dict(row)

        async with db.execute("SELECT * FROM dag_nodes WHERE run_id = ? ORDER BY started_at ASC, id ASC", (run_id,)) as cursor:
            node_rows = await cursor.fetchall()
            nodes = []
            for n in node_rows:
                nd = dict(n)
                nd["dependencies"] = json.loads(nd["dependencies"]) if nd["dependencies"] else []
                nd["input_data"] = json.loads(nd["input_data"]) if nd["input_data"] else None
                nd["output_data"] = json.loads(nd["output_data"]) if nd["output_data"] else None
                nodes.append(nd)
            run_data["nodes"] = nodes

        async with db.execute("SELECT * FROM agent_logs WHERE run_id = ? ORDER BY id ASC", (run_id,)) as cursor:
            log_rows = await cursor.fetchall()
            run_data["logs"] = [dict(l) for l in log_rows]

        return run_data

async def db_insert_dag_nodes(run_id: str, nodes: List[Dict[str, Any]]):
    client = get_supabase()
    if client:
        inserts = []
        for n in nodes:
            inserts.append({
                "id": n["id"],
                "run_id": run_id,
                "agent_role": n["agent_role"],
                "title": n["title"],
                "description": n.get("description", ""),
                "status": "pending",
                "dependencies": n.get("dependencies", [])
            })
        client.table("dag_nodes").insert(inserts).execute()
        return

    async with aiosqlite.connect(settings.db_path) as db:
        for node in nodes:
            deps_json = json.dumps(node.get("dependencies", []))
            await db.execute("""
                INSERT INTO dag_nodes (id, run_id, agent_role, title, description, status, dependencies)
                VALUES (?, ?, ?, ?, ?, 'pending', ?)
            """, (node["id"], run_id, node["agent_role"], node["title"], node.get("description", ""), deps_json))
        await db.commit()

async def db_update_dag_node(node_id: str, status: str, output: Optional[Dict] = None):
    client = get_supabase()
    if client:
        payload: Dict[str, Any] = {"status": status}
        if output is not None:
            payload["output_data"] = output
        if status == "running":
            import datetime
            payload["started_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        elif status in ("completed", "failed", "skipped"):
            import datetime
            payload["completed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        client.table("dag_nodes").update(payload).eq("id", node_id).execute()
        return

    async with aiosqlite.connect(settings.db_path) as db:
        out_str = json.dumps(output) if output else None
        await db.execute("""
            UPDATE dag_nodes
            SET status = ?, output_data = COALESCE(?, output_data),
                completed_at = CASE WHEN ? IN ('completed', 'failed', 'skipped') THEN CURRENT_TIMESTAMP ELSE completed_at END,
                started_at = CASE WHEN ? = 'running' THEN CURRENT_TIMESTAMP ELSE started_at END
            WHERE id = ?
        """, (status, out_str, status, status, node_id))
        await db.commit()

async def db_insert_agent_log(run_id: str, node_id: Optional[str], agent_role: str, event_type: str, content: str):
    client = get_supabase()
    if client:
        client.table("agent_logs").insert({
            "run_id": run_id,
            "node_id": node_id,
            "agent_role": agent_role,
            "event_type": event_type,
            "content": content
        }).execute()
        return

    async with aiosqlite.connect(settings.db_path) as db:
        await db.execute("""
            INSERT INTO agent_logs (run_id, node_id, agent_role, event_type, content)
            VALUES (?, ?, ?, ?, ?)
        """, (run_id, node_id, agent_role, event_type, content))
        await db.commit()

async def db_get_agents() -> List[Dict[str, Any]]:
    client = get_supabase()
    if client:
        res = client.table("custom_agents").select("*").order("is_builtin", desc=True).order("name", desc=False).execute()
        data = res.data or []
        for item in data:
            if isinstance(item.get("tools"), str):
                item["tools"] = json.loads(item["tools"])
        return data

    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM custom_agents ORDER BY is_builtin DESC, name ASC") as cursor:
            rows = await cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["tools"] = json.loads(item["tools"]) if item["tools"] else []
                item["is_builtin"] = bool(item["is_builtin"])
                results.append(item)
            return results

async def db_create_agent(agent_data: Dict[str, Any]) -> Dict[str, Any]:
    agent_id = f"agent-{uuid.uuid4().hex[:8]}"
    item = {
        "id": agent_id,
        "role": agent_data["role"].lower(),
        "name": agent_data["name"],
        "avatar": agent_data["avatar"],
        "color": agent_data["color"],
        "description": agent_data["description"],
        "system_prompt": agent_data["system_prompt"],
        "default_provider": agent_data["default_provider"],
        "default_model": agent_data["default_model"],
        "tools": agent_data.get("tools", []),
        "is_builtin": False
    }

    client = get_supabase()
    if client:
        client.table("custom_agents").insert(item).execute()
        return item

    async with aiosqlite.connect(settings.db_path) as db:
        await db.execute("""
            INSERT INTO custom_agents (
                id, role, name, avatar, color, description, system_prompt,
                default_provider, default_model, tools, is_builtin
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        """, (
            agent_id, item["role"], item["name"], item["avatar"],
            item["color"], item["description"], item["system_prompt"],
            item["default_provider"], item["default_model"],
            json.dumps(item["tools"])
        ))
        await db.commit()

    return item

async def db_delete_agent(agent_id: str):
    client = get_supabase()
    if client:
        # Check if builtin
        res = client.table("custom_agents").select("is_builtin").eq("id", agent_id).execute()
        if not res.data:
            raise ValueError("Agent not found")
        if res.data[0].get("is_builtin"):
            raise ValueError("Cannot delete built-in agent")
        client.table("custom_agents").delete().eq("id", agent_id).execute()
        return

    async with aiosqlite.connect(settings.db_path) as db:
        async with db.execute("SELECT is_builtin FROM custom_agents WHERE id = ?", (agent_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise ValueError("Agent not found")
            if row[0] == 1:
                raise ValueError("Cannot delete built-in agent")
        await db.execute("DELETE FROM custom_agents WHERE id = ?", (agent_id,))
        await db.commit()

async def db_save_report(report_id: str, run_id: Optional[str], category: str, filename: str, rel_path: str, content: str):
    client = get_supabase()
    if client:
        client.table("reports").upsert({
            "id": report_id,
            "run_id": run_id,
            "category": category,
            "filename": filename,
            "rel_path": rel_path,
            "content": content
        }).execute()
        return

    async with aiosqlite.connect(settings.db_path) as db:
        await db.execute("""
            INSERT OR REPLACE INTO reports (id, run_id, category, filename, rel_path, content)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (report_id, run_id, category, filename, rel_path, content))
        await db.commit()

async def db_get_reports() -> List[Dict[str, Any]]:
    client = get_supabase()
    if client:
        res = client.table("reports").select("*").order("created_at", desc=True).execute()
        return res.data or []

    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM reports ORDER BY created_at DESC") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]
