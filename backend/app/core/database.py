import aiosqlite
import json
import logging
from typing import Optional, List, Dict, Any
from .config import settings

logger = logging.getLogger("polyman.db")

async def get_db():
    async with aiosqlite.connect(settings.db_path) as db:
        db.row_factory = aiosqlite.Row
        yield db

async def init_db():
    async with aiosqlite.connect(settings.db_path) as db:
        await db.execute("PRAGMA foreign_keys = ON")
        
        # Projects table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Runs table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                project_id TEXT,
                task_prompt TEXT NOT NULL,
                status TEXT NOT NULL, -- pending, running, paused, completed, failed, cancelled
                summary TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # DAG Nodes table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS dag_nodes (
                id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                agent_role TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT NOT NULL, -- pending, running, completed, failed, skipped
                dependencies TEXT, -- JSON list of node ids
                input_data TEXT,
                output_data TEXT,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
            )
        """)
        
        # Agent Logs & Events table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS agent_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                node_id TEXT,
                agent_role TEXT NOT NULL,
                event_type TEXT NOT NULL, -- thought, tool_call, tool_result, output, error, system
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
            )
        """)
        
        # Custom Agents table
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
                tools TEXT NOT NULL, -- JSON list
                is_builtin INTEGER DEFAULT 0
            )
        """)
        
        # Settings table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
        
        await db.commit()
        await seed_builtin_agents(db)

async def seed_builtin_agents(db: aiosqlite.Connection):
    builtin_agents = [
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
            "tools": json.dumps(["task_planner", "dag_builder"]),
            "is_builtin": 1
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
            "tools": json.dumps(["file_writer", "diagram_generator"]),
            "is_builtin": 1
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
            "tools": json.dumps(["file_reader", "file_writer", "patch_file", "shell_exec", "git_tools"]),
            "is_builtin": 1
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
            "tools": json.dumps(["file_reader", "doc_writer", "license_checker"]),
            "is_builtin": 1
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
            "tools": json.dumps(["file_reader", "security_scanner", "doc_writer"]),
            "is_builtin": 1
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
            "tools": json.dumps(["cost_calculator", "doc_writer"]),
            "is_builtin": 1
        }
    ]
    
    for agent in builtin_agents:
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
        """, agent)
    await db.commit()
