<p align="center">
  <img src="https://img.shields.io/badge/Polyman-v1.0.0-7c3aed?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMkw0IDdsMiAxMiA2IDMgNi0zIDItMTJ6Ii8+PC9zdmc+" alt="Polyman" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">
  <br>
  🔮 Polyman
  <br>
  <sub>Autonomous Multi-Agent Software Engineering Platform</sub>
</h1>

<p align="center">
  <strong>One prompt. Six specialized AI agents. A complete engineering pipeline.</strong>
  <br>
  Polyman decomposes any software engineering task into a <b>Directed Acyclic Graph (DAG)</b> and autonomously executes specialized subagents — architect, engineer, lawyer, auditor, and accountant — against your local workspace with real-time streaming telemetry.
</p>

---

## Table of Contents

- [How It Works](#-how-it-works)
- [System Architecture](#-system-architecture)
- [The Agent Roster](#-the-agent-roster)
- [DAG Execution Engine](#-dag-execution-engine)
- [LLM Gateway & Multi-Provider Support](#-llm-gateway--multi-provider-support)
- [Tool System](#-tool-system)
- [Real-Time Event Pipeline](#-real-time-event-pipeline)
- [Frontend Dashboard](#-frontend-dashboard)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Configuration](#%EF%B8%8F-configuration)
- [API Reference](#-api-reference)
- [Running Tests](#-running-tests)
- [License](#-license)

---

## 🧬 How It Works

Polyman operates as a **self-orchestrating multi-agent system**. You provide a natural language engineering goal, and the platform autonomously plans, executes, and delivers a complete engineering output — code, architecture docs, legal compliance, security audits, and financial models.

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    USER PROMPT                         │
                    │  "Build a secure microservice API with JWT auth,       │
                    │   budget estimation, and MIT license compliance"       │
                    └──────────────────────┬──────────────────────────────────┘
                                           │
                                           ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │              🧠 CHIEF ORCHESTRATOR                     │
                    │                                                        │
                    │   • Analyzes requirements                              │
                    │   • Identifies required subagents                      │
                    │   • Generates execution DAG with dependencies          │
                    │   • Returns JSON plan_summary + nodes[]                │
                    └──────────────────────┬──────────────────────────────────┘
                                           │
                              ┌────────────┼────────────┐
                              │            │            │
                              ▼            ▼            ▼
                    ┌──────────────┐ ┌──────────┐ ┌──────────────┐
                    │  📐 Architect │ │ ⚖️ Lawyer │ │ 📊 Accountant│
                    │  (no deps)   │ │ (↑ arch) │ │  (↑ arch)    │
                    └──────┬───────┘ └────┬─────┘ └──────────────┘
                           │              │
                           ▼              │
                    ┌──────────────┐      │
                    │  💻 SDE      │      │
                    │  (↑ arch)    │      │
                    └──────┬───────┘      │
                           │              │
                           └──────┬───────┘
                                  ▼
                    ┌─────────────────────┐
                    │  🛡️ Auditor         │
                    │  (↑ sde, ↑ lawyer)  │
                    └─────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                  📦 DELIVERABLES                       │
                    │                                                        │
                    │   docs/architecture/ADR_system_design.md               │
                    │   docs/legal/legal_compliance_audit.md                 │
                    │   docs/audit/security_audit_report.md                  │
                    │   docs/financial/cost_and_budget_model.md              │
                    │   src/**  (generated source code & tests)              │
                    │   LICENSE                                              │
                    └─────────────────────────────────────────────────────────┘
```

### Step-by-Step Flow

| Step | Component | Action |
|:---:|:---|:---|
| **1** | User | Types a high-level engineering goal into the Mission Launchpad |
| **2** | Frontend | Sends `POST /api/runs` with `task_prompt` to the backend |
| **3** | Orchestrator | Calls the LLM to decompose the prompt into a DAG of agent nodes with explicit dependency edges |
| **4** | DAG Executor | Persists nodes to SQLite, broadcasts `DAG_CREATED` over WebSocket |
| **5** | DAG Executor | Walks the graph: finds nodes whose dependencies are all `completed`, runs them concurrently via `asyncio.gather` |
| **6** | Each Agent | Calls the LLM Gateway with its domain-specific system prompt, writes deliverables to disk |
| **7** | Event Manager | Streams `NODE_STARTED`, `AGENT_THOUGHT`, `AGENT_TOOL_CALL`, `NODE_COMPLETED` events in real-time over WebSocket |
| **8** | Frontend | Updates the DAG canvas node badges and live terminal log as events arrive |
| **9** | DAG Executor | Once all nodes complete (or fail), broadcasts `RUN_COMPLETED` and persists final status |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              POLYMAN PLATFORM                               │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         FRONTEND  (React + Vite)                       │ │
│  │                                                                         │ │
│  │  ┌──────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────────────┐ │ │
│  │  │  Navbar   │ │ DAGVisualizer │ │ LiveLogViewer │ │ WorkspaceExplorer│ │ │
│  │  │ (Tabs +   │ │ (Node Canvas  │ │ (Streaming    │ │ (File Tree +     │ │ │
│  │  │  Theme)   │ │  + Edges)     │ │  Terminal)    │ │  Code Viewer)    │ │ │
│  │  └──────────┘ └───────────────┘ └───────────────┘ └──────────────────┘ │ │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────────┐  │ │
│  │  │ AgentRoster      │ │ ReportsViewer    │ │ SettingsModal          │  │ │
│  │  │ (Cards + Custom  │ │ (Markdown Reader │ │ (API Keys, Models,     │  │ │
│  │  │  Agent Builder)  │ │  for Deliverables│ │  Workspace Config)     │  │ │
│  │  └──────────────────┘ └──────────────────┘ └────────────────────────┘  │ │
│  └──────────────────────────────────┬──────────────────────────────────────┘ │
│                                     │  HTTP REST + WebSocket                 │
│  ┌──────────────────────────────────┴──────────────────────────────────────┐ │
│  │                       BACKEND  (FastAPI + Uvicorn)                      │ │
│  │                                                                         │ │
│  │  ┌─────────┐    ┌──────────────────────────────────────────────────┐   │ │
│  │  │ API     │    │                 ENGINE                           │   │ │
│  │  │ Routes  │    │  ┌──────────────┐  ┌──────────┐  ┌───────────┐  │   │ │
│  │  │ ────────│───▶│  │ Orchestrator │─▶│   DAG    │─▶│   LLM     │  │   │ │
│  │  │ /runs   │    │  │  (Planner)   │  │ Executor │  │  Gateway  │  │   │ │
│  │  │ /agents │    │  └──────────────┘  └────┬─────┘  └─────┬─────┘  │   │ │
│  │  │ /project│    │                         │              │         │   │ │
│  │  │ /setting│    └─────────────────────────┼──────────────┼─────────┘   │ │
│  │  │ /health │                              │              │             │ │
│  │  └─────────┘                              │              │             │ │
│  │                                           ▼              ▼             │ │
│  │  ┌──────────────────┐   ┌──────────────────────────────────────────┐   │ │
│  │  │  AGENTS          │   │            EXTERNAL LLM APIs             │   │ │
│  │  │  ┌────────────┐  │   │  ┌────────┐ ┌─────────┐ ┌──────┐       │   │ │
│  │  │  │ Architect  │  │   │  │ Gemini │ │Anthropic│ │OpenAI│       │   │ │
│  │  │  │ SDE        │  │   │  └────────┘ └─────────┘ └──────┘       │   │ │
│  │  │  │ Lawyer     │  │   │  ┌────────────────┐                     │   │ │
│  │  │  │ Auditor    │  │   │  │ Ollama (Local) │                     │   │ │
│  │  │  │ Accountant │  │   │  └────────────────┘                     │   │ │
│  │  │  └────────────┘  │   │  ┌──────────────────────────────────┐   │   │ │
│  │  └──────────────────┘   │  │ Offline Domain Fallback Generator│   │   │ │
│  │                         │  └──────────────────────────────────┘   │   │ │
│  │  ┌──────────┐           └──────────────────────────────────────────┘   │ │
│  │  │  TOOLS   │           ┌──────────────────────────────────────────┐   │ │
│  │  │ fs_tools │           │        PERSISTENCE  (SQLite)             │   │ │
│  │  │ shell    │           │  ┌──────┐ ┌────────┐ ┌──────┐ ┌──────┐  │   │ │
│  │  │ git      │           │  │ runs │ │dag_node│ │ logs │ │agents│  │   │ │
│  │  │ doc      │           │  └──────┘ └────────┘ └──────┘ └──────┘  │   │ │
│  │  └──────────┘           └──────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Architecture Highlights

- **Monorepo with clear backend/frontend boundary** — no shared runtime coupling
- **Async-first Python backend** — all I/O (LLM calls, DB, filesystem, shell) is non-blocking via `asyncio`
- **WebSocket & Realtime event bus** — live terminal streams and DAG transitions powered by Supabase Realtime in production and local WebSocket in development
- **Supabase PostgreSQL & SQLite dual-mode** — zero-maintenance cloud database with live channel replication, with seamless local offline SQLite fallback
- **Graceful degradation** — if no API keys are configured, the built-in domain fallback generator produces realistic outputs for every agent role

---

## 🤖 The Agent Roster

Polyman ships with **6 built-in specialized subagents**, each with a focused domain, unique system prompt, default LLM provider, and toolchain:

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                                                                          │
 │   🧠 ORCHESTRATOR         📐 ARCHITECT           💻 SDE                 │
 │   ─────────────           ──────────             ────                    │
 │   Role: Chief Planner     Role: System Designer  Role: Software Engineer │
 │   LLM:  Gemini 2.0 Flash  LLM:  Gemini 2.0 Flash LLM: Claude 3.7 Sonnet│
 │   Tools: DAG Builder       Tools: File Writer     Tools: File R/W, Shell │
 │          Task Planner             Diagram Gen           Patch, Git       │
 │                                                                          │
 │   ⚖️ LAWYER               🛡️ AUDITOR              📊 ACCOUNTANT         │
 │   ─────────               ─────────              ─────────────          │
 │   Role: Legal Counsel     Role: Security Auditor  Role: FinOps Analyst  │
 │   LLM:  GPT-4o            LLM:  Gemini 2.0 Flash  LLM: GPT-4o-mini     │
 │   Tools: File Reader       Tools: File Reader      Tools: Cost Calculator│
 │          Doc Writer               Security Scanner         Doc Writer    │
 │          License Checker          Doc Writer                             │
 │                                                                          │
 └──────────────────────────────────────────────────────────────────────────┘
```

### Agent Details

| Agent | Default LLM | System Prompt Summary | Key Deliverables |
|:---|:---|:---|:---|
| 🧠 **Orchestrator** | Gemini 2.0 Flash | Analyzes requirements, identifies needed agents, generates DAG with dependency edges | Execution plan (JSON DAG) |
| 📐 **Architect** | Gemini 2.0 Flash | Decomposes into module boundaries, topologies, API contracts, directory layouts | `docs/architecture/ADR_system_design.md` |
| 💻 **SDE** | Claude 3.7 Sonnet | Writes production-ready code, test suites, implements core logic | Source files in `src/`, `tests/` |
| ⚖️ **Lawyer** | GPT-4o | Assesses OSS dependency risks, GDPR/CCPA, drafts license attribution | `docs/legal/legal_compliance_audit.md`, `LICENSE` |
| 🛡️ **Auditor** | Gemini 2.0 Flash | OWASP Top 10 sweep, secret detection, static analysis, quality gating | `docs/audit/security_audit_report.md` |
| 📊 **Accountant** | GPT-4o-mini | Models cloud FinOps (AWS/GCP/Vercel), API token budgets, unit economics | `docs/financial/cost_and_budget_model.md` |

### Agent Inheritance Model

Every agent extends the `BaseAgent` abstract class, which provides:

```
                       ┌──────────────────────────┐
                       │       BaseAgent           │
                       │──────────────────────────│
                       │ + role: str               │
                       │ + name: str               │
                       │ + system_prompt: str       │
                       │ + default_provider: str    │
                       │ + default_model: str       │
                       │──────────────────────────│
                       │ + log_event()             │
                       │   → WebSocket broadcast   │
                       │   → SQLite persist         │
                       │ + execute_node() [abstract]│
                       └────────────┬─────────────┘
                                    │
              ┌─────────┬───────────┼──────────┬──────────┐
              │         │           │          │          │
              ▼         ▼           ▼          ▼          ▼
        ┌──────────┐ ┌──────┐ ┌────────┐ ┌─────────┐ ┌──────────┐
        │ Architect│ │ SDE  │ │ Lawyer │ │ Auditor │ │Accountant│
        └──────────┘ └──────┘ └────────┘ └─────────┘ └──────────┘
```

Each agent's `execute_node()` method follows the same pattern:

1. **Log a thought** — broadcasts "Analyzing..." to the WebSocket stream
2. **Construct a domain-specific prompt** — injects context from upstream agents
3. **Call the LLM Gateway** — using the agent's configured provider/model
4. **Write deliverables** — saves reports via `doc_tools` or source code via `fs_tools`
5. **Return a status object** — `{ status: "completed", summary: "...", ... }`

### Custom Agent Builder

Beyond the 6 built-in agents, Polyman includes an interactive **Custom Agent Builder UI** to provision bespoke domain agents (DevOps, QA, Marketing, Tax, etc.) on demand. Custom agents are persisted to the `custom_agents` SQLite table and are available for future DAG executions.

---

## ⚡ DAG Execution Engine

The DAG Executor is the heart of Polyman's autonomous pipeline. It implements a **topological parallel execution strategy**:

```
                ┌─────────────────────────────────────────────┐
                │              DAG EXECUTOR LOOP               │
                └───────────────────┬─────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   Build node_map {}   │
                        │   completed = ∅       │
                        │   failed = ∅          │
                        └───────────┬───────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │  while |completed|+|failed|   │◄──────────────────┐
                    │        < |nodes|              │                   │
                    └───────────────┬───────────────┘                   │
                                    │                                   │
                         ┌──────────▼──────────┐                        │
                         │   Check cancelled?  │──Yes──▶ EXIT           │
                         └──────────┬──────────┘                        │
                                    │ No                                │
                         ┌──────────▼──────────┐                        │
                         │   Check paused?     │──Yes──▶ sleep(0.5)─────┤
                         └──────────┬──────────┘                        │
                                    │ No                                │
                    ┌───────────────▼───────────────┐                   │
                    │  Find READY nodes:            │                   │
                    │  status == "pending" AND       │                   │
                    │  all deps ∈ completed          │                   │
                    └───────────────┬───────────────┘                   │
                                    │                                   │
                         ┌──────────▼──────────┐                        │
                         │ ready_nodes empty?  │──Yes──▶ DEADLOCK       │
                         │                     │        mark pending    │
                         │                     │        as "skipped"    │
                         └──────────┬──────────┘                        │
                                    │ No                                │
                    ┌───────────────▼───────────────┐                   │
                    │  asyncio.gather(              │                   │
                    │    execute_single_node(n)      │                   │
                    │    for n in ready_nodes        │                   │
                    │  )                             │                   │
                    └───────────────┬───────────────┘                   │
                                    │                                   │
                    ┌───────────────▼───────────────┐                   │
                    │  Update completed / failed    │                   │
                    │  Broadcast DAG_PROGRESS       │───────────────────┘
                    └───────────────────────────────┘
```

### Key Features

| Feature | Implementation |
|:---|:---|
| **Parallel Execution** | Independent nodes (no shared dependencies) run concurrently via `asyncio.gather` |
| **Dependency Honoring** | A node only becomes "ready" when *all* upstream dependencies are in `completed` |
| **Pause / Resume / Cancel** | Boolean flags checked each loop iteration; controllable via REST API |
| **Deadlock Detection** | If no nodes are ready but some remain pending, they are marked `skipped` |
| **Status Broadcasting** | Each state transition emits a WebSocket event (`NODE_STARTED`, `NODE_COMPLETED`, `NODE_FAILED`) |
| **Persistent State** | Every node status change is written to SQLite with timestamps |

### Node Lifecycle

```
    ┌─────────┐   deps met   ┌─────────┐   agent done   ┌───────────┐
    │ PENDING │─────────────▶│ RUNNING │───────────────▶│ COMPLETED │
    └─────────┘              └─────────┘                └───────────┘
         │                        │
         │ deadlock               │ exception
         ▼                        ▼
    ┌─────────┐              ┌─────────┐
    │ SKIPPED │              │ FAILED  │
    └─────────┘              └─────────┘
```

---

## 🌐 LLM Gateway & Multi-Provider Support

The `LLMGateway` class provides a unified interface to **4 LLM providers** with automatic fallback:

```
          ┌────────────────────┐
          │   LLM Gateway      │
          │  generate_response()│
          └─────────┬──────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
        ▼           ▼           ▼              ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │  Gemini  │ │ Anthropic│ │  OpenAI  │ │    Ollama    │
  │ API v1β  │ │ Messages │ │  Chat    │ │  (Local)     │
  │          │ │  API     │ │ Complete │ │  :11434      │
  └──────────┘ └──────────┘ └──────────┘ └──────────────┘
        │           │           │              │
        └───────────┴───────────┴──────┬───────┘
                                       │ all fail / no keys
                                       ▼
                              ┌──────────────────┐
                              │  DOMAIN FALLBACK  │
                              │  GENERATOR        │
                              │                   │
                              │  • Orchestrator → │
                              │    Realistic DAG  │
                              │  • Architect →    │
                              │    Full ADR       │
                              │  • SDE →          │
                              │    Real code      │
                              │  • Lawyer →       │
                              │    Legal report   │
                              │  • Auditor →      │
                              │    OWASP report   │
                              │  • Accountant →   │
                              │    FinOps model   │
                              └──────────────────┘
```

### Provider Configuration

| Provider | API Endpoint | Auth | Models |
|:---|:---|:---|:---|
| **Google Gemini** | `generativelanguage.googleapis.com/v1beta` | API Key query param | `gemini-2.0-flash`, `gemini-pro` |
| **Anthropic Claude** | `api.anthropic.com/v1/messages` | `x-api-key` header | `claude-3-7-sonnet`, `claude-3-5-haiku` |
| **OpenAI** | `api.openai.com/v1/chat/completions` | Bearer token | `gpt-4o`, `gpt-4o-mini` |
| **Ollama (Local)** | `localhost:11434/api/chat` | None | Any local model |

### Offline Fallback Generator

> **Zero API keys? No problem.** Polyman includes an intelligent **domain-aware fallback generator** that detects the requesting agent's role from its system prompt and synthesizes realistic, context-aware outputs — including proper JSON DAG structures, full Architecture Decision Records, working source code, legal compliance reports, OWASP audit reports, and detailed FinOps cost models.

This means the platform is **fully testable and demonstrable out of the box** with no API costs.

---

## 🔧 Tool System

Agents interact with the local workspace through a sandboxed tool layer:

```
┌────────────────────────────────────────────────────────────────────┐
│                         TOOL SYSTEM                                │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │   fs_tools.py    │  │  shell_tools.py  │  │  git_tools.py   │  │
│  │                  │  │                  │  │                 │  │
│  │  read_file()     │  │ run_shell_cmd()  │  │ get_git_status()│  │
│  │  write_file()    │  │  • async exec    │  │ get_git_diff()  │  │
│  │  patch_file()    │  │  • timeout guard │  │ git_commit()    │  │
│  │  list_files()    │  │  • sandboxed cwd │  │                 │  │
│  │  search_text()   │  │                  │  │                 │  │
│  │                  │  │                  │  │                 │  │
│  │  🔒 Path Safety: │  └──────────────────┘  └─────────────────┘  │
│  │  resolve_safe_   │                                              │
│  │  path() prevents │  ┌──────────────────┐                        │
│  │  directory        │  │  doc_tools.py    │                        │
│  │  traversal via    │  │                  │                        │
│  │  .relative_to()   │  │  save_report()   │                        │
│  │  validation       │  │  → docs/{cat}/   │                        │
│  │                  │  │    {filename}     │                        │
│  └──────────────────┘  └──────────────────┘                        │
└────────────────────────────────────────────────────────────────────┘
```

### Security Model

| Defense | Mechanism |
|:---|:---|
| **Path Traversal Prevention** | `resolve_safe_path()` resolves all paths with `.resolve()` and validates via `.relative_to()` — any `../` escape attempt raises `ValueError` |
| **Shell Command Sandboxing** | All commands run with `cwd` locked to the project path and a configurable timeout (default: 30s); timeout kills the subprocess |
| **Binary File Exclusion** | `search_text()` skips `.png`, `.jpg`, `.exe`, `.bin`, `.zip` extensions |
| **Ignored Directories** | `.git`, `node_modules`, `__pycache__`, `.venv`, `dist`, `build` are excluded from file listing and search |

---

## 📡 Real-Time Event Pipeline

Polyman streams every agent action to the frontend in real-time via a WebSocket event bus:

```
┌──────────┐                                        ┌──────────────┐
│  Agent   │──log_event("thought", "Analyzing...")──▶│              │
│ (Backend)│──log_event("tool_call", "Writing...")──▶│ EventManager │
│          │──log_event("output", "Created ADR")───▶│              │
└──────────┘                                        └──────┬───────┘
                                                           │
                               ┌───────────────────────────┤
                               │                           │
                               ▼                           ▼
                    ┌────────────────────┐     ┌────────────────────┐
                    │  SQLite            │     │  WebSocket         │
                    │  agent_logs table  │     │  Broadcast         │
                    │  (persistent)      │     │  (real-time)       │
                    └────────────────────┘     └──────────┬─────────┘
                                                         │
                                         ┌───────────────┤
                                         │               │
                                         ▼               ▼
                                  ┌────────────┐  ┌────────────┐
                                  │ Run-scoped │  │  Global    │
                                  │ listeners  │  │ listeners  │
                                  └────────────┘  └────────────┘
                                         │               │
                                         └───────┬───────┘
                                                 ▼
                                    ┌─────────────────────┐
                                    │   Frontend React     │
                                    │                      │
                                    │   • DAG node badges  │
                                    │     update live      │
                                    │   • Terminal streams  │
                                    │     agent thoughts   │
                                    │   • Progress bar     │
                                    │     updates          │
                                    └─────────────────────┘
```

### Event Types

| Event | Trigger | Payload |
|:---|:---|:---|
| `DAG_CREATED` | Orchestrator generates plan | `{ nodes[], summary }` |
| `RUN_STARTED` | DAG execution begins | `{ run_id, total_nodes }` |
| `NODE_STARTED` | Agent begins work | `{ node_id, agent_role, title }` |
| `AGENT_THOUGHT` | Agent reasoning step | `{ content, agent_name }` |
| `AGENT_TOOL_CALL` | Agent invokes a tool | `{ content: "Writing file: ..." }` |
| `AGENT_TOOL_RESULT` | Tool returns result | `{ content: "Successfully created ..." }` |
| `AGENT_OUTPUT` | Agent final output | `{ content: "Completed implementation" }` |
| `NODE_COMPLETED` | Node finishes successfully | `{ node_id, output }` |
| `NODE_FAILED` | Node encounters error | `{ node_id, error }` |
| `DAG_PROGRESS` | After each batch | `{ completed[], failed[], total }` |
| `RUN_COMPLETED` | All nodes done | `{ status, completed_nodes, failed_nodes }` |
| `RUN_PAUSED` | User pauses execution | `{ run_id }` |
| `RUN_RESUMED` | User resumes execution | `{ run_id }` |
| `RUN_CANCELLED` | User aborts execution | `{ run_id }` |

---

## 🎨 Frontend Dashboard

The React + TypeScript frontend provides a full-featured **enterprise dual-mode dashboard**:

### UI Tabs

```
 ┌───────────────────────────────────────────────────────────────────────────┐
 │  🔮 Polyman   │ Mission │ Workspace │ Reports │ Agents │  ⚙️ │ 🌓 │ 🟢  │
 └───────────────┴─────────┴───────────┴─────────┴────────┴─────┴────┴─────┘

 ┌─ MISSION TAB ──────────────────────────────────────────────────────────────┐
 │                                                                            │
 │  ┌─ Stats Banner ────────────────────────────────────────────────────────┐ │
 │  │ ⚡ 6 Active Agents │ 🧊 5 Pipeline Tasks │ ✅ 4/5 Done │ 📊 27 Events│ │
 │  └───────────────────────────────────────────────────────────────────────┘ │
 │                                                                            │
 │  ┌─ Mission Launchpad ──────────────────────────────────────────────────┐ │
 │  │  ✨ Autonomous Mission Launchpad                    [⏸ Pause] [⏹ Stop]│ │
 │  │  ┌────────────────────────────────────────────────────────────────┐  │ │
 │  │  │  "Build a secure microservice API..."           [🚀 Launch]  │  │ │
 │  │  └────────────────────────────────────────────────────────────────┘  │ │
 │  │  Curated Scenarios: [SaaS Micro...] [OWASP Audit] [FinOps] [ADR]   │ │
 │  │  Recent Executions: [Build a...] [Audit the...] [Design and...]     │ │
 │  └───────────────────────────────────────────────────────────────────────┘ │
 │                                                                            │
 │  ┌─ DAG Visualizer ────────────────────────────────────────────────────┐  │
 │  │                                                                      │  │
 │  │   ┌────────────┐    ┌────────────┐    ┌────────────┐                │  │
 │  │   │ 📐 Architect│───▶│ 💻 SDE     │───▶│ 🛡️ Auditor │                │  │
 │  │   │  ✅ Done    │    │  🔄 Running │    │  ⏳ Pending │                │  │
 │  │   └────────────┘    └────────────┘    └────────────┘                │  │
 │  │        │                                                             │  │
 │  │        ├─────────▶┌────────────┐                                     │  │
 │  │        │          │ ⚖️ Lawyer   │                                     │  │
 │  │        │          │  ✅ Done    │────────────────────────▶ (Auditor)  │  │
 │  │        │          └────────────┘                                     │  │
 │  │        │                                                             │  │
 │  │        └─────────▶┌────────────┐                                     │  │
 │  │                   │ 📊 Account │                                     │  │
 │  │                   │  ✅ Done    │                                     │  │
 │  │                   └────────────┘                                     │  │
 │  └──────────────────────────────────────────────────────────────────────┘  │
 │                                                                            │
 │  ┌─ Live Terminal ─────────────────────────────────────────────────────┐  │
 │  │  [All] [Thoughts] [Tool Calls] [Outputs]                            │  │
 │  │  ────────────────────────────────────────                            │  │
 │  │  🧠 architect  │ thought    │ Analyzing architecture requirements...│  │
 │  │  🧠 architect  │ output     │ ADR created at docs/architecture/... │  │
 │  │  💻 sde        │ thought    │ Reviewing task for code synthesis... │  │
 │  │  💻 sde        │ tool_call  │ Writing file: src/index.js (234 B)  │  │
 │  │  💻 sde        │ tool_result│ Successfully created src/index.js   │  │
 │  └──────────────────────────────────────────────────────────────────────┘  │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌─ WORKSPACE TAB ────────────────────────────────────────────────────────────┐
 │  File Tree Explorer  │  Source Code Viewer  │  Git Diff Inspector          │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌─ REPORTS TAB ──────────────────────────────────────────────────────────────┐
 │  Architecture ADRs  │  Legal Audits  │  Security Reports  │  FinOps Models │
 └────────────────────────────────────────────────────────────────────────────┘

 ┌─ AGENTS TAB ───────────────────────────────────────────────────────────────┐
 │  Built-in Agent Cards  │  Custom Agent Builder  │  Manage Agent Settings   │
 └────────────────────────────────────────────────────────────────────────────┘
```

### Theme System

Polyman supports **Light Mode** and **Dark Mode** with CSS custom property tokens:

| Token | Light | Dark |
|:---|:---|:---|
| `--bg-primary` | `#ffffff` | `#0f1117` |
| `--bg-secondary` | `#f8fafc` | `#161b22` |
| `--text-primary` | `#0f172a` | `#e2e8f0` |
| `--accent-primary` | `#7c3aed` | `#a78bfa` |
| `--border-color` | `#e2e8f0` | `#30363d` |
| `--accent-gradient` | `linear-gradient(135deg, #7c3aed, #2563eb)` | Same |

---

## 📂 Project Structure

```
polyman/
│
├── backend/                          # Python FastAPI server
│   ├── app/
│   │   ├── agents/                   # 🤖 Specialized subagent implementations
│   │   │   ├── __init__.py           #    Agent registry & get_agent_for_role()
│   │   │   ├── base.py              #    BaseAgent abstract class
│   │   │   ├── architect.py         #    📐 System Architect agent
│   │   │   ├── sde.py               #    💻 Software Engineer agent
│   │   │   ├── lawyer.py            #    ⚖️ Legal Counsel agent
│   │   │   ├── auditor.py           #    🛡️ Security Auditor agent
│   │   │   └── accountant.py        #    📊 Financial Accountant agent
│   │   │
│   │   ├── api/                      # 🌐 REST API routes
│   │   │   ├── runs.py              #    POST/GET runs, pause/resume/cancel, WebSocket
│   │   │   ├── agents.py            #    GET/POST agent roster, custom agent CRUD
│   │   │   ├── projects.py          #    Workspace file listing, file reading, git ops
│   │   │   └── settings.py          #    API key config, model assignment
│   │   │
│   │   ├── core/                     # ⚙️ Platform infrastructure
│   │   │   ├── config.py            #    Pydantic Settings (API keys, paths, models)
│   │   │   ├── database.py          #    SQLite schema init + builtin agent seeding
│   │   │   └── events.py            #    WebSocket EventManager (broadcast bus)
│   │   │
│   │   ├── engine/                   # 🚀 Execution engine
│   │   │   ├── orchestrator.py      #    Chief Orchestrator (task → DAG decomposition)
│   │   │   ├── dag.py               #    DAGExecutor (topological parallel runner)
│   │   │   └── llm.py               #    LLMGateway (multi-provider + fallback)
│   │   │
│   │   ├── models/                   # 📋 Data schemas
│   │   │   ├── agent.py             #    Pydantic models for agent CRUD
│   │   │   └── run.py               #    Pydantic models for run operations
│   │   │
│   │   └── tools/                    # 🔧 Sandboxed workspace tools
│   │       ├── fs_tools.py          #    File read/write/patch/list/search
│   │       ├── shell_tools.py       #    Async shell execution with timeout
│   │       ├── git_tools.py         #    Git status/diff/commit wrappers
│   │       └── doc_tools.py         #    Report persistence to docs/
│   │
│   ├── tests/                        # 🧪 Pytest test suite
│   ├── main.py                       #    FastAPI app entrypoint + CORS + lifespan
│   └── requirements.txt             #    Python dependencies
│
├── frontend/                         # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── dag/
│   │   │   │   └── DAGVisualizer.tsx    # Interactive DAG canvas with node badges & edges
│   │   │   ├── terminal/
│   │   │   │   └── LiveLogViewer.tsx    # Real-time streaming terminal with filters
│   │   │   ├── workspace/
│   │   │   │   └── WorkspaceExplorer.tsx # File tree + code viewer + git diff
│   │   │   ├── reports/
│   │   │   │   └── ReportsViewer.tsx    # Markdown reader for agent deliverables
│   │   │   ├── agents/
│   │   │   │   └── AgentRoster.tsx      # Agent cards + custom agent builder
│   │   │   ├── settings/
│   │   │   │   └── SettingsModal.tsx    # API keys, provider config, workspace
│   │   │   └── layout/
│   │   │       └── Navbar.tsx           # Navigation tabs, theme toggle, status
│   │   │
│   │   ├── App.tsx                  # Master dashboard orchestrating all views
│   │   ├── App.css                  # Component-level styles
│   │   ├── index.css                # Global CSS tokens (light/dark themes)
│   │   ├── types.ts                 # TypeScript interfaces (Agent, DAGNode, Run, etc.)
│   │   └── main.tsx                 # React DOM mount
│   │
│   └── package.json                 # Frontend dependencies
│
├── docs/                             # 📄 Generated deliverables (by agents)
│   ├── architecture/                 #    ADR_system_design.md
│   ├── audit/                        #    security_audit_report.md
│   ├── financial/                    #    cost_and_budget_model.md
│   └── legal/                        #    legal_compliance_audit.md
│
├── src/                              # 📦 Agent-generated project source code
├── run.py                            # 🚀 Unified 1-command launcher
├── LICENSE                           # MIT License
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**

### 1-Command Launch

```bash
python run.py
```

This single command:
1. Starts the **FastAPI backend** on `http://127.0.0.1:8000` (with `--reload`)
2. Waits 2 seconds for server initialization
3. Starts the **Vite React frontend** on `http://localhost:5173`

### Manual Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (in separate terminal)
cd frontend
npm install
npm run dev
```

### Access Points

| Service | URL |
|:---|:---|
| **Frontend Dashboard** | [http://localhost:5173](http://localhost:5173) |
| **Backend API Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) |
| **Health Check** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) |
| **WebSocket Stream** | `ws://127.0.0.1:8000/api/runs/ws/{run_id}` |

---

## ⚙️ Configuration

### Environment Variables (Optional)

```bash
export GEMINI_API_KEY="your-gemini-key"
export ANTHROPIC_API_KEY="your-anthropic-key"
export OPENAI_API_KEY="your-openai-key"
export OLLAMA_BASE_URL="http://localhost:11434"   # default
```

### UI Settings Panel

API keys and model assignments can also be configured through the **Settings modal** in the frontend UI — changes are persisted to the SQLite database.

### Default Agent Model Assignments

```
┌──────────────┬────────────┬──────────────────┐
│    Agent     │  Provider  │      Model       │
├──────────────┼────────────┼──────────────────┤
│ Orchestrator │  Gemini    │ gemini-2.0-flash │
│ Architect    │  Gemini    │ gemini-2.0-flash │
│ SDE          │  Anthropic │ claude-3-7-sonnet│
│ Lawyer       │  OpenAI    │ gpt-4o           │
│ Auditor      │  Gemini    │ gemini-2.0-flash │
│ Accountant   │  OpenAI    │ gpt-4o-mini      │
└──────────────┴────────────┴──────────────────┘
```

> **No keys configured?** Polyman's built-in domain fallback generator produces realistic, context-aware outputs for every agent role — enabling full testing at zero cost.

---

## 📘 API Reference

### Runs

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/runs` | Start a new autonomous execution run |
| `GET` | `/api/runs` | List recent runs (query: `?limit=20`) |
| `GET` | `/api/runs/{run_id}` | Get full run details (nodes, logs, status) |
| `POST` | `/api/runs/{run_id}/pause` | Pause active execution |
| `POST` | `/api/runs/{run_id}/resume` | Resume paused execution |
| `POST` | `/api/runs/{run_id}/cancel` | Cancel/abort active execution |
| `WS` | `/api/runs/ws/{run_id}` | Real-time WebSocket event stream |

### Request: Start a Run

```json
{
  "task_prompt": "Build a secure REST API with JWT authentication and rate limiting",
  "project_path": "/optional/custom/path",
  "selected_agents": ["architect", "sde", "auditor"]
}
```

### Response: Run Created

```json
{
  "run_id": "run-a1b2c3d4",
  "status": "running",
  "summary": "Orchestrated 5-agent pipeline for 'Build a secure REST API...'",
  "nodes": [
    {
      "id": "run-a1b2c3d4-node-architect-1",
      "agent_role": "architect",
      "title": "System Architecture & API Design",
      "status": "pending",
      "dependencies": []
    }
  ]
}
```

### Agents

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/agents` | List all agents (built-in + custom) |
| `POST` | `/api/agents` | Create a custom agent |

### Projects

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/projects/files` | List workspace file tree |
| `GET` | `/api/projects/file?path=...` | Read file contents |
| `GET` | `/api/projects/git/status` | Git working tree status |
| `GET` | `/api/projects/git/diff` | Git diff output |

### Settings

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/settings` | Get current configuration |
| `PUT` | `/api/settings` | Update API keys / model assignments |

---

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

### Frontend Type Check & Build

```bash
cd frontend
npm install
npm run build
```

---

## 📊 Database Schema

Polyman persists all execution state in a local **SQLite** database (`backend/polyman.db`):

```
┌──────────────────────────────────────────────────────────────────┐
│                      SQLITE SCHEMA                               │
│                                                                  │
│  ┌──────────┐    1:N    ┌──────────┐    1:N    ┌─────────────┐  │
│  │ projects │◄─────────│   runs   │◄─────────│  dag_nodes  │  │
│  │──────────│          │──────────│          │─────────────│  │
│  │ id (PK)  │          │ id (PK)  │          │ id (PK)     │  │
│  │ name     │          │ project_id│         │ run_id (FK) │  │
│  │ path     │          │ task_prompt│         │ agent_role  │  │
│  │ desc     │          │ status    │          │ title       │  │
│  │ created  │          │ summary   │          │ status      │  │
│  └──────────┘          │ created_at│          │ dependencies│  │
│                        │ updated_at│          │ input_data  │  │
│                        └──────────┘          │ output_data │  │
│                             │                │ started_at  │  │
│                             │ 1:N            │ completed_at│  │
│                             ▼                └─────────────┘  │
│                        ┌────────────┐                          │
│                        │ agent_logs │                          │
│                        │────────────│                          │
│                        │ id (PK,AI) │   ┌──────────────────┐  │
│                        │ run_id (FK)│   │  custom_agents   │  │
│                        │ node_id    │   │──────────────────│  │
│                        │ agent_role │   │ id (PK)          │  │
│                        │ event_type │   │ role (UNIQUE)    │  │
│                        │ content    │   │ name, avatar     │  │
│                        │ created_at │   │ system_prompt    │  │
│                        └────────────┘   │ provider, model  │  │
│                                         │ tools (JSON)     │  │
│                                         │ is_builtin       │  │
│  ┌─────────────┐                        └──────────────────┘  │
│  │ app_settings│                                               │
│  │─────────────│                                               │
│  │ key (PK)    │                                               │
│  │ value       │                                               │
│  └─────────────┘                                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Deploy to Vercel & Supabase in 2 Minutes

Polyman is engineered for effortless serverless deployment on **Vercel** with **Supabase** managing PostgreSQL persistence and Realtime live streaming.

```
┌───────────────────────────┐         ┌───────────────────────────┐
│     Vercel Deployment     │         │      Supabase Cloud       │
│  ┌─────────────────────┐  │         │  ┌─────────────────────┐  │
│  │ React + Vite Static │  │         │  │ PostgreSQL Database │  │
│  │ Edge CDN Frontend   │  │         │  │ runs, nodes, logs   │  │
│  └──────────┬──────────┘  │         │  └──────────┬──────────┘  │
│             │             │         │             │             │
│  ┌──────────▼──────────┐  │ REST    │  ┌──────────▼──────────┐  │
│  │ Python Serverless   ├──┼─────────┼─►│ Supabase Realtime   │  │
│  │ FastAPI /api/*      │  │         │  │ WebSocket streaming │  │
│  └─────────────────────┘  │         │  └─────────────────────┘  │
└───────────────────────────┘         └───────────────────────────┘
```

### Step 1: Set Up Supabase (Free)
1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Open [`supabase/schema.sql`](supabase/schema.sql) in this repository, paste the SQL statements, and click **Run**.
   - This provisions all schema tables (`runs`, `dag_nodes`, `agent_logs`, `custom_agents`, `reports`, `app_settings`), seeds the 6 autonomous agents, and activates Realtime event streaming.
4. Go to **Project Settings → API** and copy your **Project URL**, **anon / public key**, and **service_role key**.

### Step 2: Deploy to Vercel
1. Fork or push this repository to your GitHub account.
2. In [vercel.com](https://vercel.com), click **"Add New..." → "Project"** and import your repository.
3. Add the following **Environment Variables** in the Vercel project settings:

| Variable | Required | Description |
|:---|:---|:---|
| `SUPABASE_URL` | **Yes** | Your Supabase Project URL (`https://<project-ref>.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase Service Role Key (used securely by the serverless backend) |
| `VITE_SUPABASE_URL` | **Yes** | Supabase Project URL (exposed to browser for Realtime event channels) |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase Anon Public Key (used by frontend browser client) |
| `GEMINI_API_KEY` | Recommended | Google Gemini API Key for Orchestrator, Architect, Auditor |
| `OPENAI_API_KEY` | Optional | OpenAI Key for Legal Counsel and Financial Accountant |
| `ANTHROPIC_API_KEY` | Optional | Anthropic Key for Software Engineer (SDE) |

4. Click **Deploy**!
   - Vercel automatically builds the frontend static bundle and configures `/api/*` serverless Python functions via [`vercel.json`](vercel.json) and [`api/index.py`](api/index.py).
   - Your live Polyman platform will be available at your custom `*.vercel.app` URL immediately.

---

## 🔒 Security Considerations

| Area | Implementation |
|:---|:---|
| **Path Traversal** | `resolve_safe_path()` validates all file operations stay within the project root |
| **Shell Injection** | Commands run via `asyncio.create_subprocess_shell` with `cwd` locked and configurable timeout |
| **API Key Storage** | Keys are stored in environment variables or in-memory; never logged or exposed in API responses |
| **CORS** | Configured for local development origins only |
| **Database** | Foreign key constraints enforced; parameterized queries prevent SQL injection |

---

## 📄 License

MIT License. Copyright (c) 2026 Polyman Contributors.

See [LICENSE](LICENSE) for the full license text.

---

<p align="center">
  <sub>Built with ❤️ by the Polyman team</sub>
  <br>
  <sub>Powered by Gemini · Claude · GPT-4o · Ollama</sub>
</p>
