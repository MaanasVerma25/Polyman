-- ==============================================================================
-- Polyman Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Runs Table
CREATE TABLE IF NOT EXISTS public.runs (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    task_prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, paused, completed, failed, cancelled
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DAG Nodes Table
CREATE TABLE IF NOT EXISTS public.dag_nodes (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
    agent_role TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed, skipped
    dependencies JSONB DEFAULT '[]'::jsonb,
    input_data JSONB,
    output_data JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 4. Agent Logs Table
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id BIGSERIAL PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
    node_id TEXT,
    agent_role TEXT NOT NULL,
    event_type TEXT NOT NULL, -- thought, tool_call, tool_result, output, error, system
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Custom & Builtin Agents Table
CREATE TABLE IF NOT EXISTS public.custom_agents (
    id TEXT PRIMARY KEY,
    role TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    default_provider TEXT NOT NULL,
    default_model TEXT NOT NULL,
    tools JSONB DEFAULT '[]'::jsonb,
    is_builtin BOOLEAN DEFAULT FALSE
);

-- 6. Generated Reports & Deliverables Table
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    run_id TEXT REFERENCES public.runs(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- legal, audit, financial, architecture, general
    filename TEXT NOT NULL,
    rel_path TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- ==============================================================================
-- Pre-seed Builtin Autonomous Agents
-- ==============================================================================
INSERT INTO public.custom_agents (id, role, name, avatar, color, description, system_prompt, default_provider, default_model, tools, is_builtin)
VALUES
(
    'agent-orchestrator',
    'orchestrator',
    'Orchestrator',
    'BrainCircuit',
    '#6366f1',
    'Decomposes complex requests, constructs the execution DAG, and oversees subagents.',
    'You are the Chief Orchestrator for Polyman. You analyze user task requests, identify dependencies, assign specialized subagents, and synthesize final mission outcomes.',
    'gemini',
    'gemini-2.0-flash',
    '["task_planner", "dag_builder"]'::jsonb,
    TRUE
),
(
    'agent-architect',
    'architect',
    'System Architect',
    'Layers',
    '#0ea5e9',
    'Designs system blueprints, API specifications, module seams, and data flows.',
    'You are a Principal Software Architect. You specify high-level system diagrams, component interfaces, architectural decision records (ADRs), and directory layouts.',
    'gemini',
    'gemini-2.0-flash',
    '["file_writer", "diagram_generator"]'::jsonb,
    TRUE
),
(
    'agent-sde',
    'sde',
    'Software Engineer',
    'Code2',
    '#10b981',
    'Writes production-ready code, implements features, executes tests, and fixes bugs.',
    'You are a Senior Full-Stack Software Development Engineer. You read existing code, generate clean, modular, typed code, execute tests, and implement core logic.',
    'anthropic',
    'claude-3-7-sonnet',
    '["file_reader", "file_writer", "patch_file", "shell_exec", "git_tools"]'::jsonb,
    TRUE
),
(
    'agent-lawyer',
    'lawyer',
    'Legal Counsel',
    'Scale',
    '#f59e0b',
    'Reviews open-source licenses, drafts Terms of Service, Privacy Policies, and IP attribution.',
    'You are a specialized Corporate Tech & Open Source Legal Counsel. You evaluate software dependencies for copyleft/GPL contamination, draft commercial licenses, Terms of Service, and compliance frameworks.',
    'openai',
    'gpt-4o',
    '["file_reader", "doc_writer", "license_checker"]'::jsonb,
    TRUE
),
(
    'agent-auditor',
    'auditor',
    'Security Auditor',
    'ShieldCheck',
    '#ef4444',
    'Performs security audits, OWASP vulnerability scans, static code checks, and regulatory audits.',
    'You are a Senior Application Security & Compliance Auditor. You examine code for vulnerabilities (injection, auth bypass, secret leaks), enforce secure coding standards, and gate release quality.',
    'gemini',
    'gemini-2.0-flash',
    '["file_reader", "security_scanner", "doc_writer"]'::jsonb,
    TRUE
),
(
    'agent-accountant',
    'accountant',
    'Financial Accountant',
    'Calculator',
    '#8b5cf6',
    'Calculates cloud infrastructure costs, API token consumption, OpEx, and pricing models.',
    'You are a Cloud FinOps & Software Financial Accountant. You model server hosting costs (AWS/GCP/Vercel), AI token margins, database storage tiers, and generate budget breakdown reports.',
    'openai',
    'gpt-4o-mini',
    '["cost_calculator", "doc_writer"]'::jsonb,
    TRUE
)
ON CONFLICT (role) DO UPDATE SET
    name = EXCLUDED.name,
    avatar = EXCLUDED.avatar,
    color = EXCLUDED.color,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    tools = EXCLUDED.tools;

-- ==============================================================================
-- Enable Realtime Replication for Live Streaming
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dag_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
